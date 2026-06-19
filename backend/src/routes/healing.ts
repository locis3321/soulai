import { Router, Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { db } from '../lib/db.js'
import { z } from 'zod'

const router = Router()

// Validation schemas
const moodCheckinSchema = z.object({
  mood: z.enum(['calm', 'neutral', 'sad', 'angry', 'tired', 'happy', 'anxious']),
  note: z.string().max(1000).optional(),
  energyScore: z.number().min(0).max(100).optional()
})

const journalSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  mood: z.enum(['calm', 'neutral', 'sad', 'angry', 'tired', 'happy', 'anxious']).optional(),
  tags: z.array(z.string()).max(10).optional()
})

const updateJournalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  mood: z.enum(['calm', 'neutral', 'sad', 'angry', 'tired', 'happy', 'anxious']).optional(),
  tags: z.array(z.string()).max(10).optional()
})

// Mood Check-in Routes

// Get mood history
router.get('/mood/history', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const days = parseInt(req.query.days as string) || 7

    const result = await db.query(
      `SELECT id, mood, note, energy_score, created_at 
       FROM mood_checkins 
       WHERE user_id = $1 
       AND created_at > NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC`,
      [userId]
    )

    res.json({ moods: result.rows })
  } catch (error) {
    console.error('Get mood history error:', error)
    res.status(500).json({ error: 'Failed to get mood history' })
  }
})

// Log mood
router.post('/mood/checkin', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { mood, note, energyScore } = moodCheckinSchema.parse(req.body)

    const result = await db.query(
      `INSERT INTO mood_checkins (user_id, mood, note, energy_score)
       VALUES ($1, $2, $3, $4)
       RETURNING id, mood, note, energy_score, created_at`,
      [userId, mood, note || null, energyScore || null]
    )

    res.status(201).json({ mood: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Log mood error:', error)
    res.status(500).json({ error: 'Failed to log mood' })
  }
})

// Get mood statistics
router.get('/mood/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const days = parseInt(req.query.days as string) || 30

    // Get mood distribution
    const moodDistribution = await db.query(
      `SELECT mood, COUNT(*) as count
       FROM mood_checkins
       WHERE user_id = $1
       AND created_at > NOW() - INTERVAL '${days} days'
       GROUP BY mood
       ORDER BY count DESC`,
      [userId]
    )

    // Get average energy score
    const avgEnergy = await db.query(
      `SELECT AVG(energy_score) as avg_energy
       FROM mood_checkins
       WHERE user_id = $1
       AND energy_score IS NOT NULL
       AND created_at > NOW() - INTERVAL '${days} days'`,
      [userId]
    )

    // Get total check-ins
    const totalCheckins = await db.query(
      `SELECT COUNT(*) as total
       FROM mood_checkins
       WHERE user_id = $1
       AND created_at > NOW() - INTERVAL '${days} days'`,
      [userId]
    )

    res.json({
      moodDistribution: moodDistribution.rows,
      averageEnergy: avgEnergy.rows[0]?.avg_energy || 0,
      totalCheckins: parseInt(totalCheckins.rows[0]?.total || '0')
    })
  } catch (error) {
    console.error('Get mood stats error:', error)
    res.status(500).json({ error: 'Failed to get mood stats' })
  }
})

// Journal Routes

// Get journals
router.get('/journals', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    const result = await db.query(
      `SELECT id, title, content, mood, tags, created_at, updated_at
       FROM journals
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    )

    res.json({ journals: result.rows })
  } catch (error) {
    console.error('Get journals error:', error)
    res.status(500).json({ error: 'Failed to get journals' })
  }
})

// Get journal statistics (must be before /:journalId to avoid route conflict)
router.get('/journals/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    const totalJournals = await db.query(
      'SELECT COUNT(*) as total FROM journals WHERE user_id = $1',
      [userId]
    )

    const journalsByMood = await db.query(
      `SELECT mood, COUNT(*) as count
       FROM journals
       WHERE user_id = $1 AND mood IS NOT NULL
       GROUP BY mood
       ORDER BY count DESC`,
      [userId]
    )

    const recentJournals = await db.query(
      `SELECT COUNT(*) as count
       FROM journals
       WHERE user_id = $1
       AND created_at > NOW() - INTERVAL '7 days'`,
      [userId]
    )

    res.json({
      totalJournals: parseInt(totalJournals.rows[0]?.total || '0'),
      journalsByMood: journalsByMood.rows,
      recentJournals: parseInt(recentJournals.rows[0]?.count || '0')
    })
  } catch (error) {
    console.error('Get journal stats error:', error)
    res.status(500).json({ error: 'Failed to get journal stats' })
  }
})

// Get single journal
router.get('/journals/:journalId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { journalId } = req.params

    const result = await db.query(
      `SELECT id, title, content, mood, tags, created_at, updated_at
       FROM journals
       WHERE id = $1 AND user_id = $2`,
      [journalId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal not found' })
    }

    res.json({ journal: result.rows[0] })
  } catch (error) {
    console.error('Get journal error:', error)
    res.status(500).json({ error: 'Failed to get journal' })
  }
})

// Create journal
router.post('/journals', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { title, content, mood, tags } = journalSchema.parse(req.body)

    const result = await db.query(
      `INSERT INTO journals (user_id, title, content, mood, tags)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, content, mood, tags, created_at, updated_at`,
      [userId, title, content, mood || null, tags || []]
    )

    res.status(201).json({ journal: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Create journal error:', error)
    res.status(500).json({ error: 'Failed to create journal' })
  }
})

// Update journal
router.put('/journals/:journalId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { journalId } = req.params
    const updates = updateJournalSchema.parse(req.body)

    // Check if journal exists and belongs to user
    const existing = await db.query(
      'SELECT id FROM journals WHERE id = $1 AND user_id = $2',
      [journalId, userId]
    )

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Journal not found' })
    }

    // Build update query dynamically
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramIndex = 1

    if (updates.title !== undefined) {
      updateFields.push(`title = $${paramIndex}`)
      updateValues.push(updates.title)
      paramIndex++
    }

    if (updates.content !== undefined) {
      updateFields.push(`content = $${paramIndex}`)
      updateValues.push(updates.content)
      paramIndex++
    }

    if (updates.mood !== undefined) {
      updateFields.push(`mood = $${paramIndex}`)
      updateValues.push(updates.mood)
      paramIndex++
    }

    if (updates.tags !== undefined) {
      updateFields.push(`tags = $${paramIndex}`)
      updateValues.push(updates.tags)
      paramIndex++
    }

    updateFields.push(`updated_at = NOW()`)
    updateValues.push(journalId)
    updateValues.push(userId)

    const query = `
      UPDATE journals 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING id, title, content, mood, tags, created_at, updated_at
    `

    const result = await db.query(query, updateValues)

    res.json({ journal: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Update journal error:', error)
    res.status(500).json({ error: 'Failed to update journal' })
  }
})

// Delete journal
router.delete('/journals/:journalId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { journalId } = req.params

    // Check if journal exists and belongs to user
    const existing = await db.query(
      'SELECT id FROM journals WHERE id = $1 AND user_id = $2',
      [journalId, userId]
    )

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Journal not found' })
    }

    await db.query('DELETE FROM journals WHERE id = $1 AND user_id = $2', [journalId, userId])

    res.json({ message: 'Journal deleted successfully' })
  } catch (error) {
    console.error('Delete journal error:', error)
    res.status(500).json({ error: 'Failed to delete journal' })
  }
})

export default router
