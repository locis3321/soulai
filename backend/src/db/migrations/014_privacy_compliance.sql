-- 014: Privacy compliance — request tracking table

CREATE TABLE IF NOT EXISTS privacy_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('export', 'delete')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    requested_by UUID REFERENCES admin_users(id),
    processed_by UUID REFERENCES admin_users(id),
    processed_at TIMESTAMP,
    failure_reason TEXT,
    result_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_user_id ON privacy_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON privacy_requests(status);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_created_at ON privacy_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_type ON privacy_requests(request_type);
