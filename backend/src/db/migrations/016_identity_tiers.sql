-- 016: Three-tier identity model — anonymous/phone-bound/member

-- Make email nullable for anonymous users
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN name SET DEFAULT 'Anonymous Seeker';

-- Identity tier columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_type VARCHAR(20) DEFAULT 'email';

-- Replace email UNIQUE constraint (can't have UNIQUE on nullable column in same way)
-- Drop and recreate: allow multiple NULL emails for anonymous users, but enforce uniqueness for non-null
-- PostgreSQL treats NULLs as distinct in UNIQUE constraints by default, which is what we want
DO $$ BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key1;
EXCEPTION WHEN others THEN NULL;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone) WHERE phone IS NOT NULL;

-- Device tracking
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(64) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_hash VARCHAR(64),
    user_agent_hash VARCHAR(64),
    UNIQUE(device_id, user_id)
);

-- Usage quotas for feature limits
CREATE TABLE IF NOT EXISTS usage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(64),
    feature_key VARCHAR(50) NOT NULL,
    used_count INTEGER DEFAULT 1,
    limit_count INTEGER NOT NULL,
    reset_period VARCHAR(20) DEFAULT 'lifetime',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phone verification codes
CREATE TABLE IF NOT EXISTS phone_verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL,
    code_hash VARCHAR(64) NOT NULL,
    purpose VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    consumed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_user_feature ON usage_quotas(user_id, feature_key);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_device_feature ON usage_quotas(device_id, feature_key);
CREATE INDEX IF NOT EXISTS idx_phone_verification_codes_phone ON phone_verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verification_codes_expires ON phone_verification_codes(expires_at);
