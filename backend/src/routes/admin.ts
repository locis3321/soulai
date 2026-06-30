import { Router, Response } from 'express'
import { authenticateAdmin, AdminRequest, requireAdminPermission, logAudit } from '../middleware/adminAuth.js'
import { db } from '../lib/db.js'
import { z } from 'zod'

const router = Router()

// All admin routes require authentication
router.use(authenticateAdmin)

// ─── Dashboard ───────────────────────────────────────────────────────────

router.get('/dashboard', requireAdminPermission('dashboard.read'), async (req: AdminRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 1
    const interval = `${days} days`

    const [
      users, activeUsers, paidUsers, aiLogs, safetyHits, payments,
      revenue, featureUsage, marketplace, community, aiPerf
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) as c FROM users WHERE created_at > NOW() - INTERVAL '${interval}'`),
      db.query(`SELECT COUNT(DISTINCT user_id) as c FROM user_activity WHERE created_at > NOW() - INTERVAL '${interval}'`),
      db.query(`SELECT COUNT(*) as c FROM users WHERE subscription_tier != 'free' AND is_active = true`),
      db.query(`SELECT COUNT(*) as c, provider, was_fallback FROM ai_request_logs WHERE created_at > NOW() - INTERVAL '${interval}' GROUP BY provider, was_fallback`),
      db.query(`SELECT COUNT(*) as c, event_type FROM safety_events WHERE created_at > NOW() - INTERVAL '${interval}' GROUP BY event_type`),
      db.query(`SELECT COUNT(*) as c, payment_status FROM payments WHERE created_at > NOW() - INTERVAL '${interval}' GROUP BY payment_status`),
      // Revenue
      db.query(`SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM payments WHERE payment_status = 'completed' AND created_at > NOW() - INTERVAL '${interval}'`),
      // Feature usage by request_type
      db.query(`SELECT request_type, COUNT(*) as c FROM ai_request_logs WHERE created_at > NOW() - INTERVAL '${interval}' GROUP BY request_type ORDER BY c DESC`),
      // Marketplace
      db.query(`SELECT
        (SELECT COUNT(*) FROM bookings WHERE created_at > NOW() - INTERVAL '${interval}') as total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND created_at > NOW() - INTERVAL '${interval}') as completed_bookings,
        (SELECT COUNT(*) FROM practitioner_reviews WHERE created_at > NOW() - INTERVAL '${interval}') as reviews,
        (SELECT COUNT(*) FROM practitioners WHERE is_active = true) as active_practitioners`),
      // Community
      db.query(`SELECT
        (SELECT COUNT(*) FROM community_posts WHERE created_at > NOW() - INTERVAL '${interval}') as new_posts,
        (SELECT COUNT(*) FROM community_comments WHERE created_at > NOW() - INTERVAL '${interval}') as new_comments,
        (SELECT COUNT(*) FROM community_posts WHERE is_pinned = true) as pinned_posts`),
      // AI performance
      db.query(`SELECT
        COALESCE(AVG(latency_ms), 0)::int as avg_latency,
        COALESCE(SUM(CASE WHEN was_fallback THEN 1 ELSE 0 END), 0) as failures,
        COUNT(*) as total FROM ai_request_logs WHERE created_at > NOW() - INTERVAL '${interval}'`),
    ])

    const totalAi = parseInt(aiPerf.rows[0]?.total || '0')
    const failures = parseInt(aiPerf.rows[0]?.failures || '0')

    res.json({
      period: `${days}d`,
      newUsers: parseInt(users.rows[0]?.c || '0'),
      activeUsers: parseInt(activeUsers.rows[0]?.c || '0'),
      paidUsers: parseInt(paidUsers.rows[0]?.c || '0'),
      revenue: parseFloat(revenue.rows[0]?.total || '0'),
      revenueCount: parseInt(revenue.rows[0]?.count || '0'),
      aiBreakdown: aiLogs.rows,
      aiTotal: totalAi,
      aiAvgLatency: aiPerf.rows[0]?.avg_latency || 0,
      aiFailureRate: totalAi > 0 ? Math.round(failures / totalAi * 100 * 10) / 10 : 0,
      featureUsage: featureUsage.rows,
      safetyHits: safetyHits.rows,
      paymentBreakdown: payments.rows,
      marketplace: marketplace.rows[0],
      community: community.rows[0],
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    res.status(500).json({ error: 'Failed to load dashboard' })
  }
})

// ─── Users ───────────────────────────────────────────────────────────────

router.get('/users', requireAdminPermission('users.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const search = req.query.search as string
    const language = req.query.language as string
    const tier = req.query.tier as string
    const isActive = req.query.is_active as string
    const isHighRisk = req.query.is_high_risk as string
    const createdAfter = req.query.created_after as string
    const createdBefore = req.query.created_before as string
    const lastActiveAfter = req.query.last_active_after as string
    const lastActiveBefore = req.query.last_active_before as string

    const conditions: string[] = []
    const params: any[] = []

    if (search) {
      const isUuid = search.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      if (isUuid) {
        conditions.push(`u.id = $${params.length + 1}`)
        params.push(search)
      } else {
        conditions.push(`(u.email ILIKE $${params.length + 1} OR u.name ILIKE $${params.length + 1})`)
        params.push(`%${search}%`)
      }
    }
    if (language && language !== 'all') {
      conditions.push(`u.language = $${params.length + 1}`)
      params.push(language)
    }
    if (tier && tier !== 'all') {
      conditions.push(`u.subscription_tier = $${params.length + 1}`)
      params.push(tier)
    }
    if (isActive && isActive !== 'all') {
      conditions.push(`u.is_active = $${params.length + 1}`)
      params.push(isActive === 'true')
    }
    if (isHighRisk && isHighRisk !== 'all') {
      conditions.push(`u.is_high_risk = $${params.length + 1}`)
      params.push(isHighRisk === 'true')
    }
    if (createdAfter) {
      conditions.push(`u.created_at >= $${params.length + 1}`)
      params.push(createdAfter)
    }
    if (createdBefore) {
      conditions.push(`u.created_at <= $${params.length + 1}`)
      params.push(createdBefore)
    }
    if (lastActiveAfter) {
      conditions.push(`EXISTS(SELECT 1 FROM user_activity ua WHERE ua.user_id = u.id AND ua.created_at >= $${params.length + 1})`)
      params.push(lastActiveAfter)
    }
    if (lastActiveBefore) {
      conditions.push(`EXISTS(SELECT 1 FROM user_activity ua WHERE ua.user_id = u.id AND ua.created_at <= $${params.length + 1})`)
      params.push(lastActiveBefore)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`
    const countResult = await db.query(countQuery, params)
    const total = parseInt(countResult.rows[0]?.total || '0')

    const query = `SELECT u.id, u.email, u.name, u.language, u.region, u.subscription_tier,
                          u.is_active, u.is_high_risk, u.created_at,
                          u.birth_date IS NOT NULL as has_birth_data,
                          (SELECT MAX(created_at) FROM user_activity WHERE user_id = u.id) as last_active
                   FROM users u
                   ${whereClause}
                   ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await db.query(query, params)
    res.json({ users: result.rows, total })
  } catch (error) {
    console.error('Admin users error:', error)
    res.status(500).json({ error: 'Failed to list users' })
  }
})

router.get('/users/:userId', requireAdminPermission('users.read'), async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params

    const [
      user, profile, subscriptions, payments, recentActivity,
      chatSessions, tarotReadings, astrologyReadings,
      communityPosts, communityComments,
      bookings, practitionerReviews,
      aiRequestSummary, privacyStatus, notes
    ] = await Promise.all([
      db.query(`SELECT id, email, name, language, region, subscription_tier, is_active,
                        is_high_risk, risk_reason, risk_marked_at, created_at,
                        birth_date, birth_time, birth_place,
                        subscription_start_date, subscription_end_date
                 FROM users WHERE id = $1`, [userId]),
      db.query(`SELECT * FROM user_profiles WHERE user_id = $1`, [userId]),
      db.query(`SELECT tier, start_date, end_date, is_active FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`, [userId]),
      db.query(`SELECT id, order_id, plan_id, amount, currency, payment_status, payment_method, created_at FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`, [userId]),
      db.query(`SELECT activity_type, COUNT(*) as count FROM user_activity WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days' GROUP BY activity_type`, [userId]),
      // Chat sessions with message count and last message
      db.query(`SELECT s.id, s.advisor_key, s.title, s.created_at,
                       (SELECT COUNT(*) FROM chat_messages WHERE session_id = s.id) as message_count,
                       (SELECT content FROM chat_messages WHERE session_id = s.id ORDER BY created_at DESC LIMIT 1) as last_message
                FROM chat_sessions s WHERE s.user_id = $1 ORDER BY s.created_at DESC LIMIT 20`, [userId]),
      // Tarot readings
      db.query(`SELECT id, question, spread_type, cards, LEFT(reading_text, 200) as reading_preview, created_at
                FROM tarot_readings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [userId]),
      // Astrology readings (includes BaZi, ZiWei by reading_type)
      db.query(`SELECT id, reading_type, birth_data, LEFT(reading_text, 200) as reading_preview, created_at
                FROM astrology_readings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [userId]),
      // Community posts
      db.query(`SELECT id, category, title, likes_count, comments_count, is_pinned, created_at
                FROM community_posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [userId]),
      // Community comments
      db.query(`SELECT c.id, c.content, c.created_at, p.title as post_title
                FROM community_comments c JOIN community_posts p ON c.post_id = p.id
                WHERE c.user_id = $1 ORDER BY c.created_at DESC LIMIT 20`, [userId]),
      // Bookings with practitioner name
      db.query(`SELECT b.id, b.booking_date, b.booking_time, b.consultation_mode, b.status, b.created_at,
                       p.name as practitioner_name
                FROM bookings b JOIN practitioners p ON b.practitioner_id = p.id
                WHERE b.user_id = $1 ORDER BY b.created_at DESC LIMIT 20`, [userId]),
      // Practitioner reviews
      db.query(`SELECT r.id, r.rating, r.comment, r.created_at, p.name as practitioner_name
                FROM practitioner_reviews r JOIN practitioners p ON r.practitioner_id = p.id
                WHERE r.user_id = $1 ORDER BY r.created_at DESC LIMIT 20`, [userId]),
      // AI request summary by type
      db.query(`SELECT request_type, COUNT(*) as count, AVG(latency_ms)::int as avg_latency,
                       SUM(tokens_used) as total_tokens, MAX(created_at) as last_used
                FROM ai_request_logs WHERE user_id = $1 GROUP BY request_type ORDER BY count DESC`, [userId]),
      // Privacy status from audit log
      db.query(`SELECT action, created_at FROM admin_audit_logs
                WHERE target_id = $1 AND action IN ('export_user_data', 'delete_user_data')
                ORDER BY created_at DESC LIMIT 5`, [userId]),
      // Internal notes
      db.query(`SELECT n.id, n.note, n.created_at, a.email as admin_email
                FROM admin_user_notes n LEFT JOIN admin_users a ON n.admin_user_id = a.id
                WHERE n.user_id = $1 ORDER BY n.created_at DESC`, [userId]),
    ])

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      user: user.rows[0],
      profile: profile.rows[0] || null,
      subscriptions: subscriptions.rows,
      payments: payments.rows,
      recentActivity: recentActivity.rows,
      chatSessions: chatSessions.rows,
      tarotReadings: tarotReadings.rows,
      astrologyReadings: astrologyReadings.rows,
      communityPosts: communityPosts.rows,
      communityComments: communityComments.rows,
      bookings: bookings.rows,
      practitionerReviews: practitionerReviews.rows,
      aiRequestSummary: aiRequestSummary.rows,
      privacyStatus: privacyStatus.rows,
      notes: notes.rows,
    })
  } catch (error) {
    console.error('Admin user detail error:', error)
    res.status(500).json({ error: 'Failed to get user detail' })
  }
})

// Disable/enable user
router.post('/users/:userId/toggle-active', requireAdminPermission('users.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params
    const { reason } = req.body

    const user = await db.query('SELECT id, is_active FROM users WHERE id = $1', [userId])
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' })

    const newStatus = !user.rows[0].is_active
    await db.query('UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2', [newStatus, userId])

    await logAudit(req.adminUserId!, newStatus ? 'enable_user' : 'disable_user', 'user', userId,
      { is_active: user.rows[0].is_active }, { is_active: newStatus, reason }, req.ip, req.headers['user-agent'])

    res.json({ userId, isActive: newStatus })
  } catch (error) {
    console.error('Toggle user error:', error)
    res.status(500).json({ error: 'Failed to toggle user' })
  }
})

// Update user subscription (manual correction)
router.post('/users/:userId/subscription', requireAdminPermission('payments.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params
    const { tier, reason } = z.object({
      tier: z.enum(['free', 'plus', 'premium']),
      reason: z.string().min(1),
    }).parse(req.body)

    const user = await db.query('SELECT id, subscription_tier FROM users WHERE id = $1', [userId])
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' })

    const oldTier = user.rows[0].subscription_tier
    await db.query('UPDATE users SET subscription_tier = $1, updated_at = NOW() WHERE id = $2', [tier, userId])

    await logAudit(req.adminUserId!, 'manual_subscription_change', 'user', userId,
      { tier: oldTier }, { tier, reason }, req.ip, req.headers['user-agent'])

    res.json({ userId, oldTier, newTier: tier })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Update subscription error:', error)
    res.status(500).json({ error: 'Failed to update subscription' })
  }
})

// ─── Privacy & Compliance ───────────────────────────────────────────────

router.get('/privacy-requests', requireAdminPermission('users.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const type = req.query.type as string
    const status = req.query.status as string

    const conditions: string[] = []
    const params: any[] = []
    if (type && type !== 'all') { conditions.push(`pr.request_type = $${params.length + 1}`); params.push(type) }
    if (status && status !== 'all') { conditions.push(`pr.status = $${params.length + 1}`); params.push(status) }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const query = `SELECT pr.id, pr.request_type, pr.status, pr.processed_at, pr.failure_reason, pr.result_summary, pr.created_at,
                          u.email as user_email, a1.email as requested_by_email, a2.email as processed_by_email
                   FROM privacy_requests pr
                   JOIN users u ON pr.user_id = u.id
                   LEFT JOIN admin_users a1 ON pr.requested_by = a1.id
                   LEFT JOIN admin_users a2 ON pr.processed_by = a2.id
                   ${whereClause}
                   ORDER BY pr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)
    const result = await db.query(query, params)
    res.json({ requests: result.rows })
  } catch (error) { console.error('Privacy requests error:', error); res.status(500).json({ error: 'Failed to list privacy requests' }) }
})

