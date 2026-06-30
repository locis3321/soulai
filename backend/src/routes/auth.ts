import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../lib/db.js'
import { z } from 'zod'

const router = Router()

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret && process.env.NODE_ENV !== 'development') {
    throw new Error('JWT_SECRET is required in non-development environments')
  }
  return secret || 'default_secret'
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  language: z.enum(['en', 'zh', 'vi', 'th', 'my']).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, language } = registerSchema.parse(req.body)

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, name, password_hash, language)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, language, subscription_tier, created_at`,
      [email, name, passwordHash, language || 'en']
    )

    const user = result.rows[0]

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
    )

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        language: user.language,
        subscriptionTier: user.subscription_tier,
      },
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    // Find user
    const result = await db.query(
      'SELECT id, email, name, password_hash, language, subscription_tier FROM users WHERE email = $1 AND is_active = true',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = result.rows[0]

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
    )

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        language: user.language,
        subscriptionTier: user.subscription_tier,
      },
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors })
    }
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string }

    const result = await db.query(
      `SELECT id, email, name, avatar_url, birth_date, birth_time, birth_place, 
              phone, phone_verified_at, auth_type,
              language, subscription_tier, created_at
       FROM users WHERE id = $1 AND is_active = true`,
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = result.rows[0]
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url,
        birthDate: user.birth_date,
        birthTime: user.birth_time,
        birthPlace: user.birth_place,
        phone: user.phone,
        phoneVerifiedAt: user.phone_verified_at,
        authType: user.auth_type,
        language: user.language,
        subscriptionTier: user.subscription_tier,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string }

    // Generate new token
    const newToken = jwt.sign(
      { userId: decoded.userId },
      getJwtSecret(),
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
    )

    res.json({ token: newToken })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' })
    }
    console.error('Refresh token error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── Device Anonymous Auth ─────────────────────────────────────────────

const deviceSchema = z.object({
  device_id: z.string().min(8).max(64),
  language: z.enum(['en', 'zh', 'vi', 'th', 'my']).optional(),
})

router.post('/device', async (req: Request, res: Response) => {
  try {
    const { device_id, language } = deviceSchema.parse(req.body)
    const ip = (req.ip || req.socket.remoteAddress || 'unknown').slice(0, 64)
    const ua = (req.headers['user-agent'] || '').slice(0, 64)

    // Check if device already mapped to a user
    const existingDevice = await db.query('SELECT user_id FROM devices WHERE device_id = $1', [device_id])
    let userId: string

    if (existingDevice.rows.length > 0) {
      userId = existingDevice.rows[0].user_id
      await db.query('UPDATE devices SET last_seen_at = NOW(), ip_hash = $2, user_agent_hash = $3 WHERE device_id = $1', [device_id, ip, ua])
    } else {
      // Create anonymous user
      const userResult = await db.query(
        `INSERT INTO users (email, name, language, auth_type, is_active)
         VALUES (NULL, 'Anonymous Seeker', $1, 'anonymous', true)
         RETURNING id`,
        [language || 'en']
      )
      userId = userResult.rows[0].id
      // Create device record
      await db.query(
        `INSERT INTO devices (device_id, user_id, first_seen_at, last_seen_at, ip_hash, user_agent_hash)
         VALUES ($1, $2, NOW(), NOW(), $3, $4)`,
        [device_id, userId, ip, ua]
      )
    }

    const userResult = await db.query(
      `SELECT id, email, name, phone, phone_verified_at, auth_type, language, subscription_tier
       FROM users WHERE id = $1 AND is_active = true`,
      [userId]
    )
    const user = userResult.rows[0]
    if (!user) return res.status(500).json({ error: 'Failed to create session' })

    const token = jwt.sign(
      { userId: user.id, authType: user.auth_type },
      getJwtSecret(),
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
    )

    res.json({
      user: {
        id: user.id, email: user.email, name: user.name,
        phone: user.phone, phoneVerifiedAt: user.phone_verified_at,
        authType: user.auth_type, language: user.language,
        subscriptionTier: user.subscription_tier,
      },
      token,
      isAnonymous: user.auth_type === 'anonymous',
      needsPhoneBinding: user.auth_type === 'anonymous' || !user.phone_verified_at,
    })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Device auth error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── Phone Verification ────────────────────────────────────────────────

const sendCodeSchema = z.object({
  phone: z.string().min(6).max(20),
  purpose: z.enum(['bind', 'login', 'recovery']),
})

router.post('/phone/send-code', async (req: Request, res: Response) => {
  try {
    const { phone, purpose } = sendCodeSchema.parse(req.body)

    // Rate limit: max 5 codes per 15 minutes per phone
    const recentCount = await db.query(
      `SELECT COUNT(*) as c FROM phone_verification_codes WHERE phone = $1 AND created_at > NOW() - INTERVAL '15 minutes'`,
      [phone]
    )
    if (parseInt(recentCount.rows[0]?.c || '0') >= 5) {
      return res.status(429).json({ error: 'Too many verification codes sent. Please try again later.' })
    }

    const code = process.env.NODE_ENV === 'production' 
      ? Math.floor(100000 + Math.random() * 900000).toString() // 6-digit random
      : '888888' // Universal dev code

    const codeHash = bcrypt.hashSync(code, 4) // fast hash for short-lived codes

    await db.query(
      `INSERT INTO phone_verification_codes (phone, code_hash, purpose, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')`,
      [phone, codeHash, purpose]
    )

    // In dev, log the code for convenience
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV SMS] Phone: ${phone} | Code: ${code} | Purpose: ${purpose}`)
    }

    res.json({ message: 'Verification code sent', phone, expiresIn: 300 })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Send code error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── Phone Verify & Bind ───────────────────────────────────────────────

const verifyCodeSchema = z.object({
  phone: z.string().min(6).max(20),
  code: z.string().min(4).max(10),
  purpose: z.enum(['bind', 'login', 'recovery']),
})

router.post('/phone/verify', async (req: Request, res: Response) => {
  try {
    const { phone, code, purpose } = verifyCodeSchema.parse(req.body)

    // Find unexpired, unconsumed code
    const codeResult = await db.query(
      `SELECT id, code_hash FROM phone_verification_codes
       WHERE phone = $1 AND purpose = $2 AND expires_at > NOW() AND consumed_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [phone, purpose]
    )
    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: 'No valid verification code found. Please request a new code.' })
    }

    const valid = await bcrypt.compare(code, codeResult.rows[0].code_hash)
    if (!valid) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    // Mark code as consumed
    await db.query('UPDATE phone_verification_codes SET consumed_at = NOW() WHERE id = $1', [codeResult.rows[0].id])

    // Get current user from optional auth
    const authHeader = req.headers.authorization
    let userId: string | null = null
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], getJwtSecret()) as { userId: string }
        userId = decoded.userId
      } catch { /* optional auth */ }
    }

    if (purpose === 'login' || purpose === 'recovery') {
      // Find or create user by phone
      const userResult = await db.query(
        `SELECT id, email, name, phone, phone_verified_at, auth_type, language, subscription_tier
         FROM users WHERE phone = $1 AND is_active = true`,
        [phone]
      )
      let user
      if (userResult.rows.length > 0) {
        user = userResult.rows[0]
        await db.query('UPDATE users SET phone_verified_at = NOW(), auth_type = $2 WHERE id = $1', [user.id, purpose === 'login' ? 'phone' : user.auth_type])
      } else {
        // Create new phone-bound user
        const newUser = await db.query(
          `INSERT INTO users (email, name, phone, phone_verified_at, auth_type, language)
           VALUES (NULL, $1, $2, NOW(), 'phone', $3) RETURNING *`,
          [`User ${phone.slice(-4)}`, phone, 'zh']
        )
        user = newUser.rows[0]
      }

      const token = jwt.sign({ userId: user.id, authType: user.auth_type || 'phone' }, getJwtSecret(), { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] })
      return res.json({
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone, phoneVerifiedAt: user.phone_verified_at, authType: user.auth_type, language: user.language, subscriptionTier: user.subscription_tier },
        token,
      })
    }

    // purpose === 'bind': bind phone to current anonymous user
    if (!userId) return res.status(401).json({ error: 'Login required to bind phone. Please authenticate first.' })

    // Check phone not already bound to another user
    const existingPhone = await db.query('SELECT id FROM users WHERE phone = $1 AND id != $2 AND is_active = true', [phone, userId])
    if (existingPhone.rows.length > 0) return res.status(400).json({ error: 'This phone number is already bound to another account.' })

    await db.query('UPDATE users SET phone = $1, phone_verified_at = NOW(), auth_type = $2 WHERE id = $3', [phone, 'phone', userId])

    const userResult = await db.query('SELECT id, email, name, phone, phone_verified_at, auth_type, language, subscription_tier FROM users WHERE id = $1', [userId])
    const user = userResult.rows[0]
    const token = jwt.sign({ userId: user.id, authType: user.auth_type }, getJwtSecret(), { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] })
    res.json({ user: { id: user.id, email: user.email, name: user.name, phone: user.phone, phoneVerifiedAt: user.phone_verified_at, authType: user.auth_type, language: user.language, subscriptionTier: user.subscription_tier }, token })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error', details: error.errors })
    console.error('Verify code error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ─── Change Password ──────────────────────────────────────────────────

router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
    const decoded = jwt.verify(authHeader.split(' ')[1], getJwtSecret()) as { userId: string }
    const { password } = z.object({ password: z.string().min(1) }).parse(req.body)
    const hash = await bcrypt.hash(password, 10)
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, decoded.userId])
    res.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation error' })
    if (error instanceof jwt.JsonWebTokenError) return res.status(401).json({ error: 'Invalid token' })
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
})

export default router
