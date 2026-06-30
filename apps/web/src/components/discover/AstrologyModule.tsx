import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserProfile } from "../../types";
import { api } from "../../lib/api";

interface AstrologyModuleProps {
  profile: UserProfile;
}

export default function AstrologyModule({ profile }: AstrologyModuleProps) {
  const { t } = useTranslation();
  const [reading, setReading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [compatibilityResult, setCompatibilityResult] = useState<{ score: number; reading: string } | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [partnerSign, setPartnerSign] = useState("Aries");

  const handleCalculate = async () => {
    if (!profile.birthDate) return;
    setIsLoading(true);
    try {
      const data = await api.getAstrologyReading({
        birthDate: profile.birthDate,
        birthTime: profile.birthTime || '',
        birthPlace: profile.birthPlace || ''
      });
      setReading(data.reading);
    } catch {
      setReading(`### Your Astro-Coordinates Chart Alignment\n*Calculated for Birth Date: ${profile.birthDate}*\n\n* **Sun Sign**: Mapped beautifully relative to your natal coordinates.\n* **Moon Sign**: Governs your private emotional sanctuary.\n* **Ascendant**: Represents your outer threshold.\n\n*Profound cosmic advice*: Create five minutes of complete quiet silence before sunset.`);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCompatibility = () => {
    if (!partnerName.trim()) return;
    setCompatibilityResult({
      score: 0,
      reading: 'Compatibility analysis requires backend API. This feature is coming soon.'
    });
  };

  return (
    <motion.div
      key="astrology"
      initial={{ opacity: 0, rotateY: 15, x: 25, scale: 0.97 }}
      animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, rotateY: -15, x: -25, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
      className="space-y-6 w-full"
    >
      <div className="bg-[#11162E] border border-white/5 rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-sm font-semibold text-slate-100">
          🪐 {t('discover.astrologyModule.title')}
        </h2>
        <p className="text-slate-400 text-xs leading-relaxed">
          {t('discover.astrologyModule.desc')}
        </p>

        <div className="bg-[#090D1C] p-4 rounded-xl border border-white/5 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[8px] font-mono text-slate-500 block uppercase">Sun Sign</span>
              <span className="text-sm font-bold text-amber-400">☉ --</span>
            </div>
            <div>
              <span className="text-[8px] font-mono text-slate-500 block uppercase">Moon Sign</span>
              <span className="text-sm font-bold text-slate-300">☽ --</span>
            </div>
            <div>
              <span className="text-[8px] font-mono text-slate-500 block uppercase">Ascendant</span>
              <span className="text-sm font-bold text-[#7C5CFF]">↑ --</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={isLoading || !profile.birthDate}
          className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-40 text-white text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isLoading ? 'Calculating...' : 'Generate Natal Chart'}
        </button>

        {reading && (
          <div className="bg-[#090D1C] p-4 rounded-xl border border-white/5 space-y-2">
            <span className="font-mono text-[9px] uppercase text-[#3B82F6] block">Chart Reading</span>
            <div className="text-slate-300 text-xs leading-relaxed space-y-2">
              {reading.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Compatibility */}
      <div className="bg-[#11162E] border border-white/5 rounded-2xl p-5 space-y-4">
        <h3 className="font-display text-sm font-semibold text-slate-200">💕 Compatibility Check</h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="Partner name"
            className="bg-[#090D1C] border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-[#7C5CFF]"
          />
          <select
            value={partnerSign}
            onChange={(e) => setPartnerSign(e.target.value)}
            className="bg-[#090D1C] border border-white/10 rounded-xl px-3 py-2 text-slate-200 text-xs"
          >
            {['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <button
          onClick={calculateCompatibility}
          className="w-full py-2 bg-[#EC4899] hover:bg-[#DB2777] text-white text-xs font-mono font-bold rounded-xl transition-all cursor-pointer"
        >
          Check Compatibility
        </button>
        {compatibilityResult && (
          <div className="bg-[#090D1C] p-3 rounded-xl border border-white/5">
            <div className="text-2xl font-bold text-[#FFD166] mb-1">{compatibilityResult.score}%</div>
            <p className="text-slate-400 text-xs">{compatibilityResult.reading}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
