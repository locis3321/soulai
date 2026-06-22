import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.js'
import { db } from '../lib/db.js'
import { getEffectiveTier } from '../lib/subscription.js'

type SubscriptionTier = 'free' | 'plus' | 'premium'

const TIER_HIERARCHY: SubscriptionTier[] = ['free', 'plus', 'premium']

interface FeatureConfig {
  requiredTier: SubscriptionTier
  monthlyLimit: number // -1 = unlimited
}

// Feature entitlement definitions
const FEATURES: Record<string, FeatureConfig> = {
  // Chat
  'chat.message': { requiredTier: 'free', monthlyLimit: 5 },
  'chat.unlimited': { requiredTier: 'premium', monthlyLimit: -1 },

  // Tarot
  'tarot.single': { requiredTier: 'free', monthlyLimit: -1 },
  'tarot.three': { requiredTier: 'plus', monthlyLimit: -1 },
  'tarot.celtic': { requiredTier: 'plus', monthlyLimit: -1 },

  // Divination
  'astrology.basic': { requiredTier: 'free', monthlyLimit: -1 },
  'astrology.detailed': { requiredTier: 'plus', monthlyLimit: -1 },
  'bazi.basic': { requiredTier: 'free', monthlyLimit: -1 },
  'bazi.detailed': { requiredTier: 'plus', monthlyLimit: -1 },
  'ziwei.basic': { requiredTier: 'free', monthlyLimit: -1 },
  'ziwei.detailed': { requiredTier: 'plus', monthlyLimit: -1 },
  'numerology': { requiredTier: 'free', monthlyLimit: -1 },

  // Reports
  'report.weekly': { requiredTier: 'plus', monthlyLimit: 4 },
  'report.monthly': { requiredTier: 'premium', monthlyLimit: 1 },
  'report.yearly': { requiredTier: 'premium', monthlyLimit: 1 },
  'report.relationship': { requiredTier: 'premium', monthlyLimit: 2 },

  // Marketplace
  'marketplace.book': { requiredTier: 'plus', monthlyLimit: -1 },
  'marketplace.priority': { requiredTier: 'premium', monthlyLimit: -1 },

  // Community
  'community.post': { requiredTier: 'plus', monthlyLimit: -1 },
  'community.comment': { requiredTier: 'plus', monthlyLimit: -1 },
}

export function requireTier(minimumTier: SubscriptionTier) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      // getEffectiveTier auto-downgrades expired subscriptions
      const userTier = (await getEffectiveTier(userId)) as SubscriptionTier
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

export function checkEntitlement(featureKey: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const feature = FEATURES[featureKey]
      if (!feature) {
        console.warn(`Unknown feature key: ${featureKey}`)
        return next()
      }

      // getEffectiveTier auto-downgrades expired subscriptions
      const userTier = (await getEffectiveTier(userId)) as SubscriptionTier
      const userTierIndex = TIER_HIERARCHY.indexOf(userTier)
      const requiredTierIndex = TIER_HIERARCHY.indexOf(feature.requiredTier)

      if (userTierIndex < requiredTierIndex) {
        return res.status(403).json({
          error: 'Subscription upgrade required',
          feature: featureKey,
          currentTier: userTier,
          requiredTier: feature.requiredTier,
        })
      }

      // Check usage limit if applicable
      if (feature.monthlyLimit > 0) {
        const usageResult = await db.query(
          `SELECT COUNT(*) as count FROM user_activity
           WHERE user_id = $1 AND activity_type = $2
           AND created_at > date_trunc('month', NOW())`,
          [userId, featureKey]
        )

        const currentUsage = parseInt(usageResult.rows[0]?.count || '0')
        if (currentUsage >= feature.monthlyLimit) {
          return res.status(429).json({
            error: 'Monthly usage limit reached',
            feature: featureKey,
            limit: feature.monthlyLimit,
            used: currentUsage,
          })
        }
      }

      next()
    } catch (error) {
      console.error('Entitlement check error:', error)
      res.status(500).json({ error: 'Failed to verify entitlement' })
    }
  }
}

export function trackUsage(userId: string, featureKey: string) {
  db.query(
    `INSERT INTO user_activity (user_id, activity_type, activity_data)
     VALUES ($1, $2, $3)`,
    [userId, featureKey, JSON.stringify({ timestamp: new Date().toISOString() })]
  ).catch(err => console.error('Usage tracking error:', err))
}
