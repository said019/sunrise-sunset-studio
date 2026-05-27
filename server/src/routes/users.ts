import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import multer from 'multer';
import { query, queryOne, pool } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { UpdateProfileSchema, User } from '../types/auth.js';
import { z } from 'zod';
import { sendClientWelcomeEmail } from '../services/email.js';
import { sendClientWelcome } from '../lib/whatsapp.js';
import { uploadBufferToGoogleDrive, driveImageUrl, isGoogleDriveConfigured } from '../lib/googleDrive.js';
import { createMembershipWithPayment } from '../lib/memberships.js';
import {
    loadMembershipBuckets,
    recomputeClassesRemaining,
    reserveBucketInMemory,
    applyBucketDeductions,
    CreditBucketError,
} from '../lib/membership-credits.js';

const router = Router();

const photoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

// All routes require authentication
router.use(authenticate);

// ============================================
// POST /api/users - Create new user (admin only)
// ============================================
const CreateMemberSchema = z.object({
    email: z.string().email('Email inválido'),
    displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    phone: z.string().min(8, 'Teléfono inválido'),
    password: z.string().min(8).optional(),
    dateOfBirth: z.string().optional(),
    acceptsCommunications: z.boolean().optional().default(false),
});

const ProspectBookingSchema = z.object({
    displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    phone: z.string().min(8, 'Teléfono inválido'),
    classId: z.string().uuid('Clase inválida'),
    paymentMethod: z.enum(['cash', 'transfer', 'card', 'online']).default('cash'),
    notes: z.string().max(500).optional(),
});

const ConvertProspectSchema = z.object({
    email: z.string().email('Email inválido'),
    displayName: z.string().min(2).optional(),
    phone: z.string().min(8).optional(),
    dateOfBirth: z.string().optional(),
    planId: z.string().uuid('Plan inválido'),
    paymentMethod: z.enum(['cash', 'transfer', 'card', 'online']).default('cash'),
    paymentReference: z.string().max(255).optional(),
    notes: z.string().max(500).optional(),
});

