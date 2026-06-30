// AI Safety Boundaries for SoulAI
// These define what AI should and should not do

export const AI_SAFETY_RULES = {
  // What AI should do
  DO: [
    "Provide emotional support and validation",
    "Offer spiritual guidance and reflection",
    "Help with self-discovery and personal growth",
    "Suggest mindfulness and meditation practices",
    "Provide comfort during difficult times",
    "Encourage self-compassion and self-care",
    "Offer perspective on life situations",
    "Support emotional processing and healing"
  ],

  // What AI should NOT do
  DO_NOT: [
    "Diagnose mental health conditions",
    "Prescribe medication or medical treatments",
    "Provide legal, financial, or investment advice",
    "Guarantee future outcomes or predictions",
    "Encourage harmful or dangerous behavior",
    "Replace professional medical or psychological care",
    "Make decisions for users",
    "Provide crisis intervention (refer to professionals)"
  ],

  // Crisis keywords to watch for
  CRISIS_KEYWORDS: [
    "suicide", "kill myself", "end my life", "want to die",
    "self-harm", "cutting", "hurting myself",
    "abuse", "domestic violence", "assault",
    "overdose", "poison", "emergency",
    "severe depression", "panic attack", "crisis"
  ],

  // Safe responses for crisis situations
  CRISIS_RESPONSES: {
    en: "I hear that you're going through a very difficult time. Your feelings are valid, and you deserve support. Please reach out to a mental health professional or crisis hotline immediately. In Thailand, you can call 1323 (24-hour hotline). You are not alone, and help is available.",
    zh: "我听到你正在经历非常困难的时刻。你的感受是真实的，你值得被支持。请立即联系心理健康专业人士或危机热线。在泰国，你可以拨打1323（24小时热线）。你并不孤单，帮助是可用的。",
    vi: "Tôi nghe rằng bạn đang trải qua thời gian rất khó khăn. Cảm xúc của bạn là hợp lệ và bạn xứng đáng được hỗ trợ. Vui lòng liên hệ ngay với chuyên gia sức khỏe tâm thần hoặc đường dây khủng hoảng. Tại Thái Lan, bạn có thể gọi 1323 (đường dây 24 giờ). Bạn không đơn độc và sự giúp đỡ luôn có sẵn.",
    th: "ฉันได้ยินว่าคุณกำลังผ่านช่วงเวลาที่ยากลำบากมาก ความรู้สึกของคุณเป็นสิ่งที่ถูกต้องและคุณสมควรได้รับการสนับสนุน กรุณาติดต่อผู้เชี่ยวชาญด้านสุขภาพจิตหรือสายด่วนวิกฤตทันที ในประเทศไทยคุณสามารถโทร 1323 (สายด่วน 24 ชั่วโมง) คุณไม่ได้โดดเดี่ยวและความช่วยเหลือพร้อมให้บริการ"
  }
};

export function detectCrisisContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return AI_SAFETY_RULES.CRISIS_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  );
}

export function getCrisisResponse(lang: string): string {
  const responseLang = lang as keyof typeof AI_SAFETY_RULES.CRISIS_RESPONSES;
  return AI_SAFETY_RULES.CRISIS_RESPONSES[responseLang] || AI_SAFETY_RULES.CRISIS_RESPONSES.en;
}

export function validateAiResponse(response: string, lang: string): {
  isValid: boolean;
  issues: string[];
  correctedResponse?: string;
} {
  const issues: string[] = [];
  
  // Check for medical advice
  const medicalTerms = ["diagnose", "prescribe", "medication", "treatment", "cure", "disease"];
  const hasMedicalAdvice = medicalTerms.some(term => 
    response.toLowerCase().includes(term)
  );
  
  if (hasMedicalAdvice) {
    issues.push("Contains medical advice");
  }
  
  // Check for guaranteed predictions
  const guaranteeTerms = ["will definitely", "guaranteed", "certain to happen", "100% sure"];
  const hasGuarantees = guaranteeTerms.some(term => 
    response.toLowerCase().includes(term)
  );
  
  if (hasGuarantees) {
    issues.push("Contains guaranteed predictions");
  }
  
  // Check for crisis content in user input
  if (detectCrisisContent(response)) {
    return {
      isValid: false,
      issues: ["Crisis content detected"],
      correctedResponse: getCrisisResponse(lang)
    };
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}
