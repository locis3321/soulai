import { Router, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { generateSafeDivinationReading, PROMPT_VERSION } from '../lib/ai.js'
import { buildUserContext, formatUserContextForPrompt } from '../lib/userContext.js'
import { db } from '../lib/db.js'
import { calculateBaZi } from '../services/bazi.js'
import { z } from 'zod'

const router = Router()

const baziSchema = z.object({
  birthDate: z.string(),
  birthTime: z.string().optional(),
  birthPlace: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
})

router.post('/calculate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { birthDate, birthTime, birthPlace, gender } = baziSchema.parse(req.body)

    const userContext = await buildUserContext(userId!)
    const contextPrompt = formatUserContextForPrompt(userContext)

    const baziData = calculateBaZi({ birthDate, birthTime, gender })

    const { reading } = await generateSafeDivinationReading({
      divinationType: 'bazi',
      divinationData: baziData,
      userContext: contextPrompt,
      language: userContext.language,
    })

    await db.query(
      `INSERT INTO astrology_readings (user_id, reading_type, birth_data, reading_text, chart_data, prompt_version, language)
       VALUES ($1, 'bazi', $2, $3, $4, $5, $6)`,
      [userId, JSON.stringify({ birthDate, birthTime, birthPlace, gender }), reading, JSON.stringify(baziData), PROMPT_VERSION, userContext.language || 'zh']
    )

    res.json({ reading, data: baziData })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('BaZi reading error:', error)
    res.status(500).json({ error: 'Failed to generate BaZi reading' })
  }
})

export default router
