import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle, Loader2, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../lib/store'
import { api } from '../lib/api'

export default function PaymentSuccessPage() {
  const { t } = useTranslation()
  const { setUser, setActiveTab } = useStore()
  const [checking, setChecking] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const data = await api.getSubscription()
        setSubscription(data.subscription)
        const meData = await api.getMe()
        if (meData.user) setUser(meData.user)
      } catch (err) {
        console.error('Failed to check subscription:', err)
      } finally {
        setChecking(false)
      }
    }
    const timer = setTimeout(checkSubscription, 2000)
    return () => clearTimeout(timer)
  }, [setUser])

  const tier = subscription?.tier || 'free'
  const isActive = subscription?.isActive || false

  return (
    <div className="min-h-screen bg-temple-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#11162E] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center space-y-6"
      >
        {checking ? (
          <>
            <Loader2 className="h-12 w-12 text-[#7C5CFF] animate-spin mx-auto" />
            <h2 className="font-display text-xl font-bold text-slate-100">{t('payment.processing')}</h2>
            <p className="text-slate-400 text-sm">{t('payment.processingDesc')}</p>
          </>
        ) : isActive && tier !== 'free' ? (
          <>
            <div className="w-16 h-16 bg-[#10B981]/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-[#10B981]" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-100">{t('payment.success')}</h2>
            <div className="bg-[#090D1C] p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-[#FFD166]" />
                <span className="font-display font-bold text-[#FFD166] capitalize">{tier}</span>
              </div>
              <p className="text-slate-400 text-xs">{t('payment.planActive', { tier })}</p>
            </div>
            <button
              onClick={() => setActiveTab('home')}
              className="w-full py-3 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-sm font-mono font-bold rounded-xl transition-all cursor-pointer"
            >
              {t('payment.continueToApp')}
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">⏳</span>
            </div>
            <h2 className="font-display text-xl font-bold text-slate-100">{t('payment.pending')}</h2>
            <p className="text-slate-400 text-sm">{t('payment.pendingDesc')}</p>
            <button
              onClick={() => setActiveTab('profile')}
              className="w-full py-3 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-sm font-mono font-bold rounded-xl transition-all cursor-pointer"
            >
              {t('payment.checkStatus')}
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
