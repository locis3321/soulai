import { useEffect } from 'react'
import { useStore } from '../lib/store'

interface DeepLinkHandlerProps {
  targetTab: string
  children: React.ReactNode
}

export default function DeepLinkHandler({ targetTab, children }: DeepLinkHandlerProps) {
  const { setActiveTab, setHasOnboarded } = useStore()

  useEffect(() => {
    setActiveTab(targetTab)
    // If navigating to a deep link, user is authenticated and should be considered onboarded
    setHasOnboarded(true)
  }, [targetTab, setActiveTab, setHasOnboarded])

  return <>{children}</>
}
