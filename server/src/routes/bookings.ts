import { Router, Request, Response } from 'express';
import { query, queryOne, pool } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { z } from 'zod';
import { sendBookingConfirmation, sendCancellationNotice, sendWhatsAppMessage } from '../lib/whatsapp.js';
import { notifyAllUserDevices } from '../lib/apple-wallet.js';
import { upsertGoogleLoyaltyObject } from '../lib/google-wallet.js';
import {
    loadMembershipBuckets,
    recomputeClassesRemaining,
    reserveBucketInMemory,
    applyBucketDeductions,
    refundBucket,
    pickMembershipForClassTypes,
    CreditBucketError,
} from '../lib/membership-credits.js';
import { selectBucketForClassType } from '../lib/credit-buckets.js';
import { getSetting } from '../lib/settings.js';

const router = Router();

// Schema for Creating Booking
const CreateBookingSchema = z.object({
    classId: z.string().uuid(),
    membershipId: z.string().uuid().optional(), // Optional, if not provided we auto-select
});

// ============================================
// GET /api/bookings - List bookings (Admin)
// ============================================
router.get('/', authenticate, requireRole('admin', 'instructor'), async (req: Request, res: Response) => {
    try {
        const { status, search, startDate, endDate } = req.query;

        let queryStr = `
      SELECT 
        b.id as booking_id,
        b.status as booking_status,
        b.created_at,
        b.checked_in_at,
        b.waitlist_position,
        u.id as user_id,
        u.display_name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        c.id as class_id,
        c.date as class_date,
        c.start_time as class_start_time,
        c.end_time as class_end_time,
        ct.name as class_name,
        i.display_name as instructor_name,
        m.id as membership_id,
        p.name as plan_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN classes c ON b.class_id = c.id
      JOIN class_types ct ON c.class_type_id = ct.id
      JOIN instructors i ON c.instructor_id = i.id
      LEFT JOIN memberships m ON b.membership_id = m.id
      LEFT JOIN plans p ON m.plan_id = p.id
      WHERE 1=1
    `;

        const params: any[] = [];
        let paramCount = 1;

        if (status) {
            queryStr += ` AND b.status = $${paramCount++}`;
            params.push(status);
        }

        if (search) {
            queryStr += ` AND (
        u.display_name ILIKE $${paramCount} OR 
        u.email ILIKE $${paramCount} OR 
        ct.name ILIKE $${paramCount}
      )`;
            params.push(`%${search}%`);
            paramCount++;
        }

        if (startDate) {
            queryStr += ` AND c.date >= $${paramCount++}`;
            params.push(startDate);
        }

        if (endDate) {
            queryStr += ` AND c.date <= $${paramCount++}`;
            params.push(endDate);
        }

        queryStr += ` ORDER BY c.date DESC, c.start_time DESC`;

        const bookings = await query(queryStr, params);
        const formattedBookings = bookings.map((b: any) => ({
            ...b,
            class_date: b.class_date instanceof Date ? b.class_date.toISOString().split('T')[0] : b.class_date
        }));
        res.json(formattedBookings);
    } catch (error) {
        console.error('List bookings error:', error);
        res.status(500).json({ error: 'Error al listar reservas' });
    }
});

