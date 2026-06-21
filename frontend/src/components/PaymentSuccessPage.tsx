import React, { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle, Loader2, Crown } from 'lucide-react'
import { useStore } from '../lib/store'
import { api } from '../lib/api'

export default function PaymentSuccessPage() {
  const { setUser, setActiveTab } = useStore()
  const [checking, setChecking] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    // Poll for subscription update
    const checkSubscription = async () => {
      try {
        const data = await api.getSubscription()
        setSubscription(data.subscription)

        // Refresh user data to get updated tier
        const meData = await api.getMe()
        if (meData.user) setUser(meData.user)
      } catch (err) {
        console.error('Failed to check subscription:', err)
      } finally {
        setChecking(false)
      }
    }

    // Small delay to allow callback processing
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
            <h2 className="font-display text-xl font-bold text-slate-100">Processing Payment...</h2>
            <p className="text-slate-400 text-sm">Please wait while we confirm your subscription.</p>
          </>
        ) : isActive && tier !== 'free' ? (
          <>
            <div className="w-16 h-16 bg-[#10B981]/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-[#10B981]" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-100">Payment Successful!</h2>
            <div className="bg-[#090D1C] p-4 rounded-xl border border-white/5">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-[#FFD166]" />
                <span className="font-display font-bold text-[#FFD166] capitalize">{tier} Plan</span>
              </div>
              <p className="text-slate-400 text-xs">
                Your subscription is now active. Enjoy all {tier} features!
              </p>
            </div>
            <button
              onClick={() => setActiveTab('home')}
              className="w-full py-3 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-sm font-mono font-bold rounded-xl transition-all cursor-pointer"
            >
              Continue to App
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">⏳</span>
            </div>
            <h2 className="font-display text-xl font-bold text-slate-100">Payment Pending</h2>
            <p className="text-slate-400 text-sm">
              Your payment is still being processed. It may take a few moments to activate.
            </p>
            <button
              onClick={() => setActiveTab('profile')}
              className="w-full py-3 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-sm font-mono font-bold rounded-xl transition-all cursor-pointer"
            >
              Check Subscription Status
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
