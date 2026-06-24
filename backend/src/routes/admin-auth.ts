import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../lib/db.js'
import { authenticateAdmin, AdminRequest, getAdminJwtSecret, logAudit } from '../middleware/adminAuth.js'
import { z } from 'zod'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// Admin login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const result = await db.query(
      'SELECT id, email, name, role, password_hash, is_active FROM admin_users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const admin = result.rows[0]

    if (!admin.is_active) {
      return res.status(401).json({ error: 'Account disabled' })
    }

    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { adminUserId: admin.id, email: admin.email, role: admin.role },
      getAdminJwtSecret(),
      { expiresIn: '8h' }
    )

    await logAudit(admin.id, 'login', 'admin_user', admin.id, null, null, req.ip, req.headers['user-agent'])

    res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Admin login error:', error)
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

export default router
