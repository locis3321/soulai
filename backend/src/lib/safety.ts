// AI Safety Boundaries for SoulAI Backend
// Validates AI outputs and detects crisis content in user inputs
// Supports: en, zh, vi, th

const CRISIS_KEYWORDS: Record<string, string[]> = {
  en: [
    'suicide', 'kill myself', 'end my life', 'want to die',
    'self-harm', 'cutting', 'hurting myself',
    'abuse', 'domestic violence', 'assault',
    'overdose', 'poison', 'emergency',
    'severe depression', 'panic attack', 'crisis'
  ],
  zh: [
    '自杀', '想死', '结束生命', '不想活了',
    '自残', '割腕', '伤害自己',
    '家暴', '虐待', '侵犯',
    '过量服药', '中毒', '急救',
    '严重抑郁', '恐慌发作', '危机'
  ],
  vi: [
    'tự tử', 'tự sát', 'muốn chết', 'kết thúc cuộc sống',
    'tự hại', 'cắt tay', 'làm đau bản thân',
    'bạo lực gia đình', 'lạm dụng', 'xâm hại',
    'quá liều', 'độc tố', 'cấp cứu',
    'trầm cảm nặng', 'hoảng loạn', 'khủng hoảng'
  ],
  th: [
    'ฆ่าตัวตาย', 'อยากตาย', 'จบชีวิต', 'ไม่อยากอยู่',
    'ทำร้ายตัวเอง', 'กรีดข้อมือ', 'เจ็บตัว',
    'ความรุนแรงในครอบครัว', 'ล่วงละเมิด', 'ทารุณกรรม',
    'ยาเกินขนาด', 'พิษ', 'ฉุกเฉิน',
    'ซึมเศร้ารุนแรง', 'ตื่นตระหนก', 'วิกฤต'
  ],
}

const CRISIS_RESPONSES: Record<string, string> = {
  en: "I hear that you're going through a very difficult time. Your feelings are valid, and you deserve support. Please reach out to a mental health professional or crisis hotline immediately. In Thailand, you can call 1323 (24-hour hotline). You are not alone, and help is available.",
  zh: "我听到你正在经历非常困难的时刻。你的感受是真实的，你值得被支持。请立即联系心理健康专业人士或危机热线。在泰国，你可以拨打1323（24小时热线）。你并不孤单，帮助是可用的。",
  vi: "Tôi nghe rằng bạn đang trải qua thời gian rất khó khăn. Cảm xúc của bạn là hợp lệ và bạn xứng đáng được hỗ trợ. Vui lòng liên hệ ngay với chuyên gia sức khỏe tâm thần hoặc đường dây khủng hoảng. Tại Thái Lan, bạn có thể gọi 1323 (đường dây 24 giờ).",
  th: "ฉันได้ยินว่าคุณกำลังผ่านช่วงเวลาที่ยากลำบากมาก ความรู้สึกของคุณเป็นสิ่งที่ถูกต้องและคุณสมควรได้รับการสนับสนุน กรุณาติดต่อผู้เชี่ยวชาญด้านสุขภาพจิตหรือสายด่วนวิกฤตทันที ในประเทศไทยคุณสามารถโทร 1323 (สายด่วน 24 ชั่วโมง) คุณไม่ได้โดดเดี่ยว",
}

const GUARANTEE_TERMS: Record<string, string[]> = {
  en: ['will definitely', 'guaranteed', 'certain to happen', '100% sure', 'must happen'],
  zh: ['一定会', '保证', '必然发生', '百分之百确定'],
  vi: ['chắc chắn', 'đảm bảo', 'nhất định xảy ra', '100% chắc chắn'],
  th: ['แน่นอน', 'รับประกัน', 'ต้องเกิดขึ้น', 'มั่นใจ 100%'],
}

const MEDICAL_TERMS: Record<string, string[]> = {
  en: ['diagnose', 'prescribe', 'medication', 'treatment plan', 'cure your disease'],
  zh: ['诊断', '开药', '药物', '治疗方案', '治愈疾病'],
  vi: ['chẩn đoán', 'kê đơn', 'thuốc', 'kế hoạch điều trị', 'chữa bệnh'],
  th: ['วินิจฉัย', 'สั่งยา', 'ยา', 'แผนการรักษา', 'รักษาโรค'],
}

export function detectCrisisContent(text: string): boolean {
  const lower = text.toLowerCase()
  for (const keywords of Object.values(CRISIS_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return true
  }
  return false
}

export function getCrisisResponse(lang: string): string {
  return CRISIS_RESPONSES[lang] || CRISIS_RESPONSES.en
}

export function validateAiOutput(text: string, lang?: string): { safe: boolean; issues: string[]; replacement?: string } {
  const issues: string[] = []
  const lower = text.toLowerCase()
  const l = lang || 'en'

  if (detectCrisisContent(text)) {
    return { safe: false, issues: ['Crisis content in AI output'], replacement: getCrisisResponse(l) }
  }

  const guarantees = GUARANTEE_TERMS[l] || GUARANTEE_TERMS.en
  if (guarantees.some(t => lower.includes(t))) {
    issues.push('Contains guaranteed predictions')
  }

  const medical = MEDICAL_TERMS[l] || MEDICAL_TERMS.en
  if (medical.some(t => lower.includes(t))) {
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
