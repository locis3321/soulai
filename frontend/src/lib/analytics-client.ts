// Analytics event tracking client
// Sends events to backend /api/analytics/track

const ANALYTICS_ENABLED = true
const BATCH_SIZE = 10
const FLUSH_INTERVAL = 30000 // 30 seconds

interface AnalyticsEvent {
  event: string
  properties?: Record<string, unknown>
  timestamp?: string
}

class AnalyticsClient {
  private queue: AnalyticsEvent[] = []
  private flushTimer: ReturnType<typeof setInterval> | null = null
  private getToken: () => string | null = () => null

  init(getToken: () => string | null) {
    this.getToken = getToken
    this.flushTimer = setInterval(() => this.flush(), FLUSH_INTERVAL)
  }

  track(event: string, properties?: Record<string, unknown>) {
    if (!ANALYTICS_ENABLED) return

    this.queue.push({
      event,
      properties,
      timestamp: new Date().toISOString(),
    })

    if (this.queue.length >= BATCH_SIZE) {
      this.flush()
    }
  }

  async flush() {
    if (this.queue.length === 0) return

    const events = [...this.queue]
    this.queue = []

    const token = this.getToken()
    if (!token) return

    try {
      await fetch('/api/analytics/track/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ events }),
      })
    } catch (err) {
      // Silently fail - analytics should not break the app
      console.debug('Analytics flush failed:', err)
    }
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }
    this.flush()
  }
}

export const analytics = new AnalyticsClient()

// Convenience event trackers
export function trackPageView(page: string) {
  analytics.track('page_view', { page })
}

export function trackFeatureUsed(feature: string, context?: Record<string, unknown>) {
  analytics.track('feature_used', { feature, ...context })
}

export function trackDivination(type: string, spreadType?: string) {
  analytics.track('divination', { type, spreadType })
}

export function trackPayment(planId: string, method: string, period: string) {
  analytics.track('payment_initiated', { planId, method, period })
}

export function trackSubscription(tier: string, action: 'activate' | 'cancel') {
  analytics.track('subscription', { tier, action })
}

export function trackChatMessage(advisorKey: string) {
  analytics.track('chat_message', { advisorKey })
}

export function trackMoodCheckin(mood: string) {
  analytics.track('mood_checkin', { mood })
}

export function trackJournalCreate() {
  analytics.track('journal_create')
}

export function trackOnboardingStep(step: number) {
  analytics.track('onboarding_step', { step })
}

export function trackOnboardingComplete() {
  analytics.track('onboarding_complete')
}

export function trackError(error: string, context?: string) {
  analytics.track('error', { error, context })
}
