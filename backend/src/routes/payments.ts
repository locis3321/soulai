import { Router, Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth.js'
import { db } from '../lib/db.js'
import { z } from 'zod'

const router = Router()

// Validation schemas
const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['CNY', 'USD']).default('CNY'),
  paymentMethod: z.enum(['alipay', 'wechat']),
  description: z.string().max(500),
  productId: z.string().optional()
})

const createSubscriptionSchema = z.object({
  tier: z.enum(['plus', 'premium']),
  paymentMethod: z.enum(['alipay', 'wechat']),
  period: z.enum(['monthly', 'yearly'])
})

// Payment configuration
const PAYMENT_CONFIG = {
  alipay: {
    appId: process.env.ALIPAY_APP_ID || 'your_alipay_app_id',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || 'your_alipay_private_key',
    gateway: 'https://openapi.alipay.com/gateway.do',
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'http://localhost:4000/api/payments/alipay/notify'
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID || 'your_wechat_app_id',
    mchId: process.env.WECHAT_MCH_ID || 'your_wechat_mch_id',
    apiKey: process.env.WECHAT_API_KEY || 'your_wechat_api_key',
    notifyUrl: process.env.WECHAT_NOTIFY_URL || 'http://localhost:4000/api/payments/wechat/notify'
  }
}

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

