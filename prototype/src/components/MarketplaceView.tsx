import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, ShieldCheck, Mail, Calendar, MessageSquare, PhoneCall, 
  Video, Check, HelpCircle, ChevronRight, ArrowLeft, 
  ShoppingBag, Search, Flame, BadgePercent, Tag, Sparkles, Filter, 
  Grid, Compass, Award, ExternalLink
} from "lucide-react";
import { UserProfile } from "../types";
import { LanguageKey, TRANSLATIONS } from "../lib/translations";

interface MarketplaceViewProps {
  profile: UserProfile;
  lang: LanguageKey;
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
  reviews: { reviewer: string; stars: number; comment: string; date: string }[];
  isHot?: boolean;
  salesCount: number;
}

export default function MarketplaceView({ 
  profile, 
  lang, 
  largeTextMode = false,
  activeSubPage: activeSubPageProp,
  onChangeSubPage
}: MarketplaceViewProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  // Sizing helper for Senior Mode
  const sizeClass = (normal: string, large: string) => largeTextMode ? large : normal;

  const [internalSubPage, setInternalSubPage] = useState<"lobby" | "all-masters">("lobby");
  const activeSubPage = activeSubPageProp !== undefined ? activeSubPageProp : internalSubPage;
  const setActiveSubPage = onChangeSubPage !== undefined ? onChangeSubPage : setInternalSubPage;

  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");
  
  // Simulated Cart count for booked Sages
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Booking states
  const [bookingDate, setBookingDate] = useState("2026-06-09");
  const [bookingTime, setBookingTime] = useState("14:00");
  const [consultationMode, setConsultationMode] = useState<"text" | "voice" | "video">("text");
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const [mastersList] = useState<Master[]>([
    {
      id: "master-1",
      name: "Master Siew Low (廖大师)",
      avatar: "🐲",
      specialties: ["BaZi Destiny", "Traditional FengShui", "I Ching"],
      rating: 4.92,
      reviewsCount: 384,
      experienceYears: 24,
      location: "Kuala Lumpur, Malaysia",
      pricePerSession: "$58",
      languages: ["Mandarin", "English", "Cantonese"],
      bio: "Lineage Bazi scholar and FengShui architect. Spanning 24 years helping startup founders and individual seekers align their element flows to maximize fortune, career pivots, and love compatibility.",
      isHot: true,
      salesCount: 1420,
      reviews: [
        { reviewer: "Keng W.", stars: 5, comment: "Master Siew calculated my Water Day Master perfectly. The career transition advice was spot on to the exact month!", date: "Yesterday" },
        { reviewer: "Rachel S.", stars: 5, comment: "Incredibly peaceful and logical explanations. Not spooky or salesy. Very modern.", date: "5 days ago" }
      ]
    },
    {
      id: "master-2",
      name: "Sirena Phromsomboon",
      avatar: "🔮",
      specialties: ["Classic Moon Tarot", "Chakra Balance", "Astrology"],
      rating: 4.88,
      reviewsCount: 219,
      experienceYears: 11,
      location: "Bangkok, Thailand",
      pricePerSession: "$45",
      languages: ["Thai", "English"],
      bio: "Intuitive Oracle healer and astrologer based in central Bangkok. Employs classic Marseille and Rider-Waite cards to expose structural blockages in heart dynamics and career orbits.",
      isHot: true,
      salesCount: 840,
      reviews: [
        { reviewer: "Nattapong T.", stars: 5, comment: "Beautiful reading near the Sukhumvit sanctuary. Understood my family blockages immediately.", date: "3 days ago" },
        { reviewer: "Chris L.", stars: 4, comment: "Amazing energetic reading. Highly empathetic therapist vibe.", date: "1 week ago" }
      ]
    },
    {
      id: "master-3",
      name: "Guru Minh Thao",
      avatar: "🕉️",
      specialties: ["Zi Wei Dou Shu", "Aura Numerology", "Somatic Breath"],
      rating: 5.0,
      reviewsCount: 156,
      experienceYears: 16,
      location: "Ho Chi Minh City, Vietnam",
      pricePerSession: "$60",
      languages: ["Vietnamese", "English"],
      bio: "Spiritual director focusing on mapping the Twelve Palaces of Zi Wei coordinates. Blends ancient Hanoi temple charts with mindful breath somatic work to stabilize life traumas and chart career ascents.",
      isHot: false,
      salesCount: 612,
      reviews: [
        { reviewer: "Nguyen T.", stars: 5, comment: "The Zi Wei palace breakdown was mindblowing. Understood my health stars so clearly.", date: "4 days ago" }
      ]
    },
    {
      id: "master-4",
      name: "Lama Phuntsok",
      avatar: "☸️",
      specialties: ["Sanskrit Chant", "Tibetan Astrology", "Karmic Cleanse"],
      rating: 4.95,
      reviewsCount: 112,
      experienceYears: 28,
      location: "Phnom Penh, Cambodia",
      pricePerSession: "$70",
      languages: ["Tibetan", "English", "French"],
      bio: "Venerated monk specializing in aligning ancestral footprints and cleansing karmic stagnation. Provides structural mantras to increase bodily vigor and spiritual shields during difficult Saturn eclipses.",
      isHot: false,
      salesCount: 388,
      reviews: [
        { reviewer: "Sokha P.", stars: 5, comment: "An absolutely purifying experience. Recommended highly for high vibrational stabilization.", date: "2 weeks ago" }
      ]
    }
  ]);

  // Handle Order Placement
  const triggerBookSession = () => {
    setBookingConfirmed(true);
    setCartItemsCount(prev => prev + 1);
    setTimeout(() => {
      setBookingConfirmed(false);
      setSelectedMaster(null);
    }, 4000);
  };

  const mallCategories = [
    { key: "all", label: lang === "zh" ? "全部" : "All", icon: "🌐" },
    { key: "tarot", label: lang === "zh" ? "塔罗神卦" : "Tarot", icon: "🔮" },
    { key: "bazi", label: lang === "zh" ? "八字命理" : "BaZi", icon: "🐉" },
    { key: "astrology", label: lang === "zh" ? "星盘占星" : "Astrology", icon: "🪐" },
    { key: "sound", label: lang === "zh" ? "佛家音疗" : "Zen Sound", icon: "🌿" }
  ];

  // Filter listings based on categories & search queries
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

  return (
    <div className="flex flex-col h-[70vh] sm:h-[720px] overflow-hidden" id="marketplace-view-sandbox">
      <AnimatePresence mode="wait">
        
        {/* =======================================================
            STATE A: DETAILED PRODUCT/GURU EXPLORE PAGE (商品详情页)
            ======================================================= */}
        {selectedMaster ? (
          <motion.div
            key="master-inspect"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col h-full overflow-y-auto pb-4 scrollbar-hidden space-y-4"
          >
            {/* Top Product Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5 bg-gradient-to-r from-[#171A30] to-[#111222] p-2.5 rounded-xl">
              <button 
                onClick={() => { setSelectedMaster(null); setBookingConfirmed(false); }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-[10px] flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" /> 
                <span>{lang === "zh" ? "返回常驻市集" : "Back to Mall"}</span>
              </button>
              <span className="font-mono text-[9px] text-teal-400 font-bold bg-teal-500/10 px-2.5 py-1 rounded border border-teal-500/10">
                ⭐ {lang === "zh" ? "商品详情" : "Spiritual Item Info"}
              </span>
            </div>

            {/* Product Image & Main Block */}
            <div className="bg-[#11162E] border border-white/5 rounded-2xl p-4 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#FFD166]/10 text-[#FFD166] text-[8px] font-mono px-3 py-1 rounded-bl-xl border-l border-b border-[#FFD166]/20 font-bold uppercase">
                {selectedMaster.salesCount}+ {lang === "zh" ? "人已结缘" : "Deliveries Saved"}
              </div>

              <div className="flex gap-4 items-center">
                <div className="text-4xl w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center select-none shadow">
                  {selectedMaster.avatar}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-display font-extrabold text-[#FFF] text-xs">{selectedMaster.name}</h3>
                    <ShieldCheck className="h-4 w-4 text-[#FFD166]" />
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-slate-400">
                    <span className="text-[#FFD166] font-bold">★ {selectedMaster.rating}</span>
                    <span>• {selectedMaster.reviewsCount} {lang === "zh" ? "条真实评价" : "Feedback logs"}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono leading-none">{selectedMaster.location}</p>
                </div>
              </div>

              {/* Tag Specialty Row */}
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

              {/* Biography tab item */}
              <div className="border-t border-white/[0.03] pt-3">
                <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider block mb-1">{lang === "zh" ? "宝贝详情/导师介绍" : "Spiritual Description / Bio"}</span>
                <p className="text-slate-300 text-[11px] leading-relaxed font-sans font-light">
                  {selectedMaster.bio}
                </p>
              </div>

              {/* Price Tag Box */}
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 bg-black/30 px-3.5 py-2.5 rounded-xl border border-white/[0.02]">
                <div className="flex items-baseline gap-1">
                  <span className="text-slate-500 text-[8px] uppercase">{lang === "zh" ? "结缘定价" : "Price"}</span>
                  <strong className="text-[#FFD166] text-sm font-bold">{selectedMaster.pricePerSession}</strong>
                  <span className="text-slate-500 text-[8px]">/ {lang === "zh" ? "每回推演" : "45Mins"}</span>
                </div>
                <span>Spoken: {selectedMaster.languages.join(", ")}</span>
              </div>
            </div>

            {/* PRODUCT ADD-TO-CART SECURE BOOKING SCHEDULER */}
            <div className="bg-[#11162E] border border-[#7C5CFF]/30 rounded-2xl p-4 space-y-4">
              <h3 className="font-display font-medium text-slate-200 text-xs uppercase tracking-wide flex items-center gap-1.5">
                🛍️ {lang === "zh" ? "选定您的结缘服务明细" : "Customize Consulting Specifications"}
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
                  <h4 className="font-display font-bold text-xs text-emerald-400">{lang === "zh" ? "结缘下单成功!" : "Order Placed Successfully!"}</h4>
                  <p className="text-slate-400 text-[10px] leading-relaxed max-w-xs mx-auto font-sans">
                    You booked <strong>{selectedMaster.name}</strong> on <strong className="text-slate-200">{bookingDate}</strong> at <strong className="text-slate-200">{bookingTime}</strong> on <strong className="text-slate-200 uppercase">{consultationMode}</strong>.
                  </p>
                  <span className="font-mono text-[8px] text-slate-500 block">Digital gateway invitation has been dispatched into your mail logs.</span>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Date */}
                    <div>
                      <label className="text-[9px] font-mono uppercase text-slate-400 block mb-1">Appointment Date</label>
                      <input 
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-[#05060C] border border-white/5 rounded-xl px-2.5 py-2 text-slate-300 font-mono text-[10px] focus:outline-none"
                      />
                    </div>

                    {/* Time */}
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

                  {/* Consultation Mode Specification */}
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

                  {/* Add to cart checkout direct booking trigger */}
                  <button
                    onClick={triggerBookSession}
                    className="w-full bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white font-mono text-[10px] font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <ShoppingBag className="h-4 w-4 text-glow" />
                    <span>{lang === "zh" ? "确认安全结缘下单" : "Finalize Karma Settlement"} ({selectedMaster.pricePerSession})</span>
                  </button>
                </div>
              )}
            </div>

            {/* VERIFIED GURU REVIEWS OR ONLINE COMMERCE FEEDBACK */}
            <div className="space-y-2.5">
              <h4 className="font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold px-1 flex justify-between">
                <span>💬 {lang === "zh" ? "缘主结缘评价" : "Buyer Feedback Logs"}</span>
                <span>Verified</span>
              </h4>
              {selectedMaster.reviews.map((rev, rIdx) => (
                <div key={rIdx} className="bg-white/[0.01] border border-white/5 rounded-xl p-3.5 space-y-1.5 text-left">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-300 font-semibold">{rev.reviewer}</span>
                    <span className="text-slate-500">{rev.date}</span>
                  </div>
                  <div className="flex gap-0.5 text-[#FFD166] text-xs leading-none">
                    {Array.from({ length: rev.stars }).map((_, s) => (
                      <span key={s}>★</span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
              ))}
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
            {/* Header: Search bar + Cart Drawer Indicator */}
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

              {/* Mall Search Box */}
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
                  placeholder={lang === "zh" ? "搜寻传承导师、神卜或缘契..." : "Search Gurus, tarot, bazi..."}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none w-full font-sans"
                />
              </div>

              {/* Shopping Cart Indicator */}
              <button
                onClick={() => setShowCartDrawer(!showCartDrawer)}
                className="cursor-pointer relative w-10 h-10 border border-white/5 bg-[#11162E] hover:border-[#7C5CFF]/30 rounded-xl flex items-center justify-center transition-all shrink-0 active:scale-95"
              >
                <ShoppingBag className="h-4 w-4 text-slate-300" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-mono font-bold text-[8px] h-4 w-4 rounded-full flex items-center justify-center border border-[#11162E] animate-bounce">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Shopping Cart Mini slide-in alerts */}
            <AnimatePresence>
              {showCartDrawer && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#1C1736] border border-[#7C5CFF]/30 rounded-2xl p-3 shrink-0"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-2">
                    <span className="text-[10px] font-mono text-slate-200 flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-[#FFD166]" /> 
                      {lang === "zh" ? "订单与预约明细" : "My Orders & Booked Services"}
                    </span>
                    <button 
                      onClick={() => setShowCartDrawer(false)}
                      className="text-[9px] font-mono text-slate-400 border border-white/10 px-1.5 py-0.2 rounded"
                    >
                      Hide
                    </button>
                  </div>
                  {cartItemsCount === 0 ? (
                    <p className="text-[10px] text-slate-400 italic text-center py-2.5">Your spiritual order bag is empty.</p>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-[9px] text-slate-200 font-sans leading-relaxed">
                        🛒 You have booked <strong className="text-glow">{cartItemsCount} sessions</strong> of private counseling lineages!
                      </p>
                      <span className="text-[8px] font-mono text-slate-500 block leading-none">Gateway invitations dispatched to user mail: housmanthay@gmail.com</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrolling Viewport Area */}
            <div className="flex-grow overflow-y-auto space-y-4 scrollbar-hidden pb-4">
              
              {activeSubPage === "lobby" ? (
                <>
                  {/* MALL PROMOTIONAL FLASH BANNER (促销横幅广告位) */}
                  <div className="bg-gradient-to-r from-purple-950 via-[#1C1736] to-slate-900 border border-[#7C5CFF]/30 rounded-2xl p-4 flex justify-between items-center relative overflow-hidden select-none">
                    {/* Decorative planetary background glow */}
                    <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#7C5CFF]/15 rounded-full blur-2xl"></div>
                    <div className="space-y-1 max-w-[70%]">
                      <span className="bg-[#FFD166]/15 text-[#FFD166] text-[8px] font-mono px-2 py-0.5 rounded border border-[#FFD166]/20 font-bold uppercase tracking-widest leading-none flex items-center gap-1">
                        <BadgePercent className="h-3.5 w-3.5" /> 618 Summer Solstice Flash Deal
                      </span>
                      <h3 className="font-display font-extrabold text-slate-100 text-[11px] leading-tight">
                        {lang === "zh" ? "宿命八字流年特惠：即刻尊享 15% 结缘折扣！" : "Align Your Elements: Get 15% OFF on Deep BaZi consults!"}
                      </h3>
                      <p className="font-mono text-[8px] text-slate-400">Coupon code: <strong className="text-[#FFD166]">KARMIC15</strong></p>
                    </div>
                    
                    <div className="w-14 h-14 rounded-full bg-[#FFD166]/10 border border-[#FFD166]/30 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[12px] font-mono text-[#FFD166] font-extrabold">-15%</span>
                      <span className="text-[6px] font-mono text-slate-400 cursor-pointer uppercase leading-none">Voucher</span>
                    </div>
                  </div>

                  {/* MASTER RECOMMENDATIONS CAROUSEL SLIDE (大师推荐大图卡片) */}
                  <div className="space-y-2 select-none" id="mall-recommends-section">
                    <div className="flex justify-between items-center px-1">
                      <span className={sizeClass("font-display font-bold text-[11px] text-[#A78BFA] uppercase tracking-wide flex items-center gap-1", "font-display font-black text-sm text-[#FFD166] uppercase tracking-wide flex items-center gap-1.5")}>
                        <Sparkles className="h-3.5 w-3.5 text-[#FFD166] animate-pulse" /> 
                        {lang === "zh" ? "神算名师 · 极力臻选" : "Top Chosen Masters"}
                      </span>
                      <span className="text-[8px] font-mono text-indigo-400">Premium Picks</span>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hidden">
                      {mastersList.slice(0, 2).map((master) => (
                        <div
                          key={`rec-${master.id}`}
                          onClick={() => setSelectedMaster(master)}
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

                  {/* MASTER RANKINGS BOARD (大师排行榜 - 热度/结缘排行) */}
                  <div className="bg-[#11162E] border border-white/5 rounded-2xl p-4 space-y-3 shadow-md" id="master-rankings-card">
                    <div className="flex justify-between items-center border-b border-white/[0.04] pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-[#FFD166]" />
                        <h4 className={sizeClass("font-display font-extrabold text-[#FFD166] text-xs", "font-display font-black text-base text-[#FFD166]")}>
                          {lang === "zh" ? "本周大德高功热度金榜" : "Weekly Divine Sages Honor Board"}
                        </h4>
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded">HOT LEADERBOARD</span>
                    </div>

                    <div className="space-y-2.5">
                      {mastersList.map((master, index) => {
                        const rankMedal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "✨";
                        const rankColor = index === 0 ? "text-[#FFD166]" : index === 1 ? "text-[#E2E8F0]" : index === 2 ? "text-[#CD7F32]" : "text-slate-500";
                        return (
                          <div 
                            key={`rank-${master.id}`}
                            onClick={() => setSelectedMaster(master)}
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
                                  <span>{lang === "zh" ? `${master.salesCount}次咨询` : `${master.salesCount} consultations`}</span>
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

                    {/* View All Masters next sub-page action button */}
                    <button
                      onClick={() => setActiveSubPage("all-masters")}
                      className="cursor-pointer w-full py-3 bg-[#1C1736] hover:bg-[#251F47] text-[#FFD166] hover:text-[#FFAE19] border border-[#7C5CFF]/30 hover:border-[#FFD166]/40 font-mono text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 transition-all active:scale-98 shadow-sm"
                    >
                      <span>{lang === "zh" ? "点击查看更多大德列表 → (下一页)" : "View All Spiritual Sages →"}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* CATEGORIES NAVIGATION ON SPECIFIC DIRECTORY SUB-PAGE */}
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

                  {/* MERCHANDISE DOUBLE-COLUMN APP GRID (双列商品布局流) */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 px-1">
                      <span>✨ {lang === "zh" ? "全境大德法师列表" : "All Spiritual Lineage Sages"} ({filteredMastersList.length})</span>
                      <span className="flex items-center gap-1 cursor-pointer hover:text-slate-300" onClick={() => setActiveSubPage("lobby")}><ArrowLeft className="h-3 w-3" /> {lang === "zh" ? "返回圣坛排行榜" : "Back to Rankings"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2">
                      {filteredMastersList.map((master) => (
                        <div
                          key={master.id}
                          onClick={() => setSelectedMaster(master)}
                          className="cursor-pointer bg-[#11162E] border border-white/5 hover:border-[#7C5CFF]/30 p-3.5 rounded-2xl transition duration-200 flex flex-col justify-between group relative overflow-hidden shadow-md flex-grow"
                        >
                          {/* Interactive flame badge icon */}
                          {master.isHot && (
                            <span className="absolute top-2 left-2 bg-rose-500/10 text-rose-400 font-mono text-[6px] px-1.5 py-0.5 rounded border border-rose-500/20 font-extrabold pb-0.2 select-none flex items-center gap-0.5">
                              <Flame className="h-2 w-2 text-glow" /> HOT SELLER
                            </span>
                          )}

                          {/* Cover container holding avatar */}
                          <div className="w-full bg-[#090D1C] rounded-xl py-3.5 flex items-center justify-center border border-white/[0.02] mb-3 shrink-0 relative">
                            <div className="text-4xl select-none group-hover:scale-105 transition-transform duration-200">
                              {master.avatar}
                            </div>
                            {/* Rating floating tag */}
                            <span className="absolute bottom-1 right-1.5 bg-black/60 text-[#FFD166] text-[7.5px] px-1 rounded-sm font-mono flex items-center gap-0.5 font-bold">
                              ★ {master.rating}
                            </span>
                          </div>

                          {/* Product Text info */}
                          <div className="text-left space-y-1 w-full">
                            <h3 className="font-display font-bold text-slate-100 text-[11px] truncate leading-none group-hover:text-[#FFD166] transition-all font-sans">
                              {master.name}
                            </h3>
                            <span className="font-mono text-[7px] text-slate-500 block uppercase leading-none tracking-widest truncate">{master.specialties[0]}</span>
                            
                            {/* Short snippet of Bio */}
                            <p className="text-slate-400 text-[9.5px] font-sans line-clamp-2 leading-relaxed pt-1 select-none pr-1">
                              {master.bio}
                            </p>
                          </div>

                          {/* Price-tag footer row */}
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

              {/* Bottom Marketplace Assurance Grid Footer */}
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
