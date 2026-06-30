-- 007: Enhanced user management — risk flags, region, internal notes

-- Add risk management columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS region VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_high_risk BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_marked_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_marked_by UUID REFERENCES admin_users(id);

-- Internal admin notes on users
CREATE TABLE IF NOT EXISTS admin_user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_is_high_risk ON users(is_high_risk);
CREATE INDEX IF NOT EXISTS idx_admin_user_notes_user_id ON admin_user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_notes_created_at ON admin_user_notes(created_at);
