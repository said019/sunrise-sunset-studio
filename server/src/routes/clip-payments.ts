// Pagos con tarjeta vía Clip Checkout (link de pago hosteado por Clip).
// Flujo:
//   1. Cliente elige "Tarjeta" → POST /api/payments/clip/checkout con { membershipId } o { amountCents, description, etc. }
//   2. Backend crea Payment(status='pending', provider='clip_checkout') y pide a Clip un payment link.
//   3. Frontend redirige al cliente a payment_request_url.
//   4. Cliente paga en página de Clip → Clip envía webhook a POST /api/webhooks/clip → backend marca payment.completed
//      + activa la membership.
//   5. Cliente regresa a /payments/:id/success (la página polletea estado hasta ver completed).

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { authenticate, requireRole } from '../middleware/auth.js';
import { pool, query, queryOne } from '../config/database.js';
import { copyPlanBucketsToMembership } from '../lib/memberships.js';
import { createCheckoutLink, ClipError } from '../lib/clip.js';
import { sendMembershipActivatedEmail } from '../services/email.js';
import { sendMembershipActivatedNotice } from '../lib/whatsapp.js';

const router = Router();

const CreateCheckoutSchema = z.object({
    membershipId: z.string().uuid().optional(),
    orderId: z.string().uuid().optional(),
}).refine(d => !!(d.membershipId || d.orderId), {
    message: 'Debes enviar membershipId u orderId',
});

function getAppUrl(): string {
    return process.env.APP_PUBLIC_URL
        || process.env.FRONTEND_URL
        || 'http://localhost:5173';
}

function getApiUrl(): string {
    return process.env.API_PUBLIC_URL
        || process.env.RAILWAY_PUBLIC_DOMAIN_URL
        || `http://localhost:${process.env.PORT || 3001}`;
}

