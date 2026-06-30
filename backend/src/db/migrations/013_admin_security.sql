-- 013: Admin security — failed login tracking, session management, rate limiting

-- Add security tracking columns to admin_users
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_failed_at TIMESTAMP;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN DEFAULT false;

-- Admin login history table (tracks ALL login attempts, success and failure)
CREATE TABLE IF NOT EXISTS admin_login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    ip VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for login history queries
CREATE INDEX IF NOT EXISTS idx_admin_login_history_ip ON admin_login_history(ip);
CREATE INDEX IF NOT EXISTS idx_admin_login_history_created_at ON admin_login_history(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_login_history_success ON admin_login_history(success);
CREATE INDEX IF NOT EXISTS idx_admin_login_history_admin_user_id ON admin_login_history(admin_user_id);

-- Indexes for session and audit queries
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user_id ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(token_hash);
