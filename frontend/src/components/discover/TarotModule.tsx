import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Send, Shuffle, Loader2 } from "lucide-react";
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
  const [shuffledDeck, setShuffledDeck] = useState<TarotCard[]>(() => [...TAROT_DECK].sort(() => Math.random() - 0.5));

  // Use React Query mutation
  const tarotReadingMutation = useTarotReading();

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

    try {
      const response = await tarotReadingMutation.mutateAsync({
        question: tarotQuestion || "What lessons are currently manifesting in my life?",
        cards: selectedCards.map(c => ({ name: c.name, isReversed: c.isReversed })),
        spreadType: tarotSpreadMode
      });

      if (response.reading) {
        setReadingResult(response.reading);
      }
    } catch (err) {
      // Premium High Quality Offline Fallback
      let fallbackText = `### Your Celestial Tarot Spread Blueprint\n\n`;
      selectedCards.forEach((c, idx) => {
        fallbackText += `* **Position ${idx + 1}: ${c.name} (${c.isReversed ? "Reversed" : "Upright"})**\n  * *Insight*: ${c.isReversed ? c.reversedMeaning : c.uprightMeaning}\n`;
      });
      fallbackText += `\n> *The High Priestess's Council*: Stand calm within your own sovereignty. The cards reveal a transition from rigid boundaries into adaptive cosmic flow of Qi. Let go of past grievances.`;
      setReadingResult(fallbackText);
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
      {!readingResult && !isLoading && (
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

      {readingResult && !isLoading && (
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