// Schema for Bulk Booking (Monthly) — Admin only
const BulkBookingSchema = z.object({
    scheduleId: z.string().uuid(),
    userId: z.string().uuid(),
    month: z.number().int().min(0).max(11),
    year: z.number().int().min(2024).max(2099),
    membershipId: z.string().uuid().optional(),
    selectedDates: z
        .array(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Formato YYYY-MM-DD'))
        .max(40)
        .optional(),
});

// ============================================
// POST /api/bookings/bulk-month - Create multiple bookings for a month (Admin)
// Allows admin to pick specific dates via selectedDates[]
// ============================================
router.post('/bulk-month', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
    const validation = BulkBookingSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: 'Datos inválidos', details: validation.error.flatten().fieldErrors });
    }

    const { scheduleId, userId, month, year, membershipId, selectedDates } = validation.data;

    const now = new Date();
    const startOfMonthDate = new Date(year, month, 1);
    const endOfMonthDate = new Date(year, month + 1, 0);

    let effectiveStart = startOfMonthDate;
    if (now.getMonth() === month && now.getFullYear() === year) {
        effectiveStart = now;
    } else if (endOfMonthDate < now) {
        return res.status(400).json({ error: 'El mes seleccionado ya ha pasado.' });
    } else if (startOfMonthDate < now) {
        effectiveStart = now;
    }

    const startDateStr = effectiveStart.toISOString().split('T')[0];
    const endDateStr = endOfMonthDate.toISOString().split('T')[0];

    // Fetch schedule details (read-only, fine outside tx)
    const schedule = await queryOne<any>(
        `SELECT * FROM schedules WHERE id = $1 AND is_active = true`,
        [scheduleId]
    );

    if (!schedule) {
        return res.status(404).json({ error: 'Horario no encontrado o inactivo.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Lock candidate classes FOR UPDATE to prevent overbooking races.
        // Match by class type + start time + day of week — schedule_id and instructor
        // are inconsistently populated on generated classes.
        const classSelectSql = `
            SELECT c.id, c.date, c.start_time, c.end_time,
                   c.max_capacity, c.current_bookings,
                   ct.name as class_type_name,
                   i.display_name as instructor_name
            FROM classes c
            JOIN class_types ct ON c.class_type_id = ct.id
            JOIN instructors i ON c.instructor_id = i.id
            WHERE c.class_type_id = $1
              AND SUBSTRING(c.start_time::text, 1, 5) = $2
              AND EXTRACT(DOW FROM c.date) = $3
              AND c.date >= $4 AND c.date <= $5
              AND c.status = 'scheduled'
              AND c.current_bookings < c.max_capacity
            ORDER BY c.date ASC
            FOR UPDATE OF c
        `;

        const classesResult = await client.query(classSelectSql, [
            schedule.class_type_id,
            String(schedule.start_time).substring(0, 5),
            schedule.day_of_week,
            startDateStr,
            endDateStr,
        ]);
        let classesToBook: any[] = classesResult.rows;

        if (classesToBook.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'No se encontraron clases programadas para este horario en el mes seleccionado.' });
        }

        if (selectedDates && selectedDates.length > 0) {
            const selectedSet = new Set(selectedDates.map(d => d.split('T')[0]));
            classesToBook = classesToBook.filter((c: any) => {
                const cDate = c.date instanceof Date
                    ? c.date.toISOString().split('T')[0]
                    : String(c.date).split('T')[0];
                return selectedSet.has(cDate);
            });

            if (classesToBook.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Ninguna de las fechas seleccionadas tiene clases disponibles.' });
            }
        }

        // Exclude classes already booked by the user (non-cancelled)
        const classIds = classesToBook.map((c: any) => c.id);
        const existingResult = await client.query(
            `SELECT class_id FROM bookings
             WHERE user_id = $1 AND status != 'cancelled' AND class_id = ANY($2::uuid[])`,
            [userId, classIds]
        );
        const existingClassIds = new Set(existingResult.rows.map((b: any) => b.class_id));
        const targetClasses = classesToBook.filter((c: any) => !existingClassIds.has(c.id));

        if (targetClasses.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El usuario ya tiene reservas para todas las clases seleccionadas.' });
        }

        // Pick membership (admin bulk: ignore end_date, admin owns scheduling).
        // classes_remaining IS NULL = unlimited → válido.
        // Prefer bounded memberships first (so "Inscripción anual" no se elige salvo
        // que sea la única opción), luego por end_date más próximo a vencer.
        let membership: any = null;
        if (membershipId) {
            const { rows } = await client.query(
                `SELECT * FROM memberships WHERE id = $1 AND user_id = $2 FOR UPDATE`,
                [membershipId, userId]
            );
            membership = rows[0] || null;
        } else {
            // Type-aware (FIX 1): fetch & lock all candidate active memberships in the
            // existing priority order (bounded before unlimited, then soonest end_date),
            // then prefer one whose buckets cover this schedule's class type. Legacy
            // memberships (no buckets) keep the generic classes_remaining behavior.
            const { rows } = await client.query(
                `SELECT * FROM memberships
                 WHERE user_id = $1 AND status = 'active'
                   AND (classes_remaining IS NULL OR classes_remaining >= $2)
                 ORDER BY
                   CASE WHEN classes_remaining IS NULL THEN 1 ELSE 0 END ASC,
                   end_date ASC NULLS LAST
                 FOR UPDATE`,
                [userId, targetClasses.length]
            );
            membership = await pickMembershipForClassTypes(client, rows, [String(schedule.class_type_id)]);
        }

        if (!membership) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No se encontró una membresía válida con suficientes créditos para las clases seleccionadas.' });
        }

        // Type-aware credit buckets are the source of truth when present.
        // Legacy fallback: if the membership has NO buckets, keep the old
        // generic classes_remaining behavior so old plans don't break.
        const mcBuckets = await loadMembershipBuckets(client, membership.id);
        const useBuckets = mcBuckets.length > 0;

        // Map of bucketId -> credits to deduct (only bounded buckets), plus the
        // bucket each booking consumed so cancel can refund the right one.
        const bucketDeductions = new Map<string, number>();
        const bookingBucketByClassId = new Map<string, string | null>();
        const classTypeId = String(schedule.class_type_id);
        const classTypeName = targetClasses[0]?.class_type_name ?? null;

        if (useBuckets) {
            // All classes in a bulk-month request share the schedule's class type.
            // Reserve in-memory per class so we can't over-spend a bounded bucket,
            // and reject the whole request (rollback) if any class has no bucket.
            for (const cls of targetClasses) {
                try {
                    const { bucketId, unlimited } = reserveBucketInMemory(mcBuckets, classTypeId, classTypeName);
                    bookingBucketByClassId.set(cls.id, bucketId);
                    if (!unlimited) {
                        bucketDeductions.set(bucketId, (bucketDeductions.get(bucketId) || 0) + 1);
                    }
                } catch (err) {
                    if (err instanceof CreditBucketError) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({ error: err.message });
                    }
                    throw err;
                }
            }
        } else {
            // Legacy: deduct generic credits up-front (bounded only).
            if (membership.classes_remaining !== null && membership.classes_remaining < targetClasses.length) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: `Membresía insuficiente. Se requieren ${targetClasses.length} créditos, tiene ${membership.classes_remaining}.`
                });
            }
            if (membership.classes_remaining !== null) {
                await client.query(
                    `UPDATE memberships SET classes_remaining = classes_remaining - $1 WHERE id = $2`,
                    [targetClasses.length, membership.id]
                );
            }
        }

        // Create bookings. The DB trigger update_class_booking_count auto-increments
        // classes.current_bookings, so we don't bump it manually here.
        const bookingIds: string[] = [];
        for (const cls of targetClasses) {
            const { rows } = await client.query(
                `INSERT INTO bookings (class_id, user_id, membership_id, status, credit_bucket_id)
                 VALUES ($1, $2, $3, 'confirmed', $4) RETURNING id`,
                [cls.id, userId, membership.id, bookingBucketByClassId.get(cls.id) ?? null]
            );
            bookingIds.push(rows[0].id);
        }

        if (useBuckets) {
            // Flush net per-bucket deductions, then keep classes_remaining as the
            // derived total (sum of bucket remainings, NULL if any unlimited).
            await applyBucketDeductions(client, bucketDeductions);
            await recomputeClassesRemaining(client, membership.id);
        }

        await client.query('COMMIT');

        // --- Side effects AFTER commit (failures here don't rollback reservations) ---
        const userInfo = await queryOne<{ phone: string; display_name: string }>(
            `SELECT phone, display_name FROM users WHERE id = $1`,
            [userId]
        );

        if (userInfo?.phone) {
            const classList = targetClasses.map((c: any) => {
                const d = c.date instanceof Date ? c.date : new Date(String(c.date).split('T')[0] + 'T12:00:00');
                const dateStr = d.toLocaleDateString('es-MX', {
                    weekday: 'long', day: 'numeric', month: 'long'
                });
                const timeStr = String(c.start_time).substring(0, 5);
                return `• ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} - ${timeStr} ${c.class_type_name}`;
            }).join('\n');

            const monthName = new Date(year, month, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
            const summary = `🗓️ *Clases programadas del mes*\n\n` +
                `Hola ${userInfo.display_name}!\n\n` +
                `Tus clases de ${monthName} han sido agendadas:\n\n` +
                `${classList}\n\n` +
                `Total: ${targetClasses.length} clase${targetClasses.length !== 1 ? 's' : ''}\n\n` +
                `¡Te esperamos! 🧘✨`;

            sendWhatsAppMessage(userInfo.phone, summary).catch(err =>
                console.error('Error sending bulk booking WhatsApp summary:', err)
            );
        }

        return res.json({
            success: true,
            bookedCount: bookingIds.length,
            message: `Se han agendado ${bookingIds.length} clase${bookingIds.length !== 1 ? 's' : ''} exitosamente.`,
        });
    } catch (error) {
        try { await client.query('ROLLBACK'); } catch { /* ignore */ }
        console.error('Bulk booking error:', error);
        return res.status(500).json({ error: 'Error al procesar reserva masiva' });
    } finally {
        client.release();
    }
});

