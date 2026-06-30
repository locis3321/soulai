import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { db } from '../lib/db.js'
import { parseWeChatXml, buildWeChatXml } from '../lib/xml.js'

const router = Router()

// ─── Alipay RSA2 Signature Verification ───────────────────────────────────
//
// Alipay sends params including `sign` (base64) and `sign_type` ("RSA2").
// Verification steps:
// 1. Remove `sign`, `sign_type`, and empty-value params
// 2. Sort remaining params by ASCII key order
// 3. Join as `key1=value1&key2=value2`
// 4. Verify RSA-SHA256 signature against Alipay's public key

function verifyAlipaySignature(params: Record<string, string>): boolean {
  const env = process.env.NODE_ENV

  // In development/test without real keys, skip verification
  if ((env === 'development' || env === 'test') && !process.env.ALIPAY_PUBLIC_KEY) {
    return true
  }

  try {
    const sign = params.sign
    if (!sign) return false

    // Build the sign content string
    const signContent = Object.keys(params)
      .filter(k => k !== 'sign' && k !== 'sign_type' && params[k] !== '' && params[k] !== undefined)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&')

    // Alipay public key (PEM format) - must be configured via env var
    const publicKeyPem = process.env.ALIPAY_PUBLIC_KEY
    if (!publicKeyPem) {
      console.error('ALIPAY_PUBLIC_KEY not configured')
      return false
    }

    // Wrap in PEM headers if not present
    const pemKey = publicKeyPem.includes('-----BEGIN')
      ? publicKeyPem
      : `-----BEGIN PUBLIC KEY-----\n${publicKeyPem}\n-----END PUBLIC KEY-----`

    const verify = crypto.createVerify('RSA-SHA256')
    verify.update(signContent, 'utf8')
    return verify.verify(pemKey, sign, 'base64')
  } catch (error) {
    console.error('Alipay signature verification error:', error)
    return false
  }
}

// ─── WeChat Pay Signature Verification ────────────────────────────────────
//
// WeChat Pay sends params including `sign`.
// Verification steps (HMAC-MD5):
// 1. Remove `sign` from params
// 2. Sort remaining params by ASCII key order
// 3. Join as `key1=value1&key2=value2`
// 4. Append `&key=<API_KEY>`
// 5. Calculate MD5, uppercase
// 6. Compare with received sign

function verifyWeChatPaySignature(params: Record<string, string>): boolean {
  const env = process.env.NODE_ENV

  // In development/test without real keys, skip verification
  if ((env === 'development' || env === 'test') && !process.env.WECHAT_API_KEY) {
    return true
  }

  try {
    const sign = params.sign
    if (!sign) return false

    const apiKey = process.env.WECHAT_API_KEY
    if (!apiKey) {
      console.error('WECHAT_API_KEY not configured')
      return false
    }

    // Build the sign content string
    const signContent = Object.keys(params)
      .filter(k => k !== 'sign' && params[k] !== '' && params[k] !== undefined)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&') + `&key=${apiKey}`

    // WeChat Pay uses HMAC-MD5 by default (or HMAC-SHA256 if configured)
    const signType = params.sign_type || 'MD5'
    let calculatedSign: string

    if (signType === 'HMAC-SHA256') {
      calculatedSign = crypto.createHmac('sha256', apiKey).update(signContent, 'utf8').digest('hex').toUpperCase()
    } else {
      calculatedSign = crypto.createHash('md5').update(signContent, 'utf8').digest('hex').toUpperCase()
    }

    return calculatedSign === sign.toUpperCase()
  } catch (error) {
    console.error('WeChat Pay signature verification error:', error)
    return false
  }
}

// ─── Callback Logging ─────────────────────────────────────────────────────
async function logCallback(paymentId: string | null, provider: string, rawBody: string, result: string, errorMessage?: string) {
  try {
    await db.query(
      `INSERT INTO payment_callback_logs (payment_id, provider, raw_body, result, error_message) VALUES ($1, $2, $3, $4, $5)`,
      [paymentId, provider, rawBody, result, errorMessage || null]
    )
  } catch (err) {
    console.error('Failed to log callback:', err)
  }
}

