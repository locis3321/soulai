import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useStore } from './lib/store'
import { api } from './lib/api'
import { UserProfile } from './types'

// Components
import HomeView from './components/HomeView'
import DiscoverView from './components/DiscoverView'
import ChatView from './components/ChatView'
import HealingView from './components/HealingView'
import ProfileView from './components/ProfileView'
import OnboardingView from './components/OnboardingView'
import CommunityView from './components/CommunityView'
import MarketplaceView from './components/MarketplaceView'
import Navigation from './components/Navigation'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { auth } = useStore()
  
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Auth pages component
function AuthPages() {
  const [isLogin, setIsLogin] = useState(true)
  const { auth } = useStore()

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return isLogin ? (
    <LoginPage
      onSwitchToRegister={() => setIsLogin(false)}
      onSuccess={() => {}}
    />
  ) : (
    <RegisterPage
      onSwitchToLogin={() => setIsLogin(true)}
      onSuccess={() => {}}
    />
  )
}

// Main app layout
function AppLayout() {
  const { t, i18n } = useTranslation()
  const { 
    activeTab, 
    setActiveTab, 
    language, 
    setLanguage,
    largeTextMode,
    auth,
    setUser
  } = useStore()

  // Sync language with i18n
  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language, i18n])

  // Default profile
  const profile: UserProfile = auth.user ? {
    name: auth.user.name,
    birthDate: auth.user.birthDate || '',
    birthTime: auth.user.birthTime || '',
    birthPlace: auth.user.birthPlace || ''
  } : {
    name: 'Guest',
    birthDate: '',
    birthTime: '',
    birthPlace: ''
  }

  const isPremium = auth.user?.subscriptionTier === 'premium'

  const handleNavigate = (tab: string, arg?: any) => {
    setActiveTab(tab)
  }

  const handleTogglePremium = () => {
    // TODO: Implement premium toggle
    console.log('Toggle premium')
  }

  const handleChangeProfile = (newProfile: UserProfile) => {
    if (auth.user) {
      setUser({
        ...auth.user,
        name: newProfile.name,
        birthDate: newProfile.birthDate,
        birthTime: newProfile.birthTime,
        birthPlace: newProfile.birthPlace
      })
    }
  }

  const handleAddJournal = (journal: any) => {
    // TODO: Implement add journal
    console.log('Add journal', journal)
  }

  const handleDeleteJournal = (id: string) => {
    // TODO: Implement delete journal
    console.log('Delete journal', id)
  }

  return (
    <div className={`min-h-screen bg-temple-dark text-temple-cream ${largeTextMode ? 'text-lg' : 'text-base'}`}>
      {/* Main content */}
      <main className="pb-20">
        {activeTab === 'home' && (
          <HomeView
            profile={profile}
            onNavigate={handleNavigate}
            isPremium={isPremium}
            onTogglePremium={handleTogglePremium}
            largeTextMode={largeTextMode}
          />
        )}
        {activeTab === 'discover' && (
          <DiscoverView
            profile={profile}
            isPremium={isPremium}
            onNavigate={handleNavigate}
            largeTextMode={largeTextMode}
          />
        )}
        {activeTab === 'chat' && (
          <ChatView
            profile={profile}
            isPremium={isPremium}
          />
        )}
        {activeTab === 'healing' && (
          <HealingView />
        )}
        {activeTab === 'community' && (
          <CommunityView
            profile={profile}
          />
        )}
        {activeTab === 'marketplace' && (
          <MarketplaceView
            profile={profile}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileView
            profile={profile}
            onChangeProfile={handleChangeProfile}
            isPremium={isPremium}
            onTogglePremium={handleTogglePremium}
            tarotReadingsHistory={[]}
            onChangeLanguage={setLanguage}
          />
        )}
      </main>

      {/* Bottom navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

// Root component
export default function App() {
  const { hasOnboarded, setHasOnboarded, language, setLanguage, auth, logout, setUser } = useStore()

  // Load saved language
  useEffect(() => {
    const savedLang = localStorage.getItem('soulai_language')
    if (savedLang) {
      setLanguage(savedLang)
    }
  }, [setLanguage])

  // Validate persisted auth token on app load
  useEffect(() => {
    if (auth.isAuthenticated && auth.token) {
      api.getMe()
        .then((data) => {
          if (data.user) {
            setUser(data.user)
            // Derive onboarding state from backend profile
            if (data.user.birthDate) {
              setHasOnboarded(true)
            }
          }
        })
        .catch(() => {
          logout()
          setHasOnboarded(false)
        })
    }
  }, []) // Only on mount

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<AuthPages />} />
          <Route path="/register" element={<AuthPages />} />

          {/* Onboarding route */}
          <Route
            path="/onboarding"
            element={
              !auth.isAuthenticated ? (
                <Navigate to="/login" replace />
              ) : hasOnboarded ? (
                <Navigate to="/" replace />
              ) : (
                <OnboardingView 
                  onComplete={async (profile) => {
                    setHasOnboarded(true)
                    // Save birth profile to backend
                    try {
                      await api.updateProfile({
                        name: profile.name,
                        birthDate: profile.birthDate,
                        birthTime: profile.birthTime,
                        birthPlace: profile.birthPlace,
                      })
                      // Refresh user data
                      const meData = await api.getMe()
                      if (meData.user) setUser(meData.user)
                    } catch (e) {
                      console.error('Failed to save onboarding profile:', e)
                    }
                  }} 
                />
              )
            }
          />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                {hasOnboarded ? (
                  <AppLayout />
                ) : (
                  <Navigate to="/onboarding" replace />
                )}
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
    </QueryClientProvider>
  )
}
