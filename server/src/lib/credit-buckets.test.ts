import { describe, it, expect } from 'vitest';
import { selectBucketForClassType, CreditBucket } from './credit-buckets';

const SF = 'sf-id', SP = 'sp-id', YOGA = 'yoga-id';

describe('selectBucketForClassType', () => {
  it('selects the shared bucket for an allowed type (Group A)', () => {
    const buckets: CreditBucket[] = [
      { id: 'a', allowed_class_type_ids: [SF, YOGA], remaining: 4, sort_order: 0 },
    ];
    expect(selectBucketForClassType(buckets, YOGA)?.id).toBe('a');
  });

  it('returns null when no bucket allows the type (Group A booking Surf)', () => {
    const buckets: CreditBucket[] = [
      { id: 'a', allowed_class_type_ids: [SF, YOGA], remaining: 4, sort_order: 0 },
    ];
    expect(selectBucketForClassType(buckets, SP)).toBeNull();
  });

  it('prefers the most specific bucket for mixed packages (Group C)', () => {
    const buckets: CreditBucket[] = [
      { id: 'sf', allowed_class_type_ids: [SF], remaining: 3, sort_order: 0 },
      { id: 'sp', allowed_class_type_ids: [SP], remaining: 3, sort_order: 1 },
      { id: 'yoga', allowed_class_type_ids: [YOGA], remaining: 2, sort_order: 2 },
    ];
    expect(selectBucketForClassType(buckets, SP)?.id).toBe('sp');
  });

  it('treats remaining=null as unlimited (eligible)', () => {
    const buckets: CreditBucket[] = [
      { id: 'u', allowed_class_type_ids: [SF, SP, YOGA], remaining: null, sort_order: 0 },
    ];
    expect(selectBucketForClassType(buckets, SF)?.id).toBe('u');
  });

  it('skips exhausted buckets (remaining=0)', () => {
    const buckets: CreditBucket[] = [
      { id: 'sp', allowed_class_type_ids: [SP], remaining: 0, sort_order: 0 },
    ];
    expect(selectBucketForClassType(buckets, SP)).toBeNull();
  });
});
