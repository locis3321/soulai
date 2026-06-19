import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  detectCrisisContent,
  getCrisisResponse,
  validateAiResponse,
  AI_SAFETY_RULES
} from '../safety'

describe('Safety', () => {
  describe('detectCrisisContent', () => {
    it('should detect suicide keywords', () => {
      expect(detectCrisisContent('I want to suicide')).toBe(true)
      expect(detectCrisisContent('kill myself')).toBe(true)
      expect(detectCrisisContent('end my life')).toBe(true)
      expect(detectCrisisContent('want to die')).toBe(true)
    })

    it('should detect self-harm keywords', () => {
      expect(detectCrisisContent('self-harm')).toBe(true)
      expect(detectCrisisContent('cutting')).toBe(true)
      expect(detectCrisisContent('hurting myself')).toBe(true)
    })

    it('should detect abuse keywords', () => {
      expect(detectCrisisContent('abuse')).toBe(true)
      expect(detectCrisisContent('domestic violence')).toBe(true)
      expect(detectCrisisContent('assault')).toBe(true)
    })

    it('should detect emergency keywords', () => {
      expect(detectCrisisContent('overdose')).toBe(true)
      expect(detectCrisisContent('poison')).toBe(true)
      expect(detectCrisisContent('emergency')).toBe(true)
    })

    it('should detect mental health crisis keywords', () => {
      expect(detectCrisisContent('severe depression')).toBe(true)
      expect(detectCrisisContent('panic attack')).toBe(true)
      expect(detectCrisisContent('crisis')).toBe(true)
    })

    it('should not detect normal content', () => {
      expect(detectCrisisContent('I feel happy today')).toBe(false)
      expect(detectCrisisContent('I love my family')).toBe(false)
      expect(detectCrisisContent('I want to travel')).toBe(false)
    })

    it('should be case insensitive', () => {
      expect(detectCrisisContent('SUICIDE')).toBe(true)
      expect(detectCrisisContent('Kill Myself')).toBe(true)
      expect(detectCrisisContent('SELF-HARM')).toBe(true)
    })
  })

  describe('getCrisisResponse', () => {
    it('should return English response for en', () => {
      const response = getCrisisResponse('en')
      expect(response).toContain('1323')
      expect(response).toContain('mental health professional')
    })

    it('should return Chinese response for zh', () => {
      const response = getCrisisResponse('zh')
      expect(response).toContain('1323')
      expect(response).toContain('心理健康专业人士')
    })

    it('should return Vietnamese response for vi', () => {
      const response = getCrisisResponse('vi')
      expect(response).toContain('1323')
      expect(response).toContain('chuyên gia sức khỏe tâm thần')
    })

    it('should return Thai response for th', () => {
      const response = getCrisisResponse('th')
      expect(response).toContain('1323')
      expect(response).toContain('ผู้เชี่ยวชาญด้านสุขภาพจิต')
    })

    it('should return English response for unknown language', () => {
      const response = getCrisisResponse('fr')
      expect(response).toContain('1323')
      expect(response).toContain('mental health professional')
    })
  })

  describe('validateAiResponse', () => {
    it('should validate normal response', () => {
      const result = validateAiResponse('You are doing great!', 'en')
      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should detect medical advice', () => {
      const result = validateAiResponse('I diagnose you with depression', 'en')
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Contains medical advice')
    })

    it('should detect guaranteed predictions', () => {
      const result = validateAiResponse('You will definitely succeed', 'en')
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Contains guaranteed predictions')
    })

    it('should detect crisis content', () => {
      const result = validateAiResponse('I want to suicide', 'en')
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Crisis content detected')
      expect(result.correctedResponse).toBeDefined()
    })

    it('should return corrected response for crisis content', () => {
      const result = validateAiResponse('I want to suicide', 'en')
      expect(result.correctedResponse).toContain('1323')
    })
  })

  describe('AI_SAFETY_RULES', () => {
    it('should have DO rules', () => {
      expect(AI_SAFETY_RULES.DO).toBeDefined()
      expect(AI_SAFETY_RULES.DO.length).toBeGreaterThan(0)
    })

    it('should have DO_NOT rules', () => {
      expect(AI_SAFETY_RULES.DO_NOT).toBeDefined()
      expect(AI_SAFETY_RULES.DO_NOT.length).toBeGreaterThan(0)
    })

    it('should have CRISIS_KEYWORDS', () => {
      expect(AI_SAFETY_RULES.CRISIS_KEYWORDS).toBeDefined()
      expect(AI_SAFETY_RULES.CRISIS_KEYWORDS.length).toBeGreaterThan(0)
    })

    it('should have CRISIS_RESPONSES', () => {
      expect(AI_SAFETY_RULES.CRISIS_RESPONSES).toBeDefined()
      expect(AI_SAFETY_RULES.CRISIS_RESPONSES).toHaveProperty('en')
      expect(AI_SAFETY_RULES.CRISIS_RESPONSES).toHaveProperty('zh')
      expect(AI_SAFETY_RULES.CRISIS_RESPONSES).toHaveProperty('vi')
      expect(AI_SAFETY_RULES.CRISIS_RESPONSES).toHaveProperty('th')
    })

    it('should not have medical advice in DO rules', () => {
      const medicalTerms = ['diagnose', 'prescribe', 'medication', 'treatment']
      AI_SAFETY_RULES.DO.forEach(rule => {
        medicalTerms.forEach(term => {
          expect(rule.toLowerCase()).not.toContain(term)
        })
      })
    })

    it('should have crisis intervention in DO_NOT rules', () => {
      const crisisTerms = ['crisis', 'emergency', 'professional']
      const hasCrisisRule = AI_SAFETY_RULES.DO_NOT.some(rule =>
        crisisTerms.some(term => rule.toLowerCase().includes(term))
      )
      expect(hasCrisisRule).toBe(true)
    })
  })
})