// ─── Alipay Async Notification ────────────────────────────────────────────
router.post('/alipay', async (req: Request, res: Response) => {
  const rawBody = JSON.stringify(req.body)
  try {
    if (!verifyAlipaySignature(req.body)) {
      console.warn('Alipay callback: invalid signature')
      await logCallback(null, 'alipay', rawBody, 'failed', 'Invalid signature')
      return res.status(400).send('fail')
    }

    const { out_trade_no, trade_no, trade_status, total_amount } = req.body

    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      const paymentResult = await db.query(
        `SELECT id, user_id, plan_id, amount FROM payments WHERE order_id = $1 AND payment_status = 'pending'`,
        [out_trade_no]
      )

      if (paymentResult.rows.length === 0) {
        await logCallback(null, 'alipay', rawBody, 'ignored', 'Order not found or already processed')
        return res.send('success')
      }

      const payment = paymentResult.rows[0]

      if (parseFloat(total_amount) !== parseFloat(payment.amount)) {
        const errMsg = `Amount mismatch: expected ${payment.amount}, received ${total_amount}`
        console.error('Alipay callback:', errMsg)
        await logCallback(payment.id, 'alipay', rawBody, 'failed', errMsg)
        return res.status(400).send('fail')
      }

      await db.query(
        `UPDATE payments SET payment_status = 'completed', provider_transaction_id = $1, updated_at = NOW() WHERE id = $2`,
        [trade_no, payment.id]
      )

      await activateSubscription(payment.user_id, payment.plan_id || 'plus')
      await logCallback(payment.id, 'alipay', rawBody, 'success')
      console.log(`Alipay payment completed: order=${out_trade_no}, user=${payment.user_id}, plan=${payment.plan_id}`)
    }

    res.send('success')
  } catch (error) {
    console.error('Alipay callback error:', error)
    await logCallback(null, 'alipay', rawBody, 'error', String(error))
    res.status(500).send('fail')
  }
})

// ─── WeChat Pay Async Notification ────────────────────────────────────────
router.post('/wechat', async (req: Request, res: Response) => {
  const xmlBody = typeof req.body === 'string' ? req.body : ''
  const rawBody = xmlBody || JSON.stringify(req.body)
  try {
    const params = xmlBody ? parseWeChatXml(xmlBody) : req.body

    if (!verifyWeChatPaySignature(params)) {
      console.warn('WeChat callback: invalid signature')
      await logCallback(null, 'wechat', rawBody, 'failed', 'Invalid signature')
      res.type('application/xml')
      return res.send(buildWeChatXml({ return_code: 'FAIL', return_msg: '签名验证失败' }))
    }

    const { out_trade_no, transaction_id, result_code, total_fee } = params

    if (result_code === 'SUCCESS') {
      const paymentResult = await db.query(
        `SELECT id, user_id, plan_id, amount FROM payments WHERE order_id = $1 AND payment_status = 'pending'`,
        [out_trade_no]
      )

      if (paymentResult.rows.length === 0) {
        await logCallback(null, 'wechat', rawBody, 'ignored', 'Order not found or already processed')
        res.type('application/xml')
        return res.send(buildWeChatXml({ return_code: 'SUCCESS', return_msg: 'OK' }))
      }

      const payment = paymentResult.rows[0]

      const expectedFee = Math.round(parseFloat(payment.amount) * 100)
      if (parseInt(total_fee) !== expectedFee) {
        const errMsg = `Amount mismatch: expected ${expectedFee}, received ${total_fee}`
        console.error('WeChat callback:', errMsg)
        await logCallback(payment.id, 'wechat', rawBody, 'failed', errMsg)
        res.type('application/xml')
        return res.send(buildWeChatXml({ return_code: 'FAIL', return_msg: '金额不匹配' }))
      }

      await db.query(
        `UPDATE payments SET payment_status = 'completed', provider_transaction_id = $1, updated_at = NOW() WHERE id = $2`,
        [transaction_id, payment.id]
      )

      await activateSubscription(payment.user_id, payment.plan_id || 'plus')
      await logCallback(payment.id, 'wechat', rawBody, 'success')
      console.log(`WeChat payment completed: order=${out_trade_no}, user=${payment.user_id}, plan=${payment.plan_id}`)
    }

    res.type('application/xml')
    res.send(buildWeChatXml({ return_code: 'SUCCESS', return_msg: 'OK' }))
  } catch (error) {
    console.error('WeChat callback error:', error)
    await logCallback(null, 'wechat', rawBody, 'error', String(error))
    res.type('application/xml')
    res.send(buildWeChatXml({ return_code: 'FAIL', return_msg: '处理失败' }))
  }
})

// ─── Activate Subscription ────────────────────────────────────────────────
async function activateSubscription(userId: string, planId: string) {
  // Extract tier and period from planId (e.g., "plus_monthly" → tier="plus", period="monthly")
  const parts = planId.split('_')
  const tier = parts[0] || 'plus'
  const period = parts[1] || 'monthly'

  const startDate = new Date()
  const endDate = new Date()
  if (period === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1)
  } else {
    endDate.setMonth(endDate.getMonth() + 1)
  }

  // Deactivate any existing active subscription
  await db.query(
    `UPDATE subscriptions SET is_active = false, updated_at = NOW() WHERE user_id = $1 AND is_active = true`,
    [userId]
  )

  await db.query(
    `INSERT INTO subscriptions (user_id, tier, start_date, end_date, is_active, auto_renew) VALUES ($1, $2, $3, $4, true, true)`,
    [userId, tier, startDate, endDate]
  )
  await db.query('UPDATE users SET subscription_tier = $1, updated_at = NOW() WHERE id = $2', [tier, userId])
}

export default router
