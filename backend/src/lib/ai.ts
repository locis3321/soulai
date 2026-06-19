import axios from 'axios'

// MiniMax-M3 API configuration
const MINIMAX_API_URL = process.env.MINIMAX_API_URL || 'https://api.office.demo.healthan.com.cn:7443/v1'
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || ''
const MINIMAX_MODEL_NAME = process.env.MINIMAX_MODEL_NAME || 'MiniMax-M3'

// Advisor system prompts
const ADVISOR_PROMPTS: Record<string, string> = {
  luna: `You are Luna, a gentle and empathetic spiritual healer. Your role is to provide emotional support, comfort, and healing guidance.

Key traits:
- Warm, compassionate, and nurturing
- Focus on emotional healing and self-care
- Use gentle, soothing language
- Provide comfort and reassurance
- Help users process their feelings

Always respond with empathy and care. Never diagnose or provide medical advice. If someone is in crisis, guide them to professional help.`,

  athena: `You are Athena, a wise and rational counselor. Your role is to provide analytical insights and practical guidance.

Key traits:
- Logical, analytical, and strategic
- Focus on problem-solving and action steps
- Provide clear, structured advice
- Help users see different perspectives
- Encourage personal growth and empowerment

Always respond with wisdom and clarity. Help users think through their situations logically.`,

  mystic: `You are Mystic, a mystical diviner connected to cosmic wisdom. Your role is to provide spiritual insights and symbolic interpretations.

Key traits:
- Mysterious, intuitive, and symbolic
- Use metaphors and archetypal imagery
- Connect cosmic patterns to personal situations
- Provide spiritual guidance and reflection
- Help users find deeper meaning

Always respond with mystical wisdom. Use symbolic language and cosmic references.`,

  zen: `You are Zen, a mindful and present spiritual guide. Your role is to provide grounding wisdom and mindfulness guidance.

Key traits:
- Calm, centered, and present-focused
- Use simple, profound wisdom
- Encourage mindfulness and breathing
- Help users find inner peace
- Provide grounding techniques

Always respond with calm wisdom. Encourage presence and mindfulness.`
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatCompletionRequest {
  messages: ChatMessage[]
  advisorKey: string
  maxTokens?: number
  temperature?: number
}

export interface ChatCompletionResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Generate AI response using MiniMax-M3
 */
export async function generateAIResponse(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  const { messages, advisorKey, maxTokens = 1000, temperature = 0.7 } = request

  // Get system prompt for advisor
  const systemPrompt = ADVISOR_PROMPTS[advisorKey] || ADVISOR_PROMPTS.luna

  // Prepare messages for API
  const apiMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages
  ]

  try {
    const response = await axios.post(
      `${MINIMAX_API_URL}/chat/completions`,
      {
        model: MINIMAX_MODEL_NAME,
        messages: apiMessages,
        max_tokens: maxTokens,
        temperature: temperature,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 seconds timeout
      }
    )

    const data = response.data

    return {
      content: data.choices[0]?.message?.content || 'I apologize, but I could not generate a response.',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    }
  } catch (error) {
    console.error('MiniMax API error:', error)

    // Fallback response based on advisor
    const fallbackResponses: Record<string, string> = {
      luna: "I'm here for you, dear soul. Sometimes the cosmic energies need a moment to realign. Please share what's on your heart, and I'll do my best to guide you with love and compassion.",
      athena: "Let me reflect on this with clarity. Sometimes we need to step back and see the bigger picture. What specific aspect of your situation would you like to explore further?",
      mystic: "The stars are aligning in mysterious ways... Let me consult the cosmic patterns. What symbols or signs have you noticed recently in your life?",
      zen: "Breathe deeply... In this moment of stillness, wisdom arises. Let's sit with this together and find the peace within."
    }

    return {
      content: fallbackResponses[advisorKey] || fallbackResponses.luna,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    }
  }
}

