import { Router, Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { db } from '../lib/db.js'
import crypto from 'crypto'
import { z } from 'zod'

const router = Router()

// Subscription pricing
const SUBSCRIPTION_PRICES = {
  plus: {
    monthly: { amount: 34.9, currency: 'CNY' },
    yearly: { amount: 349, currency: 'CNY' }
  },
  premium: {
    monthly: { amount: 69.9, currency: 'CNY' },
    yearly: { amount: 699, currency: 'CNY' }
  }
} as const

type PlanId = keyof typeof SUBSCRIPTION_PRICES
type Period = 'monthly' | 'yearly'

// Get subscription plans
router.get('/plans', async (_req: Request, res: Response) => {
  try {
    res.json({
      plans: [
        {
          id: 'free',
          name: 'Free',
          monthly: { amount: 0, currency: 'CNY' },
          yearly: { amount: 0, currency: 'CNY' },
          features: ['每日洞察', '5次AI聊天', '单牌塔罗', '基础星盘', '情绪记录']
        },
        {
          id: 'plus',
          name: 'Plus',
          monthly: SUBSCRIPTION_PRICES.plus.monthly,
          yearly: SUBSCRIPTION_PRICES.plus.yearly,
          features: ['50次AI聊天', '三牌塔罗', '详细星盘', '每周报告', '情绪趋势', '无广告']
        },
        {
          id: 'premium',
          name: 'Premium',
          monthly: SUBSCRIPTION_PRICES.premium.monthly,
          yearly: SUBSCRIPTION_PRICES.premium.yearly,
          features: ['无限AI聊天', '凯尔特十字塔罗', '深度报告', '月度/年度报告', '关系匹配', '优先支持']
        }
      ]
    })
  } catch (error) {
    console.error('Get plans error:', error)
    res.status(500).json({ error: 'Failed to get plans' })
  }
})

// Create payment intent (Alipay or WeChat Pay)
router.post('/create-intent', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { planId, paymentMethod, period = 'monthly' } = req.body

    // Validate plan
    if (!['plus', 'premium'].includes(planId)) {
      return res.status(400).json({ error: 'Invalid plan. Must be "plus" or "premium".' })
    }

    // Validate period
    if (!['monthly', 'yearly'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Must be "monthly" or "yearly".' })
    }

    // Validate payment method
    if (!['alipay', 'wechat'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method. Use alipay or wechat.' })
    }

    const priceConfig = SUBSCRIPTION_PRICES[planId as PlanId][period as Period]
    const { amount, currency } = priceConfig

    // Generate order ID with period encoded
    const orderId = `SOULAI_${Date.now()}_${userId?.substring(0, 8)}`

    // Store plan_id with period (e.g., "plus_monthly", "premium_yearly")
    const fullPlanId = `${planId}_${period}`

    // Create payment record
    const paymentResult = await db.query(
      `INSERT INTO payments (user_id, order_id, plan_id, period, amount, currency, payment_method, payment_status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
       RETURNING id, order_id, amount, currency, payment_status, created_at`,
      [userId, orderId, fullPlanId, period, amount, currency, paymentMethod, `SoulAI ${planId} ${period} subscription`]
    )

    const payment = paymentResult.rows[0]

    // Generate payment URL based on method
    let paymentUrl = ''
    let qrCode = ''

    if (paymentMethod === 'alipay') {
      paymentUrl = generateAlipayUrl(orderId, amount, `SoulAI ${planId} ${period}`)
      qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`
    } else if (paymentMethod === 'wechat') {
      paymentUrl = generateWeChatPayUrl(orderId, amount, `SoulAI ${planId} ${period}`)
      qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`
    }

    res.json({
      paymentId: payment.id,
      orderId: payment.order_id,
      planId: fullPlanId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod,
      period,
      paymentUrl,
      qrCode,
      status: payment.payment_status
    })
  } catch (error) {
    console.error('Create payment intent error:', error)
    res.status(500).json({ error: 'Failed to create payment' })
  }
})

// Check payment status (supports polling)
router.get('/status/:orderId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { orderId } = req.params

    const result = await db.query(
      `SELECT id, order_id, plan_id, amount, currency, payment_method, payment_status, created_at
       FROM payments
       WHERE order_id = $1 AND user_id = $2`,
      [orderId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    const payment = result.rows[0]

    // If completed, also return subscription info
    let subscription = null
    if (payment.payment_status === 'completed') {
      const subResult = await db.query(
        `SELECT id, tier, start_date, end_date, is_active FROM subscriptions
         WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
        [userId]
      )
      if (subResult.rows.length > 0) {
        subscription = subResult.rows[0]
      }
    }

    res.json({ payment, subscription })
  } catch (error) {
    console.error('Check payment status error:', error)
    res.status(500).json({ error: 'Failed to check payment status' })
  }
})

// Get user subscription
router.get('/subscription', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    const result = await db.query(
      `SELECT id, tier, start_date, end_date, is_active, auto_renew
       FROM subscriptions
       WHERE user_id = $1 AND is_active = true
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    )

    if (result.rows.length === 0) {
      return res.json({
        subscription: {
          tier: 'free',
          isActive: true,
          startDate: null,
          endDate: null,
          autoRenew: false
        }
      })
    }

    const sub = result.rows[0]
    res.json({
      subscription: {
        id: sub.id,
        tier: sub.tier,
        isActive: sub.is_active,
        startDate: sub.start_date,
        endDate: sub.end_date,
        autoRenew: sub.auto_renew
      }
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    res.status(500).json({ error: 'Failed to get subscription' })
  }
})

// Cancel subscription
router.post('/subscription/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId

    await db.query(
      `UPDATE subscriptions SET is_active = false, auto_renew = false, updated_at = NOW() WHERE user_id = $1 AND is_active = true`,
      [userId]
    )

    await db.query(
      `UPDATE users SET subscription_tier = 'free', updated_at = NOW() WHERE id = $1`,
      [userId]
    )

    res.json({ message: 'Subscription cancelled successfully' })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    res.status(500).json({ error: 'Failed to cancel subscription' })
  }
})

// ─── Payment URL Generation ──────────────────────────────────────────────

function generateAlipayUrl(orderId: string, amount: number, subject: string): string {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19)
  const notifyUrl = process.env.ALIPAY_NOTIFY_URL || 'http://localhost:4000/api/payments/callback/alipay'
  const returnUrl = process.env.ALIPAY_RETURN_URL || 'http://localhost:3000/payment/success'

  const bizContent = JSON.stringify({
    out_trade_no: orderId,
    total_amount: amount.toFixed(2),
    subject: subject,
    product_code: 'FAST_INSTANT_TRADE_PAY'
  })

  // Common params
  const params: Record<string, string> = {
    app_id: process.env.ALIPAY_APP_ID || '',
    method: 'alipay.trade.page.pay',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: timestamp,
    version: '1.0',
    notify_url: notifyUrl,
    return_url: returnUrl,
    biz_content: bizContent
  }

  // Skip signing in development or when using placeholder keys
  const privateKey = process.env.ALIPAY_PRIVATE_KEY
  const isRealKey = privateKey && !privateKey.startsWith('your_') && privateKey.length > 50

  if (isRealKey) {
    const signContent = Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&')

    const pemKey = privateKey.includes('-----BEGIN')
      ? privateKey
      : `-----BEGIN RSA PRIVATE KEY-----\n${privateKey}\n-----END RSA PRIVATE KEY-----`

    const sign = crypto.createSign('RSA-SHA256')
    sign.update(signContent, 'utf8')
    params.sign = sign.sign(pemKey, 'base64')
  }

  return `https://openapi.alipay.com/gateway.do?${new URLSearchParams(params).toString()}`
}

function generateWeChatPayUrl(orderId: string, amount: number, body: string): string {
  const params: Record<string, string> = {
    appid: process.env.WECHAT_APP_ID || '',
    mch_id: process.env.WECHAT_MCH_ID || '',
    nonce_str: generateNonceStr(),
    body: body,
    out_trade_no: orderId,
    total_fee: Math.round(amount * 100).toString(),
    spbill_create_ip: '127.0.0.1',
    notify_url: process.env.WECHAT_NOTIFY_URL || 'http://localhost:4000/api/payments/callback/wechat',
    trade_type: 'NATIVE'
  }

  // Skip signing in development or when using placeholder keys
  const apiKey = process.env.WECHAT_API_KEY
  const isRealKey = apiKey && !apiKey.startsWith('your_') && apiKey.length > 10

  if (isRealKey) {
    const signContent = Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&') + `&key=${apiKey}`

    params.sign = crypto.createHash('md5').update(signContent, 'utf8').digest('hex').toUpperCase()
  }

  return `https://api.mch.weixin.qq.com/pay/unifiedorder?${new URLSearchParams(params).toString()}`
}

function generateNonceStr(): string {
  return crypto.randomBytes(16).toString('hex')
}

export default router
