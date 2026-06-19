import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Eye, Command, Plus, Shuffle, Send, ChevronRight, HelpCircle, Loader2, Coins, ArrowLeft } from "lucide-react";
import { TarotCard, UserProfile } from "../types";
import { TAROT_DECK } from "../lib/tarotData";
import { TRANSLATIONS, LanguageKey } from "../lib/translations";
import FlippableTarotCard from "./FlippableTarotCard";

interface DiscoverViewProps {
  profile: UserProfile;
  isPremium: boolean;
  onNavigate: (tab: string, arg?: any) => void;
  lang: LanguageKey;
  largeTextMode?: boolean;
}

export default function DiscoverView({ profile, isPremium, onNavigate, lang, largeTextMode = false }: DiscoverViewProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const sizeClass = (normal: string, large: string) => largeTextMode ? large : normal;
  const [activeCategory, setActiveCategory] = useState<"tarot" | "astrology" | "numerology" | "bazi" | "ziwei" | "iching" | "liuyao" | null>(null);
  
  // ==========================================
  // 1. TAROT SANDBOX STATE
  // ==========================================
  const [tarotSpreadMode, setTarotSpreadMode] = useState<"single" | "three" | "celtic">("three");
  const [tarotQuestion, setTarotQuestion] = useState("");
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
  const [readingResult, setReadingResult] = useState<string | null>(null);
  const [isReadingLoading, setIsReadingLoading] = useState(false);
  const [shuffledDeck, setShuffledDeck] = useState<TarotCard[]>(() => [...TAROT_DECK].sort(() => Math.random() - 0.5));

  const handleShuffle = () => {
    setShuffledDeck([...TAROT_DECK].sort(() => Math.random() - 0.5));
    setSelectedCards([]);
    setReadingResult(null);
  };

  const selectCard = (card: TarotCard) => {
    const limit = tarotSpreadMode === "single" ? 1 : tarotSpreadMode === "three" ? 3 : 10;
    if (selectedCards.length >= limit) return;
    if (selectedCards.some((c) => c.id === card.id)) return;

    const isReversed = Math.random() < 0.35;
    const cardWithPose = { ...card, isReversed };
    setSelectedCards([...selectedCards, cardWithPose]);
  };

  const triggerTarotReading = async () => {
    const minRequired = tarotSpreadMode === "single" ? 1 : tarotSpreadMode === "three" ? 3 : 10;
    if (selectedCards.length < minRequired) return;
    setIsReadingLoading(true);
    setReadingResult(null);

    try {
      const response = await fetch("/api/tarot-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: tarotQuestion || "What lessons are currently manifesting in my life?",
          cards: selectedCards.map(c => ({ name: c.name, isReversed: c.isReversed })),
          lang: lang
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReadingResult(data.reading);
      } else {
        throw new Error("API call error");
      }
    } catch (err: any) {
      // Premium High Quality Offline Fallback
      let fallbackText = `### Your Celestial Tarot Spread Blueprint\n\n`;
      selectedCards.forEach((c, idx) => {
        fallbackText += `* **Position ${idx + 1}: ${c.name} (${c.isReversed ? "Reversed" : "Upright"})**\n  * *Insight*: ${c.isReversed ? c.reversedMeaning : c.uprightMeaning}\n`;
      });
      fallbackText += `\n> *The High Priestess's Council*: Stand calm within your own sovereignty. The cards reveal a transition from rigid boundaries into adaptive cosmic flow of Qi. Let go of past grievances.`;
      setReadingResult(fallbackText);
    } finally {
      setIsReadingLoading(false);
    }
  };

  // ==========================================
  // 2. WESTERN ASTROLOGY STATE
  // ==========================================
  const [astrologyReading, setAstrologyReading] = useState<string | null>(null);
  const [isAstroLoading, setIsAstroLoading] = useState(false);
  
  // Compatibility tester
  const [partnerName, setPartnerName] = useState("");
  const [partnerSign, setPartnerSign] = useState("Aries");
  const [compatibilityResult, setCompatibilityResult] = useState<{ score: number; reading: string } | null>(null);

  const calculateCompatibility = () => {
    if (!partnerName.trim()) return;
    const score = Math.floor(Math.random() * 35) + 65; // High auspicious range (65-99%)
    const reading = `The planetary geometry of your Natal Sun placements with ${partnerName}'s ${partnerSign} signifies an exquisite karmic conjunction. While Venus stirs passion, Saturn's stabilising alignment suggests long-term spiritual growth and structural respect. Focus on empathetic communication during Mercury retrogrades.`;
    setCompatibilityResult({ score, reading });
  };

  const triggerAstrologyReading = async () => {
    if (!profile.birthDate) return;
    setIsAstroLoading(true);
    try {
      const response = await fetch("/api/astrology-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          birthDate: profile.birthDate,
          birthTime: profile.birthTime,
          birthPlace: profile.birthPlace,
          lang: lang
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAstrologyReading(data.reading);
      } else {
        throw new Error();
      }
    } catch (err) {
      setAstrologyReading(`
### Your Astro-Coordinates Chart Alignment
*Calculated for Birth Date: ${profile.birthDate}*

* **Sun Sign Alignment**: Mapped beautifully relative to your natal coordinates. Today features a conjunction of Mercury and your ruling planet, heightening intuition and communication.
* **Moon Sign**: Governs your private emotional sanctuary. Expect elevated dreams and sharp instincts over the next 48 hours.
* **Ascendant Alignment**: Represents your outer threshold, how you greet of life.

*Profound cosmic advice*: Create five minutes of complete quiet silence before sunset. A perfect day to re-orient values.
      `);
    } finally {
      setIsAstroLoading(false);
    }
  };

  // ==========================================
  // 3. BAZI (8 CHARACTERS) STATE
  // ==========================================
  const [luckCycleYear, setLuckCycleYear] = useState<number>(30); // Interactive slider year
  const luckCycleForecasts: { [key: number]: { title: string; desc: string; focus: string } } = {
    20: { title: "Pillar of Early Blossoms", desc: "Intense intellectual curiosity. This chapter establishes foundational skills under strong Resource element luck.", focus: "Direct Resource ✦ Wood" },
    30: { title: "Pillar of Professional Expansion", desc: "Your Day Master is highly supported by Officer energies. Period of massive professional growth, promotions, and societal leadership.", focus: "Direct Officer ✦ Fire" },
    40: { title: "Pillar of Inner Sovereignty", desc: "Wealth stars combine with self-expression. High entrepreneurial drive and launch of private ventures.", focus: "Indirect Wealth ✦ Earth" },
    50: { title: "Pillar of Sage Abundance", desc: "Stabilising element influences. Transitioning from aggressive outer material expansion into legacy consulting.", focus: "Friend Star ✦ Metal" }
  };

  // ==========================================
  // 4. ZI WEI DOU SHU STATE
  // ==========================================
  const [activeZiWeiPalace, setActiveZiWeiPalace] = useState<string>("Life");
  const ziWeiPalaces = {
    Life: { rating: "Auspicious (Major)", stars: "Emperor Star (Zi Wei), Left Assistant", desc: "Represents your core character, physical body, and overall life path. Highly resilient; a natural-born leader." },
    Spouse: { rating: "Harmonious", stars: "Tian Fu (Treasury Star), Flute Player", desc: "Governs marriage and romance. Points to a loyal, financially stable spouse who appreciates structure." },
    Wealth: { rating: "Supreme Star", stars: "Wu Qu (Military Star), Direct Officer", desc: "Indicates wealth generation. Marked by massive financial diligence; prosperity arrives via structured efforts." },
    Career: { rating: "Highly Auspicious", stars: "Qi Sha (Seven Killings), Right Assistant", desc: "Deals with professional trajectory. Best suited for high-autonomy decision-making roles." },
    Health: { rating: "Balanced", stars: "Tian Liang (Shelter Star)", desc: "Represents physical constitution. Benefit from excellent recovery stars; maintain gut and mental balance." },
    Travel: { rating: "In Motion", stars: "Tian Ma (Pegasus Star)", desc: "Relates to migrations / outdoor endeavors. Auspicious travel luck; relocations yield financial prosperity." }
  };

  // ==========================================
  // 5. I CHING DIVINATION STATE
  // ==========================================
  const [iChingLines, setIChingLines] = useState<number[]>([]);
  const [isIChingGenerating, setIsIChingGenerating] = useState(false);
  const [iChingResult, setIChingResult] = useState<{ hexagram: string; name: string; desc: string; guidance: string } | null>(null);

  const castIChingHexagram = () => {
    setIsIChingGenerating(true);
    setIChingResult(null);
    setIChingLines([]);

    // Generate 6 lines sequentially with animations
    let currentLines: number[] = [];
    const interval = setInterval(() => {
      // 0 = Yin (dashed), 1 = Yang (straight)
      const lineVal = Math.random() < 0.5 ? 0 : 1;
      currentLines.push(lineVal);
      setIChingLines([...currentLines]);

      if (currentLines.length >= 6) {
        clearInterval(interval);
        // Map to a classic Hexagram
        const sum = currentLines.reduce((acc, curr) => acc + curr, 0);
        setTimeout(() => {
          if (sum === 6) {
            setIChingResult({
              hexagram: "Hexagram 1 (乾 - Qián)",
              name: "The Creative / Pure Force",
              desc: "Represented by six unbroken Yang lines. Sky over sky. Supreme creative initiative and cosmic momentum.",
              guidance: "A time of supreme initiating power. Act with clear, disciplined noble integrity. The dragon is on the wing."
            });
          } else if (sum === 0) {
            setIChingResult({
              hexagram: "Hexagram 2 (坤 - Kūn)",
              name: "The Receptive / Gentle Field",
              desc: "Six dashed Yin lines. Earth over earth. Force of nurturing surrender, adaptation, and quiet sustenance.",
              guidance: "Do not seek to lead today. Practice deep receptivity, nourish others, and follow noble paths."
            });
          } else {
            setIChingResult({
              hexagram: "Hexagram 11 (泰 - Tài)",
              name: "Peace / Harmony",
              desc: "Three Yin lines over three Yang lines. Earth descending over Sky ascending. Elements union.",
              guidance: "A deeply favorable period where high energies align. Small exits, great achievements enter. Cultivated relationships yield abundance."
            });
          }
          setIsIChingGenerating(false);
        }, 600);
      }
    }, 200);
  };

  // ==========================================
  // 6. LIU YAO COIN TOSS STATE
  // ==========================================
  const [coinTosses, setCoinTosses] = useState<{ headsCount: number; coins: ("H" | "T")[] }[]>([]);
  const [isCoinTossing, setIsCoinTossing] = useState(false);
  const [liuYaoResult, setLiuYaoResult] = useState<{ title: string; lines: string; message: string } | null>(null);

  const tossCoinsOnce = () => {
    if (coinTosses.length >= 6) return;
    setIsCoinTossing(true);

    setTimeout(() => {
      const c1 = Math.random() < 0.5 ? "H" : "T";
      const c2 = Math.random() < 0.5 ? "H" : "T";
      const c3 = Math.random() < 0.5 ? "H" : "T";
      const coins: ("H" | "T")[] = [c1, c2, c3];
      const headsCount = coins.filter(c => c === "H").length;

      const newToss = { headsCount, coins };
      const updated = [...coinTosses, newToss];
      setCoinTosses(updated);
      setIsCoinTossing(false);

      if (updated.length === 6) {
        // Evaluate changing lines (3 heads = changing yin, 3 tails = changing yang)
        const changingLines = updated.filter(t => t.headsCount === 3 || t.headsCount === 0).length;
        setLiuYaoResult({
          title: "Shao Yang / Shao Yin Stable Union",
          lines: `${changingLines} Moving Lines Detected`,
          message: "The core hexagram indicates a transition in your career house. Direct effort is highly supported, but the moving lines advise holding back sudden negotiations for another lunar node cycle."
        });
      }
    }, 400);
  };

  const clearCoinTosses = () => {
    setCoinTosses([]);
    setLiuYaoResult(null);
  };


  const oracleCards = [
    {
      id: "tarot" as const,
      title: "Tarot Oracles",
      subtitle: "Past, Present & Future Reading",
      desc: "Formulate physical or spiritual inquiries and draw standard archetypal spreads to reveal your soul pathway.",
      icon: "🔮",
      color: "from-[#7C5CFF]/15 to-[#4C2CD9]/5 hover:border-[#7C5CFF]/45 bg-[#11162E]",
      badge: "Interactive",
      accentText: "text-[#7C5CFF]",
      bgGlow: "bg-[#7C5CFF]/10"
    },
    {
      id: "astrology" as const,
      title: "Astrology Mapping",
      subtitle: "Western Natal House Charts",
      desc: "Retrieve precise aspects of your birth time, sun/moon geometries, and current transit synchronizations.",
      icon: "🪐",
      color: "from-[#3B82F6]/15 to-[#1D4ED8]/5 hover:border-[#3B82F6]/45 bg-[#11162E]",
      badge: "Natal & Houses",
      accentText: "text-[#3B82F6]",
      bgGlow: "bg-[#3B82F6]/10"
    },
    {
      id: "bazi" as const,
      title: "BaZi (8-Characters)",
      subtitle: "Four Pillars of Destiny Chart",
      desc: "Ancient Chinese sexagenary cycle mapping. Calculate your day master element and decade luck profiles.",
      icon: "🐉",
      color: "from-[#10B981]/15 to-[#047857]/5 hover:border-[#10B981]/45 bg-[#11162E]",
      badge: "Five Elements",
      accentText: "text-[#10B981]",
      bgGlow: "bg-[#10B981]/10"
    },
    {
      id: "ziwei" as const,
      title: "Zi Wei Dou Shu",
      subtitle: "Purple Emperor Destiny Palaces",
      desc: "Classic astrological wisdom mapping 12 pristine domains of existence including Wealth, Spouse, and Travel.",
      icon: "☸️",
      color: "from-[#F59E0B]/15 to-[#B45309]/5 hover:border-[#F59E0B]/45 bg-[#11162E]",
      badge: "12 Palaces",
      accentText: "text-[#F59E0B]",
      bgGlow: "bg-[#F59E0B]/10"
    },
    {
      id: "iching" as const,
      title: "I Ching Divination",
      subtitle: "Hexagram Sage Changes",
      desc: "Consult the legendary Book of Changes by casting dynamic hexagram lines to gauge the flows of current Qi.",
      icon: "☯️",
      color: "from-[#EC4899]/15 to-[#BE185D]/5 hover:border-[#EC4899]/45 bg-[#11162E]",
      badge: "Book of Changes",
      accentText: "text-[#EC4899]",
      bgGlow: "bg-[#EC4899]/10"
    },
    {
      id: "liuyao" as const,
      title: "Liu Yao 3-Coins",
      subtitle: "Lineage Coin Toss Ritual",
      desc: "Establish moving line structures by interactive coin tossing to gain profound directives for career or life choices.",
      icon: "🪙",
      color: "from-[#FFD166]/15 to-[#D4AF37]/5 hover:border-[#FFD166]/45 bg-[#11162E]",
      badge: "Coin Method",
      accentText: "text-[#FFD166]",
      bgGlow: "bg-[#FFD166]/10"
    },
    {
      id: "numerology" as const,
      title: "Aura Numerology Grid",
      subtitle: "Life Path & Vibrational Synchronicity",
      desc: "Decipher master numbers like 11 & 22 that manifest in your daily timeline. Walk through the intuitive gates.",
      icon: "🔢",
      color: "from-[#A78BFA]/15 to-[#7C3AED]/5 hover:border-[#A78BFA]/45 bg-[#11162E]",
      badge: "Soul Numbers",
      accentText: "text-[#A78BFA]",
      bgGlow: "bg-[#A78BFA]/10"
    }
  ];

  return (
    <div className="space-y-6" id="discover-view-container">
      {activeCategory === null ? (
        <div className="space-y-6" id="discover-hub-dashboard">
          {/* Header of discover view */}
          <div className="border-b border-white/5 pb-5">
            <span className="font-mono text-xs text-star tracking-widest uppercase">☸️ {t.tabDiscover}</span>
            <h1 className="font-display text-2xl font-bold text-slate-100 mt-1 flex items-center gap-2">
              Destiny Center Hub
            </h1>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Combine multi-cultural Oracle wisdom across Eastern lineage charts and Western astrology.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
            {oracleCards.map((card) => (
              <motion.div
                key={card.id}
                onClick={() => setActiveCategory(card.id)}
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.985 }}
                className={`relative p-5 rounded-2xl border border-white/5 bg-gradient-to-br ${card.color} cursor-pointer transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg`}
              >
                <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${card.bgGlow} filter blur-xl opacity-60`} />
                
                <div className="space-y-2.5 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl">{card.icon}</span>
                    <span className="text-[9px] font-mono tracking-widest bg-white/5 text-slate-300 px-2.5 py-0.5 rounded-full border border-white/5 uppercase">
                      {card.badge}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      {card.title}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase tracking-wide">
                      {card.subtitle}
                    </p>
                  </div>
                  <p className="text-xs text-slate-355 font-sans leading-relaxed min-h-[36px] line-clamp-2">
                    {card.desc}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-3.5 border-t border-white/5 mt-4 relative z-10">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">DIVINATION PROTOCOL</span>
                  <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${card.accentText} uppercase tracking-widest hover:underline`}>
                    Consult <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* MASTER RECOMMENDATIONS & HONOR RANKS SECTION (大师排行和推荐) */}
          <div className="space-y-4 pt-4 border-t border-white/5 text-left" id="oracle-recommended-masters-module">
            <div className="flex items-end justify-between">
              <div>
                <span className="font-mono text-[9px] text-[#FFD166] tracking-widest uppercase block font-black">🌟 {lang === "zh" ? "本周大德推荐" : "WEEKLY GURU SELECTION"}</span>
                <h3 className={sizeClass("font-display font-bold text-slate-100 text-sm mt-0.5", "font-display font-black text-slate-100 text-lg mt-1")}>
                  {lang === "zh" ? "大师排行与推荐" : "Master Rankings & Recommendations"}
                </h3>
              </div>
              <button 
                onClick={() => onNavigate("marketplace", "all-masters")}
                className="font-mono text-[9px] text-[#FFD166] hover:text-[#FFAE19] flex items-center gap-0.5 font-bold transition-all"
              >
                <span>{lang === "zh" ? "下一页列表" : "Next Page Directory"}</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Recommended Masters horizontal slide cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div 
                onClick={() => onNavigate("marketplace", "lobby")}
                className="cursor-pointer p-3.5 rounded-2xl bg-[#11162E]/70 hover:bg-[#1C203F]/80 border border-white/5 hover:border-[#7C5CFF]/30 transition-all duration-300 group flex items-start gap-3"
              >
                <div className="text-3xl bg-[#7C5CFF]/10 p-2 rounded-xl group-hover:scale-105 transition-transform shrink-0">🪐</div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-display font-bold text-xs text-slate-100 group-hover:text-[#FFD166] transition-colors">Archmage Lyra (星海大师)</h4>
                    <span className="bg-[#7C5CFF]/15 text-[#7C5CFF] text-[8px] px-1.5 py-0.5 font-mono rounded">HOT</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans line-clamp-1">{lang === "zh" ? "精研西方古典占星、黄道行度与星盘相位复合解码。" : "Esoteric Astrological calculations, natal houses and planetary nodes."}</p>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 pt-1">
                    <span className="text-[#FFD166]">★ 4.9</span>
                    <span>•</span>
                    <span>{lang === "zh" ? "1280 功德量" : "1280 Sincerities"}</span>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => onNavigate("marketplace", "lobby")}
                className="cursor-pointer p-3.5 rounded-2xl bg-[#11162E]/70 hover:bg-[#1C203F]/80 border border-white/5 hover:border-[#7C5CFF]/30 transition-all duration-300 group flex items-start gap-3"
              >
                <div className="text-3xl bg-[#10B981]/10 p-2 rounded-xl group-hover:scale-105 transition-transform shrink-0">☸️</div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-display font-bold text-xs text-slate-100 group-hover:text-[#FFD166] transition-colors">Acharya Rinpoche (阿阇黎大师)</h4>
                    <span className="bg-[#10B981]/15 text-[#10B981] text-[8px] px-1.5 py-0.5 font-mono rounded">ZEN</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans line-clamp-1">{lang === "zh" ? "金刚乘唯识学疗愈、观照呼吸与情绪毒素净化指导。" : "Vajrayana psychology, mind-only healing and breathing alignment."}</p>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 pt-1">
                    <span className="text-[#FFD166]">★ 4.8</span>
                    <span>•</span>
                    <span>{lang === "zh" ? "910 功德量" : "910 Sincerities"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Honor Ranks Board (榜单) */}
            <div className="bg-[#11162E] border border-white/5 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                <span className="font-display font-bold text-slate-200 text-xs flex items-center gap-1">
                  🏆 {lang === "zh" ? "本周大德咨询福慧金榜" : "Weekly Sages Consultations Honor Board"}
                </span>
                <span className="font-mono text-[8.5px] text-slate-500 uppercase tracking-widest">{lang === "zh" ? "每日实时刷新" : "Refreshed Daily"}</span>
              </div>

              <div className="space-y-2">
                {[
                  { rank: 1, name: "Master Siew Low (廖大师) 🐲", specialty: lang === "zh" ? "生辰八字 & 阳宅风水" : "BaZi & Astrological Houses", score: "1420", rating: "★ 4.9", price: "$0.45/sec" },
                  { rank: 2, name: "Venerable Chuan Zhi (传志法师) ☯️", specialty: lang === "zh" ? "禅宗心愿 & 止观呼吸" : "Zen Meditation & Intent", score: "980", rating: "★ 4.8", price: "$0.30/sec" },
                  { rank: 3, name: "Mother Sophia (索菲娅母亲) 🔮", specialty: lang === "zh" ? "西洋七星 & 塔罗生命树" : "Seven rays & Cabala tarot", score: "850", rating: "★ 4.8", price: "$0.55/sec" }
                ].map((item) => {
                  const rankBadge = item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : "🥉";
                  return (
                    <div 
                      key={item.rank}
                      onClick={() => onNavigate("marketplace", "lobby")}
                      className="cursor-pointer flex items-center justify-between p-2.5 rounded-xl bg-[#090D1C]/60 hover:bg-[#1E2342]/40 border border-transparent hover:border-white/5 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-bold w-5 text-center shrink-0">{rankBadge}</span>
                        <div className="min-w-0">
                          <h5 className="font-display font-bold text-[11px] text-slate-200 truncate">{item.name}</h5>
                          <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-slate-500 mt-0.5">
                            <span className="text-[#7C5CFF] font-medium truncate">{item.specialty}</span>
                            <span>•</span>
                            <span>{lang === "zh" ? `${item.score}次咨询` : `${item.score} sess`}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-[9px] text-[#FFD166] font-extrabold block">{item.rating}</span>
                        <span className="text-[8.5px] font-mono text-slate-400 block">{item.price}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View all button to navigate to ALL SAGES next page */}
              <button
                onClick={() => onNavigate("marketplace", "all-masters")}
                className="cursor-pointer w-full mt-2 py-3 bg-[#1C1736] hover:bg-[#251F47] text-[#FFD166] hover:text-[#FFAE19] border border-[#7C5CFF]/30 hover:border-[#FFD166]/40 font-mono text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 transition-all active:scale-98 shadow-sm"
              >
                <span>{lang === "zh" ? "点击查看更多大德列表 → (下一页)" : "View All Spiritual Sages → (Next Page)"}</span>
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div className="space-y-5" id="discover-detail-view">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-2 text-xs font-mono font-bold text-[#7C5CFF] hover:text-white bg-[#7C5CFF]/15 border border-[#7C5CFF]/20 px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Destiny Hub
            </button>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest max-sm:hidden">
              Celestial Oracle Channel • {activeCategory.toUpperCase()}
            </span>
          </div>

          {/* RENDER ACTIVE MODULES WITH A 3D FLIPPING PERSPECTIVE WRAPPER */}
          <div className="relative w-full" style={{ perspective: "1500px" }} id="active-module-perspective-wrapper">
            <AnimatePresence mode="wait">
          {/* 1. Tarot Spreads Engine */}
          {activeCategory === "tarot" && (
            <motion.div
              key="tarot"
              initial={{ opacity: 0, rotateY: 15, x: 25, scale: 0.97 }}
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -15, x: -25, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="space-y-6 w-full"
              id="tarot-module-sandbox"
            >
          <div className="bg-[#11162E] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2.5 border-b border-white/5 flex-wrap gap-2">
              <h2 className="font-display text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                🔮 Interactive Tarot Oracle
              </h2>
              {/* Spread selector */}
              <select
                value={tarotSpreadMode}
                onChange={(e) => { setTarotSpreadMode(e.target.value as any); setSelectedCards([]); setReadingResult(null); }}
                className="bg-[#090D1C] border border-white/10 rounded px-2.5 py-1 text-slate-300 font-mono text-[10px]"
              >
                <option value="single">Single Card Focal Point</option>
                <option value="three">Past, Present & Future (3-Cards)</option>
                <option value="celtic">Celtic Cross spread (10-Cards)</option>
              </select>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              Formulate a clear inquiry. Select <strong>{tarotSpreadMode === "single" ? "1" : tarotSpreadMode === "three" ? "3" : "10"}</strong> cards from the face-down deck below to calibrate alignments.
            </p>

            {/* Input Question */}
            <div className="max-w-xl">
              <label className="text-slate-400 font-mono text-[9px] uppercase tracking-wider block mb-1">What is your dynamic inquiry?</label>
              <div className="relative">
                <input
                  type="text"
                  value={tarotQuestion}
                  onChange={(e) => setTarotQuestion(e.target.value)}
                  placeholder="e.g. Guidance on financial flow or relationship compatibility..."
                  className="w-full bg-[#090D1C] border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-cosmos transition-all pr-12"
                />
                <button
                  onClick={triggerTarotReading}
                  disabled={selectedCards.length < (tarotSpreadMode === "single" ? 1 : tarotSpreadMode === "three" ? 3 : 10) || isReadingLoading}
                  className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white disabled:opacity-30 cursor-pointer transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Cards Drawn list */}
            <div>
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-450 mb-3 uppercase tracking-wider">
                <span>Drawn Spreads: {selectedCards.length} Cards</span>
                {selectedCards.length > 0 && (
                  <button onClick={handleShuffle} className="text-glow hover:underline flex items-center gap-1">
                    <Shuffle className="h-2.5 w-2.5" /> Re-shuffle Deck
                  </button>
                )}
              </div>

              <div className="flex gap-3.5 mr-2 overflow-x-auto pb-3 pt-2 scrollbar-thin">
                {selectedCards.map((c, idx) => (
                  <FlippableTarotCard key={c.id || idx} card={c} positionIndex={idx} />
                ))}
                {selectedCards.length < (tarotSpreadMode === "single" ? 1 : tarotSpreadMode === "three" ? 3 : 10) && (
                  <div className="border border-dashed border-[#7C5CFF]/20 bg-[#090D1C]/25 min-w-[120px] h-[190px] rounded-2xl flex flex-col items-center justify-center text-slate-500 font-mono text-[9px] gap-2 p-3 text-center shrink-0">
                    <div className="w-10 h-10 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-sm">
                      ?
                    </div>
                    <span>Select card from deck to slot {selectedCards.length + 1}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card Back Deck */}
          {!readingResult && !isReadingLoading && (
            <div className="bg-[#11162E] p-4 border border-white/5 rounded-2xl">
              <span className="font-mono text-[9px] uppercase text-slate-500 block mb-3">Draw your cards from the sanctuary deck</span>
              <div className="grid grid-cols-6 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                {shuffledDeck.slice(0, 24).map((card, idx) => {
                  const drawnIndex = selectedCards.findIndex(c => c.id === card.id);
                  const isDrawn = drawnIndex !== -1;
                  return (
                    <div
                      key={card.id}
                      onClick={() => !isDrawn && selectCard(card)}
                      className={`cursor-pointer aspect-[2/3] rounded-lg border flex items-center justify-center text-center transition-all ${
                        isDrawn 
                          ? "border-transparent bg-white/5 opacity-10 scale-90"
                          : "border-white/10 bg-gradient-to-br from-[#1C2344] to-[#0A0E23] hover:border-star"
                      }`}
                    >
                      <span className="text-xs font-mono text-slate-600 block">★</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isReadingLoading && (
            <div className="p-8 text-center bg-[#11162E] border border-white/5 rounded-2xl flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 text-glow animate-spin" />
              <h5 className="font-display font-bold text-xs text-slate-200">Consulting Tarot Oracles...</h5>
            </div>
          )}

          {readingResult && !isReadingLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#11162E] border border-[#7C5CFF]/30 p-5 rounded-2xl space-y-3 shadow-lg">
              <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                <span className="text-[9px] font-mono uppercase bg-[#7C5CFF]/10 text-[#7C5CFF] px-2.5 py-0.5 rounded font-bold">ALIGNED ORACLE RESPONSE</span>
                <button onClick={handleShuffle} className="text-[9px] font-mono text-[#FFD166] underline">Clear Analysis</button>
              </div>

              <div className="markdown-body space-y-3.5 text-xs text-slate-355 leading-relaxed font-sans font-light">
                {readingResult.split("\n").map((line, lidx) => {
                  if (line.startsWith("###")) return <h4 key={lidx} className="font-display font-bold text-slate-100 text-sm mt-3">{line.replace("###", "")}</h4>;
                  if (line.startsWith("- **")) return <p key={lidx} className="pl-3 border-l border-glow"><strong className="text-slate-100">{line.replace(/\*\*/g, "")}</strong></p>;
                  if (line.startsWith("* **")) return <p key={lidx} className="pl-3 border-l border-white/10"><strong className="text-slate-100">{line.replace(/\*\*/g, "")}</strong></p>;
                  return <p key={lidx}>{line}</p>;
                })}
              </div>
            </motion.div>
          )}
            </motion.div>
          )}

          {/* 2. Western Astrology Module */}
          {activeCategory === "astrology" && (
            <motion.div
              key="astrology"
              initial={{ opacity: 0, rotateY: 15, x: 25, scale: 0.97 }}
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -15, x: -25, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="space-y-6 w-full"
              id="astrology-module-sandbox"
            >
          {/* Main Natal Report Box */}
          <div className="bg-[#11162E] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-display text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              🪐 Personal Astrological Natal Map Analysis
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Synthesize planetary coordinates based on your birthday and birth time alignment. Read about your primal core dharma, emotional moon sanctuary, and ascendant filter.
            </p>

            {profile.birthDate ? (
              <div className="space-y-3">
                <p className="font-mono text-[10px] text-slate-300 bg-[#090D1C] p-3 rounded-xl border border-white/5 select-all">
                  Coordinates: <strong className="text-glow">{profile.name} (Born: {profile.birthDate} at {profile.birthTime || "12:00"} in {profile.birthPlace || "Default coordinates"})</strong>
                </p>

                {!astrologyReading && !isAstroLoading && (
                  <button
                    onClick={triggerAstrologyReading}
                    className="bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white font-mono text-[10px] font-semibold py-2.5 px-4 rounded-xl transition duration-240 flex items-center gap-1.5 cursor-pointer"
                  >
                    Generate Planetary Blueprint <Sparkles className="h-3.5 w-3.5 text-glow" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-white/5 rounded-xl text-slate-500 text-xs">
                Provide birth details in settings to calculate actual planetary transits.
              </div>
            )}
          </div>

          {/* Quick Zodiac Compatibility Tester */}
          <div className="bg-[#11162E] border border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="font-display text-sm font-semibold text-slate-200">
              💕 Zodiac Compatibility Synastry
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Enter a partner's or friend's details to calculate Venus and Mars geometric synastry percentages.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-500 text-[8px] font-mono uppercase tracking-wider block mb-1">Companion Name</label>
                <input
                  type="text"
                  placeholder="e.g. Leo"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full bg-[#090D1C] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-500 text-[8px] font-mono uppercase tracking-wider block mb-1">Stellar Zodiac Sign</label>
                <select
                  value={partnerSign}
                  onChange={(e) => setPartnerSign(e.target.value)}
                  className="w-full bg-[#090D1C] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                >
                  {["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"].map((sign) => (
                    <option key={sign} value={sign}>{sign}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={calculateCompatibility}
              className="w-full py-2 bg-[#7C5CFF]/20 text-[#FFD166] border border-[#7C5CFF]/40 text-[10px] font-mono font-semibold rounded-xl cursor-pointer"
            >
              Analyze Synastry Conjunction
            </button>

            {compatibilityResult && (
              <motion.div initial={{ y: 5 }} className="bg-[#090D1C] border border-[#FFD166]/20 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-display font-bold text-xs text-slate-200">Synastry Alignment Ratio:</span>
                  <span className="font-mono text-glow text-base font-bold">{compatibilityResult.score}%</span>
                </div>
                <p className="text-slate-300 text-xs font-sans leading-relaxed">
                  {compatibilityResult.reading}
                </p>
              </motion.div>
            )}
          </div>

          {/* Astrology forecast results */}
          {astrologyReading && !isAstroLoading && (
            <div className="bg-[#11162E] border border-white/5 p-5 rounded-2xl space-y-2">
              <span className="text-[9px] font-mono uppercase text-[#A78BFA] bg-white/5 px-2 py-0.5 rounded">Calculated Natal Chart Interpretation</span>
              <div className="markdown-body space-y-3 text-xs text-slate-300 leading-relaxed font-sans font-light">
                {astrologyReading.split("\n").map((line, lIdx) => {
                  if (line.startsWith("###")) return <h4 key={lIdx} className="font-display font-bold text-glow mt-2">{line.replace("###", "")}</h4>;
                  if (line.startsWith("* **")) return <p key={lIdx} className="pl-3 border-l border-[#7C5CFF]"><strong className="text-slate-100">{line.replace(/\*\*/g, "")}</strong></p>;
                  return <p key={lIdx}>{line}</p>;
                })}
              </div>
            </div>
          )}
            </motion.div>
          )}

          {/* 3. BAZI (8 CHARACTERS) MODULE */}
          {activeCategory === "bazi" && (
            <motion.div
              key="bazi"
              initial={{ opacity: 0, rotateY: 15, x: 25, scale: 0.97 }}
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -15, x: -25, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="space-y-6 w-full"
              id="bazi-module-sandbox"
            >
          <div className="bg-[#11162E] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-display text-sm font-semibold text-slate-100">
              🐉 BaZi (Eight Characters / Four Pillars) destiny
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Derived from the sexagenary cycle. BaZi maps element proportions based on the hour, day, month, and year of birth.
            </p>

            {/* Bazi 4 Pillars Grid Display mockup */}
            <div className="grid grid-cols-4 gap-2 text-center bg-[#090D1C] p-3 rounded-xl border border-white/5">
              <div>
                <span className="text-slate-500 font-mono text-[8px] block">HOUR PILLAR</span>
                <span className="text-rose-450 font-bold block text-sm">Geng (庚)</span>
                <span className="text-slate-400 font-bold block text-[11px]">Metal (金)</span>
              </div>
              <div className="border-l border-white/5">
                <span className="text-slate-500 font-mono text-[8px] block">DAY PILLAR</span>
                <span className="text-emerald-450 font-bold block text-sm">Yi (乙)</span>
                <span className="text-slate-400 font-bold block text-[11px]">Wood (木)</span>
              </div>
              <div className="border-l border-white/5">
                <span className="text-slate-500 font-mono text-[8px] block">MONTH PILLAR</span>
                <span className="text-amber-450 font-bold block text-sm">Ji (己)</span>
                <span className="text-slate-400 font-bold block text-[11px]">Earth (土)</span>
              </div>
              <div className="border-l border-white/5">
                <span className="text-slate-500 font-mono text-[8px] block">YEAR PILLAR</span>
                <span className="text-sky-450 font-bold block text-sm">Gui (癸)</span>
                <span className="text-slate-400 font-bold block text-[11px]">Water (水)</span>
              </div>
            </div>

            {/* Five Elements custom visual bar chart ratios display */}
            <div className="space-y-2.5">
              <span className="font-mono text-[9px] uppercase text-slate-500 block">Five Elements Core Ratio %</span>
              <div className="space-y-1.5 font-mono text-[10px] text-slate-350">
                {/* Wood */}
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span>🌱 Wood (Benevolence)</span>
                    <span>35%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: "35%" }} />
                  </div>
                </div>

                {/* Fire */}
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span>🔥 Fire (Passion / Officers)</span>
                    <span>30%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full" style={{ width: "30%" }} />
                  </div>
                </div>

                {/* Earth */}
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span>🪨 Earth (Stability / Wealth)</span>
                    <span>15%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full" style={{ width: "15%" }} />
                  </div>
                </div>

                {/* Water */}
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span>💧 Water (Wisdom / Resource)</span>
                    <span>10%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full" style={{ width: "10%" }} />
                  </div>
                </div>

                {/* Metal */}
                <div>
                  <div className="flex justify-between mb-0.5">
                    <span>⚔️ Metal (Justice / Structure)</span>
                    <span>10%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="bg-slate-400 h-full" style={{ width: "10%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Luck Cycle Slider Analysis */}
          <div className="bg-[#11162E] border border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="font-display text-sm font-semibold text-slate-200">
              ⏳ 10-Year Luck Cycle Timeline
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Drag the slider below to inspect the planetary stems changing influence on your destiny timeline.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-mono">
                <span>Age 20 - 30</span>
                <span className="text-glow font-bold">Age 30 - 40 (Active)</span>
                <span>Age 40 - 50</span>
                <span>Age 50 - 60</span>
              </div>

              <input
                type="range"
                min="20"
                max="50"
                step="10"
                value={luckCycleYear}
                onChange={(e) => setLuckCycleYear(parseInt(e.target.value))}
                className="w-full accent-[#7C5CFF]"
              />

              <div className="bg-[#090D1C] p-4 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-display font-bold text-xs text-[#FFD166]">{luckCycleForecasts[luckCycleYear]?.title}</h4>
                  <span className="font-mono text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-400">{luckCycleForecasts[luckCycleYear]?.focus}</span>
                </div>
                <p className="text-slate-350 text-xs font-sans leading-relaxed">
                  {luckCycleForecasts[luckCycleYear]?.desc}
                </p>
              </div>
            </div>
          </div>
            </motion.div>
          )}

          {/* 4. ZI WEI DOU SHU MODULE */}
          {activeCategory === "ziwei" && (
            <motion.div
              key="ziwei"
              initial={{ opacity: 0, rotateY: 15, x: 25, scale: 0.97 }}
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -15, x: -25, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="space-y-6 w-full"
              id="ziwei-module-sandbox"
            >
          <div className="bg-[#11162E] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="font-display text-sm font-semibold text-slate-100">
              ☸️ Zi Wei Dou Shu (Twelve Palaces of Destiny)
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Mapped using traditional rectangular calendar arrangements. Select a Cosmic Palace below to read its specific star groupings and annual fortune ratings.
            </p>

            {/* Rectangular Twelve Palaces grid */}
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(ziWeiPalaces).map((palName) => {
                const active = activeZiWeiPalace === palName;
                return (
                  <div
                    key={palName}
                    onClick={() => setActiveZiWeiPalace(palName)}
                    className={`cursor-pointer p-2.5 rounded-xl border text-center transition-all ${
                      active
                        ? "bg-[#7C5CFF]/15 border-[#7C5CFF] shadow-[0_0_10px_rgba(124,92,255,0.15)]"
                        : "bg-[#090D1C] border-white/5 hover:border-white/10"
                    }`}
                  >
                    <span className={`font-display text-xs font-bold block ${active ? "text-glow" : "text-slate-200"}`}>
                      {palName} Palace
                    </span>
                    <span className="font-mono text-[8px] text-slate-500 block uppercase mt-0.5">
                      {ziWeiPalaces[palName as keyof typeof ziWeiPalaces].rating.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Palace Detail Output panel */}
            <div className="bg-[#090D1C] p-4 border border-white/5 rounded-xl space-y-2">
              <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2 flex-wrap gap-2">
                <h4 className="font-display font-bold text-xs text-[#FFD166]">
                  {activeZiWeiPalace} Palace Analysis
                </h4>
                <div className="font-mono text-[8px]">
                  <span>Status: <strong>{ziWeiPalaces[activeZiWeiPalace as keyof typeof ziWeiPalaces]?.rating}</strong></span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Planted Star Formations: <strong className="text-slate-300">{ziWeiPalaces[activeZiWeiPalace as keyof typeof ziWeiPalaces]?.stars}</strong>
              </div>
              <p className="text-slate-350 text-xs font-sans leading-relaxed pt-1 select-all">
                {ziWeiPalaces[activeZiWeiPalace as keyof typeof ziWeiPalaces]?.desc}
              </p>
            </div>
          </div>
            </motion.div>
          )}

          {/* 5. I CHING DIVINATION MODULE */}
          {activeCategory === "iching" && (
            <motion.div
              key="iching"
              initial={{ opacity: 0, rotateY: 15, x: 25, scale: 0.97 }}
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -15, x: -25, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="bg-[#11162E] border border-white/5 rounded-2xl p-5 space-y-5 w-full shadow-xl"
              id="iching-divination-sandbox"
            >
          <div className="text-left">
            <h2 className="font-display text-sm font-semibold text-slate-100">
              ☯️ I Ching (Classic Book of Changes) Divination
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed mt-0.5">
              The ancient binary Oracle of the sages. Direct your thoughts to any active life query, and click below to shake and cast the 6 lines of the hexagram.
            </p>
          </div>

          <button
            onClick={castIChingHexagram}
            disabled={isIChingGenerating}
            className="w-full py-2.5 bg-[#7C5CFF]/20 hover:bg-[#7C5CFF]/30 border border-[#7C5CFF]/40 text-[#FFD166] font-mono text-[11px] font-bold rounded-xl transition cursor-pointer"
          >
            {isIChingGenerating ? "Casting Hexagram Lines..." : "Cast Dynamic I Ching Hexagram"}
          </button>

          {/* RENDER ACTIVE YIN/YANG LINES */}
          {iChingLines.length > 0 && (
            <div className="flex flex-col-reverse items-center space-y-reverse space-y-2 py-4 bg-[#090D1C] rounded-2xl border border-white/5 max-w-sm mx-auto">
              {iChingLines.map((lineVal, idx) => (
                <div key={idx} className="w-48 flex justify-center items-center">
                  <span className="font-mono text-[8px] text-slate-500 mr-4">LINE {idx + 1}</span>
                  {lineVal === 1 ? (
                    /* Yang unbroken */
                    <div className="h-2 bg-[#7C5CFF] rounded-full w-24" />
                  ) : (
                    /* Yin broken dashed */
                    <div className="w-24 flex justify-between">
                      <div className="h-2 bg-[#FFD166] rounded-full w-10" />
                      <div className="h-2 bg-[#FFD166] rounded-full w-10" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Hexagram explanation results */}
          {iChingResult && !isIChingGenerating && (
            <motion.div initial={{ y: 5 }} className="bg-[#090D1C] border border-[#FFD166]/20 p-4 rounded-xl space-y-3">
              <div>
                <span className="font-mono text-[8px] uppercase text-[#7C5CFF] block font-bold">I CHING DECISION COMPLETE</span>
                <h4 className="font-display font-extrabold text-slate-200 text-xs mt-0.5">{iChingResult.hexagram} - {iChingResult.name}</h4>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed font-sans italic">
                {iChingResult.desc}
              </p>
              <blockquote className="border-l-4 border-[#7C5CFF] bg-white/5 p-3 rounded text-slate-300 text-xs font-sans leading-relaxed select-all">
                <strong>Sage Directive:</strong> {iChingResult.guidance}
              </blockquote>
            </motion.div>
          )}
            </motion.div>
          )}

          {/* 6. LIU YAO COIN TOSS MODULE */}
          {activeCategory === "liuyao" && (
            <motion.div
              key="liuyao"
              initial={{ opacity: 0, rotateY: 15, x: 25, scale: 0.97 }}
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -15, x: -25, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="bg-[#11162E] border border-white/5 rounded-2xl p-5 space-y-5 w-full shadow-xl"
              id="liuyao-coins-divination"
            >
          <div className="text-left pb-1 border-b border-white/5 flex justify-between items-center">
            <h2 className="font-display text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-glow animate-pulse" /> Liu Yao 3-Coins Divination
            </h2>
            {coinTosses.length > 0 && (
              <button onClick={clearCoinTosses} className="text-slate-500 hover:text-white font-mono text-[8px] uppercase tracking-wider">Reset</button>
            )}
          </div>

          <p className="text-slate-400 text-xs leading-relaxed">
            Liu Yao requires tossing 3 coins exactly <strong>6 times</strong> to establish moving and constant structures.
          </p>

          <button
            onClick={tossCoinsOnce}
            disabled={isCoinTossing || coinTosses.length >= 6}
            className="w-full py-2 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-xs font-mono font-bold rounded-xl disabled:opacity-40"
          >
            {isCoinTossing 
              ? "Tossing Auspicious Coins..." 
              : coinTosses.length >= 6 
                ? "6 Tosses Formulated" 
                : `Toss Coins (Toss ${coinTosses.length + 1} / 6)`}
          </button>

          {/* Rendering the tossed coin lines visually */}
          {coinTosses.length > 0 && (
            <div className="space-y-2 max-w-sm mx-auto bg-[#090D1C] p-3.5 rounded-xl border border-white/5">
              {coinTosses.map((toss, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] font-mono border-b border-white/[0.03] pb-1">
                  <span className="text-slate-500 text-[9px] font-bold">Line {idx + 1}:</span>
                  <div className="flex gap-2">
                    {toss.coins.map((c, cIdx) => (
                      <span key={cIdx} className="w-5 h-5 rounded-full bg-white/5 text-[9px] flex items-center justify-center font-bold text-glow">
                        {c}
                      </span>
                    ))}
                  </div>
                  <span className="text-slate-400 uppercase text-[9px]">
                    {toss.headsCount === 3 ? "Changing Yin (◯)" : toss.headsCount === 0 ? "Changing Yang (✖)" : toss.headsCount === 2 ? "Stable Yin" : "Stable Yang"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Liu Yao results report and moving lines interpretations */}
          {liuYaoResult && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#090D1C] border border-[#FFD166]/20 p-4 rounded-xl space-y-2">
              <div>
                <span className="font-mono text-[8px] uppercase text-star">LIU YAO COINS METHOD CALCULATED</span>
                <h4 className="font-display font-extrabold text-[#FFD166] text-xs mt-0.5">{liuYaoResult.title}</h4>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Lines formulation: {liuYaoResult.lines}</p>
              <p className="text-slate-355 text-xs leading-relaxed font-sans border-l-2 border-[#7C5CFF] pl-3 select-all">
                {liuYaoResult.message}
              </p>
            </motion.div>
          )}
            </motion.div>
          )}

          {/* Aura Numerology Tab Detail */}
          {activeCategory === "numerology" && (
            <motion.div
              key="numerology"
              initial={{ opacity: 0, rotateY: 15, x: 25, scale: 0.97 }}
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -15, x: -25, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="bg-[#11162E] border border-white/5 rounded-2xl p-6 space-y-5 w-full shadow-xl"
              id="numerology-lookup-sandbox"
            >
          <h2 className="font-display text-lg font-semibold text-slate-100">
            🔢 Aura Numerology Guide & Grid
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Your name and birth matrix convert into energetic numbers. Look up the deep vibrational archetypes below to decipher the synchronicity signs popping up in your life sequence.
          </p>

          <div className="grid grid-cols-1 gap-4 mt-4">
            <div className="bg-[#090D1C] p-4 rounded-xl border border-white/5 relative overflow-hidden">
              <div className="text-glow font-display font-medium text-4xl mb-2">11</div>
              <h4 className="font-display font-semibold text-slate-200 text-xs uppercase tracking-wider">The Intuitive Gateway</h4>
              <p className="text-slate-400 text-xs mt-1.5 font-sans leading-relaxed">
                Represents direct psychic attunement, electrical nervous energy, channeling truths. Focus on flashes of insight.
              </p>
            </div>

            <div className="bg-[#090D1C] p-4 rounded-xl border border-white/5 relative overflow-hidden">
              <div className="text-star font-display font-medium text-4xl mb-2">22</div>
              <h4 className="font-display font-semibold text-slate-200 text-xs uppercase tracking-wider">The Master Architect</h4>
              <p className="text-slate-400 text-xs mt-1.5 font-sans leading-relaxed">
                The ability to translate massive visions into concrete physical systems. Represents high leadership and action.
              </p>
            </div>
          </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
        </div>
      )}
    </div>
  );
}
