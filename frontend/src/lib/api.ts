import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { useStore } from './store'

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token from Zustand store
    try {
      const storage = localStorage.getItem('soul-storage')
      if (storage) {
        const parsed = JSON.parse(storage)
        const token = parsed?.state?.auth?.token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
    } catch (e) {
      console.error('Failed to get token from storage:', e)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('soul_token')
      localStorage.removeItem('soul_user')
      useStore.getState().logout()

      const requestUrl = error.config?.url || ''
      if (!requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/register')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// API methods
export const api = {
  // Auth
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password })
    return response.data
  },

  async register(email: string, password: string, name: string, language?: string) {
    const response = await apiClient.post('/auth/register', { email, password, name, language })
    return response.data
  },

  async getMe() {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  async refreshToken() {
    const response = await apiClient.post('/auth/refresh')
    return response.data
  },

  // Users
  async getProfile() {
    const response = await apiClient.get('/users/profile')
    return response.data
  },

  async updateProfile(data: {
    name?: string
    birthDate?: string
    birthTime?: string
    birthPlace?: string
    language?: string
  }) {
    const response = await apiClient.put('/users/profile', data)
    return response.data
  },

  async getUserStats() {
    const response = await apiClient.get('/users/stats')
    return response.data
  },

  // Daily Insights
  async getDailyInsight(mood?: string, lang?: string) {
    const response = await apiClient.post('/insights/daily', { mood, lang })
    return response.data
  },

  // Tarot
  async getTarotReading(question: string, cards: Array<{ name: string; isReversed: boolean }>, spreadType: string) {
    const response = await apiClient.post('/tarot/reading', { question, cards, spreadType })
    return response.data
  },

  async getTarotHistory() {
    const response = await apiClient.get('/tarot/history')
    return response.data
  },

  // Astrology
  async getAstrologyReading(birthData: {
    birthDate: string
    birthTime: string
    birthPlace: string
  }) {
    const response = await apiClient.post('/astrology/natal-chart', birthData)
    return response.data
  },

  async getBaZiReading(birthData: {
    birthDate: string
    birthTime: string
    gender: string
  }) {
    const response = await apiClient.post('/bazi/calculate', birthData)
    return response.data
  },

  async getNumerologyReading(name: string, birthDate: string) {
    const response = await apiClient.post('/numerology/calculate', { name, birthDate })
    return response.data
  },

  async getZiWeiReading(birthData: {
    name: string
    birthDate: string
    birthTime: string
    gender: string
  }) {
    const response = await apiClient.post('/ziwei/calculate', birthData)
    return response.data
  },

  // Chat
  async getChatSessions() {
    const response = await apiClient.get('/chat/sessions')
    return response.data
  },

  async getChatMessages(sessionId: string) {
    const response = await apiClient.get(`/chat/sessions/${sessionId}/messages`)
    return response.data
  },

  async sendMessage(sessionId: string, content: string) {
    const response = await apiClient.post(`/chat/sessions/${sessionId}/messages`, { content })
    return response.data
  },

  async createChatSession(advisorKey: string) {
    const response = await apiClient.post('/chat/sessions', { advisorKey })
    return response.data
  },

  async deleteChatSession(sessionId: string) {
    const response = await apiClient.delete(`/chat/sessions/${sessionId}`)
    return response.data
  },

  // Mood
  async logMood(mood: string, note?: string, energyScore?: number) {
    const response = await apiClient.post('/healing/mood/checkin', { mood, note, energyScore })
    return response.data
  },

  async getMoodHistory(days?: number) {
    const response = await apiClient.get('/healing/mood/history', { params: { days } })
    return response.data
  },

  async getMoodStats(days?: number) {
    const response = await apiClient.get('/healing/mood/stats', { params: { days } })
    return response.data
  },

  // Journals
  async createJournal(data: { title: string; content: string; mood?: string; tags?: string[] }) {
    const response = await apiClient.post('/healing/journals', data)
    return response.data
  },

  async getJournals() {
    const response = await apiClient.get('/healing/journals')
    return response.data
  },

  async getJournal(journalId: string) {
    const response = await apiClient.get(`/healing/journals/${journalId}`)
    return response.data
  },

  async updateJournal(id: string, data: { title?: string; content?: string; mood?: string; tags?: string[] }) {
    const response = await apiClient.put(`/healing/journals/${id}`, data)
    return response.data
  },

  async deleteJournal(id: string) {
    const response = await apiClient.delete(`/healing/journals/${id}`)
    return response.data
  },

  async getJournalStats() {
    const response = await apiClient.get('/healing/journals/stats')
    return response.data
  },

  // Payments
  async getSubscriptionPlans() {
    const response = await apiClient.get('/payments/plans')
    return response.data
  },

  async createPaymentIntent(planId: string, paymentMethod: 'alipay' | 'wechat', period: 'monthly' | 'yearly' = 'monthly') {
    const response = await apiClient.post('/payments/create-intent', { planId, paymentMethod, period })
    return response.data
  },

  async getPaymentStatus(paymentId: string) {
    const response = await apiClient.get(`/payments/status/${paymentId}`)
    return response.data
  },

  async getSubscription() {
    const response = await apiClient.get('/payments/subscription')
    return response.data
  },

  async cancelSubscription() {
    const response = await apiClient.post('/payments/subscription/cancel')
    return response.data
  },

  // Community
  async getCommunityPosts(category?: string, limit = 20, offset = 0) {
    const response = await apiClient.get('/community/posts', { params: { category, limit, offset } })
    return response.data
  },

  async getCommunityPost(postId: string) {
    const response = await apiClient.get(`/community/posts/${postId}`)
    return response.data
  },

  async createCommunityPost(data: { category: string; title: string; content: string }) {
    const response = await apiClient.post('/community/posts', data)
    return response.data
  },

  async addComment(postId: string, content: string) {
    const response = await apiClient.post(`/community/posts/${postId}/comments`, { content })
    return response.data
  },

  async toggleLike(postId: string) {
    const response = await apiClient.post(`/community/posts/${postId}/like`)
    return response.data
  },

  async toggleBookmark(postId: string) {
    const response = await apiClient.post(`/community/posts/${postId}/bookmark`)
    return response.data
  },

  // Marketplace
  async getPractitioners(category?: string, search?: string) {
    const response = await apiClient.get('/marketplace/practitioners', { params: { category, search } })
    return response.data
  },

  async getPractitioner(id: string) {
    const response = await apiClient.get(`/marketplace/practitioners/${id}`)
    return response.data
  },

  async createBooking(data: { practitionerId: string; bookingDate: string; bookingTime: string; consultationMode: string }) {
    const response = await apiClient.post('/marketplace/bookings', data)
    return response.data
  },

  async getUserBookings() {
    const response = await apiClient.get('/marketplace/bookings')
    return response.data
  },

  async submitReview(practitionerId: string, rating: number, comment?: string) {
    const response = await apiClient.post(`/marketplace/practitioners/${practitionerId}/reviews`, { rating, comment })
    return response.data
  },
}

export default api
