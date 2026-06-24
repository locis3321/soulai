import { describe, it, expect, beforeAll } from 'vitest'

const BASE = process.env.BACKEND_INTEGRATION_BASE_URL || 'http://localhost:4000'
const describeIntegration = process.env.RUN_BACKEND_INTEGRATION === 'true' ? describe : describe.skip

async function register(email: string) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Test1234!', name: 'Test User', language: 'en' }),
  })
  const text = await res.text()
  try {
    const data = JSON.parse(text)
    return { status: res.status, ...data }
  } catch {
    return { status: res.status, error: text }
  }
}

async function api(method: string, path: string, token: string, body?: any) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

let counter = 0
function uniqueEmail() {
  return `integ-${Date.now()}-${++counter}@test.com`
}

describeIntegration('Backend Integration Tests', () => {
  describe('Auth', () => {
    it('should register a new user', async () => {
      const res = await register(uniqueEmail())
      expect(res.status).toBe(201)
      expect(res.token).toBeTruthy()
      expect(res.user).toBeTruthy()
      expect(res.user.subscriptionTier).toBe('free')
    })

    it('should reject duplicate email', async () => {
      const email = uniqueEmail()
      await register(email)
      const res = await register(email)
      expect(res.status).toBe(400)
    })

    it('should login with correct credentials', async () => {
      const email = uniqueEmail()
      await register(email)
      const res = await api('POST', '/api/auth/login', '', { email, password: 'Test1234!' })
      expect(res.status).toBe(200)
      expect(res.data.token).toBeTruthy()
    })

    it('should reject wrong password', async () => {
      const email = uniqueEmail()
      await register(email)
      const res = await api('POST', '/api/auth/login', '', { email, password: 'wrong' })
      expect(res.status).toBe(401)
    })

    it('should get current user with valid token', async () => {
      const { token } = await register(uniqueEmail())
      const res = await api('GET', '/api/auth/me', token)
      expect(res.status).toBe(200)
      expect(res.data.user).toBeTruthy()
      expect(res.data.user.email).toBeTruthy()
    })

    it('should reject requests without token', async () => {
      const res = await api('GET', '/api/auth/me', '')
      expect(res.status).toBe(401)
    })
  })

  describe('Profile', () => {
    it('should update user profile', async () => {
      const { token } = await register(uniqueEmail())
      const res = await api('PUT', '/api/users/profile', token, {
        name: 'Updated Name',
        birthDate: '1990-06-15',
        birthTime: '14:30',
        birthPlace: 'Bangkok',
      })
      expect(res.status).toBe(200)

      // Verify the update
      const me = await api('GET', '/api/auth/me', token)
      expect(me.data.user.name).toBe('Updated Name')
    })
  })

  describe('Tarot Entitlement', () => {
    it('should allow single-card for free users', async () => {
      const { token } = await register(uniqueEmail())
      const res = await api('POST', '/api/tarot/reading', token, {
        question: 'Test',
        cards: [{ name: 'The Star', isReversed: false }],
        spreadType: 'single',
      })
      expect(res.status).toBe(200)
      expect(res.data.reading).toBeTruthy()
    })

    it('should block three-card for free users', async () => {
      const { token } = await register(uniqueEmail())
      const res = await api('POST', '/api/tarot/reading', token, {
        question: 'Test',
        cards: [
          { name: 'The Fool', isReversed: false },
          { name: 'The Magician', isReversed: true },
          { name: 'The Star', isReversed: false },
        ],
        spreadType: 'three',
      })
      expect(res.status).toBe(403)
      expect(res.data.requiredTier).toBe('plus')
    })

    it('should block celtic for free users', async () => {
      const { token } = await register(uniqueEmail())
      const res = await api('POST', '/api/tarot/reading', token, {
        question: 'Test',
        cards: Array(10).fill({ name: 'The Star', isReversed: false }),
        spreadType: 'celtic',
      })
      expect(res.status).toBe(403)
    })
  })

  describe('Chat Monthly Limit', () => {
    it('should create chat session and send message', async () => {
      const { token } = await register(uniqueEmail())

      // Create session
      const sessionRes = await api('POST', '/api/chat/sessions', token, { advisorKey: 'luna' })
      expect(sessionRes.status).toBe(201)
      const sessionId = sessionRes.data.session.id

      // Send message
      const msgRes = await api('POST', `/api/chat/sessions/${sessionId}/messages`, token, {
        content: 'Hello, I need guidance.',
      })
      expect(msgRes.status).toBe(200)
      expect(msgRes.data.aiMessage).toBeTruthy()
    })
  })

  describe('Payment Intent', () => {
    it('should create monthly plus payment intent', async () => {
      const { token } = await register(uniqueEmail())
      const res = await api('POST', '/api/payments/create-intent', token, {
        planId: 'plus',
        paymentMethod: 'alipay',
        period: 'monthly',
      })
      expect(res.status).toBe(200)
      expect(res.data.orderId).toBeTruthy()
      expect(parseFloat(res.data.amount)).toBe(34.9)
      expect(res.data.period).toBe('monthly')
      expect(res.data.planId).toBe('plus_monthly')
    })

    it('should create yearly premium payment intent', async () => {
      const { token } = await register(uniqueEmail())
      const res = await api('POST', '/api/payments/create-intent', token, {
        planId: 'premium',
        paymentMethod: 'wechat',
        period: 'yearly',
      })
      expect(res.status).toBe(200)
      expect(parseFloat(res.data.amount)).toBe(699)
      expect(res.data.period).toBe('yearly')
      expect(res.data.planId).toBe('premium_yearly')
    })

    it('should reject invalid plan', async () => {
      const { token } = await register(uniqueEmail())
      const res = await api('POST', '/api/payments/create-intent', token, {
        planId: 'invalid',
        paymentMethod: 'alipay',
        period: 'monthly',
      })
      expect(res.status).toBe(400)
    })

    it('should return subscription as free by default', async () => {
      const { token } = await register(uniqueEmail())
      const res = await api('GET', '/api/payments/subscription', token)
      expect(res.status).toBe(200)
      expect(res.data.subscription.tier).toBe('free')
    })
  })

  describe('Subscription Activation', () => {
    it('should activate subscription via callback simulation', async () => {
      const { token, user } = await register(uniqueEmail())

      // Create payment intent
      const intentRes = await api('POST', '/api/payments/create-intent', token, {
        planId: 'plus',
        paymentMethod: 'alipay',
        period: 'monthly',
      })
      expect(intentRes.status).toBe(200)
      const { orderId } = intentRes.data

      // Simulate Alipay callback (no signature verification in dev)
      const callbackRes = await fetch(`${BASE}/api/payments/callback/alipay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `out_trade_no=${orderId}&trade_no=TEST_TXN_123&trade_status=TRADE_SUCCESS&total_amount=34.90`,
      })
      const callbackText = await callbackRes.text()
      expect(callbackText).toBe('success')

      // Verify subscription is now active
      const subRes = await api('GET', '/api/payments/subscription', token)
      expect(subRes.status).toBe(200)
      expect(subRes.data.subscription.tier).toBe('plus')
      expect(subRes.data.subscription.isActive).toBe(true)
    })

    it('should cancel subscription', async () => {
      const { token } = await register(uniqueEmail())

      // Create and activate
      const intentRes = await api('POST', '/api/payments/create-intent', token, {
        planId: 'plus',
        paymentMethod: 'alipay',
        period: 'monthly',
      })
      const { orderId } = intentRes.data
      await fetch(`${BASE}/api/payments/callback/alipay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `out_trade_no=${orderId}&trade_no=TXN&trade_status=TRADE_SUCCESS&total_amount=34.90`,
      })

      // Cancel
      const cancelRes = await api('POST', '/api/payments/subscription/cancel', token)
      expect(cancelRes.status).toBe(200)

      // Verify back to free
      const subRes = await api('GET', '/api/payments/subscription', token)
      expect(subRes.data.subscription.tier).toBe('free')
    })
  })

  describe('Healing CRUD', () => {
    it('should create and list journals', async () => {
      const { token } = await register(uniqueEmail())

      const createRes = await api('POST', '/api/healing/journals', token, {
        title: 'Test Journal',
        content: 'Today was a good day.',
        mood: 'happy',
      })
      expect(createRes.status).toBe(201)

      const listRes = await api('GET', '/api/healing/journals', token)
      expect(listRes.status).toBe(200)
      expect(listRes.data.journals.length).toBeGreaterThan(0)
    })

    it('should log mood and get history', async () => {
      const { token } = await register(uniqueEmail())

      const logRes = await api('POST', '/api/healing/mood/checkin', token, {
        mood: 'calm',
        note: 'Peaceful morning',
        energyScore: 85,
      })
      expect(logRes.status).toBe(201)

      const histRes = await api('GET', '/api/healing/mood/history?days=7', token)
      expect(histRes.status).toBe(200)
      expect(histRes.data.moods.length).toBeGreaterThan(0)
    })
  })
})
