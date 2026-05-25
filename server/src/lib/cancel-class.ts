import { pool } from '../config/database.js';
import { refundBucket, recomputeClassesRemaining } from './membership-credits.js';

/**
 * Cancel a class and all its active bookings, refunding membership credits.
 * Reusable across: manual cancel, event overlap cancel, closed-day cancel.
 */
export async function cancelClassWithRefunds(
    classId: string,
    cancelledBy: string,
    reason: string
): Promise<{ class: any; cancelledBookings: number; refundedCredits: number }> {
    // FIX 3: make the class cancel + all per-booking refunds atomic so a mid-loop
    // failure can't leave some bookings cancelled-and-refunded while others stay
    // active (and the class half-cancelled). No caller wraps this in its own
    // transaction, so an internal BEGIN/COMMIT is safe; loop callers (closed-days,
    // events) get one atomic unit per class.
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Cancel the class
        const { rows: classRows } = await client.query(
            `UPDATE classes
             SET status = 'cancelled',
                 cancelled_at = NOW(),
                 cancelled_by = $1,
                 cancellation_reason = $2
             WHERE id = $3 RETURNING *`,
            [cancelledBy, reason, classId]
        );
        const result = classRows[0];

        if (!result) {
            await client.query('ROLLBACK');
            return { class: null, cancelledBookings: 0, refundedCredits: 0 };
        }

        // Get all active bookings for this class
        const { rows: bookingsToCancel } = await client.query(
            `SELECT b.*, m.id as membership_id
             FROM bookings b
             LEFT JOIN memberships m ON b.membership_id = m.id
             WHERE b.class_id = $1 AND b.status IN ('confirmed', 'waitlist')`,
            [classId]
        );

        let cancelledBookings = 0;
        let refundedCredits = 0;

        for (const booking of bookingsToCancel) {
            await client.query(
                `UPDATE bookings
                 SET status = 'cancelled',
                     cancelled_at = NOW(),
                     cancellation_reason = $1
                 WHERE id = $2`,
                [reason, booking.id]
            );
            cancelledBookings++;

            // Refund credit if booking was confirmed and had a membership.
            if (booking.status === 'confirmed' && booking.membership_id) {
                if (booking.credit_bucket_id) {
                    // Type-aware: refund the exact bucket this booking consumed,
                    // then recompute the derived classes_remaining total.
                    await refundBucket(client, booking.credit_bucket_id);
                    await recomputeClassesRemaining(client, booking.membership_id);
                } else {
                    // Legacy booking (no bucket recorded) → generic refund.
                    await client.query(
                        `UPDATE memberships
                         SET classes_remaining = classes_remaining + 1
                         WHERE id = $1 AND classes_remaining IS NOT NULL`,
                        [booking.membership_id]
                    );
                }
                refundedCredits++;
            }
        }

        await client.query('COMMIT');
        return { class: result, cancelledBookings, refundedCredits };
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch { /* ignore */ }
        throw err;
    } finally {
        client.release();
    }
}
