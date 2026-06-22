import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Send, Shuffle, Loader2, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TarotCard, UserProfile } from "../../types";
import { TAROT_DECK } from "../../lib/tarotData";
import FlippableTarotCard from "../FlippableTarotCard";
import { useTarotReading } from "../../hooks/useApi";

interface TarotModuleProps {
  profile: UserProfile;
  isPremium: boolean;
  onNavigate: (tab: string, arg?: any) => void;
  largeTextMode?: boolean;
}

export default function TarotModule({ profile, isPremium, onNavigate, largeTextMode = false }: TarotModuleProps) {
  const { t } = useTranslation();
  const sizeClass = (normal: string, large: string) => largeTextMode ? large : normal;

  // Tarot state
  const [tarotSpreadMode, setTarotSpreadMode] = useState<"single" | "three" | "celtic">("three");
  const [tarotQuestion, setTarotQuestion] = useState("");
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
  const [readingResult, setReadingResult] = useState<string | null>(null);
  const [entitlementError, setEntitlementError] = useState<{ requiredTier: string } | null>(null);
  const [shuffledDeck, setShuffledDeck] = useState<TarotCard[]>(() => [...TAROT_DECK].sort(() => Math.random() - 0.5));

  // Use React Query mutation
  const tarotReadingMutation = useTarotReading();

  const handleShuffle = () => {
    setShuffledDeck([...TAROT_DECK].sort(() => Math.random() - 0.5));
    setSelectedCards([]);
    setReadingResult(null);
    setEntitlementError(null);
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

    setEntitlementError(null);
    setReadingResult(null);

    try {
      const response = await tarotReadingMutation.mutateAsync({
        question: tarotQuestion || "What lessons are currently manifesting in my life?",
        cards: selectedCards.map(c => ({ name: c.name, isReversed: c.isReversed })),
        spreadType: tarotSpreadMode
      });

      if (response.reading) {
        setReadingResult(response.reading);
      }
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 403) {
        // Entitlement error: show paywall, do NOT generate fallback
        const requiredTier = err?.response?.data?.requiredTier || 'plus';
        setEntitlementError({ requiredTier });
      } else if (status === 401) {
        // Auth error: redirect to login
        setEntitlementError({ requiredTier: 'login' });
      } else {
        // Network / server error: show generic error, no fallback reading
        setReadingResult(null);
        setEntitlementError({ requiredTier: 'error' });
      }
    }
  };

  const isLoading = tarotReadingMutation.isPending;

  return (
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
              setTarotSpreadMode(e.target.value as any);
              setSelectedCards([]);
              setReadingResult(null);
              setEntitlementError(null);
            }}
            className="bg-[#090D1C] border border-white/10 rounded px-2.5 py-1 text-slate-300 font-mono text-[10px]"
          >
            <option value="single">{t('discover.tarotModule.singleCard')}</option>
            <option value="three">{t('discover.tarotModule.threeCards')}</option>
            <option value="celtic">{t('discover.tarotModule.celticCross')}</option>
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
              disabled={selectedCards.length < (tarotSpreadMode === "single" ? 1 : tarotSpreadMode === "three" ? 3 : 10) || isLoading}
              className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white disabled:opacity-30 cursor-pointer transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
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
      {!readingResult && !isLoading && !entitlementError && (
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

      {isLoading && (
        <div className="p-8 text-center bg-[#11162E] border border-white/5 rounded-2xl flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 text-glow animate-spin" />
          <h5 className="font-display font-bold text-xs text-slate-200">Consulting Tarot Oracles...</h5>
        </div>
      )}

      {/* Entitlement / Auth error — no fallback reading */}
      {entitlementError && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#11162E] border border-amber-500/20 p-5 rounded-2xl space-y-3"
        >
          {entitlementError.requiredTier === 'error' ? (
            <>
              <div className="text-center space-y-2">
                <span className="text-2xl">⚠️</span>
                <h3 className="font-display font-bold text-sm text-slate-200">Connection Error</h3>
                <p className="text-slate-400 text-xs">Unable to reach the oracle service. Please check your connection and try again.</p>
              </div>
              <button
                onClick={() => { setEntitlementError(null); handleShuffle(); }}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono rounded-xl cursor-pointer"
              >
                Try Again
              </button>
            </>
          ) : (
            <>
              <div className="text-center space-y-2">
                <Crown className="h-8 w-8 text-[#FFD166] mx-auto" />
                <h3 className="font-display font-bold text-sm text-slate-200">
                  {entitlementError.requiredTier === 'login'
                    ? 'Sign In Required'
                    : `${entitlementError.requiredTier.charAt(0).toUpperCase() + entitlementError.requiredTier.slice(1)} Plan Required`}
                </h3>
                <p className="text-slate-400 text-xs">
                  {entitlementError.requiredTier === 'login'
                    ? 'Please sign in to access tarot readings.'
                    : `This spread requires a ${entitlementError.requiredTier} subscription. Upgrade to unlock deeper tarot insights.`}
                </p>
              </div>
              <button
                onClick={() => {
                  setEntitlementError(null);
                  onNavigate('profile');
                }}
                className="w-full py-2.5 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white text-xs font-mono font-bold rounded-xl cursor-pointer transition-all"
              >
                {entitlementError.requiredTier === 'login' ? 'Sign In' : 'Upgrade Plan'}
              </button>
              <button
                onClick={() => setEntitlementError(null)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono rounded-xl cursor-pointer"
              >
                Dismiss
              </button>
            </>
          )}
        </motion.div>
      )}

      {readingResult && !isLoading && !entitlementError && (
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
  );
}