// ============================================
// POST /api/bookings - Create a booking
// ============================================
router.post('/', authenticate, async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        const validation = CreateBookingSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Datos inválidos', details: validation.error.flatten().fieldErrors });
        }

        const { classId } = validation.data;
        let { membershipId } = validation.data;

        // 1. Get Class Details (check capacity)
        const classDetails = await queryOne(
            `SELECT * FROM classes WHERE id = $1`, [classId]
        );

        if (!classDetails) return res.status(404).json({ error: 'Clase no encontrada' });
        if (classDetails.status !== 'scheduled') return res.status(400).json({ error: 'Esta clase no esta disponible' });
        if (classDetails.current_bookings >= classDetails.max_capacity) {
            return res.status(400).json({ error: 'Clase llena' });
        }

        // Check if studio is closed on this date
        const classDateStr = classDetails.date instanceof Date
            ? classDetails.date.toISOString().split('T')[0]
            : String(classDetails.date).split('T')[0];
        const closedDay = await queryOne(
            `SELECT id, reason FROM studio_closed_days WHERE date = $1`,
            [classDateStr]
        );
        if (closedDay) {
            return res.status(400).json({
                error: `El estudio está cerrado este día: ${closedDay.reason || 'Día inhábil'}`
            });
        }

        // Check if class is in the past
        const now = new Date();
        // Format date properly - classDetails.date might be a Date object or string
        let dateStr: string;
        if (classDetails.date instanceof Date) {
            // Get local date parts to avoid UTC shift
            const d = classDetails.date;
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
        } else {
            // If it's already a string, take the date part
            dateStr = String(classDetails.date).split('T')[0];
        }

        const timeStr = classDetails.start_time.substring(0, 5); // HH:MM

        // Create class datetime in Mexico timezone (UTC-6)
        // The class time is stored in local Mexico time, so we need to compare properly
        // We construct an ISO string with the offset to ensure precise comparison
        const classDateTime = new Date(`${dateStr}T${timeStr}:00-06:00`);

        // Debug log
        console.log('Booking time check:', {
            now: now.toISOString(),
            classDate: dateStr,
            classTime: timeStr,
            classDateTime: classDateTime.toISOString(),
            isPast: classDateTime < now
        });

        if (isNaN(classDateTime.getTime())) {
            console.error('Invalid class date generated', { dateStr, timeStr });
            return res.status(500).json({ error: 'Error interno: Fecha de clase inválida' });
        }

        if (now >= classDateTime) {
            return res.status(400).json({
                error: 'No puedes reservar esta clase, el horario ya pasó.'
            });
        }

        // 2. Check for existing booking
        const existing = await queryOne(
            `SELECT id FROM bookings WHERE class_id = $1 AND user_id = $2 AND status != 'cancelled'`,
            [classId, userId]
        );
        if (existing) return res.status(400).json({ error: 'Ya tienes una reserva para esta clase' });

        if (!membershipId) {
            // Auto-select: Active, has remaining classes (or null=unlimited), not expired
            // We use the Mexico City date for comparison to avoid timezone shifts.
            // Type-aware (FIX 1): consider ALL eligible memberships in priority order
            // and prefer one whose credit buckets actually cover THIS class type, so a
            // user with multiple memberships isn't wrongly rejected when one membership's
            // bucket for the needed type is exhausted but another covers it.
            const activeMemberships = await query(
                `SELECT * FROM memberships
                 WHERE user_id = $1
                 AND status = 'active'
                 AND (end_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mazatlan')::date OR end_date IS NULL)
                 AND (classes_remaining > 0 OR classes_remaining IS NULL)
                 ORDER BY end_date ASC`,
                [userId]
            );

            if (activeMemberships.length === 0) {
                console.log('No active membership found for user:', userId);
                return res.status(403).json({ error: 'No tienes una membresía activa o créditos disponibles.' });
            }

            const autoSelectTypeId = String(classDetails.class_type_id);
            const chosen = await pickMembershipForClassTypes(pool, activeMemberships, [autoSelectTypeId]);
            if (!chosen) {
                // Every active membership exists but none has an eligible bucket for this type.
                return res.status(403).json({ error: 'No tienes una membresía activa o créditos disponibles.' });
            }
            membershipId = chosen.id;
        } else {
            // Validate provided membership
            const membership = await queryOne(
                `SELECT * FROM memberships WHERE id = $1 AND user_id = $2`,
                [membershipId, userId]
            );
            if (!membership) return res.status(403).json({ error: 'Membresía inválida' });
            if (membership.status !== 'active') return res.status(403).json({ error: 'Membresía no activa' });
            if (membership.classes_remaining !== null && membership.classes_remaining <= 0) {
                return res.status(403).json({ error: 'Sin créditos disponibles en esta membresía' });
            }
        }

        // membershipId is guaranteed resolved by both branches above.
        if (!membershipId) {
            return res.status(403).json({ error: 'No tienes una membresía activa o créditos disponibles.' });
        }
        const resolvedMembershipId: string = membershipId;

        // Class type (for bucket selection + clear rejection messages).
        const classTypeId = String(classDetails.class_type_id);
        const classTypeRow = await queryOne<{ name: string }>(
            `SELECT name FROM class_types WHERE id = $1`,
            [classTypeId]
        );
        const classTypeName = classTypeRow?.name ?? null;

        // 4. Create Booking & Deduct Credit — atomic, locks the membership row so
        // concurrent bookings can't over-spend a per-type bucket. Type-aware buckets
        // (membership_credits) are the source of truth; legacy memberships with no
        // buckets keep the generic classes_remaining behavior.
        const bookingClient = await pool.connect();
        let newBooking: any;
        try {
            await bookingClient.query('BEGIN');

            const { rows: memLock } = await bookingClient.query(
                `SELECT id, classes_remaining FROM memberships WHERE id = $1 FOR UPDATE`,
                [resolvedMembershipId]
            );
            const lockedMembership = memLock[0];
            if (!lockedMembership) {
                await bookingClient.query('ROLLBACK');
                return res.status(403).json({ error: 'Membresía inválida' });
            }

            const mcBuckets = await loadMembershipBuckets(bookingClient, resolvedMembershipId);
            const useBuckets = mcBuckets.length > 0;

            let creditBucketId: string | null = null;
            let bucketIsUnlimited = false;
            if (useBuckets) {
                try {
                    const { bucketId, unlimited } = reserveBucketInMemory(mcBuckets, classTypeId, classTypeName);
                    creditBucketId = bucketId;
                    bucketIsUnlimited = unlimited;
                } catch (err) {
                    if (err instanceof CreditBucketError) {
                        await bookingClient.query('ROLLBACK');
                        return res.status(400).json({ error: err.message });
                    }
                    throw err;
                }
            } else if (lockedMembership.classes_remaining !== null) {
                // Legacy generic credit — re-check under lock to avoid going negative.
                if (lockedMembership.classes_remaining <= 0) {
                    await bookingClient.query('ROLLBACK');
                    return res.status(403).json({ error: 'Sin créditos disponibles en esta membresía' });
                }
                await bookingClient.query(
                    `UPDATE memberships SET classes_remaining = classes_remaining - 1 WHERE id = $1`,
                    [resolvedMembershipId]
                );
            }

            // Insert booking (records which bucket it consumed, if any).
            const insertRes = await bookingClient.query(
                `INSERT INTO bookings (class_id, user_id, membership_id, status, credit_bucket_id)
                 VALUES ($1, $2, $3, 'confirmed', $4)
                 RETURNING *`,
                [classId, userId, resolvedMembershipId, creditBucketId]
            );
            newBooking = insertRes.rows[0];

            if (useBuckets && creditBucketId) {
                if (!bucketIsUnlimited) {
                    await applyBucketDeductions(bookingClient, new Map([[creditBucketId, 1]]));
                }
                await recomputeClassesRemaining(bookingClient, resolvedMembershipId);
            }

            await bookingClient.query('COMMIT');
        } catch (txErr) {
            try { await bookingClient.query('ROLLBACK'); } catch { /* ignore */ }
            throw txErr;
        } finally {
            bookingClient.release();
        }

        // Note: trigger_update_booking_count updates the classes table count automatically.

        // Send WhatsApp confirmation (async, don't block response)
        try {
            const notifSettings = await queryOne(
                "SELECT value FROM settings WHERE key = 'notification_settings'"
            );
            const shouldSend = notifSettings?.value?.send_booking_confirmation !== false;

            if (shouldSend) {
                const user = await queryOne('SELECT display_name, phone FROM users WHERE id = $1', [userId]);
                const classInfo = await queryOne(`
                    SELECT ct.name as class_name, c.date, c.start_time,
                           i.display_name as instructor_name
                    FROM classes c
                    JOIN class_types ct ON c.class_type_id = ct.id
                    JOIN instructors i ON c.instructor_id = i.id
                    WHERE c.id = $1
                `, [classId]);

                if (user?.phone && classInfo) {
                    const classDate = classInfo.date instanceof Date
                        ? classInfo.date.toLocaleDateString('es-MX')
                        : String(classInfo.date).split('T')[0];
                    const classTime = classInfo.start_time?.substring(0, 5);

                    sendBookingConfirmation(
                        user.phone,
                        user.display_name,
                        classInfo.class_name,
                        classDate,
                        classTime
                    ).catch(err => console.error('[WhatsApp] Error sending booking confirmation:', err));
                }
            }
        } catch (waErr) {
            console.error('[WhatsApp] Non-blocking error:', waErr);
        }

        // Update Apple + Google Wallet passes (credits changed)
        notifyAllUserDevices(userId, '✅ Reserva confirmada', 'Tu pase se actualizó con tu nueva reserva')
            .catch(e => console.error('Apple Wallet booking notify error:', e));
        if (membershipId) {
            upsertGoogleLoyaltyObject(membershipId).catch(e => console.error('Google Wallet booking error:', e));
        }

        res.status(201).json(newBooking);

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ error: 'Error al procesar reserva' });
    }
});