// ============================================
// POST /api/payments/clip/checkout
// Crea un link de pago Clip para una membresía pendiente del cliente autenticado.
// ============================================
router.post('/checkout', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'No autorizado' });

        const validation = CreateCheckoutSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Datos inválidos', details: validation.error.flatten().fieldErrors });
        }

        const { membershipId, orderId } = validation.data;

        // Resolver el sujeto del pago: membresía existente o nueva orden de compra.
        let payerUserId: string;
        let amountNumber: number;
        let currency: string;
        let description: string;
        let existingFilter: { col: string; value: string };

        if (orderId) {
            const order = await queryOne<{
                id: string; user_id: string; status: string;
                total_amount: string | number; currency: string;
                plan_name: string;
            }>(
                `SELECT o.id, o.user_id, o.status, o.total_amount, o.currency, p.name as plan_name
                 FROM orders o
                 JOIN plans p ON o.plan_id = p.id
                 WHERE o.id = $1`,
                [orderId]
            );
            if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
            if (order.user_id !== userId && req.user?.role !== 'admin') {
                return res.status(403).json({ error: 'Esta orden no te pertenece' });
            }
            if (!['pending_payment', 'pending_verification'].includes(order.status)) {
                return res.status(400).json({ error: 'Esta orden no está pendiente de pago' });
            }
            payerUserId = order.user_id;
            amountNumber = typeof order.total_amount === 'number' ? order.total_amount : Number(order.total_amount);
            currency = order.currency || 'MXN';
            description = `Membresía: ${order.plan_name}`;
            existingFilter = { col: 'order_id', value: order.id };
        } else {
            const membership = await queryOne<{
                id: string; user_id: string; status: string;
                plan_name: string; plan_price: string | number; plan_currency: string;
            }>(
                `SELECT m.id, m.user_id, m.status,
                        p.name as plan_name, p.price as plan_price, p.currency as plan_currency
                 FROM memberships m
                 JOIN plans p ON m.plan_id = p.id
                 WHERE m.id = $1`,
                [membershipId!]
            );
            if (!membership) return res.status(404).json({ error: 'Membresía no encontrada' });
            if (membership.user_id !== userId && req.user?.role !== 'admin') {
                return res.status(403).json({ error: 'Esta membresía no te pertenece' });
            }
            if (!['pending_payment', 'pending_activation'].includes(membership.status)) {
                return res.status(400).json({ error: 'Esta membresía no está pendiente de pago' });
            }
            payerUserId = membership.user_id;
            amountNumber = typeof membership.plan_price === 'number' ? membership.plan_price : Number(membership.plan_price);
            currency = membership.plan_currency || 'MXN';
            description = `Membresía: ${membership.plan_name}`;
            existingFilter = { col: 'membership_id', value: membership.id };
        }

        if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
            return res.status(400).json({ error: 'Monto inválido' });
        }
        const amountCents = Math.round(amountNumber * 100);
        const reference = randomUUID();

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Reusar payment pendiente si ya existe para este sujeto con provider clip_checkout
            const existing = await client.query(
                `SELECT id FROM payments
                 WHERE ${existingFilter.col} = $1 AND provider = 'clip_checkout' AND status = 'pending'
                 ORDER BY created_at DESC LIMIT 1
                 FOR UPDATE`,
                [existingFilter.value]
            );

            let paymentId: string;
            if (existing.rows[0]) {
                paymentId = existing.rows[0].id;
            } else {
                const inserted = await client.query(
                    `INSERT INTO payments (
                        user_id, membership_id, order_id, amount, currency, payment_method, status,
                        provider, reference_id, expires_at, processed_by
                    ) VALUES ($1, $2, $3, $4, $5, 'card', 'pending', 'clip_checkout', $6,
                              NOW() + INTERVAL '30 minutes', NULL)
                    RETURNING id`,
                    [
                        payerUserId,
                        membershipId || null,
                        orderId || null,
                        amountNumber,
                        currency,
                        reference,
                    ]
                );
                paymentId = inserted.rows[0].id;

                await client.query(
                    `INSERT INTO payment_events (payment_id, event_type, to_status)
                     VALUES ($1, 'intent_created', 'pending')`,
                    [paymentId]
                );
            }

            await client.query('COMMIT');

            // Llamar a Clip fuera de la transacción (latencia externa no bloquea DB)
            const successUrl = `${getAppUrl()}/payments/${paymentId}/return`;
            const webhookSecret = process.env.CLIP_WEBHOOK_SECRET || '';
            const webhookUrl = `${getApiUrl()}/api/webhooks/clip${webhookSecret ? `?secret=${encodeURIComponent(webhookSecret)}` : ''}`;

            const link = await createCheckoutLink({
                amountCents,
                description,
                reference,
                successUrl,
                webhookUrl,
            });

            await query(
                `UPDATE payments SET
                    clip_payment_request_id = $1,
                    clip_checkout_url = $2
                 WHERE id = $3`,
                [link.payment_request_id, link.payment_request_url, paymentId]
            );

            await query(
                `INSERT INTO payment_events (payment_id, event_type, payload)
                 VALUES ($1, 'clip_link_created', $2)`,
                [paymentId, JSON.stringify({ payment_request_id: link.payment_request_id })]
            );

            res.json({
                paymentId,
                checkoutUrl: link.payment_request_url,
                expiresIn: 1800,
            });
        } catch (err) {
            try { await client.query('ROLLBACK'); } catch { /* noop */ }
            throw err;
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Clip checkout error:', error);
        if (error instanceof ClipError) {
            return res.status(502).json({
                error: 'No se pudo conectar con Clip',
                detail: error.message,
            });
        }
        res.status(500).json({ error: error?.message || 'Error al iniciar pago con tarjeta' });
    }
});

// ============================================
// GET /api/payments/clip/:id - estado del pago (para que la página de retorno haga polling)
// ============================================
router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        const payment = await queryOne<{
            id: string;
            user_id: string;
            membership_id: string | null;
            order_id: string | null;
            amount: string | number;
            status: string;
            provider: string | null;
            clip_card_brand: string | null;
            clip_card_last4: string | null;
            completed_at: string | null;
            created_at: string;
            expires_at: string | null;
        }>(
            `SELECT id, user_id, membership_id, order_id, amount, status, provider,
                    clip_card_brand, clip_card_last4, completed_at, created_at, expires_at
             FROM payments WHERE id = $1`,
            [id]
        );

        if (!payment) return res.status(404).json({ error: 'Pago no encontrado' });
        if (payment.user_id !== userId && req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        res.json({
            id: payment.id,
            membershipId: payment.membership_id,
            orderId: payment.order_id,
            status: payment.status,
            amount: Number(payment.amount),
            provider: payment.provider,
            cardBrand: payment.clip_card_brand,
            cardLast4: payment.clip_card_last4,
            completedAt: payment.completed_at,
            createdAt: payment.created_at,
            expiresAt: payment.expires_at,
        });
    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({ error: 'Error al consultar pago' });
    }
});

