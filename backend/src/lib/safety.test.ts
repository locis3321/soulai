import { describe, it, expect } from 'vitest'
import { detectCrisisContent, getCrisisResponse, validateAiOutput, checkUserInputForCrisis } from '../lib/safety.js'

describe('AI Safety', () => {
  describe('detectCrisisContent', () => {
    it('should detect English crisis keywords', () => {
      expect(detectCrisisContent('I want to kill myself')).toBe(true)
      expect(detectCrisisContent('thinking about suicide')).toBe(true)
      expect(detectCrisisContent('self-harm urges')).toBe(true)
    })

    it('should detect Chinese crisis keywords', () => {
      expect(detectCrisisContent('我想自杀')).toBe(true)
      expect(detectCrisisContent('想死')).toBe(true)
      expect(detectCrisisContent('自残')).toBe(true)
    })

    it('should detect Vietnamese crisis keywords', () => {
      expect(detectCrisisContent('tôi muốn tự tử')).toBe(true)
      expect(detectCrisisContent('muốn chết')).toBe(true)
    })

    it('should detect Thai crisis keywords', () => {
      expect(detectCrisisContent('อยากตาย')).toBe(true)
      expect(detectCrisisContent('ฆ่าตัวตาย')).toBe(true)
    })

    it('should not flag normal spiritual content', () => {
      expect(detectCrisisContent('Today brings new opportunities for growth')).toBe(false)
      expect(detectCrisisContent('Your tarot reading shows transformation')).toBe(false)
      expect(detectCrisisContent('今天的运势很好')).toBe(false)
    })
  })

  describe('getCrisisResponse', () => {
    it('should return language-specific response', () => {
      expect(getCrisisResponse('en')).toContain('mental health')
      expect(getCrisisResponse('zh')).toContain('心理健康')
      expect(getCrisisResponse('vi')).toContain('sức khỏe tâm thần')
      expect(getCrisisResponse('th')).toContain('สุขภาพจิต')
    })

    it('should fall back to English for unknown language', () => {
      expect(getCrisisResponse('fr')).toContain('mental health')
    })
  })

  describe('validateAiOutput', () => {
    it('should pass clean content', () => {
      const result = validateAiOutput('Today is a good day for reflection', 'en')
      expect(result.safe).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should flag guaranteed predictions', () => {
      const result = validateAiOutput('This will definitely happen to you', 'en')
      expect(result.safe).toBe(false)
      expect(result.issues).toContain('Contains guaranteed predictions')
    })

    it('should flag Chinese guarantees', () => {
      const result = validateAiOutput('这一定会发生', 'zh')
      expect(result.safe).toBe(false)
    })

    it('should flag medical advice', () => {
      const result = validateAiOutput('I diagnose you with anxiety', 'en')
      expect(result.safe).toBe(false)
      expect(result.issues).toContain('Contains medical advice')
    })

    it('should replace crisis content in output', () => {
      const result = validateAiOutput('I want to kill myself', 'en')
      expect(result.safe).toBe(false)
      expect(result.replacement).toContain('mental health')
    })
  })

  describe('checkUserInputForCrisis', () => {
    it('should return null for safe input', () => {
      expect(checkUserInputForCrisis('What does my chart say?')).toBeNull()
    })

    it('should return crisis response for dangerous input', () => {
      const response = checkUserInputForCrisis('I want to end my life')
      expect(response).toContain('mental health')
    })

    it('should use correct language', () => {
      const response = checkUserInputForCrisis('我想自杀', 'zh')
      expect(response).toContain('心理健康')
    })
  })
})