router.get('/compliance-audit', requireAdminPermission('users.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const result = await db.query(
      `SELECT a.id, a.admin_user_id, u.email as admin_email, a.action, a.target_id,
              a.before_data, a.after_data, a.ip, a.user_agent, a.created_at
       FROM admin_audit_logs a LEFT JOIN admin_users u ON a.admin_user_id = u.id
       WHERE a.action IN ('export_user_data', 'delete_user_data')
       ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    res.json({ logs: result.rows })
  } catch (error) { console.error('Compliance audit error:', error); res.status(500).json({ error: 'Failed to list compliance audit' }) }
})

// Export user data (GDPR)
router.get('/users/:userId/export', requireAdminPermission('users.read'), async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params

    // Create privacy request record
    const reqResult = await db.query(
      `INSERT INTO privacy_requests (user_id, request_type, status, requested_by) VALUES ($1, 'export', 'processing', $2) RETURNING id`,
      [userId, req.adminUserId]
    )
    const prId = reqResult.rows[0].id

    const [user, profile, moods, journals, readings, chatSessions, subscriptions] = await Promise.all([
      db.query(`SELECT id, email, name, birth_date, birth_time, birth_place, language, subscription_tier, created_at FROM users WHERE id = $1`, [userId]),
      db.query(`SELECT * FROM user_profiles WHERE user_id = $1`, [userId]),
      db.query(`SELECT mood, note, energy_score, created_at FROM mood_checkins WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT title, content, mood, tags, created_at FROM journals WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT reading_type, birth_data, reading_text, created_at FROM astrology_readings WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT id, advisor_key, title, created_at FROM chat_sessions WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT tier, start_date, end_date, is_active FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
    ])

    await db.query(`UPDATE privacy_requests SET status = 'completed', processed_by = $1, processed_at = NOW(), result_summary = 'Exported all user data' WHERE id = $2`, [req.adminUserId, prId])
    await logAudit(req.adminUserId!, 'export_user_data', 'user', userId, null, null, req.ip, req.headers['user-agent'])

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="user-${userId}-export.json"`)
    res.json({
      exportedAt: new Date().toISOString(),
      user: user.rows[0] || null,
      profile: profile.rows[0] || null,
      moodCheckins: moods.rows,
      journals: journals.rows,
      readings: readings.rows,
      chatSessions: chatSessions.rows.map((s: any) => ({ id: s.id, advisor: s.advisor_key, title: s.title, createdAt: s.created_at })),
      subscriptions: subscriptions.rows,
    })
  } catch (error) {
    console.error('Export user data error:', error)
    await db.query(`UPDATE privacy_requests SET status = 'failed', failure_reason = $1 WHERE user_id = $2 AND request_type = 'export' AND status = 'processing'`, [String(error).slice(0, 500), req.params.userId]).catch(() => {})
    res.status(500).json({ error: 'Failed to export user data' })
  }
})

// Delete user data (GDPR right to erasure)
router.delete('/users/:userId/data', requireAdminPermission('users.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params
    const { reason } = req.body

    if (!reason || typeof reason !== 'string' || reason.length < 1) {
      return res.status(400).json({ error: 'Reason is required for data deletion' })
    }

    const user = await db.query('SELECT id, email FROM users WHERE id = $1', [userId])
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' })

    // Create privacy request record
    const reqResult = await db.query(
      `INSERT INTO privacy_requests (user_id, request_type, status, requested_by) VALUES ($1, 'delete', 'processing', $2) RETURNING id`,
      [userId, req.adminUserId]
    )
    const prId = reqResult.rows[0].id

    await db.query(`DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = $1)`, [userId])
    await db.query(`DELETE FROM chat_sessions WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM mood_checkins WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM journals WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM tarot_readings WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM astrology_readings WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM user_activity WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM subscriptions WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM payments WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM user_profiles WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM community_comments WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM community_likes WHERE user_id = $1`, [userId])
    await db.query(`DELETE FROM community_bookmarks WHERE user_id = $1`, [userId])
    await db.query(`UPDATE users SET email = CONCAT('deleted_', id), name = 'Deleted User', password_hash = NULL, birth_date = NULL, birth_time = NULL, birth_place = NULL, is_active = false WHERE id = $1`, [userId])

    await db.query(`UPDATE privacy_requests SET status = 'completed', processed_by = $1, processed_at = NOW(), result_summary = $2 WHERE id = $3`, [req.adminUserId, reason, prId])
    await logAudit(req.adminUserId!, 'delete_user_data', 'user', userId,
      { email: user.rows[0].email }, { reason }, req.ip, req.headers['user-agent'])

    res.json({ message: 'All personal data deleted. Account deactivated.' })
  } catch (error) {
    console.error('Delete user data error:', error)
    await db.query(`UPDATE privacy_requests SET status = 'failed', failure_reason = $1 WHERE user_id = $2 AND request_type = 'delete' AND status = 'processing'`, [String(error).slice(0, 500), req.params.userId]).catch(() => {})
    res.status(500).json({ error: 'Failed to delete user data' })
  }
})

// Mark/unmark user as high-risk
router.post('/users/:userId/mark-risk', requireAdminPermission('users.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params
    const { reason, isHighRisk } = z.object({
      reason: z.string().optional(),
      isHighRisk: z.boolean(),
    }).parse(req.body)

    const user = await db.query('SELECT id, is_high_risk FROM users WHERE id = $1', [userId])
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' })

    const oldRisk = user.rows[0].is_high_risk
    await db.query(
      `UPDATE users SET is_high_risk = $1, risk_reason = $2, risk_marked_at = $3, risk_marked_by = $4, updated_at = NOW() WHERE id = $5`,
      [isHighRisk, isHighRisk ? (reason || null) : null, isHighRisk ? new Date() : null, isHighRisk ? req.adminUserId : null, userId]
    )

    await logAudit(req.adminUserId!, isHighRisk ? 'mark_high_risk' : 'unmark_high_risk', 'user', userId,
      { is_high_risk: oldRisk }, { is_high_risk: isHighRisk, reason }, req.ip, req.headers['user-agent'])

    res.json({ userId, isHighRisk, reason: isHighRisk ? reason : null })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Mark risk error:', error)
    res.status(500).json({ error: 'Failed to mark user risk' })
  }
})

// Get user notes
router.get('/users/:userId/notes', requireAdminPermission('users.read'), async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params
    const result = await db.query(
      `SELECT n.id, n.note, n.created_at, a.email as admin_email
       FROM admin_user_notes n LEFT JOIN admin_users a ON n.admin_user_id = a.id
       WHERE n.user_id = $1 ORDER BY n.created_at DESC`, [userId]
    )
    res.json({ notes: result.rows })
  } catch (error) {
    console.error('Get user notes error:', error)
    res.status(500).json({ error: 'Failed to get notes' })
  }
})

// Add user note
router.post('/users/:userId/notes', requireAdminPermission('users.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params
    const { note } = z.object({ note: z.string().min(1) }).parse(req.body)

    const user = await db.query('SELECT id FROM users WHERE id = $1', [userId])
    if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' })

    const result = await db.query(
      `INSERT INTO admin_user_notes (user_id, admin_user_id, note) VALUES ($1, $2, $3)
       RETURNING id, note, created_at`,
      [userId, req.adminUserId, note]
    )

    await logAudit(req.adminUserId!, 'add_user_note', 'user', userId, null, { note }, req.ip, req.headers['user-agent'])

    res.json({ note: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Add user note error:', error)
    res.status(500).json({ error: 'Failed to add note' })
  }
})

// ─── Payments ────────────────────────────────────────────────────────────

router.get('/payments', requireAdminPermission('payments.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const status = req.query.status as string
    const method = req.query.method as string
    const refundStatus = req.query.refund_status as string
    const createdAfter = req.query.created_after as string
    const createdBefore = req.query.created_before as string

    const conditions: string[] = []
    const params: any[] = []
    if (status && status !== 'all') { conditions.push(`p.payment_status = $${params.length + 1}`); params.push(status) }
    if (method && method !== 'all') { conditions.push(`p.payment_method = $${params.length + 1}`); params.push(method) }
    if (refundStatus && refundStatus !== 'all') { conditions.push(`p.refund_status = $${params.length + 1}`); params.push(refundStatus) }
    if (createdAfter) { conditions.push(`p.created_at >= $${params.length + 1}`); params.push(createdAfter) }
    if (createdBefore) { conditions.push(`p.created_at <= $${params.length + 1}`); params.push(createdBefore) }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const countResult = await db.query(`SELECT COUNT(*) as total FROM payments p ${whereClause}`, params)
    const total = parseInt(countResult.rows[0]?.total || '0')

    const query = `SELECT p.id, p.order_id, p.plan_id, p.period, p.amount, p.currency,
                          p.payment_method, p.payment_status, p.provider_transaction_id,
                          p.failure_reason, p.refunded_amount, p.refund_status,
                          p.created_at, p.updated_at, u.email as user_email
                   FROM payments p JOIN users u ON p.user_id = u.id
                   ${whereClause}
                   ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)
    const result = await db.query(query, params)
    res.json({ payments: result.rows, total })
  } catch (error) {
    console.error('Admin payments error:', error)
    res.status(500).json({ error: 'Failed to list payments' })
  }
})

