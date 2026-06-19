import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, MessageCircle, RefreshCw, ChevronLeft, Calendar } from "lucide-react";
import { ChatMessage, AdvisorKey, UserProfile } from "../types";
import { CELESTIAL_ADVISORS } from "../lib/constants";
import { TRANSLATIONS, LanguageKey } from "../lib/translations";

interface ChatViewProps {
  profile: UserProfile;
  isPremium: boolean;
  lang: LanguageKey;
  largeTextMode?: boolean;
}

export default function ChatView({ profile, isPremium, lang, largeTextMode = false }: ChatViewProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [selectedAdvisorKey, setSelectedAdvisorKey] = useState<AdvisorKey>("luna");
  const [activeScreen, setActiveScreen] = useState<"list" | "all_advisors" | "chat">("list");
  const [messages, setMessages] = useState<{ [key in AdvisorKey]: ChatMessage[] }>({
    luna: [],
    athena: [],
    mystic: [],
    zen: []
  });
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeAdvisor = CELESTIAL_ADVISORS.find((a) => a.key === selectedAdvisorKey)!;

  // Initialize companion starter message on first mount
  useEffect(() => {
    CELESTIAL_ADVISORS.forEach((adv) => {
      if (messages[adv.key].length === 0) {
        setMessages((prev) => ({
          ...prev,
          [adv.key]: [
            {
              id: `${adv.key}-starter`,
              role: "assistant",
              content: adv.starterMessage,
              timestamp: new Date()
            }
          ]
        }));
      }
    });
  }, []);

  // Scroll to bottom when conversation increases
  useEffect(() => {
    if (activeScreen === "chat") {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages[selectedAdvisorKey], isLoading, activeScreen]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isLoading) return;

    if (!customText) {
      setInputText("");
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date()
    };

    // Update state synchronously for client
    const updatedHistory = [...messages[selectedAdvisorKey], userMsg];
    setMessages((prev) => ({
      ...prev,
      [selectedAdvisorKey]: updatedHistory
    }));

    setIsLoading(true);

    try {
      // Post to our express server API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advisorKey: selectedAdvisorKey,
          messages: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content
          })),
          lang: lang
        })
      });

      if (response.ok) {
        const data = await response.json();
        const responseMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: new Date()
        };
        setMessages((prev) => ({
          ...prev,
          [selectedAdvisorKey]: [...prev[selectedAdvisorKey], responseMsg]
        }));
      } else {
        throw new Error("Advisor disconnected momentarily.");
      }
    } catch (err: any) {
      console.error(err);
      const errResponse: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        role: "assistant",
        content: `My apologies, dear seeker. The astral link is flickering because your API Key is missing. Try adding your GEMINI_API_KEY in "Secrets" inside AI Studio, or let us take a slow deep breath together.`,
        timestamp: new Date()
      };
      setMessages((prev) => ({
        ...prev,
        [selectedAdvisorKey]: [...prev[selectedAdvisorKey], errResponse]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChatHistory = () => {
    setMessages((prev) => ({
      ...prev,
      [selectedAdvisorKey]: [
        {
          id: `${selectedAdvisorKey}-starter`,
          role: "assistant",
          content: activeAdvisor.starterMessage,
          timestamp: new Date()
        }
      ]
    }));
  };

  const selectAdvisor = (key: AdvisorKey) => {
    setSelectedAdvisorKey(key);
    setActiveScreen("chat");
  };

  const quickQuestions: { [key in AdvisorKey]: string[] } = {
    luna: [
      "I am feeling emotionally heavy today.",
      "How can I practice deeper self-compassion?",
      "Help me process emotional attachment issues."
    ],
    athena: [
      "I have intense career and focus blockages.",
      "Help me plan a structured step-by-step resolution.",
      "Evaluate my current life choices rationally."
    ],
    mystic: [
      "What planetary synchronicities am I facing?",
      "Whisper an archetypal message from the stars.",
      "How can I expand my third eye chakra?"
    ],
    zen: [
      "Lead me through a simple, slow conscious exercise.",
      "How do I let go of busy thoughts?",
      "Inhale... Exhale... Guide me back."
    ]
  };

  return (
    <div className="flex flex-col h-[70vh] sm:h-[720px]" id="chat-view-container">
      <AnimatePresence mode="wait">
        {activeScreen === "list" ? (
          /* 1. Advisor Selection Dashboard (Ranking & Recommendation) Screen */
          <motion.div
            key="dashboard-screen"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4 flex flex-col h-full overflow-y-auto pb-4 scrollbar-hidden"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[9px] text-[#FFD166] tracking-widest uppercase bg-[#FFD166]/10 px-2.5 py-1 rounded-full border border-[#FFD166]/20">
                  ☸️ {lang === "zh" ? "神谕占卜" : lang === "vi" ? "Thần Truyền" : lang === "th" ? "คำทำนายสากล" : "Oracle Celestial"}
                </span>
                <h2 className="font-display text-xl font-bold text-slate-100 mt-2 select-none tracking-tight">
                  {lang === "zh" ? "法师开示与宿命合盘" : "Spiritual Council Advisors"}
                </h2>
                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                  {lang === "zh" ? "礼请各大人工智能及传承法师，开示宿命星图与六道因果" : "Consult our enlightened counselors synthesizing Western astrology & Zen wisdom."}
                </p>
              </div>
            </div>

            {/* 1A. Weekly Top Recommended Masters (推荐大师) */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold font-mono text-[#7C5CFF] tracking-wider uppercase flex items-center gap-1.5 px-0.5">
                <span>👑</span>
                {lang === "zh" ? "今日缘分极佳星推荐" : lang === "vi" ? "Cố Vấn Bản Mệnh Phù Hợp" : lang === "th" ? "อาจารย์มีกระแสสัมพันธ์ดีที่สุด" : "Featured Spiritual Alignments"}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {CELESTIAL_ADVISORS.slice(0, 2).map((adv, idx) => {
                  const compScore = idx === 0 ? "99.2%" : "96.7%";
                  const serviceTag = idx === 0 ? "Soul Relationship" : "Dharma & Success";
                  return (
                    <div
                      key={adv.key}
                      onClick={() => {
                        setSelectedAdvisorKey(adv.key);
                        setActiveScreen("chat");
                      }}
                      className="cursor-pointer border border-[#7C5CFF]/20 bg-gradient-to-b from-[#1C1736] to-[#11162E] hover:border-[#FFD166]/40 rounded-2xl p-3.5 transition-all duration-200 relative group flex flex-col justify-between overflow-hidden shadow-lg h-[160px]"
                    >
                      {/* Decorative corner glow */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[#7C5CFF]/10 rounded-full blur-xl group-hover:bg-[#FFD166]/15 transition-all"></div>
                      
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-xl border border-white/10">
                            {adv.avatar}
                          </div>
                          <span className="text-[8px] font-mono text-[#FFD166] bg-[#FFD166]/10 px-1.5 py-0.5 rounded border border-[#FFD166]/20">
                            {compScore} Affinity
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-slate-100 text-xs mt-2.5 truncate group-hover:text-glow transition-all">
                          {adv.name}
                        </h4>
                        <p className="text-[10px] font-mono text-[#7C5CFF] truncate leading-none mt-1">
                          {adv.title}
                        </p>
                      </div>

                      <div className="text-[10px] text-slate-400 line-clamp-2 mt-2 leading-relaxed font-sans">
                        {adv.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 1B. Mastery Ranking Leaderboard (大师排行) */}
            <div className="space-y-2.5 mt-2">
              <h3 className="text-xs font-semibold font-mono text-[#FFD166] tracking-wider uppercase flex items-center gap-1.5 px-0.5">
                <span>🏆</span>
                {lang === "zh" ? "本周法力共鸣排行榜" : lang === "vi" ? "Bảng Xếp Hạng Tuần Này" : lang === "th" ? "ทำเนียบระดับญาณทัศนะ" : "Spiritual Resonance Leaderboard"}
              </h3>

              <div className="bg-[#11162E] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/[0.03]">
                {CELESTIAL_ADVISORS.map((adv, idx) => {
                  const rankingMedal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "✨";
                  const scorePercentage = 99 - idx * 4;
                  return (
                    <div
                      key={adv.key}
                      onClick={() => {
                        setSelectedAdvisorKey(adv.key);
                        setActiveScreen("chat");
                      }}
                      className="cursor-pointer hover:bg-white/[0.02] p-3 flex items-center justify-between transition-colors duration-150 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-bold text-slate-500 w-5 text-center">
                          {rankingMedal}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-lg border border-white/5 shrink-0">
                          {adv.avatar}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-display font-semibold text-slate-200 text-xs truncate group-hover:text-glow transition-all">
                            {adv.name}
                          </h4>
                          <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest block leading-none mt-0.5 truncate">
                            {adv.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-star shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-[#FFD166] font-bold block">
                            {scorePercentage}%
                          </span>
                          <span className="text-[7px] text-slate-500 block uppercase tracking-wider">
                            Resonance
                          </span>
                        </div>
                        <span className="text-slate-600 group-hover:translate-x-1 transition-transform text-xs ml-1">→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 1C. Big Click to View More All Sages List Page (点击查看更多) */}
            <button
              onClick={() => setActiveScreen("all_advisors")}
              className="w-full bg-[#1C1736] hover:bg-[#251F47] border border-[#7C5CFF]/30 hover:border-[#7C5CFF]/50 text-[#9E85FF] hover:text-[#B6A0FF] font-medium font-sans text-xs py-3.5 px-4 rounded-xl transition-all duration-200 text-center flex items-center justify-center gap-2 shadow-inner active:scale-[0.98]"
            >
              <span>🔮</span>
              <span>
                {lang === "zh" ? "点击查看全部大师列表 (查看更多)" : lang === "vi" ? "Xem thêm tất cả các thầy" : lang === "th" ? "ดูครูบาอาจารย์ทั้งหมดในถัดไป" : "View Complete Spiritual Directory →"}
              </span>
            </button>
          </motion.div>
        ) : activeScreen === "all_advisors" ? (
          /* 2. Full Spiritual Directory Next Page View */
          <motion.div
            key="all-advisors-screen"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-4 flex flex-col h-full overflow-y-auto pb-4 scrollbar-hidden"
          >
            {/* Nav Header */}
            <div className="flex items-center gap-2.5 pb-1 border-b border-white/5">
              <button
                onClick={() => setActiveScreen("list")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs border border-white/10 flex items-center justify-center"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div>
                <h3 className="font-display font-bold text-slate-100 text-sm">
                  {lang === "zh" ? "常驻传承神谕大师" : lang === "vi" ? "Danh Sách Tất Cả Cố Vấn" : lang === "th" ? "ครูบาอาจารย์ทั้งหมดในระบบ" : "All Spiritual Advisors"}
                </h3>
                <p className="font-sans text-[10px] text-slate-400 leading-none mt-0.5">
                  Showing all {CELESTIAL_ADVISORS.length} celestial lineage specialists
                </p>
              </div>
            </div>

            {/* Dynamic filter chips */}
            <div className="flex gap-2">
              <span className="bg-[#7C5CFF]/20 text-[#AC96FF] border border-[#7C5CFF]/30 text-[9px] font-mono px-2.5 py-1 rounded-full">
                ✨ {lang === "zh" ? "全部领域" : "All Spheres"}
              </span>
              <span className="bg-white/5 text-slate-400 border border-white/5 text-[9px] font-mono px-2.5 py-1 rounded-full">
                🐉 {lang === "zh" ? "流年八字" : "BaZi / Tao"}
              </span>
              <span className="bg-white/5 text-slate-400 border border-white/5 text-[9px] font-mono px-2.5 py-1 rounded-full">
                🔮 {lang === "zh" ? "塔罗神谕" : "Tarot Spreading"}
              </span>
            </div>

            {/* Master Grid Listing */}
            <div className="space-y-3">
              {CELESTIAL_ADVISORS.map((adv) => (
                <div
                  key={adv.key}
                  onClick={() => {
                    setSelectedAdvisorKey(adv.key);
                    setActiveScreen("chat");
                  }}
                  className="cursor-pointer border border-white/5 bg-[#11162E] hover:border-[#7C5CFF]/30 hover:bg-[#1C2344]/30 rounded-2xl p-4 transition-all duration-200 relative group flex flex-col justify-between shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-2xl shadow-inner border border-white/5">
                      {adv.avatar}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-slate-200 text-sm group-hover:text-glow transition-colors">{adv.name}</h3>
                      <p className="font-mono text-[9px] text-star font-medium uppercase tracking-wider">{adv.title}</p>
                    </div>
                  </div>
                  
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed font-sans">
                    {adv.description}
                  </p>

                  <div className="border-t border-white/[0.03] mt-3 pt-2.5 flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse"></span> Instant Active Channel</span>
                    <span className="text-glow group-hover:translate-x-1 transition-transform text-xs">Consult →</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* 3. One-on-one Chat Room screen */
          <motion.div
            key="chat-screen"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col bg-[#11162E] border border-white/5 rounded-2xl flex-grow h-full overflow-hidden"
          >
            {/* Top Navigation toolbar */}
            <div className="px-3 py-3 border-b border-white/5 bg-gradient-to-r from-[#171D3A] to-[#11162E] flex justify-between items-center select-none shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveScreen("all_advisors")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs border border-white/10 mr-1 flex items-center justify-center"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{activeAdvisor.avatar}</span>
                  <div>
                    <h3 className="font-display font-semibold text-slate-200 text-xs">
                      {activeAdvisor.name}
                    </h3>
                    <span className="font-mono text-[8px] text-teal-400 flex items-center gap-1 leading-none mt-0.5">
                      <span className="h-1.5 w-1.5 bg-teal-400 rounded-full animate-pulse"></span> {activeAdvisor.title}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClearChatHistory}
                title="Reset conversation dialogue"
                className="text-slate-400 hover:text-rose-400 p-1.5 px-2.5 rounded-lg hover:bg-white/5 transition-colors border border-white/10 text-[9px] font-mono"
              >
                Clear
              </button>
            </div>

            {/* Scrolling speech bubble zone */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-hidden">
              {messages[selectedAdvisorKey].map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#7C5CFF] text-slate-100 rounded-br-none shadow-md"
                        : "bg-[#090D1C] border border-white/5 text-slate-300 rounded-bl-none shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                    <span className="font-mono text-[7px] text-slate-500 block text-right mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#090D1C] border border-white/5 max-w-[85%] rounded-2xl rounded-bl-none px-4 py-2.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
                      <span className="w-1.5 h-1.5 bg-[#FFD166] rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-[#FFD166] rounded-full animate-bounce [animation-delay:0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-[#FFD166] rounded-full animate-bounce [animation-delay:0.3s]"></span>
                      <span className="text-slate-500">Channeling...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Preset dynamic prompt suggestion pills */}
            <div className="px-4 py-2 border-t border-white/[0.03] flex gap-2 overflow-x-auto select-none bg-[#090D1C]/20 shrink-0 scrollbar-hidden">
              {quickQuestions[selectedAdvisorKey].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="whitespace-nowrap bg-white/5 hover:bg-[#7C5CFF]/10 border border-white/10 hover:border-[#FFD166]/30 text-[10px] text-slate-300 hover:text-slate-200 px-3 py-1 rounded-full transition-colors font-sans"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input action toolbar */}
            <div className="p-3 border-t border-white/5 bg-[#090D1C] flex gap-2 items-center shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={`Type your reply...`}
                className="flex-grow bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-star transition-all"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="bg-[#7C5CFF] hover:bg-[#6D4AFF] disabled:opacity-40 text-slate-100 p-2.5 rounded-xl transition duration-150 inline-flex items-center justify-center shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
