import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Heart, Briefcase, DollarSign, Smile, Sparkles, Compass, Star, Eye, Calendar, BookOpen, AlertCircle } from "lucide-react";
import { UserProfile, DailyInsightData, EnergyScores } from "../types";
import { TRANSLATIONS, LanguageKey } from "../lib/translations";

interface HomeViewProps {
  profile: UserProfile;
  onNavigate: (tab: string, arg?: any) => void;
  isPremium: boolean;
  onTogglePremium: () => void;
  lang: LanguageKey;
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

export default function HomeView({ profile, onNavigate, isPremium, onTogglePremium, lang, largeTextMode = false }: HomeViewProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Font sizing helper for Senior mode
  const sizeClass = (normal: string, large: string) => largeTextMode ? large : normal;

  const [insight, setInsight] = useState<DailyInsightData>({
    energy: { love: 82, career: 68, finance: 74, mood: 79 },
    dailyMessage: t.aiDirective
  });
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<{ title: string; content: string; type: string } | null>(null);

  // Buddhist Altar & Merit state persistence
  const [merits, setMerits] = useState<number>(() => {
    const cached = localStorage.getItem("soul_merit_score");
    return cached ? parseInt(cached, 10) : 108; // High auspicious Buddhist count
  });

  const [lamps, setLamps] = useState<LotusLamp[]>(() => {
    const cached = localStorage.getItem("soul_active_lamps");
    return cached ? JSON.parse(cached) : [
      { id: "lamp-1", intent: t.peace, buyer: profile.name || "Seer", timestamp: "09:41" }
    ];
  });

  const [selectedMantra, setSelectedMantra] = useState<string>("none");
  const [blessingIntent, setBlessingIntent] = useState<string>("peace");
  const [floatingMerits, setFloatingMerits] = useState<FloatingMerit[]>([]);
  const [blessingTargetName, setBlessingTargetName] = useState<string>("");

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

  useEffect(() => {
    // Generate personalized insight based on name/birthday on mount or update
    async function fetchDailyMessage() {
      setLoading(true);
      try {
        const response = await fetch("/api/daily-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: profile.name,
            birthDate: profile.birthDate,
            birthTime: profile.birthTime,
            birthPlace: profile.birthPlace,
            lang: lang,
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.energy && data.dailyMessage) {
            setInsight(data);
          }
        }
      } catch (err) {
        console.warn("Fallback to offline details due to connecting error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDailyMessage();
  }, [profile.birthDate, profile.name, lang]);

  const openQuickReading = (type: string) => {
    if (type === "bazi") {
      let content = `
### Your BaZi (Eight Characters) Reading
Based on Earthly Branches and Heavenly Stems configured around your energy timeline.

* **Day Master**: **Yin Wood (Yi 木)**
  * *Nature*: You are like a climbing vine—resilient, adaptable, and intuitive.
* **Current Luck Pillar**: Star of Wealth & Direct Resource.
* **Metaphysical Synergy**: 2026 is the year of the Bing Wu (Fire Horse). This fuels your day master with intense action, creativity, and public visibility.
* **Balancing Element Needed**: Water (to cool down the Fire influence) & Earth (to anchor your achievements). 

*Tips for today:* Avoid impetuous career commitments before noon. Practice meditative breathing or water therapy to steady your inner fire.
      `;
      if (!profile.birthDate) {
        content = "### Incomplete Celestial Data\n\nPlease head over to the **Profile** tab to fill in your Birth Date and Birth Time first to calculate your precise BaZi configuration!";
      }
      setActiveModal({ title: "Personal Zen BaZi Blueprint", content, type: "bazi" });
    } else if (type === "numerology") {
      // Calculate Life Path number based on birthdate or generic if empty
      let numStr = "7";
      let calculationSteps = "June 4, 1999 => (0+6) + (0+4) + (1+9+9+9) = 6 + 4 + 28 = 38 => 3+8 = 11 => 1+1 = 2 (Life Path 2 - The Harmonizer)";
      if (profile.birthDate) {
        const cleaned = profile.birthDate.replace(/-/g, "");
        let sum = 0;
        for (let i = 0; i < cleaned.length; i++) {
          sum += parseInt(cleaned[i], 10);
        }
        while (sum > 9 && sum !== 11 && sum !== 22) {
          sum = sum.toString().split("").reduce((acc, curr) => acc + parseInt(curr, 10), 0);
        }
        numStr = sum.toString();
        calculationSteps = `${profile.birthDate.replace(/-/g, " + ")} parsed down dynamically => Life Path ${numStr}`;
      } else {
        calculationSteps = "Calculate your permanent Life Path code once you submit your Birth Date.";
      }

      const numerologyMeanings: { [key: string]: string } = {
        "1": "The Pioneer: Driven by independent initiative, original thought, leadership, and bold creation. Today encourages self-reliance.",
        "2": "The Harmonizer: Guided by cooperation, balance, acute empathy, mediation, and relationship healing. Connect with others today.",
        "3": "The Creative Expresser: Governed by joy, creative play, verbal spark, and social optimism. Speak your truth.",
        "4": "The Architect: Grounded in stability, structures, practical efforts, discipline, and order. Build solid plans.",
        "5": "The Visionary Wanderer: Swept by freedom, dynamic changes, courage, adventure, and adaptability. Seek new horizons.",
        "6": "The Nurturing Guardian: Rooted in beauty, service, home harmony, family care, and unconditional counseling.",
        "7": "The Mystic Seeker: Anchored in introspective knowledge, secrets, spiritual analysis, and intuitive research. Retreat inward today.",
        "8": "The Abundant Executive: Driven by professional manifestation, material power, financial mastery, and cosmic balance.",
        "9": "The Compassionate Sage: Guided by global integration, humanitarian service, wisdom, and completions. Release what's past.",
        "11": "Master Messenger: High-vibrational spiritual receiver. Trust the immediate lightning flashes of your intuition today.",
        "22": "Master Builder: Capable of materializing grand dreams into physical realities. Think macro and act carefully."
      };

      const description = numerologyMeanings[numStr] || "The Sacred Seeker: Finding quiet synchronicities and spiritual blueprints in daily numerical sequences.";

      let content = `
### Daily Numerology & Life Path Codes
Your active vibration is governed by number alignment.

* **Your Life Path Vibration**: **Number ${numStr}**
* **Vibe Frequency**: *${calculationSteps}*
* **Core Spiritual Directive**: ${description}

*Your Personal Sequence for Today*: **${numStr}:${numStr}:${numStr} Spiritual Awakening**. Pay attention to double numbers on digital clocks or receipts today. It signifies an angelic sync pattern whispering that you are exactly on your chosen path.
      `;
      setActiveModal({ title: `Angelic Numerology Report (Path ${numStr})`, content, type: "numerology" });
    } else if (type === "astrology") {
      onNavigate("profile");
    } else if (type === "tarot") {
      onNavigate("discover");
    }
  };

  const getEnergyColor = (score: number) => {
    if (score > 80) return "text-glow stroke-glow";
    if (score > 65) return "text-star stroke-star";
    return "text-gray-400 stroke-gray-400";
  };

  const recommendedCards = [
    {
      title: "Chakra Cord Cutting Exercise",
      topic: "Relationship Harmony",
      tag: "Healing",
      duration: "5 min somatic practice",
      accent: "text-rose-300 border-rose-500/20 bg-rose-500/5",
      content: `
### Sacred Cord Cutting Ritual

When relationships experience friction, energetic ties can cling to our solar plexus and heart chakras, draining vital cosmic reserves. This guided exercise helps you disconnect cleanly from outdated dynamics while preserving unconditional love.

#### The Process:
1. **Find Centering**: Sit with a straight, tall spine. Rest both hands over your heart space. Bring your breathing down to raw abdominal pace.
2. **Mental Projection**: Visualize the individual standing gently in front of you. Observe them encased in a warm, compassionate blue orb.
3. **Visually Locate the Chords**: Trace the energetic tubes running between your energy centers (generally the navel or chest) and theirs.
4. **Metaphysical severing**: Take a deep, deep inhale. As you exhale forcefully, make a scissors motion with your hands across your chest. Imagine a brilliant silver scissors slicing the cords cleanly. 
5. **Celestial Seal**: Visualize the severed ends immediately wrapping back into your belly, healing as two sparks of light. Whisper to yourself:
   > "I return what is yours back to your custody. I retrieve what is mine back to my sovereignty. We are both free, balanced, and complete."
      `
    },
    {
      title: "Career Dharma & Pluto Transits",
      topic: "Career & Dharma",
      tag: "Astrology",
      duration: "4 min reading",
      accent: "text-amber-300 border-amber-500/20 bg-amber-500/5",
      content: `
### Aligning Your Dharma in Pluto's New Epoch

Pluto's recent structural movement into Aquarius triggers a massive, once-in-a-generation energetic reset globally. If you have been feeling sudden career stagnation or intense urges to align your profession with your core ethics, you are feeling this celestial transition directly.

#### Golden rules to master this phase:
* **Cease Mimicry**: The old structural era of copy-pasting existing success constructs is dying. Pluto in Aquarius demands authentic, highly individualized creative contributions.
* **Integrate Ethical Technology**: Bring intuitive philosophy and altruistic principles into your spreadsheets and product structures.
* **Embrace the Pivot Point**: If a professional door is closing, do not bruise your knuckles pounding on it. Let it go. The universe is clearing physical space for your true planetary dharma to occupy.
      `
    },
    {
      title: "Instant Soothing Light Wave",
      topic: "Internal Healing",
      tag: "Exercise",
      duration: "3 min visual session",
      accent: "text-teal-300 border-teal-500/20 bg-teal-500/5",
      content: `
### Instant Soothing Light Wave Practice

A rapid somatic anxiety shield to quieten a racing nervous system and restore deep, supportive presence within 180 seconds.

#### Cellular Instructions:
1. **The Core Posture**: Stand flat on the ground. Unclench your jaw and let your shoulders drop low.
2. **Somatic Shield Intake**: Close your eyes. Inhale for a count of 4. Breathe in the imagery of soft, warm lavender mist swirling through your lungs.
3. **Internal Release Sweep**: Hold that breath for 4 counts. As you do, imagine the lavender light gathering all somatic stress, tightness, and mental static.
4. **Deep Exhale Release**: Exhale slowly for 6 counts through your mouth. Imagine stressful darkness blowing away like ash.
5. **Grounding Affirmation**: Place your feet firmly into the earth. Whisper:
   > "I am right here. My body is a safe, stable refuge. This feeling is a cloud passing through me, not who I am."
      `
    }
  ];

  return (
    <div className={sizeClass("space-y-8", "space-y-10")} id="home-view-container">
      {/* Header of home page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4">
        <div>
          <span className={sizeClass("font-mono text-xs text-star tracking-widest uppercase", "font-mono text-sm font-bold text-star tracking-widest uppercase")}>☸️ {t.tabSanctuary}</span>
          <h1 className={sizeClass("font-display text-2xl font-bold text-slate-100 tracking-tight mt-1 flex items-center gap-2", "font-display text-3xl font-black text-slate-100 tracking-tight mt-1.5 flex items-center gap-2")}>
            {t.welcome}, {profile.name || "Seeker"} <Sparkles className="h-6 w-6 text-glow animate-pulse-glow" />
          </h1>
          <p className={sizeClass("text-slate-400 text-xs mt-1", "text-slate-300 text-sm font-semibold mt-1.5")}>
            {profile.birthDate 
              ? `${t.birthDateLabel}: ${profile.birthDate}` 
              : t.profileTitleDesc}
          </p>
        </div>

        {/* Premium Badge status */}
        <div 
          onClick={onTogglePremium}
          className={`cursor-pointer mt-4 md:mt-0 flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
            largeTextMode 
              ? "border-[#FFD166]/40 text-[#FFD166] bg-[#FFD166]/10 text-xs py-2 px-4 shadow-md font-bold" 
              : "border-white/10 text-slate-400 text-[10px] bg-white/5 font-mono hover:border-star/30 hover:text-slate-200"
          }`}
          id="premium-toggle-badge"
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPremium ? "bg-glow" : "bg-purple-400"}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPremium ? "bg-glow" : "bg-purple-500"}`}></span>
          </span>
          {isPremium ? t.premiumActive : t.goPremium}
        </div>
      </div>

      {/* Grid: Daily energy plus custom message card */}
      <div className={sizeClass("grid grid-cols-1 gap-5", "grid grid-cols-1 gap-7")}>
        {/* Module 1: Daily insight energies */}
        <div className="bg-[#11162E] border border-white/5 rounded-2xl p-5 relative overflow-hidden" id="daily-energy-metrics">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10" />
          <h2 className={sizeClass("font-display text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 tracking-wide uppercase", "font-display text-base font-black text-slate-100 mb-4 flex items-center gap-2 tracking-wide uppercase")}>
            <Star className="h-5 w-5 text-glow" /> {t.celestialCurrents}
          </h2>

          <div className={sizeClass("grid grid-cols-2 md:grid-cols-4 gap-3 mt-4", "grid grid-cols-2 gap-4 mt-5")}>
            {/* Love */}
            <div className={sizeClass("bg-white/5 rounded-xl p-3 border border-white/[0.03] flex flex-col items-center justify-center text-center", "bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center text-center")}>
              <Heart className={sizeClass("h-4 w-4 text-rose-400 mb-2", "h-6 w-6 text-rose-400 mb-3")} />
              <div className={sizeClass("text-xl font-display font-bold text-slate-200", "text-2xl font-display font-black text-slate-100")}>{insight.energy.love}%</div>
              <div className={sizeClass("font-mono text-[9px] text-slate-400 mt-1 uppercase tracking-wider", "font-mono text-xs font-bold text-rose-300/80 mt-1 uppercase tracking-wider")}>{t.compassion}</div>
            </div>

            {/* Career */}
            <div className={sizeClass("bg-white/5 rounded-xl p-3 border border-white/[0.03] flex flex-col items-center justify-center text-center", "bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center text-center")}>
              <Briefcase className={sizeClass("h-4 w-4 text-indigo-400 mb-2", "h-6 w-6 text-indigo-400 mb-3")} />
              <div className={sizeClass("text-xl font-display font-bold text-slate-200", "text-2xl font-display font-black text-slate-100")}>{insight.energy.career}%</div>
              <div className={sizeClass("font-mono text-[9px] text-slate-400 mt-1 uppercase tracking-wider", "font-mono text-xs font-bold text-indigo-300/80 mt-1 uppercase tracking-wider")}>{t.dharma}</div>
            </div>

            {/* Finance */}
            <div className={sizeClass("bg-white/5 rounded-xl p-3 border border-white/[0.03] flex flex-col items-center justify-center text-center", "bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center text-center")}>
              <DollarSign className={sizeClass("h-4 w-4 text-amber-400 mb-2", "h-6 w-6 text-amber-400 mb-3")} />
              <div className={sizeClass("text-xl font-display font-bold text-slate-200", "text-2xl font-display font-black text-slate-100")}>{insight.energy.finance}%</div>
              <div className={sizeClass("font-mono text-[9px] text-slate-400 mt-1 uppercase tracking-wider", "font-mono text-xs font-bold text-amber-300/80 mt-1 uppercase tracking-wider")}>{t.abundance}</div>
            </div>

            {/* Mood */}
            <div className={sizeClass("bg-white/5 rounded-xl p-3 border border-white/[0.03] flex flex-col items-center justify-center text-center", "bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center text-center")}>
              <Smile className={sizeClass("h-4 w-4 text-teal-400 mb-2", "h-6 w-6 text-teal-400 mb-3")} />
              <div className={sizeClass("text-xl font-display font-bold text-slate-200", "text-2xl font-display font-black text-slate-100")}>{insight.energy.mood}%</div>
              <div className={sizeClass("font-mono text-[9px] text-slate-400 mt-1 uppercase tracking-wider", "font-mono text-xs font-bold text-teal-300/80 mt-1 uppercase tracking-wider")}>{t.vibrations}</div>
            </div>
          </div>

          <div className={sizeClass("mt-4 text-[11px] text-slate-400 border-t border-white/5 pt-3 flex justify-between items-center bg-white/0 rounded-lg", "mt-6 text-sm text-slate-300 border-t border-white/10 pt-4 flex justify-between items-center")}>
            <span>{t.stabilityHarmonized}</span>
            <span className="font-mono text-amber-400 flex items-center gap-1">🪷 {t.lunarTracker}</span>
          </div>
        </div>

        {/* Module 2: AI direct message box */}
        <div className="bg-gradient-to-br from-[#1C2344] to-[#141B34] border border-violet-500/20 rounded-2xl p-5 flex flex-col justify-between relative shadow-lg overflow-hidden" id="ai-daily-message-box">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-glow/10 rounded-full blur-2xl" />
          <div>
            <div className="flex items-center justify-between">
              <span className="bg-gradient-to-r from-glow to-amber-300 text-[#090D1C] text-[10px] px-2.5 py-1 rounded uppercase font-bold tracking-wider">
                {t.aiDirective}
              </span>
              {loading && <span className="text-[10px] text-slate-300 animate-pulse font-mono">Syncing...</span>}
            </div>

            <p className={sizeClass("text-slate-100 text-xs mt-3 italic font-sans leading-relaxed text-slate-200", "text-slate-100 text-base mt-4 italic font-sans leading-relaxed font-medium")}>
              &ldquo;{insight.dailyMessage}&rdquo;
            </p>
          </div>

          <button
            onClick={() => onNavigate("chat")}
            className={sizeClass(
              "mt-4 flex items-center justify-center gap-2 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-slate-100 text-[11px] font-mono font-semibold py-2 px-3 rounded-lg transition duration-200 shadow-md group border border-white/10 cursor-pointer",
              "mt-5 flex items-center justify-center gap-2 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-slate-100 text-sm py-3.5 px-4 rounded-xl transition duration-200 shadow-md group border border-white/15 cursor-pointer font-bold"
            )}
            id="home-advice-chat-btn"
          >
            {t.askAdvisor} <Sparkles className="h-4 w-4 text-glow group-hover:scale-125 transition-transform" />
          </button>
        </div>
      </div>

      {/* BUDDHIST SACRED ALTAR & MERIT SPHERE SECTION */}
      <div className="bg-[#120F24] border border-[#FFD166]/20 rounded-2xl p-5 relative overflow-hidden shadow-inner" id="buddhist-temple-altar">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl -z-10" />
        
        <div className="border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-slate-100 text-sm flex items-center gap-2 uppercase tracking-wide">
              {t.altarTitle}
            </h3>
            <span className="bg-[#FFD166]/10 text-[#FFD166] font-mono text-[9px] font-bold px-2 py-0.5 rounded border border-[#FFD166]/20">
              🕉️ {t.accumulatedMerit}: <strong className="text-glow animate-pulse text-xs ml-1">{merits}</strong>
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-1 pr-6 font-sans">
            {t.altarDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Wooden Fish tapping tool */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col items-center text-center justify-between relative min-h-[170px]" id="wooden-fish-panel">
            <span className="text-[10px] font-mono font-semibold text-[#A78BFA] tracking-wider uppercase mb-1 flex items-center gap-1">
              🥁 {t.tapWoodenFish}
            </span>
            
            {/* Visual Wooden Fish render with tap trigger */}
            <div className="relative my-2">
              {/* Floating texts */}
              {floatingMerits.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 1, y: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: -45, scale: 1.2 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute left-1/2 -translate-x-1/2 top-[-20px] font-display text-xs font-black text-glow tracking-wide select-none drop-shadow-md whitespace-nowrap bg-indigo-950/40 px-1.5 py-0.5 rounded"
                >
                  🙏 {item.text}
                </motion.div>
              ))}

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  setMerits((prev) => prev + 1);
                  const mid = Date.now();
                  setFloatingMerits((prev) => [...prev, { id: mid, text: t.meritAdded }]);
                  
                  // Simple alert bell resonance feedback
                  try {
                    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = "sine";
                    // Buddhist bell harmonic gong frequency of ~380Hz
                    osc.frequency.setValueAtTime(380, audioCtx.currentTime);
                    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 1.2);
                  } catch (e) {
                    // Browser policy silent block fallback
                  }
                }}
                className="cursor-pointer h-20 w-20 rounded-full bg-gradient-to-br from-[#4C241B] to-[#1C0B08] border-2 border-[#FFD166]/40 shadow-[0_0_15px_rgba(255,209,102,0.15)] flex items-center justify-center text-4xl select-none hover:border-[#FFD166]/100 active:scale-95 transition-all outline-none"
                id="wooden-fish-tap-avatar"
              >
                🥏
              </motion.button>
            </div>

            <p className="text-slate-400 text-[10px] italic leading-tight px-2">
              {t.tapWoodenFishDesc}
            </p>
          </div>

          {/* Lit Lotus Lamp tool */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col justify-between" id="lotus-lamp-panel">
            <span className={sizeClass("text-[10px] font-mono font-semibold text-[#A78BFA] tracking-wider uppercase mb-2 flex items-center gap-1", "text-xs font-mono font-bold text-[#A78BFA] tracking-wider uppercase mb-2 flex items-center gap-1")}>
              🪷 {t.litLotusLamp}
            </span>
            
            <div className="space-y-2 text-left w-full">
              <span className={sizeClass("block text-[9px] font-mono text-slate-400 tracking-wider uppercase mb-1.5", "block text-xs font-mono text-slate-300 tracking-wider uppercase mb-2")}>
                {lang === "zh" ? "请选择一键点灯祈福方式：" : "Select Instant Heartfelt Blessing:"}
              </span>
              
              <div className="grid grid-cols-1 gap-2">
                {[
                  { key: "family", label: lang === "zh" ? "👪 阖家康泰安祥" : "👪 Family Wellness", intent: lang === "zh" ? "阖家平安" : "Family Peace", color: "from-indigo-600 to-blue-800" },
                  { key: "longevity", label: lang === "zh" ? "⚕️ 延寿安康吉祥" : "⚕️ Longevity & Peace", intent: lang === "zh" ? "健康延寿" : "Longevity & Health", color: "from-emerald-600 to-teal-800" },
                  { key: "wealth", label: lang === "zh" ? "💰 广结善庆福泽" : "💰 Abundant Blessing", intent: lang === "zh" ? "广积福泽" : "Wealth & Dharma", color: "from-amber-600 to-yellow-800" }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      const targetName = profile.name || (lang === "zh" ? "有缘信士" : "Faithful Seeker");
                      const newLamp = {
                        id: `lamp-${Date.now()}`,
                        intent: item.intent,
                        buyer: targetName,
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      };
                      setLamps([newLamp, ...lamps]);
                      setMerits((prev) => prev + 9); // Light a lamp generates +9 merits!
                      
                      // Play soothing sacred temple gong
                      try {
                        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const osc = audioCtx.createOscillator();
                        const osc2 = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        osc.type = "sine";
                        osc2.type = "sine";
                        osc.frequency.setValueAtTime(520, audioCtx.currentTime); // High sacred bell
                        osc2.frequency.setValueAtTime(780, audioCtx.currentTime);
                        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.0);
                        osc.connect(gain);
                        osc2.connect(gain);
                        gain.connect(audioCtx.destination);
                        osc.start();
                        osc2.start();
                        osc.stop(audioCtx.currentTime + 2.0);
                        osc2.stop(audioCtx.currentTime + 2.0);
                      } catch (e) {
                        // ignore
                      }
                    }}
                    className={`cursor-pointer w-full py-3 rounded-xl bg-gradient-to-r ${item.color} text-[#FFD166] text-xs font-bold tracking-wide shadow-md active:scale-95 hover:brightness-110 duration-200 border border-white/10`}
                  >
                    🕯️ {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chanting loop & Virtual Chanting tape player */}
        <div className="mt-4 bg-[#090616] p-4 rounded-xl border border-white/5 text-left text-xs" id="chanting-player-panel">
          <span className="font-mono text-[10px] font-semibold text-[#A78BFA] tracking-wider uppercase mb-2 block flex items-center gap-1">
            ☸️ {t.templeChant}
          </span>
          <select 
            value={selectedMantra}
            onChange={(e) => setSelectedMantra(e.target.value)}
            className="w-full bg-[#11162E] border border-white/10 rounded px-2.5 py-1.5 text-slate-300 font-mono text-[11px] focus:outline-none"
          >
            <option value="none">🔇 {t.sutraNone}</option>
            <option value="om">🪷 {t.sutraOm}</option>
            <option value="amitabha">☸️ {t.sutraAmitabha}</option>
            <option value="compassion">📜 {t.sutraCompassion}</option>
          </select>

          {/* Animated Scroll of Lyrics if playing */}
          {selectedMantra !== "none" && (
            <div className="mt-3 bg-red-950/20 border border-red-500/10 p-2.5 rounded h-16 overflow-hidden relative">
              <motion.div
                animate={{ y: [-15, -120] }}
                transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
                className="text-center font-mono text-[10px] text-[#FFD166] leading-relaxed select-all"
              >
                {selectedMantra === "om" && (
                  <>
                    <p className="my-1.5">🪷 Oṃ Maṇi Padme Hūṃ 🪷</p>
                    <p className="my-1.5">ॐ मणिपद्मे हूँ</p>
                    <p className="my-1.5">唵 嘛 呢 叭 咪 吽</p>
                    <p className="my-1.5">อูม มณิ ปัทเม ฮูม</p>
                    <p className="my-1.5">Úm ma ni bát ni hồng</p>
                    <p className="my-1.5">🪷 Peace & Compassion Reflected 🪷</p>
                  </>
                )}
                {selectedMantra === "amitabha" && (
                  <>
                    <p className="my-1.5">☸️ Namo Amituofo ☸️</p>
                    <p className="my-1.5">南无阿弥陀佛</p>
                    <p className="my-1.5">Nam Mô A Di Đà Phật</p>
                    <p className="my-1.5">นโม อมิเตาพุทธ</p>
                    <p className="my-1.5">Amitabha Infinite Light Blessing</p>
                    <p className="my-1.5">☸️ Merit Accumulated in Ten Directions ☸️</p>
                  </>
                )}
                {selectedMantra === "compassion" && (
                  <>
                    <p className="my-1.5">📜 Great Compassion Dharani 📜</p>
                    <p className="my-1.5">Namo ratna-trayāya</p>
                    <p className="my-1.5">千手千眼无碍大悲心陀罗尼</p>
                    <p className="my-1.5">Nama āryāvalokiteśvarāya</p>
                    <p className="my-1.5">菩提萨埵婆耶 摩诃萨埵婆耶</p>
                    <p className="my-1.5">📜 Dissolving All Obstacles & Fears 📜</p>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </div>

        {/* Active list of lit candles */}
        {lamps.length > 0 && (
          <div className="mt-4 border-t border-white/5 pt-3" id="active-lotus-lamps-list">
            <span className="font-mono text-[9px] text-[#A78BFA] tracking-wider uppercase mb-2 block font-semibold">
              🏮 {t.activeLamps}:
            </span>
            <div className="grid grid-cols-2 gap-2 max-h-[85px] overflow-y-auto pr-1">
              {lamps.map((lamp) => (
                <div key={lamp.id} className="bg-amber-950/20 border border-[#FFD166]/10 px-2.5 py-1 rounded text-[10px] flex items-center justify-between">
                  <div className="flex items-center gap-1 font-mono text-[9px] text-slate-300">
                    <span className="text-glow animate-pulse">🕯️</span>
                    <span className="truncate">{lamp.buyer}: <strong className="text-glow text-[8px] uppercase">{lamp.intent.split(" ")[0]}</strong></span>
                  </div>
                  <span className="font-mono text-[8px] text-white/30">{lamp.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Module 3: Quick Cosmic Readings */}
      <div id="quick-readings-panel">
        <h2 className="font-display text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <Compass className="h-4 w-4 text-cosmos" /> {t.quickReadings}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Quick Tarot */}
          <div 
            onClick={() => openQuickReading("tarot")}
            className="group cursor-pointer bg-[#11162E] border border-white/5 rounded-2xl p-4 hover:border-cosmos/50 hover:bg-cosmos/5 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 text-slate-800/10 font-bold text-7xl select-none -translate-x-1 translate-y-2 font-display">T</div>
            <div className="text-2xl mb-2">🃏</div>
            <h3 className="font-display font-semibold text-slate-200 text-xs tracking-tight group-hover:text-cosmos transition-colors">{t.tarotSpread}</h3>
            <p className="text-slate-400 text-[10px] mt-1 font-sans leading-tight">{t.tarotSpreadDesc}</p>
          </div>

          {/* Quick Astrology */}
          <div 
            onClick={() => openQuickReading("astrology")}
            className="group cursor-pointer bg-[#11162E] border border-white/5 rounded-2xl p-4 hover:border-star/50 hover:bg-star/5 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 text-slate-800/10 font-bold text-7xl select-none -translate-x-1 translate-y-2 font-display">A</div>
            <div className="text-2xl mb-2">🪐</div>
            <h3 className="font-display font-semibold text-slate-200 text-xs tracking-tight group-hover:text-star transition-colors">{t.astrologyChart}</h3>
            <p className="text-slate-400 text-[10px] mt-1 font-sans leading-tight">{t.astrologyChartDesc}</p>
          </div>

          {/* Quick Bazi */}
          <div 
            onClick={() => openQuickReading("bazi")}
            className="group cursor-pointer bg-[#11162E] border border-white/5 rounded-2xl p-4 hover:border-glow/50 hover:bg-glow/5 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 text-slate-800/10 font-bold text-7xl select-none -translate-x-1 translate-y-2 font-display">B</div>
            <div className="text-2xl mb-2">🐉</div>
            <h3 className="font-display font-semibold text-slate-200 text-xs tracking-tight group-hover:text-glow transition-colors">{t.baziChart}</h3>
            <p className="text-slate-400 text-[10px] mt-1 font-sans leading-tight">{t.baziChartDesc}</p>
          </div>

          {/* Quick Numerology */}
          <div 
            onClick={() => openQuickReading("numerology")}
            className="group cursor-pointer bg-[#11162E] border border-white/5 rounded-2xl p-4 hover:border-teal-500/50 hover:bg-teal-500/5 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 text-slate-800/10 font-bold text-7xl select-none -translate-x-1 translate-y-2 font-display">N</div>
            <div className="text-2xl mb-2">🔢</div>
            <h3 className="font-display font-semibold text-slate-200 text-xs tracking-tight group-hover:text-teal-400 transition-colors">{t.numerology}</h3>
            <p className="text-slate-400 text-[10px] mt-1 font-sans leading-tight">{t.numerologyDesc}</p>
          </div>
        </div>
      </div>

      {/* Module 4: Today's Guidance Content Stream */}
      <div id="guidance-content-stream">
        <h2 className="font-display text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <BookOpen className="h-4 w-4 text-glow" /> {t.pathwaysTitle}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {recommendedCards.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => setActiveModal({ title: item.title, content: item.content, type: item.tag })}
              className="cursor-pointer bg-[#11162E] border border-white/5 hover:border-[#7C5CFF]/30 hover:bg-[#1C2344]/40 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] uppercase text-star tracking-wider">
                    {item.topic}
                  </span>
                  <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded-full ${item.accent}`}>
                    {item.tag}
                  </span>
                </div>
                <h3 className="font-display text-sm font-bold text-slate-200 mt-3 group-hover:text-glow transition-colors">
                  {item.title}
                </h3>
              </div>

              <div className="mt-4 border-t border-white/5 pt-3 flex justify-between items-center">
                <span className="font-mono text-[9px] text-[#A78BFA]">{item.duration}</span>
                <span className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-[11px] font-medium">
                  {t.readBtn} <Eye className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Overlay Reading Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#11162E] border border-[#7C5CFF]/30 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col shadow-[0_0_30px_rgba(124,92,255,0.15)]"
          >
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#0F132E]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-glow" />
                <h3 className="font-display text-sm font-bold text-slate-200">{activeModal.title}</h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="cursor-pointer text-slate-400 hover:text-white font-mono text-[10px] border border-white/15 px-2 py-1 rounded hover:bg-white/5"
              >
                {t.closeBtn}
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-slate-300">
              {/* Parse Custom Low-Beds Simple Markdown */}
              <div className="markdown-body space-y-4 text-xs leading-relaxed">
                {activeModal.content.split("\n").map((line, lIdx) => {
                  if (line.startsWith("###")) {
                    return <h3 key={lIdx} className="font-display text-sm text-glow font-bold mt-4 mb-2">{line.replace("###", "").trim()}</h3>;
                  }
                  if (line.startsWith("* **")) {
                    const colonIndex = line.indexOf(":");
                    if (colonIndex !== -1) {
                      const boldBit = line.substring(2, colonIndex);
                      const rest = line.substring(colonIndex + 1);
                      return <p key={lIdx} className="pl-4 border-l border-cosmos/20"><strong className="text-star">{boldBit.replace(/\*\*/g, "")}:</strong>{rest}</p>;
                    }
                  }
                  if (line.startsWith("* ")) {
                    return <li key={lIdx} className="list-disc ml-4 mt-1">{line.replace("* ", "")}</li>;
                  }
                  if (line.startsWith("> ")) {
                    return <blockquote key={lIdx} className="border-l-2 border-cosmos bg-white/5 p-2 rounded italic my-2 text-slate-400">{line.replace("> ", "")}</blockquote>;
                  }
                  return <p key={lIdx}>{line}</p>;
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