// ─── Subscriptions ───────────────────────────────────────────────────────

router.get('/subscriptions', requireAdminPermission('payments.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const tier = req.query.tier as string
    const conditions: string[] = []
    const params: any[] = []
    if (tier && tier !== 'all') { conditions.push(`s.tier = $${params.length + 1}`); params.push(tier) }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const query = `SELECT s.id, s.tier, s.start_date, s.end_date, s.is_active, s.auto_renew, s.created_at, u.email as user_email
                   FROM subscriptions s JOIN users u ON s.user_id = u.id ${whereClause}
                   ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)
    const result = await db.query(query, params)
    res.json({ subscriptions: result.rows })
  } catch (error) { console.error('Admin subscriptions error:', error); res.status(500).json({ error: 'Failed to list subscriptions' }) }
})

// ─── Callback Logs ───────────────────────────────────────────────────────

router.get('/payments/callback-logs', requireAdminPermission('payments.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const paymentId = req.query.payment_id as string
    const conditions: string[] = []
    const params: any[] = []
    if (paymentId) { conditions.push(`l.payment_id = $${params.length + 1}`); params.push(paymentId) }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const query = `SELECT l.id, l.payment_id, l.provider, l.result, l.error_message,
                          LEFT(l.raw_body, 500) as raw_body_preview, l.created_at, p.order_id as payment_order_id
                   FROM payment_callback_logs l LEFT JOIN payments p ON l.payment_id = p.id ${whereClause}
                   ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)
    const result = await db.query(query, params)
    res.json({ logs: result.rows })
  } catch (error) { console.error('Callback logs error:', error); res.status(500).json({ error: 'Failed to list callback logs' }) }
})

// ─── Refunds ─────────────────────────────────────────────────────────────

router.get('/refunds', requireAdminPermission('payments.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const status = req.query.status as string
    const conditions: string[] = []
    const params: any[] = []
    if (status && status !== 'all') { conditions.push(`r.status = $${params.length + 1}`); params.push(status) }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const query = `SELECT r.id, r.payment_id, r.amount, r.reason, r.status, r.created_at, r.processed_at,
                          u.email as user_email, p.order_id as payment_order_id, p.amount as payment_amount, a.email as admin_email
                   FROM refunds r JOIN users u ON r.user_id = u.id JOIN payments p ON r.payment_id = p.id
                   LEFT JOIN admin_users a ON r.admin_user_id = a.id ${whereClause}
                   ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)
    const result = await db.query(query, params)
    res.json({ refunds: result.rows })
  } catch (error) { console.error('Refunds error:', error); res.status(500).json({ error: 'Failed to list refunds' }) }
})

router.post('/payments/:id/refund', requireAdminPermission('payments.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { amount, reason } = z.object({ amount: z.number().positive(), reason: z.string().min(1) }).parse(req.body)
    const payment = await db.query('SELECT id, user_id, amount, payment_status, refunded_amount FROM payments WHERE id = $1', [id])
    if (payment.rows.length === 0) return res.status(404).json({ error: 'Payment not found' })
    const p = payment.rows[0]
    if (p.payment_status !== 'completed') return res.status(400).json({ error: 'Can only refund completed payments' })

    // Include pending refunds in remaining amount check to prevent over-refund
    const pendingResult = await db.query('SELECT COALESCE(SUM(amount), 0) as pending FROM refunds WHERE payment_id = $1 AND status = $2', [id, 'pending'])
    const pendingAmount = parseFloat(pendingResult.rows[0]?.pending || '0')
    const remaining = parseFloat(p.amount) - parseFloat(p.refunded_amount || 0) - pendingAmount
    if (amount > remaining) return res.status(400).json({ error: `Refund exceeds remaining (${remaining.toFixed(2)}, including ${pendingAmount.toFixed(2)} pending)` })

    const result = await db.query(
      `INSERT INTO refunds (payment_id, user_id, amount, reason, status, admin_user_id) VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING id, status, created_at`,
      [id, p.user_id, amount, reason, req.adminUserId])
    await logAudit(req.adminUserId!, 'create_refund', 'payment', id, null, { amount, reason }, req.ip, req.headers['user-agent'])
    res.json({ refund: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Create refund error:', error); res.status(500).json({ error: 'Failed to create refund' })
  }
})

router.post('/refunds/:id/process', requireAdminPermission('payments.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = z.object({ status: z.enum(['completed', 'rejected']) }).parse(req.body)
    const refund = await db.query('SELECT id, payment_id, amount, status FROM refunds WHERE id = $1', [id])
    if (refund.rows.length === 0) return res.status(404).json({ error: 'Refund not found' })
    if (refund.rows[0].status !== 'pending') return res.status(400).json({ error: 'Refund already processed' })
    const r = refund.rows[0]
    await db.query(`UPDATE refunds SET status = $1, processed_at = NOW(), processed_by = $2 WHERE id = $3`, [status, req.adminUserId, id])
    if (status === 'completed') {
      await db.query(`UPDATE payments SET refunded_amount = refunded_amount + $1, refund_status = CASE WHEN refunded_amount + $1 >= amount THEN 'full' ELSE 'partial' END WHERE id = $2`, [r.amount, r.payment_id])
    }
    await logAudit(req.adminUserId!, `refund_${status}`, 'refund', id, { status: 'pending' }, { status }, req.ip, req.headers['user-agent'])
    res.json({ refundId: id, status })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Process refund error:', error); res.status(500).json({ error: 'Failed to process refund' })
  }
})

// ─── Manual Status + Analytics + CSV ─────────────────────────────────────

router.post('/payments/:id/status', requireAdminPermission('payments.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status, reason } = z.object({ status: z.enum(['pending', 'completed', 'failed', 'cancelled']), reason: z.string().min(1) }).parse(req.body)
    const payment = await db.query('SELECT id, order_id, payment_status, user_id, plan_id FROM payments WHERE id = $1', [id])
    if (payment.rows.length === 0) return res.status(404).json({ error: 'Payment not found' })
    const p = payment.rows[0]
    const oldStatus = p.payment_status
    await db.query(`UPDATE payments SET payment_status = $1, failure_reason = CASE WHEN $1 = 'failed' THEN $2 ELSE failure_reason END, updated_at = NOW() WHERE id = $3`, [status, reason, id])
    if (status === 'completed' && oldStatus !== 'completed') {
      const parts = (p.plan_id || 'plus').split('_')
      const tier = parts[0] || 'plus'
      const period = parts[1] || 'monthly'
      const endDate = new Date()
      if (period === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1)
      else endDate.setMonth(endDate.getMonth() + 1)
      await db.query(`UPDATE subscriptions SET is_active = false WHERE user_id = $1 AND is_active = true`, [p.user_id])
      await db.query(`INSERT INTO subscriptions (user_id, tier, start_date, end_date, is_active, auto_renew) VALUES ($1, $2, NOW(), $3, true, true)`, [p.user_id, tier, endDate])
      await db.query('UPDATE users SET subscription_tier = $1 WHERE id = $2', [tier, p.user_id])
    }
    // Rollback: when changing from completed to failed/cancelled, revoke the subscription
    if ((status === 'failed' || status === 'cancelled') && oldStatus === 'completed') {
      await db.query(`UPDATE subscriptions SET is_active = false WHERE user_id = $1 AND tier != 'free'`, [p.user_id])
      const freeTier = await db.query(`SELECT id FROM subscriptions WHERE user_id = $1 AND tier = 'free' AND is_active = true`, [p.user_id])
      if (freeTier.rows.length === 0) {
        await db.query(`INSERT INTO subscriptions (user_id, tier, start_date, end_date, is_active, auto_renew) VALUES ($1, 'free', NOW(), NULL, true, false)`, [p.user_id])
      }
      await db.query('UPDATE users SET subscription_tier = $1 WHERE id = $2', ['free', p.user_id])
    }
    await logAudit(req.adminUserId!, 'manual_payment_status_change', 'payment', id, { status: oldStatus }, { status, reason }, req.ip, req.headers['user-agent'])
    res.json({ paymentId: id, oldStatus, newStatus: status })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Manual status change error:', error); res.status(500).json({ error: 'Failed to change payment status' })
  }
})

router.get('/payments/analytics', requireAdminPermission('payments.read'), async (req: AdminRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30
    const interval = `${days} days`
    const [revenueTrend, arpu, conversion, churn, totals] = await Promise.all([
      db.query(`SELECT DATE(created_at) as date, SUM(amount) as revenue, COUNT(*) as orders FROM payments WHERE payment_status = 'completed' AND created_at > NOW() - INTERVAL '${interval}' GROUP BY DATE(created_at) ORDER BY date DESC`),
      db.query(`SELECT (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'completed') as total_revenue, (SELECT COUNT(DISTINCT user_id) FROM payments WHERE payment_status = 'completed') as paid_users`),
      db.query(`SELECT (SELECT COUNT(DISTINCT user_id) FROM payments WHERE payment_status = 'completed') as paid_users, (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users`),
      db.query(`SELECT COUNT(DISTINCT s.user_id) as churned FROM subscriptions s WHERE s.is_active = false AND s.end_date < NOW() AND s.end_date > NOW() - INTERVAL '30 days'`),
      db.query(`SELECT (SELECT COUNT(*) FROM payments WHERE payment_status = 'pending') as pending_count, (SELECT COUNT(*) FROM payments WHERE payment_status = 'completed') as completed_count, (SELECT COUNT(*) FROM payments WHERE payment_status = 'failed') as failed_count, (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'completed' AND created_at > NOW() - INTERVAL '${interval}') as period_revenue`),
    ])
    const totalRevenue = parseFloat(arpu.rows[0]?.total_revenue || '0')
    const paidUsers = parseInt(arpu.rows[0]?.paid_users || '0')
    const totalActiveUsers = parseInt(conversion.rows[0]?.total_users || '0')
    const churned = parseInt(churn.rows[0]?.churned || '0')
    res.json({
      revenueTrend: revenueTrend.rows,
      arpu: paidUsers > 0 ? totalRevenue / paidUsers : 0,
      totalRevenue, paidUsers,
      conversionRate: totalActiveUsers > 0 ? (paidUsers / totalActiveUsers * 100) : 0,
      churnRate: paidUsers > 0 ? (churned / paidUsers * 100) : 0,
      totals: { pending: parseInt(totals.rows[0]?.pending_count || '0'), completed: parseInt(totals.rows[0]?.completed_count || '0'), failed: parseInt(totals.rows[0]?.failed_count || '0'), periodRevenue: parseFloat(totals.rows[0]?.period_revenue || '0') },
    })
  } catch (error) { console.error('Payment analytics error:', error); res.status(500).json({ error: 'Failed to get analytics' }) }
})

router.get('/payments/export', requireAdminPermission('payments.read'), async (req: AdminRequest, res: Response) => {
  try {
    const status = req.query.status as string
    const method = req.query.method as string
    const conditions: string[] = []
    const params: any[] = []
    if (status && status !== 'all') { conditions.push(`p.payment_status = $${params.length + 1}`); params.push(status) }
    if (method && method !== 'all') { conditions.push(`p.payment_method = $${params.length + 1}`); params.push(method) }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const result = await db.query(
      `SELECT p.order_id, u.email as user_email, p.plan_id, p.period, p.amount, p.currency, p.payment_method, p.payment_status, p.refund_status, p.failure_reason, p.provider_transaction_id, p.created_at, p.updated_at
       FROM payments p JOIN users u ON p.user_id = u.id ${whereClause} ORDER BY p.created_at DESC LIMIT 10000`, params)
    const headers = ['order_id', 'user_email', 'plan_id', 'period', 'amount', 'currency', 'payment_method', 'payment_status', 'refund_status', 'failure_reason', 'provider_transaction_id', 'created_at', 'updated_at']
    const csvLines = [headers.join(',')]
    for (const row of result.rows) {
      const values = headers.map(h => { const v = (row as any)[h]; if (v === null || v === undefined) return ''; const s = String(v).replace(/"/g, '""'); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s })
      csvLines.push(values.join(','))
    }
    await logAudit(req.adminUserId!, 'export_payments_csv', 'payment', '', null, { status, method }, req.ip, req.headers['user-agent'])
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="payments-${new Date().toISOString().slice(0,10)}.csv"`)
    res.send(csvLines.join('\n'))
  } catch (error) { console.error('Export payments error:', error); res.status(500).json({ error: 'Failed to export payments' }) }
})

