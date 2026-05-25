import type { PoolClient } from 'pg';
import { awardPaymentLoyaltyPoints } from './loyalty.js';

export interface CreateMembershipParams {
    userId: string;
    plan: { id: string; price: number | string; currency: string; class_limit: number | null; duration_days: number };
    status: 'active' | 'pending_payment' | 'pending_activation';
    startDate?: string;
    paymentMethod?: string | null;
    paymentReference?: string | null;
    notes?: string | null;
    processedBy?: string | null;
}

/**
 * Crea membresía (+ pago + puntos de lealtad) dentro de una transacción ya abierta.
 * El llamador es responsable de BEGIN/COMMIT/ROLLBACK y de las notificaciones.
 */
export async function createMembershipWithPayment(
    client: PoolClient,
    params: CreateMembershipParams
): Promise<{ membership: any; start: Date; end: Date }> {
    const { userId, plan, status, startDate, paymentMethod, paymentReference, notes, processedBy } = params;

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + plan.duration_days);

    const normalizedPaymentMethod =
        paymentMethod === 'bank_transfer' ? 'transfer' : (paymentMethod || null);

    const membershipResult = await client.query(
        `INSERT INTO memberships (
            user_id, plan_id, start_date, end_date, status, classes_remaining, payment_method, payment_reference
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
            userId,
            plan.id,
            status === 'active' ? start : null,
            status === 'active' ? end : null,
            status,
            plan.class_limit ?? null,
            normalizedPaymentMethod,
            notes || null,
        ]
    );
    const membership = membershipResult.rows[0];

    if (normalizedPaymentMethod) {
        const payResult = await client.query(
            `INSERT INTO payments (
                user_id, membership_id, amount, currency,
                payment_method, reference, notes, status, processed_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', $8)
            RETURNING id`,
            [
                userId,
                membership.id,
                plan.price,
                plan.currency,
                normalizedPaymentMethod,
                paymentReference || null,
                notes || null,
                processedBy || null,
            ]
        );

        if (payResult.rows[0]?.id) {
            await awardPaymentLoyaltyPoints({
                db: client,
                userId,
                paymentId: payResult.rows[0].id,
                amount: Number(plan.price),
                paymentMethod: normalizedPaymentMethod,
            }).catch(e => console.error('Loyalty points error:', e));
        }
    }

    return { membership, start, end };
}
