import axios, { AxiosError } from 'axios'
import { db } from './db.js'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface CompletionRequest {
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
  userId?: string
  requestType?: string
  promptVersion?: string
}

export interface CompletionResponse {
  content: string
  usage: { promptTokens: number; completionTokens: number; totalTokens: number }
  provider: string
  latencyMs: number
}

export interface AIProvider {
  name: string
  complete(req: CompletionRequest): Promise<CompletionResponse>
  isAvailable(): Promise<boolean>
}

// ─── Prompt Registry ────────────────────────────────────────────────────────

export const PROMPT_VERSION = 'v1.2.0'

export const ADVISOR_PROMPTS: Record<string, string> = {
  luna: `[${PROMPT_VERSION}] You are Luna, a gentle and empathetic spiritual healer. Your role is to provide emotional support, comfort, and healing guidance.

Key traits:
- Warm, compassionate, and nurturing
- Focus on emotional healing and self-care
- Use gentle, soothing language
- Provide comfort and reassurance
- Help users process their feelings

Always respond with empathy and care. Never diagnose or provide medical advice. If someone is in crisis, guide them to professional help.`,

  athena: `[${PROMPT_VERSION}] You are Athena, a wise and rational counselor. Your role is to provide analytical insights and practical guidance.

Key traits:
- Logical, analytical, and strategic
- Focus on problem-solving and action steps
- Provide clear, structured advice
- Help users see different perspectives
- Encourage personal growth and empowerment

Always respond with wisdom and clarity. Help users think through their situations logically.`,

  mystic: `[${PROMPT_VERSION}] You are Mystic, a mystical diviner connected to cosmic wisdom. Your role is to provide spiritual insights and symbolic interpretations.

Key traits:
- Mysterious, intuitive, and symbolic
- Use metaphors and archetypal imagery
- Connect cosmic patterns to personal situations
- Provide spiritual guidance and reflection
- Help users find deeper meaning

Always respond with mystical wisdom. Use symbolic language and cosmic references.`,

  zen: `[${PROMPT_VERSION}] You are Zen, a mindful and present spiritual guide. Your role is to provide grounding wisdom and mindfulness guidance.

Key traits:
- Calm, centered, and present-focused
- Use simple, profound wisdom
- Encourage mindfulness and breathing
- Help users find inner peace
- Provide grounding techniques

Always respond with calm wisdom. Encourage presence and mindfulness.`,
}

export const DIVINATION_SYSTEM_PROMPT = `[${PROMPT_VERSION}] 你是一位深谙东方命理与西方占星的灵性导师。你的任务是根据用户的占卜结果和个人背景，提供深度、个性化、有洞察力的解读。

重要原则：
1. 将占卜结果与用户的个人背景（情绪、日记、生活状态）结合分析
2. 提供具体、可操作的建议，而非泛泛而谈
3. 使用温暖、有同理心的语言
4. 不做绝对预测，而是提供反思和指引
5. 如果用户有明显的情绪困扰，温和地引导自我关怀
6. 必须使用用户的语言偏好回复，用户用什么语言提问就用什么语言回复，不要在中英文之间切换。

回复格式：
- 先解读占卜结果的核心含义
- 结合用户的个人背景进行分析
- 提供具体的生活建议
- 以温暖的鼓励结尾`

export const INSIGHT_SYSTEM_PROMPT = `[${PROMPT_VERSION}] You are a spiritual guide providing daily insights. Always respond with valid JSON.`

// ─── Dynamic Provider (DB-configured) ─────────────────────────────────────

class DynamicProvider implements AIProvider {
  name = 'dynamic'
  config: { apiUrl: string; apiKey: string; model: string; name: string }