// ─── Admin User Management ──────────────────────────────────────────────

router.get('/admin-users', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  try {
    // Only owner can list admin users
    if (req.adminRole !== 'owner') return res.status(403).json({ error: 'Only owner can manage admin users' })
    const result = await db.query(
      `SELECT id, email, name, role, is_active, failed_login_attempts, last_failed_at, locked_until, created_at
       FROM admin_users ORDER BY created_at DESC`
    )
    res.json({ admins: result.rows })
  } catch (error) { console.error('List admin users error:', error); res.status(500).json({ error: 'Failed to list admins' }) }
})

router.post('/admin-users/:id/toggle-active', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  try {
    if (req.adminRole !== 'owner') return res.status(403).json({ error: 'Only owner can manage admin users' })
    const { id } = req.params
    if (id === req.adminUserId) return res.status(400).json({ error: 'Cannot disable yourself' })
    const result = await db.query(`UPDATE admin_users SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, is_active`, [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, 'admin_user.toggle_active', 'admin_user', id, null, { is_active: result.rows[0].is_active }, req.ip, req.headers['user-agent'])
    res.json({ admin: result.rows[0] })
  } catch (error) { console.error('Toggle admin error:', error); res.status(500).json({ error: 'Failed to toggle admin' }) }
})

router.post('/admin-users/:id/unlock', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  try {
    if (req.adminRole !== 'owner') return res.status(403).json({ error: 'Only owner can manage admin users' })
    const { id } = req.params
    const result = await db.query(`UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1 RETURNING id, name`, [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, 'admin_user.unlock', 'admin_user', id, null, null, req.ip, req.headers['user-agent'])
    res.json({ admin: result.rows[0] })
  } catch (error) { console.error('Unlock admin error:', error); res.status(500).json({ error: 'Failed to unlock' }) }
})

// Security summary
router.get('/security-summary', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const [failedLogins, lockedAccounts, recentSessions, suspiciousIps, loginStats] = await Promise.all([
      db.query(`SELECT COUNT(*) as count FROM admin_login_history WHERE success = false AND created_at > NOW() - INTERVAL '24 hours'`),
      db.query(`SELECT id, email, locked_until FROM admin_users WHERE locked_until IS NOT NULL AND locked_until > NOW()`),
      db.query(`SELECT COUNT(*) as count FROM admin_sessions WHERE expires_at > NOW()`),
      db.query(`SELECT ip, COUNT(*) as count FROM admin_login_history WHERE success = false AND created_at > NOW() - INTERVAL '1 hour' GROUP BY ip HAVING COUNT(*) > 3 ORDER BY count DESC LIMIT 10`),
      db.query(`SELECT (SELECT COUNT(*) FROM admin_login_history WHERE success = true AND created_at > NOW() - INTERVAL '24 hours') as success_24h,
                       (SELECT COUNT(*) FROM admin_login_history WHERE success = false AND created_at > NOW() - INTERVAL '24 hours') as failed_24h,
                       (SELECT COUNT(*) FROM admin_audit_logs WHERE created_at > NOW() - INTERVAL '24 hours') as audit_24h`),
    ])
    res.json({
      failedLogin24h: parseInt(failedLogins.rows[0]?.count || '0'),
      lockedAccounts: lockedAccounts.rows,
      activeSessions: parseInt(recentSessions.rows[0]?.count || '0'),
      suspiciousIps: suspiciousIps.rows,
      loginStats: {
        success24h: parseInt(loginStats.rows[0]?.success_24h || '0'),
        failed24h: parseInt(loginStats.rows[0]?.failed_24h || '0'),
        audit24h: parseInt(loginStats.rows[0]?.audit_24h || '0'),
      },
    })
  } catch (error) { console.error('Security summary error:', error); res.status(500).json({ error: 'Failed to get security summary' }) }
})

// ─── Operations Analytics ───────────────────────────────────────────────

