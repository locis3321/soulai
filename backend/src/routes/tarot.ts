import { Router, Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { db } from '../lib/db.js'
import { generateDivinationReading } from '../lib/ai.js'
import { buildUserContext, formatUserContextForPrompt } from '../lib/userContext.js'
import { z } from 'zod'

const router = Router()

// Validation schemas
const tarotReadingSchema = z.object({
  question: z.string().optional(),
  cards: z.array(z.object({
    name: z.string(),
    isReversed: z.boolean()
  })).min(1).max(10),
  spreadType: z.enum(['single', 'three', 'celtic'])
})

// Get tarot reading history
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    const result = await db.query(
      `SELECT id, question, spread_type, cards, reading_text, created_at 
       FROM tarot_readings 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    )

    res.json({ readings: result.rows })
  } catch (error) {
    console.error('Get tarot history error:', error)
    res.status(500).json({ error: 'Failed to get tarot history' })
  }
})

// Create tarot reading with AI interpretation
router.post('/reading', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { question, cards, spreadType } = tarotReadingSchema.parse(req.body)

    // Build user context for AI
    const userContext = await buildUserContext(userId!)
    const contextPrompt = formatUserContextForPrompt(userContext)

    // Generate AI reading with user context
    const readingText = await generateDivinationReading({
      divinationType: 'tarot',
      divinationData: { question, cards, spreadType },
      userContext: contextPrompt,
      language: userContext.language
    })

    // Save reading to database
    const result = await db.query(
      `INSERT INTO tarot_readings (user_id, question, spread_type, cards, reading_text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, question, spread_type, cards, reading_text, created_at`,
      [userId, question || 'General guidance', spreadType, JSON.stringify(cards), readingText]
    )

    res.json({
      reading: readingText,
      readingId: result.rows[0].id
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Tarot reading error:', error)
    res.status(500).json({ error: 'Failed to generate tarot reading' })
  }
})

export default router
