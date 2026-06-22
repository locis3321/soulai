import { Router, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { db } from '../lib/db.js'
import { z } from 'zod'

const router = Router()

const eventSchema = z.object({
  event: z.string().min(1).max(100),
  properties: z.record(z.unknown()).optional(),
  timestamp: z.string().optional(),
})

// Track a single event
router.post('/track', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { event, properties, timestamp } = eventSchema.parse(req.body)

    await db.query(
      `INSERT INTO user_activity (user_id, activity_type, activity_data)
       VALUES ($1, $2, $3)`,
      [userId, event, JSON.stringify({ ...properties, timestamp: timestamp || new Date().toISOString() })]
    )

    res.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Analytics track error:', error)
    res.status(500).json({ error: 'Failed to track event' })
  }
})

// Track multiple events (batch)
router.post('/track/batch', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { events } = req.body

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Events array required' })
    }

    if (events.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 events per batch' })
    }

    const values: any[] = []
    const placeholders: string[] = []
    let paramIndex = 1

    for (const evt of events) {
      const { event, properties, timestamp } = eventSchema.parse(evt)
      values.push(userId, event, JSON.stringify({ ...properties, timestamp: timestamp || new Date().toISOString() }))
      placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`)
      paramIndex += 3
    }

    await db.query(
      `INSERT INTO user_activity (user_id, activity_type, activity_data) VALUES ${placeholders.join(', ')}`,
      values
    )

    res.json({ success: true, tracked: events.length })
  } catch (error) {
    console.error('Analytics batch track error:', error)
    res.status(500).json({ error: 'Failed to track events' })
  }
})

// Get analytics summary (admin only)
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    // Admin check: require X-Admin-Key header matching env var, or dev mode
    const adminKey = process.env.ADMIN_API_KEY
    const providedKey = req.headers['x-admin-key'] as string
    const isDev = process.env.NODE_ENV !== 'production'

    if (!isDev && (!adminKey || providedKey !== adminKey)) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const days = parseInt(req.query.days as string) || 7

    const [events, topEvents, activeUsers] = await Promise.all([
      db.query(
        `SELECT activity_type, COUNT(*) as count FROM user_activity
         WHERE created_at > NOW() - INTERVAL '${days} days'
         GROUP BY activity_type ORDER BY count DESC`,
      ),
      db.query(
        `SELECT activity_type, COUNT(DISTINCT user_id) as unique_users FROM user_activity
         WHERE created_at > NOW() - INTERVAL '${days} days'
         GROUP BY activity_type ORDER BY unique_users DESC LIMIT 10`,
      ),
      db.query(
        `SELECT COUNT(DISTINCT user_id) as active_users FROM user_activity
         WHERE created_at > NOW() - INTERVAL '${days} days'`,
      ),
    ])

    res.json({
      period: `${days} days`,
      totalEvents: events.rows.reduce((sum: number, r: any) => sum + parseInt(r.count), 0),
      eventsByType: events.rows,
      topEvents: topEvents.rows,
      activeUsers: parseInt(activeUsers.rows[0]?.active_users || '0'),
    })
  } catch (error) {
    console.error('Analytics summary error:', error)
    res.status(500).json({ error: 'Failed to get analytics summary' })
  }
})

export default router
