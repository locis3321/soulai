import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Eye, Command, Plus, Shuffle, Send, ChevronRight, HelpCircle, Loader2, Coins, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TarotCard, UserProfile } from "../types";
import { TAROT_DECK } from "../lib/tarotData";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import { hasFeatureAccess, SubscriptionTier } from "../lib/subscription";
import FlippableTarotCard from "./FlippableTarotCard";
import PaywallModal from "./PaywallModal";
import AstrologyModule from "./discover/AstrologyModule";
import BaZiModule from "./discover/BaZiModule";
import ZiWeiModule from "./discover/ZiWeiModule";
import NumerologyModule from "./discover/NumerologyModule";

interface DiscoverViewProps {
  profile: UserProfile;
  isPremium: boolean;
  onNavigate: (tab: string, arg?: any) => void;
  largeTextMode?: boolean;
}

export default function DiscoverView({ profile, isPremium, onNavigate, largeTextMode = false }: DiscoverViewProps) {
  const { t, i18n } = useTranslation();
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
      const data = await api.getTarotReading(
        tarotQuestion || "What lessons are currently manifesting in my life?",
        selectedCards.map(c => ({ name: c.name, isReversed: c.isReversed })),
        tarotSpreadMode
      );
      setReadingResult(data.reading);
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
      const data = await api.getAstrologyReading({
        birthDate: profile.birthDate,
        birthTime: profile.birthTime || '',
        birthPlace: profile.birthPlace || ''
      });
      setAstrologyReading(data.reading);
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
  const [baziResult, setBaziResult] = useState<any>(null);
  const [isBaziLoading, setIsBaziLoading] = useState(false);
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
  const [ziweiResult, setZiweiResult] = useState<any>(null);
  const [isZiweiLoading, setIsZiweiLoading] = useState(false);
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

  // ==========================================
  // 7. NUMEROLOGY STATE
  // ==========================================
  const [numerologyResult, setNumerologyResult] = useState<any>(null);
  const [isNumerologyLoading, setIsNumerologyLoading] = useState(false);

  // ==========================================
  // 8. PAYWALL STATE
  // ==========================================
  const { auth } = useStore();
  const currentTier = (auth.user?.subscriptionTier as SubscriptionTier) || 'free';
  const [paywallFeature, setPaywallFeature] = useState<{ name: string; tier: SubscriptionTier } | null>(null);

  // ==========================================
  // API CALCULATE HANDLERS
  // ==========================================
  const handleCalculateBaZi = async () => {
    if (!profile.birthDate) return;
    setIsBaziLoading(true);
    try {
      const data = await api.getBaZiReading({
        birthDate: profile.birthDate,
        birthTime: profile.birthTime || '12:00',
        gender: 'male'
      });
      setBaziResult(data.data);
    } catch (err) {
      console.error('BaZi calculation error:', err);
    } finally {
      setIsBaziLoading(false);
    }
  };

  const handleCalculateZiWei = async () => {
    if (!profile.birthDate) return;
    setIsZiweiLoading(true);
    try {
      const data = await api.getZiWeiReading({
        name: profile.name || 'Seeker',
        birthDate: profile.birthDate,
        birthTime: profile.birthTime || '12:00',
        gender: 'male'
      });
      setZiweiResult(data.data);
    } catch (err) {
      console.error('ZiWei calculation error:', err);
    } finally {
      setIsZiweiLoading(false);
    }
  };

  const handleCalculateNumerology = async () => {
    if (!profile.birthDate) return;
    setIsNumerologyLoading(true);
    try {
      const data = await api.getNumerologyReading(
        profile.name || 'Seeker',
        profile.birthDate
      );
      setNumerologyResult(data.data);
    } catch (err) {
      console.error('Numerology calculation error:', err);
    } finally {
      setIsNumerologyLoading(false);
    }
  };


  const oracleCards = [
    {
      id: "tarot" as const,
      title: t('discover.tarot.title'),
      subtitle: t('discover.tarot.subtitle'),
      desc: t('discover.tarot.desc'),
      icon: "🔮",
      color: "from-[#7C5CFF]/15 to-[#4C2CD9]/5 hover:border-[#7C5CFF]/45 bg-[#11162E]",
      badge: t('discover.tarot.badge'),
      accentText: "text-[#7C5CFF]",
      bgGlow: "bg-[#7C5CFF]/10"
    },
    {
      id: "astrology" as const,
      title: t('discover.astrology.title'),
      subtitle: t('discover.astrology.subtitle'),
      desc: t('discover.astrology.desc'),
      icon: "🪐",
      color: "from-[#3B82F6]/15 to-[#1D4ED8]/5 hover:border-[#3B82F6]/45 bg-[#11162E]",
      badge: t('discover.astrology.badge'),
      accentText: "text-[#3B82F6]",
      bgGlow: "bg-[#3B82F6]/10"
    },
    {
      id: "bazi" as const,
      title: t('discover.bazi.title'),
      subtitle: t('discover.bazi.subtitle'),
      desc: t('discover.bazi.desc'),
      icon: "🐉",
      color: "from-[#10B981]/15 to-[#047857]/5 hover:border-[#10B981]/45 bg-[#11162E]",
      badge: t('discover.bazi.badge'),
      accentText: "text-[#10B981]",
      bgGlow: "bg-[#10B981]/10"
    },
    {
      id: "ziwei" as const,
      title: t('discover.ziwei.title'),
      subtitle: t('discover.ziwei.subtitle'),
      desc: t('discover.ziwei.desc'),
      icon: "☸️",
      color: "from-[#F59E0B]/15 to-[#B45309]/5 hover:border-[#F59E0B]/45 bg-[#11162E]",
      badge: t('discover.ziwei.badge'),
      accentText: "text-[#F59E0B]",
      bgGlow: "bg-[#F59E0B]/10"
    },
    {
      id: "iching" as const,
      title: t('discover.iching.title'),
      subtitle: t('discover.iching.subtitle'),
      desc: t('discover.iching.desc'),
      icon: "☯️",
      color: "from-[#EC4899]/15 to-[#BE185D]/5 hover:border-[#EC4899]/45 bg-[#11162E]",
      badge: t('discover.iching.badge'),
      accentText: "text-[#EC4899]",
      bgGlow: "bg-[#EC4899]/10"
    },
    {
      id: "liuyao" as const,
      title: t('discover.liuyao.title'),
      subtitle: t('discover.liuyao.subtitle'),
      desc: t('discover.liuyao.desc'),
      icon: "🪙",
      color: "from-[#FFD166]/15 to-[#D4AF37]/5 hover:border-[#FFD166]/45 bg-[#11162E]",
      badge: t('discover.liuyao.badge'),
      accentText: "text-[#FFD166]",
      bgGlow: "bg-[#FFD166]/10"
    },
    {
      id: "numerology" as const,
      title: t('discover.numerology.title'),
      subtitle: t('discover.numerology.subtitle'),
      desc: t('discover.numerology.desc'),
      icon: "🔢",
      color: "from-[#A78BFA]/15 to-[#7C3AED]/5 hover:border-[#A78BFA]/45 bg-[#11162E]",
      badge: t('discover.numerology.badge'),
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
            <span className="font-mono text-xs text-star tracking-widest uppercase">☸️ {t('tabDiscover')}</span>
            <h1 className="font-display text-2xl font-bold text-slate-100 mt-1 flex items-center gap-2">
              {t('discover.title')}
            </h1>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              {t('discover.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
            {oracleCards.map((card) => (
              <motion.div
                key={card.id}
                data-testid={`discover-card-${card.id}`}
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
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{t('discover.divinationProtocol')}</span>
                  <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${card.accentText} uppercase tracking-widest hover:underline`}>
                    {t('discover.consult')} <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* MASTER RECOMMENDATIONS & HONOR RANKS SECTION (大师排行和推荐) */}
          <div className="space-y-4 pt-4 border-t border-white/5 text-left" id="oracle-recommended-masters-module">
            <div className="flex items-end justify-between">
              <div>
                <span className="font-mono text-[9px] text-[#FFD166] tracking-widest uppercase block font-black">🌟 {t('discover.weeklyGuru')}</span>
                <h3 className={sizeClass("font-display font-bold text-slate-100 text-sm mt-0.5", "font-display font-black text-slate-100 text-lg mt-1")}>
                  {t('discover.masterRankings')}
                </h3>
              </div>
              <button 
                onClick={() => onNavigate("marketplace", "all-masters")}
                className="font-mono text-[9px] text-[#FFD166] hover:text-[#FFAE19] flex items-center gap-0.5 font-bold transition-all"
              >
                <span>{t('discover.nextPage')}</span>
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
                    <span className="bg-[#7C5CFF]/15 text-[#7C5CFF] text-[8px] px-1.5 py-0.5 font-mono rounded">{t('discover.hot')}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans line-clamp-1">{t('discover.bazi.desc')}</p>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 pt-1">
                    <span className="text-[#FFD166]">★ 4.9</span>
                    <span>•</span>
                    <span>1280 {t('discover.sincerities')}</span>
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
                    <span className="bg-[#10B981]/15 text-[#10B981] text-[8px] px-1.5 py-0.5 font-mono rounded">{t('discover.zen')}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans line-clamp-1">{t('discover.ziwei.desc')}</p>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 pt-1">
                    <span className="text-[#FFD166]">★ 4.8</span>
                    <span>•</span>
                    <span>910 {t('discover.sincerities')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Honor Ranks Board (榜单) */}
            <div className="bg-[#11162E] border border-white/5 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                <span className="font-display font-bold text-slate-200 text-xs flex items-center gap-1">
                  🏆 {t('discover.weeklyHonor')}
                </span>
                <span className="font-mono text-[8.5px] text-slate-500 uppercase tracking-widest">{t('discover.refreshedDaily')}</span>
              </div>

              <div className="space-y-2">
                {[
                  { rank: 1, name: "Master Siew Low (廖大师) 🐲", specialty: t('discover.bazi.title'), score: "1420", rating: "★ 4.9", price: "$0.45/sec" },
                  { rank: 2, name: "Venerable Chuan Zhi (传志法师) ☯️", specialty: t('discover.iching.title'), score: "980", rating: "★ 4.8", price: "$0.30/sec" },
                  { rank: 3, name: "Mother Sophia (索菲娅母亲) 🔮", specialty: t('discover.tarot.title'), score: "850", rating: "★ 4.8", price: "$0.55/sec" }
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
                            <span>{item.score} {t('discover.consultations')}</span>
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
                <span>{t('discover.viewAll')} →</span>
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
                🔮 {t('discover.tarotModule.title')}
              </h2>
              {/* Spread selector */}
              <select
                value={tarotSpreadMode}
                onChange={(e) => {
                  const mode = e.target.value;
                  if (mode === 'celtic' && !hasFeatureAccess(currentTier, 'tarotCelticCross')) {
                    setPaywallFeature({ name: 'Celtic Cross Tarot', tier: 'premium' });
                    return;
                  }
                  setTarotSpreadMode(mode as any);
                  setSelectedCards([]);
                  setReadingResult(null);
                }}
                className="bg-[#090D1C] border border-white/10 rounded px-2.5 py-1 text-slate-300 font-mono text-[10px]"
              >
                <option value="single">{t('discover.tarotModule.singleCard')}</option>
                <option value="three">{t('discover.tarotModule.threeCards')}</option>
                <option value="celtic">{t('discover.tarotModule.celticCross')} {currentTier === 'free' ? '👑' : ''}</option>
              </select>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              {t('discover.tarotModule.desc')}
            </p>

            {/* Input Question */}
            <div className="max-w-xl">
              <label className="text-slate-400 font-mono text-[9px] uppercase tracking-wider block mb-1">{t('discover.tarotModule.title')}</label>
              <div className="relative">
                <input
                  type="text"
                  value={tarotQuestion}
                  onChange={(e) => setTarotQuestion(e.target.value)}
                  placeholder={t('discover.tarotModule.desc')}
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
                <span>{t('discover.tarotModule.selectCards')}: {selectedCards.length} Cards</span>
                {selectedCards.length > 0 && (
                  <button onClick={handleShuffle} className="text-glow hover:underline flex items-center gap-1">
                    <Shuffle className="h-2.5 w-2.5" /> {t('discover.tarotModule.reshuffle')}
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
                    <span>{t('discover.tarotModule.selectCards')} {selectedCards.length + 1}</span>
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
            <AstrologyModule profile={profile} />
          )}

          {/* 3. BAZI (8 CHARACTERS) MODULE */}
          {activeCategory === "bazi" && (
            <BaZiModule profile={profile} />
          )}

          {/* 4. ZI WEI DOU SHU MODULE */}
          {activeCategory === "ziwei" && (
            <ZiWeiModule profile={profile} />
          )}

          {/* 5. I CHING MODULE (stays inline - simple random generation) */}
          {activeCategory === "iching" && (
            <motion.div
              key="iching"
              initial={{ opacity: 0, rotateY: 15, x: 25, scale: 0.97 }}
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -15, x: -25, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="bg-[#11162E] border border-white/5 rounded-2xl p-6 space-y-5 w-full shadow-xl"
            >
              <h2 className="font-display text-lg font-semibold text-slate-100">☯️ I Ching Oracle</h2>
              <p className="text-slate-400 text-xs leading-relaxed">Cast a hexagram by generating six lines. Each line is either Yin (broken) or Yang (solid).</p>
              <button
                onClick={castIChingHexagram}
                disabled={isIChingGenerating}
                className="w-full py-2.5 bg-[#EC4899] hover:bg-[#DB2777] disabled:opacity-40 text-white text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isIChingGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isIChingGenerating ? 'Casting...' : 'Cast Hexagram'}
              </button>
              {iChingLines.length > 0 && (
                <div className="flex flex-col-reverse items-center gap-1 py-2">
                  {iChingLines.map((line, i) => (
                    <div key={i} className={`h-1.5 rounded ${line === 1 ? 'w-20 bg-[#FFD166]' : 'w-20 bg-[#FFD166] flex gap-4'}`}>
                      {line === 0 && <><div className="flex-1 bg-[#090D1C]" /><div className="flex-1 bg-[#090D1C]" /></>}
                    </div>
                  ))}
                </div>
              )}
              {iChingResult && (
                <div className="bg-[#090D1C] p-4 rounded-xl border border-[#EC4899]/20 space-y-2">
                  <h4 className="font-display font-bold text-[#FFD166] text-xs">{iChingResult.hexagram}</h4>
                  <p className="text-slate-300 text-xs">{iChingResult.name}</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{iChingResult.guidance}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* 6. LIU YAO MODULE (stays inline - coin toss) */}
          {activeCategory === "liuyao" && (
            <motion.div
              key="liuyao"
              initial={{ opacity: 0, rotateY: 15, x: 25, scale: 0.97 }}
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -15, x: -25, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 150, damping: 20 }}
              className="bg-[#11162E] border border-white/5 rounded-2xl p-6 space-y-5 w-full shadow-xl"
            >
              <h2 className="font-display text-lg font-semibold text-slate-100">🪙 Liu Yao Coin Toss</h2>
              <p className="text-slate-400 text-xs leading-relaxed">Toss three coins six times to build your hexagram. Each toss generates one line.</p>
              <div className="flex gap-2">
                <button
                  onClick={tossCoinsOnce}
                  disabled={isCoinTossing || coinTosses.length >= 6}
                  className="flex-1 py-2.5 bg-[#FFD166] hover:bg-[#D4AF37] disabled:opacity-40 text-slate-950 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isCoinTossing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
                  Toss ({coinTosses.length}/6)
                </button>
                <button onClick={clearCoinTosses} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-mono rounded-xl cursor-pointer">
                  Reset
                </button>
              </div>
              {coinTosses.length > 0 && (
                <div className="grid grid-cols-6 gap-2">
                  {coinTosses.map((toss, i) => (
                    <div key={i} className="bg-[#090D1C] p-2 rounded-lg border border-white/5 text-center">
                      <div className="text-[10px] font-mono text-slate-500 mb-1">Line {i + 1}</div>
                      <div className="flex justify-center gap-0.5">
                        {toss.coins.map((c, ci) => (
                          <span key={ci} className={`text-xs ${c === 'H' ? 'text-[#FFD166]' : 'text-slate-500'}`}>{c}</span>
                        ))}
                      </div>
                      <div className="text-[9px] font-mono text-slate-400 mt-1">{toss.headsCount}H</div>
                    </div>
                  ))}
                </div>
              )}
              {liuYaoResult && (
                <div className="bg-[#090D1C] border border-[#FFD166]/20 p-4 rounded-xl space-y-2">
                  <h4 className="font-display font-extrabold text-[#FFD166] text-xs">{liuYaoResult.title}</h4>
                  <p className="text-[10px] text-slate-500 font-mono">{liuYaoResult.lines}</p>
                  <p className="text-slate-300 text-xs leading-relaxed">{liuYaoResult.message}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* 7. NUMEROLOGY MODULE */}
          {activeCategory === "numerology" && (
            <NumerologyModule profile={profile} />
          )}
        </AnimatePresence>
      </div>
        </div>
      )}

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={!!paywallFeature}
        onClose={() => setPaywallFeature(null)}
        feature={paywallFeature?.name || ''}
        requiredTier={paywallFeature?.tier || 'plus'}
        currentTier={currentTier}
        onSubscribe={(tier) => {
          setPaywallFeature(null)
          onNavigate('profile')
        }}
      />
    </div>
  );
}
