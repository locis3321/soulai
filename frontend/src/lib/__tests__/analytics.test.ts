import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analytics } from '../analytics'

describe('Analytics', () => {
  beforeEach(() => {
    analytics.clearEvents()
    analytics.setEnabled(true)
  })

  it('should track events', () => {
    analytics.track('test_event', { key: 'value' })
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('test_event')
    expect(events[0].properties).toEqual({ key: 'value' })
  })

  it('should track page views', () => {
    analytics.trackPageView('home')
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('page_view')
    expect(events[0].properties).toEqual({ page: 'home' })
  })

  it('should track interactions', () => {
    analytics.trackInteraction('button', 'click', { id: 'submit' })
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('interaction')
    expect(events[0].properties).toEqual({
      component: 'button',
      action: 'click',
      id: 'submit'
    })
  })

  it('should track feature usage', () => {
    analytics.trackFeatureUsage('tarot', 'draw_card', { spread: 'single' })
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('feature_usage')
    expect(events[0].properties).toEqual({
      feature: 'tarot',
      action: 'draw_card',
      spread: 'single'
    })
  })

  it('should track errors', () => {
    const error = new Error('Test error')
    analytics.trackError(error, { context: 'test' })
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('error')
    expect(events[0].properties).toEqual({
      message: 'Test error',
      stack: error.stack,
      context: 'test'
    })
  })

  it('should track AI interactions', () => {
    analytics.trackAiInteraction('luna', 'message', { content: 'Hello' })
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('ai_interaction')
    expect(events[0].properties).toEqual({
      advisor: 'luna',
      messageType: 'message',
      content: 'Hello'
    })
  })

  it('should track divination usage', () => {
    analytics.trackDivination('tarot', 'reading', { cards: 3 })
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('divination')
    expect(events[0].properties).toEqual({
      type: 'tarot',
      action: 'reading',
      cards: 3
    })
  })

  it('should track healing activities', () => {
    analytics.trackHealing('meditation', 'complete', { duration: 300 })
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('healing')
    expect(events[0].properties).toEqual({
      activity: 'meditation',
      action: 'complete',
      duration: 300
    })
  })

  it('should track onboarding steps', () => {
    analytics.trackOnboarding('step_1', 'complete', { language: 'en' })
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('onboarding')
    expect(events[0].properties).toEqual({
      step: 'step_1',
      action: 'complete',
      language: 'en'
    })
  })

  it('should track paywall interactions', () => {
    analytics.trackPaywall('view', { tier: 'premium' })
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(1)
    expect(events[0].name).toBe('paywall')
    expect(events[0].properties).toEqual({
      action: 'view',
      tier: 'premium'
    })
  })

  it('should not track when disabled', () => {
    analytics.setEnabled(false)
    analytics.track('test_event')
    
    const events = analytics.getEvents()
    expect(events).toHaveLength(0)
  })

  it('should clear events', () => {
    analytics.track('event_1')
    analytics.track('event_2')
    
    expect(analytics.getEvents()).toHaveLength(2)
    
    analytics.clearEvents()
    
    expect(analytics.getEvents()).toHaveLength(0)
  })

  it('should get event count', () => {
    analytics.track('event_1')
    analytics.track('event_2')
    analytics.track('event_3')
    
    expect(analytics.getEventCount()).toBe(3)
  })
})
