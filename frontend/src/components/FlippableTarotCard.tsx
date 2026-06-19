import React, { useState } from "react";
import { motion } from "motion/react";
import { TarotCard } from "../types";
import { HelpCircle, Sparkles, BookOpen } from "lucide-react";

interface FlippableTarotCardProps {
  card: TarotCard;
  positionIndex: number;
}

export default function FlippableTarotCard({ card, positionIndex }: FlippableTarotCardProps) {
  // State: 'back' (unrevealed), 'front' (the card graphic), 'info' (the text meaning of the card)
  const [side, setSide] = useState<"back" | "front" | "info">("back");

  const handleCardClick = () => {
    if (side === "back") {
      setSide("front");
    } else if (side === "front") {
      setSide("info");
    } else {
      setSide("front");
    }
  };

  const getRotationY = () => {
    if (side === "back") return 180;
    if (side === "front") return 0;
    return 360; // info side
  };

  const currentMeaning = card.isReversed ? card.reversedMeaning : card.uprightMeaning;

  return (
    <div 
      className="w-[120px] h-[190px] shrink-0 select-none relative"
      style={{ perspective: "1000px" }}
      id={`flippable-card-${card.id}`}
    >
      <motion.div
        className="w-full h-full relative cursor-pointer"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: getRotationY() }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        onClick={handleCardClick}
        whileHover={{ scale: 1.05, y: -4 }}
      >
        {/* CARD BACK SIDE (Rotated 180deg) */}
        <div 
          className="absolute inset-0 w-full h-full rounded-2xl p-2.5 flex flex-col justify-between items-center text-center border-2 border-[#FFD166]/40 bg-gradient-to-b from-[#11162E] via-[#0E1330] to-[#050716] shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
          style={{ 
            backfaceVisibility: "hidden", 
            transform: "rotateY(180deg)" 
          }}
        >
          {/* Ornate border accents */}
          <div className="absolute top-1.5 left-1.5 right-1.5 bottom-1.5 border border-[#FFD166]/20 rounded-xl pointer-events-none" />
          
          <span className="font-mono text-[8px] text-[#FFD166]/70 uppercase tracking-widest mt-1">POS {positionIndex + 1}</span>
          
          <div className="relative my-auto flex flex-col items-center">
            {/* Sacred geometry circle */}
            <div className="w-12 h-12 rounded-full border border-[#7C5CFF]/30 flex items-center justify-center animate-spin-slow">
              <span className="text-xl text-[#FFD166] filter drop-shadow-[0_0_8px_rgba(255,209,102,0.5)]">★</span>
            </div>
            <span className="text-[7px] font-mono text-slate-400 mt-2 tracking-wide uppercase">REVEAL ORACLE</span>
          </div>

          <div className="flex items-center gap-1 text-[7px] font-mono text-[#A78BFA] bg-[#7C5CFF]/10 px-1.5 py-0.5 rounded-full mb-1">
            <Sparkles className="h-2 w-2 text-[#FFD166]" /> Tap to Turn
          </div>
        </div>

        {/* CARD FRONT SIDE (Rotated 0deg) */}
        <div 
          className="absolute inset-0 w-full h-full rounded-2xl p-2.5 flex flex-col justify-between items-center text-center border-2 border-[#7C5CFF]/45 bg-gradient-to-b from-[#090D1C] via-[#0F1435] to-[#141A46] shadow-[0_4px_16px_rgba(124,92,255,0.25)]"
          style={{ 
            backfaceVisibility: "hidden", 
            transform: "rotateY(0deg)" 
          }}
        >
          <div className="absolute top-1.5 left-1.5 right-1.5 bottom-1.5 border border-[#7C5CFF]/15 rounded-xl pointer-events-none" />
          
          <div className="w-full flex justify-between items-center font-mono text-[7px] text-slate-400 px-0.5">
            <span>POS {positionIndex + 1}</span>
            <span className="text-[#FFD166]">{card.isReversed ? "⏳ REV" : "🛡️ UPR"}</span>
          </div>

          <div className="my-auto flex flex-col items-center gap-1.5">
            <div className="text-3xl filter drop-shadow-[0_0_6px_rgba(124,92,255,0.4)]">{card.imageSymbol}</div>
            <h4 className="font-display font-semibold text-[10px] text-slate-100 uppercase tracking-tight leading-none px-1 overflow-hidden text-ellipsis max-w-[100px] break-words">
              {card.name}
            </h4>
            <span className="text-[7px] font-mono text-[#A78BFA] tracking-widest uppercase scale-90">{card.category}</span>
          </div>

          <div className="flex items-center gap-0.5 text-[7px] font-mono text-[#FFD166] bg-[#FFD166]/10 px-1.5 py-0.5 rounded-full mb-1">
            <BookOpen className="h-2 w-2" /> Detail Meaning
          </div>
        </div>

        {/* CARD INFO/MEANING SIDE (Rotated 360deg / same flat perspective but backface visible only when toggled) */}
        <div 
          className="absolute inset-0 w-full h-full rounded-2xl p-2.5 flex flex-col justify-between items-center text-left border-2 border-[#10B981]/50 bg-[#081822] shadow-[0_4px_16px_rgba(16,185,129,0.2)]"
          style={{ 
            backfaceVisibility: "hidden", 
            transform: "rotateY(360deg)" // Double rotated
          }}
        >
          <div className="absolute top-1.5 left-1.5 right-1.5 bottom-1.5 border border-[#10B981]/15 rounded-xl pointer-events-none" />
          
          <div className="w-full flex justify-between items-center font-mono text-[7px] text-slate-400 px-0.5 border-b border-white/5 pb-1 shrink-0">
            <span className="text-[#10B981] font-bold">INSIGHT</span>
            <span>★</span>
          </div>

          <div className="flex-grow w-full flex items-center px-0.5 py-1.5 overflow-hidden">
            <p className="text-[8px] text-slate-300 leading-normal font-sans font-medium line-clamp-6 text-center select-all">
              {currentMeaning}
            </p>
          </div>

          <div className="w-full text-center shrink-0">
            <span className="inline-block text-[7px] font-mono text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded-full mb-1">
              Tap to Logo
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
