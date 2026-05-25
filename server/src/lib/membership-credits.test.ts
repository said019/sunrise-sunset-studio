import { describe, it, expect } from 'vitest';
import { reserveBucketInMemory, CreditBucketError } from './membership-credits';
import { CreditBucket } from './credit-buckets';

const SF = 'sf-id', SP = 'sp-id', YOGA = 'yoga-id';

describe('reserveBucketInMemory', () => {
    it('reserves a bounded bucket and decrements the in-memory snapshot', () => {
        const buckets: CreditBucket[] = [
            { id: 'a', allowed_class_type_ids: [YOGA], remaining: 2, sort_order: 0 },
        ];
        const r = reserveBucketInMemory(buckets, YOGA, 'Yoga');
        expect(r.bucketId).toBe('a');
        expect(r.unlimited).toBe(false);
        expect(buckets[0].remaining).toBe(1); // decremented
    });

    it('prevents double-spend within one request (1-credit bucket, two classes)', () => {
        const buckets: CreditBucket[] = [
            { id: 'a', allowed_class_type_ids: [YOGA], remaining: 1, sort_order: 0 },
        ];
        const first = reserveBucketInMemory(buckets, YOGA, 'Yoga');
        expect(first.bucketId).toBe('a');
        expect(buckets[0].remaining).toBe(0);
        // Second class of same type must now fail — no credits left.
        expect(() => reserveBucketInMemory(buckets, YOGA, 'Yoga')).toThrow(CreditBucketError);
    });

    it('does not decrement unlimited buckets and reports unlimited=true', () => {
        const buckets: CreditBucket[] = [
            { id: 'u', allowed_class_type_ids: [SF, SP, YOGA], remaining: null, sort_order: 0 },
        ];
        const r1 = reserveBucketInMemory(buckets, SF, 'Surf');
        const r2 = reserveBucketInMemory(buckets, SF, 'Surf');
        expect(r1.bucketId).toBe('u');
        expect(r1.unlimited).toBe(true);
        expect(r2.unlimited).toBe(true);
        expect(buckets[0].remaining).toBeNull();
    });

    it('throws "no incluye" when the package does not cover the type', () => {
        const buckets: CreditBucket[] = [
            { id: 'a', allowed_class_type_ids: [YOGA], remaining: 3, sort_order: 0 },
        ];
        expect(() => reserveBucketInMemory(buckets, SP, 'Spinning')).toThrowError(/no incluye Spinning/);
    });

    it('throws "Sin créditos" when the type is covered but exhausted', () => {
        const buckets: CreditBucket[] = [
            { id: 'sp', allowed_class_type_ids: [SP], remaining: 0, sort_order: 0 },
        ];
        expect(() => reserveBucketInMemory(buckets, SP, 'Spinning')).toThrowError(/Sin créditos de Spinning/);
    });

    it('spends the most-specific bucket first in a mixed package', () => {
        const buckets: CreditBucket[] = [
            { id: 'shared', allowed_class_type_ids: [SF, SP, YOGA], remaining: 5, sort_order: 1 },
            { id: 'sp-only', allowed_class_type_ids: [SP], remaining: 1, sort_order: 0 },
        ];
        const r = reserveBucketInMemory(buckets, SP, 'Spinning');
        expect(r.bucketId).toBe('sp-only');
        // Next SP must fall back to the shared bucket (specific one is now empty).
        const r2 = reserveBucketInMemory(buckets, SP, 'Spinning');
        expect(r2.bucketId).toBe('shared');
    });

    it('falls back to "esta clase" label when no name is given', () => {
        const buckets: CreditBucket[] = [
            { id: 'a', allowed_class_type_ids: [YOGA], remaining: 3, sort_order: 0 },
        ];
        expect(() => reserveBucketInMemory(buckets, SP)).toThrowError(/no incluye esta clase/);
    });
});