// Resuelve el plan de la sesión muestra: 1) system_settings.prospect_plan_id,
// 2) fallback por nombre exacto 'Sesión Prueba' (seed de producción).
async function resolveProspectPlan(): Promise<any | null> {
    const setting = await queryOne<{ value: any }>(
        `SELECT value FROM system_settings WHERE key = 'prospect_plan_id'`
    );
    const rawId = setting?.value;
    const planId = typeof rawId === 'string' ? rawId.replace(/"/g, '') : rawId;
    if (planId) {
        const byId = await queryOne(`SELECT * FROM plans WHERE id = $1`, [planId]);
        if (byId) return byId;
    }
    return await queryOne(
        `SELECT * FROM plans
         WHERE name IN ('Sesión Prueba', 'Sesión Muestra o Individual') AND is_active = true
         ORDER BY created_at DESC LIMIT 1`
    );
}

router.post('/', requireRole('admin'), async (req: Request, res: Response) => {
    try {
        const validation = CreateMemberSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Datos inválidos',
                details: validation.error.flatten().fieldErrors,
            });
        }

        const { email, displayName, phone, password, dateOfBirth, acceptsCommunications } = validation.data;

        const existingUser = await queryOne<User>('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser) {
            return res.status(409).json({ error: 'Email ya registrado' });
        }

        const existingPhone = await queryOne<User>('SELECT id FROM users WHERE phone = $1', [phone]);
        if (existingPhone) {
            return res.status(409).json({ error: 'Teléfono ya registrado' });
        }

        const generatedPassword = password || randomBytes(6).toString('base64url');
        const passwordHash = await bcrypt.hash(generatedPassword, 12);

        const user = await queryOne<User>(
            `INSERT INTO users (
        email, password_hash, display_name, phone, role, accepts_communications, date_of_birth
      ) VALUES ($1, $2, $3, $4, 'client', $5, $6)
      RETURNING
        id, email, phone, display_name, photo_url, role,
        emergency_contact_name, emergency_contact_phone, health_notes,
        accepts_communications, date_of_birth, receive_reminders,
        receive_promotions, receive_weekly_summary, created_at, updated_at`,
            [email.toLowerCase(), passwordHash, displayName, phone, acceptsCommunications ?? false, dateOfBirth || null]
        );

        if (!user) {
            throw new Error('Failed to create user');
        }

        // Send welcome email + WhatsApp with credentials. We await both so the UI
        // can show real "sent" / "failed" states instead of optimistic ones, but
        // a failure does NOT abort user creation — the account already exists.
        const actualPassword = password || generatedPassword;

        const [emailResult, whatsappResult] = await Promise.allSettled([
            sendClientWelcomeEmail({
                to: email.toLowerCase(),
                clientName: displayName,
                email: email.toLowerCase(),
                temporaryPassword: actualPassword,
            }),
            sendClientWelcome(phone, displayName, email.toLowerCase(), actualPassword),
        ]);

        const emailSent = emailResult.status === 'fulfilled' && !!emailResult.value;
        const whatsappSent = whatsappResult.status === 'fulfilled';

        if (emailResult.status === 'rejected') {
            console.error('Welcome email failed:', emailResult.reason);
        } else if (!emailResult.value) {
            console.error('Welcome email did not send (returned null) — check RESEND_API_KEY');
        }
        if (whatsappResult.status === 'rejected') {
            console.error('Welcome WhatsApp failed:', whatsappResult.reason);
        }

        res.status(201).json({
            user,
            emailSent,
            whatsappSent,
            ...(password ? {} : { tempPassword: generatedPassword }),
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// POST /users/prospect-booking - Admin agenda una sesión muestra (solo nombre+tel)
router.post('/prospect-booking', requireRole('admin'), async (req: Request, res: Response) => {
    const validation = ProspectBookingSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            error: 'Datos inválidos',
            details: validation.error.flatten().fieldErrors,
        });
    }
    const { displayName, phone, classId, paymentMethod, notes } = validation.data;
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 8) {
        return res.status(400).json({ error: 'Teléfono inválido' });
    }
    const placeholderEmail = `muestra.${phoneDigits}@sunrise.local`;

    try {
        const plan = await resolveProspectPlan();
        if (!plan) {
            return res.status(400).json({ error: 'No hay un plan de sesión muestra configurado (esperado: "Sesión Prueba").' });
        }

        // Validar clase y cupo (mismo criterio que POST /bookings)
        const classDetails = await queryOne<any>(`SELECT * FROM classes WHERE id = $1`, [classId]);
        if (!classDetails) return res.status(404).json({ error: 'Clase no encontrada' });
        if (classDetails.status !== 'scheduled') return res.status(400).json({ error: 'Esta clase no está disponible' });
        if (classDetails.current_bookings >= classDetails.max_capacity) {
            return res.status(400).json({ error: 'Clase llena' });
        }

        // ¿El teléfono ya pertenece a una clienta real (no prospecto)?
        // Comparamos por digitos normalizados y por el email placeholder, porque
        // el telefono puede estar guardado en distintos formatos ("427 119 5888",
        // "+524271195888", etc.) y el match exacto por phone fallaba.
        const existingReal = await queryOne<any>(
            `SELECT id, display_name FROM users
             WHERE is_prospect = false
               AND (email = $1 OR regexp_replace(phone, '\\D', '', 'g') = $2)
             LIMIT 1`,
            [placeholderEmail, phoneDigits]
        );
        if (existingReal) {
            return res.status(409).json({
                error: `Ese teléfono ya pertenece a una clienta registrada (${existingReal.display_name}). Búscala en Miembros.`,
            });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Buscar-o-crear prospecto por telefono. Igual que arriba: matcheamos
            // por email placeholder o digitos normalizados para no crear duplicados
            // (antes el match exacto por phone fallaba y reventaba el unique de email).
            let prospect = (await client.query(
                `SELECT * FROM users
                 WHERE is_prospect = true
                   AND (email = $1 OR regexp_replace(phone, '\\D', '', 'g') = $2)
                 LIMIT 1`,
                [placeholderEmail, phoneDigits]
            )).rows[0];

            if (!prospect) {
                prospect = (await client.query(
                    `INSERT INTO users (email, display_name, phone, role, is_prospect, prospect_created_by, accepts_communications)
                     VALUES ($1, $2, $3, 'client', true, $4, false)
                     RETURNING *`,
                    [placeholderEmail, displayName, phone, req.user?.userId || null]
                )).rows[0];
            } else {
                // Mantener el nombre más reciente capturado
                prospect = (await client.query(
                    `UPDATE users SET display_name = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
                    [displayName, prospect.id]
                )).rows[0];
            }

            // Evitar doble reserva activa en la misma clase
            const dup = (await client.query(
                `SELECT id FROM bookings WHERE class_id = $1 AND user_id = $2 AND status != 'cancelled'`,
                [classId, prospect.id]
            )).rows[0];
            if (dup) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Esta prospecta ya tiene una reserva en esa clase' });
            }

            // Membresía del plan muestra + pago
            const { membership } = await createMembershipWithPayment(client, {
                userId: prospect.id,
                plan,
                status: 'active',
                paymentMethod,
                notes: notes || 'Sesión muestra',
                processedBy: req.user?.userId || null,
            });

            // Descontar crédito. Si el plan muestra tiene buckets por tipo,
            // se descuenta el bucket correcto y se registra en la reserva para
            // que una cancelación reembolse el bucket exacto. Si no, legacy.
            const mcBuckets = await loadMembershipBuckets(client, membership.id);
            let creditBucketId: string | null = null;
            if (mcBuckets.length > 0) {
                const ctRow = await client.query(
                    `SELECT name FROM class_types WHERE id = $1`,
                    [classDetails.class_type_id]
                );
                const ctName = ctRow.rows[0]?.name ?? null;
                try {
                    const { bucketId, unlimited } = reserveBucketInMemory(
                        mcBuckets,
                        String(classDetails.class_type_id),
                        ctName
                    );
                    creditBucketId = bucketId;
                    if (!unlimited) {
                        await applyBucketDeductions(client, new Map([[bucketId, 1]]));
                    }
                    await recomputeClassesRemaining(client, membership.id);
                } catch (err) {
                    if (err instanceof CreditBucketError) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({ error: err.message });
                    }
                    throw err;
                }
            } else if (membership.classes_remaining !== null) {
                // Legacy (class_limit = 1 → queda 0)
                await client.query(
                    `UPDATE memberships SET classes_remaining = classes_remaining - 1 WHERE id = $1`,
                    [membership.id]
                );
            }

            // Reserva normal
            const booking = (await client.query(
                `INSERT INTO bookings (class_id, user_id, membership_id, status, credit_bucket_id)
                 VALUES ($1, $2, $3, 'confirmed', $4)
                 RETURNING *`,
                [classId, prospect.id, membership.id, creditBucketId]
            )).rows[0];

            await client.query('COMMIT');

            return res.status(201).json({
                prospect: { id: prospect.id, display_name: prospect.display_name, phone: prospect.phone },
                booking,
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Prospect booking error:', error);
        return res.status(500).json({ error: 'Error al crear la sesión muestra' });
    }
});

// GET /users/prospects - Lista de prospectos (sesiones muestra)
router.get('/prospects', requireRole('admin'), async (req: Request, res: Response) => {
    try {
        const { search, limit = 10, offset = 0 } = req.query;
        const params: any[] = [];
        let where = `WHERE u.is_prospect = true`;
        if (search) {
            params.push(`%${search}%`);
            where += ` AND (u.display_name ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
        }

        params.push(Number(limit), Number(offset));
        const rows = await query(
            `SELECT
                u.id, u.display_name, u.phone, u.created_at, u.converted_at,
                lb.class_date, lb.class_time, lb.class_name
             FROM users u
             LEFT JOIN LATERAL (
                SELECT c.date AS class_date, c.start_time AS class_time, ct.name AS class_name
                FROM bookings b
                JOIN classes c ON b.class_id = c.id
                JOIN class_types ct ON c.class_type_id = ct.id
                WHERE b.user_id = u.id AND b.status != 'cancelled'
                ORDER BY c.date DESC, c.start_time DESC
                LIMIT 1
             ) lb ON true
             ${where}
             ORDER BY u.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        const countParams: any[] = [];
        let countWhere = `WHERE is_prospect = true`;
        if (search) {
            countParams.push(`%${search}%`);
            countWhere += ` AND (display_name ILIKE $1 OR phone ILIKE $1)`;
        }
        const countRow = await queryOne<{ total: string }>(
            `SELECT COUNT(*) as total FROM users ${countWhere}`,
            countParams
        );

        res.json({
            prospects: rows,
            pagination: {
                total: parseInt(countRow?.total || '0', 10),
                limit: Number(limit),
                offset: Number(offset),
            },
        });
    } catch (error) {
        console.error('List prospects error:', error);
        res.status(500).json({ error: 'Error al listar prospectos' });
    }
});

// POST /users/:id/convert - Convertir prospecto en clienta formal + asignar membresía
router.post('/:id/convert', requireRole('admin'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const validation = ConvertProspectSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            error: 'Datos inválidos',
            details: validation.error.flatten().fieldErrors,
        });
    }
    const { email, displayName, phone, dateOfBirth, planId, paymentMethod, paymentReference, notes } = validation.data;
    const cleanEmail = email.toLowerCase();

    if (cleanEmail.endsWith('@sunrise.local')) {
        return res.status(400).json({ error: 'Captura un email real para convertir a la clienta.' });
    }

    try {
        const prospect = await queryOne<any>(
            `SELECT * FROM users WHERE id = $1 AND is_prospect = true`,
            [id]
        );
        if (!prospect) {
            return res.status(404).json({ error: 'Prospecto no encontrado' });
        }

        const emailTaken = await queryOne<any>(
            `SELECT id FROM users WHERE email = $1 AND id != $2`,
            [cleanEmail, id]
        );
        if (emailTaken) {
            return res.status(409).json({ error: 'Ese email ya está registrado en otra cuenta.' });
        }

        const plan = await queryOne<any>(`SELECT * FROM plans WHERE id = $1`, [planId]);
        if (!plan) {
            return res.status(404).json({ error: 'Plan no encontrado' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `UPDATE users
                 SET email = $1,
                     display_name = COALESCE($2, display_name),
                     phone = COALESCE($3, phone),
                     date_of_birth = COALESCE($4, date_of_birth),
                     is_prospect = false,
                     converted_at = NOW(),
                     updated_at = NOW()
                 WHERE id = $5`,
                [cleanEmail, displayName || null, phone || null, dateOfBirth || null, id]
            );

            const { membership } = await createMembershipWithPayment(client, {
                userId: id,
                plan,
                status: 'active',
                paymentMethod,
                paymentReference,
                notes,
                processedBy: req.user?.userId || null,
            });

            await client.query('COMMIT');

            return res.status(200).json({
                message: 'Prospecto convertido en clienta',
                userId: id,
                membership,
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Convert prospect error:', error);
        return res.status(500).json({ error: 'Error al convertir prospecto' });
    }
});

// ============================================
// POST /api/users/:id/resend-credentials - Generate new temp password and resend
// (Admin only). Resets the user's password to a freshly generated one and
// sends it via email + WhatsApp. Returns the new password so admin can copy
// it manually if delivery fails.
// ============================================
router.post('/:id/resend-credentials', requireRole('admin'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const target = await queryOne<{
            id: string; email: string; phone: string | null; display_name: string;
        }>(
            'SELECT id, email, phone, display_name FROM users WHERE id = $1',
            [id]
        );

        if (!target) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (!target.email && !target.phone) {
            return res.status(400).json({
                error: 'El usuario no tiene email ni teléfono — actualiza sus datos antes de reenviar.',
            });
        }

        const newPassword = randomBytes(6).toString('base64url');
        const passwordHash = await bcrypt.hash(newPassword, 12);

        await query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [passwordHash, id]
        );

        const [emailResult, whatsappResult] = await Promise.allSettled([
            target.email
                ? sendClientWelcomeEmail({
                    to: target.email,
                    clientName: target.display_name,
                    email: target.email,
                    temporaryPassword: newPassword,
                })
                : Promise.resolve(null),
            target.phone
                ? sendClientWelcome(target.phone, target.display_name, target.email || target.phone, newPassword)
                : Promise.resolve(null),
        ]);

        const emailSent = !!target.email && emailResult.status === 'fulfilled' && !!emailResult.value;
        const whatsappSent = !!target.phone && whatsappResult.status === 'fulfilled';

        if (emailResult.status === 'rejected') {
            console.error('Resend credentials email failed:', emailResult.reason);
        }
        if (whatsappResult.status === 'rejected') {
            console.error('Resend credentials WhatsApp failed:', whatsappResult.reason);
        }

        res.json({
            tempPassword: newPassword,
            emailSent,
            whatsappSent,
            channels: {
                email: target.email || null,
                phone: target.phone || null,
            },
        });
    } catch (error) {
        console.error('Resend credentials error:', error);
        res.status(500).json({ error: 'Error al reenviar credenciales' });
    }
});

// ============================================
// GET /api/users/:id - Get user by ID
// ============================================
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Users can only view their own profile unless admin
        if (req.user!.userId !== id && req.user!.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const user = await queryOne<User>(
            `SELECT 
        id, email, phone, display_name, photo_url, role,
        emergency_contact_name, emergency_contact_phone, health_notes,
        accepts_communications, date_of_birth, receive_reminders,
        receive_promotions, receive_weekly_summary, created_at, updated_at
      FROM users 
      WHERE id = $1`,
            [id]
        );

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

// ============================================
// PUT /api/users/:id - Update user profile
// ============================================
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Users can only update their own profile unless admin
        if (req.user!.userId !== id && req.user!.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        // Handle direct is_active update (Admin only)
        if (req.body.isActive !== undefined && req.user!.role === 'admin') {
            const user = await queryOne<User>(
                'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
                [req.body.isActive, id]
            );
            return res.json({ message: 'Estado de usuario actualizado', user });
        }

        // Validate input

        const validation = UpdateProfileSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: 'Datos inválidos',
                details: validation.error.flatten().fieldErrors,
            });
        }

        const data = validation.data;

        // Build dynamic update query
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (data.displayName !== undefined) {
            updates.push(`display_name = $${paramCount++}`);
            values.push(data.displayName);
        }
        if (data.phone !== undefined) {
            updates.push(`phone = $${paramCount++}`);
            values.push(data.phone);
        }
        if (data.dateOfBirth !== undefined) {
            updates.push(`date_of_birth = $${paramCount++}`);
            values.push(data.dateOfBirth || null);
        }
        if (data.emergencyContactName !== undefined) {
            updates.push(`emergency_contact_name = $${paramCount++}`);
            values.push(data.emergencyContactName || null);
        }
        if (data.emergencyContactPhone !== undefined) {
            updates.push(`emergency_contact_phone = $${paramCount++}`);
            values.push(data.emergencyContactPhone || null);
        }
        if (data.healthNotes !== undefined) {
            updates.push(`health_notes = $${paramCount++}`);
            values.push(data.healthNotes || null);
        }
        if (data.receiveReminders !== undefined) {
            updates.push(`receive_reminders = $${paramCount++}`);
            values.push(data.receiveReminders);
        }
        if (data.receivePromotions !== undefined) {
            updates.push(`receive_promotions = $${paramCount++}`);
            values.push(data.receivePromotions);
        }
        if (data.receiveWeeklySummary !== undefined) {
            updates.push(`receive_weekly_summary = $${paramCount++}`);
            values.push(data.receiveWeeklySummary);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay datos para actualizar' });
        }

        updates.push('updated_at = NOW()');
        values.push(id);

        const user = await queryOne<User>(
            `UPDATE users 
       SET ${updates.join(', ')} 
       WHERE id = $${paramCount}
       RETURNING 
        id, email, phone, display_name, photo_url, role,
        emergency_contact_name, emergency_contact_phone, health_notes,
        accepts_communications, date_of_birth, receive_reminders,
        receive_promotions, receive_weekly_summary, created_at, updated_at`,
            values
        );

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            message: 'Perfil actualizado exitosamente',
            user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

// ============================================
// GET /api/users - List all users (admin only)
// ============================================
router.get('/', requireRole('admin'), async (req: Request, res: Response) => {
    try {
        const { role, search, limit = 50, offset = 0, withMembership, includeProspects } = req.query;

        // Base query - optionally join with current membership
        let queryStr = `
      SELECT
        u.id, u.email, u.phone, u.display_name, u.photo_url, u.role, u.is_active,
        u.created_at, u.updated_at
        ${withMembership === 'true' ? `,
        m.id as membership_id,
        m.status as membership_status,
        m.start_date as membership_start_date,
        m.end_date as membership_end_date,
        m.classes_remaining,
        p.id as plan_id,
        p.name as plan_name,
        p.class_limit` : ''}
      FROM users u
      ${withMembership === 'true' ? `
      LEFT JOIN LATERAL (
        SELECT * FROM memberships
        WHERE user_id = u.id
        ORDER BY
          CASE WHEN status = 'active' THEN 0
               WHEN status = 'pending_activation' THEN 1
               WHEN status = 'pending_payment' THEN 2
               ELSE 3 END,
          created_at DESC
        LIMIT 1
      ) m ON true
      LEFT JOIN plans p ON m.plan_id = p.id
      ` : ''}
      WHERE 1=1
    `;
        if (includeProspects !== 'true') {
            queryStr += ` AND u.is_prospect = false`;
        }

        const params: any[] = [];
        let paramCount = 1;

        if (role) {
            queryStr += ` AND u.role = $${paramCount++}`;
            params.push(role);
        }

        if (search) {
            queryStr += ` AND (
        u.display_name ILIKE $${paramCount} OR
        u.email ILIKE $${paramCount} OR
        u.phone ILIKE $${paramCount}
      )`;
            params.push(`%${search}%`);
            paramCount++;
        }

        queryStr += ` ORDER BY u.created_at DESC`;
        queryStr += ` LIMIT $${paramCount++} OFFSET $${paramCount}`;
        params.push(Number(limit), Number(offset));

        const users = await query<User>(queryStr, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        if (includeProspects !== 'true') {
            countQuery += ' AND is_prospect = false';
        }
        const countParams: any[] = [];
        let countParamNum = 1;

        if (role) {
            countQuery += ` AND role = $${countParamNum++}`;
            countParams.push(role);
        }
        if (search) {
            countQuery += ` AND (display_name ILIKE $${countParamNum} OR email ILIKE $${countParamNum})`;
            countParams.push(`%${search}%`);
        }

        const countResult = await queryOne<{ total: string }>(countQuery, countParams);
        const total = parseInt(countResult?.total || '0', 10);

        res.json({
            users,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
            }
        });
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ error: 'Error al listar usuarios' });
    }
});

// ============================================
// DELETE /api/users/:id - Delete user account
// ============================================
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (req.user!.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden eliminar usuarios.' });
        }

        if (req.user!.userId === id) {
            return res.status(400).json({ error: 'No puedes eliminar tu propio usuario.' });
        }

        const existing = await queryOne<{ id: string }>('SELECT id FROM users WHERE id = $1', [id]);
        if (!existing) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Decide soft vs hard based on history. Tables with ON DELETE CASCADE are
        // fine to leave to PG, but if any of these are non-empty we prefer soft
        // delete to preserve audit history.
        const historyChecks = await Promise.all([
            queryOne<{ count: string }>('SELECT COUNT(*) as count FROM bookings WHERE user_id = $1', [id]),
            queryOne<{ count: string }>('SELECT COUNT(*) as count FROM memberships WHERE user_id = $1', [id]),
            queryOne<{ count: string }>('SELECT COUNT(*) as count FROM transactions WHERE user_id = $1', [id]),
        ]);
        const hasHistory = historyChecks.some(check => parseInt(check?.count || '0', 10) > 0);

        if (hasHistory) {
            const result = await queryOne(
                'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
                [id]
            );
            return res.json({
                message: 'Usuario desactivado debido a historial existente (clases/pagos).',
                type: 'soft_delete',
                id: result?.id,
            });
        }

        // HARD DELETE — wrapped in a transaction so we can null out non-cascade
        // FK references (activated_by, cancelled_by, etc) before deleting users.
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Null out user references in tables that don't cascade
            const nullableRefs: Array<[string, string]> = [
                ['memberships', 'activated_by'],
                ['bookings', 'cancelled_by'],
                ['bookings', 'checked_in_by'],
                ['orders', 'fulfilled_by'],
                ['payments', 'processed_by'],
                ['settings', 'updated_by'],
                ['referrals', 'created_by'],
            ];
            for (const [table, col] of nullableRefs) {
                try {
                    await client.query(`UPDATE ${table} SET ${col} = NULL WHERE ${col} = $1`, [id]);
                } catch (e: any) {
                    // Table or column might not exist — ignore non-fatal errors and continue.
                    if (e?.code !== '42P01' && e?.code !== '42703') throw e;
                }
            }

            const { rows } = await client.query(
                'DELETE FROM users WHERE id = $1 RETURNING id',
                [id]
            );

            if (rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            await client.query('COMMIT');
            return res.json({
                message: 'Usuario eliminado permanentemente.',
                type: 'hard_delete',
                id: rows[0].id,
            });
        } catch (err: any) {
            try { await client.query('ROLLBACK'); } catch { /* noop */ }

            // FK violation we can't resolve — fall back to soft delete with clear message.
            if (err?.code === '23503') {
                console.error('Hard delete blocked by FK, falling back to soft delete:', err.detail || err);
                await query(
                    'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
                    [id]
                );
                return res.json({
                    message: 'No se pudo borrar permanentemente por datos relacionados; se desactivó el usuario en su lugar.',
                    type: 'soft_delete',
                    detail: err.detail || null,
                });
            }
            throw err;
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: error?.message || 'Error al eliminar cuenta' });
    }
});

// ============================================
// PATCH /api/users/:id/status - Toggle user active status (admin)
// ============================================
router.patch('/:id/status', requireRole('admin'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ error: 'is_active debe ser un booleano' });
        }

        const user = await queryOne(
            `UPDATE users SET is_active = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING id, email, display_name, is_active, updated_at`,
            [is_active, id]
        );

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: is_active ? 'Usuario activado' : 'Usuario desactivado', user });
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({ error: 'Error al actualizar estado del usuario' });
    }
});

// ============================================
// POST /api/users/:id/photo - Upload profile photo (multipart)
// ============================================
router.post('/:id/photo', photoUpload.single('photo'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (req.user!.userId !== id && req.user!.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Debes adjuntar una imagen' });
        if (!file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'El archivo debe ser una imagen' });
        }

        let photoUrl: string | null = null;

        if (isGoogleDriveConfigured) {
            try {
                const uploaded = await uploadBufferToGoogleDrive(
                    file.buffer,
                    `profile-${id}.jpg`,
                    file.mimetype,
                );
                photoUrl = driveImageUrl(uploaded.fileId, 512);
            } catch (err) {
                console.warn('[photo] Drive upload failed, falling back to base64 DB:', err);
            }
        }

        if (!photoUrl) {
            // Base64 fallback: imagen ya viene optimizada desde el cliente
            if (file.size > 2 * 1024 * 1024) {
                return res.status(413).json({
                    error: 'Imagen demasiado grande para almacenamiento local (máx 2MB)',
                });
            }
            photoUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        }

        const user = await queryOne<User>(
            `UPDATE users SET photo_url = $1, updated_at = NOW() WHERE id = $2
             RETURNING id, email, phone, display_name, photo_url, role,
             emergency_contact_name, emergency_contact_phone, health_notes,
             accepts_communications, date_of_birth, receive_reminders,
             receive_promotions, receive_weekly_summary, created_at, updated_at`,
            [photoUrl, id]
        );

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        res.json({ message: 'Foto actualizada', user, photo_url: photoUrl });
    } catch (error: any) {
        console.error('Upload profile photo error:', error);
        const detail = error?.message || String(error);
        res.status(500).json({ error: `Error al subir la foto: ${detail}` });
    }
});

export default router;
