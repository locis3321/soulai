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

export function authenticateAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No admin token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin_default_secret'
    const decoded = jwt.verify(token, secret) as { adminUserId: string; role: string; email: string }

    req.adminUserId = decoded.adminUserId
    req.adminRole = decoded.role
    req.adminEmail = decoded.email

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid admin token' })
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
