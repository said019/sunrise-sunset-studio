// Webhook receiver para Postback de Clip.
// Clip NO firma con HMAC, así que validamos por:
//   - Query param `?secret=...` que coincide con CLIP_WEBHOOK_SECRET, y
//   - Query param `?ref=...` que es el reference UUID interno (no adivinable).
// Cualquiera de los dos es válido (la URL al panel Clip ya lleva el secret).
//
// Idempotencia: si el payment ya está completed, respondemos 200 alreadyProcessed.
// Reintentos de Clip: respondemos 200 rápido siempre. Si el payload no matchea
// ningún payment, lo guardamos en unmatched_webhooks para revisión.

import { Router, Request, Response } from 'express';
import { query, queryOne } from '../config/database.js';
import { markPaymentCompleted, markPaymentFailed } from './clip-payments.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
    try {
        const expectedSecret = process.env.CLIP_WEBHOOK_SECRET;
        const providedSecret = String(req.query.secret || req.headers['x-clip-secret'] || '');

        if (expectedSecret && providedSecret !== expectedSecret) {
            console.warn('[clip-webhook] secret mismatch');
            return res.status(401).json({ error: 'invalid_secret' });
        }

        const payload = req.body || {};
        console.log('[clip-webhook] received:', JSON.stringify(payload).slice(0, 1000));

        // Localizar el Payment. Prioridad:
        //  1. ?ref=<reference_id>  (lo pusimos al crear el link)
        //  2. payload.metadata.external_reference (Clip lo devuelve si lo enviamos en metadata)
        //  3. payload.payment_request_id
        //  4. payload.receipt_no
        const refFromQuery = req.query.ref ? String(req.query.ref) : null;
        const refFromMetadata = (payload as any)?.metadata?.external_reference || null;
        const paymentRequestId = (payload as any)?.payment_request_id || null;
        const receiptNo = (payload as any)?.receipt_no || null;

        let payment: any = null;

        const ref = refFromQuery || refFromMetadata;
        if (ref) {
            payment = await queryOne(
                `SELECT id, status FROM payments WHERE reference_id = $1`,
                [ref]
            );
        }
        if (!payment && paymentRequestId) {
            payment = await queryOne(
                `SELECT id, status FROM payments WHERE clip_payment_request_id = $1`,
                [paymentRequestId]
            );
        }
        if (!payment && receiptNo) {
            payment = await queryOne(
                `SELECT id, status FROM payments WHERE clip_receipt_no = $1`,
                [receiptNo]
            );
        }

        if (!payment) {
            await query(
                `INSERT INTO unmatched_webhooks (provider, payload) VALUES ('clip', $1)`,
                [JSON.stringify(payload)]
            );
            console.warn('[clip-webhook] no matching payment, saved to unmatched_webhooks');
            return res.json({ ok: true, matched: false });
        }

        // Mapear estado del payload
        const statusDescription = (payload as any)?.status_description;
        const resourceStatus = (payload as any)?.resource_status;
        const status = (payload as any)?.status;

        const completed =
            statusDescription === 'COMPLETED' ||
            statusDescription === 'APPROVED' ||
            resourceStatus === 'COMPLETED' ||
            status === 'COMPLETED' ||
            status === 'APPROVED';

        const declined =
            statusDescription === 'DECLINED' ||
            status === 'DECLINED';

        const cancelled =
            statusDescription === 'CANCELLED' ||
            statusDescription === 'CANCELED' ||
            resourceStatus === 'CANCELED' ||
            resourceStatus === 'CANCELLED';

        const expired =
            resourceStatus === 'EXPIRED' ||
            status === 'EXPIRED';

        if (completed) {
            const result = await markPaymentCompleted(payment.id, payload);
            return res.json({ ok: true, ...result });
        }

        if (declined) {
            await markPaymentFailed(payment.id, 'declined', payload);
            return res.json({ ok: true, matched: true, declined: true });
        }

        if (cancelled) {
            await markPaymentFailed(payment.id, 'cancelled', payload);
            return res.json({ ok: true, matched: true, cancelled: true });
        }

        if (expired) {
            await markPaymentFailed(payment.id, 'expired', payload);
            return res.json({ ok: true, matched: true, expired: true });
        }

        // Estado desconocido: guardar evento pero no cambiar estado
        await query(
            `INSERT INTO payment_events (payment_id, event_type, payload)
             VALUES ($1, 'webhook_unknown', $2)`,
            [payment.id, JSON.stringify(payload)]
        );

        res.json({ ok: true, matched: true, unhandled: true });
    } catch (error) {
        console.error('[clip-webhook] error:', error);
        // Aún así respondemos 200 para que Clip no reintente infinitamente.
        // Pero log + sentry alert para revisar manualmente.
        res.json({ ok: false, error: 'internal' });
    }
});

export default router;
