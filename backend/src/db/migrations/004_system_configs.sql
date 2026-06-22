-- 004: System configuration table

CREATE TABLE IF NOT EXISTS system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_configs_key ON system_configs(key);

-- Seed default system configs
INSERT INTO system_configs (key, value, description) VALUES
('maintenance_mode', 'false', 'When true, app shows maintenance page to all users'),
('ai_provider_enabled', 'true', 'Master switch for AI provider calls'),
('mock_fallback_allowed', 'true', 'Allow mock responses when AI providers fail (disable in production)'),
('payment_sandbox', 'true', 'Use payment provider sandbox/test mode')
ON CONFLICT (key) DO NOTHING;
