import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from '../api'

vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }
  return { default: mockAxios }
})

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should export api object with expected methods', () => {
    expect(api.login).toBeDefined()
    expect(api.register).toBeDefined()
    expect(api.getMe).toBeDefined()
    expect(api.getDailyInsight).toBeDefined()
    expect(api.getTarotReading).toBeDefined()
    expect(api.getAstrologyReading).toBeDefined()
    expect(api.getBaZiReading).toBeDefined()
    expect(api.getNumerologyReading).toBeDefined()
    expect(api.getZiWeiReading).toBeDefined()
    expect(api.getChatSessions).toBeDefined()
    expect(api.sendMessage).toBeDefined()
    expect(api.logMood).toBeDefined()
    expect(api.createJournal).toBeDefined()
    expect(api.getSubscription).toBeDefined()
  })
})
