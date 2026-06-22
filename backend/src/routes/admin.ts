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

    const [users, activeUsers, paidUsers, aiLogs, safetyHits, payments] = await Promise.all([
      db.query(`SELECT COUNT(*) as c FROM users WHERE created_at > NOW() - INTERVAL '${days} days'`),
      db.query(`SELECT COUNT(DISTINCT user_id) as c FROM user_activity WHERE created_at > NOW() - INTERVAL '${days} days'`),
      db.query(`SELECT COUNT(*) as c FROM users WHERE subscription_tier != 'free' AND is_active = true`),
      db.query(`SELECT COUNT(*) as c, provider, was_fallback FROM ai_request_logs WHERE created_at > NOW() - INTERVAL '${days} days' GROUP BY provider, was_fallback`),
      db.query(`SELECT COUNT(*) as c, event_type FROM safety_events WHERE created_at > NOW() - INTERVAL '${days} days' GROUP BY event_type`),
      db.query(`SELECT COUNT(*) as c, payment_status FROM payments WHERE created_at > NOW() - INTERVAL '${days} days' GROUP BY payment_status`),
    ])

    res.json({
      period: `${days}d`,
      newUsers: parseInt(users.rows[0]?.c || '0'),
      activeUsers: parseInt(activeUsers.rows[0]?.c || '0'),
      paidUsers: parseInt(paidUsers.rows[0]?.c || '0'),
      aiBreakdown: aiLogs.rows,
      safetyHits: safetyHits.rows,
      paymentBreakdown: payments.rows,
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

    let query = `SELECT id, email, name, language, subscription_tier, is_active, created_at,
                         birth_date IS NOT NULL as has_birth_data
                  FROM users`
    const params: any[] = []

    if (search) {
      query += ` WHERE email ILIKE $1 OR name ILIKE $1`
      params.push(`%${search}%`)
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await db.query(query, params)
    res.json({ users: result.rows })
  } catch (error) {
    console.error('Admin users error:', error)
    res.status(500).json({ error: 'Failed to list users' })
  }
})

router.get('/users/:userId', requireAdminPermission('users.read'), async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params

    const [user, profile, subscriptions, payments, recentActivity] = await Promise.all([
      db.query(`SELECT id, email, name, language, subscription_tier, is_active, created_at,
                        birth_date, birth_time, birth_place FROM users WHERE id = $1`, [userId]),
      db.query(`SELECT * FROM user_profiles WHERE user_id = $1`, [userId]),
      db.query(`SELECT tier, start_date, end_date, is_active FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`, [userId]),
      db.query(`SELECT id, order_id, plan_id, amount, payment_status, created_at FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`, [userId]),
      db.query(`SELECT activity_type, COUNT(*) as count FROM user_activity WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days' GROUP BY activity_type`, [userId]),
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

// Export user data (GDPR)
router.get('/users/:userId/export', requireAdminPermission('users.read'), async (req: AdminRequest, res: Response) => {
  try {
    const { userId } = req.params

    const [user, profile, moods, journals, readings, chatSessions, subscriptions] = await Promise.all([
      db.query(`SELECT id, email, name, birth_date, birth_time, birth_place, language, subscription_tier, created_at FROM users WHERE id = $1`, [userId]),
      db.query(`SELECT * FROM user_profiles WHERE user_id = $1`, [userId]),
      db.query(`SELECT mood, note, energy_score, created_at FROM mood_checkins WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT title, content, mood, tags, created_at FROM journals WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT reading_type, birth_data, reading_text, created_at FROM astrology_readings WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT id, advisor_key, title, created_at FROM chat_sessions WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
      db.query(`SELECT tier, start_date, end_date, is_active FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
    ])

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

    // Delete in order (respecting foreign keys)
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

    await logAudit(req.adminUserId!, 'delete_user_data', 'user', userId,
      { email: user.rows[0].email }, { reason }, req.ip, req.headers['user-agent'])

    res.json({ message: 'All personal data deleted. Account deactivated.' })
  } catch (error) {
    console.error('Delete user data error:', error)
    res.status(500).json({ error: 'Failed to delete user data' })
  }
})

// ─── Payments ────────────────────────────────────────────────────────────

router.get('/payments', requireAdminPermission('payments.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const status = req.query.status as string

    let query = `SELECT p.id, p.order_id, p.plan_id, p.period, p.amount, p.currency,
                        p.payment_method, p.payment_status, p.provider_transaction_id,
                        p.created_at, p.updated_at,
                        u.email as user_email
                 FROM payments p JOIN users u ON p.user_id = u.id`
    const params: any[] = []

    if (status && status !== 'all') {
      query += ` WHERE p.payment_status = $1`
      params.push(status)
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await db.query(query, params)
    res.json({ payments: result.rows })
  } catch (error) {
    console.error('Admin payments error:', error)
    res.status(500).json({ error: 'Failed to list payments' })
  }
})

// ─── AI Logs ─────────────────────────────────────────────────────────────

router.get('/ai-logs', requireAdminPermission('ai_logs.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0

    const result = await db.query(
      `SELECT l.id, l.user_id, u.email as user_email, l.provider, l.model,
              l.request_type, l.latency_ms, l.tokens_used, l.was_fallback,
              l.fallback_reason, l.created_at
       FROM ai_request_logs l LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    res.json({ logs: result.rows })
  } catch (error) {
    console.error('Admin AI logs error:', error)
    res.status(500).json({ error: 'Failed to list AI logs' })
  }
})

// ─── Safety Events ───────────────────────────────────────────────────────

router.get('/safety-events', requireAdminPermission('safety.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0
    const resolved = req.query.resolved as string

    let query = `SELECT s.id, s.user_id, u.email as user_email, s.event_type,
                        s.severity, s.source, s.content_snippet, s.resolved,
                        s.resolved_by, s.resolved_at, s.created_at
                 FROM safety_events s LEFT JOIN users u ON s.user_id = u.id`
    const params: any[] = []

    if (resolved === 'true') {
      query += ` WHERE s.resolved = true`
    } else if (resolved === 'false') {
      query += ` WHERE s.resolved = false`
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await db.query(query, params)
    res.json({ events: result.rows })
  } catch (error) {
    console.error('Admin safety events error:', error)
    res.status(500).json({ error: 'Failed to list safety events' })
  }
})

// Mark safety event as resolved
router.post('/safety-events/:id/resolve', requireAdminPermission('safety.write'), async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params

    await db.query(
      `UPDATE safety_events SET resolved = true, resolved_by = $1, resolved_at = NOW() WHERE id = $2`,
      [req.adminUserId, id]
    )

    await logAudit(req.adminUserId!, 'resolve_safety_event', 'safety_event', id, null, { resolved: true }, req.ip, req.headers['user-agent'])

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

// ─── Audit Log ───────────────────────────────────────────────────────────

router.get('/audit-log', requireAdminPermission('dashboard.read'), async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0

    const result = await db.query(
      `SELECT a.id, a.admin_user_id, u.email as admin_email, a.action,
              a.target_type, a.target_id, a.before_data, a.after_data,
              a.ip, a.created_at
       FROM admin_audit_logs a LEFT JOIN admin_users u ON a.admin_user_id = u.id
       ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    )

    res.json({ logs: result.rows })
  } catch (error) {
    console.error('Audit log error:', error)
    res.status(500).json({ error: 'Failed to list audit logs' })
  }
})

export default router
