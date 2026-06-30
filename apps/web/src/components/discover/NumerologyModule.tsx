import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Loader2 } from "lucide-react";
import { UserProfile } from "../../types";
import { api } from "../../lib/api";

interface NumerologyModuleProps {
  profile: UserProfile;
}

export default function NumerologyModule({ profile }: NumerologyModuleProps) {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCalculate = async () => {
    if (!profile.birthDate) return;
    setIsLoading(true);
    try {
      const data = await api.getNumerologyReading(
        profile.name || 'Seeker',
        profile.birthDate
      );
      setResult(data.data);
    } catch (err) {
      console.error('Numerology calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      key="numerology"
      initial={{ opacity: 0, rotateY: 15, x: 25, scale: 0.97 }}
      animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, rotateY: -15, x: -25, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
      className="bg-[#11162E] border border-white/5 rounded-2xl p-6 space-y-5 w-full shadow-xl"
    >
      <h2 className="font-display text-lg font-semibold text-slate-100">
        🔢 Aura Numerology Guide & Grid
      </h2>
      <p className="text-slate-400 text-xs leading-relaxed">
        Your name and birth matrix convert into energetic numbers. Look up the deep vibrational archetypes below.
      </p>

      <button
        onClick={handleCalculate}
        disabled={isLoading || !profile.birthDate}
        className="w-full py-2.5 bg-[#A78BFA] hover:bg-[#8B5CF6] disabled:opacity-40 text-white text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isLoading ? 'Calculating...' : 'Calculate Your Life Path Number'}
      </button>

      {result && (
        <div className="bg-[#090D1C] p-4 rounded-xl border border-[#A78BFA]/20 space-y-2">
          <div className="text-glow font-display font-medium text-4xl mb-2">{result.lifePathNumber}</div>
          <h4 className="font-display font-semibold text-slate-200 text-xs uppercase tracking-wider">Your Life Path Number</h4>
          <p className="text-slate-400 text-xs font-sans leading-relaxed">
            Calculated from your birth date: {profile.birthDate}
          </p>
        </div>
      )}

      {/* Reference cards */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <div className="bg-[#090D1C] p-4 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="text-glow font-display font-medium text-4xl mb-2">11</div>
          <h4 className="font-display font-semibold text-slate-200 text-xs uppercase tracking-wider">The Intuitive Gateway</h4>
          <p className="text-slate-400 text-xs mt-1.5 font-sans leading-relaxed">
            Represents direct psychic attunement, electrical nervous energy, channeling truths.
          </p>
        </div>
        <div className="bg-[#090D1C] p-4 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="text-star font-display font-medium text-4xl mb-2">22</div>
          <h4 className="font-display font-semibold text-slate-200 text-xs uppercase tracking-wider">The Master Architect</h4>
          <p className="text-slate-400 text-xs mt-1.5 font-sans leading-relaxed">
            The ability to translate massive visions into concrete physical systems. High leadership and action.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
