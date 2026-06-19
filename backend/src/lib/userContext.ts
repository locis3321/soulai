import { db } from './db.js'

export interface UserContext {
  // Basic profile
  name: string
  birthDate: string | null
  birthTime: string | null
  birthPlace: string | null
  language: string
  subscriptionTier: string

  // Recent mood
  recentMoods: Array<{ mood: string; note: string | null; date: string }>
  averageMood: string

  // Recent journals
  recentJournals: Array<{ title: string; content: string; mood: string | null; date: string }>

  // Tarot history
  recentTarotReadings: Array<{ question: string; cards: string; date: string }>

  // Chat history summary
  recentChatTopics: string[]

  // User preferences (from profile)
  preferences: Record<string, any>
}

/**
 * Build a comprehensive user context for AI prompts
 */
export async function buildUserContext(userId: string): Promise<UserContext> {
  try {
    // Get user profile
    const userResult = await db.query(
      `SELECT name, birth_date, birth_time, birth_place, language, subscription_tier
       FROM users WHERE id = $1`,
      [userId]
    )
    const user = userResult.rows[0] || {}

    // Get user profile preferences
    const profileResult = await db.query(
      `SELECT preferences, zodiac_sign, rising_sign, moon_sign, life_path_number
       FROM user_profiles WHERE user_id = $1`,
      [userId]
    )
    const profile = profileResult.rows[0] || {}

    // Get recent moods (last 7 days)
    const moodsResult = await db.query(
      `SELECT mood, note, created_at
       FROM mood_checkins
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 7`,
      [userId]
    )
    const recentMoods = moodsResult.rows.map((m: Record<string, unknown>) => ({
      mood: m.mood as string,
      note: m.note as string | null,
      date: m.created_at as string
    }))

    // Calculate average mood
    const moodCounts: Record<string, number> = {}
    recentMoods.forEach(m => { moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1 })
    const averageMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral'

    // Get recent journals (last 5)
    const journalsResult = await db.query(
      `SELECT title, content, mood, created_at
       FROM journals
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    )
    const recentJournals = journalsResult.rows.map((j: any) => ({
      title: j.title,
      content: j.content.substring(0, 200), // Truncate for context
      mood: j.mood,
      date: j.created_at
    }))

    // Get recent tarot readings (last 5)
    const tarotResult = await db.query(
      `SELECT question, cards, created_at
       FROM tarot_readings
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    )
    const recentTarotReadings = tarotResult.rows.map((r: any) => ({
      question: r.question,
      cards: typeof r.cards === 'string' ? r.cards : JSON.stringify(r.cards),
      date: r.created_at
    }))

    // Get recent chat topics (last 10 messages)
    const chatResult = await db.query(
      `SELECT content
       FROM chat_messages
       WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = $1)
         AND role = 'user'
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    )
    const recentChatTopics = chatResult.rows.map((m: any) => m.content.substring(0, 100))

    return {
      name: user.name || 'Seeker',
      birthDate: user.birth_date,
      birthTime: user.birth_time,
      birthPlace: user.birth_place,
      language: user.language || 'zh',
      subscriptionTier: user.subscription_tier || 'free',
      recentMoods,
      averageMood,
      recentJournals,
      recentTarotReadings,
      recentChatTopics,
      preferences: {
        zodiacSign: profile.zodiac_sign,
        risingSign: profile.rising_sign,
        moonSign: profile.moon_sign,
        lifePathNumber: profile.life_path_number,
        ...profile.preferences
      }
    }
  } catch (error) {
    console.error('Failed to build user context:', error)
    return {
      name: 'Seeker',
      birthDate: null,
      birthTime: null,
      birthPlace: null,
      language: 'zh',
      subscriptionTier: 'free',
      recentMoods: [],
      averageMood: 'neutral',
      recentJournals: [],
      recentTarotReadings: [],
      recentChatTopics: [],
      preferences: {}
    }
  }
}

/**
 * Format user context into a readable string for AI prompts
 */
export function formatUserContextForPrompt(ctx: UserContext): string {
  const parts: string[] = []

  // Basic info
  parts.push(`## 用户信息
- 姓名：${ctx.name}
- 出生日期：${ctx.birthDate || '未提供'}
- 出生时间：${ctx.birthTime || '未提供'}
- 出生地点：${ctx.birthPlace || '未提供'}
- 语言：${ctx.language}`)

  // Astrological info
  if (ctx.preferences.zodiacSign) {
    parts.push(`## 星象信息
- 太阳星座：${ctx.preferences.zodiacSign}
- 上升星座：${ctx.preferences.risingSign || '未知'}
- 月亮星座：${ctx.preferences.moonSign || '未知'}
- 生命灵数：${ctx.preferences.lifePathNumber || '未知'}`)
  }

  // Recent mood
  if (ctx.recentMoods.length > 0) {
    const moodLines = ctx.recentMoods.map(m =>
      `- ${m.date}: ${m.mood}${m.note ? ' - ' + m.note : ''}`
    )
    parts.push(`## 近期情绪状态（最近7天）
当前主导情绪：${ctx.averageMood}
${moodLines.join('\n')}`)
  }

  // Recent journals
  if (ctx.recentJournals.length > 0) {
    const journalLines = ctx.recentJournals.map(j =>
      `- 【${j.title}】(${j.date}) ${j.mood ? '情绪:' + j.mood : ''}\n  ${j.content}`
    )
    parts.push(`## 近期日记
${journalLines.join('\n')}`)
  }

  // Recent tarot
  if (ctx.recentTarotReadings.length > 0) {
    const tarotLines = ctx.recentTarotReadings.map(r =>
      `- ${r.date}: ${r.question}`
    )
    parts.push(`## 近期塔罗占卜
${tarotLines.join('\n')}`)
  }

  // Recent chat topics
  if (ctx.recentChatTopics.length > 0) {
    parts.push(`## 近期聊天主题
${ctx.recentChatTopics.map(t => `- ${t}`).join('\n')}`)
  }

  return parts.join('\n\n')
}

export default { buildUserContext, formatUserContextForPrompt }
