export interface CreditBucket {
  id: string;
  allowed_class_type_ids: string[];
  remaining: number | null; // null = unlimited
  sort_order: number;
}

/**
 * Choose which bucket to deduct for a class of `classTypeId`.
 * Eligible = bucket allows the type AND has availability (remaining > 0 or null).
 * Preference: most specific bucket (fewest allowed types) first, so mixed
 * packages consume the single-type bucket; tiebreak by sort_order.
 * Returns null when nothing is eligible (caller rejects the booking).
 */
export function selectBucketForClassType(
  buckets: CreditBucket[],
  classTypeId: string
): CreditBucket | null {
  const eligible = buckets.filter(
    (b) =>
      b.allowed_class_type_ids.includes(classTypeId) &&
      (b.remaining === null || b.remaining > 0)
  );
  if (eligible.length === 0) return null;
  eligible.sort((a, b) => {
    const specA = a.allowed_class_type_ids.length;
    const specB = b.allowed_class_type_ids.length;
    if (specA !== specB) return specA - specB;
    return a.sort_order - b.sort_order;
  });
  return eligible[0];
}

/**
 * Does this set of buckets have at least one eligible bucket for `classTypeId`?
 * "Eligible" = allows the type AND has availability (remaining > 0 or null).
 * Thin wrapper over selectBucketForClassType used for type-aware membership
 * auto-selection (FIX 1). Does NOT mutate buckets.
 */
export function bucketsCoverClassType(
  buckets: CreditBucket[],
  classTypeId: string
): boolean {
  return selectBucketForClassType(buckets, classTypeId) !== null;
}

/**
 * Can this set of buckets cover EVERY distinct class type in `classTypeIds`?
 * Used to prefer a membership that covers all types in a multi-class request
 * (the `bulk` path). This is a coarse per-type eligibility check (each distinct
 * type must have some eligible bucket), NOT a full quantity simulation — the
 * per-class reservation (reserveBucketInMemory) still enforces exact quantities
 * afterward. An empty list returns true (vacuously covered). Does NOT mutate.
 */
export function bucketsCoverAllClassTypes(
  buckets: CreditBucket[],
  classTypeIds: string[]
): boolean {
  const distinct = new Set(classTypeIds.map((id) => String(id)));
  for (const typeId of distinct) {
    if (!bucketsCoverClassType(buckets, typeId)) return false;
  }
  return true;
}