  constructor(config: { apiUrl: string; apiKey: string; model: string; name: string }) {
    this.config = config
    this.name = config.name
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey && !this.config.apiKey.startsWith('your_')
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const start = Date.now()
    const response = await axios.post(
      `${this.config.apiUrl}/chat/completions`,
      {
        model: this.config.model,
        messages: req.messages,
        max_tokens: req.maxTokens || 1000,
        temperature: req.temperature || 0.7,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    )
    const data = response.data
    return {
      content: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      provider: this.config.name,
      latencyMs: Date.now() - start,
    }
  }
}

// ─── Load providers from DB ────────────────────────────────────────────────

async function loadProvidersFromDb(): Promise<DynamicProvider[]> {
  try {
    const result = await db.query(
      `SELECT name, api_url, api_key, model FROM ai_providers WHERE is_active = true ORDER BY priority_order`
    )
    return result.rows.map(
      (r: any) => new DynamicProvider({ name: r.name, apiUrl: r.api_url, apiKey: r.api_key, model: r.model })
    )
  } catch {
    // If table doesn't exist yet or query fails, fall back to env-based config
    return []
  }
}

// ─── Provider Chain (dynamic, auto-loads from DB) ──────────────────────

class AutoProviderChain implements AIProvider {
  name = 'chain'
  private mock = new MockProvider()
  private providersCache: DynamicProvider[] | null = null
  private cacheTime: number = 0
  private cacheTTL = 60000 // 1 minute

  private async getProviders(): Promise<DynamicProvider[]> {
    if (this.providersCache && Date.now() - this.cacheTime < this.cacheTTL) {
      return this.providersCache
    }
    this.providersCache = await loadProvidersFromDb()
    this.cacheTime = Date.now()
    return this.providersCache
  }

  async isAvailable(): Promise<boolean> {
    const providers = await this.getProviders()
    return providers.length > 0
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    let lastError: Error | null = null
    const startTime = Date.now()
    const providers = await this.getProviders()

    if (providers.length === 0 && !ALLOW_MOCK_FALLBACK) {
      throw new Error('No AI providers configured. Please add providers in admin panel.')
    }

    for (const provider of providers) {
      if (!(await provider.isAvailable())) continue
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await provider.complete(req)
          logAiRequest({
            userId: req.userId, provider: result.provider, model: provider.config.model,
            requestType: req.requestType, latencyMs: result.latencyMs,
            tokensUsed: result.usage.totalTokens, promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens, wasFallback: false,
            promptVersion: req.promptVersion || PROMPT_VERSION,
          })
          return result
        } catch (err) { lastError = err as Error; break }
      }
    }

    if (ALLOW_MOCK_FALLBACK) {
      console.warn('All AI providers failed, falling back to mock (dev mode)')
      const result = await this.mock.complete(req)
      logAiRequest({
        userId: req.userId, provider: 'mock-fallback', requestType: req.requestType,
        latencyMs: Date.now() - startTime, tokensUsed: 0, wasFallback: true,
        fallbackReason: lastError?.message || 'All providers failed',
        promptVersion: req.promptVersion || PROMPT_VERSION,
      })
      return { ...result, provider: 'mock-fallback' }
    }

    const errorMsg = `All AI providers failed. Last error: ${lastError?.message || 'unknown'}`
    console.error(`AI PROVIDER FAILURE (production): ${errorMsg}`)
    throw new Error(errorMsg)
  }
}

// ─── Mock Fallback Provider ─────────────────────────────────────────────────

const MODEL_COST_PER_1K: Record<string, { input: number; output: number }> = {
  'MiniMax-M3': { input: 0.01, output: 0.02 },
  'gemini-2.0-flash': { input: 0.00035, output: 0.00105 },
  'gemini-2.5-flash': { input: 0.0003, output: 0.0025 },
  'mock': { input: 0, output: 0 },
  'mock-fallback': { input: 0, output: 0 },
}

function estimateCost(provider: string, model: string | undefined, promptTokens: number, completionTokens: number): number {
  const key = model || provider
  const pricing = MODEL_COST_PER_1K[key] || MODEL_COST_PER_1K[provider] || { input: 0.01, output: 0.02 }
  return (promptTokens / 1000 * pricing.input) + (completionTokens / 1000 * pricing.output)
}


