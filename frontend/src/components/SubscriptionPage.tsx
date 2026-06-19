import React, { useState } from 'react'
import { motion } from 'motion/react'
import { Crown, Check, X, Sparkles, Shield, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSubscription, useSubscriptionPlans, useCreatePaymentIntent, useCancelSubscription } from '../hooks/useApi'
import { SubscriptionTier, SUBSCRIPTION_PRICES, SUBSCRIPTION_FEATURES } from '../lib/subscription'
import { useStore } from '../lib/store'
import { toast } from 'sonner'

const tierMeta: Record<SubscriptionTier, { label: string; icon: string; color: string; borderColor: string; bgGlow: string }> = {
  free: { label: 'Free', icon: '🌿', color: 'text-slate-400', borderColor: 'border-white/10', bgGlow: '' },
  plus: { label: 'Plus', icon: '✨', color: 'text-[#7C5CFF]', borderColor: 'border-[#7C5CFF]/30', bgGlow: 'bg-[#7C5CFF]/5' },
  premium: { label: 'Premium', icon: '👑', color: 'text-[#FFD166]', borderColor: 'border-[#FFD166]/30', bgGlow: 'bg-[#FFD166]/5' },
}

export default function SubscriptionPage() {
  const { t } = useTranslation()
  const { auth } = useStore()
  const currentTier = (auth.user?.subscriptionTier as SubscriptionTier) || 'free'
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [showPayment, setShowPayment] = useState<SubscriptionTier | null>(null)

  const { data: subData } = useSubscription()
  const createPayment = useCreatePaymentIntent()
  const cancelSub = useCancelSubscription()

  const tiers: SubscriptionTier[] = ['free', 'plus', 'premium']

  const handleSubscribe = async (tier: SubscriptionTier, method: 'alipay' | 'wechat') => {
    try {
      await createPayment.mutateAsync({ planId: tier, paymentMethod: method })
      toast.success('Payment initiated! Complete in your payment app.')
      setShowPayment(null)
    } catch (err) {
      toast.error('Payment failed. Please try again.')
    }
  }

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel your subscription?')) {
      await cancelSub.mutateAsync()
    }
  }

  return (
    <div className="space-y-6 p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <Crown className="w-8 h-8 text-[#FFD166] mx-auto" />
        <h1 className="font-display text-xl font-bold text-slate-100">Subscription</h1>
        <p className="text-slate-400 text-xs">
          Current plan: <span className={tierMeta[currentTier].color + ' font-bold'}>{tierMeta[currentTier].label}</span>
        </p>
      </div>

      {/* Period Toggle */}
      <div className="flex justify-center">
        <div className="bg-[#090D1C] border border-white/5 rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setSelectedPeriod('monthly')}
            className={`px-4 py-1.5 text-xs font-mono rounded-lg transition-all ${
              selectedPeriod === 'monthly' ? 'bg-[#7C5CFF] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedPeriod('yearly')}
            className={`px-4 py-1.5 text-xs font-mono rounded-lg transition-all ${
              selectedPeriod === 'yearly' ? 'bg-[#7C5CFF] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Yearly <span className="text-[#10B981] text-[9px]">-17%</span>
          </button>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="space-y-4">
        {tiers.map((tier) => {
          const meta = tierMeta[tier]
          const price = SUBSCRIPTION_PRICES[tier]
          const features = SUBSCRIPTION_FEATURES[tier]
          const isCurrent = tier === currentTier
          const isUpgrade = tiers.indexOf(tier) > tiers.indexOf(currentTier)

          return (
            <div
              key={tier}
              className={`relative p-5 rounded-2xl border transition-all ${meta.borderColor} ${meta.bgGlow}`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 right-4 bg-[#10B981] text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  Current
                </span>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{meta.icon}</span>
                    <h3 className={`font-display font-bold text-lg ${meta.color}`}>{meta.label}</h3>
                  </div>
                  <p className="text-slate-500 text-xs font-mono mt-1">
                    {price.monthly === 0 ? 'Free forever' : `¥${selectedPeriod === 'monthly' ? price.monthly : price.yearly}/${selectedPeriod === 'monthly' ? 'mo' : 'yr'}`}
                  </p>
                </div>

                {isUpgrade && (
                  <button
                    onClick={() => setShowPayment(tier)}
                    className="px-5 py-2 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-xs font-mono font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Upgrade
                  </button>
                )}
              </div>

              {/* Feature list */}
              <div className="grid grid-cols-2 gap-2">
                {getTierFeatureList(tier).map((feat, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-slate-400">
                    <Check className="w-3 h-3 text-[#10B981] shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Cancel button */}
      {currentTier !== 'free' && (
        <div className="text-center pt-2">
          <button
            onClick={handleCancel}
            className="text-slate-500 hover:text-red-400 text-xs font-mono transition-colors cursor-pointer"
          >
            Cancel subscription
          </button>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowPayment(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-[#11162E] border border-white/10 rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-sm text-slate-100">
                Upgrade to {tierMeta[showPayment].label}
              </h3>
              <button onClick={() => setShowPayment(null)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-400 text-xs mb-4">
              ¥{selectedPeriod === 'monthly' ? SUBSCRIPTION_PRICES[showPayment].monthly : SUBSCRIPTION_PRICES[showPayment].yearly}
              /{selectedPeriod === 'monthly' ? 'month' : 'year'}
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleSubscribe(showPayment, 'alipay')}
                disabled={createPayment.isPending}
                className="w-full py-3 bg-[#1677FF] hover:bg-[#0958d9] disabled:opacity-40 text-white text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                Pay with Alipay
              </button>
              <button
                onClick={() => handleSubscribe(showPayment, 'wechat')}
                disabled={createPayment.isPending}
                className="w-full py-3 bg-[#07C160] hover:bg={[#06ae56]} disabled:opacity-40 text-white text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                Pay with WeChat
              </button>
            </div>

            <p className="text-slate-600 text-[9px] text-center mt-3 font-mono">
              Spiritual wellness guidance for reflection and self-discovery.
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

function getTierFeatureList(tier: SubscriptionTier): string[] {
  if (tier === 'free') {
    return ['Daily insights', '5 AI chats/mo', 'Single card tarot', 'Basic astrology', 'Mood check-in', 'Journaling']
  }
  if (tier === 'plus') {
    return ['50 AI chats/mo', '3-card tarot', 'Detailed BaZi & ZiWei', 'Weekly reports', 'Emotion trends', 'No ads']
  }
  return ['Unlimited AI chats', 'Celtic Cross tarot', 'All divination systems', 'Monthly & yearly reports', 'Relationship reports', 'Priority support']
}
