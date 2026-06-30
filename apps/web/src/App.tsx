import React, { useEffect, useState, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useStore } from './lib/store'
import { api } from './lib/api'
import { analytics } from './lib/analytics-client'
import { UserProfile } from './types'

import HomeView from './components/HomeView'
import DiscoverView from './components/DiscoverView'
import ChatView from './components/ChatView'
import HealingView from './components/HealingView'
import ProfileView from './components/ProfileView'
import PrivacyView from './components/PrivacyView'
import OnboardingView from './components/OnboardingView'
import CommunityView from './components/CommunityView'
import MarketplaceView from './components/MarketplaceView'
import Navigation from './components/Navigation'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import PaymentSuccessPage from './components/PaymentSuccessPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1, refetchOnWindowFocus: false },
  },
})

// ─── Context for shared layout props ─────────────────────────────────────

interface LayoutContext {
  profile: UserProfile
  isPremium: boolean
  handleChangeProfile: (p: UserProfile) => void
  setLanguage: (lang: string) => void
}

const LayoutCtx = createContext<LayoutContext>({
  profile: { name: '', birthDate: '', birthTime: '', birthPlace: '' },
  isPremium: false,
  handleChangeProfile: () => {},
  setLanguage: () => {},
})

// ─── Guards ──────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { auth } = useStore()
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { auth, hasOnboarded } = useStore()
  // Allow anonymous and phone-bound users to browse without onboarding
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />
  if (!hasOnboarded && auth.user?.authType === 'email') return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

// ─── Auth page ───────────────────────────────────────────────────────────

function AuthPage() {
  const { auth } = useStore()
  const [isLogin, setIsLogin] = useState(true)
  if (auth.isAuthenticated) return <Navigate to="/" replace />
  return isLogin
    ? <LoginPage onSwitchToRegister={() => setIsLogin(false)} onSuccess={() => {}} />
    : <RegisterPage onSwitchToLogin={() => setIsLogin(true)} onSuccess={() => {}} />
}

// ─── App layout with nested routes ───────────────────────────────────────

function AppLayout() {
  const { language, auth, setUser, setLanguage, largeTextMode } = useStore()
  const { i18n } = useTranslation()
  const location = useLocation()

  useEffect(() => { i18n.changeLanguage(language) }, [language, i18n])
  useEffect(() => { analytics.track('page_view', { path: location.pathname }) }, [location.pathname])

  const profile: UserProfile = auth.user
    ? { name: auth.user.name, birthDate: auth.user.birthDate || '', birthTime: auth.user.birthTime || '', birthPlace: auth.user.birthPlace || '' }
    : { name: 'Guest', birthDate: '', birthTime: '', birthPlace: '' }

  const isPremium = auth.user?.subscriptionTier === 'premium'

  const handleChangeProfile = async (newProfile: UserProfile) => {
    if (auth.user) {
      setUser({ ...auth.user, ...newProfile })
      try { await api.updateProfile(newProfile) } catch (e) { console.error('Failed to persist profile:', e) }
    }
  }

  return (
    <LayoutCtx.Provider value={{ profile, isPremium, handleChangeProfile, setLanguage }}>
      <div className={`min-h-screen bg-temple-dark text-temple-cream ${largeTextMode ? 'text-lg' : 'text-base'}`}>
        <main className="pb-20">
          <Outlet />
        </main>
        <Navigation />
      </div>
    </LayoutCtx.Provider>
  )
}

// ─── Route components ────────────────────────────────────────────────────

function HomeRoute() {
  const { profile, isPremium } = useContext(LayoutCtx)
  return <HomeView profile={profile} onNavigate={() => {}} isPremium={isPremium} onTogglePremium={() => {}} />
}

function DiscoverRoute() {
  const { profile, isPremium } = useContext(LayoutCtx)
  return <DiscoverView profile={profile} isPremium={isPremium} onNavigate={() => {}} />
}

function ChatRoute() {
  const { profile, isPremium } = useContext(LayoutCtx)
  return <ChatView profile={profile} isPremium={isPremium} />
}

function HealingRoute() {
  return <HealingView />
}

function CommunityRoute() {
  const { profile } = useContext(LayoutCtx)
  return <CommunityView profile={profile} />
}

function MarketplaceRoute() {
  const { profile } = useContext(LayoutCtx)
  return <MarketplaceView profile={profile} />
}

function ProfileRoute() {
  const { profile, isPremium, handleChangeProfile, setLanguage } = useContext(LayoutCtx)
  return (
    <ProfileView
      profile={profile}
      onChangeProfile={handleChangeProfile}
      isPremium={isPremium}
      onTogglePremium={() => {}}
      tarotReadingsHistory={[]}
      onChangeLanguage={setLanguage}
    />
  )
}

function PrivacyRoute() {
  return <PrivacyView largeTextMode={false} />
}

// ─── Root ────────────────────────────────────────────────────────────────

export default function App() {
  const { hasOnboarded, setHasOnboarded, setLanguage, auth, login, logout, setUser, deviceId, setDeviceId } = useStore()

  useEffect(() => {
    const saved = localStorage.getItem('soulai_language')
    if (saved) setLanguage(saved)
  }, [setLanguage])

  useEffect(() => {
    analytics.init(() => useStore.getState().auth.token)
    return () => analytics.destroy()
  }, [])

  useEffect(() => {
    async function initSession() {
      // If already authenticated with a persisted token, validate it
      if (auth.isAuthenticated && auth.token) {
        try {
          const data = await api.getMe()
          if (data.user) {
            setUser(data.user)
            if (data.user.birthDate) setHasOnboarded(true)
            return // Session valid, done
          }
        } catch { /* token expired or invalid, fall through to anonymous */ }
      }

      // Create anonymous session with device ID
      const existingDeviceId = deviceId || `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      if (!deviceId) setDeviceId(existingDeviceId)

      try {
        const data = await api.deviceAuth(existingDeviceId)
        if (data.user && data.token) {
          login(data.user, data.token)
        }
      } catch (err) {
        console.error('Failed to create anonymous session:', err)
        // Allow the app to render even without auth — basic browsing doesn't require it
      }
    }
    initSession()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          <Route path="/onboarding" element={
            !auth.isAuthenticated ? <Navigate to="/login" replace />
            : hasOnboarded ? <Navigate to="/" replace />
            : <OnboardingView onComplete={async (profile) => {
                setHasOnboarded(true)
                try {
                  await api.updateProfile(profile)
                  const me = await api.getMe()
                  if (me.user) setUser(me.user)
                } catch (e) { console.error('Failed to save onboarding:', e) }
              }} />
          } />

          <Route path="/payment/success" element={
            <ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>
          } />

          {/* App shell with nested tab routes */}
          <Route element={<OnboardingGuard><AppLayout /></OnboardingGuard>}>
            <Route index element={<HomeRoute />} />
            <Route path="discover" element={<DiscoverRoute />} />
            <Route path="discover/:module" element={<DiscoverRoute />} />
            <Route path="chat" element={<ChatRoute />} />
            <Route path="healing" element={<HealingRoute />} />
            <Route path="community" element={<CommunityRoute />} />
            <Route path="marketplace" element={<MarketplaceRoute />} />
            <Route path="profile" element={<ProfileRoute />} />
            <Route path="profile/subscription" element={<ProfileRoute />} />
            <Route path="privacy" element={<PrivacyRoute />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      <Toaster position="top-center" toastOptions={{
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' },
      }} />
    </QueryClientProvider>
  )
}
