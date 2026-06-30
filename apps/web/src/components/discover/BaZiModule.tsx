import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserProfile } from "../../types";
import { api } from "../../lib/api";

interface BaZiModuleProps {
  profile: UserProfile;
}

export default function BaZiModule({ profile }: BaZiModuleProps) {
  const { t } = useTranslation();
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [luckCycleYear, setLuckCycleYear] = useState(30);

  const handleCalculate = async () => {
    if (!profile.birthDate) return;
    setIsLoading(true);
    try {
      const data = await api.getBaZiReading({
        birthDate: profile.birthDate,
        birthTime: profile.birthTime || '12:00',
        gender: 'male'
      });
      setResult(data.data);
    } catch (err) {
      console.error('BaZi calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const p = result || {};
  const luckCycleForecasts: Record<number, { title: string; desc: string; focus: string }> = {
    20: { title: "", desc: "Complete your BaZi chart calculation to see luck cycles.", focus: "" },
    30: { title: "", desc: "Complete your BaZi chart calculation to see luck cycles.", focus: "" },
    40: { title: "", desc: "Complete your BaZi chart calculation to see luck cycles.", focus: "" },
    50: { title: "", desc: "Complete your BaZi chart calculation to see luck cycles.", focus: "" },
  };

  return (
    <motion.div
      key="bazi"
      initial={{ opacity: 0, rotateY: 15, x: 25, scale: 0.97 }}
      animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, rotateY: -15, x: -25, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
      className="space-y-6 w-full"
    >
      <div className="bg-[#11162E] border border-white/5 rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-sm font-semibold text-slate-100">
          🐉 {t('discover.baziModule.title')}
        </h2>
        <p className="text-slate-400 text-xs leading-relaxed">{t('discover.baziModule.desc')}</p>

        {/* Four Pillars Grid */}
        <div className="grid grid-cols-4 gap-2 text-center bg-[#090D1C] p-3 rounded-xl border border-white/5">
          {['hourPillar', 'dayPillar', 'monthPillar', 'yearPillar'].map((pillar, i) => {
            const labels = [t('discover.baziModule.hourPillar'), t('discover.baziModule.dayPillar'), t('discover.baziModule.monthPillar'), t('discover.baziModule.yearPillar')];
            const colors = ['text-rose-400', 'text-emerald-400', 'text-amber-400', 'text-sky-400'];
            const data = p[pillar];
            return (
              <div key={pillar} className={i > 0 ? 'border-l border-white/5' : ''}>
                <span className="text-slate-500 font-mono text-[8px] block">{labels[i]}</span>
                <span className={`font-bold block text-sm ${colors[i]}`}>
                  {data?.heavenlyStem || '--'} ({data?.ganZhi?.[0] || '?'})
                </span>
                <span className="text-slate-400 font-bold block text-[11px]">{data?.wuXing || '--'}</span>
              </div>
            );
          })}
        </div>

        {/* Calculate Button */}
        {!result && (
          <button
            onClick={handleCalculate}
            disabled={isLoading || !profile.birthDate}
            className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-40 text-white text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isLoading ? 'Calculating...' : 'Calculate Your BaZi Chart'}
          </button>
        )}

        {/* Result Summary */}
        {result && (
          <div className="bg-[#090D1C] p-4 rounded-xl border border-white/5 space-y-2">
            <span className="font-mono text-[9px] uppercase text-[#10B981] block">Your Chart Summary</span>
            <p className="text-slate-300 text-xs leading-relaxed">
              Day Master: <span className="text-[#FFD166] font-bold">{result.dayMaster}</span>
              {result.zodiac && <> | Zodiac: <span className="text-[#FFD166] font-bold">{result.zodiac}</span></>}
              {result.lunarDate && <> | Lunar: <span className="text-slate-400">{result.lunarDate}</span></>}
            </p>
          </div>
        )}
      </div>

      {/* Luck Cycle */}
      <div className="bg-[#11162E] border border-white/5 rounded-2xl p-5 space-y-4">
        <h3 className="font-display text-sm font-semibold text-slate-200">⏳ {t('discover.baziModule.luckCycle')}</h3>
        <div className="space-y-4">
          <input
            type="range" min="20" max="50" step="10" value={luckCycleYear}
            onChange={(e) => setLuckCycleYear(parseInt(e.target.value))}
            className="w-full accent-[#7C5CFF]"
          />
          <div className="bg-[#090D1C] p-4 rounded-xl border border-white/5 space-y-2">
            <h4 className="font-display font-bold text-xs text-[#FFD166]">{luckCycleForecasts[luckCycleYear]?.title}</h4>
            <p className="text-slate-350 text-xs leading-relaxed">{luckCycleForecasts[luckCycleYear]?.desc}</p>
            <span className="font-mono text-[9px] bg-white/5 px-2 py-0.5 rounded text-slate-400">{luckCycleForecasts[luckCycleYear]?.focus}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