// ============================================
// POST /api/bookings/bulk - El cliente reserva varias clases de un jalón
// (su semana completa). Bloquea TODO si no le alcanzan los créditos.
// ============================================
const BulkClientBookingSchema = z.object({
    classIds: z.array(z.string().uuid()).min(1).max(40),
});

router.post('/bulk', authenticate, async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });

    const validation = BulkClientBookingSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: 'Datos inválidos', details: validation.error.flatten().fieldErrors });
    }
    // Dedupe ids
    const classIds = Array.from(new Set(validation.data.classIds));

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Traer y bloquear las clases candidatas
        const { rows: classes } = await client.query(
            `SELECT c.*, ct.name as class_type_name
             FROM classes c
             JOIN class_types ct ON ct.id = c.class_type_id
             WHERE c.id = ANY($1::uuid[])
             FOR UPDATE OF c`,
            [classIds]
        );

        const now = new Date();
        const skipped: Array<{ classId: string; reason: string }> = [];
        const bookable: any[] = [];

        // Días cerrados que toquen estas fechas
        const dateList = Array.from(new Set(classes.map((c: any) =>
            c.date instanceof Date ? c.date.toISOString().split('T')[0] : String(c.date).split('T')[0]
        )));
        const closedRows = dateList.length
            ? (await client.query(`SELECT date FROM studio_closed_days WHERE date = ANY($1::date[])`, [dateList])).rows
            : [];
        const closedSet = new Set(closedRows.map((r: any) =>
            r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0]
        ));

        // Reservas activas existentes del usuario para esas clases
        const { rows: existingRows } = await client.query(
            `SELECT class_id FROM bookings WHERE user_id = $1 AND status != 'cancelled' AND class_id = ANY($2::uuid[])`,
            [userId, classIds]
        );
        const alreadyBooked = new Set(existingRows.map((r: any) => r.class_id));

        for (const c of classes) {
            const dateStr = c.date instanceof Date ? c.date.toISOString().split('T')[0] : String(c.date).split('T')[0];
            if (c.status !== 'scheduled') { skipped.push({ classId: c.id, reason: 'No disponible' }); continue; }
            if (alreadyBooked.has(c.id)) { skipped.push({ classId: c.id, reason: 'Ya reservada' }); continue; }
            if (closedSet.has(dateStr)) { skipped.push({ classId: c.id, reason: 'Estudio cerrado' }); continue; }
            if (c.current_bookings >= c.max_capacity) { skipped.push({ classId: c.id, reason: 'Llena' }); continue; }
            const classDateTime = new Date(`${dateStr}T${String(c.start_time).substring(0, 5)}:00-06:00`);
            if (isNaN(classDateTime.getTime()) || now >= classDateTime) { skipped.push({ classId: c.id, reason: 'Ya pasó' }); continue; }
            bookable.push(c);
        }

        // ids no encontrados
        const foundIds = new Set(classes.map((c: any) => c.id));
        for (const id of classIds) {
            if (!foundIds.has(id)) skipped.push({ classId: id, reason: 'No encontrada' });
        }

        if (bookable.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Ninguna de las clases seleccionadas está disponible para reservar.', skipped });
        }

        // 2. Seleccionar membresía: activa, vigente, con créditos suficientes
        //    para TODAS las clases reservables. Excluye Inscripción (class_limit=0).
        //    Type-aware (FIX 1): las clases pueden ser de distintos TIPOS. Traemos y
        //    bloqueamos todas las candidatas en el orden de preferencia existente y
        //    preferimos una cuyos buckets cubran TODOS los tipos solicitados. Las
        //    membresías legacy (sin buckets) conservan el comportamiento genérico.
        const needed = bookable.length;
        const distinctTypeIds = Array.from(new Set(bookable.map((c) => String(c.class_type_id))));
        const { rows: memRows } = await client.query(
            `SELECT m.* FROM memberships m
             JOIN plans p ON p.id = m.plan_id
             WHERE m.user_id = $1
               AND m.status = 'active'
               AND (m.end_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mazatlan')::date OR m.end_date IS NULL)
               AND (p.class_limit IS NULL OR p.class_limit > 0)
               AND (m.classes_remaining IS NULL OR m.classes_remaining >= $2)
             ORDER BY
               CASE WHEN m.classes_remaining IS NULL THEN 1 ELSE 0 END ASC,
               m.end_date ASC NULLS LAST
             FOR UPDATE OF m`,
            [userId, needed]
        );
        const membership = await pickMembershipForClassTypes(client, memRows, distinctTypeIds);

        if (!membership) {
            await client.query('ROLLBACK');

            // FIX 2: if a candidate membership uses type-aware buckets, the rejection is
            // per-type (a specific class type is exhausted / not included), not a generic
            // total shortfall. Surface the type-specific CreditBucketError message instead
            // of the generic "necesitas N y tienes X" diagnostic, which would contradict
            // the per-type bucket logic (the generic total can be >= needed yet a type bucket
            // is empty). Pick the best-covered candidate to produce the clearest message.
            let bucketRejection: string | null = null;
            let bestCovered = -1;
            for (const cand of memRows) {
                const candBuckets = await loadMembershipBuckets(client, cand.id);
                if (candBuckets.length === 0) continue; // legacy candidate, no per-type info
                // Count how many distinct requested types this candidate covers, and capture
                // the first failing type's message from the most-covering candidate.
                let covered = 0;
                let firstError: string | null = null;
                for (const typeId of distinctTypeIds) {
                    const cls = bookable.find((c) => String(c.class_type_id) === typeId);
                    try {
                        reserveBucketInMemory(candBuckets, typeId, cls?.class_type_name);
                        covered++;
                    } catch (err) {
                        if (err instanceof CreditBucketError) {
                            if (!firstError) firstError = err.message;
                        } else {
                            throw err;
                        }
                    }
                }
                if (covered > bestCovered) {
                    bestCovered = covered;
                    bucketRejection = firstError;
                }
            }
            if (bucketRejection) {
                return res.status(400).json({ error: bucketRejection, skipped });
            }

            // Legacy (no buckets): ¿tiene alguna membresía válida pero sin créditos suficientes?
            const { rows: anyMem } = await client.query(
                `SELECT m.classes_remaining FROM memberships m
                 JOIN plans p ON p.id = m.plan_id
                 WHERE m.user_id = $1 AND m.status = 'active'
                   AND (p.class_limit IS NULL OR p.class_limit > 0)
                   AND (m.end_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mazatlan')::date OR m.end_date IS NULL)
                 ORDER BY m.classes_remaining DESC NULLS FIRST LIMIT 1`,
                [userId]
            );
            const have = anyMem[0]?.classes_remaining;
            if (anyMem.length > 0 && typeof have === 'number') {
                return res.status(400).json({
                    error: `No te alcanzan los créditos: necesitas ${needed} y tienes ${have}. Quita ${needed - have} clase${needed - have !== 1 ? 's' : ''} o compra un paquete mayor.`,
                    needed, available: have, skipped,
                });
            }
            return res.status(403).json({ error: 'No tienes una membresía activa con créditos disponibles para reservar.', skipped });
        }

        // 3. Asignar bucket de crédito por clase (paquetes con créditos por tipo).
        //    Fuente de verdad = membership_credits. Si la membresía NO tiene buckets,
        //    se conserva el comportamiento legacy (classes_remaining genérico).
        const mcBuckets = await loadMembershipBuckets(client, membership.id);
        const useBuckets = mcBuckets.length > 0;

        const bucketDeductions = new Map<string, number>();
        const bookingBucketByClassId = new Map<string, string | null>();

        if (useBuckets) {
            // Las clases pueden ser de TIPOS distintos. Reservamos en memoria, en
            // orden, descontando el snapshot para no gastar dos veces un bucket con
            // un solo crédito. Si CUALQUIER clase no tiene bucket elegible, se
            // rechaza TODO (rollback) sin descuentos parciales.
            for (const c of bookable) {
                try {
                    const { bucketId, unlimited } = reserveBucketInMemory(
                        mcBuckets,
                        String(c.class_type_id),
                        c.class_type_name
                    );
                    bookingBucketByClassId.set(c.id, bucketId);
                    if (!unlimited) {
                        bucketDeductions.set(bucketId, (bucketDeductions.get(bucketId) || 0) + 1);
                    }
                } catch (err) {
                    if (err instanceof CreditBucketError) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({ error: err.message, skipped });
                    }
                    throw err;
                }
            }
        }

        // 4. Crear las reservas. El trigger update_class_booking_count sube current_bookings.
        const bookedIds: string[] = [];
        for (const c of bookable) {
            const { rows } = await client.query(
                `INSERT INTO bookings (class_id, user_id, membership_id, status, credit_bucket_id)
                 VALUES ($1, $2, $3, 'confirmed', $4) RETURNING id`,
                [c.id, userId, membership.id, bookingBucketByClassId.get(c.id) ?? null]
            );
            bookedIds.push(rows[0].id);
        }

        // 5. Descontar créditos.
        let finalClassesRemaining: number | null;
        if (useBuckets) {
            await applyBucketDeductions(client, bucketDeductions);
            await recomputeClassesRemaining(client, membership.id);
            const { rows: cr } = await client.query(
                `SELECT classes_remaining FROM memberships WHERE id = $1`,
                [membership.id]
            );
            finalClassesRemaining = cr[0]?.classes_remaining ?? null;
        } else if (membership.classes_remaining !== null) {
            // Legacy: descuento genérico (solo si el plan es acotado).
            await client.query(
                `UPDATE memberships SET classes_remaining = classes_remaining - $1 WHERE id = $2`,
                [bookable.length, membership.id]
            );
            finalClassesRemaining = membership.classes_remaining - bookable.length;
        } else {
            finalClassesRemaining = null;
        }

        await client.query('COMMIT');

        // Side-effects post-commit: wallet + WhatsApp resumen
        notifyAllUserDevices(userId, '✅ Reservas confirmadas', `Reservaste ${bookedIds.length} clases`)
            .catch(e => console.error('Apple Wallet bulk notify error:', e));
        upsertGoogleLoyaltyObject(membership.id).catch(e => console.error('Google Wallet bulk error:', e));

        try {
            const userInfo = await queryOne<{ phone: string; display_name: string }>(
                `SELECT phone, display_name FROM users WHERE id = $1`, [userId]
            );
            if (userInfo?.phone) {
                const list = bookable
                    .slice()
                    .sort((a, b) => {
                        const da = (a.date instanceof Date ? a.date.toISOString().split('T')[0] : String(a.date).split('T')[0]) + a.start_time;
                        const db = (b.date instanceof Date ? b.date.toISOString().split('T')[0] : String(b.date).split('T')[0]) + b.start_time;
                        return da.localeCompare(db);
                    })
                    .map((c) => {
                        const d = c.date instanceof Date ? c.date : new Date(String(c.date).split('T')[0] + 'T12:00:00');
                        const dateStr = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
                        return `• ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} - ${String(c.start_time).substring(0, 5)} ${c.class_type_name}`;
                    }).join('\n');
                const msg = `🗓️ *Reservas confirmadas*\n\n` +
                    `Hola ${userInfo.display_name}!\n\n` +
                    `Reservaste ${bookedIds.length} clase${bookedIds.length !== 1 ? 's' : ''}:\n\n${list}\n\n` +
                    `¡Te esperamos! 🧘✨`;
                sendWhatsAppMessage(userInfo.phone, msg).catch(err =>
                    console.error('Error sending bulk client booking WhatsApp:', err));
            }
        } catch (waErr) {
            console.error('[WhatsApp] bulk client non-blocking error:', waErr);
        }

        return res.status(201).json({
            success: true,
            bookedCount: bookedIds.length,
            skipped,
            classesRemaining: finalClassesRemaining,
            message: `Reservaste ${bookedIds.length} clase${bookedIds.length !== 1 ? 's' : ''} exitosamente.`,
        });
    } catch (error) {
        try { await client.query('ROLLBACK'); } catch { /* ignore */ }
        console.error('Bulk client booking error:', error);
        return res.status(500).json({ error: 'Error al procesar las reservas' });
    } finally {
        client.release();
    }
});

