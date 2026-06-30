import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Crown,
  History,
  FileText,
  CheckCircle2,
  Globe,
  Shield,
  Info,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { UserProfile, TarotCardSpread } from "../types";
import { LANGUAGES } from "../lib/translations";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
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
  const { auth, logout } = useStore();
  const navigate = useNavigate();

  const sizeClass = (normal: string, large: string) => largeTextMode ? large : normal;

  // Auth state
  const isLoggedIn = auth.isAuthenticated;
  const isAnonymous = auth.isAnonymous;
  const userEmail = auth.user?.email || "";

  // Form states
  const [name, setName] = useState(profile.name);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [birthTime, setBirthTime] = useState(profile.birthTime);
  const [birthPlace, setBirthPlace] = useState(profile.birthPlace);
  const [calibrateMsg, setCalibrateMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Modals
  const [showLanguage, setShowLanguage] = useState(false);
  const [showCalibrate, setShowCalibrate] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPhoneBind, setShowPhoneBind] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [privacyContent, setPrivacyContent] = useState('');

  // Login modal state
  const [loginPhone, setLoginPhone] = useState('')
  const [loginCode, setLoginCode] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginMode, setLoginMode] = useState<'code' | 'password'>('code')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  // Phone bind state
  const [bindPhone, setBindPhone] = useState('')
  const [bindCode, setBindCode] = useState('')
  const [bindError, setBindError] = useState('')
  const [bindLoading, setBindLoading] = useState(false)
  const [bindStep, setBindStep] = useState<'phone' | 'code'>('phone')
  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  const handleLogout = () => { logout(); useStore.getState().setHasOnboarded(false) }
  const openPrivacy = async () => { try { const d = await api.get('/privacy/policy'); setPrivacyContent(d.policy || d.text || ''); } catch { setPrivacyContent('Loading failed'); } setShowPrivacy(true) }

  const handleSendBindCode = async () => { if (!bindPhone || bindLoading) return; setBindLoading(true); setBindError(''); try { await api.sendPhoneCode(bindPhone, 'bind'); setBindStep('code') } catch { setBindError('Failed') } finally { setBindLoading(false) } }
  const handleVerifyBind = async () => { if (!bindCode) return; setBindLoading(true); try { const d = await api.verifyPhoneCode(bindPhone, bindCode, 'bind'); useStore.getState().login(d.user, d.token); setShowPhoneBind(false); setBindPhone(''); setBindCode(''); setBindStep('phone') } catch { setBindError('Invalid code') } finally { setBindLoading(false) } }
  const handleSendLoginCode = async () => { if (!loginPhone || loginLoading) return; setLoginLoading(true); setLoginError(''); try { await api.sendPhoneCode(loginPhone, 'login') } catch { setLoginError('Failed') } finally { setLoginLoading(false) } }
  const handlePhoneLogin = async () => { setLoginLoading(true); setLoginError(''); try { const d = loginMode === 'code' ? await api.verifyPhoneCode(loginPhone, loginCode, 'login') : await api.login(loginPhone, loginPassword); useStore.getState().login(d.user, d.token); setShowLogin(false); setLoginPhone(''); setLoginCode(''); setLoginPassword('') } catch { setLoginError('Login failed') } finally { setLoginLoading(false) } }
  const handleChangePassword = async () => { if (!newPassword || pwdLoading) return; setPwdLoading(true); try { await api.post('/auth/change-password', { password: newPassword }); setPwdMsg('Updated') } catch { setPwdMsg('Failed') } finally { setPwdLoading(false) } }

  // Layout states
  const [showHistoryCollapse, setShowHistoryCollapse] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onChangeProfile({ name, birthDate, birthTime, birthPlace });
      setCalibrateMsg("✓ Calibrated! Natal coordinates updated.");
    } catch {
      setCalibrateMsg("Failed to save. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setCalibrateMsg(null), 4000);
    }
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
    if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return { sign: "Libra", symbol: "♎", trait: "Harmonic spiritual balancing." };
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
      { name: "Rat", emoji: "🐭" }, { name: "Ox", emoji: "🐮" },
      { name: "Tiger", emoji: "🐯" }, { name: "Rabbit", emoji: "🐰" },
      { name: "Dragon", emoji: "🐉" }, { name: "Snake", emoji: "🐍" },
      { name: "Horse", emoji: "🐴" }, { name: "Goat", emoji: "🐐" },
      { name: "Monkey", emoji: "🐵" }, { name: "Rooster", emoji: "🐔" },
      { name: "Dog", emoji: "🐶" }, { name: "Pig", emoji: "🐷" }
    ];

    const offset = (year - 1900) % 12;
    const index = offset < 0 ? (offset + 12) % 12 : offset;
    return { sign: animals[index].name, symbol: animals[index].emoji };
  };

  const sunSign = getSunSignInfo(birthDate);
  const chineseZodiac = getChineseZodiacInfo(birthDate);

  return (
    <div className="space-y-6" id="optimized-profile-screen">

      {/* User Profile Card */}
      <div
        className="relative bg-gradient-to-br from-[#121633] to-[#0A0D21] border border-white/5 rounded-3xl p-5 overflow-hidden shadow-2xl"
        id="concise-mobile-profile-card"
      >
        <div className="absolute top-[-40px] right-[-40px] w-28 h-28 bg-[#7C5CFF]/15 rounded-full blur-3xl" />

        <div className="flex items-center gap-4">
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

          <div className="space-y-1">
            <span className={sizeClass("font-mono text-[8px] uppercase tracking-widest text-glow font-bold", "font-mono text-[10px] uppercase tracking-widest text-glow font-bold")}>
              {isPremium ? t('levelPremium') : t('levelNovice')}
            </span>
            <h2 className={sizeClass("font-display font-black text-slate-100 text-lg flex items-center gap-1.5 leading-none", "font-display font-black text-slate-100 text-xl flex items-center gap-1.5 leading-none")}>
              {profile.name || "Seeker"}
              {isPremium && <Crown className="h-4 w-4 text-glow" />}
            </h2>
            <p className="text-[10px] font-mono text-slate-400">
              {isLoggedIn ? `${t('profile.connectEmail')}: ${userEmail}` : t('profile.guestMode')}
            </p>
          </div>
        </div>

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

      {/* Settings Cells */}
      <div className="space-y-2.5" id="native-app-settings-menu">

        {/* Language Switch — modal popup */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button type="button" onClick={() => setShowLanguage(true)} className="w-full flex items-center justify-between p-4 outline-none cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#7C5CFF]/15 flex items-center justify-center text-[#7C5CFF]"><Globe className="h-4 w-4" /></div>
              <div className="text-left"><span className="block text-slate-200 text-xs font-semibold leading-tight">{t('profile.selectLang')}</span><span className="font-mono text-[9px] text-slate-400">{LANGUAGES.find(l => l.key === i18n.language)?.label}</span></div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Account Section — simplified */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <div className="w-full p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLoggedIn && !isAnonymous ? "bg-teal-500/15 text-teal-400" : "bg-amber-500/10 text-amber-400"}`}>
                {isLoggedIn && !isAnonymous ? <CheckCircle2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div className="text-left flex-1">
                <span className="block text-slate-200 text-xs font-semibold leading-tight">
                  {isLoggedIn && !isAnonymous ? '已激活账号' : isLoggedIn ? '匿名用户' : '未登录'}
                </span>
                <span className="font-mono text-[9px] text-slate-500 leading-none">{isLoggedIn ? (auth.user?.phone || userEmail || '') : '登录后可同步数据'}</span>
              </div>
              <div className="flex gap-1">
                {!isLoggedIn && <button onClick={() => setShowLogin(true)} className="px-3 py-1.5 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-[10px] font-mono font-bold rounded-xl transition-colors">登录</button>}
                {isLoggedIn && isAnonymous && <button onClick={() => setShowPhoneBind(true)} className="px-3 py-1.5 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-[10px] font-mono font-bold rounded-xl transition-colors">绑定手机</button>}
                {isLoggedIn && !isAnonymous && <button onClick={() => setShowPassword(true)} className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-mono font-bold rounded-xl border border-blue-500/20 transition-colors">修改密码</button>}
              </div>
            </div>
          </div>
        </div>

        {/* Calibrate Birth Profile — modal popup */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button type="button" onClick={() => setShowCalibrate(true)} className="w-full flex items-center justify-between p-4 outline-none cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-[#FFD166]"><Calendar className="h-4 w-4" /></div>
              <div className="text-left"><span className="block text-slate-200 text-xs font-semibold leading-tight">{t('profile.calibrateLabel')}</span><span className="font-mono text-[9px] text-slate-400 truncate max-w-[200px] block">{profile.birthDate || 'Not set'} • {profile.birthPlace || 'No Coordinates'}</span></div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Divination History */}
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
                      <div key={idx} className="bg-[#090D1C] border border-white/5 p-3 rounded-xl space-y-1.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[8px] text-[#A78BFA] uppercase">{rep.timestamp}</span>
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
                            if (line.startsWith("###")) return <h4 key={lIdx} className="font-display text-[10px] text-glow font-bold mt-1 mb-0.5">{line.replace("###", "")}</h4>;
                            if (line.startsWith("##")) return <h3 key={lIdx} className="font-display text-[10.5px] text-star font-bold mt-2 mb-1">{line.replace("##", "")}</h3>;
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

        {/* Privacy Policy — modal popup with backend content */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button type="button" onClick={openPrivacy} className="w-full flex items-center justify-between p-4 outline-none cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400"><Shield className="h-4 w-4" /></div>
              <div className="text-left"><span className="block text-slate-200 text-xs font-semibold leading-tight">{t('profile.privacyTitle')}</span><span className="font-mono text-[9px] text-slate-500">GDPR compliant</span></div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* About — modal popup */}
        <div className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden transition-all">
          <button type="button" onClick={() => setShowAbout(true)} className="w-full flex items-center justify-between p-4 outline-none cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400"><Info className="h-4 w-4" /></div>
              <div className="text-left"><span className="block text-slate-200 text-xs font-semibold leading-tight">{t('profile.aboutTitle')}</span><span className="font-mono text-[9px] text-slate-500">{t('profile.appModel')} • v1.0</span></div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>

      </div>

      {/* Logout at page bottom */}
      {isLoggedIn && !isAnonymous && (
        <div className="mt-8 pt-4 border-t border-white/5">
          <button onClick={handleLogout} className="cursor-pointer w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-mono font-bold rounded-xl border border-red-500/20 transition-colors">退出登录</button>
        </div>
      )}

      {/* Modals */}
      {showLanguage && <Modal title="选择语言" onClose={() => setShowLanguage(false)} children={
        <div className="grid grid-cols-2 gap-2">{LANGUAGES.map(l => <button key={l.key} onClick={() => { onChangeLanguage(l.key); setShowLanguage(false) }} className={`p-3 rounded-xl text-left flex items-center gap-2 border transition-all ${i18n.language === l.key ? 'bg-[#7C5CFF]/20 text-[#FFD166] border-[#7C5CFF]/45' : 'bg-white/[0.01] text-slate-400 border-transparent hover:bg-white/[0.03]'}`}><span className="text-base">{l.flag}</span><span className="font-mono text-xs font-medium">{l.label}</span>{i18n.language === l.key && <CheckCircle2 className="h-3 w-3 text-[#FFD166] ml-auto" />}</button>)}</div>
      } />}

      {showCalibrate && <Modal title="校准出生参数" onClose={() => setShowCalibrate(false)} children={
        <div className="space-y-3">{calibrateMsg && <div className="bg-teal-500/15 text-teal-300 text-[10px] rounded-lg p-2.5 font-mono border border-teal-500/20">{calibrateMsg}</div>}
          <form onSubmit={(e) => { e.preventDefault(); handleProfileSubmit(e as any) }} className="space-y-3">
            <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-sm outline-none focus:border-glow" />
            <div className="grid grid-cols-2 gap-2"><input type="date" required value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none" /><input type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)} className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none" /></div>
            <input type="text" value={birthPlace} onChange={e => setBirthPlace(e.target.value)} placeholder="e.g. Bangkok, Thailand" className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-sm outline-none" />
            <button type="submit" disabled={saving} className="w-full py-3 bg-[#7C5CFF] hover:bg-[#6D4AFF] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors">{saving ? 'Saving...' : '保存校准'}</button>
          </form>
          {onRestartOnboarding && <button onClick={onRestartOnboarding} className="w-full py-2 rounded-xl text-[10px] font-mono bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors">重新完成引导流程</button>}
        </div>
      } />}

      {showPrivacy && <Modal title="隐私与算法安全协议" onClose={() => setShowPrivacy(false)} children={
        <div className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto">{privacyContent || 'Loading...'}</div>
      } />}

      {showAbout && <Modal title="关于灵格AI圣坛" onClose={() => setShowAbout(false)} children={
        <div className="space-y-3 text-center"><div className="flex items-center justify-center gap-2 text-[#FFD166] font-bold text-lg"><span>🕉️</span><span>{t('profile.appModel')}</span></div><p className="text-slate-400 text-xs leading-relaxed">{t('profile.aboutText')}</p><p className="text-slate-500 text-[10px] font-mono">v1.0 · SoulAI</p></div>
      } />}

      {showLogin && <Modal title="登录" onClose={() => setShowLogin(false)} children={
        <div className="space-y-3">
          <div className="flex bg-[#090C1F] rounded-xl p-0.5"><button onClick={() => setLoginMode('code')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${loginMode==='code'?'bg-[#7C5CFF] text-white':'text-slate-500'}`}>验证码登录</button><button onClick={() => setLoginMode('password')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${loginMode==='password'?'bg-[#7C5CFF] text-white':'text-slate-500'}`}>密码登录</button></div>
          <input type="tel" value={loginPhone} onChange={e => setLoginPhone(e.target.value)} placeholder="手机号" className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-[#7C5CFF]/50" />
          {loginMode==='code'?<div className="flex gap-2"><input type="text" value={loginCode} onChange={e=>setLoginCode(e.target.value)} placeholder="验证码" maxLength={6} className="flex-1 bg-[#090C1F] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm text-center tracking-[0.3em] outline-none" /><button onClick={handleSendLoginCode} disabled={loginLoading} className="px-4 py-3 bg-[#7C5CFF]/10 hover:bg-[#7C5CFF]/20 text-[#7C5CFF] font-bold rounded-xl text-xs transition-colors">发送</button></div>:<input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder="密码" className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-[#7C5CFF]/50" />}
          <button onClick={handlePhoneLogin} disabled={loginLoading} className="w-full py-3 bg-[#7C5CFF] hover:bg-[#6D4AFF] disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors">{loginLoading?'登录中...':'登录'}</button>
          {loginError&&<p className="text-red-400 text-xs text-center">{loginError}</p>}
        </div>
      } />}

      {showPhoneBind && <Modal title="绑定手机号" onClose={() => setShowPhoneBind(false)} children={
        bindStep==='phone'?<div className="space-y-3"><input type="tel" value={bindPhone} onChange={e=>setBindPhone(e.target.value)} placeholder="输入手机号" className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-[#7C5CFF]/50" /><button onClick={handleSendBindCode} disabled={bindLoading} className="w-full py-3 bg-[#7C5CFF] hover:bg-[#6D4AFF] disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors">{bindLoading?'发送中...':'获取验证码'}</button>{bindError&&<p className="text-red-400 text-xs text-center">{bindError}</p>}</div>:
        <div className="space-y-3"><p className="text-slate-400 text-xs text-center">验证码已发送至 {bindPhone}</p><input type="text" value={bindCode} onChange={e=>setBindCode(e.target.value)} placeholder="输入验证码 (开发环境: 888888)" maxLength={6} className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm text-center tracking-[0.3em] outline-none focus:border-[#10b981]/50" /><button onClick={handleVerifyBind} disabled={bindLoading} className="w-full py-3 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors">{bindLoading?'验证中...':'确认绑定'}</button><button onClick={()=>setBindStep('phone')} className="w-full text-[#7C5CFF] hover:text-[#a78bfa] text-xs transition-colors">返回修改手机号</button>{bindError&&<p className="text-red-400 text-xs text-center">{bindError}</p>}</div>
      } />}

      {showPassword && <Modal title="修改密码" onClose={() => setShowPassword(false)} children={
        <div className="space-y-3"><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="新密码" className="w-full bg-[#090C1F] border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-[#7C5CFF]/50" /><button onClick={handleChangePassword} disabled={pwdLoading} className="w-full py-3 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors">{pwdLoading?'保存中...':'保存'}</button>{pwdMsg&&<p className={`text-xs text-center ${pwdMsg.includes('Updated')||pwdMsg.includes('updated')?'text-green-400':'text-red-400'}`}>{pwdMsg}</p>}</div>
      } />}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#11162E] w-full max-w-md rounded-2xl p-6 space-y-4 border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-display font-bold text-slate-100 text-lg text-center">{title}</h3>
        {children}
        <button onClick={onClose} className="w-full py-2 text-slate-500 hover:text-slate-300 text-xs transition-colors">取消</button>
      </div>
    </div>
  )
}
