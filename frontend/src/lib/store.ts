import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types
export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  birthDate?: string
  birthTime?: string
  birthPlace?: string
  language: string
  subscriptionTier: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface AppState {
  // Auth
  auth: AuthState
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void

  // UI State
  activeTab: string
  setActiveTab: (tab: string) => void
  
  language: string
  setLanguage: (lang: string) => void
  
  largeTextMode: boolean
  setLargeTextMode: (enabled: boolean) => void
  
  hasOnboarded: boolean
  setHasOnboarded: (value: boolean) => void
}

// Create store
export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth state
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      },
      setUser: (user) =>
        set((state) => ({
          auth: { ...state.auth, user, isAuthenticated: !!user },
        })),
      setToken: (token) =>
        set((state) => ({
          auth: { ...state.auth, token },
        })),
      setLoading: (isLoading) =>
        set((state) => ({
          auth: { ...state.auth, isLoading },
        })),
      setError: (error) =>
        set((state) => ({
          auth: { ...state.auth, error },
        })),
      login: (user, token) =>
        set({
          auth: {
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
        }),
      logout: () =>
        set({
          auth: {
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          },
          hasOnboarded: false,
        }),

      // UI State
      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      language: 'zh',
      setLanguage: (lang) => set({ language: lang }),
      
      largeTextMode: false,
      setLargeTextMode: (enabled) => set({ largeTextMode: enabled }),
      
      hasOnboarded: false,
      setHasOnboarded: (value) => set({ hasOnboarded: value }),
    }),
    {
      name: 'soul-storage',
      partialize: (state) => ({
        auth: {
          user: state.auth.user,
          token: state.auth.token,
          isAuthenticated: state.auth.isAuthenticated,
        },
        activeTab: state.activeTab,
        language: state.language,
        largeTextMode: state.largeTextMode,
        hasOnboarded: state.hasOnboarded,
      }),
    }
  )
)

export default useStore
