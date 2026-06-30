import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, ShieldCheck, Mail, Calendar, MessageSquare, PhoneCall, 
  Video, Check, HelpCircle, ChevronRight, ArrowLeft, 
  ShoppingBag, Search, Flame, BadgePercent, Tag, Sparkles, Filter, 
  Grid, Compass, Award, ExternalLink, Loader2, AlertCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserProfile } from "../types";
import api from "../lib/api";

interface MarketplaceViewProps {
  profile: UserProfile;
  largeTextMode?: boolean;
  activeSubPage?: "lobby" | "all-masters";
  onChangeSubPage?: (subPage: "lobby" | "all-masters") => void;
}

interface Master {
  id: string;
  name: string;
  avatar: string;
  specialties: string[];
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  location: string;
  pricePerSession: string;
  bio: string;
  languages: string[];
  isVerified: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMon = Math.floor(diffDay / 30);
  return `${diffMon}mo ago`;
}

export default function MarketplaceView({ 
  profile, 
  largeTextMode = false,
  activeSubPage: activeSubPageProp,
  onChangeSubPage
}: MarketplaceViewProps) {
  const { t, i18n } = useTranslation();
  
  const sizeClass = (normal: string, large: string) => largeTextMode ? large : normal;

  const [internalSubPage, setInternalSubPage] = useState<"lobby" | "all-masters">("lobby");
  const activeSubPage = activeSubPageProp !== undefined ? activeSubPageProp : internalSubPage;
  const setActiveSubPage = onChangeSubPage !== undefined ? onChangeSubPage : setInternalSubPage;

  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [selectedMasterReviews, setSelectedMasterReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");

  const [bookingDate, setBookingDate] = useState("2026-06-09");
  const [bookingTime, setBookingTime] = useState("14:00");
  const [consultationMode, setConsultationMode] = useState<"text" | "voice" | "video">("text");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [mastersList, setMastersList] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchPractitioners() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getPractitioners();
        if (!cancelled) {
          setMastersList(data.practitioners || []);
        }
      } catch {
        if (!cancelled) {
          setError(t('marketplace.errorLoading'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchPractitioners();
    return () => { cancelled = true; };
  }, [t]);

  const handleSelectMaster = async (master: Master) => {
    setSelectedMaster(master);
    setSelectedMasterReviews([]);
    setBookingConfirmed(false);
    setBookingError(null);
    setDetailLoading(true);
    try {
      const data = await api.getPractitioner(master.id);
      setSelectedMaster(data.practitioner);
      setSelectedMasterReviews(data.reviews || []);
    } catch {
      // keep the list-level data, just no reviews
    } finally {
      setDetailLoading(false);
    }
  };

  const triggerBookSession = async () => {
    if (!selectedMaster) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      await api.createBooking({
        practitionerId: selectedMaster.id,
        bookingDate,
        bookingTime,
        consultationMode,
      });
      setBookingConfirmed(true);
      setTimeout(() => {
        setBookingConfirmed(false);
        setSelectedMaster(null);
      }, 4000);
    } catch {
      setBookingError(t('marketplace.bookingError'));
    } finally {
      setBookingLoading(false);
    }
  };

  const mallCategories = [
    { key: "all", label: t('marketplace.all'), icon: "🌐" },
    { key: "tarot", label: t('marketplace.tarot'), icon: "🔮" },
    { key: "bazi", label: t('marketplace.bazi'), icon: "🐉" },
    { key: "astrology", label: t('marketplace.astrology'), icon: "🪐" },
    { key: "sound", label: t('marketplace.sound'), icon: "🌿" }
  ];

  const filteredMastersList = mastersList.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeCategoryFilter === "all") return matchesSearch;
    if (activeCategoryFilter === "tarot") return matchesSearch && m.specialties.some(s => s.toLowerCase().includes("tarot"));
    if (activeCategoryFilter === "bazi") return matchesSearch && m.specialties.some(s => s.toLowerCase().includes("bazi"));
    if (activeCategoryFilter === "astrology") return matchesSearch && m.specialties.some(s => s.toLowerCase().includes("astro"));
    if (activeCategoryFilter === "sound") return matchesSearch && m.specialties.some(s => s.toLowerCase().includes("breath") || s.toLowerCase().includes("sanskrit"));
    
    return matchesSearch;
  });

  const rankedMasters = [...mastersList].sort((a, b) => b.rating - a.rating);

  return (
    <div className="flex flex-col h-[70vh] sm:h-[720px] overflow-hidden" id="marketplace-view-sandbox">
      <AnimatePresence mode="wait">
        
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full gap-3"
          >
            <Loader2 className="h-6 w-6 text-[#7C5CFF] animate-spin" />
            <span className="text-slate-400 text-xs font-mono">{t('marketplace.loading')}</span>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full gap-3"
          >
            <AlertCircle className="h-6 w-6 text-rose-400" />
            <span className="text-rose-400 text-xs font-mono">{error}</span>
          </motion.div>
        ) : selectedMaster ? (
          <motion.div
            key="master-inspect"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col h-full overflow-y-auto pb-4 scrollbar-hidden space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5 bg-gradient-to-r from-[#171A30] to-[#111222] p-2.5 rounded-xl">
              <button 
                onClick={() => { setSelectedMaster(null); setBookingConfirmed(false); }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-[10px] flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> 
                <span>{t('marketplace.backToMall')}</span>
              </button>
              <span className="font-mono text-[9px] text-teal-400 font-bold bg-teal-500/10 px-2.5 py-1 rounded border border-teal-500/10">
                ⭐ {t('marketplace.itemInfo')}
              </span>
            </div>

            <div className="bg-[#11162E] border border-white/5 rounded-2xl p-4 space-y-3 relative overflow-hidden">
              <div className="flex gap-4 items-center">
                <div className="text-4xl w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center select-none shadow">
                  {selectedMaster.avatar}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-extrabold text-[#FFF] text-xs">{selectedMaster.name}</h3>
                    {selectedMaster.isVerified && <ShieldCheck className="h-4 w-4 text-[#FFD166]" />}
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-slate-400">
                    <span className="text-[#FFD166] font-bold">★ {selectedMaster.rating}</span>
                    <span>• {selectedMaster.reviewsCount} {t('marketplace.feedbackLogs')}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono leading-none">{selectedMaster.location}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedMaster.specialties.map((spec, sIdx) => (
                  <span 
                    key={sIdx}
                    className="bg-purple-950/20 text-[#A28DFF] border border-purple-500/10 text-[9px] font-mono px-2 py-0.5 rounded"
                  >
                    🏷️ {spec}
                  </span>
                ))}
              </div>

              <div className="border-t border-white/[0.03] pt-3">
                <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider block mb-1">{t('marketplace.description')}</span>
                <p className="text-slate-300 text-[11px] leading-relaxed font-sans font-light">
                  {selectedMaster.bio}
                </p>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 bg-black/30 px-3.5 py-2.5 rounded-xl border border-white/[0.02]">
                <div className="flex items-baseline gap-1">
                  <span className="text-slate-500 text-[8px] uppercase">{t('marketplace.price')}</span>
                  <strong className="text-[#FFD166] text-sm font-bold">{selectedMaster.pricePerSession}</strong>
                  <span className="text-slate-500 text-[8px]">/ {t('marketplace.perSession')}</span>
                </div>
                <span>Spoken: {selectedMaster.languages.join(", ")}</span>
              </div>
            </div>

            <div className="bg-[#11162E] border border-[#7C5CFF]/30 rounded-2xl p-4 space-y-4">
              <h3 className="font-display font-medium text-slate-200 text-xs uppercase tracking-wide flex items-center gap-1.5">
                🛍️ {t('marketplace.customize')}
              </h3>

              {bookingConfirmed ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-950/15 border border-emerald-500/20 rounded-xl p-4 text-center space-y-2"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto text-lg">
                    <Check className="h-5 w-5" />
                  </div>
                  <h4 className="font-display font-bold text-xs text-emerald-400">{t('marketplace.bookingSuccess')}</h4>
                  <p className="text-slate-400 text-[10px] leading-relaxed max-w-xs mx-auto font-sans">
                    You booked <strong>{selectedMaster.name}</strong> on <strong className="text-slate-200">{bookingDate}</strong> at <strong className="text-slate-200">{bookingTime}</strong> on <strong className="text-slate-200 uppercase">{consultationMode}</strong>.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {bookingError && (
                    <div className="bg-rose-950/15 border border-rose-500/20 rounded-xl p-3 text-center">
                      <span className="text-rose-400 text-[10px] font-mono">{bookingError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-mono uppercase text-slate-400 block mb-1">Appointment Date</label>
                      <input 
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-[#05060C] border border-white/5 rounded-xl px-2.5 py-2 text-slate-300 font-mono text-[10px] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-mono uppercase text-slate-400 block mb-1">Appointment Time</label>
                      <input 
                        type="time"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full bg-[#05060C] border border-white/5 rounded-xl px-2.5 py-2 text-slate-300 font-mono text-[10px] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono uppercase text-slate-400 block mb-1.5">Delivery Channel Spec</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setConsultationMode("text")}
                        className={`cursor-pointer border p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 font-mono text-[9px] transition-all ${
                          consultationMode === "text"
                            ? "bg-[#7C5CFF]/15 border-[#7C5CFF] text-[#7C5CFF] font-bold"
                            : "bg-white/[0.01] border-white/5 text-slate-400 hover:border-white/10"
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat Texts</span>
                      </button>

                      <button
                        onClick={() => setConsultationMode("voice")}
                        className={`cursor-pointer border p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 font-mono text-[9px] transition-all ${
                          consultationMode === "voice"
                            ? "bg-[#7C5CFF]/15 border-[#7C5CFF] text-[#7C5CFF] font-bold"
                            : "bg-white/[0.01] border-white/5 text-slate-400 hover:border-white/10"
                        }`}
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        <span>Voice Line</span>
                      </button>

                      <button
                        onClick={() => setConsultationMode("video")}
                        className={`cursor-pointer border p-2 rounded-xl text-center flex flex-col items-center justify-center gap-1 font-mono text-[9px] transition-all ${
                          consultationMode === "video"
                            ? "bg-[#7C5CFF]/15 border-[#7C5CFF] text-[#7C5CFF] font-bold"
                            : "bg-white/[0.01] border-white/5 text-slate-400 hover:border-white/10"
                        }`}
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Video Stream</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={triggerBookSession}
                    disabled={bookingLoading}
                    className="w-full bg-[#7C5CFF] hover:bg-[#6D4AFF] disabled:opacity-50 text-white font-mono text-[10px] font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {bookingLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingBag className="h-4 w-4 text-glow" />
                    )}
                    <span>{t('marketplace.placeOrder')} ({selectedMaster.pricePerSession})</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <h4 className="font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold px-1 flex justify-between">
                <span>💬 {t('marketplace.buyerFeedback')}</span>
                <span>Verified</span>
              </h4>
              {detailLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
                </div>
              ) : selectedMasterReviews.length > 0 ? (
                selectedMasterReviews.map((rev) => (
                  <div key={rev.id} className="bg-white/[0.01] border border-white/5 rounded-xl p-3.5 space-y-1.5 text-left">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-300 font-semibold">{rev.reviewerName}</span>
                      <span className="text-slate-500">{relativeTime(rev.createdAt)}</span>
                    </div>
                    <div className="flex gap-0.5 text-[#FFD166] text-xs leading-none">
                      {Array.from({ length: rev.rating }).map((_, s) => (
                        <span key={s}>★</span>
                      ))}
                    </div>
                    {rev.comment && (
                      <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-slate-500 font-mono text-center py-3">No reviews yet.</p>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="directory-mall"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full space-y-4"
          >
            <div className="flex items-center gap-2 shrink-0">
              {activeSubPage === "all-masters" && (
                <button
                  onClick={() => setActiveSubPage("lobby")}
                  className="cursor-pointer p-2.5 border border-white/5 bg-[#11162E] text-slate-300 rounded-xl hover:bg-white/10 shrink-0"
                  title="Return to lobby"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}

              <div className="bg-[#050712] border border-white/5 px-3 py-2 rounded-2xl flex items-center gap-2 flex-grow">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value && activeSubPage !== "all-masters") {
                      setActiveSubPage("all-masters");
                    }
                  }}
                  placeholder={t('marketplace.searchPlaceholder')}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none w-full font-sans"
                />
              </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 scrollbar-hidden pb-4">
              
              {activeSubPage === "lobby" ? (
                <>
                  <div className="bg-gradient-to-r from-purple-950 via-[#1C1736] to-slate-900 border border-[#7C5CFF]/30 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden select-none">
                    <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#7C5CFF]/15 rounded-full blur-2xl"></div>
                    <div className="space-y-1 max-w-[70%]">
                      <span className="bg-[#FFD166]/15 text-[#FFD166] text-[8px] font-mono px-2 py-0.5 rounded border border-[#FFD166]/20 font-bold uppercase tracking-widest leading-none flex items-center gap-1">
                        <BadgePercent className="h-3.5 w-3.5" /> 618 Summer Solstice Flash Deal
                      </span>
                      <h3 className="font-display font-extrabold text-slate-100 text-[11px] leading-tight">
                        {t('marketplace.promoBanner')}
                      </h3>
                      <p className="font-mono text-[8px] text-slate-400">Coupon code: <strong className="text-[#FFD166]">KARMIC15</strong></p>
                    </div>
                    
                    <div className="w-14 h-14 rounded-full bg-[#FFD166]/10 border border-[#FFD166]/30 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[12px] font-mono text-[#FFD166] font-extrabold">-15%</span>
                      <span className="text-[6px] font-mono text-slate-400 cursor-pointer uppercase leading-none">Voucher</span>
                    </div>
                  </div>

                  <div className="space-y-2 select-none" id="mall-recommends-section">
                    <div className="flex justify-between items-center px-1">
                      <span className={sizeClass("font-display font-bold text-[11px] text-[#A78BFA] uppercase tracking-wide flex items-center gap-1", "font-display font-black text-sm text-[#FFD166] uppercase tracking-wide flex items-center gap-1.5")}>
                        <Sparkles className="h-3.5 w-3.5 text-[#FFD166] animate-pulse" /> 
                        {t('marketplace.topMasters')}
                      </span>
                      <span className="text-[8px] font-mono text-indigo-400">Premium Picks</span>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hidden">
                      {rankedMasters.slice(0, 2).map((master) => (
                        <div
                          key={`rec-${master.id}`}
                          onClick={() => handleSelectMaster(master)}
                          className="cursor-pointer bg-gradient-to-br from-[#1E193C] to-[#0E1129] border border-[#7C5CFF]/30 p-3.5 rounded-2xl flex-shrink-0 w-[240px] text-left relative overflow-hidden transition-all duration-300 hover:border-[#FFD166]/40 hover:shadow-[0_4px_16px_rgba(124,92,255,0.15)] group"
                        >
                          <div className="absolute top-0 right-0 bg-[#FFD166] text-[#090D1C] font-mono text-[7px] font-extrabold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                            RECOMMENDED
                          </div>

                          <div className="flex gap-3 items-center">
                            <div className="text-3xl w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shadow shrink-0 select-none">
                              {master.avatar}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-display font-bold text-[11px] text-slate-100 truncate group-hover:text-[#FFD166] transition-colors">{master.name}</h4>
                              <p className="text-[8.5px] font-mono text-indigo-300 font-medium truncate">{master.specialties.join(", ")}</p>
                            </div>
                          </div>

                          <p className="text-slate-400 text-[10px] font-sans line-clamp-2 leading-relaxed mt-2">
                            {master.bio}
                          </p>

                          <div className="flex justify-between items-center border-t border-white/[0.04] mt-2.5 pt-2 font-mono">
                            <span className="text-[9px] text-[#FFD166] font-bold">★ {master.rating} ({master.reviewsCount})</span>
                            <span className="text-[#FFD166] font-extrabold text-[11px]">{master.pricePerSession}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#11162E] border border-white/5 rounded-2xl p-4 space-y-3 shadow-md" id="master-rankings-card">
                    <div className="flex justify-between items-center border-b border-white/[0.04] pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-[#FFD166]" />
                        <h4 className={sizeClass("font-display font-extrabold text-[#FFD166] text-xs", "font-display font-black text-base text-[#FFD166]")}>
                          {t('marketplace.weeklyHonor')}
                        </h4>
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded">HOT LEADERBOARD</span>
                    </div>

                    <div className="space-y-2.5">
                      {rankedMasters.map((master, index) => {
                        const rankMedal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "✨";
                        const rankColor = index === 0 ? "text-[#FFD166]" : index === 1 ? "text-[#E2E8F0]" : index === 2 ? "text-[#CD7F32]" : "text-slate-500";
                        return (
                          <div 
                            key={`rank-${master.id}`}
                            onClick={() => handleSelectMaster(master)}
                            className="cursor-pointer flex items-center justify-between p-2.5 rounded-xl bg-[#090D1C]/50 hover:bg-[#1E2342]/40 border border-white/[0.02] hover:border-white/5 transition-all duration-200 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`text-sm font-bold w-5 text-center ${rankColor}`}>{rankMedal}</span>
                              <div className="text-2xl select-none shrink-0">{master.avatar}</div>
                              <div className="min-w-0">
                                <h5 className="font-display font-bold text-[11px] text-slate-200 truncate group-hover:text-[#FFD166] transition-colors">{master.name}</h5>
                                <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-slate-500 mt-0.5">
                                  <span className="text-indigo-400 font-medium truncate">{master.specialties[0]}</span>
                                  <span>•</span>
                                  <span>{master.reviewsCount} {t('marketplace.consultations')}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono text-[9px] text-[#FFD166] font-extrabold block">★ {master.rating}</span>
                              <span className="text-[8.5px] font-mono text-slate-400 block">{master.pricePerSession}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setActiveSubPage("all-masters")}
                      className="cursor-pointer w-full py-3 bg-[#1C1736] hover:bg-[#251F47] text-[#FFD166] hover:text-[#FFAE19] border border-[#7C5CFF]/30 hover:border-[#FFD166]/40 font-mono text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 transition-all active:scale-98 shadow-sm"
                    >
                      <span>{t('marketplace.viewAll')} →</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-5 gap-2 select-none shrink-0" id="mall-category-buttons">
                    {mallCategories.map((cat) => {
                      const active = activeCategoryFilter === cat.key;
                      return (
                        <button
                          key={cat.key}
                          onClick={() => setActiveCategoryFilter(cat.key)}
                          className={`cursor-pointer transition-all duration-200 border rounded-2xl p-2.5 text-center flex flex-col items-center justify-center relative ${
                            active
                              ? "bg-gradient-to-b from-[#1C1736] to-[#111222] border-[#7C5CFF] text-[#FFD166] scale-105 shadow-inner"
                              : "bg-[#11162E] text-slate-400 border-white/5 hover:border-slate-800"
                          }`}
                        >
                          <span className="text-xl mb-1 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">{cat.icon}</span>
                          <span className="font-display font-bold text-[8px] tracking-tight leading-none text-center block truncate max-w-full">
                            {cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 px-1">
                      <span>✨ {t('marketplace.allMasters')} ({filteredMastersList.length})</span>
                      <span className="flex items-center gap-1 cursor-pointer hover:text-slate-300" onClick={() => setActiveSubPage("lobby")}><ArrowLeft className="h-3 w-3" /> {t('marketplace.backToRankings')}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2">
                      {filteredMastersList.map((master) => (
                        <div
                          key={master.id}
                          onClick={() => handleSelectMaster(master)}
                          className="cursor-pointer bg-[#11162E] border border-white/5 hover:border-[#7C5CFF]/30 p-3.5 rounded-2xl transition duration-200 flex flex-col justify-between group relative overflow-hidden shadow-md flex-grow"
                        >
                          {master.rating > 4.9 && (
                            <span className="absolute top-2 left-2 bg-rose-500/10 text-rose-400 font-mono text-[6px] px-1.5 py-0.5 rounded border border-rose-500/20 font-extrabold pb-0.2 select-none flex items-center gap-0.5">
                              <Flame className="h-2 w-2 text-glow" /> HOT SELLER
                            </span>
                          )}

                          <div className="w-full bg-[#090D1C] rounded-xl py-3.5 flex items-center justify-center border border-white/[0.02] mb-3 shrink-0 relative">
                            <div className="text-4xl select-none group-hover:scale-105 transition-transform duration-200">
                              {master.avatar}
                            </div>
                            <span className="absolute bottom-1 right-1.5 bg-black/60 text-[#FFD166] text-[7.5px] px-1 rounded-sm font-mono flex items-center gap-0.5 font-bold">
                              ★ {master.rating}
                            </span>
                          </div>

                          <div className="text-left space-y-1 w-full">
                            <h3 className="font-display font-bold text-slate-100 text-[11px] truncate leading-none group-hover:text-[#FFD166] transition-all font-sans">
                              {master.name}
                            </h3>
                            <span className="font-mono text-[7px] text-slate-500 block uppercase leading-none tracking-widest truncate">{master.specialties[0]}</span>
                            
                            <p className="text-slate-400 text-[9.5px] font-sans line-clamp-2 leading-relaxed pt-1 select-none pr-1">
                              {master.bio}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/[0.04] mt-3 pt-2 w-full">
                            <div className="flex items-baseline gap-0.5">
                              <strong className="text-[#FFD166] font-mono text-[12px] font-bold">{master.pricePerSession}</strong>
                              <span className="text-slate-500 text-[7px]">/sec</span>
                            </div>
                            <span className="bg-[#7C5CFF] group-hover:bg-[#6D4AFF] text-white p-1 rounded-lg transition-colors flex items-center justify-center shrink-0">
                              <ShoppingBag className="h-3 w-3 text-white" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="bg-[#090D1C] p-3.5 border border-dashed border-white/5 rounded-2xl flex items-start gap-2.5">
                <span className="text-xl select-none pt-0.5">🛡️</span>
                <div className="text-left space-y-1">
                  <h5 className="font-display font-semibold text-[10px] text-slate-300">Mall Guarantee Agreement</h5>
                  <p className="text-[9px] text-slate-500 font-sans leading-relaxed">
                    Consultants submit genealogical records checked by our Spiritual Wellness Board. Private transactions remain 100% encrypted.
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
