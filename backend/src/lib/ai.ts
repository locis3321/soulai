// Re-export from ai-provider for backward compatibility
export {
  generateAIResponse,
  generateDailyInsight,
  generateDivinationReading,
  aiProvider,
  PROMPT_VERSION,
  ADVISOR_PROMPTS,
  DIVINATION_SYSTEM_PROMPT,
  INSIGHT_SYSTEM_PROMPT,
} from './ai-provider.js'

export type { ChatMessage, CompletionResponse, AIProvider } from './ai-provider.js'

// Safety wrappers (kept here to avoid circular deps with safety.ts)
import { validateAiOutput, checkUserInputForCrisis } from './safety.js'
import { generateDivinationReading } from './ai-provider.js'

export async function generateSafeDivinationReading(request: {
  divinationType: 'tarot' | 'astrology' | 'bazi' | 'ziwei' | 'iching' | 'liuyao' | 'numerology'
  divinationData: any
  userContext: string
  language?: string
}): Promise<{ reading: string; safe: boolean; crisis?: boolean }> {
  const lang = request.language || 'zh'

  const crisis = checkUserInputForCrisis(request.userContext, lang)
  if (crisis) {
    return { reading: crisis, safe: false, crisis: true }
  }

  const reading = await generateDivinationReading(request)

  const validation = validateAiOutput(reading, lang)
  if (!validation.safe) {
    console.warn('Divination safety intervention:', validation.issues, 'type:', request.divinationType)
    return {
      reading: validation.replacement || reading,
      safe: false,
    }
  }

  return { reading, safe: true }
}