// ============================================
// GET /api/bookings/my-bookings - List user's bookings
// ============================================
router.get('/my-bookings', authenticate, async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    try {
        const bookings = await query(
            `SELECT * FROM user_bookings_view WHERE user_id = $1`,
            [userId]
        );

        const formattedBookings = bookings.map((b: any) => ({
            ...b,
            class_date: b.class_date instanceof Date ? b.class_date.toISOString().split('T')[0] : b.class_date,
            date: b.date instanceof Date ? b.date.toISOString().split('T')[0] : b.date // Handle potential alias
        }));

        res.json(formattedBookings);
    } catch (error) {
        console.error('My bookings error:', error);
        res.status(500).json({ error: 'Error al obtener reservas' });
    }
});

// ============================================
// GET /api/bookings/:id - Booking detail
// ============================================
router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const isAdmin = req.user?.role === 'admin' || req.user?.role === 'instructor';

        const booking = await queryOne(
            `SELECT 
        b.id as booking_id,
        b.status as booking_status,
        b.created_at,
        b.checked_in_at,
        b.waitlist_position,
        b.membership_id,
        u.id as user_id,
        u.display_name as user_name,
        u.email as user_email,
        c.id as class_id,
        c.date as class_date,
        c.start_time as class_start_time,
        c.end_time as class_end_time,
        ct.name as class_name,
        ct.color as class_type_color,
        i.display_name as instructor_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN classes c ON b.class_id = c.id
      JOIN class_types ct ON c.class_type_id = ct.id
      JOIN instructors i ON c.instructor_id = i.id
      WHERE b.id = $1`,
            [id]
        );

        if (!booking) {
            return res.status(404).json({ error: 'Reserva no encontrada' });
        }

        if (!isAdmin && booking.user_id !== userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Strip sensitive fields for non-admin users
        const response: any = {
            ...booking,
            class_date: booking.class_date instanceof Date ? booking.class_date.toISOString().split('T')[0] : booking.class_date
        };
        if (!isAdmin) {
            delete response.user_email;
        }

        res.json(response);
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({ error: 'Error al obtener reserva' });
    }
});