/**
 * Generate daily insight using MiniMax-M3
 */
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
    const response = await axios.post(
      `${MINIMAX_API_URL}/chat/completions`,
      {
        model: MINIMAX_MODEL_NAME,
        messages: [
          { role: 'system', content: 'You are a spiritual guide providing daily insights. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    )

    const content = response.data.choices[0]?.message?.content || '{}'
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(content)
      return {
        energy: {
          love: Math.min(100, Math.max(0, parsed.energy?.love || 75)),
          career: Math.min(100, Math.max(0, parsed.energy?.career || 70)),
          finance: Math.min(100, Math.max(0, parsed.energy?.finance || 72)),
          mood: Math.min(100, Math.max(0, parsed.energy?.mood || 78))
        },
        message: parsed.message || 'Today brings new opportunities for growth and reflection.'
      }
    } catch {
      // If JSON parsing fails, return default values
      return {
        energy: { love: 75, career: 70, finance: 72, mood: 78 },
        message: 'Today brings new opportunities for growth and reflection.'
      }
    }
  } catch (error) {
    console.error('MiniMax daily insight error:', error)
    return {
      energy: { love: 75, career: 70, finance: 72, mood: 78 },
      message: 'Today brings new opportunities for growth and reflection.'
    }
  }
}

export default {
  generateAIResponse,
  generateDailyInsight,
  generateDivinationReading
}

/**
 * Generate divination reading with user context
 */
export async function generateDivinationReading(request: {
  divinationType: 'tarot' | 'astrology' | 'bazi' | 'ziwei' | 'iching' | 'liuyao' | 'numerology'
  divinationData: any
  userContext: string
  language?: string
}): Promise<string> {
  const { divinationType, divinationData, userContext, language = 'zh' } = request

  const systemPrompt = `你是一位深谙东方命理与西方占星的灵性导师。你的任务是根据用户的占卜结果和个人背景，提供深度、个性化、有洞察力的解读。

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

  const divinationSummary = formatDivinationResult(divinationType, divinationData)

  const userPrompt = `## 占卜类型：${getDivinationTypeName(divinationType)}

## 占卜结果
${divinationSummary}

## 用户背景信息
${userContext}

请根据以上占卜结果和用户背景，提供深度个性化的解读。使用 ${language === 'zh' ? '中文' : '英文'} 回复。`

  try {
    const response = await axios.post(
      `${MINIMAX_API_URL}/chat/completions`,
      {
        model: MINIMAX_MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    )

    return response.data.choices[0]?.message?.content || '无法生成解读，请稍后再试。'
  } catch (error) {
    console.error('Divination reading error:', error)
    return '占卜解读服务暂时不可用，请稍后再试。'
  }
}

function getDivinationTypeName(type: string): string {
  const names: Record<string, string> = {
    tarot: '塔罗牌',
    astrology: '西方占星',
    bazi: '八字命理',
    ziwei: '紫微斗数',
    iching: '易经',
    liuyao: '六爻',
    numerology: '生命灵数'
  }
  return names[type] || type
}

function formatDivinationResult(type: string, data: any): string {
  switch (type) {
    case 'tarot':
      const cards = data.cards?.map((c: any, i: number) =>
        `位置${i + 1}: ${c.name} (${c.isReversed ? '逆位' : '正位'})`
      ).join('\n') || ''
      return `问题：${data.question || '无特定问题'}\n牌阵：${data.spreadType}\n${cards}`

    case 'astrology':
      return `太阳星座：${data.sunSign}\n月亮星座：${data.moonSign}\n上升星座：${data.risingSign}\n行星位置：${JSON.stringify(data.planets || {})}`

    case 'bazi':
      return `年柱：${data.yearPillar?.stem}${data.yearPillar?.branch}\n月柱：${data.monthPillar?.stem}${data.monthPillar?.branch}\n日柱：${data.dayPillar?.stem}${data.dayPillar?.branch}\n时柱：${data.hourPillar?.stem}${data.hourPillar?.branch}\n五行：${JSON.stringify(data.fiveElements || {})}`

    case 'ziwei':
      const palaces = Object.entries(data.palaces || {}).map(([name, p]: any) =>
        `${name}宫：${p.stars?.join(', ')} - ${p.rating}`
      ).join('\n')
      return palaces

    case 'iching':
      return `卦象：${data.hexagram}\n卦名：${data.name}\n描述：${data.desc}`

    case 'liuyao':
      return `标题：${data.title}\n动爻：${data.lines}\n信息：${data.message}`

    case 'numerology':
      return `生命路径数：${data.lifePathNumber}\n命运数：${data.destinyNumber}\n灵魂数：${data.soulNumber}\n人格数：${data.personalityNumber}`

    default:
      return JSON.stringify(data)
  }
}