router.get('/analytics', requireAdminPermission('dashboard.read'), async (req: AdminRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30
    const interval = `${days} days`

    const [
      userGrowth, retention, subscriptionConversion, featureRanking,
      languageBreakdown, aiCostRevenue, marketplaceGmv,
      advisorConversion, communityActivity, funnel
    ] = await Promise.all([
      // User growth: daily registrations
      db.query(`SELECT DATE(created_at) as date, COUNT(*) as new_users FROM users WHERE created_at > NOW() - INTERVAL '${interval}' GROUP BY DATE(created_at) ORDER BY date`),
      // Retention: DAU/WAU/MAU
      db.query(`SELECT
        (SELECT COUNT(DISTINCT user_id) FROM user_activity WHERE created_at > NOW() - INTERVAL '1 day') as dau,
        (SELECT COUNT(DISTINCT user_id) FROM user_activity WHERE created_at > NOW() - INTERVAL '7 days') as wau,
        (SELECT COUNT(DISTINCT user_id) FROM user_activity WHERE created_at > NOW() - INTERVAL '30 days') as mau`),
      // Subscription conversion
      db.query(`SELECT subscription_tier, COUNT(*) as count FROM users WHERE is_active = true GROUP BY subscription_tier`),
      // Feature usage ranking
      db.query(`SELECT request_type, COUNT(*) as count FROM ai_request_logs WHERE created_at > NOW() - INTERVAL '${interval}' AND request_type IS NOT NULL GROUP BY request_type ORDER BY count DESC LIMIT 10`),
      // Language breakdown (users + readings)
      db.query(`SELECT
        u.lang, COUNT(DISTINCT u.id) as users,
        COUNT(DISTINCT t.id) as tarot_readings,
        COUNT(DISTINCT a.id) as astrology_readings
      FROM (SELECT language as lang, id FROM users WHERE language IS NOT NULL UNION ALL SELECT 'zh', id FROM users WHERE language IS NULL) u
      LEFT JOIN tarot_readings t ON t.user_id = u.id AND t.created_at > NOW() - INTERVAL '${interval}'
      LEFT JOIN astrology_readings a ON a.user_id = u.id AND a.created_at > NOW() - INTERVAL '${interval}'
      GROUP BY u.lang ORDER BY users DESC`),
      // AI cost vs revenue comparison
      db.query(`SELECT
        (SELECT COALESCE(SUM(cost_estimate), 0) FROM ai_request_logs WHERE created_at > NOW() - INTERVAL '${interval}') as total_cost,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'completed' AND created_at > NOW() - INTERVAL '${interval}') as total_revenue,
        (SELECT COUNT(*) FROM ai_request_logs WHERE created_at > NOW() - INTERVAL '${interval}') as ai_calls,
        (SELECT COUNT(*) FROM payments WHERE payment_status = 'completed' AND created_at > NOW() - INTERVAL '${interval}') as payment_count`),
      // Marketplace GMV
      db.query(`SELECT
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'completed' AND created_at > NOW() - INTERVAL '${interval}') as gmv
      FROM bookings WHERE created_at > NOW() - INTERVAL '${interval}'`),
      // Advisor conversion
      db.query(`SELECT p.name, p.id,
        COUNT(b.id) as bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed,
        p.rating, p.reviews_count, p.price_per_session
      FROM practitioners p LEFT JOIN bookings b ON b.practitioner_id = p.id AND b.created_at > NOW() - INTERVAL '${interval}'
      GROUP BY p.id, p.name, p.rating, p.reviews_count, p.price_per_session
      ORDER BY bookings DESC LIMIT 10`),
      // Community activity over time
      db.query(`SELECT
        (SELECT DATE(created_at) FROM community_posts WHERE created_at > NOW() - INTERVAL '${interval}' GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 1) as date,
        (SELECT COUNT(*) FROM community_posts WHERE created_at > NOW() - INTERVAL '${interval}') as total_posts,
        (SELECT COUNT(*) FROM community_comments WHERE created_at > NOW() - INTERVAL '${interval}') as total_comments,
        (SELECT COUNT(*) FROM community_likes WHERE created_at > NOW() - INTERVAL '${interval}') as total_likes,
        (SELECT COUNT(*) FROM community_bookmarks WHERE created_at > NOW() - INTERVAL '${interval}') as total_bookmarks`),
      // Funnel: register → first reading → chat → subscribe → repurchase
      db.query(`SELECT
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '${interval}') as registered,
        (SELECT COUNT(DISTINCT user_id) FROM tarot_readings WHERE created_at > NOW() - INTERVAL '${interval}') as first_reading,
        (SELECT COUNT(DISTINCT cs.user_id) FROM chat_messages cm JOIN chat_sessions cs ON cm.session_id = cs.id WHERE cm.created_at > NOW() - INTERVAL '${interval}') as chat_users,
        (SELECT COUNT(DISTINCT user_id) FROM subscriptions WHERE created_at > NOW() - INTERVAL '${interval}' AND tier != 'free') as subscribed,
        (SELECT COUNT(DISTINCT user_id) FROM payments WHERE payment_status = 'completed' AND created_at > NOW() - INTERVAL '${interval}') as paying_users`),
    ])

    res.json({
      userGrowth: userGrowth.rows,
      retention: retention.rows[0],
      subscriptionConversion: subscriptionConversion.rows,
      featureRanking: featureRanking.rows,
      languageBreakdown: languageBreakdown.rows,
      aiCostRevenue: aiCostRevenue.rows[0],
      marketplaceGmv: marketplaceGmv.rows[0],
      advisorConversion: advisorConversion.rows,
      communityActivity: communityActivity.rows[0],
      funnel: funnel.rows[0],
    })
  } catch (error) { console.error('Analytics error:', error); res.status(500).json({ error: 'Failed to get analytics' }) }
})

// Enhanced audit log (with IP and UA)
router.get('/audit-log', requireAdminPermission('dashboard.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const result = await db.query(
      `SELECT a.id, a.admin_user_id, u.email as admin_email, a.action,
              a.target_type, a.target_id, a.before_data, a.after_data,
              a.ip, a.user_agent, a.created_at
       FROM admin_audit_logs a LEFT JOIN admin_users u ON a.admin_user_id = u.id
       ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    res.json({ logs: result.rows })
  } catch (error) { console.error('Audit log error:', error); res.status(500).json({ error: 'Failed to list audit logs' }) }
})

// ─── AI Logs ─────────────────────────────────────────────────────────────

router.get('/ai-logs', requireAdminPermission('ai_logs.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const provider = req.query.provider as string
    const requestType = req.query.request_type as string
    const wasFallback = req.query.was_fallback as string
    const safetyIntercepted = req.query.safety_intercepted as string
    const createdAfter = req.query.created_after as string
    const createdBefore = req.query.created_before as string

    const conditions: string[] = []
    const params: any[] = []
    if (provider && provider !== 'all') { conditions.push(`l.provider = $${params.length + 1}`); params.push(provider) }
    if (requestType && requestType !== 'all') { conditions.push(`l.request_type = $${params.length + 1}`); params.push(requestType) }
    if (wasFallback && wasFallback !== 'all') { conditions.push(`l.was_fallback = $${params.length + 1}`); params.push(wasFallback === 'true') }
    if (safetyIntercepted && safetyIntercepted !== 'all') { conditions.push(`l.safety_intercepted = $${params.length + 1}`); params.push(safetyIntercepted === 'true') }
    if (createdAfter) { conditions.push(`l.created_at >= $${params.length + 1}`); params.push(createdAfter) }
    if (createdBefore) { conditions.push(`l.created_at <= $${params.length + 1}`); params.push(createdBefore) }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const countResult = await db.query(`SELECT COUNT(*) as total FROM ai_request_logs l ${whereClause}`, params)
    const total = parseInt(countResult.rows[0]?.total || '0')

    const query = `SELECT l.id, l.user_id, u.email as user_email, l.provider, l.model,
                          l.request_type, l.latency_ms, l.tokens_used, l.was_fallback,
                          l.fallback_reason, l.prompt_version, l.cost_estimate,
                          l.safety_intercepted, l.safety_reason, l.created_at
                   FROM ai_request_logs l LEFT JOIN users u ON l.user_id = u.id
                   ${whereClause}
                   ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)
    const result = await db.query(query, params)
    res.json({ logs: result.rows, total })
  } catch (error) {
    console.error('Admin AI logs error:', error)
    res.status(500).json({ error: 'Failed to list AI logs' })
  }
})

// AI cost dashboard
router.get('/ai-logs/cost-dashboard', requireAdminPermission('ai_logs.read'), async (req: AdminRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30
    const interval = `${days} days`

    const [byFeature, byUser, summary, byProvider, retryStats] = await Promise.all([
      db.query(`SELECT request_type,
                       COUNT(*) as calls,
                       SUM(cost_estimate) as total_cost,
                       AVG(latency_ms)::int as avg_latency,
                       SUM(tokens_used) as total_tokens,
                       SUM(CASE WHEN was_fallback THEN 1 ELSE 0 END) as fallback_count
                FROM ai_request_logs WHERE created_at > NOW() - INTERVAL '${interval}'
                GROUP BY request_type ORDER BY total_cost DESC NULLS LAST`),
      db.query(`SELECT u.email as user_email, l.user_id,
                       COUNT(*) as calls,
                       SUM(l.cost_estimate) as total_cost,
                       SUM(l.tokens_used) as total_tokens
                FROM ai_request_logs l LEFT JOIN users u ON l.user_id = u.id
                WHERE l.created_at > NOW() - INTERVAL '${interval}'
                GROUP BY l.user_id, u.email ORDER BY total_cost DESC NULLS LAST LIMIT 20`),
      db.query(`SELECT
                  COUNT(*) as total_calls,
                  SUM(cost_estimate) as total_cost,
                  AVG(latency_ms)::int as avg_latency,
                  SUM(CASE WHEN was_fallback THEN 1 ELSE 0 END) as fallback_count,
                  SUM(CASE WHEN safety_intercepted THEN 1 ELSE 0 END) as safety_count,
                  COUNT(DISTINCT user_id) as unique_users
                FROM ai_request_logs WHERE created_at > NOW() - INTERVAL '${interval}'`),
      db.query(`SELECT provider,
                       COUNT(*) as calls,
                       SUM(cost_estimate) as total_cost,
                       AVG(latency_ms)::int as avg_latency,
                       SUM(CASE WHEN was_fallback THEN 1 ELSE 0 END) as failures
                FROM ai_request_logs WHERE created_at > NOW() - INTERVAL '${interval}'
                GROUP BY provider ORDER BY calls DESC`),
      db.query(`SELECT
                  COUNT(CASE WHEN fallback_reason IS NOT NULL AND fallback_reason != '' THEN 1 END) as failed_calls,
                  COUNT(*) as total_calls
                FROM ai_request_logs WHERE created_at > NOW() - INTERVAL '${interval}'`),
    ])

    const totalCalls = parseInt(summary.rows[0]?.total_calls || '0')
    const failedCalls = parseInt(retryStats.rows[0]?.failed_calls || '0')
    const fallbackCount = parseInt(summary.rows[0]?.fallback_count || '0')

    res.json({
      byFeature: byFeature.rows,
      byUser: byUser.rows,
      byProvider: byProvider.rows,
      summary: {
        totalCalls,
        totalCost: parseFloat(summary.rows[0]?.total_cost || '0'),
        avgLatency: summary.rows[0]?.avg_latency || 0,
        fallbackCount,
        safetyCount: parseInt(summary.rows[0]?.safety_count || '0'),
        uniqueUsers: parseInt(summary.rows[0]?.unique_users || '0'),
        failureRate: totalCalls > 0 ? (failedCalls / totalCalls * 100) : 0,
        retryRate: totalCalls > 0 ? (fallbackCount / totalCalls * 100) : 0,
      },
    })
  } catch (error) {
    console.error('AI cost dashboard error:', error)
    res.status(500).json({ error: 'Failed to get cost dashboard' })
  }
})

