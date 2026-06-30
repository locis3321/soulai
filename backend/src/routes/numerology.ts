import { Router, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { generateSafeDivinationReading, PROMPT_VERSION } from '../lib/ai.js'
import { buildUserContext, formatUserContextForPrompt } from '../lib/userContext.js'
import { db } from '../lib/db.js'
import { z } from 'zod'

const router = Router()

const numerologySchema = z.object({
  birthDate: z.string(),
  name: z.string().optional()
})

// Calculate Numerology (Life Path Number)
router.post('/calculate', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { birthDate, name } = numerologySchema.parse(req.body)

    const userContext = await buildUserContext(userId!)
    const contextPrompt = formatUserContextForPrompt(userContext)

    // Deterministic life path number calculation
    const lifePathNumber = calculateLifePathNumber(birthDate)

    const numerologyData = {
      lifePathNumber,
      name: name || userContext.name,
      birthDate,
      note: 'Life path number is calculated deterministically from birth date. Other numerology aspects (destiny, soul urge) require the full name.'
    }

    const { reading } = await generateSafeDivinationReading({
      divinationType: 'numerology',
      divinationData: numerologyData,
      userContext: contextPrompt,
      language: userContext.language
    })

    await db.query(
      `INSERT INTO astrology_readings (user_id, reading_type, birth_data, reading_text, chart_data, prompt_version, language)
       VALUES ($1, 'numerology', $2, $3, $4, $5, $6)`,
      [userId, JSON.stringify({ birthDate, name }), reading, JSON.stringify(numerologyData), PROMPT_VERSION, userContext.language || 'zh']
    )

    res.json({ reading, data: numerologyData })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Numerology reading error:', error)
    res.status(500).json({ error: 'Failed to generate numerology reading' })
  }
})

function calculateLifePathNumber(birthDate: string): number {
  const digits = birthDate.replace(/-/g, '').split('').map(Number)
  let sum = digits.reduce((a, b) => a + b, 0)
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0)
  }
  return sum
}

export default router
