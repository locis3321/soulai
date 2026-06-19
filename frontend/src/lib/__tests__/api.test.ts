import { describe, it, expect, vi, beforeEach } from 'vitest'
import { soulApi } from '../api'

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('getDailyInsight', () => {
    it('should call API with correct parameters', async () => {
      const mockResponse = {
        energy: { love: 85, career: 75, finance: 80, mood: 90 },
        dailyMessage: 'Test message'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await soulApi.getDailyInsight('Test User', 'calm', 'en')

      expect(global.fetch).toHaveBeenCalledWith('/api/daily-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User', mood: 'calm', lang: 'en' })
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })

    it('should handle API error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      })

      const result = await soulApi.getDailyInsight('Test User', 'calm', 'en')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'))

      const result = await soulApi.getDailyInsight('Test User', 'calm', 'en')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('getAstrologyReading', () => {
    it('should call API with correct parameters', async () => {
      const mockResponse = {
        reading: 'Test astrology reading'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const result = await soulApi.getAstrologyReading(
        'Test User',
        '1990-01-01',
        '12:00',
        'Bangkok',
        'en'
      )

      expect(global.fetch).toHaveBeenCalledWith('/api/astrology-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          birthDate: '1990-01-01',
          birthTime: '12:00',
          birthPlace: 'Bangkok',
          lang: 'en'
        })
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })

    it('should handle API error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      })

      const result = await soulApi.getAstrologyReading(
        'Test User',
        '1990-01-01',
        '12:00',
        'Bangkok',
        'en'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('getTarotReading', () => {
    it('should call API with correct parameters', async () => {
      const mockResponse = {
        reading: 'Test tarot reading'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const cards = [
        { name: 'The Fool', isReversed: false },
        { name: 'The Magician', isReversed: true }
      ]

      const result = await soulApi.getTarotReading('Test question', cards, 'en')

      expect(global.fetch).toHaveBeenCalledWith('/api/tarot-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'Test question',
          cards: cards,
          lang: 'en'
        })
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })

    it('should handle API error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      })

      const cards = [
        { name: 'The Fool', isReversed: false }
      ]

      const result = await soulApi.getTarotReading('Test question', cards, 'en')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
