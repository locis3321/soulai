import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Star, 
  Crown, 
  History, 
  FileText, 
  CheckCircle2, 
  Globe, 
  Shield, 
  Info, 
  LogOut, 
  LogIn, 
  ChevronDown, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserProfile, TarotCardSpread } from "../types";
import { LANGUAGES } from "../lib/translations";
import SubscriptionPage from "./SubscriptionPage";

interface ProfileViewProps {
  profile: UserProfile;
  onChangeProfile: (updated: UserProfile) => void;
  isPremium: boolean;
  onTogglePremium: () => void;
  tarotReadingsHistory: TarotCardSpread[];
  onChangeLanguage: (newLang: string) => void;
  onRestartOnboarding?: () => void;
  largeTextMode?: boolean;
}

export default function ProfileView({
  profile,
  onChangeProfile,
  isPremium,
  onTogglePremium,
  tarotReadingsHistory,
  onChangeLanguage,
  onRestartOnboarding,
  largeTextMode = false
}: ProfileViewProps) {
  const { t, i18n } = useTranslation();

  // Form states
  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [birthTime, setBirthTime] = useState(profile.birthTime);
  const [birthPlace, setBirthPlace] = useState(profile.birthPlace);
  const [calibrateMsg, setCalibrateMsg] = useState<string | null>(null);

  // Layout Accordion state triggers
  const [showLanguageCollapse, setShowLanguageCollapse] = useState(false);
  const [showCalibrateCollapse, setShowCalibrateCollapse] = useState(false);
  const [showHistoryCollapse, setShowHistoryCollapse] = useState(false);
  const [showPrivacyCollapse, setShowPrivacyCollapse] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showAboutCollapse, setShowAboutCollapse] = useState(false);

  // Authentication simulation
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem("soul_auth_email") || "housmanthay@gmail.com";
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("soul_is_logged_in") !== "false"; // default to true to reflect active user mail
  });

  // Login inputs
  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [authMsg, setAuthMsg] = useState<string | null>(null);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChangeProfile({ name, birthDate, birthTime, birthPlace });
    setCalibrateMsg("✓ Calibrated! Western and Eastern Natal coordinates updated beautifully.");
    setTimeout(() => setCalibrateMsg(null), 4000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem("soul_is_logged_in", "false");
    setAuthMsg(t('profile.logoutSuccess'));
    setTimeout(() => setAuthMsg(null), 4000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const targetedEmail = inputEmail.trim() || "housmanthay@gmail.com";
    setUserEmail(targetedEmail);
    localStorage.setItem("soul_auth_email", targetedEmail);
    setIsLoggedIn(true);
    localStorage.setItem("soul_is_logged_in", "true");
    setAuthMsg(t('profile.loginSuccess'));
    setInputEmail("");
    setInputPassword("");
    setTimeout(() => setAuthMsg(null), 4000);
  };

  // Helper dynamic western astrology calculation
  const getSunSignInfo = (dateStr: string) => {
    if (!dateStr) return { sign: "Unknown Sign", symbol: "✦", trait: "Input birthdate below." };
    const parts = dateStr.split("-");
    if (parts.length < 3) return { sign: "Unknown", symbol: "✦", trait: "" };
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);

    if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return { sign: "Aries", symbol: "♈", trait: "Governed by Martian initiation." };
    if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return { sign: "Taurus", symbol: "♉", trait: "Abundant grower of sensory stillness." };
    if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return { sign: "Gemini", symbol: "♊", trait: "Mercury duality intellectual traveler." };
    if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return { sign: "Cancer", symbol: "♋", trait: "Lunar intuitive emotional sanctuary." };
    if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return { sign: "Leo", symbol: "♌", trait: "Radiant solar creative leader." };
    if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return { sign: "Virgo", symbol: "♍", trait: "Sacred meticulous Earth healer." };
    if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return { sign: "Libra", symbol: "♎", tracking: "Harmonic spiritual balancing." };
    if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return { sign: "Scorpio", symbol: "♏", trait: "Transmuter of dense mysteries." };
    if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return { sign: "Sagittarius", symbol: "♐", trait: "Philosophical cosmic voyager." };
    if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return { sign: "Capricorn", symbol: "♑", trait: "Architect of sovereign Earth cycles." };
    if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return { sign: "Aquarius", symbol: "♒", trait: "Altruistic visionary sky dweller." };
    return { sign: "Pisces", symbol: "♓", trait: "Somatic integration with the ocean mind." };
  };

  const getChineseZodiacInfo = (dateStr: string) => {
    if (!dateStr) return { sign: "Unknown Animal", symbol: "🐉" };
    const parts = dateStr.split("-");
    const year = parseInt(parts[0], 10);
    if (isNaN(year)) return { sign: "Unknown", symbol: "🐉" };

    const animals = [
      { name: "Rat", emoji: "🐭" },
      { name: "Ox", emoji: "🐮" },
      { name: "Tiger", emoji: "🐯" },
      { name: "Rabbit", emoji: "🐰" },
      { name: "Dragon", emoji: "🐉" },
      { name: "Snake", emoji: "🐍" },
      { name: "Horse", emoji: "🐴" },
      { name: "Goat", emoji: "🐐" },
      { name: "Monkey", emoji: "🐵" },
      { name: "Rooster", emoji: "🐔" },
      { name: "Dog", emoji: "🐶" },
      { name: "Pig", emoji: "🐷" }
    ];

    const offset = (year - 1900) % 12;
    const index = offset < 0 ? (offset + 12) % 12 : offset;
    return {
      sign: animals[index].name,
      symbol: animals[index].emoji
    };
  };

  const sunSign = getSunSignInfo(birthDate);
  const chineseZodiac = getChineseZodiacInfo(birthDate);

  return (
    <div className="space-y-6" id="optimized-profile-screen">
      
      {/* 2. CONCISE BRIEF USER PROFILE CARD (简洁的用户信息) */}
      <div 
        className="relative bg-gradient-to-br from-[#121633] to-[#0A0D21] border border-white/5 rounded-3xl p-5 overflow-hidden shadow-2xl"
        id="concise-mobile-profile-card"
      >
        <div className="absolute top-[-40px] right-[-40px] w-28 h-28 bg-[#7C5CFF]/15 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-4">
          {/* Glowing Natal Crest Avatar */}
          <div className="relative flex items-center justify-center shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#7C5CFF] via-[#A78BFA] to-[#FFD166] p-[2.5px] shadow-[0_0_15px_rgba(124,92,255,0.35)]">
              <div className="w-full h-full rounded-full bg-[#090C1F] flex items-center justify-center text-3xl">
                {sunSign.symbol}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-glow rounded-full text-slate-900 font-bold border-2 border-[#090C1F] text-[10px] flex items-center justify-center">
              {chineseZodiac.symbol}
            </div>
          </div>

          {/* User descriptions name & sync level */}
          <div className="space-y-1">
            <span className="font-mono text-[8px] uppercase tracking-widest text-glow font-bold">
              {isPremium ? t('levelPremium') : t('levelNovice')}
            </span>
            <h2 className="font-display font-black text-slate-100 text-lg flex items-center gap-1.5 leading-none">
              {profile.name || "Mia"}
              {isPremium && <Crown className="h-4 w-4 text-glow" />}
            </h2>
            <p className="text-[10px] font-mono text-slate-400">
              {isLoggedIn ? `${t('profile.connectEmail')}: ${userEmail}` : t('profile.guestMode')}
            </p>
          </div>
        </div>

        {/* Horizontal micro-chips showing coordinates calculated */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-white/[0.04]">
          <div className="bg-white/[0.012] border border-white/5 p-2 rounded-xl text-left">
            <span className="block font-mono text-[7px] text-slate-500 uppercase tracking-widest leading-none mb-1">{t('sunSignLabel')}</span>
            <span className="font-display font-medium text-xs text-slate-300">{sunSign.sign} {sunSign.symbol}</span>
          </div>
          <div className="bg-white/[0.012] border border-white/5 p-2 rounded-xl text-left">
            <span className="block font-mono text-[7px] text-slate-500 uppercase tracking-widest leading-none mb-1">{t('yearBranchLabel')}</span>
            <span className="font-display font-medium text-xs text-slate-300">{chineseZodiac.sign} {chineseZodiac.symbol}</span>
          </div>
        </div>

        {/* Subscription Management */}
        <div className="mt-4 flex items-center justify-between bg-white/[0.02] border border-white/5 p-2 px-3 rounded-2xl">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-[#FFD166]" />
            <span className="text-[10px] font-mono text-slate-300">
              {isPremium ? 'Premium Plan' : 'Upgrade for more features'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowSubscription(true)}
            className="px-2.5 py-1 rounded-lg bg-[#7C5CFF] text-white font-mono text-[9px] font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            {isPremium ? 'MANAGE' : 'UPGRADE'}
          </button>
        </div>

        {/* Subscription Page Overlay */}
        {showSubscription && (
          <div className="fixed inset-0 z-50 bg-[#090D1C] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-[#090D1C]/95 backdrop-blur-sm border-b border-white/5 p-4 flex items-center">
              <button onClick={() => setShowSubscription(false)} className="text-[#7C5CFF] font-mono text-xs font-bold cursor-pointer">
                ← Back
              </button>
            </div>
            <SubscriptionPage />
          </div>
        )}
      </div>

      {authMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-950/40 border border-[#7C5CFF]/30 text-slate-200 text-[10px] py-2 px-3 rounded-xl font-mono text-center flex items-center justify-center gap-1.5"
        >
          <Sparkles className="h-3 w-3 text-glow" /> {authMsg}
        </motion.div>
      )}

      {/* 3. SETTINGS CELLS / OPTION ACCORDIONS (必要的系统控制按钮) */}
      <div className="space-y-2.5" id="native-app-settings-menu">
        
        {/* 3.1 LANGUAGE SWITCH CELL */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowLanguageCollapse(!showLanguageCollapse)}
            className="w-full flex items-center justify-between p-4 outline-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#7C5CFF]/15 flex items-center justify-center text-[#7C5CFF]">
                <Globe className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="block text-slate-200 text-xs font-semibold leading-tight">{t('profile.selectLang')}</span>
                <span className="font-mono text-[9px] text-slate-400 capitalize">{t('profile.activeLangLabel')}: {LANGUAGES.find(l => l.key === i18n.language)?.label}</span>
              </div>
            </div>
            {showLanguageCollapse ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          </button>

          <AnimatePresence>
            {showLanguageCollapse && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden bg-[#0A0D22] border-t border-white/[0.03] px-3 py-2"
              >
                <div className="grid grid-cols-2 gap-2 p-1">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.key}
                      type="button"
                      onClick={() => {
                        onChangeLanguage(l.key);
                        setShowLanguageCollapse(false);
                      }}
                      className={`cursor-pointer w-full p-2.5 rounded-xl text-left flex items-center justify-between border transition-all ${
                        i18n.language === l.key 
                          ? "bg-[#7C5CFF]/20 text-[#FFD166] border-[#7C5CFF]/45 shadow-sm" 
                          : "bg-white/[0.01] text-slate-400 border-transparent hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{l.flag}</span>
                        <span className="font-mono text-xs font-medium">{l.label}</span>
                      </div>
                      {i18n.language === l.key && <CheckCircle2 className="h-3.5 w-3.5 text-[#FFD166] shrink-0" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3.2 LOGIN / LOGOUT ACCOUNT SYNCHRONIZATION */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => {
              // Toggle accordion
              setIsLoggedIn(prev => {
                if (prev) {
                  // If logged in, let clicking expand options instead of immediate logouts
                  return prev;
                }
                return prev;
              });
              // Always toggle view
              setShowHistoryCollapse(false); // keep other shut
              setShowCalibrateCollapse(false);
              setShowAboutCollapse(false);
              setShowPrivacyCollapse(false);
            }}
            className="w-full flex items-center justify-between p-4 outline-none"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLoggedIn ? "bg-teal-500/15 text-teal-400" : "bg-red-500/10 text-red-400"}`}>
                {isLoggedIn ? <CheckCircle2 className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
              </div>
              <div className="text-left">
                <span className="block text-slate-200 text-xs font-semibold leading-tight">
                  {isLoggedIn ? t('profile.activeAccount') : t('profile.guestMode')}
                </span>
                <span className="font-mono text-[9px] text-slate-500 leading-none">
                  {isLoggedIn ? userEmail : t('profile.loginDesc').slice(0, 48) + "..."}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="cursor-pointer px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-mono rounded-lg border border-red-500/20 transition-all font-semibold"
                >
                  {t('profile.logout')}
                </button>
              ) : (
                <span className="text-xs text-[#7C5CFF] font-semibold font-mono uppercase">{t('profile.login').split(" ")[0]}</span>
              )}
            </div>
          </button>

          {/* Interactive Login UI if not logged in */}
          {!isLoggedIn && (
            <div className="bg-[#0A0D22] border-t border-white/[0.03] p-4 font-sans space-y-3">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {t('profile.loginDesc')} <span className="text-glow">{t('profile.enterAny')}</span>
              </p>
              
              <form onSubmit={handleLogin} className="space-y-2.5">
                <div>
                  <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">{t('fullNameLabel')} Email</label>
                  <input
                    type="email"
                    required
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="e.g. pilgrim-sync@soul.ai"
                    className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-star"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">{t('profile.secLogin')}</label>
                  <input
                    type="password"
                    required
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="cursor-pointer w-full bg-[#7C5CFF]/30 hover:bg-[#7C5CFF]/50 text-slate-100 font-mono text-[10px] font-bold py-1.5 rounded-xl border border-[#7C5CFF]/30 transition"
                >
                  🔑 {t('profile.login')}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 3.3 COLLAPSIBLE CALIBRATE METRICS (校准出生三昧参数) */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowCalibrateCollapse(!showCalibrateCollapse)}
            className="w-full flex items-center justify-between p-4 outline-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-[#FFD166]">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="block text-slate-200 text-xs font-semibold leading-tight">{t('profile.calibrateLabel')}</span>
                <span className="font-mono text-[9px] text-slate-400 truncate max-w-[200px] block">
                  {profile.birthDate} • {profile.birthPlace || "No Coordinates"}
                </span>
              </div>
            </div>
            {showCalibrateCollapse ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          </button>

          <AnimatePresence>
            {showCalibrateCollapse && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-[#0A0D22] border-t border-white/[0.03] p-4"
              >
                {calibrateMsg && (
                  <div className="bg-teal-500/15 text-teal-300 text-[10px] rounded-lg p-2.5 mb-3 font-mono border border-teal-500/20">
                    {calibrateMsg}
                  </div>
                )}
                <form onSubmit={handleProfileSubmit} className="space-y-3 font-sans">
                  <div>
                    <label className="text-slate-400 font-mono text-[8.5px] uppercase tracking-wider block mb-1">
                      {t('fullNameLabel')}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Mia"
                      className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-glow"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 font-mono text-[8.5px] uppercase tracking-wider block mb-1">
                        {t('birthDateLabel')}
                      </label>
                      <input
                        type="date"
                        required
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-3 py-1 px-1.5 text-slate-200 text-[10px] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-mono text-[8.5px] uppercase tracking-wider block mb-1">
                        {t('birthTimeLabel')}
                      </label>
                      <input
                        type="time"
                        value={birthTime}
                        onChange={(e) => setBirthTime(e.target.value)}
                        className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-3 py-1 px-1.5 text-slate-200 text-[10px] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 font-mono text-[8.5px] uppercase tracking-wider block mb-1">
                      {t('birthTownLabel')}
                    </label>
                    <input
                      type="text"
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      placeholder="e.g. Bangkok, Thailand"
                      className="w-full bg-[#090C1F] border border-[#1E2342] rounded-xl px-3 py-1.5 text-slate-200 text-xs focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="cursor-pointer w-full mt-2 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-slate-100 font-mono text-[10.5px] py-1.5 rounded-xl transition duration-200"
                  >
                    {t('calibrateButtonText')}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={onRestartOnboarding}
                  className="w-full mt-3 py-1.5 rounded-xl text-[9px] font-mono bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition cursor-pointer"
                >
                  🔄 {t('profile.title').startsWith("Soul") ? "Restart Sacred Journey" : "重置心灵入门旅程"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3.4 COLLAPSIBLE NATIVE HISTORY LOG (因果问卜历史记录) */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowHistoryCollapse(!showHistoryCollapse)}
            className="w-full flex items-center justify-between p-4 outline-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                <History className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="block text-slate-200 text-xs font-semibold leading-tight">{t('myDivinaryRecords')}</span>
                <span className="font-mono text-[9px] text-slate-400">
                  {tarotReadingsHistory.length} readings archived
                </span>
              </div>
            </div>
            {showHistoryCollapse ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          </button>

          <AnimatePresence>
            {showHistoryCollapse && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-[#0A0D22] border-t border-white/[0.03] p-4 space-y-3"
              >
                {tarotReadingsHistory.length === 0 ? (
                  <div className="py-8 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                    <FileText className="h-4 w-4 text-slate-400 mb-1" />
                    {t('noReadingsCompleted')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tarotReadingsHistory.map((rep, idx) => (
                      <div
                        key={idx}
                        className="bg-[#090D1C] border border-white/5 p-3 rounded-xl space-y-1.5"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[8px] text-[#A78BFA] uppercase">
                              {rep.timestamp}
                            </span>
                            <h4 className="font-display font-semibold text-slate-200 text-xs truncate max-w-[210px]">
                              &ldquo;{rep.question}&rdquo;
                            </h4>
                          </div>
                          <div className="flex gap-0.5">
                            {rep.cards.map((c, cIdx) => (
                              <span key={cIdx} className="text-xs bg-white/5 px-1 py-0.5 rounded" title={c.name}>
                                {c.imageSymbol}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-2.5 bg-[#11162E]/25 border border-white/[0.02] rounded-lg max-h-36 overflow-y-auto text-slate-300 text-[10px] leading-relaxed font-sans">
                          {rep.readingText.split("\n").map((line, lIdx) => {
                            if (line.startsWith("###")) {
                              return <h4 key={lIdx} className="font-display text-[10px] text-glow font-bold mt-1 mb-0.5">{line.replace("###", "")}</h4>;
                            }
                            if (line.startsWith("##")) {
                              return <h3 key={lIdx} className="font-display text-[10.5px] text-star font-bold mt-2 mb-1">{line.replace("##", "")}</h3>;
                            }
                            return <p key={lIdx} className="mb-0.5">{line}</p>;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3.5 NATIVE COMPLIANT PRIVACY POLICY (隐私协议) */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowPrivacyCollapse(!showPrivacyCollapse)}
            className="w-full flex items-center justify-between p-4 outline-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                <Shield className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="block text-slate-200 text-xs font-semibold leading-tight">{t('profile.privacyTitle')}</span>
                <span className="font-mono text-[9px] text-slate-500">Security & GDPR compliant terms</span>
              </div>
            </div>
            {showPrivacyCollapse ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          </button>

          <AnimatePresence>
            {showPrivacyCollapse && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-[#0A0D22] border-t border-white/[0.03] p-4 text-left font-sans text-[10.5px] text-slate-400 leading-relaxed space-y-2 select-all"
              >
                <p className="font-bold text-slate-300">🔐 {t('profile.privacyTitle')}</p>
                <p>{t('profile.privacyText')}</p>
                <p className="border-t border-white/5 pt-2 text-[9.5px] text-slate-500 font-mono">
                  Encryption Layer: SHA-256 Local Encrypted Client Shell Storage.<br />
                  Data Server: Private Cloud Run Ingress Tunnel.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3.6 ABOUT SANCTUARY & VERSION (关于我们以及版本) */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowAboutCollapse(!showAboutCollapse)}
            className="w-full flex items-center justify-between p-4 outline-none cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Info className="h-4 w-4" />
              </div>
              <div className="text-left">
                <span className="block text-slate-200 text-xs font-semibold leading-tight">{t('profile.aboutTitle')}</span>
                <span className="font-mono text-[9px] text-slate-500">{t('profile.appModel')} • Details</span>
              </div>
            </div>
            {showAboutCollapse ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          </button>

          <AnimatePresence>
            {showAboutCollapse && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-[#0A0D22] border-t border-white/[0.03] p-4 font-sans text-[10.5px] text-slate-400 leading-relaxed space-y-2 select-all"
              >
                <div className="flex items-center gap-2 text-[#FFD166] font-bold">
                  <span>🕉️</span>
                  <span>{t('profile.appModel')}</span>
                </div>
                <p>{t('profile.aboutText')}</p>
                <p className="bg-[#11162E]/20 p-2.5 rounded-lg border border-white/5 text-[9.5px] font-mono text-[#7C5CFF]">
                  🎮 {t('profile.platformSpec')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