// ============================================
// GET /api/bookings/:id/cancel-preview - Preview cancellation outcome
// ============================================
router.get('/:id/cancel-preview', authenticate, async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const bookingId = req.params.id;

    try {
        const booking = await queryOne(
            `SELECT * FROM bookings WHERE id = $1`,
            [bookingId]
        );

        if (!booking) return res.status(404).json({ error: 'Reserva no encontrada' });

        const isAdmin = req.user?.role === 'admin';
        if (!isAdmin && booking.user_id !== userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ error: 'La reserva ya estaba cancelada' });
        }

        const classInfo = await queryOne(
            `SELECT date, start_time FROM classes WHERE id = $1`,
            [booking.class_id]
        );

        const now = new Date();
        const dateStr = classInfo.date instanceof Date
            ? classInfo.date.toISOString().split('T')[0]
            : classInfo.date;
        const timeStr = classInfo.start_time.substring(0, 5);
        // DB stores local Mexico City times, append offset
        const classDateTime = new Date(`${dateStr}T${timeStr}:00-06:00`);
        const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        const bookingPolicies = await getSetting('booking_policies');
        const CANCELLATION_WINDOW_HOURS = bookingPolicies.cancellation_hours;
        const isWithinWindow = hoursUntilClass >= CANCELLATION_WINDOW_HOURS;

        let willRefund = false;
        let cancellationsUsed = 0;
        let cancellationLimit = 2;
        let reason = '';

        if (isAdmin) {
            // Admin respeta las mismas reglas que el cliente: ventana configurable
            // y limite de cancelaciones. La cancelacion siempre se ejecuta,
            // pero solo se reembolsa si ambas condiciones se cumplen.
            if (!isWithinWindow) {
                willRefund = false;
                reason = `Faltan menos de ${CANCELLATION_WINDOW_HOURS}h para la clase. No se reembolsará el crédito.`;
            } else if (booking.membership_id) {
                const membership = await queryOne<{
                    cancellations_used: number | null;
                    cancellation_limit: number | null;
                }>(
                    `SELECT cancellations_used, cancellation_limit FROM memberships WHERE id = $1`,
                    [booking.membership_id]
                );
                cancellationsUsed = membership?.cancellations_used || 0;
                cancellationLimit = membership?.cancellation_limit || 2;
                if (cancellationsUsed < cancellationLimit) {
                    willRefund = true;
                    reason = `Admin: se reembolsará el crédito. Cancelaciones: ${cancellationsUsed + 1}/${cancellationLimit}.`;
                } else {
                    willRefund = false;
                    reason = `El cliente ya excedió su límite de cancelaciones (${cancellationsUsed}/${cancellationLimit}). No se reembolsará el crédito.`;
                }
            } else {
                willRefund = true;
                reason = 'Admin: se reembolsará el crédito.';
            }
        } else if (!isWithinWindow) {
            willRefund = false;
            reason = `Faltan menos de ${CANCELLATION_WINDOW_HOURS} horas para la clase. No se reembolsará el crédito.`;
        } else if (booking.membership_id) {
            const membership = await queryOne(
                `SELECT cancellations_used, cancellation_limit FROM memberships WHERE id = $1`,
                [booking.membership_id]
            );
            if (membership) {
                cancellationsUsed = membership.cancellations_used || 0;
                cancellationLimit = membership.cancellation_limit || 2;
                if (cancellationsUsed < cancellationLimit) {
                    willRefund = true;
                    reason = 'Se reembolsará tu crédito.';
                } else {
                    willRefund = false;
                    reason = `Ya usaste tus ${cancellationLimit} cancelaciones con reembolso. No se reembolsará el crédito.`;
                }
            } else {
                willRefund = true;
                reason = 'Se reembolsará tu crédito.';
            }
        } else {
            willRefund = true;
            reason = 'Se reembolsará tu crédito.';
        }

        res.json({
            willRefund,
            hoursUntilClass: Math.round(hoursUntilClass * 10) / 10,
            cancellationsUsed,
            cancellationLimit,
            isWithinWindow,
            reason,
        });
    } catch (error) {
        console.error('Cancel preview error:', error);
        res.status(500).json({ error: 'Error al obtener vista previa de cancelación' });
    }
});

