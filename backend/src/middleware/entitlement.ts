import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.js'
import { db } from '../lib/db.js'

type SubscriptionTier = 'free' | 'plus' | 'premium'

const TIER_HIERARCHY: SubscriptionTier[] = ['free', 'plus', 'premium']

export function requireTier(minimumTier: SubscriptionTier) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const result = await db.query(
        'SELECT subscription_tier FROM users WHERE id = $1',
        [userId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' })
      }

      const userTier = (result.rows[0].subscription_tier || 'free') as SubscriptionTier
      const userTierIndex = TIER_HIERARCHY.indexOf(userTier)
      const requiredTierIndex = TIER_HIERARCHY.indexOf(minimumTier)

      if (userTierIndex < requiredTierIndex) {
        return res.status(403).json({
          error: 'Subscription upgrade required',
          currentTier: userTier,
          requiredTier: minimumTier,
        })
      }

      next()
    } catch (error) {
      console.error('Tier check error:', error)
      res.status(500).json({ error: 'Failed to verify subscription' })
    }
  }
}
