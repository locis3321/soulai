-- 009: AI quality management — cost tracking, prompt version, safety flags, content moderation

-- Add quality tracking columns to ai_request_logs
ALTER TABLE ai_request_logs ADD COLUMN IF NOT EXISTS prompt_version VARCHAR(50);
ALTER TABLE ai_request_logs ADD COLUMN IF NOT EXISTS cost_estimate DECIMAL(10,6) DEFAULT 0;
ALTER TABLE ai_request_logs ADD COLUMN IF NOT EXISTS safety_intercepted BOOLEAN DEFAULT false;
ALTER TABLE ai_request_logs ADD COLUMN IF NOT EXISTS safety_reason TEXT;

-- Add resolution notes to safety_events
ALTER TABLE safety_events ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE safety_events ADD COLUMN IF NOT EXISTS ai_request_log_id UUID REFERENCES ai_request_logs(id) ON DELETE SET NULL;

-- Content moderation events (for user-generated content: journals, chat, community)
CREATE TABLE IF NOT EXISTS content_moderation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    source VARCHAR(50) NOT NULL,
    content_snippet TEXT,
    flag_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'warning',
    action_taken VARCHAR(50) DEFAULT 'flagged',
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES admin_users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_request_type ON ai_request_logs(request_type);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_safety_intercepted ON ai_request_logs(safety_intercepted);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_created_at ON ai_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_safety_events_ai_request_log_id ON safety_events(ai_request_log_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_events_user_id ON content_moderation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_content_moderation_events_flag_type ON content_moderation_events(flag_type);
CREATE INDEX IF NOT EXISTS idx_content_moderation_events_created_at ON content_moderation_events(created_at);
CREATE INDEX IF NOT EXISTS idx_content_moderation_events_resolved ON content_moderation_events(resolved);
