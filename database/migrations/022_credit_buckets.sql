-- Type-aware package credits ("credit buckets").
-- Plan-level: defines allowed class types + count per bucket.
-- Membership-level: per-bucket remaining for an active membership.

-- Plan-level: defines allowed class types + count per credit bucket
CREATE TABLE IF NOT EXISTS plan_credit_buckets (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id                UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    allowed_class_type_ids UUID[] NOT NULL,
    credit_count           INTEGER,            -- NULL = ilimitado
    sort_order             INTEGER DEFAULT 0,
    created_at             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_plan_credit_buckets_plan ON plan_credit_buckets(plan_id);

-- Membership-level: per-bucket remaining for an active membership
CREATE TABLE IF NOT EXISTS membership_credits (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_id          UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    allowed_class_type_ids UUID[] NOT NULL,
    remaining              INTEGER,            -- NULL = ilimitado
    sort_order             INTEGER DEFAULT 0,
    created_at             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_membership_credits_membership ON membership_credits(membership_id);
