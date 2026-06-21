import { Router, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { generateSafeDivinationReading } from '../lib/ai.js'
import { buildUserContext, formatUserContextForPrompt } from '../lib/userContext.js'
import { db } from '../lib/db.js'
import { calculateZiWei } from '../services/ziwei.js'
import { z } from 'zod'

const router = Router()

const ziweiSchema = z.object({
  birthDate: z.string(),
  birthTime: z.string().optional(),
  birthPlace: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
})

router.post('/calculate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { birthDate, birthTime, birthPlace, gender } = ziweiSchema.parse(req.body)

    const userContext = await buildUserContext(userId!)
    const contextPrompt = formatUserContextForPrompt(userContext)

    const ziweiData = calculateZiWei({ birthDate, birthTime, gender })

    const { reading } = await generateSafeDivinationReading({
      divinationType: 'ziwei',
      divinationData: ziweiData,
      userContext: contextPrompt,
      language: userContext.language,
    })

    await db.query(
      `INSERT INTO astrology_readings (user_id, reading_type, birth_data, reading_text, chart_data)
       VALUES ($1, 'ziwei', $2, $3, $4)`,
      [userId, JSON.stringify({ birthDate, birthTime, birthPlace, gender }), reading, JSON.stringify(ziweiData)]
    )

    res.json({ reading, data: ziweiData })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('ZiWei reading error:', error)
    res.status(500).json({ error: 'Failed to generate Zi Wei reading' })
  }
})

export default router
