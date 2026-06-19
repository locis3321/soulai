import { Router, Request, Response } from 'express'
import { db } from '../lib/db.js'

const router = Router()

// Alipay payment callback
router.post('/alipay', async (req: Request, res: Response) => {
  try {
    if (!verifyAlipaySignature(req.body)) {
      return res.status(400).json({ error: 'Invalid signature' })
    }

    const { out_trade_no, trade_no, trade_status } = req.body

    if (trade_status === 'TRADE_SUCCESS') {
      const paymentResult = await db.query(
        `SELECT id, user_id, plan_id FROM payments WHERE order_id = $1 AND payment_status = 'pending'`,
        [out_trade_no]
      )

      if (paymentResult.rows.length === 0) {
        return res.json({ success: true })
      }

      const payment = paymentResult.rows[0]

      await db.query(
        `UPDATE payments SET payment_status = 'completed', provider_transaction_id = $1, updated_at = NOW() WHERE id = $2`,
        [trade_no, payment.id]
      )

      await activateSubscription(payment.user_id, payment.plan_id || 'plus')
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Alipay callback error:', error)
    res.status(500).json({ error: 'Callback processing failed' })
  }
})

// WeChat Pay payment callback
router.post('/wechat', async (req: Request, res: Response) => {
  try {
    if (!verifyWeChatPaySignature(req.body)) {
      return res.status(400).json({ error: 'Invalid signature' })
    }

    const { out_trade_no, transaction_id, result_code } = req.body

    if (result_code === 'SUCCESS') {
      const paymentResult = await db.query(
        `SELECT id, user_id, plan_id FROM payments WHERE order_id = $1 AND payment_status = 'pending'`,
        [out_trade_no]
      )

      if (paymentResult.rows.length === 0) {
        return res.json({ success: true })
      }

      const payment = paymentResult.rows[0]

      await db.query(
        `UPDATE payments SET payment_status = 'completed', provider_transaction_id = $1, updated_at = NOW() WHERE id = $2`,
        [transaction_id, payment.id]
      )

      await activateSubscription(payment.user_id, payment.plan_id || 'plus')
    }

    res.json({ success: true })
  } catch (error) {
    console.error('WeChat callback error:', error)
    res.status(500).json({ error: 'Callback processing failed' })
  }
})

async function activateSubscription(userId: string, tier: string) {
  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 1)

  await db.query(
    `INSERT INTO subscriptions (user_id, tier, start_date, end_date, is_active, auto_renew) VALUES ($1, $2, $3, $4, true, true)`,
    [userId, tier, startDate, endDate]
  )
  await db.query('UPDATE users SET subscription_tier = $1, updated_at = NOW() WHERE id = $2', [tier, userId])
}

function verifyAlipaySignature(_params: any): boolean {
  // TODO: implement real Alipay RSA2 signature verification in production
  return true
}

function verifyWeChatPaySignature(_params: any): boolean {
  // TODO: implement real WeChat Pay signature verification in production
  return true
}

export default router
