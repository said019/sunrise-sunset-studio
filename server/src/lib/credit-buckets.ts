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
