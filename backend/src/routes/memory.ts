import { Router, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { buildUserContext, formatUserContextForPrompt } from '../lib/userContext.js'
import { db } from '../lib/db.js'
import { z } from 'zod'

const router = Router()

// Get user context summary
router.get('/context', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const context = await buildUserContext(userId!)
    res.json({ context })
  } catch (error) {
    console.error('Get user context error:', error)
    res.status(500).json({ error: 'Failed to get user context' })
  }
})

// Get user context formatted for AI
router.get('/context/formatted', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const context = await buildUserContext(userId!)
    const formatted = formatUserContextForPrompt(context)
    res.json({ formatted })
  } catch (error) {
    console.error('Get formatted context error:', error)
    res.status(500).json({ error: 'Failed to get formatted context' })
  }
})

// Update user preferences
const preferencesSchema = z.object({
  zodiacSign: z.string().optional(),
  risingSign: z.string().optional(),
  moonSign: z.string().optional(),
  lifePathNumber: z.number().optional(),
  interests: z.array(z.string()).optional(),
  spiritualGoals: z.array(z.string()).optional(),
  preferredLanguage: z.string().optional()
})

router.put('/preferences', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const preferences = preferencesSchema.parse(req.body)

    // Check if profile exists
    const existing = await db.query(
      'SELECT id FROM user_profiles WHERE user_id = $1',
      [userId]
    )

    if (existing.rows.length === 0) {
      // Create profile
      await db.query(
        `INSERT INTO user_profiles (user_id, preferences)
         VALUES ($1, $2)`,
        [userId, JSON.stringify(preferences)]
      )
    } else {
      // Update profile
      await db.query(
        `UPDATE user_profiles 
         SET preferences = preferences || $2, updated_at = NOW()
         WHERE user_id = $1`,
        [userId, JSON.stringify(preferences)]
      )
    }

    res.json({ message: 'Preferences updated successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Update preferences error:', error)
    res.status(500).json({ error: 'Failed to update preferences' })
  }
})

export default router
