import { db } from './db.js'

// ─── Feature Flags ──────────────────────────────────────────────────────

let featureFlagCache: Record<string, boolean> = {}
let lastCacheRefresh = 0
const CACHE_TTL_MS = 30_000 // 30 seconds

export async function getFeatureFlag(key: string, defaultValue = false): Promise<boolean> {
  const now = Date.now()
  if (now - lastCacheRefresh > CACHE_TTL_MS) {
    await refreshFeatureFlagCache()
  }
  return key in featureFlagCache ? featureFlagCache[key] : defaultValue
}

export async function getAllFeatureFlags(): Promise<Record<string, boolean>> {
  const now = Date.now()
  if (now - lastCacheRefresh > CACHE_TTL_MS) {
    await refreshFeatureFlagCache()
  }
  return { ...featureFlagCache }
}

async function refreshFeatureFlagCache() {
  try {
    const result = await db.query('SELECT key, value FROM feature_flags')
    featureFlagCache = {}
    for (const row of result.rows) {
      featureFlagCache[row.key] = row.value === true
    }
    lastCacheRefresh = Date.now()
  } catch (err) {
    console.error('Failed to refresh feature flags:', err)
  }
}

// ─── Prompt Config ──────────────────────────────────────────────────────

export interface PromptConfig {
  key: string
  systemPrompt: string
  userPromptTemplate: string
  version: string
  updatedAt: string
}

let promptConfigCache: Record<string, PromptConfig> = {}
let lastPromptCacheRefresh = 0

export async function getPromptConfig(key: string): Promise<PromptConfig | null> {
  const now = Date.now()
  if (now - lastPromptCacheRefresh > CACHE_TTL_MS) {
    await refreshPromptConfigCache()
  }
  return promptConfigCache[key] || null
}

export async function getAllPromptConfigs(): Promise<PromptConfig[]> {
  const now = Date.now()
  if (now - lastPromptCacheRefresh > CACHE_TTL_MS) {
    await refreshPromptConfigCache()
  }
  return Object.values(promptConfigCache)
}

async function refreshPromptConfigCache() {
  try {
    const result = await db.query('SELECT key, system_prompt, user_prompt_template, version, updated_at FROM prompt_configs')
    promptConfigCache = {}
    for (const row of result.rows) {
      promptConfigCache[row.key] = {
        key: row.key,
        systemPrompt: row.system_prompt,
        userPromptTemplate: row.user_prompt_template,
        version: row.version,
        updatedAt: row.updated_at,
      }
    }
    lastPromptCacheRefresh = Date.now()
  } catch (err) {
    // Table may not exist yet, that's ok
    console.debug('Prompt config table not available:', err)
  }
}