// Content moderation events
router.get('/content-moderation', requireAdminPermission('safety.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const flagType = req.query.flag_type as string
    const resolved = req.query.resolved as string

    const conditions: string[] = []
    const params: any[] = []
    if (flagType && flagType !== 'all') { conditions.push(`m.flag_type = $${params.length + 1}`); params.push(flagType) }
    if (resolved === 'true') { conditions.push(`m.resolved = true`) }
    else if (resolved === 'false') { conditions.push(`m.resolved = false`) }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const query = `SELECT m.id, m.user_id, u.email as user_email, m.source, m.content_snippet,
                          m.flag_type, m.severity, m.action_taken, m.resolved, m.resolved_by,
                          m.resolved_at, m.created_at
                   FROM content_moderation_events m LEFT JOIN users u ON m.user_id = u.id
                   ${whereClause}
                   ORDER BY m.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)
    const result = await db.query(query, params)
    res.json({ events: result.rows })
  } catch (error) {
    console.error('Content moderation error:', error)
    res.status(500).json({ error: 'Failed to list moderation events' })
  }
})

router.post('/content-moderation/:id/resolve', requireAdminPermission('safety.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { notes } = req.body
    await db.query(`UPDATE content_moderation_events SET resolved = true, resolved_by = $1, resolved_at = NOW() WHERE id = $2`, [req.adminUserId, id])
    await logAudit(req.adminUserId!, 'resolve_moderation_event', 'content_moderation', id, null, { notes }, req.ip, req.headers['user-agent'])
    res.json({ resolved: true })
  } catch (error) {
    console.error('Resolve moderation error:', error)
    res.status(500).json({ error: 'Failed to resolve' })
  }
})

// ─── Reading Records ─────────────────────────────────────────────────────

router.get('/readings', requireAdminPermission('ai_logs.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const type = req.query.type as string
    const isReported = req.query.is_reported as string
    const isFlagged = req.query.is_flagged as string
    const language = req.query.language as string
    const createdAfter = req.query.created_after as string
    const createdBefore = req.query.created_before as string

    const conditions: string[] = []
    const params: any[] = []

    if (type && type !== 'all') {
      if (['tarot', 'astrology', 'bazi', 'ziwei', 'numerology'].includes(type)) {
        if (type === 'tarot') { conditions.push(`(t.type = 'tarot')`) }
        else { conditions.push(`(t.type = 'astrology' AND t.reading_type = $${params.length + 1})`); params.push(type) }
      }
    }
    if (isReported && isReported !== 'all') { conditions.push(`t.is_reported = $${params.length + 1}`); params.push(isReported === 'true') }
    if (isFlagged && isFlagged !== 'all') { conditions.push(`t.is_flagged = $${params.length + 1}`); params.push(isFlagged === 'true') }
    if (language && language !== 'all') { conditions.push(`t.language = $${params.length + 1}`); params.push(language) }
    if (createdAfter) { conditions.push(`t.created_at >= $${params.length + 1}`); params.push(createdAfter) }
    if (createdBefore) { conditions.push(`t.created_at <= $${params.length + 1}`); params.push(createdBefore) }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const query = `SELECT t.id, t.type, t.reading_type, t.user_id, u.email as user_email, t.prompt_version, t.language,
                          t.is_reported, t.report_reason, t.is_flagged, t.flag_reason, t.created_at
                   FROM (
                     SELECT id, 'tarot' as type, 'tarot' as reading_type, user_id, prompt_version, language,
                            is_reported, report_reason, is_flagged, flag_reason, created_at FROM tarot_readings
                     UNION ALL
                     SELECT id, 'astrology' as type, reading_type, user_id, prompt_version, language,
                            is_reported, report_reason, is_flagged, flag_reason, created_at FROM astrology_readings
                   ) t
                   LEFT JOIN users u ON t.user_id = u.id
                   ${whereClause}
                   ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await db.query(query, params)
    res.json({ readings: result.rows })
  } catch (error) {
    console.error('Admin readings error:', error)
    res.status(500).json({ error: 'Failed to list readings' })
  }
})

router.get('/readings/:type/:id', requireAdminPermission('ai_logs.read'), async (req: AdminRequest, res: Response) => {
  try {
    const { type, id } = req.params
    let query: string
    if (type === 'tarot') {
      query = `SELECT t.*, u.email as user_email FROM tarot_readings t LEFT JOIN users u ON t.user_id = u.id WHERE t.id = $1`
    } else {
      query = `SELECT t.*, u.email as user_email FROM astrology_readings t LEFT JOIN users u ON t.user_id = u.id WHERE t.id = $1`
    }
    const result = await db.query(query, [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reading not found' })
    res.json({ reading: result.rows[0] })
  } catch (error) {
    console.error('Admin reading detail error:', error)
    res.status(500).json({ error: 'Failed to get reading detail' })
  }
})

router.post('/readings/:type/:id/flag', requireAdminPermission('safety.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { type, id } = req.params
    const { reason, isFlagged } = z.object({ reason: z.string().optional(), isFlagged: z.boolean() }).parse(req.body)
    const table = type === 'tarot' ? 'tarot_readings' : 'astrology_readings'
    const result = await db.query(
      `UPDATE ${table} SET is_flagged = $1, flag_reason = $2, flag_marked_at = CASE WHEN $1 THEN NOW() ELSE NULL END, flag_marked_by = CASE WHEN $1 THEN $3 ELSE NULL END WHERE id = $4 RETURNING id`,
      [isFlagged, isFlagged ? (reason || null) : null, req.adminUserId, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reading not found' })
    await logAudit(req.adminUserId!, isFlagged ? 'flag_reading' : 'unflag_reading', 'reading', id, null, { type, isFlagged, reason }, req.ip, req.headers['user-agent'])
    res.json({ readingId: id, isFlagged })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Flag reading error:', error)
    res.status(500).json({ error: 'Failed to flag reading' })
  }
})

router.get('/reading-reports', requireAdminPermission('safety.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const resolved = req.query.resolved as string
    const conditions: string[] = []
    const params: any[] = []
    if (resolved === 'true') { conditions.push('r.resolved = true') }
    else if (resolved === 'false') { conditions.push('r.resolved = false') }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const query = `SELECT r.*, u.email as user_email FROM reading_reports r
                   LEFT JOIN users u ON r.user_id = u.id ${whereClause}
                   ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)
    const result = await db.query(query, params)
    res.json({ reports: result.rows })
  } catch (error) {
    console.error('Admin reading reports error:', error)
    res.status(500).json({ error: 'Failed to list reading reports' })
  }
})

// ─── Safety Events ───────────────────────────────────────────────────────

router.get('/safety-events', requireAdminPermission('safety.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const resolved = req.query.resolved as string
    const eventType = req.query.event_type as string
    const severity = req.query.severity as string
    const createdAfter = req.query.created_after as string

    const conditions: string[] = []
    const params: any[] = []
    if (resolved === 'true') { conditions.push(`s.resolved = true`) }
    else if (resolved === 'false') { conditions.push(`s.resolved = false`) }
    if (eventType && eventType !== 'all') { conditions.push(`s.event_type = $${params.length + 1}`); params.push(eventType) }
    if (severity && severity !== 'all') { conditions.push(`s.severity = $${params.length + 1}`); params.push(severity) }
    if (createdAfter) { conditions.push(`s.created_at >= $${params.length + 1}`); params.push(createdAfter) }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const query = `SELECT s.id, s.user_id, u.email as user_email, s.event_type,
                          s.severity, s.source, s.content_snippet, s.resolved,
                          s.resolved_by, s.resolved_at, s.resolution_notes,
                          s.ai_request_log_id, s.created_at
                   FROM safety_events s LEFT JOIN users u ON s.user_id = u.id
                   ${whereClause}
                   ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)
    const result = await db.query(query, params)
    res.json({ events: result.rows })
  } catch (error) {
    console.error('Admin safety events error:', error)
    res.status(500).json({ error: 'Failed to list safety events' })
  }
})

router.post('/safety-events/:id/resolve', requireAdminPermission('safety.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { notes } = req.body

    await db.query(
      `UPDATE safety_events SET resolved = true, resolved_by = $1, resolved_at = NOW(), resolution_notes = $2 WHERE id = $3`,
      [req.adminUserId, notes || null, id]
    )

    await logAudit(req.adminUserId!, 'resolve_safety_event', 'safety_event', id, null, { resolved: true, notes }, req.ip, req.headers['user-agent'])

    res.json({ resolved: true })
  } catch (error) {
    console.error('Resolve safety event error:', error)
    res.status(500).json({ error: 'Failed to resolve event' })
  }
})

// ─── Feature Flags ───────────────────────────────────────────────────────

router.get('/feature-flags', requireAdminPermission('config.read'), async (_req: AdminRequest, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM feature_flags ORDER BY key')
    res.json({ flags: result.rows })
  } catch (error) {
    console.error('Feature flags error:', error)
    res.status(500).json({ error: 'Failed to list feature flags' })
  }
})

router.post('/feature-flags', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { key, value, description } = z.object({
      key: z.string().min(1),
      value: z.boolean(),
      description: z.string().optional(),
    }).parse(req.body)

    await db.query(
      `INSERT INTO feature_flags (key, value, description, updated_by) VALUES ($1, $2, $3, $4)
       ON CONFLICT (key) DO UPDATE SET value = $2, description = $3, updated_by = $4, updated_at = NOW()`,
      [key, value, description || null, req.adminUserId]
    )

    await logAudit(req.adminUserId!, 'update_feature_flag', 'feature_flag', key, null, { key, value }, req.ip, req.headers['user-agent'])

    res.json({ key, value })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Update feature flag error:', error)
    res.status(500).json({ error: 'Failed to update feature flag' })
  }
})

// ─── Prompt Configs ─────────────────────────────────────────────────────

router.get('/prompt-configs', requireAdminPermission('config.read'), async (_req: AdminRequest, res: Response) => {
  try {
    const result = await db.query(
      `SELECT key, system_prompt, user_prompt_template, version, updated_at FROM prompt_configs ORDER BY key`
    )
    res.json({ configs: result.rows })
  } catch (error) {
    console.error('Prompt configs error:', error)
    res.status(500).json({ error: 'Failed to list prompt configs' })
  }
})

router.post('/prompt-configs', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { key, systemPrompt, userPromptTemplate, version } = z.object({
      key: z.string().min(1),
      systemPrompt: z.string().min(1),
      userPromptTemplate: z.string().optional(),
      version: z.string().optional(),
    }).parse(req.body)

    // Get before state for audit
    const before = await db.query('SELECT * FROM prompt_configs WHERE key = $1', [key])

    await db.query(
      `INSERT INTO prompt_configs (key, system_prompt, user_prompt_template, version, updated_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (key) DO UPDATE SET system_prompt = $2, user_prompt_template = $3, version = $4, updated_by = $5, updated_at = NOW()`,
      [key, systemPrompt, userPromptTemplate || null, version || 'v1', req.adminUserId]
    )

    await logAudit(req.adminUserId!, 'update_prompt_config', 'prompt_config', key,
      before.rows[0] || null, { key, systemPrompt, version }, req.ip, req.headers['user-agent'])

    res.json({ key, updated: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Update prompt config error:', error)
    res.status(500).json({ error: 'Failed to update prompt config' })
  }
})

// ─── System Config ──────────────────────────────────────────────────────

router.get('/system-config', requireAdminPermission('config.read'), async (_req: AdminRequest, res: Response) => {
  try {
    const result = await db.query('SELECT key, value, description, updated_at FROM system_configs ORDER BY key')
    res.json({ configs: result.rows })
  } catch (error) {
    console.error('System config error:', error)
    res.status(500).json({ error: 'Failed to list system configs' })
  }
})

router.post('/system-config', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { key, value, description } = z.object({
      key: z.string().min(1),
      value: z.string(),
      description: z.string().optional(),
    }).parse(req.body)

    const before = await db.query('SELECT * FROM system_configs WHERE key = $1', [key])

    await db.query(
      `INSERT INTO system_configs (key, value, description, updated_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key) DO UPDATE SET value = $2, description = $3, updated_by = $4, updated_at = NOW()`,
      [key, value, description || null, req.adminUserId]
    )

    await logAudit(req.adminUserId!, 'update_system_config', 'system_config', key,
      before.rows[0] || null, { key, value }, req.ip, req.headers['user-agent'])

    res.json({ key, value })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Update system config error:', error)
    res.status(500).json({ error: 'Failed to update system config' })
  }
})


