import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SubscriptionTier, SUBSCRIPTION_PRICES } from '../lib/subscription'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  requiredTier: SubscriptionTier
  currentTier: SubscriptionTier
  onSubscribe: (tier: SubscriptionTier) => void
}

const tierLabelKeys: Record<SubscriptionTier, string> = {
  free: 'subscription.free',
  plus: 'subscription.plus',
  premium: 'subscription.premium',
}

function getTierHighlights(tier: SubscriptionTier): string[] {
  if (tier === 'plus') {
    return ['subscription.feature50Chats', 'subscription.feature3CardTarot', 'subscription.featureDetailedCharts', 'subscription.featureWeeklyReports', 'subscription.featureNoAds']
  }
  return ['subscription.featureUnlimitedChats', 'subscription.featureCelticTarot', 'subscription.featureAllDivination', 'subscription.featureMonthlyYearlyReports', 'subscription.featurePrioritySupport']
}

export default function PaywallModal({ isOpen, onClose, feature, requiredTier, currentTier, onSubscribe }: PaywallModalProps) {
  const { t } = useTranslation()
  const tiers: SubscriptionTier[] = ['plus', 'premium']

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#11162E] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#FFD166]">{t('paywall.unlockFeature')}</span>
                <h2 className="font-display text-lg font-bold text-slate-100 mt-1">{feature}</h2>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400 text-xs mb-5 leading-relaxed">
              {t('paywall.upgradeDesc', { tier: t(tierLabelKeys[requiredTier]) })}
            </p>

            {/* Tier Cards */}
            <div className="space-y-3">
              {tiers.map((tier) => {
                const isCurrentOrBelow = tiers.indexOf(tier) <= tiers.indexOf(currentTier)
                const isRequired = tier === requiredTier
                const price = SUBSCRIPTION_PRICES[tier]

                return (
                  <div
                    key={tier}
                    className={`relative p-4 rounded-xl border transition-all ${
                      isRequired
                        ? 'border-[#7C5CFF]/50 bg-[#7C5CFF]/10'
                        : 'border-white/5 bg-[#090D1C]'
                    }`}
                  >
                    {isRequired && (
                      <span className="absolute -top-2.5 left-4 bg-[#7C5CFF] text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                        {t('paywall.recommended')}
                      </span>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tier === 'plus' ? '✨' : '👑'}</span>
                        <div>
                          <h3 className={`font-display font-bold text-sm ${tier === 'plus' ? 'text-[#7C5CFF]' : 'text-[#FFD166]'}`}>
                            {t(tierLabelKeys[tier])}
                          </h3>
                          <p className="text-slate-500 text-[10px] font-mono">
                            ¥{price.monthly}{t('paywall.monthly')} · ¥{price.yearly}{t('paywall.yearly')}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onSubscribe(tier)}
                        disabled={isCurrentOrBelow}
                        className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all ${
                          isCurrentOrBelow
                            ? 'bg-white/5 text-slate-500 cursor-default'
                            : 'bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white cursor-pointer'
                        }`}
                      >
                        {isCurrentOrBelow ? t('subscription.current') : t('subscription.upgrade')}
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      {getTierHighlights(tier).map((key, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                          <span>{t(key)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-slate-600 text-[9px] text-center mt-4 font-mono">
              {t('subscription.disclaimer')}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
