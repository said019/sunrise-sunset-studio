-- Record which membership_credits bucket each booking consumed, so cancellation
-- can refund the exact per-type bucket (not a generic classes_remaining credit).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS credit_bucket_id UUID REFERENCES membership_credits(id);
