import { Router, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { db } from '../lib/db.js'
import { generateDailyInsight } from '../lib/ai.js'
import { buildUserContext, formatUserContextForPrompt } from '../lib/userContext.js'
import { validateAiOutput } from '../lib/safety.js'

const router = Router()

// Daily insight endpoint with user context
router.post('/daily', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { mood, lang } = req.body

    // Build user context for personalized insight
    const userContext = await buildUserContext(userId!)

    // Generate daily insight using MiniMax-M3 with user context
    const insight = await generateDailyInsight(
      userContext.name,
      mood || userContext.averageMood,
      lang || userContext.language
    )

    // Safety: validate AI output
    const validation = validateAiOutput(insight.message, lang || userContext.language)
    if (!validation.safe) {
      console.warn('Insight safety intervention:', validation.issues)
    }

    res.json({
      energy: insight.energy,
      dailyMessage: validation.safe ? insight.message : 'Today brings new opportunities for growth and reflection.'
    })
  } catch (error) {
    console.error('Daily insight error:', error)
    res.status(500).json({ error: 'Failed to generate daily insight' })
  }
})

export default router
