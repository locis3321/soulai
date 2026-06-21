import { Router, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { generateSafeDivinationReading } from '../lib/ai.js'
import { buildUserContext, formatUserContextForPrompt } from '../lib/userContext.js'
import { db } from '../lib/db.js'
import { calculateNatalChart, BirthInput } from '../services/astrology.js'
import { z } from 'zod'

const router = Router()

const astrologySchema = z.object({
  birthDate: z.string(),
  birthTime: z.string().optional(),
  birthPlace: z.string().optional(),
  timezone: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

router.post('/natal-chart', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const input = astrologySchema.parse(req.body)

    const userContext = await buildUserContext(userId!)
    const contextPrompt = formatUserContextForPrompt(userContext)

    const natalChart = calculateNatalChart(input as BirthInput)

    const { reading } = await generateSafeDivinationReading({
      divinationType: 'astrology',
      divinationData: {
        sunSign: natalChart.sunSign,
        moonSign: natalChart.moonSign,
        risingSign: natalChart.risingSign,
        planets: natalChart.planets.map(p => ({
          name: p.name,
          sign: p.sign,
          degree: `${p.degree}°${p.minute}'`,
          retrograde: p.retrograde,
        })),
        ascendant: natalChart.ascendant.sign,
        midheaven: natalChart.midheaven.sign,
      },
      userContext: contextPrompt,
      language: userContext.language,
    })

    await db.query(
      `INSERT INTO astrology_readings (user_id, reading_type, birth_data, reading_text, chart_data)
       VALUES ($1, 'natal', $2, $3, $4)`,
      [userId, JSON.stringify(input), reading, JSON.stringify(natalChart)]
    )

    res.json({ reading, data: natalChart })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Astrology reading error:', error)
    res.status(500).json({ error: 'Failed to generate astrology reading' })
  }
})

export default router