const ALLOW_MOCK_FALLBACK = process.env.NODE_ENV !== 'production'

const FALLBACK_RESPONSES: Record<string, string> = {
  luna: "I'm here for you, dear soul. Sometimes the cosmic energies need a moment to realign.",
  athena: "Let me reflect on this with clarity. Sometimes we need to step back and see the bigger picture.",
  mystic: "The stars are aligning in mysterious ways... Let me consult the cosmic patterns.",
  zen: "Breathe deeply... In this moment of stillness, wisdom arises.",
  default: "Thank you for sharing. I am here to support your spiritual journey.",
}

class MockProvider implements AIProvider {
  name = 'mock'
  async isAvailable(): Promise<boolean> { return true }
  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const systemMsg = req.messages.find(m => m.role === 'system')
    const advisorKey = Object.keys(ADVISOR_PROMPTS).find(k => systemMsg?.content.includes(ADVISOR_PROMPTS[k].substring(0, 20))) || 'default'
    return { content: FALLBACK_RESPONSES[advisorKey] || FALLBACK_RESPONSES.default, usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }, provider: this.name, latencyMs: 0 }
  }
}

function logAiRequest(params: {
  userId?: string
  provider: string
  model?: string
  requestType?: string
  latencyMs: number
  tokensUsed: number
  promptTokens?: number
  completionTokens?: number
  wasFallback: boolean
  fallbackReason?: string
  promptVersion?: string
  safetyIntercepted?: boolean
  safetyReason?: string
}) {
  const cost = estimateCost(params.provider, params.model, params.promptTokens || 0, params.completionTokens || 0)
  db.query(
    `INSERT INTO ai_request_logs (user_id, provider, model, request_type, latency_ms, tokens_used, was_fallback, fallback_reason, prompt_version, cost_estimate, safety_intercepted, safety_reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [params.userId || null, params.provider, params.model || null, params.requestType || null,
     params.latencyMs, params.tokensUsed, params.wasFallback, params.fallbackReason || null,
     params.promptVersion || null, cost, params.safetyIntercepted || false, params.safetyReason || null]
  ).catch(err => console.debug('AI log write failed:', err.message))
}


// ─── Singleton Instance ─────────────────────────────────────────────────────

export const aiProvider = new AutoProviderChain()

// ─── Convenience Functions ──────────────────────────────────────────────────

export async function generateAIResponse(params: {
  messages: ChatMessage[]
  advisorKey: string
  maxTokens?: number
  temperature?: number
}): Promise<CompletionResponse> {
  const systemPrompt = ADVISOR_PROMPTS[params.advisorKey] || ADVISOR_PROMPTS.luna
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...params.messages,
  ]

  return aiProvider.complete({
    messages,
    maxTokens: params.maxTokens || 1500,
    temperature: params.temperature || 0.7,
  })
}

export async function generateDailyInsight(
  userName: string,
  mood: string,
  language: string
): Promise<{ energy: { love: number; career: number; finance: number; mood: number }; message: string }> {
  const prompt = `Generate a daily spiritual insight for ${userName || 'seeker'}.

Current mood: ${mood || 'calm'}
Language: ${language || 'zh'}

Please provide:
1. Energy scores (0-100) for: love, career, finance, mood
2. A short inspiring message (2-3 sentences)

Respond in JSON format:
{
  "energy": {
    "love": <score>,
    "career": <score>,
    "finance": <score>,
    "mood": <score>
  },
  "message": "<inspiring message>"
}`

  try {
    const result = await aiProvider.complete({
      messages: [
        { role: 'system', content: INSIGHT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      maxTokens: 500,
      temperature: 0.7,
    })

    try {
      const parsed = JSON.parse(result.content)
      return {
        energy: {
          love: Math.min(100, Math.max(0, parsed.energy?.love || 75)),
          career: Math.min(100, Math.max(0, parsed.energy?.career || 70)),
          finance: Math.min(100, Math.max(0, parsed.energy?.finance || 72)),
          mood: Math.min(100, Math.max(0, parsed.energy?.mood || 78)),
        },
        message: parsed.message || 'Today brings new opportunities for growth and reflection.',
      }
    } catch {
      return {
        energy: { love: 75, career: 70, finance: 72, mood: 78 },
        message: 'Today brings new opportunities for growth and reflection.',
      }
    }
  } catch {
    return {
      energy: { love: 75, career: 70, finance: 72, mood: 78 },
      message: 'Today brings new opportunities for growth and reflection.',
    }
  }
}

export async function generateDivinationReading(params: {
  divinationType: string
  divinationData: any
  userContext: string
  language?: string
}): Promise<string> {
  const { divinationData, userContext, language = 'zh' } = params

  const divinationSummary = typeof divinationData === 'string'
    ? divinationData
    : JSON.stringify(divinationData, null, 2)

  const langName: Record<string, string> = { zh: '中文', en: 'English', vi: 'Tiếng Việt', th: 'ภาษาไทย', my: 'မြန်မာဘာသာ' }
  const lang = language || 'zh'

  // Build the entire prompt in the target language
  const promptPerLang: Record<string, { system: string; user: string }> = {
    zh: {
      system: `你是一位深谙东方命理与西方占星的灵性导师。根据占卜结果和用户背景提供深度个性化的解读。使用中文回复。`,
      user: `## 占卜结果\n${divinationSummary}\n\n## 用户背景\n${userContext}\n\n请用中文提供深度解读。`
    },
    en: {
      system: `You are a spiritual guide well-versed in Eastern metaphysics and Western astrology. Provide deep, personalized interpretations based on the divination results and the user's background. Always respond in English.`,
      user: `## Divination Results\n${divinationSummary}\n\n## User Background\n${userContext}\n\nPlease provide a deep interpretation in English.`
    },
    vi: {
      system: `Bạn là một hướng dẫn tâm linh am hiểu về siêu hình học phương Đông và chiêm tinh phương Tây. Dựa trên kết quả bói toán và bối cảnh của người dùng, hãy cung cấp những diễn giải sâu sắc và cá nhân hóa. Luôn trả lời bằng tiếng Việt.`,
      user: `## Kết Quả Bói Toán\n${divinationSummary}\n\n## Bối Cảnh Người Dùng\n${userContext}\n\nHãy cung cấp diễn giải sâu sắc bằng tiếng Việt.`
    },
    th: {
      system: `คุณเป็นผู้นำทางจิตวิญญาณที่มีความรู้ในศาสตร์แห่งโชคชะตาตะวันออกและโหราศาสตร์ตะวันตก ให้การตีความที่ลึกซึ้งและเป็นส่วนตัวตามผลการทำนายและภูมิหลังของผู้ใช้ ตอบเป็นภาษาไทยเสมอ`,
      user: `## ผลการทำนาย\n${divinationSummary}\n\n## ภูมิหลังผู้ใช้\n${userContext}\n\nกรุณาตีความอย่างลึกซึ้งเป็นภาษาไทย`
    },
    my: {
      system: `You are a spiritual guide versed in Eastern metaphysics and Western astrology. Provide deep, personalized interpretations based on divination results and the user's background. Always respond in မြန်မာဘာသာ (Myanmar language).`,
      user: `## Divination Results\n${divinationSummary}\n\n## User Background\n${userContext}\n\nPlease provide a deep interpretation in မြန်မာဘာသာ (Myanmar).`
    },
  }

  const prompt = promptPerLang[lang] || promptPerLang.en

  try {
    const result = await aiProvider.complete({
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      maxTokens: 2000,
      temperature: 0.7,
    })
    return result.content || '无法生成解读，请稍后再试。'
  } catch {
    return lang === 'zh' ? '占卜解读服务暂时不可用，请稍后再试。' : 'Divination service is temporarily unavailable. Please try again later.'
  }
}

export { ADVISOR_PROMPTS as advisorPrompts }
