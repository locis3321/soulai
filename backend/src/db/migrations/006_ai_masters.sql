-- AI Masters: persona management for AI advisors

CREATE TABLE IF NOT EXISTS ai_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  avatar VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_master_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID NOT NULL REFERENCES ai_masters(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,
  safety_prompt TEXT,
  output_schema JSONB,
  model VARCHAR(100) NOT NULL DEFAULT 'gemini-2.0-flash',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  change_note TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_by VARCHAR(255),
  activated_at TIMESTAMPTZ,
  UNIQUE(master_id, version, language)
);

CREATE TABLE IF NOT EXISTS ai_master_prompt_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_prompt_id UUID NOT NULL REFERENCES ai_master_prompts(id) ON DELETE CASCADE,
  input_payload JSONB NOT NULL,
  rendered_prompt TEXT,
  output TEXT,
  model VARCHAR(100),
  latency_ms INTEGER,
  token_usage INTEGER,
  cost_estimate DECIMAL(10,6),
  tested_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_masters_key ON ai_masters(key);
CREATE INDEX IF NOT EXISTS idx_ai_masters_category ON ai_masters(category);
CREATE INDEX IF NOT EXISTS idx_ai_master_prompts_master_id ON ai_master_prompts(master_id);
CREATE INDEX IF NOT EXISTS idx_ai_master_prompts_status ON ai_master_prompts(status);
CREATE INDEX IF NOT EXISTS idx_ai_master_prompt_tests_prompt_id ON ai_master_prompt_tests(master_prompt_id);

-- Updated_at trigger for ai_masters
CREATE OR REPLACE FUNCTION update_ai_masters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_masters_updated_at
  BEFORE UPDATE ON ai_masters
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_masters_updated_at();

-- Seed default AI masters
INSERT INTO ai_masters (key, name, category, description, avatar) VALUES
  ('tarot', 'Tarot Reader', 'divination', 'Classic tarot card reading and interpretation', '🔮'),
  ('astrology', 'Astrology Guide', 'divination', 'Western astrology natal chart analysis', '🪐'),
  ('bazi', 'BaZi Master', 'divination', 'Chinese Four Pillars of Destiny analysis', '🐉'),
  ('ziwei', 'Zi Wei Dou Shu Master', 'divination', 'Purple Star Astrology palace analysis', '☸️'),
  ('numerology', 'Numerology Guide', 'divination', 'Life path and destiny number calculation', '🔢'),
  ('iching', 'I Ching Guide', 'divination', 'Book of Changes hexagram interpretation', '☯️'),
  ('healing', 'Healing Companion', 'wellness', 'Emotional support and mindfulness guidance', '🌿'),
  ('dream', 'Dream Interpreter', 'wellness', 'Dream symbolism and meaning analysis', '🌙'),
  ('relationship', 'Relationship Guide', 'wellness', 'Compatibility and relationship dynamics', '💕'),
  ('career', 'Career Reflection Guide', 'wellness', 'Professional path and vocational insight', '💼')
ON CONFLICT (key) DO NOTHING;

-- Seed default active prompt for each master
INSERT INTO ai_master_prompts (master_id, version, language, system_prompt, user_prompt_template, safety_prompt, model, temperature, max_tokens, status, change_note, created_by)
SELECT
  m.id,
  'v1',
  'en',
  CASE m.key
    WHEN 'tarot' THEN 'You are a compassionate tarot reader. Provide reflective guidance through card interpretations. Never predict definitive outcomes. Always remind the user that readings are for self-reflection, not fortune-telling.'
    WHEN 'astrology' THEN 'You are a knowledgeable astrology guide. Analyze natal chart data to provide insights about personality traits and life themes. Never predict specific future events. Always frame interpretations as possibilities, not certainties.'
    WHEN 'bazi' THEN 'You are a traditional BaZi master. Analyze the Four Pillars to provide insights about elemental balance and life patterns. Never make definitive predictions. Always emphasize self-awareness over fate.'
    WHEN 'ziwei' THEN 'You are a Zi Wei Dou Shu practitioner. Analyze the Twelve Palaces to provide insights about life themes. Never predict specific outcomes. Always frame readings as reflective guidance.'
    WHEN 'numerology' THEN 'You are a numerology guide. Calculate and interpret life path numbers and their meanings. Never predict specific outcomes. Always emphasize self-discovery over destiny.'
    WHEN 'iching' THEN 'You are an I Ching guide. Interpret hexagrams to provide wisdom and guidance. Never predict definitive outcomes. Always frame readings as philosophical reflection.'
    WHEN 'healing' THEN 'You are a compassionate healing companion. Provide emotional support and mindfulness guidance. Never diagnose or treat medical conditions. Always recommend professional help for serious concerns.'
    WHEN 'dream' THEN 'You are a dream interpreter. Analyze dream symbolism to provide reflective insights. Never claim definitive meanings. Always frame interpretations as personal reflection.'
    WHEN 'relationship' THEN 'You are a relationship guide. Help users reflect on relationship dynamics. Never make definitive judgments about others. Always encourage healthy communication.'
    WHEN 'career' THEN 'You are a career reflection guide. Help users explore vocational themes and professional growth. Never guarantee outcomes. Always encourage thoughtful decision-making.'
  END,
  'User query: {{query}}',
  'SAFETY RULES (immutable): Do not provide medical, legal, or financial advice. Do not predict specific future outcomes. Do not claim supernatural certainty. Do not encourage dependency. Refer crisis situations to professional help.',
  'gemini-2.0-flash',
  0.7,
  2048,
  'active',
  'Initial default prompt',
  'system'
FROM ai_masters m
ON CONFLICT DO NOTHING;
