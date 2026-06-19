import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import { toast } from 'sonner'

// Auth hooks
export function useLogin() {
  const { login } = useStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.login(email, password),
    onSuccess: (data) => {
      login(data.user, data.token)
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Welcome back!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Login failed')
    },
  })
}

export function useRegister() {
  const { login } = useStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, password, name, language }: {
      email: string
      password: string
      name: string
      language?: string
    }) => api.register(email, password, name, language),
    onSuccess: (data) => {
      login(data.user, data.token)
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Account created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Registration failed')
    },
  })
}

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: () => api.getMe(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Daily Insights hooks
export function useDailyInsight() {
  return useQuery({
    queryKey: ['dailyInsight'],
    queryFn: () => api.getDailyInsight(),
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

// Tarot hooks
export function useTarotReading() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ question, cards, spreadType }: {
      question: string
      cards: Array<{ name: string; isReversed: boolean }>
      spreadType: string
    }) => api.getTarotReading(question, cards, spreadType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarotHistory'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to get reading')
    },
  })
}

export function useTarotHistory() {
  return useQuery({
    queryKey: ['tarotHistory'],
    queryFn: () => api.getTarotHistory(),
  })
}

// Astrology hooks
export function useAstrologyReading() {
  return useMutation({
    mutationFn: (birthData: {
      birthDate: string
      birthTime: string
      birthPlace: string
    }) => api.getAstrologyReading(birthData),
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to get reading')
    },
  })
}

export function useBaZiReading() {
  return useMutation({
    mutationFn: (birthData: {
      birthDate: string
      birthTime: string
      gender: string
    }) => api.getBaZiReading(birthData),
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to get reading')
    },
  })
}

export function useNumerologyReading() {
  return useMutation({
    mutationFn: ({ name, birthDate }: { name: string; birthDate: string }) =>
      api.getNumerologyReading(name, birthDate),
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to get reading')
    },
  })
}

// Chat hooks
export function useChatSessions() {
  return useQuery({
    queryKey: ['chatSessions'],
    queryFn: () => api.getChatSessions(),
  })
}

export function useChatMessages(sessionId: string) {
  return useQuery({
    queryKey: ['chatMessages', sessionId],
    queryFn: () => api.getChatMessages(sessionId),
    enabled: !!sessionId,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
      api.sendMessage(sessionId, content),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', sessionId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send message')
    },
  })
}

export function useCreateChatSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (advisorKey: string) => api.createChatSession(advisorKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatSessions'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create session')
    },
  })
}

// Mood hooks
export function useLogMood() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mood, note, energyScore }: {
      mood: string
      note?: string
      energyScore?: number
    }) => api.logMood(mood, note, energyScore),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moodHistory'] })
      toast.success('Mood recorded!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to record mood')
    },
  })
}

export function useMoodHistory(days?: number) {
  return useQuery({
    queryKey: ['moodHistory', days],
    queryFn: () => api.getMoodHistory(days),
  })
}

// Journal hooks
export function useJournals() {
  return useQuery({
    queryKey: ['journals'],
    queryFn: () => api.getJournals(),
  })
}

export function useCreateJournal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { title: string; content: string; mood?: string; tags?: string[] }) =>
      api.createJournal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] })
      toast.success('Journal saved!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save journal')
    },
  })
}

export function useUpdateJournal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: {
      id: string
      data: { title?: string; content?: string; mood?: string; tags?: string[] }
    }) => api.updateJournal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] })
      toast.success('Journal updated!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update journal')
    },
  })
}

export function useDeleteJournal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteJournal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] })
      toast.success('Journal deleted!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete journal')
    },
  })
}

// Subscription hooks
export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.getSubscription(),
  })
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: () => api.getSubscriptionPlans(),
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

export function useCreatePaymentIntent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ planId, paymentMethod }: {
      planId: string
      paymentMethod: 'alipay' | 'wechat'
    }) => api.createPaymentIntent(planId, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create payment')
    },
  })
}

export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.cancelSubscription(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success('Subscription cancelled')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel subscription')
    },
  })
}

// User stats hook
export function useUserStats() {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: () => api.getUserStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mood stats hook
export function useMoodStats(days?: number) {
  return useQuery({
    queryKey: ['moodStats', days],
    queryFn: () => api.getMoodStats(days),
  })
}

// Journal stats hook
export function useJournalStats() {
  return useQuery({
    queryKey: ['journalStats'],
    queryFn: () => api.getJournalStats(),
  })
}