// ============================================
// POST /api/payments/clip/:id/cancel - admin cancela una intención pendiente
// ============================================
router.post('/:id/cancel', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await queryOne<{ id: string; status: string }>(
            `UPDATE payments
             SET status = 'cancelled'
             WHERE id = $1 AND status = 'pending' AND provider = 'clip_checkout'
             RETURNING id, status`,
            [id]
        );
        if (!result) return res.status(400).json({ error: 'No se puede cancelar este pago' });

        await query(
            `INSERT INTO payment_events (payment_id, event_type, to_status)
             VALUES ($1, 'cancelled_by_admin', 'cancelled')`,
            [id]
        );

        res.json({ ok: true });
    } catch (error) {
        console.error('Cancel payment error:', error);
        res.status(500).json({ error: 'Error al cancelar pago' });
    }
});

export default router;

// ============================================
// Helper exportado: activar membresía cuando un pago Clip se confirma.
// Lo usa también el webhook handler.
// ============================================
export async function markPaymentCompleted(paymentId: string, webhookPayload: any) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `SELECT p.*, m.plan_id as membership_plan_id
             FROM payments p
             LEFT JOIN memberships m ON p.membership_id = m.id
             WHERE p.id = $1
             FOR UPDATE`,
            [paymentId]
        );
        const payment = rows[0];
        if (!payment) {
            await client.query('ROLLBACK');
            return { matched: false };
        }

        // Idempotencia
        if (payment.status === 'completed') {
            await client.query('ROLLBACK');
            return { matched: true, alreadyCompleted: true };
        }

        const card = webhookPayload?.card || {};
        await client.query(
            `UPDATE payments SET
                status = 'completed',
                completed_at = NOW(),
                clip_receipt_no = COALESCE($1, clip_receipt_no),
                clip_auth_code  = COALESCE($2, clip_auth_code),
                clip_card_brand = COALESCE($3, clip_card_brand),
                clip_card_last4 = COALESCE($4, clip_card_last4),
                raw_webhook = $5
             WHERE id = $6`,
            [
                webhookPayload?.receipt_no || null,
                webhookPayload?.authorization_code || null,
                card.brand || null,
                card.last4 || null,
                JSON.stringify(webhookPayload),
                paymentId,
            ]
        );

        await client.query(
            `INSERT INTO payment_events (payment_id, event_type, from_status, to_status, payload)
             VALUES ($1, 'webhook_completed', $2, 'completed', $3)`,
            [paymentId, payment.status, JSON.stringify(webhookPayload)]
        );

        let activatedMembershipId: string | null = null;

        // Caso A: el payment está atado a una ORDER → fulfillar (crear membership + aprobar order)
        if (payment.order_id) {
            const orderRow = await client.query(
                `SELECT o.*, p.duration_days, p.class_limit
                 FROM orders o
                 JOIN plans p ON o.plan_id = p.id
                 WHERE o.id = $1
                 FOR UPDATE`,
                [payment.order_id]
            );
            const order = orderRow.rows[0];

            if (order && ['pending_payment', 'pending_verification'].includes(order.status)) {
                const start = new Date();
                const end = new Date(start);
                end.setDate(end.getDate() + (order.duration_days || 30));

                const newMembership = await client.query(
                    `INSERT INTO memberships (
                        user_id, plan_id, status, classes_remaining,
                        start_date, end_date, activated_at,
                        payment_method, order_id
                    ) VALUES ($1, $2, 'active', $3, $4, $5, NOW(), 'card', $6)
                    RETURNING id`,
                    [order.user_id, order.plan_id, order.class_limit ?? null, start, end, order.id]
                );
                activatedMembershipId = newMembership.rows[0].id;

                await client.query(
                    `UPDATE orders SET
                        status = 'approved',
                        membership_id = $1,
                        approved_at = NOW(),
                        paid_at = NOW(),
                        updated_at = NOW()
                     WHERE id = $2`,
                    [activatedMembershipId, order.id]
                );

                // Linkear el payment a la membresía recién creada
                await client.query(
                    `UPDATE payments SET membership_id = $1 WHERE id = $2`,
                    [activatedMembershipId, paymentId]
                );

                // Copy plan credit buckets into membership_credits (no-op if plan has no buckets)
                if (activatedMembershipId) {
                    await copyPlanBucketsToMembership(client, activatedMembershipId, order.plan_id);
                }
            }
        }

        // Caso B: el payment está atado directamente a una MEMBERSHIP existente (flujo legacy)
        if (!activatedMembershipId && payment.membership_id) {
            const planRow = await client.query(
                `SELECT duration_days, class_limit FROM plans WHERE id = $1`,
                [payment.membership_plan_id]
            );
            const plan = planRow.rows[0];
            if (plan) {
                const start = new Date();
                const end = new Date(start);
                end.setDate(end.getDate() + (plan.duration_days || 30));

                const updated = await client.query(
                    `UPDATE memberships SET
                        status = 'active',
                        start_date = COALESCE(start_date, $1::date),
                        end_date   = COALESCE(end_date,   $2::date),
                        classes_remaining = COALESCE(classes_remaining, $3),
                        activated_at = NOW()
                     WHERE id = $4 AND status IN ('pending_payment', 'pending_activation')
                     RETURNING id`,
                    [start, end, plan.class_limit ?? null, payment.membership_id]
                );
                if (updated.rows[0]) {
                    activatedMembershipId = updated.rows[0].id;
                    // Copy plan credit buckets into membership_credits (no-op if plan has no buckets)
                    if (activatedMembershipId && payment.membership_plan_id) {
                        await copyPlanBucketsToMembership(client, activatedMembershipId, payment.membership_plan_id);
                    }
                }
            }
        }

        await client.query('COMMIT');

        // Notificar al usuario fuera de la transacción
        if (activatedMembershipId) {
            try {
                const userInfo = await queryOne<{
                    email: string; phone: string; display_name: string;
                    plan_name: string; class_limit: number | null;
                    start_date: string; end_date: string;
                }>(
                    `SELECT u.email, u.phone, u.display_name,
                            p.name as plan_name, p.class_limit,
                            m.start_date, m.end_date
                     FROM memberships m
                     JOIN users u ON m.user_id = u.id
                     JOIN plans p ON m.plan_id = p.id
                     WHERE m.id = $1`,
                    [activatedMembershipId]
                );
                if (userInfo) {
                    const startStr = String(userInfo.start_date).split('T')[0];
                    const endStr = String(userInfo.end_date).split('T')[0];
                    if (userInfo.email) {
                        sendMembershipActivatedEmail({
                            to: userInfo.email,
                            clientName: userInfo.display_name,
                            planName: userInfo.plan_name,
                            classesIncluded: userInfo.class_limit,
                            startDate: startStr,
                            endDate: endStr,
                        }).catch(err => console.error('Email activación fallido:', err));
                    }
                    if (userInfo.phone) {
                        sendMembershipActivatedNotice(
                            userInfo.phone,
                            userInfo.display_name,
                            userInfo.plan_name,
                            userInfo.class_limit,
                            endStr,
                        ).catch(err => console.error('WhatsApp activación fallido:', err));
                    }
                }
            } catch (e) {
                console.error('Notify activation error:', e);
            }
        }

        return { matched: true, alreadyCompleted: false, activatedMembershipId };
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch { /* noop */ }
        throw err;
    } finally {
        client.release();
    }
}

export async function markPaymentFailed(paymentId: string, status: 'cancelled' | 'expired' | 'declined', payload: any) {
    await query(
        `UPDATE payments
         SET status = $1, raw_webhook = $2
         WHERE id = $3 AND status = 'pending'`,
        [status, JSON.stringify(payload), paymentId]
    );
    await query(
        `INSERT INTO payment_events (payment_id, event_type, to_status, payload)
         VALUES ($1, $2, $3, $4)`,
        [paymentId, `webhook_${status}`, status, JSON.stringify(payload)]
    );
}