// ─── Marketplace: Enhanced Practitioner Management ──────────────────────

router.get('/practitioners', requireAdminPermission('config.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const search = req.query.search as string
    const reviewStatus = req.query.review_status as string
    const isFrozen = req.query.is_frozen as string
    const isVerified = req.query.is_verified as string

    const conditions: string[] = []
    const params: any[] = []
    if (search) { conditions.push(`(p.name ILIKE $${params.length + 1} OR p.location ILIKE $${params.length + 1})`); params.push(`%${search}%`) }
    if (reviewStatus && reviewStatus !== 'all') { conditions.push(`p.review_status = $${params.length + 1}`); params.push(reviewStatus) }
    if (isFrozen && isFrozen !== 'all') { conditions.push(`p.is_frozen = $${params.length + 1}`); params.push(isFrozen === 'true') }
    if (isVerified && isVerified !== 'all') { conditions.push(`p.is_verified = $${params.length + 1}`); params.push(isVerified === 'true') }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const countResult = await db.query(`SELECT COUNT(*) as total FROM practitioners p ${whereClause}`, params)
    const total = parseInt(countResult.rows[0]?.total || '0')

    const query = `SELECT p.id, p.name, p.avatar, p.specialties, p.rating, p.reviews_count, p.experience_years,
                          p.location, p.price_per_session, p.is_verified, p.is_active, p.review_status,
                          p.complaint_count, p.recommend_weight, p.is_frozen, p.created_at,
                          (SELECT COUNT(*) FROM bookings WHERE practitioner_id = p.id) as booking_count,
                          (SELECT COUNT(*) FROM bookings WHERE practitioner_id = p.id AND status = 'completed') as completed_count
                   FROM practitioners p ${whereClause}
                   ORDER BY p.recommend_weight DESC, p.rating DESC, p.created_at DESC
                   LIMIT $${params.length + 1}`
    params.push(limit)
    const result = await db.query(query, params)
    res.json({ practitioners: result.rows, total })
  } catch (error) {
    console.error('List practitioners error:', error)
    res.status(500).json({ error: 'Failed to list practitioners' })
  }
})

router.get('/practitioners/:id', requireAdminPermission('config.read'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const [practitioner, reviews, bookings, complaints] = await Promise.all([
      db.query(`SELECT * FROM practitioners WHERE id = $1`, [id]),
      db.query(`SELECT r.*, u.email as user_email FROM practitioner_reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.practitioner_id = $1 ORDER BY r.created_at DESC`, [id]),
      db.query(`SELECT b.*, u.email as user_email FROM bookings b LEFT JOIN users u ON b.user_id = u.id WHERE b.practitioner_id = $1 ORDER BY b.created_at DESC LIMIT 30`, [id]),
      db.query(`SELECT c.*, u.email as user_email FROM practitioner_complaints c LEFT JOIN users u ON c.user_id = u.id WHERE c.practitioner_id = $1 ORDER BY c.created_at DESC`, [id]),
    ])
    if (practitioner.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ practitioner: practitioner.rows[0], reviews: reviews.rows, bookings: bookings.rows, complaints: complaints.rows })
  } catch (error) {
    console.error('Practitioner detail error:', error)
    res.status(500).json({ error: 'Failed to get practitioner detail' })
  }
})

router.post('/practitioners/:id/approve', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const result = await db.query(`UPDATE practitioners SET review_status = 'approved', is_verified = true WHERE id = $1 RETURNING id, name, review_status`, [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, 'practitioner.approve', 'practitioner', id, null, { review_status: 'approved' }, req.ip, req.headers['user-agent'])
    res.json({ practitioner: result.rows[0] })
  } catch (error) { console.error('Approve practitioner error:', error); res.status(500).json({ error: 'Failed to approve' }) }
})

router.post('/practitioners/:id/reject', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { reason } = req.body
    const result = await db.query(`UPDATE practitioners SET review_status = 'rejected', is_active = false WHERE id = $1 RETURNING id, name, review_status`, [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, 'practitioner.reject', 'practitioner', id, null, { review_status: 'rejected', reason }, req.ip, req.headers['user-agent'])
    res.json({ practitioner: result.rows[0] })
  } catch (error) { console.error('Reject practitioner error:', error); res.status(500).json({ error: 'Failed to reject' }) }
})

router.post('/practitioners/:id/freeze', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { reason, isFrozen } = z.object({ reason: z.string().optional(), isFrozen: z.boolean() }).parse(req.body)
    const result = await db.query(
      `UPDATE practitioners SET is_frozen = $1, frozen_reason = $2, frozen_at = CASE WHEN $1 THEN NOW() ELSE NULL END, is_active = CASE WHEN $1 THEN false ELSE is_active END WHERE id = $3 RETURNING id, name, is_frozen`,
      [isFrozen, isFrozen ? (reason || null) : null, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, isFrozen ? 'practitioner.freeze' : 'practitioner.unfreeze', 'practitioner', id, null, { is_frozen: isFrozen, reason }, req.ip, req.headers['user-agent'])
    res.json({ practitioner: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Freeze practitioner error:', error); res.status(500).json({ error: 'Failed to freeze' })
  }
})

router.post('/practitioners/:id/weight', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { weight } = z.object({ weight: z.number().min(0).max(100) }).parse(req.body)
    const result = await db.query(`UPDATE practitioners SET recommend_weight = $1 WHERE id = $2 RETURNING id, name, recommend_weight`, [weight, id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, 'practitioner.set_weight', 'practitioner', id, null, { recommend_weight: weight }, req.ip, req.headers['user-agent'])
    res.json({ practitioner: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Set weight error:', error); res.status(500).json({ error: 'Failed to set weight' })
  }
})

router.post('/practitioners/:id/notes', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { notes } = z.object({ notes: z.string() }).parse(req.body)
    const result = await db.query(`UPDATE practitioners SET admin_notes = $1 WHERE id = $2 RETURNING id, admin_notes`, [notes, id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ practitioner: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Set notes error:', error); res.status(500).json({ error: 'Failed to set notes' })
  }
})

router.post('/practitioners/:id/toggle-verify', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const result = await db.query(`UPDATE practitioners SET is_verified = NOT is_verified WHERE id = $1 RETURNING id, name, is_verified`, [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, 'practitioner.toggle_verify', 'practitioner', id, null, { is_verified: result.rows[0].is_verified }, req.ip, req.headers['user-agent'])
    res.json({ practitioner: result.rows[0] })
  } catch (error) { console.error('Toggle verify error:', error); res.status(500).json({ error: 'Failed to toggle verify' }) }
})

router.post('/practitioners/:id/toggle-active', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const result = await db.query(`UPDATE practitioners SET is_active = NOT is_active WHERE id = $1 RETURNING id, name, is_active`, [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, 'practitioner.toggle_active', 'practitioner', id, null, { is_active: result.rows[0].is_active }, req.ip, req.headers['user-agent'])
    res.json({ practitioner: result.rows[0] })
  } catch (error) { console.error('Toggle active error:', error); res.status(500).json({ error: 'Failed to toggle active' }) }
})

// ─── Reviews Management ────────────────────────────────────────────────

