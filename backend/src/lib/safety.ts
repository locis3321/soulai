// AI Safety Boundaries for SoulAI Backend
// Validates AI outputs and detects crisis content in user inputs

const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die',
  'self-harm', 'cutting', 'hurting myself',
  'abuse', 'domestic violence', 'assault',
  'overdose', 'poison', 'emergency',
  'severe depression', 'panic attack', 'crisis'
]

const CRISIS_RESPONSES: Record<string, string> = {
  en: "I hear that you're going through a very difficult time. Your feelings are valid, and you deserve support. Please reach out to a mental health professional or crisis hotline immediately. In Thailand, you can call 1323 (24-hour hotline). You are not alone, and help is available.",
  zh: "我听到你正在经历非常困难的时刻。你的感受是真实的，你值得被支持。请立即联系心理健康专业人士或危机热线。在泰国，你可以拨打1323（24小时热线）。你并不孤单，帮助是可用的。",
  vi: "Tôi nghe rằng bạn đang trải qua thời gian rất khó khăn. Cảm xúc của bạn là hợp lệ và bạn xứng đáng được hỗ trợ. Vui lòng liên hệ ngay với chuyên gia sức khỏe tâm thần hoặc đường dây khủng hoảng.",
  th: "ฉันได้ยินว่าคุณกำลังผ่านช่วงเวลาที่ยากลำบากมาก ความรู้สึกของคุณเป็นสิ่งที่ถูกต้อง กรุณาติดต่อผู้เชี่ยวชาญด้านสุขภาพจิตหรือสายด่วนวิกฤตทันที โทร 1323",
}

const GUARANTEE_TERMS = ['will definitely', 'guaranteed', 'certain to happen', '100% sure', 'must happen']

const MEDICAL_TERMS = ['diagnose', 'prescribe', 'medication', 'treatment plan', 'cure your disease']

export function detectCrisisContent(text: string): boolean {
  const lower = text.toLowerCase()
  return CRISIS_KEYWORDS.some(kw => lower.includes(kw))
}

export function getCrisisResponse(lang: string): string {
  return CRISIS_RESPONSES[lang] || CRISIS_RESPONSES.en
}

export function validateAiOutput(text: string, lang?: string): { safe: boolean; issues: string[]; replacement?: string } {
  const issues: string[] = []
  const lower = text.toLowerCase()

  // Crisis content in AI output should never happen, but guard anyway
  if (detectCrisisContent(text)) {
    return { safe: false, issues: ['Crisis content in AI output'], replacement: getCrisisResponse(lang || 'en') }
  }

  if (GUARANTEE_TERMS.some(t => lower.includes(t))) {
    issues.push('Contains guaranteed predictions')
  }

  if (MEDICAL_TERMS.some(t => lower.includes(t))) {
    issues.push('Contains medical advice')
  }

  return { safe: issues.length === 0, issues }
}

export function checkUserInputForCrisis(text: string, lang?: string): string | null {
  if (detectCrisisContent(text)) {
    return getCrisisResponse(lang || 'en')
  }
  return null
}