// Get subscription plans
router.get('/plans', async (req: Request, res: Response) => {
  try {
    res.json({
      plans: [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          currency: 'CNY',
          features: [
            '每日洞察',
            '5次AI聊天',
            '单牌塔罗',
            '基础星盘',
            '情绪记录'
          ]
        },
        {
          id: 'plus',
          name: 'Plus',
          price: SUBSCRIPTION_PRICES.plus.monthly,
          currency: 'CNY',
          features: [
            '50次AI聊天',
            '三牌塔罗',
            '详细星盘',
            '每周报告',
            '情绪趋势',
            '无广告'
          ]
        },
        {
          id: 'premium',
          name: 'Premium',
          price: SUBSCRIPTION_PRICES.premium.monthly.amount,
          currency: 'CNY',
          features: [
            '无限AI聊天',
            '凯尔特十字塔罗',
            '深度报告',
            '月度/年度报告',
            '关系匹配',
            '优先支持'
          ]
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
    const { planId, paymentMethod } = req.body

    // Validate plan
    if (!['plus', 'premium'].includes(planId)) {
      return res.status(400).json({ error: 'Invalid plan' })
    }

    // Validate payment method
    if (!['alipay', 'wechat'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method. Use alipay or wechat.' })
    }

    const priceConfig = SUBSCRIPTION_PRICES[planId as keyof typeof SUBSCRIPTION_PRICES]?.monthly
    if (!priceConfig) {
      return res.status(400).json({ error: 'Invalid plan' })
    }
    const { amount, currency } = priceConfig

    // Generate order ID
    const orderId = `SOULAI_${Date.now()}_${userId?.substring(0, 8)}`

    // Create payment record
    const paymentResult = await db.query(
      `INSERT INTO payments (user_id, order_id, plan_id, amount, currency, payment_method, payment_status, description)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
       RETURNING id, amount, currency, payment_status, created_at`,
      [userId, orderId, planId, amount, currency, paymentMethod, `SoulAI ${planId} subscription`]
    )

    const payment = paymentResult.rows[0]

    // Generate payment URL based on method
    let paymentUrl = ''
    let qrCode = ''

    if (paymentMethod === 'alipay') {
      // Alipay integration
      paymentUrl = generateAlipayUrl(orderId, amount, `SoulAI ${planId} 订阅`)
      qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`
    } else if (paymentMethod === 'wechat') {
      // WeChat Pay integration
      paymentUrl = generateWeChatPayUrl(orderId, amount, `SoulAI ${planId} 订阅`)
      qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`
    }

    res.json({
      paymentId: payment.id,
      orderId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod,
      paymentUrl,
      qrCode,
      status: payment.payment_status
    })
  } catch (error) {
    console.error('Create payment intent error:', error)
    res.status(500).json({ error: 'Failed to create payment' })
  }
})

// Payment callback (Alipay)
router.post('/callback/alipay', async (req: Request, res: Response) => {
  try {
    // Verify Alipay signature
    const isValid = verifyAlipaySignature(req.body)

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' })
    }

    const { out_trade_no, trade_no, trade_status, total_amount } = req.body

    if (trade_status === 'TRADE_SUCCESS') {
      // Look up payment by order_id
      const paymentResult = await db.query(
        `SELECT id, user_id, plan_id, amount FROM payments
         WHERE order_id = $1 AND payment_status = 'pending'`,
        [out_trade_no]
      )

      if (paymentResult.rows.length === 0) {
        console.warn('Alipay callback: no pending payment found for order', out_trade_no)
        return res.json({ success: true })
      }

      const payment = paymentResult.rows[0]

      // Update payment status with provider transaction ID
      await db.query(
        `UPDATE payments
         SET payment_status = 'completed', provider_transaction_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [trade_no, payment.id]
      )

      // Activate subscription with the correct tier
      await activateSubscription(payment.user_id, payment.plan_id || 'plus')
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Alipay callback error:', error)
    res.status(500).json({ error: 'Callback processing failed' })
  }
})

// Payment callback (WeChat Pay)
router.post('/callback/wechat', async (req: Request, res: Response) => {
  try {
    // Verify WeChat Pay signature
    const isValid = verifyWeChatPaySignature(req.body)

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' })
    }

    const { out_trade_no, transaction_id, result_code, total_fee } = req.body

    if (result_code === 'SUCCESS') {
      // Look up payment by order_id
      const paymentResult = await db.query(
        `SELECT id, user_id, plan_id, amount FROM payments
         WHERE order_id = $1 AND payment_status = 'pending'`,
        [out_trade_no]
      )

      if (paymentResult.rows.length === 0) {
        console.warn('WeChat callback: no pending payment found for order', out_trade_no)
        return res.json({ success: true })
      }

      const payment = paymentResult.rows[0]

      // Update payment status with provider transaction ID
      await db.query(
        `UPDATE payments
         SET payment_status = 'completed', provider_transaction_id = $1, updated_at = NOW()
         WHERE id = $2`,
        [transaction_id, payment.id]
      )

      // Activate subscription with the correct tier
      await activateSubscription(payment.user_id, payment.plan_id || 'plus')
    }

    res.json({ success: true })
  } catch (error) {
    console.error('WeChat callback error:', error)
    res.status(500).json({ error: 'Callback processing failed' })
  }
})

// Check payment status
router.get('/status/:paymentId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    const { paymentId } = req.params

    const result = await db.query(
      `SELECT id, amount, currency, payment_method, payment_status, created_at
       FROM payments
       WHERE id = $1 AND user_id = $2`,
      [paymentId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    res.json({ payment: result.rows[0] })
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

    // Deactivate current subscription
    await db.query(
      `UPDATE subscriptions 
       SET is_active = false, auto_renew = false, updated_at = NOW()
       WHERE user_id = $1 AND is_active = true`,
      [userId]
    )

    // Update user tier
    await db.query(
      `UPDATE users 
       SET subscription_tier = 'free', updated_at = NOW()
       WHERE id = $1`,
      [userId]
    )

    res.json({ message: 'Subscription cancelled successfully' })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    res.status(500).json({ error: 'Failed to cancel subscription' })
  }
})

// Helper functions for payment integration

function generateAlipayUrl(orderId: string, amount: number, subject: string): string {
  // In production, use Alipay SDK
  // This is a simplified version for demo
  const params = new URLSearchParams({
    app_id: process.env.ALIPAY_APP_ID || 'demo_app_id',
    method: 'alipay.trade.page.pay',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    version: '1.0',
    notify_url: process.env.ALIPAY_NOTIFY_URL || 'http://localhost:4000/api/payments/callback/alipay',
    return_url: process.env.ALIPAY_RETURN_URL || 'http://localhost:3000/payment/success',
    biz_content: JSON.stringify({
      out_trade_no: orderId,
      total_amount: amount.toFixed(2),
      subject: subject,
      product_code: 'FAST_INSTANT_TRADE_PAY'
    })
  })

  return `https://openapi.alipay.com/gateway.do?${params.toString()}`
}

function generateWeChatPayUrl(orderId: string, amount: number, body: string): string {
  // In production, use WeChat Pay SDK
  // This is a simplified version for demo
  const params = new URLSearchParams({
    appid: process.env.WECHAT_APP_ID || 'demo_app_id',
    mch_id: process.env.WECHAT_MCH_ID || 'demo_mch_id',
    nonce_str: generateNonceStr(),
    body: body,
    out_trade_no: orderId,
    total_fee: Math.round(amount * 100).toString(),
    spbill_create_ip: '127.0.0.1',
    notify_url: process.env.WECHAT_NOTIFY_URL || 'http://localhost:4000/api/payments/callback/wechat',
    trade_type: 'NATIVE'
  })

  return `https://api.mch.weixin.qq.com/pay/unifiedorder?${params.toString()}`
}

function generateNonceStr(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function verifyAlipaySignature(params: any): boolean {
  // In production, implement proper signature verification
  // This is a simplified version for demo
  return true
}

function verifyWeChatPaySignature(params: any): boolean {
  // In production, implement proper signature verification
  // This is a simplified version for demo
  return true
}

async function activateSubscription(userId: string, tier: string) {
  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 1)

  await db.query(
    `INSERT INTO subscriptions (user_id, tier, start_date, end_date, is_active, auto_renew)
     VALUES ($1, $2, $3, $4, true, true)`,
    [userId, tier, startDate, endDate]
  )

  await db.query(
    'UPDATE users SET subscription_tier = $1, updated_at = NOW() WHERE id = $2',
    [tier, userId]
  )
}

export default router
