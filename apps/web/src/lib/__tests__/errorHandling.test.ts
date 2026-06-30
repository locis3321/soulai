import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  handleError,
  createError,
  isNetworkError,
  isTimeoutError,
  isApiError,
  SoulError
} from '../errorHandling'

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('SoulError', () => {
    it('should create error with code and message', () => {
      const error = new SoulError('TEST_ERROR', 'Test error message')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.message).toBe('Test error message')
      expect(error.name).toBe('SoulError')
    })

    it('should create error with details', () => {
      const details = { key: 'value' }
      const error = new SoulError('TEST_ERROR', 'Test error message', details)
      expect(error.details).toEqual(details)
    })

    it('should be instance of Error', () => {
      const error = new SoulError('TEST_ERROR', 'Test error message')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(SoulError)
    })
  })

  describe('createError', () => {
    it('should create SoulError', () => {
      const error = createError('TEST_ERROR', 'Test error message')
      expect(error).toBeInstanceOf(SoulError)
      expect(error.code).toBe('TEST_ERROR')
      expect(error.message).toBe('Test error message')
    })

    it('should create error with details', () => {
      const details = { key: 'value' }
      const error = createError('TEST_ERROR', 'Test error message', details)
      expect(error.details).toEqual(details)
    })
  })

  describe('handleError', () => {
    it('should handle regular Error', () => {
      const error = new Error('Test error')
      const result = handleError(error)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle SoulError', () => {
      const error = new SoulError('TEST_ERROR', 'Test error message')
      const result = handleError(error)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle network error', () => {
      const error = new Error('Failed to fetch')
      const result = handleError(error)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('internet connection')
    })

    it('should handle timeout error', () => {
      const error = new Error('Request timed out')
      const result = handleError(error)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('timed out')
    })

    it('should handle API error', () => {
      const error = new Error('Server error 500')
      const result = handleError(error)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('isNetworkError', () => {
    it('should detect fetch errors', () => {
      expect(isNetworkError(new Error('Failed to fetch'))).toBe(true)
      expect(isNetworkError(new Error('fetch failed'))).toBe(true)
    })

    it('should detect network errors', () => {
      expect(isNetworkError(new Error('network error'))).toBe(true)
      expect(isNetworkError(new Error('Network request failed'))).toBe(true)
    })

    it('should not detect non-network errors', () => {
      expect(isNetworkError(new Error('Validation error'))).toBe(false)
      expect(isNetworkError(new Error('Not found'))).toBe(false)
    })
  })

  describe('isTimeoutError', () => {
    it('should detect timeout errors', () => {
      expect(isTimeoutError(new Error('Request timed out'))).toBe(true)
      expect(isTimeoutError(new Error('timeout'))).toBe(true)
    })

    it('should not detect non-timeout errors', () => {
      expect(isTimeoutError(new Error('Not found'))).toBe(false)
      expect(isTimeoutError(new Error('Validation error'))).toBe(false)
    })
  })

  describe('isApiError', () => {
    it('should detect API errors', () => {
      expect(isApiError(new Error('API error'))).toBe(true)
      expect(isApiError(new Error('Server error'))).toBe(true)
    })

    it('should detect server errors', () => {
      expect(isApiError(new Error('500 Internal Server Error'))).toBe(true)
      expect(isApiError(new Error('503 Service Unavailable'))).toBe(true)
    })

    it('should not detect non-API errors', () => {
      expect(isApiError(new Error('Validation error'))).toBe(false)
      expect(isApiError(new Error('Not found'))).toBe(false)
    })
  })
})
