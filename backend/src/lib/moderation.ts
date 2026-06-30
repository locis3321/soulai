import { logContentModerationEvent } from './safety.js'

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

  for (const [langKey, patterns] of Object.entries(BLOCKED_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(filtered)) {
        flags.push(`${langKey}_profanity`)
        filtered = filtered.replace(pattern, REPLACEMENT)
      }
      pattern.lastIndex = 0
    }
  }

  if (lang === 'en' || lang === 'vi') {
    const words = filtered.split(/\s+/)
    const capsWords = words.filter(w => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w))
    if (capsWords.length > words.length * 0.5 && words.length > 5) {
      flags.push('excessive_caps')
    }
  }

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

export function moderateAndLog(text: string, source: string, userId?: string, lang: string = 'en'): ModerationResult {
  const result = moderateContent(text, lang)
  for (const flag of result.flags) {
    logContentModerationEvent({
      userId,
      source,
      contentSnippet: text.slice(0, 500),
      flagType: flag,
      severity: flag.includes('profanity') ? 'warning' : 'info',
      actionTaken: result.filtered !== text ? 'filtered' : 'flagged',
    })
  }
  return result
}
