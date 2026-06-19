import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Home, 
  Compass, 
  MessageCircle, 
  Heart, 
  User, 
  Sparkles, 
  Moon, 
  MoonStar, 
  TrendingUp, 
  Info, 
  HelpCircle,
  Users,
  Store
} from "lucide-react";

import { UserProfile, HealingJournal, TarotCardSpread, MoodType } from "./types";
import { LanguageKey, TRANSLATIONS, LANGUAGES } from "./lib/translations";
import HomeView from "./components/HomeView";
import DiscoverView from "./components/DiscoverView";
import ChatView from "./components/ChatView";
import HealingView from "./components/HealingView";
import ProfileView from "./components/ProfileView";
import OnboardingView from "./components/OnboardingView";
import CommunityView from "./components/CommunityView";
import MarketplaceView from "./components/MarketplaceView";

export default function App() {
  const [lang, setLang] = useState<LanguageKey>(() => {
    return (localStorage.getItem("soul_lang") as LanguageKey) || "en";
  });

  // Global Large Text Care Mode
  const [largeTextMode, setLargeTextMode] = useState<boolean>(() => {
    return localStorage.getItem("soul_large_text") === "true";
  });

  // Onboarding state
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    return localStorage.getItem("soul_onboarded") === "true";
  });

  // 1. Initial State Initialization & Local Persistence
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem("soul_active_tab") || "home";
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const cached = localStorage.getItem("soul_profile");
    if (cached) return JSON.parse(cached);
    return {
      name: "Mia",
      birthDate: "1999-06-04",
      birthTime: "08:15",
      birthPlace: "Bangkok, Thailand"
    };
  });

  const [journals, setJournals] = useState<HealingJournal[]>(() => {
    const cached = localStorage.getItem("soul_journals");
    if (cached) return JSON.parse(cached);
    return [
      {
        id: "journal-initial",
        date: "2026-06-03",
        title: "Initial Self-Compassion Sowing",
        content: "Breathing cleanly helps align my creative fire. Today I choose to release perfection expectations and allow myself to step gently forward.",
        mood: "calm"
      }
    ];
  });

  const [tarotHistory, setTarotHistory] = useState<TarotCardSpread[]>(() => {
    const cached = localStorage.getItem("soul_tarot_history");
    return cached ? JSON.parse(cached) : [];
  });

  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem("soul_is_premium") === "true";
  });

  const [marketplaceSubPage, setMarketplaceSubPage] = useState<"lobby" | "all-masters">("lobby");

  const [currentTime, setCurrentTime] = useState("09:41");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Syncing states back to LocalStorage
  useEffect(() => {
    localStorage.setItem("soul_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("soul_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("soul_journals", JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    localStorage.setItem("soul_tarot_history", JSON.stringify(tarotHistory));
  }, [tarotHistory]);

  useEffect(() => {
    localStorage.setItem("soul_is_premium", isPremium ? "true" : "false");
  }, [isPremium]);

  useEffect(() => {
    localStorage.setItem("soul_lang", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("soul_large_text", largeTextMode ? "true" : "false");
  }, [largeTextMode]);

  // Handlers
  const handleCompleteOnboarding = (completedProfile: UserProfile) => {
    setProfile(completedProfile);
    setHasOnboarded(true);
    localStorage.setItem("soul_onboarded", "true");
    setActiveTab("home");
  };

  const handleRestartOnboarding = () => {
    setHasOnboarded(false);
    localStorage.setItem("soul_onboarded", "false");
    setActiveTab("home");
  };

  const handleAddJournal = (title: string, content: string, mood: MoodType) => {
    const newEntry: HealingJournal = {
      id: `journal-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      title,
      content,
      mood
    };
    setJournals((prev) => [newEntry, ...prev]);
  };

  const handleDeleteJournal = (id: string) => {
    setJournals((prev) => prev.filter((j) => j.id !== id));
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setProfile(updated);
  };

  const handleNavigationWithArguments = (tab: string, args?: any) => {
    setActiveTab(tab);
    if (tab === "discover" && args?.tarotSpread) {
      // Append completed readings onto profile archive on completion trigger
      setTarotHistory((prev) => [args.tarotSpread, ...prev]);
    }
    if (tab === "marketplace" && args === "all-masters") {
      setMarketplaceSubPage("all-masters");
    } else if (tab === "marketplace") {
      setMarketplaceSubPage(args || "lobby");
    }
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Localized navigation tabs
  const tabCommunity = lang === "zh" ? "部落 Feed" : lang === "vi" ? "Cộng đồng" : lang === "th" ? "ชุมชน" : "Collective";
  const tabMarketplace = lang === "zh" ? "市集 Gurus" : lang === "vi" ? "Chợ Đạo Sĩ" : lang === "th" ? "ตลาดอาจารย์" : "Sages";

  return (
    <div className="min-h-screen bg-[#020512] text-slate-100 font-sans flex items-center justify-center p-0 sm:p-4 md:p-8 relative overflow-hidden selection:bg-[#7C5CFF]/30 select-none">
      
      {/* Immersive space nebula coordinates */}
      <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-[#7C5CFF]/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-[#FFD166]/8 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Primary Mobile Chassis Wrapping Shell */}
      <div 
        className="w-full max-w-[430px] h-screen sm:h-[880px] bg-[#090D1C] text-slate-100 flex flex-col justify-between relative overflow-hidden sm:border-8 sm:border-[#1E2342] sm:rounded-[48px] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] sm:ring-4 sm:ring-white/5 transition-transform"
        id="simulated-mobile-handset"
      >
        {/* Dynamic Island Sensor Bar / Notch at top (only visible on simulated frame for realism) */}
        <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-2 w-32 h-6 bg-black rounded-3xl z-50 flex items-center justify-center shadow-inner">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900/90 border border-slate-800/40 absolute left-4" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-900/90 border border-slate-800/40 absolute right-12" />
        </div>

        {/* Device Status Bar */}
        <div className="flex justify-between items-center px-6 pt-3 sm:pt-4 pb-2 text-[10px] font-mono text-slate-400 select-none bg-[#090D1C]/90 backdrop-blur-md relative z-40 border-b border-white/5">
          <span className="font-bold">{currentTime}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px]">📶 5G</span>
            <span className="text-[9px]">⚡ 100% 🔋</span>
          </div>
        </div>

        {/* Unified Mobile App Sub-Header with Care Mode Button */}
        <div className="flex justify-between items-center px-5 py-2.5 border-b border-white/5 bg-[#0D1126]/90 backdrop-blur-sm relative z-40 select-none">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-[#7C5CFF] to-teal-400 flex items-center justify-center text-xs shadow-inner">
              🪷
            </div>
            <span className="text-sm font-bold tracking-tight text-white">{lang === "zh" ? "灵格天道" : "SoulAI"}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            {/* Senior Large Font Care Switch */}
            <button
              onClick={() => setLargeTextMode(!largeTextMode)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] font-sans font-bold transition-all cursor-pointer active:scale-95 ${
                largeTextMode 
                  ? "border-[#FFD166] text-[#FFD166] bg-[#FFD166]/15 hover:bg-[#FFD166]/20 shadow-[0_0_10px_rgba(255,209,102,0.2)]" 
                  : "border-white/10 text-slate-400 bg-white/5 hover:border-white/20 hover:text-slate-200"
              }`}
            >
              👵 {lang === "zh" ? "长辈大字模式" : "Care Font Mode"}
            </button>
          </div>
        </div>

        {/* Scrollable Main Native App view port or Fullscreen Onboarding */}
        <main className={`flex-grow w-full overflow-y-auto overflow-x-hidden scrollbar-hidden ${hasOnboarded ? "px-4 py-4 pb-20 bg-gradient-to-b from-[#090D1C] to-[#04060E]" : "bg-[#090D1C]"}`} id="mobile-applet-scrollable-body">
          <AnimatePresence mode="wait">
            {!hasOnboarded ? (
              <motion.div
                key="onboarding"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <OnboardingView onComplete={handleCompleteOnboarding} lang={lang} />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.96, y: 15, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.96, y: -15, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 180, damping: 22 }}
                className="w-full h-full"
              >
                {activeTab === "home" && (
                  <HomeView 
                    profile={profile} 
                    onNavigate={handleNavigationWithArguments} 
                    isPremium={isPremium}
                    onTogglePremium={() => setIsPremium(!isPremium)}
                    lang={lang}
                    largeTextMode={largeTextMode}
                  />
                )}

                {activeTab === "discover" && (
                  <DiscoverView 
                    profile={profile} 
                    isPremium={isPremium}
                    onNavigate={handleNavigationWithArguments}
                    lang={lang}
                    largeTextMode={largeTextMode}
                  />
                )}

                {activeTab === "chat" && (
                  <ChatView 
                    profile={profile} 
                    isPremium={isPremium}
                    lang={lang}
                    largeTextMode={largeTextMode}
                  />
                )}

                {activeTab === "healing" && (
                  <HealingView 
                    onAddJournal={handleAddJournal} 
                    journals={journals} 
                    onDeleteJournal={handleDeleteJournal}
                    lang={lang}
                    largeTextMode={largeTextMode}
                  />
                )}

                {activeTab === "community" && (
                  <CommunityView 
                    profile={profile} 
                    lang={lang}
                    largeTextMode={largeTextMode}
                  />
                )}

                {activeTab === "marketplace" && (
                  <MarketplaceView 
                    profile={profile} 
                    lang={lang}
                    largeTextMode={largeTextMode}
                    activeSubPage={marketplaceSubPage}
                    onChangeSubPage={setMarketplaceSubPage}
                  />
                )}

                {activeTab === "profile" && (
                  <ProfileView 
                    profile={profile} 
                    onChangeProfile={handleUpdateProfile} 
                    isPremium={isPremium}
                    onTogglePremium={() => setIsPremium(!isPremium)}
                    tarotReadingsHistory={tarotHistory}
                    lang={lang}
                    onChangeLanguage={setLang}
                    onRestartOnboarding={handleRestartOnboarding}
                    largeTextMode={largeTextMode}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Global Bottom Tab Navigation Menu - Recreated Custom Mobile Bar (Only if onboarded) */}
        {hasOnboarded && (
          <nav className="absolute bottom-0 left-0 right-0 bg-[#0F132E]/95 backdrop-blur-md border-t border-white/10 px-1 py-1 flex justify-around items-center z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pb-6 sm:pb-3" id="native-app-bottom-navbar">
            <button 
              onClick={() => setActiveTab("home")}
              className={`flex flex-col items-center gap-1 p-1 px-1.5 outline-none cursor-pointer transition-all ${activeTab === "home" ? "text-star scale-105" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Home className="h-4 w-4" />
              <span className="text-[7.5px] font-mono leading-none">{t.tabSanctuary}</span>
            </button>
            <button 
              onClick={() => setActiveTab("discover")}
              className={`flex flex-col items-center gap-1 p-1 px-1.5 outline-none cursor-pointer transition-all ${activeTab === "discover" ? "text-star scale-105" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Compass className="h-4 w-4" />
              <span className="text-[7.5px] font-mono leading-none">{t.tabDiscover}</span>
            </button>
            <button 
              onClick={() => setActiveTab("chat")}
              className={`flex flex-col items-center gap-1 p-1 px-1.5 outline-none cursor-pointer transition-all ${activeTab === "chat" ? "text-star scale-105" : "text-slate-400 hover:text-slate-200"}`}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-[7.5px] font-mono leading-none">{t.tabAdvisor}</span>
            </button>
            <button 
              onClick={() => setActiveTab("healing")}
              className={`flex flex-col items-center gap-1 p-1 px-1.5 outline-none cursor-pointer transition-all ${activeTab === "healing" ? "text-star scale-105" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Heart className="h-4 w-4" />
              <span className="text-[7.5px] font-mono leading-none">{t.tabHealing || "Healing"}</span>
            </button>
            
            {/* Community tab */}
            <button 
              onClick={() => setActiveTab("community")}
              className={`flex flex-col items-center gap-1 p-1 px-1.5 outline-none cursor-pointer transition-all ${activeTab === "community" ? "text-star scale-105" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Users className="h-4 w-4" />
              <span className="text-[7.5px] font-mono leading-none">{tabCommunity}</span>
            </button>

            {/* Masters tab */}
            <button 
              onClick={() => setActiveTab("marketplace")}
              className={`flex flex-col items-center gap-1 p-1 px-1.5 outline-none cursor-pointer transition-all ${activeTab === "marketplace" ? "text-star scale-105" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Store className="h-4 w-4" />
              <span className="text-[7.5px] font-mono leading-none">{tabMarketplace}</span>
            </button>

            <button 
              onClick={() => setActiveTab("profile")}
              className={`flex flex-col items-center gap-1 p-1 px-1.5 outline-none cursor-pointer transition-all ${activeTab === "profile" ? "text-star scale-105" : "text-slate-400 hover:text-slate-200"}`}
            >
              <User className="h-4 w-4" />
              <span className="text-[7.5px] font-mono leading-none">{t.tabProfile || "Profile"}</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
