import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { db } from '../lib/db.js'
import { authenticateAdmin, AdminRequest, getAdminJwtSecret, logAudit, blacklistToken } from '../middleware/adminAuth.js'
import { z } from 'zod'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// Rate limiting state (in-memory, per-IP)
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>()
const MAX_ATTEMPTS = 5
const ATTEMPT_WINDOW = 15 * 60 * 1000 // 15 minutes

function trackLoginAttempt(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now - entry.firstAttempt > ATTEMPT_WINDOW) {
    loginAttempts.set(ip, { count: 0, firstAttempt: now })
    return false // first attempt, allowed
  }
  return entry.count >= MAX_ATTEMPTS
}
function recordFailedLogin(ip: string) {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (entry) { entry.count++; if (entry.count >= MAX_ATTEMPTS) return true }
  else loginAttempts.set(ip, { count: 1, firstAttempt: now })
  return false
}
function clearLoginAttempts(ip: string) { loginAttempts.delete(ip) }
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of loginAttempts) {
    if (now - entry.firstAttempt > ATTEMPT_WINDOW) loginAttempts.delete(ip)
  }
}, 60000)

// Admin login
router.post('/login', async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const userAgent = req.headers['user-agent'] || ''
  try {
    const { email, password } = loginSchema.parse(req.body)

    const result = await db.query(
      'SELECT id, email, name, role, password_hash, is_active, failed_login_attempts, locked_until FROM admin_users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      recordFailedLogin(ip)
      await logLoginHistory(null, email, ip, userAgent, false, 'unknown_email')
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const admin = result.rows[0]

    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      recordFailedLogin(ip)
      await logLoginHistory(admin.id, email, ip, userAgent, false, 'account_locked')
      return res.status(423).json({ error: 'Account locked. Please try again later.' })
    }

    if (!admin.is_active) {
      recordFailedLogin(ip)
      await logLoginHistory(admin.id, email, ip, userAgent, false, 'account_disabled')
      return res.status(401).json({ error: 'Account disabled' })
    }

    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) {
      recordFailedLogin(ip)

      // Check IP rate limit AFTER failed attempt
      if (trackLoginAttempt(ip)) {
        await logLoginHistory(admin.id, email, ip, userAgent, false, 'rate_limited')
        return res.status(429).json({ error: 'Too many login attempts. Please try again later.' })
      }
      const newAttempts = (admin.failed_login_attempts || 0) + 1
      const lockAccount = newAttempts >= 5
      await db.query(
        `UPDATE admin_users SET failed_login_attempts = $1, last_failed_at = NOW(), locked_until = $2 WHERE id = $3`,
        [newAttempts, lockAccount ? new Date(Date.now() + 30 * 60 * 1000) : null, admin.id]
      )
      await logLoginHistory(admin.id, email, ip, userAgent, false, lockAccount ? 'locked_out' : 'invalid_password')
      return res.status(401).json({ error: lockAccount ? 'Account locked after 5 failed attempts. Try again in 30 minutes.' : 'Invalid credentials' })
    }

    // Reset failed attempts on success
    clearLoginAttempts(ip)
    await db.query('UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1', [admin.id])

    const token = jwt.sign(
      { adminUserId: admin.id, email: admin.email, role: admin.role },
      getAdminJwtSecret(),
      { expiresIn: '8h' }
    )

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    await db.query(
      `INSERT INTO admin_sessions (admin_user_id, token_hash, ip, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '8 hours')`,
      [admin.id, tokenHash, ip, userAgent]
    )

    await logLoginHistory(admin.id, email, ip, userAgent, true, null)
    await logAudit(admin.id, 'login', 'admin_user', admin.id, null, null, ip, userAgent)

    res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Admin login error:', error)
    await logLoginHistory(null, 'unknown', ip, userAgent, false, 'server_error')
    res.status(500).json({ error: 'Login failed' })
  }
})

// Get current admin user
router.get('/me', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, role, is_active, created_at FROM admin_users WHERE id = $1',
      [req.adminUserId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin user not found' })
    }

    res.json({ admin: result.rows[0] })
  } catch (error) {
    console.error('Admin me error:', error)
    res.status(500).json({ error: 'Failed to get admin info' })
  }
})

// Logout — invalidate session
router.post('/logout', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      blacklistToken(token)
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      await db.query('DELETE FROM admin_sessions WHERE token_hash = $1', [tokenHash])
    }
    await logAudit(req.adminUserId!, 'logout', 'admin_user', req.adminUserId!, null, null, req.ip, req.headers['user-agent'])
    res.json({ success: true })
  } catch (error) {
    console.error('Admin logout error:', error)
    res.status(500).json({ error: 'Failed to logout' })
  }
})

// List active sessions for current admin
router.get('/sessions', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const result = await db.query(
      `SELECT id, ip, user_agent, created_at, expires_at FROM admin_sessions WHERE admin_user_id = $1 AND expires_at > NOW() ORDER BY created_at DESC`,
      [req.adminUserId]
    )
    res.json({ sessions: result.rows })
  } catch (error) { console.error('Sessions error:', error); res.status(500).json({ error: 'Failed to get sessions' }) }
})

// Login history (admin only)
router.get('/login-logs', authenticateAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const result = await db.query(
      `SELECT h.*, a.email as admin_email FROM admin_login_history h LEFT JOIN admin_users a ON h.admin_user_id = a.id ORDER BY h.created_at DESC LIMIT $1`,
      [limit]
    )
    res.json({ logs: result.rows })
  } catch (error) { console.error('Login logs error:', error); res.status(500).json({ error: 'Failed to get login logs' }) }
})

// ─── Helpers ──────────────────────────────────────────────────────────

async function logLoginHistory(adminUserId: string | null, email: string, ip: string, userAgent: string, success: boolean, failureReason: string | null) {
  try {
    await db.query(
      `INSERT INTO admin_login_history (admin_user_id, email, ip, user_agent, success, failure_reason) VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminUserId, email, ip, userAgent || '', success, failureReason]
    )
  } catch (err) { console.debug('Login history write failed:', err) }
}

export default router
