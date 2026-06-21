import axios, { AxiosError } from 'axios'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface CompletionRequest {
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
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
6. 根据用户的语言偏好回复

回复格式：
- 先解读占卜结果的核心含义
- 结合用户的个人背景进行分析
- 提供具体的生活建议
- 以温暖的鼓励结尾`

export const INSIGHT_SYSTEM_PROMPT = `[${PROMPT_VERSION}] You are a spiritual guide providing daily insights. Always respond with valid JSON.`

// ─── MiniMax Provider ───────────────────────────────────────────────────────

const MINIMAX_URL = process.env.MINIMAX_API_URL || 'https://api.office.demo.healthan.com.cn:7443/v1'
const MINIMAX_KEY = process.env.MINIMAX_API_KEY || ''
const MINIMAX_MODEL = process.env.MINIMAX_MODEL_NAME || 'MiniMax-M3'

class MiniMaxProvider implements AIProvider {
  name = 'minimax'

  async isAvailable(): Promise<boolean> {
    if (!MINIMAX_KEY) return false
    try {
      await axios.get(`${MINIMAX_URL}/models`, {
        headers: { Authorization: `Bearer ${MINIMAX_KEY}` },
        timeout: 5000,
      })
      return true
    } catch {
      return false
    }
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const start = Date.now()
    const response = await axios.post(
      `${MINIMAX_URL}/chat/completions`,
      {
        model: MINIMAX_MODEL,
        messages: req.messages,
        max_tokens: req.maxTokens || 1000,
        temperature: req.temperature || 0.7,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${MINIMAX_KEY}`,
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
      provider: this.name,
      latencyMs: Date.now() - start,
    }
  }
}

// ─── Mock Fallback Provider ─────────────────────────────────────────────────

const FALLBACK_RESPONSES: Record<string, string> = {
  luna: "I'm here for you, dear soul. Sometimes the cosmic energies need a moment to realign. Please share what's on your heart, and I'll do my best to guide you with love and compassion.",
  athena: "Let me reflect on this with clarity. Sometimes we need to step back and see the bigger picture. What specific aspect of your situation would you like to explore further?",
  mystic: "The stars are aligning in mysterious ways... Let me consult the cosmic patterns. What symbols or signs have you noticed recently in your life?",
  zen: "Breathe deeply... In this moment of stillness, wisdom arises. Let's sit with this together and find the peace within.",
  default: "Thank you for sharing. I'm here to support your spiritual journey. Please try again in a moment.",
}

class MockProvider implements AIProvider {
  name = 'mock'

  async isAvailable(): Promise<boolean> {
    return true
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    // Extract advisor key from system prompt if present
    const systemMsg = req.messages.find(m => m.role === 'system')
    const advisorKey = Object.keys(ADVISOR_PROMPTS).find(k =>
      systemMsg?.content.includes(ADVISOR_PROMPTS[k].substring(0, 20))
    ) || 'default'

    return {
      content: FALLBACK_RESPONSES[advisorKey] || FALLBACK_RESPONSES.default,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      provider: this.name,
      latencyMs: 0,
    }
  }
}

// ─── Provider Chain with Retry ──────────────────────────────────────────────

class ProviderChain implements AIProvider {
  name = 'chain'
  private providers: AIProvider[]
  private maxRetries: number

  constructor(providers: AIProvider[], maxRetries = 2) {
    this.providers = providers
    this.maxRetries = maxRetries
  }

  async isAvailable(): Promise<boolean> {
    for (const p of this.providers) {
      if (await p.isAvailable()) return true
    }
    return false
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    let lastError: Error | null = null

    for (const provider of this.providers) {
      for (let attempt = 0; attempt < this.maxRetries; attempt++) {
        try {
          const result = await provider.complete(req)
          console.log(`AI completion: provider=${result.provider}, latency=${result.latencyMs}ms, tokens=${result.usage.totalTokens}`)
          return result
        } catch (err) {
          lastError = err as Error
          const isRetryable = err instanceof AxiosError && (
            err.code === 'ECONNABORTED' ||
            err.code === 'ETIMEDOUT' ||
            (err.response?.status !== undefined && err.response.status >= 500)
          )

          if (!isRetryable || attempt === this.maxRetries - 1) {
            console.warn(`AI provider ${provider.name} failed (attempt ${attempt + 1}):`, (err as Error).message)
            break
          }

          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
          console.log(`Retrying ${provider.name} in ${delay}ms...`)
          await new Promise(r => setTimeout(r, delay))
        }
      }
    }

    // All providers failed - use mock fallback
    console.warn('All AI providers failed, using mock fallback')
    const mock = new MockProvider()
    return mock.complete(req)
  }
}

// ─── Singleton Instance ─────────────────────────────────────────────────────

const minimax = new MiniMaxProvider()
const mock = new MockProvider()

export const aiProvider = new ProviderChain([minimax, mock], 2)

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

  const userPrompt = `## 占卜结果
${divinationSummary}

## 用户背景信息
${userContext}

请根据以上占卜结果和用户背景，提供深度个性化的解读。使用 ${language === 'zh' ? '中文' : '英文'} 回复。`

  try {
    const result = await aiProvider.complete({
      messages: [
        { role: 'system', content: DIVINATION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      maxTokens: 2000,
      temperature: 0.7,
    })
    return result.content || '无法生成解读，请稍后再试。'
  } catch {
    return '占卜解读服务暂时不可用，请稍后再试。'
  }
}

export { ADVISOR_PROMPTS as advisorPrompts }
