-- 015: System configuration — seed default values for operational configs

-- AI Provider
INSERT INTO system_configs (key, value, description) VALUES
  ('ai_provider_primary', 'minimax', 'Primary AI provider (minimax/gemini)'),
  ('ai_provider_fallback', 'mock', 'Fallback AI provider'),
  ('ai_max_retries', '2', 'Max retry attempts for AI calls'),
  ('ai_timeout_ms', '60000', 'AI request timeout in milliseconds')
ON CONFLICT (key) DO NOTHING;

-- Content Safety
INSERT INTO system_configs (key, value, description) VALUES
  ('safety_crisis_detection', 'true', 'Enable crisis content detection'),
  ('safety_guarantee_detection', 'true', 'Enable overpromise/guarantee detection'),
  ('safety_medical_detection', 'true', 'Enable medical claim detection'),
  ('safety_profanity_filter', 'true', 'Enable profanity filtering')
ON CONFLICT (key) DO NOTHING;

-- Subscription Benefits
INSERT INTO system_configs (key, value, description) VALUES
  ('subscription_plus_monthly_price', '34.90', 'Plus monthly price (CNY)'),
  ('subscription_premium_monthly_price', '69.90', 'Premium monthly price (CNY)'),
  ('subscription_plus_yearly_price', '349.00', 'Plus yearly price (CNY)'),
  ('subscription_premium_yearly_price', '699.00', 'Premium yearly price (CNY)'),
  ('subscription_plus_daily_ai_limit', '50', 'Plus tier daily AI call limit'),
  ('subscription_premium_daily_ai_limit', '200', 'Premium tier daily AI call limit'),
  ('subscription_free_daily_ai_limit', '5', 'Free tier daily AI call limit')
ON CONFLICT (key) DO NOTHING;

-- Marketplace
INSERT INTO system_configs (key, value, description) VALUES
  ('marketplace_commission_rate', '20', 'Platform commission percentage (0-100)'),
  ('marketplace_min_price', '50', 'Minimum price per session (CNY)'),
  ('marketplace_max_price', '1000', 'Maximum price per session (CNY)'),
  ('marketplace_payout_delay_days', '7', 'Days until payout after completion')
ON CONFLICT (key) DO NOTHING;

-- Free Quota
INSERT INTO system_configs (key, value, description) VALUES
  ('free_daily_tarot_readings', '3', 'Free daily tarot readings'),
  ('free_daily_ai_messages', '10', 'Free daily AI chat messages'),
  ('free_daily_insights', '1', 'Free daily insights per day'),
  ('free_lifetime_astrology_readings', '1', 'Free lifetime astrology readings')
ON CONFLICT (key) DO NOTHING;

-- Multi-language
INSERT INTO system_configs (key, value, description) VALUES
  ('lang_enabled_en', 'true', 'English language enabled'),
  ('lang_enabled_zh', 'true', 'Chinese language enabled'),
  ('lang_enabled_vi', 'true', 'Vietnamese language enabled'),
  ('lang_enabled_th', 'true', 'Thai language enabled'),
  ('lang_enabled_my', 'true', 'Myanmar language enabled'),
  ('lang_default', 'zh', 'Default language')
ON CONFLICT (key) DO NOTHING;

-- Announcements
INSERT INTO system_configs (key, value, description) VALUES
  ('announcement_title', '', 'Active announcement title (empty = no announcement)'),
  ('announcement_content', '', 'Active announcement content'),
  ('announcement_start', '', 'Announcement start date (ISO)'),
  ('announcement_end', '', 'Announcement end date (ISO)'),
  ('announcement_type', 'info', 'Announcement type (info/warning/success)')
ON CONFLICT (key) DO NOTHING;
