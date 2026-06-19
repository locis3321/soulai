import { describe, it, expect } from 'vitest'
import {
  hasFeatureAccess,
  getFeatureLimit,
  canUseFeature,
  getUpgradeRecommendation,
  SUBSCRIPTION_FEATURES,
  SUBSCRIPTION_PRICES
} from '../subscription'

describe('Subscription', () => {
  describe('hasFeatureAccess', () => {
    it('should return true for free features', () => {
      expect(hasFeatureAccess('free', 'dailyInsights')).toBe(true)
      expect(hasFeatureAccess('free', 'moodCheckIn')).toBe(true)
      expect(hasFeatureAccess('free', 'breathingExercise')).toBe(true)
    })

    it('should return false for premium features on free tier', () => {
      expect(hasFeatureAccess('free', 'tarotDeepReading')).toBe(false)
      expect(hasFeatureAccess('free', 'yearlyReport')).toBe(false)
      expect(hasFeatureAccess('free', 'prioritySupport')).toBe(false)
    })

    it('should return true for plus features on plus tier', () => {
      expect(hasFeatureAccess('plus', 'tarotThreeCards')).toBe(true)
      expect(hasFeatureAccess('plus', 'weeklyReport')).toBe(true)
      expect(hasFeatureAccess('plus', 'meditationPremium')).toBe(true)
    })

    it('should return true for all features on premium tier', () => {
      expect(hasFeatureAccess('premium', 'tarotDeepReading')).toBe(true)
      expect(hasFeatureAccess('premium', 'yearlyReport')).toBe(true)
      expect(hasFeatureAccess('premium', 'prioritySupport')).toBe(true)
    })
  })

  describe('getFeatureLimit', () => {
    it('should return correct limits for free tier', () => {
      expect(getFeatureLimit('free', 'aiChatMessages')).toBe(5)
      expect(getFeatureLimit('free', 'dailyInsights')).toBe(true)
    })

    it('should return correct limits for plus tier', () => {
      expect(getFeatureLimit('plus', 'aiChatMessages')).toBe(50)
      expect(getFeatureLimit('plus', 'tarotThreeCards')).toBe(true)
    })

    it('should return -1 for unlimited features on premium tier', () => {
      expect(getFeatureLimit('premium', 'aiChatMessages')).toBe(-1)
    })
  })

  describe('canUseFeature', () => {
    it('should allow usage within limits', () => {
      expect(canUseFeature('free', 'aiChatMessages', 3)).toBe(true)
      expect(canUseFeature('free', 'aiChatMessages', 5)).toBe(false)
    })

    it('should allow unlimited usage on premium tier', () => {
      expect(canUseFeature('premium', 'aiChatMessages', 100)).toBe(true)
    })

    it('should handle boolean features', () => {
      expect(canUseFeature('free', 'dailyInsights')).toBe(true)
      expect(canUseFeature('free', 'tarotDeepReading')).toBe(false)
    })
  })

  describe('getUpgradeRecommendation', () => {
    it('should recommend plus for free user wanting plus features', () => {
      const recommendation = getUpgradeRecommendation('free', 'tarotThreeCards')
      expect(recommendation).toBe('plus')
    })

    it('should recommend premium for free user wanting premium features', () => {
      const recommendation = getUpgradeRecommendation('free', 'tarotDeepReading')
      expect(recommendation).toBe('premium')
    })

    it('should recommend premium for plus user wanting premium features', () => {
      const recommendation = getUpgradeRecommendation('plus', 'yearlyReport')
      expect(recommendation).toBe('premium')
    })

    it('should return null if already on highest tier', () => {
      const recommendation = getUpgradeRecommendation('premium', 'prioritySupport')
      expect(recommendation).toBeNull()
    })
  })

  describe('SUBSCRIPTION_FEATURES', () => {
    it('should have all tiers defined', () => {
      expect(SUBSCRIPTION_FEATURES).toHaveProperty('free')
      expect(SUBSCRIPTION_FEATURES).toHaveProperty('plus')
      expect(SUBSCRIPTION_FEATURES).toHaveProperty('premium')
    })

    it('should have all features for each tier', () => {
      const tiers = ['free', 'plus', 'premium'] as const
      
      tiers.forEach(tier => {
        const features = SUBSCRIPTION_FEATURES[tier]
        expect(features).toHaveProperty('dailyInsights')
        expect(features).toHaveProperty('aiChatMessages')
        expect(features).toHaveProperty('tarotSingleCard')
        expect(features).toHaveProperty('moodCheckIn')
        expect(features).toHaveProperty('journaling')
      })
    })
  })

  describe('SUBSCRIPTION_PRICES', () => {
    it('should have prices for all tiers', () => {
      expect(SUBSCRIPTION_PRICES).toHaveProperty('free')
      expect(SUBSCRIPTION_PRICES).toHaveProperty('plus')
      expect(SUBSCRIPTION_PRICES).toHaveProperty('premium')
    })

    it('should have monthly and yearly prices', () => {
      Object.values(SUBSCRIPTION_PRICES).forEach(prices => {
        expect(prices).toHaveProperty('monthly')
        expect(prices).toHaveProperty('yearly')
      })
    })

    it('should have free tier at zero cost', () => {
      expect(SUBSCRIPTION_PRICES.free.monthly).toBe(0)
      expect(SUBSCRIPTION_PRICES.free.yearly).toBe(0)
    })

    it('should have positive prices for paid tiers', () => {
      expect(SUBSCRIPTION_PRICES.plus.monthly).toBeGreaterThan(0)
      expect(SUBSCRIPTION_PRICES.plus.yearly).toBeGreaterThan(0)
      expect(SUBSCRIPTION_PRICES.premium.monthly).toBeGreaterThan(0)
      expect(SUBSCRIPTION_PRICES.premium.yearly).toBeGreaterThan(0)
    })

    it('should have yearly prices less than 12x monthly', () => {
      expect(SUBSCRIPTION_PRICES.plus.yearly).toBeLessThan(SUBSCRIPTION_PRICES.plus.monthly * 12)
      expect(SUBSCRIPTION_PRICES.premium.yearly).toBeLessThan(SUBSCRIPTION_PRICES.premium.monthly * 12)
    })
  })
})
