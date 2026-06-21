// Content moderation for user-generated content (journals, chat messages)
// Filters profanity, hate speech, and harmful content

const BLOCKED_PATTERNS: Record<string, RegExp[]> = {
  en: [
    /\b(fuck|shit|damn|ass|bitch|bastard|crap)\b/gi,
    /\b(kill\s+(your)?self|kys)\b/gi,
    /\b(nigger|faggot|retard)\b/gi,
  ],
  zh: [
    /[他妈你妈操你|狗日|傻逼|混蛋|王八蛋]/g,
    /[去死|自杀|杀你]/g,
  ],
  vi: [
    /\b(địt|lồn|cặc|đụ|buồi)\b/gi,
  ],
  th: [
    /[เหี้ย|สัส|ควย|มึง|กู]/g,
  ],
}

const REPLACEMENT = '***'

export interface ModerationResult {
  clean: boolean
  filtered: string
  flags: string[]
}

export function moderateContent(text: string, lang: string = 'en'): ModerationResult {
  let filtered = text
  const flags: string[] = []

  // Check all language patterns
  for (const [langKey, patterns] of Object.entries(BLOCKED_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(filtered)) {
        flags.push(`${langKey}_profanity`)
        filtered = filtered.replace(pattern, REPLACEMENT)
      }
      // Reset lastIndex for global regexes
      pattern.lastIndex = 0
    }
  }

  // Check for excessive caps (shouting) - only for Latin scripts
  if (lang === 'en' || lang === 'vi') {
    const words = filtered.split(/\s+/)
    const capsWords = words.filter(w => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w))
    if (capsWords.length > words.length * 0.5 && words.length > 5) {
      flags.push('excessive_caps')
    }
  }

  // Check for spam-like repetition
  const repeatedChars = /(.)\1{9,}/g
  if (repeatedChars.test(filtered)) {
    flags.push('spam_repetition')
    filtered = filtered.replace(repeatedChars, '$1$1$1')
  }

  return {
    clean: flags.length === 0,
    filtered,
    flags,
  }
}

export function isContentSafe(text: string): boolean {
  const result = moderateContent(text)
  return result.clean
}
