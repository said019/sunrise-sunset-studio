import { selectBucketForClassType, CreditBucket, bucketsCoverAllClassTypes } from './credit-buckets.js';

/** Minimal DB interface satisfied by both `pool` and a `PoolClient` (a tx client). */
export interface Queryable {
    query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount?: number | null }>;
}

/**
 * Type-aware membership auto-select (FIX 1).
 *
 * Given candidate active/non-expired memberships ALREADY ordered by the caller's
 * preference (e.g. bounded-before-unlimited, soonest end_date), pick the first one
 * whose credit buckets can cover ALL the distinct class types being booked.
 *
 * - Loads each candidate's buckets in the caller's preference order and returns the
 *   first that covers every requested type (single-type requests just pass one id).
 * - Legacy fallback: any candidate that has NO buckets is treated as covering
 *   (its generic classes_remaining was already validated by the caller's SQL), so
 *   old plans without buckets keep working. Among ties we still honor the incoming
 *   order, so the legacy/no-buckets candidate is only chosen if no earlier candidate
 *   with buckets covers the types.
 * - Returns null only when NO candidate can cover the types (caller keeps rejecting).
 *
 * `db` is any Queryable (pool or tx client) — pass the SAME client used to fetch
 * (and lock) the candidates so the bucket reads are consistent with the lock.
 */
export async function pickMembershipForClassTypes(
    db: Queryable,
    candidates: Array<{ id: string;[k: string]: any }>,
    classTypeIds: string[]
): Promise<{ id: string;[k: string]: any } | null> {
    if (candidates.length === 0) return null;
    // Fast path: a single candidate is whatever the caller already validated.
    if (candidates.length === 1) return candidates[0];

    for (const candidate of candidates) {
        const buckets = await loadMembershipBuckets(db, candidate.id);
        // No buckets → legacy membership; caller's SQL already vetted its credits.
        if (buckets.length === 0) return candidate;
        if (bucketsCoverAllClassTypes(buckets, classTypeIds)) return candidate;
    }
    return null;
}

/**
 * Load a membership's credit buckets (the source of truth for what can be booked),
 * mapped into the CreditBucket shape used by selectBucketForClassType.
 * `allowed_class_type_ids` comes back from pg as a JS array of strings.
 */
export async function loadMembershipBuckets(
    db: Queryable,
    membershipId: string
): Promise<CreditBucket[]> {
    const { rows } = await db.query(
        `SELECT id, allowed_class_type_ids, remaining, sort_order
         FROM membership_credits WHERE membership_id = $1`,
        [membershipId]
    );
    return rows.map((r: any) => ({
        id: r.id,
        allowed_class_type_ids: (r.allowed_class_type_ids || []).map((x: any) => String(x)),
        remaining: r.remaining === null || r.remaining === undefined ? null : Number(r.remaining),
        sort_order: r.sort_order ?? 0,
    }));
}

/**
 * Recompute a membership's derived classes_remaining total from its buckets:
 * NULL if any bucket is unlimited, else the sum of remainings. Kept for
 * backward-compat with Wallet/reports. No-op semantics if there are no buckets
 * (sum of zero rows = 0); callers should skip this for the legacy/no-buckets path.
 */
export async function recomputeClassesRemaining(
    db: Queryable,
    membershipId: string
): Promise<void> {
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

export class CreditBucketError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CreditBucketError';
    }
}

/**
 * Per-class type-aware reservation, evaluated against an in-memory snapshot of the
 * membership's buckets. Decrements the chosen bucket's `remaining` IN MEMORY so a
 * later class of the same type in the SAME request can't double-spend a bucket that
 * only had 1 credit left. Throws CreditBucketError (with a Spanish message naming the
 * class type) when no eligible bucket exists — caller must reject/rollback the whole
 * request so deductions stay atomic.
 *
 * Returns the bucket id to record on the booking row (so cancel can refund it) and
 * whether the bucket is unlimited. Does NOT write to the DB — the caller flushes the
 * net deductions afterwards (see applyBucketDeductions).
 */
export function reserveBucketInMemory(
    buckets: CreditBucket[],
    classTypeId: string,
    classTypeName?: string | null
): { bucketId: string; unlimited: boolean } {
    const bucket = selectBucketForClassType(buckets, classTypeId);
    if (!bucket) {
        // Distinguish "package doesn't include this type" from "ran out of this type".
        const allowsType = buckets.some((b) => b.allowed_class_type_ids.includes(classTypeId));
        const label = classTypeName && classTypeName.trim() ? classTypeName.trim() : 'esta clase';
        const msg = allowsType
            ? `Sin créditos de ${label} disponibles en tu paquete.`
            : `Tu paquete no incluye ${label}.`;
        throw new CreditBucketError(msg);
    }
    if (bucket.remaining !== null) {
        // Decrement the in-memory snapshot so subsequent selections in this request
        // see the reduced availability (prevents double-spend within one request).
        bucket.remaining -= 1;
    }
    return { bucketId: bucket.id, unlimited: bucket.remaining === null };
}

/**
 * Persist the net per-bucket deductions for a single request. `deductions` maps a
 * bucket id to how many credits to subtract (only bounded buckets are included).
 * Must run on the same tx client as the surrounding writes.
 */
export async function applyBucketDeductions(
    db: Queryable,
    deductions: Map<string, number>
): Promise<void> {
    for (const [bucketId, count] of deductions) {
        if (count <= 0) continue;
        await db.query(
            `UPDATE membership_credits SET remaining = remaining - $1
             WHERE id = $2 AND remaining IS NOT NULL`,
            [count, bucketId]
        );
    }
}

/**
 * Refund a single credit to the exact bucket a booking consumed (cancellation path).
 * Unlimited buckets (remaining IS NULL) are left untouched.
 */
export async function refundBucket(
    db: Queryable,
    bucketId: string
): Promise<void> {
    await db.query(
        `UPDATE membership_credits SET remaining = remaining + 1
         WHERE id = $1 AND remaining IS NOT NULL`,
        [bucketId]
    );
}
