-- 011: Enhanced marketplace management — review status, complaints, freeze, weight

-- Add management columns to practitioners
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS complaint_count INTEGER DEFAULT 0;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS recommend_weight INTEGER DEFAULT 0;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT false;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS frozen_reason TEXT;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMP;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS qualification_docs JSONB DEFAULT '[]';
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]';
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}';
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add moderation columns to practitioner_reviews
ALTER TABLE practitioner_reviews ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE practitioner_reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE practitioner_reviews ADD COLUMN IF NOT EXISTS admin_reply TEXT;

-- Add dispute columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS has_dispute BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS dispute_resolved BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS dispute_resolved_at TIMESTAMP;

-- Complaints table
CREATE TABLE IF NOT EXISTS practitioner_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    complaint_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    resolution TEXT,
    admin_user_id UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_practitioners_review_status ON practitioners(review_status);
CREATE INDEX IF NOT EXISTS idx_practitioners_is_frozen ON practitioners(is_frozen);
CREATE INDEX IF NOT EXISTS idx_practitioners_recommend_weight ON practitioners(recommend_weight);
CREATE INDEX IF NOT EXISTS idx_practitioner_reviews_is_flagged ON practitioner_reviews(is_flagged);
CREATE INDEX IF NOT EXISTS idx_practitioner_reviews_is_hidden ON practitioner_reviews(is_hidden);
CREATE INDEX IF NOT EXISTS idx_bookings_has_dispute ON bookings(has_dispute);
CREATE INDEX IF NOT EXISTS idx_practitioner_complaints_practitioner_id ON practitioner_complaints(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_practitioner_complaints_status ON practitioner_complaints(status);
CREATE INDEX IF NOT EXISTS idx_practitioner_complaints_created_at ON practitioner_complaints(created_at);
