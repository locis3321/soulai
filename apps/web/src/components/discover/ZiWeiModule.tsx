import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Loader2 } from "lucide-react";
import { UserProfile } from "../../types";
import { api } from "../../lib/api";

interface ZiWeiModuleProps {
  profile: UserProfile;
}

const PALACE_NAMES = ["Life", "Spouse", "Wealth", "Career", "Health", "Travel"];

export default function ZiWeiModule({ profile }: ZiWeiModuleProps) {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activePalace, setActivePalace] = useState("Life");

  const handleCalculate = async () => {
    if (!profile.birthDate) return;
    setIsLoading(true);
    try {
      const data = await api.getZiWeiReading({
        name: profile.name || 'Seeker',
        birthDate: profile.birthDate,
        birthTime: profile.birthTime || '12:00',
        gender: 'male'
      });
      setResult(data.data);
    } catch (err) {
      console.error('ZiWei calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const palaceData = result?.palaces?.find?.((p: any) => p.name?.toLowerCase() === activePalace.toLowerCase());

  return (
    <motion.div
      key="ziwei"
      initial={{ opacity: 0, rotateY: 15, x: 25, scale: 0.97 }}
      animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, rotateY: -15, x: -25, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
      className="space-y-6 w-full"
    >
      <div className="bg-[#11162E] border border-white/5 rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-sm font-semibold text-slate-100">
          ☸️ Zi Wei Dou Shu (Twelve Palaces of Destiny)
        </h2>
        <p className="text-slate-400 text-xs leading-relaxed">
          Select a Cosmic Palace below to read its specific star groupings and annual fortune ratings.
        </p>

        {!result && (
          <button
            onClick={handleCalculate}
            disabled={isLoading || !profile.birthDate}
            className="w-full py-2.5 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-white text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isLoading ? 'Calculating...' : 'Calculate Your Zi Wei Chart'}
          </button>
        )}

        {result && (
          <div className="bg-[#090D1C] p-4 rounded-xl border border-white/5 space-y-2">
            <span className="font-mono text-[9px] uppercase text-[#F59E0B] block">Your Chart Summary</span>
            <p className="text-slate-300 text-xs leading-relaxed">
              Soul Star: <span className="text-[#FFD166] font-bold">{result.soulStar}</span>
              {result.bodyStar && <> | Body Star: <span className="text-[#FFD166] font-bold">{result.bodyStar}</span></>}
              {result.fiveElementsClass && <> | Element: <span className="text-slate-400">{result.fiveElementsClass}</span></>}
            </p>
          </div>
        )}

        {/* Palace Grid */}
        <div className="grid grid-cols-3 gap-2">
          {PALACE_NAMES.map((name) => (
            <div
              key={name}
              onClick={() => setActivePalace(name)}
              className={`cursor-pointer p-2.5 rounded-xl border text-center transition-all ${
                activePalace === name
                  ? "bg-[#7C5CFF]/15 border-[#7C5CFF]"
                  : "bg-[#090D1C] border-white/5 hover:border-white/10"
              }`}
            >
              <span className={`font-display text-xs font-bold block ${activePalace === name ? "text-glow" : "text-slate-200"}`}>
                {name} Palace
              </span>
            </div>
          ))}
        </div>

        {/* Palace Detail */}
        <div className="bg-[#090D1C] p-4 border border-white/5 rounded-xl space-y-2">
          <h4 className="font-display font-bold text-xs text-[#FFD166]">{activePalace} Palace Analysis</h4>
          {palaceData ? (
            <>
              <p className="text-slate-400 text-[10px]">Stars: {palaceData.majorStars?.map((s: any) => s.name).join(', ') || 'N/A'}</p>
              <p className="text-slate-300 text-xs leading-relaxed">{palaceData.desc || 'Select a palace to view details.'}</p>
            </>
          ) : (
            <p className="text-slate-400 text-xs">
              {result ? 'Palace data will appear after calculation.' : 'Calculate your chart to see palace details.'}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
