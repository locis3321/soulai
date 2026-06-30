import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Briefcase, DollarSign, Smile, Sparkles, Compass, Star, Eye, Calendar, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserProfile, DailyInsightData, EnergyScores } from "../types";
import { useDailyInsight } from "../hooks/useApi";

interface HomeViewProps {
  profile: UserProfile;
  onNavigate: (tab: string, arg?: any) => void;
  isPremium: boolean;
  onTogglePremium: () => void;
  largeTextMode?: boolean;
}

interface FloatingMerit {
  id: number;
  text: string;
}

interface LotusLamp {
  id: string;
  intent: string;
  buyer: string;
  timestamp: string;
}

export default function HomeView({ profile, onNavigate, isPremium, onTogglePremium, largeTextMode = false }: HomeViewProps) {
  const { t } = useTranslation();

  // Font sizing helper for Senior mode
  const sizeClass = (normal: string, large: string) => largeTextMode ? large : normal;

  // Use React Query for daily insight
  const { data: insightData, isLoading: insightLoading, error: insightError } = useDailyInsight();

  const [activeModal, setActiveModal] = useState<{ title: string; content: string; type: string } | null>(null);

  // Buddhist Altar & Merit state persistence
  const [merits, setMerits] = useState<number>(() => {
    const cached = localStorage.getItem("soul_merit_score");
    return cached ? parseInt(cached, 10) : 108; // High auspicious Buddhist count
  });

  const [lamps, setLamps] = useState<LotusLamp[]>(() => {
    const cached = localStorage.getItem("soul_active_lamps");
    return cached ? JSON.parse(cached) : [
      { id: "lamp-1", intent: t('peace'), buyer: profile.name || "Seer", timestamp: "09:41" }
    ];
  });

  const [selectedMantra, setSelectedMantra] = useState<string>("none");
  const [blessingIntent, setBlessingIntent] = useState<string>("peace");
  const [floatingMerits, setFloatingMerits] = useState<FloatingMerit[]>([]);
  const [blessingTargetName, setBlessingTargetName] = useState<string>("");
  const [floatingMeritText, setFloatingMeritText] = useState<{ id: number; text: string } | null>(null);

  // Random Buddhist phrases
  const buddhistPhrases = [
    "阿弥陀佛",
    "善哉善哉",
    "功德无量",
    "福慧双修",
    "心诚则灵",
    "吉祥如意",
    "法喜充满",
    "六时吉祥",
    "一切顺利",
    "平安喜乐"
  ];

  const handleWoodenFishTap = () => {
    // Add merit
    const meritGain = Math.floor(Math.random() * 3) + 1; // 1-3 merit
    setMerits(merits + meritGain);

    // Random phrase
    const randomPhrase = buddhistPhrases[Math.floor(Math.random() * buddhistPhrases.length)];

    // Show floating text
    setFloatingMeritText({
      id: Date.now(),
      text: `+${meritGain} ${randomPhrase}`
    });

    // Clear floating text after 1.5 seconds
    setTimeout(() => {
      setFloatingMeritText(null);
    }, 1500);

    // Add lamp
    const newLamp: LotusLamp = {
      id: `lamp-${Date.now()}`,
      intent: blessingIntent,
      buyer: profile.name || "Seeker",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setLamps([...lamps, newLamp]);
  };

  useEffect(() => {
    localStorage.setItem("soul_merit_score", merits.toString());
  }, [merits]);

  useEffect(() => {
    localStorage.setItem("soul_active_lamps", JSON.stringify(lamps));
  }, [lamps]);

  // Floating text timer cleanup
  useEffect(() => {
    if (floatingMerits.length > 0) {
      const timer = setTimeout(() => {
        setFloatingMerits((prev) => prev.slice(1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [floatingMerits]);

  // Default insight data
  const insight: DailyInsightData = insightData || {
    energy: { love: 82, career: 68, finance: 74, mood: 79 },
    dailyMessage: t('aiDirective')
  };

  // Energy score card component - compact version
  const EnergyCard = ({ icon: Icon, label, score, color }: { icon: any; label: string; score: number; color: string }) => (
    <div className="flex items-center gap-2 bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2">
      <div className={`p-1.5 rounded-md ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-slate-400 truncate">{label}</div>
        <div className="flex items-baseline gap-0.5">
          <span className="font-bold text-white text-sm">{score}</span>
          <span className="text-[9px] text-slate-500">/100</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`font-bold text-white ${sizeClass("text-2xl", "text-3xl")}`}>
            {t('welcomeBack')}, {profile.name}
          </h1>
          <p className={`text-slate-400 ${sizeClass("text-sm", "text-base")}`}>
            {t('todayGuidance')}
          </p>
        </div>
        <motion.div
          whileHover={{ rotate: 180 }}
          className="p-3 bg-purple-600/20 rounded-xl"
        >
          <Sparkles className="w-6 h-6 text-purple-400" />
        </motion.div>
      </div>

      {/* Daily Insight Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/50 to-slate-900/50 border border-purple-500/20 rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-yellow-400" />
          <span className={`font-semibold text-white ${sizeClass("text-lg", "text-xl")}`}>
            {t('dailyInsight')}
          </span>
        </div>

        {insightLoading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('common.loading')}</span>
          </div>
        ) : insightError ? (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{t('common.error')}</span>
          </div>
        ) : (
          <p className={`text-slate-300 leading-relaxed ${sizeClass("text-sm", "text-base")}`}>
            {insight.dailyMessage}
          </p>
        )}
      </motion.div>

      {/* Energy Scores - Compact horizontal layout */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className={`font-semibold text-white ${sizeClass("text-sm", "text-base")}`}>
            {t('energyOverview')}
          </h2>
          <span className="text-[10px] text-slate-500">{t('dailyInsight')}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <EnergyCard icon={Heart} label={t('compassion')} score={insight.energy.love} color="bg-pink-500/10" />
          <EnergyCard icon={Briefcase} label={t('dharma')} score={insight.energy.career} color="bg-blue-500/10" />
          <EnergyCard icon={DollarSign} label={t('abundance')} score={insight.energy.finance} color="bg-green-500/10" />
          <EnergyCard icon={Smile} label={t('vibrations')} score={insight.energy.mood} color="bg-yellow-500/10" />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className={`font-semibold text-white mb-4 ${sizeClass("text-lg", "text-xl")}`}>
          {t('quickActions')}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate("discover")}
            className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Compass className="w-5 h-5 text-purple-400" />
              </div>
              <span className={`font-medium text-white ${sizeClass("text-sm", "text-base")}`}>
                {t('tarot')}
              </span>
            </div>
            <p className={`text-slate-400 ${sizeClass("text-xs", "text-sm")}`}>
              {t('drawCards')}
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate("chat")}
            className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <span className={`font-medium text-white ${sizeClass("text-sm", "text-base")}`}>
                {t('advisor')}
              </span>
            </div>
            <p className={`text-slate-400 ${sizeClass("text-xs", "text-sm")}`}>
              {t('chatWithAdvisor')}
            </p>
          </motion.button>
        </div>
      </div>

      {/* Buddhist Altar Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-amber-900/30 to-slate-900/50 border border-amber-500/20 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪷</span>
            <h3 className={`font-semibold text-white ${sizeClass("text-lg", "text-xl")}`}>
              {t('buddhistAltar')}
            </h3>
          </div>
          <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-full">
            <span className="text-amber-400 text-sm">✨</span>
            <span className={`text-amber-400 font-medium ${sizeClass("text-sm", "text-base")}`}>
              {merits} {t('merits')}
            </span>
          </div>
        </div>

        <p className={`text-slate-400 mb-6 ${sizeClass("text-sm", "text-base")}`}>
          {t('altarDesc')}
        </p>

        {/* Yin-Yang and Wooden Fish Layout */}
        <div className="flex items-center justify-between gap-6 mb-6">
          {/* Left: Yin-Yang Symbol */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-32 h-32">
              {/* Yin-Yang SVG */}
              <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow">
                <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(212, 175, 55, 0.3)" strokeWidth="2"/>
                <path d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2" fill="rgba(212, 175, 55, 0.6)"/>
                <path d="M50 98 A48 48 0 0 1 50 2 A24 24 0 0 1 50 50 A24 24 0 0 0 50 98" fill="rgba(45, 24, 16, 0.8)"/>
                <circle cx="50" cy="26" r="6" fill="rgba(45, 24, 16, 0.8)"/>
                <circle cx="50" cy="74" r="6" fill="rgba(212, 175, 55, 0.6)"/>
              </svg>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl animate-pulse"/>
            </div>
          </div>

          {/* Right: Wooden Fish */}
          <div className="flex-1 flex flex-col items-center relative">
            {/* Floating merit animation */}
            <AnimatePresence>
              {floatingMeritText && (
                <motion.div
                  key={floatingMeritText.id}
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -60, scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10"
                >
                  <div className="bg-amber-500/90 text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap shadow-lg">
                    {floatingMeritText.text}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Merit display above fish */}
            <div className="text-center mb-3">
              <div className="text-amber-400 font-bold text-2xl">{merits}</div>
              <div className="text-amber-400/60 text-xs">{t('merits')}</div>
            </div>

            {/* Wooden Fish Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleWoodenFishTap}
              className="relative cursor-pointer focus:outline-none group"
            >
              {/* Wooden Fish SVG */}
              <svg viewBox="0 0 120 100" className="w-28 h-24 drop-shadow-lg">
                {/* Fish body */}
                <ellipse cx="60" cy="55" rx="50" ry="35" fill="url(#woodGradient)" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1.5"/>
                {/* Fish head */}
                <ellipse cx="60" cy="30" rx="35" ry="25" fill="url(#woodGradient)" stroke="rgba(212, 175, 55, 0.4)" strokeWidth="1.5"/>
                {/* Eye */}
                <circle cx="50" cy="25" r="4" fill="rgba(212, 175, 55, 0.8)"/>
                <circle cx="50" cy="25" r="2" fill="rgba(45, 24, 16, 0.8)"/>
                {/* Mouth */}
                <path d="M65 20 Q70 15 75 20" fill="none" stroke="rgba(45, 24, 16, 0.6)" strokeWidth="1.5"/>
                {/* Scales pattern */}
                <path d="M40 50 Q50 45 60 50 Q70 55 80 50" fill="none" stroke="rgba(212, 175, 55, 0.3)" strokeWidth="1"/>
                <path d="M35 60 Q50 55 65 60 Q80 65 90 60" fill="none" stroke="rgba(212, 175, 55, 0.3)" strokeWidth="1"/>
                {/* Gradient definition */}
                <defs>
                  <radialGradient id="woodGradient" cx="50%" cy="30%" r="60%">
                    <stop offset="0%" stopColor="#D4A574"/>
                    <stop offset="50%" stopColor="#8B6914"/>
                    <stop offset="100%" stopColor="#5C4033"/>
                  </radialGradient>
                </defs>
              </svg>

              {/* Tap indicator */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-500/80 text-white px-3 py-1 rounded-full text-xs font-bold"
              >
                {t('tapWoodenFish')}
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Lotus Lamps */}
        <div className="space-y-3">
          <h4 className="text-amber-400/80 text-sm font-medium">{t('activeLamps')}</h4>
          {lamps.slice(-3).map((lamp) => (
            <div
              key={lamp.id}
              className="flex items-center gap-3 bg-amber-500/5 rounded-lg p-3"
            >
              <span className="text-xl">🪔</span>
              <div className="flex-1">
                <p className={`text-white ${sizeClass("text-sm", "text-base")}`}>
                  {lamp.intent}
                </p>
                <p className={`text-slate-500 ${sizeClass("text-xs", "text-sm")}`}>
                  {lamp.buyer} • {lamp.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Floating Merits Animation */}
      {floatingMerits.map((merit) => (
        <motion.div
          key={merit.id}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -50 }}
          transition={{ duration: 1 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl pointer-events-none"
        >
          {merit.text}
        </motion.div>
      ))}
    </div>
  );
}
