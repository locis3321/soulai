import React, { useEffect, useState, useRef } from 'react'
import { motion } from 'motion/react'
import { CheckCircle, Loader2, Crown, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { api } from '../lib/api'

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 300000 // 5 minutes

export default function PaymentSuccessPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setUser } = useStore()

  const orderId = searchParams.get('orderId')
  const [status, setStatus] = useState<'polling' | 'success' | 'pending' | 'error'>('polling')
  const [paymentData, setPaymentData] = useState<any>(null)
  const pollCountRef = useRef(0)

  useEffect(() => {
    if (!orderId) {
      // No orderId: just check subscription once (legacy flow)
      checkSubscriptionOnce()
      return
    }

    // Poll order status
    const startTime = Date.now()
    let timer: ReturnType<typeof setTimeout>

    const poll = async () => {
      if (Date.now() - startTime > POLL_TIMEOUT_MS) {
        setStatus('pending')
        return
      }

      try {
        const data = await api.getPaymentStatus(orderId)
        setPaymentData(data.payment)

        if (data.payment?.payment_status === 'completed') {
          setStatus('success')
          // Refresh user data
          const meData = await api.getMe()
          if (meData.user) setUser(meData.user)
          return
        }

        // Still pending, poll again
        pollCountRef.current++
        timer = setTimeout(poll, POLL_INTERVAL_MS)
      } catch (err) {
        console.error('Payment status poll error:', err)
        setStatus('error')
      }
    }

    // Start polling after short delay
    timer = setTimeout(poll, 1000)
    return () => clearTimeout(timer)
  }, [orderId, setUser])

  const checkSubscriptionOnce = async () => {
    try {
      const data = await api.getSubscription()
      if (data.subscription?.isActive && data.subscription?.tier !== 'free') {
        setStatus('success')
        setPaymentData({ payment_status: 'completed' })
      } else {
        setStatus('pending')
      }
      const meData = await api.getMe()
      if (meData.user) setUser(meData.user)
    } catch {
      setStatus('error')
    }
  }

  const tier = paymentData?.plan_id?.split('_')[0] || 'plus'

  return (
    <div className="min-h-screen bg-temple-dark flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#11162E] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center space-y-6"
      >
        {status === 'polling' && (
          <>
            <Loader2 className="h-12 w-12 text-[#7C5CFF] animate-spin mx-auto" />
            <h2 className="font-display text-xl font-bold text-slate-100">{t('payment.processing')}</h2>
            <p className="text-slate-400 text-sm">{t('payment.processingDesc')}</p>
            <p className="text-slate-500 text-[10px] font-mono">Order: {orderId}</p>
          </>
        )}

        {status === 'success' && (
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
              onClick={() => navigate('/')}
              className="w-full py-3 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-sm font-mono font-bold rounded-xl transition-all cursor-pointer"
            >
              {t('payment.continueToApp')}
            </button>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
              <Clock className="h-10 w-10 text-amber-400" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-100">{t('payment.pending')}</h2>
            <p className="text-slate-400 text-sm">{t('payment.pendingDesc')}</p>
            {orderId && <p className="text-slate-500 text-[10px] font-mono">Order: {orderId}</p>}
            <button
              onClick={() => navigate('/profile')}
              className="w-full py-3 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-sm font-mono font-bold rounded-xl transition-all cursor-pointer"
            >
              {t('payment.checkStatus')}
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="font-display text-xl font-bold text-slate-100">Payment Error</h2>
            <p className="text-slate-400 text-sm">Unable to verify payment status. Please check your subscription in your profile.</p>
            <button
              onClick={() => navigate('/profile')}
              className="w-full py-3 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-sm font-mono font-bold rounded-xl transition-all cursor-pointer"
            >
              Go to Profile
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
