import { db } from '../lib/db.js'

/**
 * Check and auto-downgrade expired subscriptions.
 * Marks subscriptions as inactive and reverts users to free tier
 * when their end_date has passed.
 */
export async function downgradeExpiredSubscriptions(): Promise<number> {
  try {
    // Find all active subscriptions that have expired
    const expired = await db.query(
      `SELECT id, user_id, tier FROM subscriptions
       WHERE is_active = true AND end_date IS NOT NULL AND end_date < NOW()`
    )

    if (expired.rows.length === 0) return 0

    // Deactivate expired subscriptions
    await db.query(
      `UPDATE subscriptions SET is_active = false, updated_at = NOW()
       WHERE is_active = true AND end_date IS NOT NULL AND end_date < NOW()`
    )

    // Revert each user to free tier
    for (const sub of expired.rows) {
      await db.query(
        `UPDATE users SET subscription_tier = 'free', updated_at = NOW() WHERE id = $1`,
        [sub.user_id]
      )
    }

    console.log(`Downgraded ${expired.rows.length} expired subscriptions`)
    return expired.rows.length
  } catch (error) {
    console.error('Failed to downgrade expired subscriptions:', error)
    return 0
  }
}

/**
 * Get the effective subscription tier for a user.
 * Checks if the subscription has expired and downgrades if needed.
 */
export async function getEffectiveTier(userId: string): Promise<string> {
  // Check if user has an active subscription that hasn't expired
  const result = await db.query(
    `SELECT tier, end_date FROM subscriptions
     WHERE user_id = $1 AND is_active = true
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  )

  if (result.rows.length === 0) {
    return 'free'
  }

  const sub = result.rows[0]

  // Check if subscription has expired
  if (sub.end_date && new Date(sub.end_date) < new Date()) {
    // Auto-downgrade
    await db.query(
      `UPDATE subscriptions SET is_active = false, updated_at = NOW() WHERE user_id = $1 AND is_active = true`,
      [userId]
    )
    await db.query(
      `UPDATE users SET subscription_tier = 'free', updated_at = NOW() WHERE id = $1`,
      [userId]
    )
    return 'free'
  }

  return sub.tier || 'free'
}
