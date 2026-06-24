import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../lib/db.js'

export interface AdminRequest extends Request {
  adminUserId?: string
  adminRole?: string
  adminEmail?: string
}

const ROLE_HIERARCHY = ['readonly', 'operator', 'support', 'admin', 'owner']

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ['*'],
  admin: ['users.read', 'users.write', 'payments.read', 'payments.write', 'config.read', 'config.write', 'ai_logs.read', 'safety.read', 'safety.write', 'dashboard.read'],
  support: ['users.read', 'users.write', 'payments.read', 'ai_logs.read', 'safety.read', 'dashboard.read'],
  operator: ['config.read', 'config.write', 'ai_logs.read', 'safety.read', 'safety.write', 'dashboard.read'],
  readonly: ['users.read', 'payments.read', 'ai_logs.read', 'safety.read', 'dashboard.read'],
}

export function getAdminJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET
  if (!secret && process.env.NODE_ENV !== 'development') {
    throw new Error('ADMIN_JWT_SECRET or JWT_SECRET is required in non-development environments')
  }
  return secret || 'admin_default_secret'
}

export function requireAdminPermission(permission: string) {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    const role = req.adminRole || 'readonly'
    const perms = ROLE_PERMISSIONS[role] || []

    if (perms.includes('*') || perms.includes(permission)) {
      return next()
    }

    return res.status(403).json({ error: 'Insufficient permissions', required: permission })
  }
}

export async function authenticateAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No admin token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, getAdminJwtSecret()) as { adminUserId: string; role: string; email: string }
    const result = await db.query(
      'SELECT id, email, role FROM admin_users WHERE id = $1 AND is_active = true',
      [decoded.adminUserId]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Admin account inactive or not found' })
    }

    const admin = result.rows[0]

    req.adminUserId = admin.id
    req.adminRole = admin.role
    req.adminEmail = admin.email

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Admin token expired' })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid admin token' })
    }
    console.error('Admin authentication error:', error)
    return res.status(500).json({ error: 'Admin authentication failed' })
  }
}

export async function logAudit(
  adminUserId: string | null,
  action: string,
  targetType: string,
  targetId: string,
  before: any = null,
  after: any = null,
  ip?: string,
  userAgent?: string
) {
  try {
    await db.query(
      `INSERT INTO admin_audit_logs (admin_user_id, action, target_type, target_id, before_data, after_data, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [adminUserId, action, targetType, targetId,
       before ? JSON.stringify(before) : null,
       after ? JSON.stringify(after) : null,
       ip || null, userAgent || null]
    )
  } catch (err) {
    console.error('Audit log error:', err)
  }
}
