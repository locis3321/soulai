export interface UserProfile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM
  birthPlace: string;
}

export interface EnergyScores {
  love: number;
  career: number;
  finance: number;
  mood: number;
}

export interface DailyInsightData {
  energy: EnergyScores;
  dailyMessage: string;
}

export type AdvisorKey = "luna" | "athena" | "mystic" | "zen";

export interface AdvisorInfo {
  key: AdvisorKey;
  name: string;
  title: string;
  avatar: string;
  accentColor: string;
  description: string;
  starterMessage: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface TarotCard {
  id: string;
  name: string;
  isReversed: boolean;
  category: "Major Arcana" | "Cups" | "Swords" | "Wands" | "Pentacles";
  imagePrompt: string; // Description for rendering the card design or matching mood
  imageSymbol: string; // Lucide icon or letter
  uprightMeaning: string;
  reversedMeaning: string;
}

export type MoodType = "calm" | "neutral" | "sad" | "angry" | "tired";

export interface MoodCheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  mood: MoodType;
  note?: string;
  timestamp: string;
}

export interface HealingJournal {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: MoodType;
}

export interface MeditationSession {
  id: string;
  title: string;
  category: "stress" | "sleep" | "anxiety" | "focus";
  duration: number; // in seconds
  audioUrl?: string;
  description: string;
}

export interface TarotCardSpread {
  question: string;
  cards: TarotCard[];
  readingText: string;
  timestamp: string;
}

// API Response types
export interface DailyInsightResponse {
  energy: EnergyScores;
  dailyMessage: string;
}

export interface AstrologyReadingResponse {
  reading: string;
}

export interface TarotReadingResponse {
  reading: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
