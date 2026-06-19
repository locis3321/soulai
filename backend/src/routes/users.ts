import { Router, Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { db } from '../lib/db.js'
import { z } from 'zod'

const router = Router()

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  birthPlace: z.string().max(200).optional(),
  language: z.enum(['zh', 'en', 'vi', 'th', 'my']).optional()
})

// Get user profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    const result = await db.query(
      `SELECT id, email, name, avatar_url, birth_date, birth_time, birth_place, 
              language, subscription_tier, created_at
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = result.rows[0]

    // Get user profile data
    const profileResult = await db.query(
      `SELECT zodiac_sign, rising_sign, moon_sign, life_path_number, 
              bazi_data, ziwei_data, preferences
       FROM user_profiles 
       WHERE user_id = $1`,
      [userId]
    )

    const profile = profileResult.rows[0] || {}

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        birthDate: user.birth_date,
        birthTime: user.birth_time,
        birthPlace: user.birth_place,
        language: user.language,
        subscriptionTier: user.subscription_tier,
        createdAt: user.created_at
      },
      profile: {
        zodiacSign: profile.zodiac_sign,
        risingSign: profile.rising_sign,
        moonSign: profile.moon_sign,
        lifePathNumber: profile.life_path_number,
        baziData: profile.bazi_data,
        ziweiData: profile.ziwei_data,
        preferences: profile.preferences
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
})

// Update user profile
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const updates = updateProfileSchema.parse(req.body)

    // Build update query dynamically
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`)
      updateValues.push(updates.name)
      paramIndex++
    }

    if (updates.birthDate !== undefined) {
      updateFields.push(`birth_date = $${paramIndex}`)
      updateValues.push(updates.birthDate)
      paramIndex++
    }

    if (updates.birthTime !== undefined) {
      updateFields.push(`birth_time = $${paramIndex}`)
      updateValues.push(updates.birthTime)
      paramIndex++
    }

    if (updates.birthPlace !== undefined) {
      updateFields.push(`birth_place = $${paramIndex}`)
      updateValues.push(updates.birthPlace)
      paramIndex++
    }

    if (updates.language !== undefined) {
      updateFields.push(`language = $${paramIndex}`)
      updateValues.push(updates.language)
      paramIndex++
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(userId)

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND is_active = true
      RETURNING id, email, name, avatar_url, birth_date, birth_time, birth_place, 
                language, subscription_tier, created_at
    `

    const result = await db.query(query, updateValues)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = result.rows[0]

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        birthDate: user.birth_date,
        birthTime: user.birth_time,
        birthPlace: user.birth_place,
        language: user.language,
        subscriptionTier: user.subscription_tier,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// Get user statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    // Get mood check-in count
    const moodCount = await db.query(
      'SELECT COUNT(*) as count FROM mood_checkins WHERE user_id = $1',
      [userId]
    )

    // Get journal count
    const journalCount = await db.query(
      'SELECT COUNT(*) as count FROM journals WHERE user_id = $1',
      [userId]
    )

    // Get tarot reading count
    const tarotCount = await db.query(
      'SELECT COUNT(*) as count FROM tarot_readings WHERE user_id = $1',
      [userId]
    )

    // Get chat session count
    const chatCount = await db.query(
      'SELECT COUNT(*) as count FROM chat_sessions WHERE user_id = $1',
      [userId]
    )

    // Get account age
    const accountAge = await db.query(
      'SELECT created_at FROM users WHERE id = $1',
      [userId]
    )

    const createdAt = accountAge.rows[0]?.created_at
    const daysSinceCreation = createdAt
      ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    res.json({
      stats: {
        moodCheckins: parseInt(moodCount.rows[0]?.count || '0'),
        journals: parseInt(journalCount.rows[0]?.count || '0'),
        tarotReadings: parseInt(tarotCount.rows[0]?.count || '0'),
        chatSessions: parseInt(chatCount.rows[0]?.count || '0'),
        accountAgeDays: daysSinceCreation
      }
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

export default router
