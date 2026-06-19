import { LanguageKey } from "./translations";

export interface DailyInsightResponse {
  energy: {
    love: number;
    career: number;
    finance: number;
    mood: number;
  };
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

class SoulApi {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getDailyInsight(
    name: string,
    mood: string,
    lang: LanguageKey
  ): Promise<ApiResponse<DailyInsightResponse>> {
    return this.request<DailyInsightResponse>("/api/daily-insight", {
      method: "POST",
      body: JSON.stringify({ name, mood, lang }),
    });
  }

  async getAstrologyReading(
    name: string,
    birthDate: string,
    birthTime: string,
    birthPlace: string,
    lang: LanguageKey
  ): Promise<ApiResponse<AstrologyReadingResponse>> {
    return this.request<AstrologyReadingResponse>("/api/astrology-reading", {
      method: "POST",
      body: JSON.stringify({ name, birthDate, birthTime, birthPlace, lang }),
    });
  }

  async getTarotReading(
    question: string,
    cards: Array<{ name: string; isReversed: boolean }>,
    lang: LanguageKey
  ): Promise<ApiResponse<TarotReadingResponse>> {
    return this.request<TarotReadingResponse>("/api/tarot-reading", {
      method: "POST",
      body: JSON.stringify({ question, cards, lang }),
    });
  }
}

// Export singleton instance
export const soulApi = new SoulApi();

// Export class for custom instances
export { SoulApi };
