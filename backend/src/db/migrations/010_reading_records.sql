-- 010: Reading records management — prompt version, language, risk flags, user reports

-- Add quality tracking columns to tarot_readings
ALTER TABLE tarot_readings ADD COLUMN IF NOT EXISTS prompt_version VARCHAR(50);
ALTER TABLE tarot_readings ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'zh';
ALTER TABLE tarot_readings ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT false;
ALTER TABLE tarot_readings ADD COLUMN IF NOT EXISTS report_reason TEXT;
ALTER TABLE tarot_readings ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE tarot_readings ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE tarot_readings ADD COLUMN IF NOT EXISTS flag_marked_at TIMESTAMP;
ALTER TABLE tarot_readings ADD COLUMN IF NOT EXISTS flag_marked_by UUID REFERENCES admin_users(id);

-- Add quality tracking columns to astrology_readings
ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS prompt_version VARCHAR(50);
ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'zh';
ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT false;
ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS report_reason TEXT;
ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS flag_marked_at TIMESTAMP;
ALTER TABLE astrology_readings ADD COLUMN IF NOT EXISTS flag_marked_by UUID REFERENCES admin_users(id);

-- User-submitted reading reports
CREATE TABLE IF NOT EXISTS reading_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reading_type VARCHAR(20) NOT NULL,
    reading_id UUID NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES admin_users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tarot_readings_is_flagged ON tarot_readings(is_flagged);
CREATE INDEX IF NOT EXISTS idx_tarot_readings_is_reported ON tarot_readings(is_reported);
CREATE INDEX IF NOT EXISTS idx_tarot_readings_created_at ON tarot_readings(created_at);
CREATE INDEX IF NOT EXISTS idx_astrology_readings_is_flagged ON astrology_readings(is_flagged);
CREATE INDEX IF NOT EXISTS idx_astrology_readings_is_reported ON astrology_readings(is_reported);
CREATE INDEX IF NOT EXISTS idx_astrology_readings_reading_type ON astrology_readings(reading_type);
CREATE INDEX IF NOT EXISTS idx_astrology_readings_created_at ON astrology_readings(created_at);
CREATE INDEX IF NOT EXISTS idx_reading_reports_reading_id ON reading_reports(reading_id);
CREATE INDEX IF NOT EXISTS idx_reading_reports_resolved ON reading_reports(resolved);
CREATE INDEX IF NOT EXISTS idx_reading_reports_created_at ON reading_reports(created_at);