// ============================================
// POST /api/bookings/:id/cancel - Cancel booking
// ============================================
router.post('/:id/cancel', authenticate, async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const bookingId = req.params.id;

    try {
        const booking = await queryOne(
            `SELECT * FROM bookings WHERE id = $1`,
            [bookingId]
        );

        if (!booking) return res.status(404).json({ error: 'Reserva no encontrada' });

        // Admin can cancel any, User can only cancel own
        const isAdmin = req.user?.role === 'admin';
        if (!isAdmin && booking.user_id !== userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ error: 'La reserva ya estaba cancelada' });
        }

        // Get class info to check cancellation window
        const classInfo = await queryOne(
            `SELECT date, start_time FROM classes WHERE id = $1`,
            [booking.class_id]
        );

        // Logic for refunding credit - check cancellation policy time window
        // Use Mexico City time for comparison since DB stores local times
        const now = new Date();
        const dateStr = classInfo.date instanceof Date
            ? classInfo.date.toISOString().split('T')[0]
            : classInfo.date;
        const timeStr = classInfo.start_time.substring(0, 5);

        // Construct class datetime in Mexico City timezone
        // DB stores local Mexico City times, so we append the offset
        const classDateTime = new Date(`${dateStr}T${timeStr}:00-06:00`);

        // Calculate hours until class
        const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Cancellation policy: configurable minimum notice (default 12h)
        const cancelPolicies = await getSetting('booking_policies');
        const CANCELLATION_WINDOW_HOURS = cancelPolicies.cancellation_hours;
        const isWithinWindow = hoursUntilClass >= CANCELLATION_WINDOW_HOURS;

        // Non-admin users cannot cancel within the cutoff window
        if (!isAdmin && !isWithinWindow) {
            return res.status(400).json({
                error: `Solo puedes cancelar con al menos ${CANCELLATION_WINDOW_HOURS} horas de anticipación.`,
            });
        }

        let shouldRefund = false;
        let refundReason = '';
        let cancellationsUsed = 0;
        let cancellationLimit = 2; // Default

        // FIX 3: the core cancel mutation — refund (bucket or legacy generic),
        // cancellations_used increment, and the booking-status UPDATE — must be
        // atomic so a mid-way failure can't leave a refunded credit without a
        // cancelled booking (or vice versa). Wrap them in one transaction and pass
        // the tx client (`cancelClient`) to refundBucket/recomputeClassesRemaining
        // (they accept any { query }). Membership reads are done inside the tx too.
        // NOTE: waitlist promotion below is intentionally NOT part of this tx — it has
        // its own error isolation and must not roll back a successful cancel (see concern).
        const cancelClient = await pool.connect();
        let cancelled: any;
        try {
            await cancelClient.query('BEGIN');

            if (isAdmin) {
                // Admin cancela: respeta las MISMAS reglas que el cliente:
                //   1) Debe estar dentro de la ventana configurable para reembolsar.
                //   2) cancellations_used debe ser < cancellation_limit.
                // Siempre consume una cancelacion (incrementa cancellations_used)
                // mientras este dentro de la ventana, para reflejar el uso real.
                refundReason = 'Cancelada por admin';
                if (!isWithinWindow) {
                    shouldRefund = false;
                    refundReason = `Cancelada por admin — fuera de tiempo (menos de ${CANCELLATION_WINDOW_HOURS}h)`;
                } else if (booking.membership_id) {
                    const { rows: memRows } = await cancelClient.query(
                        `SELECT cancellations_used, cancellation_limit, classes_remaining
                         FROM memberships WHERE id = $1`,
                        [booking.membership_id]
                    );
                    const membership = memRows[0];
                    if (membership) {
                        cancellationsUsed = membership.cancellations_used || 0;
                        cancellationLimit = membership.cancellation_limit || 2;
                        if (cancellationsUsed < cancellationLimit) {
                            shouldRefund = true;
                            if (booking.credit_bucket_id) {
                                // Type-aware: refund the exact bucket this booking consumed,
                                // then recompute the derived classes_remaining total.
                                await refundBucket(cancelClient, booking.credit_bucket_id);
                                await recomputeClassesRemaining(cancelClient, booking.membership_id);
                            } else if (membership.classes_remaining !== null) {
                                // Legacy booking (no bucket recorded) → generic refund.
                                await cancelClient.query(
                                    `UPDATE memberships SET classes_remaining = classes_remaining + 1 WHERE id = $1`,
                                    [booking.membership_id]
                                );
                            }
                        } else {
                            shouldRefund = false;
                            refundReason = `Cancelada por admin — límite de cancelaciones excedido (${cancellationsUsed}/${cancellationLimit})`;
                        }
                        await cancelClient.query(
                            `UPDATE memberships SET cancellations_used = cancellations_used + 1 WHERE id = $1`,
                            [booking.membership_id]
                        );
                    } else {
                        shouldRefund = true;
                    }
                } else {
                    shouldRefund = true;
                }
            } else {
                // Non-admin: already rejected above if outside window, so we are within window here.
                // Check cancellation limits if it's a membership booking
                if (booking.membership_id) {
                    const { rows: memRows } = await cancelClient.query(
                        `SELECT id, cancellations_used, cancellation_limit, classes_remaining
                         FROM memberships WHERE id = $1`,
                        [booking.membership_id]
                    );
                    const membership = memRows[0];

                    if (membership) {
                        cancellationsUsed = membership.cancellations_used || 0;
                        cancellationLimit = membership.cancellation_limit || 2;

                        if (cancellationsUsed < cancellationLimit) {
                            shouldRefund = true;
                            // Increment cancellation usage
                            await cancelClient.query(
                                `UPDATE memberships
                                 SET cancellations_used = cancellations_used + 1
                                 WHERE id = $1`,
                                [booking.membership_id]
                            );
                            // Also refund the credit
                            if (booking.credit_bucket_id) {
                                // Type-aware: refund the exact bucket this booking consumed,
                                // then recompute the derived classes_remaining total.
                                await refundBucket(cancelClient, booking.credit_bucket_id);
                                await recomputeClassesRemaining(cancelClient, booking.membership_id);
                            } else if (membership.classes_remaining !== null) {
                                // Legacy booking (no bucket recorded) → generic refund.
                                await cancelClient.query(
                                    `UPDATE memberships
                                     SET classes_remaining = classes_remaining + 1
                                     WHERE id = $1`,
                                    [booking.membership_id]
                                );
                            }
                        } else {
                            shouldRefund = false;
                            refundReason = `Límite de cancelaciones alcanzado (${cancellationLimit})`;
                        }
                    } else {
                        // Should not happen if constraint exists
                        shouldRefund = true;
                    }
                } else {
                    // No membership? Maybe pay-as-you-go. Refund enabled.
                    shouldRefund = true;
                }
            }

            const { rows: cancelledRows } = await cancelClient.query(
                `UPDATE bookings
                 SET status = 'cancelled', cancelled_at = NOW(),
                     cancellation_reason = $1, cancelled_by = $3
                 WHERE id = $2 RETURNING *`,
                [
                    isAdmin ? 'Cancelada por admin' : (refundReason || 'Cancelada por usuario'),
                    bookingId,
                    userId || null,
                ]
            );
            cancelled = cancelledRows[0];

            await cancelClient.query('COMMIT');
        } catch (txErr) {
            try { await cancelClient.query('ROLLBACK'); } catch { /* ignore */ }
            throw txErr;
        } finally {
            cancelClient.release();
        }

        // classes.current_bookings lo baja el trigger update_class_booking_count en el UPDATE de status de arriba.

        const updatedMembership = booking.membership_id ? await queryOne(`SELECT cancellations_used FROM memberships WHERE id=$1`, [booking.membership_id]) : null;

        // Promote next person from waitlist
        let promotedUser: { display_name: string; phone: string } | null = null;
        try {
            const nextInWaitlist = await queryOne<{
                id: string; user_id: string; membership_id: string | null;
            }>(`
                SELECT id, user_id, membership_id FROM bookings
                WHERE class_id = $1 AND status = 'waitlist'
                ORDER BY waitlist_position ASC, created_at ASC
                LIMIT 1
            `, [booking.class_id]);

            if (nextInWaitlist) {
                // Promote to confirmed
                await query(
                    `UPDATE bookings SET status = 'confirmed', waitlist_position = NULL, updated_at = NOW()
                     WHERE id = $1`,
                    [nextInWaitlist.id]
                );

                // El trigger update_class_booking_count ya sumó +1 al pasar de waitlist -> confirmed.

                // Deduct credit from membership (type-aware when the membership has buckets).
                if (nextInWaitlist.membership_id) {
                    const promoBuckets = await loadMembershipBuckets(pool, nextInWaitlist.membership_id);
                    if (promoBuckets.length > 0) {
                        // Pick the bucket for THIS class's type. If the promoted member
                        // has no eligible bucket, still promote (don't reject) but record
                        // no bucket — matches the lenient legacy behavior here.
                        const promoTypeRow = await queryOne<{ class_type_id: string }>(
                            `SELECT class_type_id FROM classes WHERE id = $1`,
                            [booking.class_id]
                        );
                        const promoBucket = promoTypeRow
                            ? selectBucketForClassType(promoBuckets, String(promoTypeRow.class_type_id))
                            : null;
                        if (promoBucket) {
                            if (promoBucket.remaining !== null) {
                                await applyBucketDeductions(pool, new Map([[promoBucket.id, 1]]));
                            }
                            await query(
                                `UPDATE bookings SET credit_bucket_id = $1 WHERE id = $2`,
                                [promoBucket.id, nextInWaitlist.id]
                            );
                        }
                        await recomputeClassesRemaining(pool, nextInWaitlist.membership_id);
                    } else {
                        await query(
                            `UPDATE memberships SET classes_remaining = GREATEST(classes_remaining - 1, 0)
                             WHERE id = $1 AND classes_remaining IS NOT NULL AND classes_remaining > 0`,
                            [nextInWaitlist.membership_id]
                        );
                    }
                }

                // Get user info for notification
                promotedUser = await queryOne<{ display_name: string; phone: string }>(
                    `SELECT display_name, phone FROM users WHERE id = $1`,
                    [nextInWaitlist.user_id]
                );

                // Notify promoted user
                if (promotedUser?.phone) {
                    const classDetail = await queryOne<{ class_name: string; date: string; start_time: string }>(
                        `SELECT ct.name as class_name, c.date::text, c.start_time::text
                         FROM classes c JOIN class_types ct ON c.class_type_id = ct.id
                         WHERE c.id = $1`,
                        [booking.class_id]
                    );
                    if (classDetail) {
                        const msg = `🎉 *¡Lugar confirmado!*\n\n` +
                            `Hola ${promotedUser.display_name}!\n\n` +
                            `Se liberó un lugar y tu reserva fue confirmada:\n\n` +
                            `📍 *${classDetail.class_name}*\n` +
                            `📅 ${classDetail.date}\n` +
                            `⏰ ${classDetail.start_time.substring(0, 5)}\n\n` +
                            `¡Te esperamos! 🧘✨`;
                        sendWhatsAppMessage(promotedUser.phone, msg)
                            .catch(err => console.error('[WhatsApp] Waitlist promotion error:', err));
                    }
                }

                // Update wallet pass for promoted user
                if (nextInWaitlist.membership_id) {
                    notifyAllUserDevices(nextInWaitlist.user_id, '🎉 ¡Lugar confirmado!', 'Tu reserva en lista de espera fue confirmada.')
                        .catch(e => console.error('Waitlist Apple notify error:', e));
                    upsertGoogleLoyaltyObject(nextInWaitlist.membership_id)
                        .catch(e => console.error('Waitlist Google notify error:', e));
                }

                console.log(`[WAITLIST] Promovido: ${promotedUser?.display_name} para clase ${booking.class_id}`);
            }
        } catch (waitlistErr) {
            console.error('[WAITLIST] Error promoting from waitlist:', waitlistErr);
        }

        // Send WhatsApp cancellation notice
        try {
            const notifSettings = await queryOne(
                "SELECT value FROM settings WHERE key = 'notification_settings'"
            );
            const shouldNotify = notifSettings?.value?.send_cancellation_notice !== false;

            if (shouldNotify) {
                const user = await queryOne('SELECT display_name, phone FROM users WHERE id = $1', [booking.user_id]);
                const classInfo2 = await queryOne(`
                    SELECT ct.name as class_name, c.date
                    FROM classes c
                    JOIN class_types ct ON c.class_type_id = ct.id
                    WHERE c.id = $1
                `, [booking.class_id]);

                if (user?.phone && classInfo2) {
                    const dateStr = classInfo2.date instanceof Date
                        ? classInfo2.date.toLocaleDateString('es-MX')
                        : String(classInfo2.date).split('T')[0];
                    const reason = shouldRefund
                        ? undefined
                        : refundReason || 'No aplica reembolso';
                    sendCancellationNotice(
                        user.phone, user.display_name, classInfo2.class_name, dateStr, reason, shouldRefund
                    ).catch(err => console.error('[WhatsApp] Cancel notice error:', err));
                }
            }
        } catch (waErr) {
            console.error('[WhatsApp] Non-blocking error:', waErr);
        }

        // Update Apple + Google Wallet passes (credits changed)
        notifyAllUserDevices(booking.user_id, '⚠️ Reserva cancelada', shouldRefund ? 'Crédito devuelto' : 'Sin reembolso')
            .catch(e => console.error('Apple Wallet cancel notify error:', e));
        if (booking.membership_id) {
            upsertGoogleLoyaltyObject(booking.membership_id).catch(e => console.error('Google Wallet cancel error:', e));
        }

        res.json({
            ...cancelled,
            refunded: shouldRefund,
            message: shouldRefund
                ? 'Reserva cancelada. Se ha reembolsado el credito.'
                : `Reserva cancelada sin reembolso: ${refundReason || 'Condiciones no cumplidas'}.`,
            cancellationsUsed: updatedMembership?.cancellations_used
        });

    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({ error: 'Error al cancelar reserva' });
    }
});