router.get('/reviews', requireAdminPermission('safety.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const practitionerId = req.query.practitioner_id as string
    const flaggedOnly = req.query.flagged as string
    const anomalyOnly = req.query.anomaly as string
    const conditions: string[] = []
    const params: any[] = []
    if (practitionerId) { conditions.push(`r.practitioner_id = $${params.length + 1}`); params.push(practitionerId) }
    if (flaggedOnly === 'true') { conditions.push(`r.is_flagged = true`) }
    if (anomalyOnly === 'true') { conditions.push(`r.is_anomaly = true`) }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const query = `SELECT r.*, u.email as user_email, p.name as practitioner_name,
                          EXISTS(SELECT 1 FROM bookings b WHERE b.id = r.booking_id AND b.status = 'completed') as has_completed_booking,
                          (SELECT COUNT(*) FROM practitioner_reviews r2 WHERE r2.user_id = r.user_id AND r2.created_at > NOW() - INTERVAL '7 days') as user_review_count_7d,
                          (SELECT COUNT(*) FROM practitioner_reviews r3 WHERE r3.user_ip = r.user_ip AND r3.created_at > NOW() - INTERVAL '7 days') as ip_review_count_7d
                   FROM practitioner_reviews r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN practitioners p ON r.practitioner_id = p.id
                   ${whereClause} ORDER BY r.created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)
    const result = await db.query(query, params)
    res.json({ reviews: result.rows })
  } catch (error) { console.error('List reviews error:', error); res.status(500).json({ error: 'Failed to list reviews' }) }
})

router.get('/reviews/anomaly-detect', requireAdminPermission('safety.read'), async (req: AdminRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7
    const interval = `${days} days`

    const [frequentReviewers, noBooking, ipClusters, ratingSpike] = await Promise.all([
      // Same user reviewing multiple practitioners in short time
      db.query(`SELECT u.email, r.user_id, COUNT(*) as review_count, COUNT(DISTINCT r.practitioner_id) as practitioner_count
                FROM practitioner_reviews r JOIN users u ON r.user_id = u.id
                WHERE r.created_at > NOW() - INTERVAL '${interval}'
                GROUP BY r.user_id, u.email
                HAVING COUNT(DISTINCT r.practitioner_id) > 1 AND COUNT(*) > 2
                ORDER BY review_count DESC LIMIT 20`),
      // Reviews without completed bookings
      db.query(`SELECT r.id, r.user_id, u.email, r.rating, r.comment, r.created_at,
                       p.name as practitioner_name
                FROM practitioner_reviews r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN practitioners p ON r.practitioner_id = p.id
                WHERE r.created_at > NOW() - INTERVAL '${interval}'
                AND (r.booking_id IS NULL OR NOT EXISTS(
                  SELECT 1 FROM bookings b WHERE b.id = r.booking_id AND b.status = 'completed'
                ))
                ORDER BY r.created_at DESC LIMIT 20`),
      // Same IP from different users
      db.query(`SELECT r.user_ip, COUNT(DISTINCT r.user_id) as distinct_users, COUNT(*) as review_count,
                       array_agg(DISTINCT u.email) as emails
                FROM practitioner_reviews r JOIN users u ON r.user_id = u.id
                WHERE r.user_ip IS NOT NULL AND r.user_ip != ''
                AND r.created_at > NOW() - INTERVAL '${interval}'
                GROUP BY r.user_ip
                HAVING COUNT(DISTINCT r.user_id) > 1
                ORDER BY review_count DESC LIMIT 20`),
      // Rating spike: practitioner's recent avg deviates from historical
      db.query(`SELECT p.id, p.name,
                       AVG(CASE WHEN r.created_at > NOW() - INTERVAL '7 days' THEN r.rating END)::numeric(3,2) as recent_avg,
                       AVG(CASE WHEN r.created_at <= NOW() - INTERVAL '7 days' THEN r.rating END)::numeric(3,2) as historical_avg,
                       COUNT(CASE WHEN r.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_count
                FROM practitioner_reviews r JOIN practitioners p ON r.practitioner_id = p.id
                GROUP BY p.id, p.name
                HAVING COUNT(CASE WHEN r.created_at > NOW() - INTERVAL '7 days' THEN 1 END) >= 3
                AND ABS(AVG(CASE WHEN r.created_at > NOW() - INTERVAL '7 days' THEN r.rating END) -
                       AVG(CASE WHEN r.created_at <= NOW() - INTERVAL '7 days' THEN r.rating END)) > 1.5
                ORDER BY ABS(AVG(CASE WHEN r.created_at > NOW() - INTERVAL '7 days' THEN r.rating END) -
                             AVG(CASE WHEN r.created_at <= NOW() - INTERVAL '7 days' THEN r.rating END)) DESC LIMIT 10`),
    ])

    res.json({
      frequentReviewers: frequentReviewers.rows,
      noBookingReviews: noBooking.rows,
      ipClusters: ipClusters.rows.map((r: any) => ({ ...r, emails: r.emails?.slice(0, 5) })),
      ratingSpikes: ratingSpike.rows,
      summary: {
        frequentReviewerCount: frequentReviewers.rows.length,
        noBookingCount: noBooking.rows.length,
        ipClusterCount: ipClusters.rows.length,
        ratingSpikeCount: ratingSpike.rows.length,
      },
    })
  } catch (error) {
    console.error('Anomaly detection error:', error)
    res.status(500).json({ error: 'Failed to detect anomalies' })
  }
})

router.post('/reviews/:id/flag', requireAdminPermission('safety.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { isFlagged } = z.object({ isFlagged: z.boolean() }).parse(req.body)
    const result = await db.query(`UPDATE practitioner_reviews SET is_flagged = $1 WHERE id = $2 RETURNING id, is_flagged`, [isFlagged, id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, isFlagged ? 'review.flag' : 'review.unflag', 'practitioner_review', id, null, { is_flagged: isFlagged }, req.ip, req.headers['user-agent'])
    res.json({ review: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Flag review error:', error); res.status(500).json({ error: 'Failed to flag' })
  }
})

router.post('/reviews/:id/hide', requireAdminPermission('safety.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { isHidden } = z.object({ isHidden: z.boolean() }).parse(req.body)
    const result = await db.query(`UPDATE practitioner_reviews SET is_hidden = $1 WHERE id = $2 RETURNING id, is_hidden`, [isHidden, id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, isHidden ? 'review.hide' : 'review.unhide', 'practitioner_review', id, null, { is_hidden: isHidden }, req.ip, req.headers['user-agent'])
    res.json({ review: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Hide review error:', error); res.status(500).json({ error: 'Failed to hide' })
  }
})

router.delete('/reviews/:id', requireAdminPermission('safety.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const review = await db.query('SELECT id, practitioner_id FROM practitioner_reviews WHERE id = $1', [id])
    if (review.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await db.query('DELETE FROM practitioner_reviews WHERE id = $1', [id])
    await db.query(`UPDATE practitioners SET reviews_count = GREATEST(reviews_count - 1, 0), rating = (SELECT COALESCE(AVG(rating), 0) FROM practitioner_reviews WHERE practitioner_id = $1) WHERE id = $1`, [review.rows[0].practitioner_id])
    await logAudit(req.adminUserId!, 'review.delete', 'practitioner_review', id, null, null, req.ip, req.headers['user-agent'])
    res.json({ deleted: true })
  } catch (error) { console.error('Delete review error:', error); res.status(500).json({ error: 'Failed to delete' }) }
})


// ─── Bookings Management ───────────────────────────────────────────────

router.get('/bookings', requireAdminPermission('payments.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const status = req.query.status as string
    const hasDispute = req.query.has_dispute as string
    const practitionerId = req.query.practitioner_id as string

    const conditions: string[] = []
    const params: any[] = []
    if (status && status !== 'all') { conditions.push(`b.status = $${params.length + 1}`); params.push(status) }
    if (hasDispute === 'true') { conditions.push(`b.has_dispute = true`) }
    if (hasDispute === 'false') { conditions.push(`b.has_dispute = false`) }
    if (practitionerId) { conditions.push(`b.practitioner_id = $${params.length + 1}`); params.push(practitionerId) }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const query = `SELECT b.id, b.booking_date, b.booking_time, b.consultation_mode, b.status,
                          b.has_dispute, b.dispute_reason, b.dispute_resolved,
                          b.payment_status, b.payment_amount, b.payment_method,
                          b.created_at, u.email as user_email, p.name as practitioner_name
                   FROM bookings b JOIN users u ON b.user_id = u.id JOIN practitioners p ON b.practitioner_id = p.id
                   ${whereClause} ORDER BY b.created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)
    const result = await db.query(query, params)
    res.json({ bookings: result.rows })
  } catch (error) { console.error('List bookings error:', error); res.status(500).json({ error: 'Failed to list bookings' }) }
})

router.post('/bookings/:id/status', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status } = z.object({ status: z.enum(['confirmed', 'completed', 'cancelled']) }).parse(req.body)
    const result = await db.query(`UPDATE bookings SET status = $1 WHERE id = $2 RETURNING id, status`, [status, id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, 'booking.status_change', 'booking', id, null, { status }, req.ip, req.headers['user-agent'])
    res.json({ booking: result.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Booking status error:', error); res.status(500).json({ error: 'Failed to update status' })
  }
})

router.post('/bookings/:id/resolve-dispute', requireAdminPermission('config.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { resolution } = z.object({ resolution: z.string().min(1) }).parse(req.body)
    const result = await db.query(`UPDATE bookings SET dispute_resolved = true, dispute_resolved_at = NOW() WHERE id = $1 RETURNING id`, [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, 'booking.resolve_dispute', 'booking', id, null, { resolution }, req.ip, req.headers['user-agent'])
    res.json({ resolved: true })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Resolve dispute error:', error); res.status(500).json({ error: 'Failed to resolve dispute' })
  }
})

// ─── Complaints ────────────────────────────────────────────────────────

router.get('/practitioner-complaints', requireAdminPermission('safety.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const status = req.query.status as string
    const practitionerId = req.query.practitioner_id as string
    const conditions: string[] = []
    const params: any[] = []
    if (status && status !== 'all') { conditions.push(`c.status = $${params.length + 1}`); params.push(status) }
    if (practitionerId) { conditions.push(`c.practitioner_id = $${params.length + 1}`); params.push(practitionerId) }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const query = `SELECT c.*, u.email as user_email, p.name as practitioner_name
                   FROM practitioner_complaints c LEFT JOIN users u ON c.user_id = u.id LEFT JOIN practitioners p ON c.practitioner_id = p.id
                   ${whereClause} ORDER BY c.created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)
    const result = await db.query(query, params)
    res.json({ complaints: result.rows })
  } catch (error) { console.error('List complaints error:', error); res.status(500).json({ error: 'Failed to list complaints' }) }
})

router.post('/practitioner-complaints/:id/resolve', requireAdminPermission('safety.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const { resolution, status } = z.object({ resolution: z.string().min(1), status: z.enum(['resolved', 'rejected']) }).parse(req.body)
    const complaint = await db.query('SELECT id, practitioner_id FROM practitioner_complaints WHERE id = $1', [id])
    if (complaint.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await db.query(`UPDATE practitioner_complaints SET status = $1, resolution = $2, admin_user_id = $3, resolved_at = NOW() WHERE id = $4`, [status, resolution, req.adminUserId, id])
    if (status === 'resolved') {
      await db.query(`UPDATE practitioners SET complaint_count = GREATEST(complaint_count - 1, 0) WHERE id = $1`, [complaint.rows[0].practitioner_id])
    }
    await logAudit(req.adminUserId!, 'complaint.resolve', 'practitioner_complaint', id, null, { resolution, status }, req.ip, req.headers['user-agent'])
    res.json({ resolved: true })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Resolve complaint error:', error); res.status(500).json({ error: 'Failed to resolve complaint' })
  }
})

// ─── Community Moderation ───────────────────────────────────────────────

router.get('/community/posts', requireAdminPermission('safety.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const category = req.query.category as string

    let query = `SELECT p.id, p.category, p.title, p.content, p.likes_count, p.comments_count, p.is_pinned, p.created_at,
                        u.email as author_email
                 FROM community_posts p JOIN users u ON p.user_id = u.id`
    const params: any[] = []
    if (category && category !== 'all') {
      query += ` WHERE p.category = $1`
      params.push(category)
    }
    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await db.query(query, params)
    res.json({ posts: result.rows })
  } catch (error) {
    console.error('List community posts error:', error)
    res.status(500).json({ error: 'Failed to list posts' })
  }
})

router.post('/community/posts/:id/toggle-pin', requireAdminPermission('safety.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const result = await db.query(
      `UPDATE community_posts SET is_pinned = NOT is_pinned WHERE id = $1 RETURNING id, title, is_pinned`,
      [id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, 'community.toggle_pin', 'community_post', id, null, { is_pinned: result.rows[0].is_pinned })
    res.json({ post: result.rows[0] })
  } catch (error) {
    console.error('Toggle pin error:', error)
    res.status(500).json({ error: 'Failed to toggle pin' })
  }
})

router.delete('/community/posts/:id', requireAdminPermission('safety.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    await db.query(`DELETE FROM community_comments WHERE post_id = $1`, [id])
    await db.query(`DELETE FROM community_likes WHERE post_id = $1`, [id])
    await db.query(`DELETE FROM community_bookmarks WHERE post_id = $1`, [id])
    const result = await db.query(`DELETE FROM community_posts WHERE id = $1 RETURNING id, title`, [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await logAudit(req.adminUserId!, 'community.delete_post', 'community_post', id, { title: result.rows[0].title })
    res.json({ deleted: true })
  } catch (error) {
    console.error('Delete post error:', error)
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

router.delete('/community/comments/:id', requireAdminPermission('safety.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params
    const result = await db.query(`DELETE FROM community_comments WHERE id = $1 RETURNING id, post_id`, [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    await db.query(`UPDATE community_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = $1`, [result.rows[0].post_id])
    await logAudit(req.adminUserId!, 'community.delete_comment', 'community_comment', id)
    res.json({ deleted: true })
  } catch (error) {
    console.error('Delete comment error:', error)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

export default router
