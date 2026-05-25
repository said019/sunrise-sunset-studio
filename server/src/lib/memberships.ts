import type { PoolClient } from 'pg';
import { awardPaymentLoyaltyPoints } from './loyalty.js';

/**
 * Copies a plan's credit buckets into membership_credits for the given membership,
 * then recomputes classes_remaining as the derived total (NULL if any bucket is unlimited).
 * If the plan has no buckets, this is a no-op and the existing classes_remaining is untouched.
 *
 * Must be called inside the same transaction as the membership creation/activation.
 */
export async function copyPlanBucketsToMembership(
    db: { query(text: string, params?: any[]): Promise<any> },
    membershipId: string,
    planId: string
): Promise<void> {
    // Copy plan buckets into membership_credits
    const insertResult = await db.query(
        `INSERT INTO membership_credits (membership_id, allowed_class_type_ids, remaining, sort_order)
         SELECT $1, allowed_class_type_ids, credit_count, sort_order
         FROM plan_credit_buckets WHERE plan_id = $2`,
        [membershipId, planId]
    );

    // Only recompute classes_remaining if at least one bucket was inserted.
    // If the plan has no buckets (legacy/uncovered plan), leave classes_remaining untouched.
    const rowsInserted = insertResult.rowCount ?? 0;
    if (rowsInserted > 0) {
        await db.query(
            `UPDATE memberships m SET classes_remaining =
               CASE WHEN EXISTS (
                        SELECT 1 FROM membership_credits c
                        WHERE c.membership_id = m.id AND c.remaining IS NULL
                    )
                    THEN NULL
                    ELSE (
                        SELECT COALESCE(SUM(remaining), 0)
                        FROM membership_credits c
                        WHERE c.membership_id = m.id
                    )
               END
             WHERE m.id = $1`,
            [membershipId]
        );
    }
}

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

    // Copy plan credit buckets into membership_credits when activating
    if (status === 'active') {
        await copyPlanBucketsToMembership(client, membership.id, plan.id);
    }

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
