import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Calendar, Clock, MapPin, User, ChevronRight, Lock, Mail, Compass, HelpCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserProfile } from "../types";

interface OnboardingViewProps {
  onComplete: (profile: UserProfile) => void;
}

export default function OnboardingView({ onComplete }: OnboardingViewProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [userName, setUserName] = useState("Mia");
  const [birthDate, setBirthDate] = useState("1999-06-04");
  const [birthTime, setBirthTime] = useState("08:15");
  const [birthPlace, setBirthPlace] = useState("Bangkok, Thailand");

  // Interests Selection
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "Astrology", "Tarot Reading", "Bazi & Zi Wei"
  ]);

  // Auth State
  const [authMethod, setAuthMethod] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Destiny Animation Lines
  const [animationLineIndex, setAnimationLineIndex] = useState(0);
  const destinationLines = [
    "Aligning planetary coordinates...",
    "Configuring Eastern Heavenly Stems & Earthly Branches...",
    "Constructing Twelve Palaces of Zi Wei Dou Shu...",
    "Syncing universal wave frequencies and Numerology chords...",
    "Shuffling sanctuary Tarot decks...",
    "Translating cause-and-effect karma blueprint..."
  ];

  useEffect(() => {
    if (step === 5) {
      const interval = setInterval(() => {
        setAnimationLineIndex((prev) => {
          if (prev >= destinationLines.length - 1) {
            clearInterval(interval);
            // Complete onboarding
            setTimeout(() => {
              onComplete({
                name: userName,
                birthDate,
                birthTime,
                birthPlace
              });
            }, 1000);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const interestsList = [
    { id: "astrology", label: "🪐 Western Astrology", desc: "Planet transits & alignments" },
    { id: "tarot", label: "🔮 Tarot Reading", desc: "Sacred timelines & path answers" },
    { id: "bazi", label: "🐉 BaZi (8 Characters)", desc: "Heavenly stems & Zen elements" },
    { id: "ziwei", label: "☸️ Zi Wei Dou Shu", desc: "Your 12 cosmic palaces mapped" },
    { id: "iching", label: "☯️ I Ching & Liu Yao", desc: "6-line hexagram divination" },
    { id: "healing", label: "🌿 Emotional Healing", desc: "Somatic exercises & calm stories" },
    { id: "counsel", label: "💬 AI Spiritual Guidance", desc: "Personalized metaphysical council" },
    { id: "marketplace", label: "🛍️ Guru Marketplace", desc: "Book actual masters and reviews" }
  ];

  return (
    <div className="w-full min-h-[700px] flex flex-col justify-between py-6 px-4" id="onboarding-flow-container">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: Welcome Splash */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 flex-grow flex flex-col justify-around text-center"
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C5CFF] to-[#FFD166] flex items-center justify-center font-display font-black text-[#090D1C] text-2xl shadow-[0_0_25px_rgba(124,92,255,0.4)]">
                ☸️
              </div>
              <h1 className="font-display text-3xl font-extrabold text-slate-100 tracking-tight">
                Welcome to <span className="text-glow font-display">SoulAI</span>
              </h1>
              <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                Unlock your personalized celestial codes, combine ancient Eastern Wisdom with Western Oracle systems, and synchronize your true spiritual blueprint.
              </p>
            </div>

            <div className="bg-[#11162E] border border-white/5 rounded-2xl p-4 text-left max-w-sm mx-auto space-y-3">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#FFD166] block">🌿 Platform Features</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300">
                <div className="flex items-center gap-1.5">✦ BaZi Destiny Charts</div>
                <div className="flex items-center gap-1.5">✦ Interactive Tarot</div>
                <div className="flex items-center gap-1.5">✦ 6 AI Gurus Personas</div>
                <div className="flex items-center gap-1.5">✦ Box Breath & Journals</div>
                <div className="flex items-center gap-1.5">✦ Social Discussions</div>
                <div className="flex items-center gap-1.5">✦ Master Live Directory</div>
              </div>
            </div>

            <div className="pt-4 max-w-sm mx-auto w-full">
              <button
                onClick={() => setStep(2)}
                className="w-full bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-xs font-mono font-bold py-3.5 px-4 rounded-xl transition duration-200 flex items-center justify-center gap-2 group cursor-pointer shadow-lg"
              >
                Let Us Begin Alignment <ChevronRight className="h-4 w-4 text-glow group-hover:translate-x-1 transition-transform" />
              </button>
              <span className="text-[9px] text-slate-500 font-mono block mt-3">Targeting Southeast Asia & Global Masters Platform</span>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Interests Selection */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 flex-grow flex flex-col justify-between"
          >
            <div>
              <span className="font-mono text-[10px] text-star tracking-widest uppercase block">✦ Curation Nodes</span>
              <h2 className="font-display text-xl font-bold text-slate-100 mt-1">Select Your Mystic Pathways</h2>
              <p className="text-slate-400 text-xs mt-1">
                Customize your daily dashboard feed and unlock the accurate divination calculators matching your current spiritual focus.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 my-4 overflow-y-auto max-h-[380px] p-px">
              {interestsList.map((item) => {
                const active = selectedInterests.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleInterest(item.id)}
                    className={`cursor-pointer p-3 rounded-xl border transition-all flex justify-between items-center ${
                      active
                        ? "bg-[#7C5CFF]/15 border-[#7C5CFF] shadow-[0_0_12px_rgba(124,92,255,0.1)] text-white"
                        : "bg-[#11162E] border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <h4 className="font-display font-semibold text-xs tracking-wide">{item.label}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      active ? "border-[#FFD166] bg-[#FFD166]/10" : "border-white/10"
                    }`}>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-[#FFD166]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 w-full flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono font-medium py-3 rounded-xl"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-grow bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-xs font-mono font-bold py-3 rounded-xl flex items-center justify-center gap-1.5"
              >
                Continue <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Birth information details */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5 flex-grow flex flex-col justify-between"
          >
            <div>
              <span className="font-mono text-[10px] text-star tracking-widest uppercase block">✦ Natal Configuration</span>
              <h2 className="font-display text-xl font-bold text-slate-100 mt-1">Calibrate Your Birth Coordinates</h2>
              <p className="text-slate-400 text-xs mt-1 leading-normal">
                Hour, day, month, and coordinates are vital data parameters required to calculate your true planetary angles, Sun Sign, and Eastern Day Master.
              </p>
            </div>

            <div className="space-y-4 my-4 bg-[#11162E] border border-white/5 p-4 rounded-2xl">
              {/* Name */}
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Seeker Name / Alias</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#7C5CFF]" />
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-[#090D1C] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-[#7C5CFF] transition-all"
                  />
                </div>
              </div>

              {/* Birth Date */}
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Birth Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#7C5CFF]" />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-[#090D1C] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-[#7C5CFF] transition-all"
                  />
                </div>
              </div>

              {/* Birth Time */}
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Birth Time (Optional but increases precision)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#7C5CFF]" />
                  <input
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="w-full bg-[#090D1C] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-[#7C5CFF] transition-all"
                  />
                </div>
              </div>

              {/* Birth Location */}
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Birth Town, City & Country</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#7C5CFF]" />
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    className="w-full bg-[#090D1C] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-[#7C5CFF] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 w-full flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono font-medium py-3 rounded-xl"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-grow bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-xs font-mono font-bold py-3 rounded-xl flex items-center justify-center gap-1.5"
              >
                Set Coordinates <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Authentication Screen */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 flex-grow flex flex-col justify-between"
          >
            <div>
              <span className="font-mono text-[10px] text-star tracking-widest uppercase block">✦ Guardian Access Gates</span>
              <h2 className="font-display text-xl font-bold text-slate-100 mt-1">
                {isForgotPassword ? "Password Recovery" : authMethod === "register" ? "Secure Soul Profile" : "Sign In to Your Chart"}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {isForgotPassword 
                  ? "Receive a recovery talisman link"
                  : authMethod === "register"
                    ? "Establish cloud-secure logs for your tarot history"
                    : "Calibrate your saved charts across devices"}
              </p>
            </div>

            <div className="space-y-4 p-4 rounded-xl bg-[#11162E] border border-white/5">
              {resetSent ? (
                <div className="text-center p-3 space-y-2">
                  <span className="text-2xl block">🌟</span>
                  <h4 className="font-display font-semibold text-[#FFD166] text-xs">Recovery Token Forwarded!</h4>
                  <p className="text-slate-400 text-[10px]">Check your spiritual inbox for a secure token link to re-issue credentials.</p>
                  <button 
                    onClick={() => { setResetSent(false); setIsForgotPassword(false); }}
                    className="text-glow font-mono text-[9px] uppercase border border-glow/20 px-2 py-1 rounded mt-2 hover:bg-glow/5"
                  >
                    Back to Normal Sign In
                  </button>
                </div>
              ) : isForgotPassword ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-mono uppercase text-slate-400 block mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        placeholder="mia@example.com"
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#090D1C] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setResetSent(true)}
                    className="w-full bg-[#7C5CFF] text-white font-mono text-xs py-2 rounded-lg font-semibold"
                  >
                    Send Telepathic Reset Link
                  </button>
                  <p onClick={() => setIsForgotPassword(false)} className="text-center text-[10px] text-[#A78BFA] cursor-pointer hover:underline mt-2">Back to registration</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Email */}
                  <div>
                    <label className="text-[9px] font-mono uppercase text-slate-400 block mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        placeholder="mia@example.com"
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#090D1C] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-[9px] font-mono uppercase text-slate-400 block">Secrets Hash / Password</label>
                      <span onClick={() => setIsForgotPassword(true)} className="text-[9px] font-mono text-slate-500 cursor-pointer hover:text-slate-300">Forgot?</span>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="password"
                        value={password}
                        placeholder="••••••••"
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#090D1C] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(5)}
                    className="w-full mt-2 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white font-sans text-xs py-2.5 rounded-lg font-bold shadow transition-colors cursor-pointer"
                  >
                    {authMethod === "register" ? "Generate Destiny and Register" : "Load Settings & Log In"}
                  </button>

                  <div className="text-center text-[10px] text-slate-400 mt-2 select-none">
                    {authMethod === "register" ? "Already initiated?" : "Need a secure blueprint profile?"}{" "}
                    <span 
                      onClick={() => setAuthMethod(authMethod === "register" ? "login" : "register")}
                      className="text-glow font-bold cursor-pointer hover:underline"
                    >
                      {authMethod === "register" ? "Sign In Instead" : "Register a New Blueprint"}
                    </span>
                  </div>
                </div>
              )}

              {/* Social Login Section */}
              {!isForgotPassword && !resetSent && (
                <div className="border-t border-white/5 pt-3 mt-1 space-y-2">
                  <span className="text-[9px] font-mono text-slate-500 block text-center uppercase tracking-wider">Fast Mystic Sign in</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setUserName("Mia Google"); setStep(5); }}
                      className="bg-white/[0.02] border border-white/10 hover:bg-white/5 rounded-lg py-1.5 px-2 text-[10px] text-slate-300 font-mono flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🌐</span> Google Sync
                    </button>
                    <button
                      onClick={() => { setUserName("Mia Apple"); setStep(5); }}
                      className="bg-white/[0.02] border border-white/10 hover:bg-white/5 rounded-lg py-1.5 px-2 text-[10px] text-slate-300 font-mono flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>🍎</span> Apple ID
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 w-full flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="w-full bg-[#11162E] hover:bg-white/5 border border-white/5 text-slate-400 text-xs font-mono font-medium py-3 rounded-xl"
              >
                Back to Natal Coordinates
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: Loading destiny calculations animation */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 flex-grow flex flex-col items-center justify-center text-center py-12"
          >
            <div className="relative w-24 h-24 my-4 flex items-center justify-center">
              {/* Outer glowing border spinning */}
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#7C5CFF]/30 animate-spin" style={{ animationDuration: "12s" }} />
              {/* Inner spin circle */}
              <Loader2 className="h-10 w-10 text-glow animate-spin" />
              <div className="absolute flex items-center justify-center font-display text-lg font-bold text-[#FFD166]">
                ★
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-[#FFD166] text-[10px] font-bold uppercase tracking-widest block">Initializing SoulAI Vault</span>
              <h3 className="font-display font-extrabold text-slate-100 text-base">Constructing Divine Nexus</h3>
              
              <div className="h-10 flex items-center justify-center max-w-sm px-4">
                <motion.p
                  key={animationLineIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-slate-400 text-xs italic font-sans"
                >
                  {destinationLines[animationLineIndex]}
                </motion.p>
              </div>
            </div>
            
            <div className="w-48 bg-white/5 h-1 rounded-full overflow-hidden shrink-0 mt-4">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: `${((animationLineIndex + 1) / destinationLines.length) * 100}%` }}
                transition={{ duration: 1 }}
                className="bg-glow h-full" 
              />
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
