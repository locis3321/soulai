-- 017: Multi-provider AI system

-- AI Providers table (configurable API endpoints)
CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(20) NOT NULL DEFAULT 'openai_compatible',
    api_url VARCHAR(500) NOT NULL,
    api_key VARCHAR(500) NOT NULL,
    model VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add provider assignment to prompt versions
ALTER TABLE ai_master_prompts ADD COLUMN IF NOT EXISTS ai_provider_id UUID REFERENCES ai_providers(id);
ALTER TABLE ai_master_prompts ADD COLUMN IF NOT EXISTS fallback_provider_id UUID REFERENCES ai_providers(id);

-- Seed default MiniMax provider
INSERT INTO ai_providers (name, provider_type, api_url, api_key, model, is_active, priority_order)
SELECT 'MiniMax-M3', 'openai_compatible', 'https://api.office.demo.healthan.com.cn:7443/v1', 'sk-cp-MK8HAnWx7TzmnvzpWSKwcVE-Ydoiysw5zs0d7qKenX0RYkNqb_EfSdBvXDrL_KY7ravM7K3gXh-aru2lUXUR5GzdDgBeUBk8QWFkygimSFRKTa6mzcm7grA', 'MiniMax-M3', true, 0
WHERE NOT EXISTS (SELECT 1 FROM ai_providers WHERE name = 'MiniMax-M3');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_providers_is_active ON ai_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_providers_priority ON ai_providers(priority_order);
CREATE INDEX IF NOT EXISTS idx_ai_master_prompts_provider ON ai_master_prompts(ai_provider_id);