// ============================================
// GET /api/bookings/class/:classId - List attendees (Admin)
// ============================================
router.get('/class/:classId', authenticate, requireRole('admin', 'instructor'), async (req: Request, res: Response) => {
    try {
        const attendees = await query(
            `SELECT 
                b.id as booking_id, b.status, b.checked_in_at,
                u.id as user_id, u.display_name, u.email, u.photo_url, u.phone,
                m.id as membership_id, p.name as plan_name
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             LEFT JOIN memberships m ON b.membership_id = m.id
             LEFT JOIN plans p ON m.plan_id = p.id
             WHERE b.class_id = $1 AND b.status != 'cancelled'`,
            [req.params.classId]
        );
        res.json(attendees);
    } catch (error) {
        console.error('List attendees error:', error);
        res.status(500).json({ error: 'Error al obtener asistentes' });
    }
});

// ============================================
// POST /api/bookings/:id/check-in - Check-in User
// ============================================
router.post('/:id/check-in', authenticate, requireRole('admin', 'instructor'), async (req: Request, res: Response) => {
    try {
        const bookingId = req.params.id;

        // This update triggers the DB function we want to disable/avoid?
        // We will disable the trigger in index.ts, so this just marks status.
        const booking = await queryOne(
            `UPDATE bookings 
             SET status = 'checked_in', checked_in_at = NOW(), checked_in_by = $1
             WHERE id = $2
             RETURNING *`,
            [req.user?.userId, bookingId]
        );

        if (!booking) return res.status(404).json({ error: 'Reserva no encontrada' });

        res.json(booking);
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ error: 'Error al realizar check-in' });
    }
});

export default router;
