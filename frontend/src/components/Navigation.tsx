import React from 'react'
import { motion } from 'motion/react'
import { Home, Compass, MessageCircle, Heart, Users, Store, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  { id: 'home', path: '/', icon: Home, labelKey: 'tabHome' },
  { id: 'discover', path: '/discover', icon: Compass, labelKey: 'tabDiscover' },
  { id: 'chat', path: '/chat', icon: MessageCircle, labelKey: 'tabChat' },
  { id: 'healing', path: '/healing', icon: Heart, labelKey: 'tabHealing' },
  { id: 'community', path: '/community', icon: Users, labelKey: 'tabCommunity' },
  { id: 'marketplace', path: '/marketplace', icon: Store, labelKey: 'tabMarketplace' },
  { id: 'profile', path: '/profile', icon: User, labelKey: 'tabProfile' },
]

function getActiveTab(pathname: string): string {
  const match = tabs.find(t => t.path === pathname)
  return match?.id || 'home'
}

export default function Navigation() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const activeTab = getActiveTab(location.pathname)

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-temple-deep/95 backdrop-blur-sm border-t border-temple-gold/20 z-50">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon

            return (
              <motion.button
                key={tab.id}
                data-testid={`nav-${tab.id}`}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-temple-gold'
                    : 'text-temple-cream/60 hover:text-temple-cream'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">
                  {t(tab.labelKey)}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-temple-gold"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
