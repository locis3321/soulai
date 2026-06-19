import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, Pause, FastForward, Rewind, RotateCcw, Volume2, 
  Smile, Heart, BookOpen, Clock, Trash2, Check, Sparkles, Moon, BarChart2, Activity, Music, Disc, ListMusic
} from "lucide-react";
import { MoodType, MoodCheckIn, HealingJournal, MeditationSession } from "../types";
import { MEDITATION_SESSIONS, DAILY_AFFIRMATIONS } from "../lib/constants";
import { TRANSLATIONS, LanguageKey } from "../lib/translations";

interface HealingViewProps {
  onAddJournal: (title: string, content: string, mood: MoodType) => void;
  journals: HealingJournal[];
  onDeleteJournal: (id: string) => void;
  lang: LanguageKey;
  largeTextMode?: boolean;
}

interface SleepStory {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  author: string;
}

export default function HealingView({ onAddJournal, journals, onDeleteJournal, lang, largeTextMode = false }: HealingViewProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  // Font sizing helper for Senior mode
  const sizeClass = (normal: string, large: string) => largeTextMode ? large : normal;
  
  // 1. Emotional mood checkin state
  const [activeMood, setActiveMood] = useState<MoodType | null>(null);
  const [checkedMoods, setCheckedMoods] = useState<MoodCheckIn[]>(() => {
    const local = localStorage.getItem("soul_moods");
    return local ? JSON.parse(local) : [
      { id: "cm-0", date: "2026-06-03", mood: "calm", timestamp: " morning" },
      { id: "cm-1", date: "2026-06-02", mood: "neutral", timestamp: " night" },
      { id: "cm-2", date: "2026-06-01", mood: "sad", timestamp: " afternoon" },
      { id: "cm-3", date: "2026-05-31", mood: "calm", timestamp: " evening" }
    ];
  });

  // 2. Affirmation randomized ticker
  const [affirmation, setAffirmation] = useState(DAILY_AFFIRMATIONS[0]);

  // 3. Animated Breathing Trainer states
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale" | "still">("still");
  const [breathSeconds, setBreathSeconds] = useState(0);

  // 4. Meditation & Sleep Story active tracks
  const sleepStories: SleepStory[] = [
    {
      id: "sleep-1",
      title: "The Temple of Constant Flow",
      description: "Sink into sleep under a quiet waterfall near a remote Northern Thailand Buddhist temple, guided by low-wave gong. Perfect for quieting a chattering mind.",
      duration: 300,
      author: "Zen Abbot Bodhi"
    },
    {
      id: "sleep-2",
      title: "Ascent to Mount Kailash",
      description: "A deep atmospheric journey trekking the cold, rhythmic winds of Mount Kailash. Blends soft cosmic synthesizers with gentle somatic breathing guidance.",
      duration: 420,
      author: "Master Li"
    }
  ];

  // Merge tracks into a single list or handle selection
  const allTracks = [...MEDITATION_SESSIONS, ...sleepStories];
  const [selectedMeditation, setSelectedMeditation] = useState<MeditationSession | SleepStory>(allTracks[0]);
  const [meditationProgress, setMeditationProgress] = useState(0);
  const [isMeditationPlaying, setIsMeditationPlaying] = useState(false);
  
  // Tabs representing different categories in a music app
  const [activeSubTab, setActiveSubTab] = useState<"meditation" | "sleep" | "trends">("meditation");

  // 5. Create Journal Form variables
  const [journalTitle, setJournalTitle] = useState("");
  const [journalContent, setJournalContent] = useState("");
  const [journalMood, setJournalMood] = useState<MoodType>("calm");

  // Load new daily affirmation on click
  const scrambleAffirmation = () => {
    const index = Math.floor(Math.random() * DAILY_AFFIRMATIONS.length);
    setAffirmation(DAILY_AFFIRMATIONS[index]);
  };

  // Persist mood checks
  useEffect(() => {
    localStorage.setItem("soul_moods", JSON.stringify(checkedMoods));
  }, [checkedMoods]);

  // Handle Mood click
  const handleMoodCheckIn = (mood: MoodType) => {
    setActiveMood(mood);
    const newCheck: MoodCheckIn = {
      id: `check-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      mood,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    
    // De-dupe check-ins for the same day
    const updated = checkedMoods.filter((m) => m.date !== newCheck.date);
    setCheckedMoods([newCheck, ...updated]);
  };

  // Breathing simulation tick loop (rhythmic Box Breathing 4-4-4-4)
  useEffect(() => {
    let breathTimer: NodeJS.Timeout;
    if (isBreathingActive) {
      breathTimer = setInterval(() => {
        setBreathSeconds((prev) => {
          const next = prev + 1;
          const phaseSec = next % 16;
          if (phaseSec < 4) {
            setBreathPhase("inhale");
          } else if (phaseSec < 8) {
            setBreathPhase("hold");
          } else if (phaseSec < 12) {
            setBreathPhase("exhale");
          } else {
            setBreathPhase("still");
          }
          return next;
        });
      }, 1000);
    } else {
      setBreathPhase("still");
      setBreathSeconds(0);
    }
    return () => clearInterval(breathTimer);
  }, [isBreathingActive]);

  // Track playback time countdown simulator
  useEffect(() => {
    let medTimer: NodeJS.Timeout;
    if (isMeditationPlaying && selectedMeditation) {
      medTimer = setInterval(() => {
        setMeditationProgress((prev) => {
          if (prev >= selectedMeditation.duration) {
            setIsMeditationPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(medTimer);
  }, [isMeditationPlaying, selectedMeditation]);

  const selectTrack = (track: MeditationSession | SleepStory) => {
    setSelectedMeditation(track);
    setMeditationProgress(0);
    setIsMeditationPlaying(true); // Auto-play on track select just like Spotify
  };

  const handleNextTrack = () => {
    const currentIndex = allTracks.findIndex(t => t.id === selectedMeditation.id);
    const nextIndex = (currentIndex + 1) % allTracks.length;
    selectTrack(allTracks[nextIndex]);
  };

  const handlePrevTrack = () => {
    const currentIndex = allTracks.findIndex(t => t.id === selectedMeditation.id);
    const prevIndex = currentIndex === 0 ? allTracks.length - 1 : currentIndex - 1;
    selectTrack(allTracks[prevIndex]);
  };

  const handleCreateJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle.trim() || !journalContent.trim()) return;

    onAddJournal(journalTitle, journalContent, journalMood);
    setJournalTitle("");
    setJournalContent("");
    setJournalMood("calm");
  };

  const moodEmojis: { [key in MoodType]: { emoji: string; text: string; bg: string; scale: number } } = {
    calm: { emoji: "😊", text: "Calm", bg: "hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-400", scale: 4 },
    neutral: { emoji: "😐", text: "Centered", bg: "hover:bg-slate-500/10 hover:border-slate-400/30 text-slate-300", scale: 3 },
    sad: { emoji: "😢", text: "Vulnerable", bg: "hover:bg-indigo-500/10 hover:border-indigo-500/30 text-[#A78BFA]", scale: 1 },
    angry: { emoji: "😡", text: "Intense", bg: "hover:bg-rose-500/10 hover:border-rose-500/30 text-rose-400", scale: 1 },
    tired: { emoji: "😴", text: "Exhausted", bg: "hover:bg-amber-500/10 hover:border-amber-500/30 text-amber-300", scale: 2 }
  };

  return (
    <div className={sizeClass("space-y-5 flex flex-col pb-4 h-full overflow-y-auto scrollbar-hidden", "space-y-8 flex flex-col pb-4 h-full overflow-y-auto scrollbar-hidden")} id="healing-view-container">
      
      {/* 1. Header with Ambient Mini Deck */}
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
        <div>
          <span className={sizeClass("font-mono text-[9px] text-teal-400 tracking-widest uppercase bg-teal-950/20 px-2.5 py-1 rounded-full border border-teal-500/20", "font-mono text-xs font-bold text-teal-300 tracking-widest uppercase bg-teal-950/30 px-3.5 py-1.5 rounded-full border border-teal-500/30")}>
            🌿 {lang === "zh" ? "禅音工坊" : "Healing Lounge"}
          </span>
          <h1 className={sizeClass("font-display text-xl font-bold text-slate-100 mt-2 select-none tracking-tight", "font-display text-2xl font-black text-slate-100 mt-3 select-none tracking-tight")}>
            {lang === "zh" ? "梵音大千疗愈静室" : "Cosmic Sound Sanctuary"}
          </h1>
        </div>
        <div className={sizeClass("flex items-center gap-1.5 font-mono text-[9px] text-[#FFD166] bg-[#FFD166]/10 px-2 rounded-full border border-[#FFD166]/20 py-0.5", "flex items-center gap-2 font-mono text-xs font-bold text-[#FFD166] bg-[#FFD166]/15 px-3 rounded-full border border-[#FFD166]/30 py-1.5")}>
          <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
          <span>Solfeggio 528Hz Active</span>
        </div>
      </div>

      {/* 2. MUSIC APP INTEGRATION: IMMERSIVE ACTIVE PLAYER DECK (Spotify Style) */}
      <div className="bg-gradient-to-b from-[#1C1736] via-[#111322] to-[#0A0D1A] border border-[#7C5CFF]/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden" id="premium-music-deck">
        
        {/* Background decorative sound glow */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#7C5CFF]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center">
          
          {/* Cover Art Stage: Spinning Vinyl / Celestial CD */}
          <div className="relative w-36 h-36 flex items-center justify-center mt-2.5 mb-4 group">
            {/* Spinning outward rings */}
            <div className="absolute inset-x-0 inset-y-0 rounded-full border border-dashed border-white/10 animate-[spin_40s_linear_infinite]"></div>
            
            <motion.div
              animate={isMeditationPlaying ? { rotate: 360 } : {}}
              transition={isMeditationPlaying ? { ease: "linear", duration: 12, repeat: Infinity } : {}}
              className="w-32 h-32 rounded-full bg-gradient-to-r from-slate-900 via-purple-950 to-slate-950 flex items-center justify-center shadow-2xl border-4 border-slate-950 relative overflow-hidden"
            >
              {/* Inner Vinyl Groove lines */}
              <div className="absolute inset-1.5 rounded-full border border-white/5 pointer-events-none"></div>
              <div className="absolute inset-4 rounded-full border border-white/10 pointer-events-none"></div>
              <div className="absolute inset-8 rounded-full border border-white/5 pointer-events-none"></div>
              
              {/* Central Album Pic Cover */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7C5CFF] to-teal-400 flex items-center justify-center text-xl shadow-inner relative z-10 border border-black/50">
                {selectedMeditation.id.includes("sleep") ? "🌙" : "🧘"}
              </div>

              {/* Center hole of CD */}
              <div className="w-3.5 h-3.5 rounded-full bg-[#0A0D1A] absolute z-20 border border-slate-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"></div>
            </motion.div>

            {/* Glowing active anchor */}
            {isMeditationPlaying && (
              <span className="absolute -top-1 -right-1 bg-teal-400 h-3 w-3 rounded-full animate-ping"></span>
            )}
          </div>

          {/* Metadata Display */}
          <div className="text-center w-full px-2">
            <span className={sizeClass("text-[8px] font-mono uppercase bg-[#7C5CFF]/20 text-[#A289FF] px-2.5 py-0.5 rounded-full tracking-widest font-semibold", "text-[11px] font-mono font-bold uppercase bg-[#7C5CFF]/30 text-star px-4.5 py-1 rounded-full tracking-wider")}>
              {selectedMeditation.id.includes("sleep") ? "Celestial Bedtime story" : "Somatic Buddha-Mind track"}
            </span>
            <h2 className={sizeClass("font-display font-bold text-slate-100 text-sm mt-2 truncate max-w-[280px]", "font-display font-black text-slate-100 text-lg mt-3 truncate max-w-[340px]")}>
              {selectedMeditation.title}
            </h2>
            <p className={sizeClass("font-sans text-[10px] text-slate-400 mt-0.5 leading-tight truncate", "font-sans text-xs font-semibold text-slate-300 mt-1 leading-normal truncate")}>
              {selectedMeditation.id.includes("sleep") ? (selectedMeditation as SleepStory).author : "Lineage Healer Counsel"}
            </p>
          </div>

          {/* Equalizer Wave Pattern (Only animate when playing) */}
          <div className={sizeClass("flex gap-1 items-end justify-center min-h-[22px] mt-3.5 mb-2 w-full", "flex gap-1.5 items-end justify-center min-h-[30px] mt-4 mb-2.5 w-full")}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((bar) => {
              const staticHeights = ["h-1", "h-2", "h-1.5", "h-3", "h-2", "h-1", "h-2.5", "h-3.5", "h-2", "h-1", "h-3", "h-1.5", "h-2", "h-1", "h-1.5"];
              return (
                <div
                  key={bar}
                  className={`w-1 rounded-t-full bg-gradient-to-t from-[#7C5CFF] to-teal-400 transition-all duration-300 ${
                    isMeditationPlaying
                      ? `animate-[bounce_0.8s_ease-in-out_infinite]`
                      : staticHeights[bar - 1]
                  }`}
                  style={{
                    animationDelay: isMeditationPlaying ? `${bar * 0.05}s` : undefined,
                    height: isMeditationPlaying ? `${Math.floor(Math.random() * 20) + 4}px` : undefined
                  }}
                />
              );
            })}
          </div>

          {/* Seek Progress Scrubber Bar */}
          <div className="w-full mt-2 px-1">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative cursor-pointer">
              <div 
                className="bg-gradient-to-r from-[#7C5CFF] to-teal-400 h-full transition-all duration-1000" 
                style={{ width: `${(meditationProgress / selectedMeditation.duration) * 100}%` }}
              />
            </div>
            <div className={sizeClass("flex justify-between font-mono text-[8px] text-slate-500 mt-1.5", "flex justify-between font-mono text-xs font-bold text-slate-400 mt-2")}>
              <span>{Math.floor(meditationProgress / 60)}:{(meditationProgress % 60).toString().padStart(2, "0")}</span>
              <span>{Math.floor(selectedMeditation.duration / 60)}:00</span>
            </div>
          </div>

          {/* Audio deck controller dashboard buttons */}
          <div className="flex items-center justify-center gap-8 mt-4.5 w-full">
            <button
              onClick={handlePrevTrack}
              title="Prev Track"
              className={sizeClass("p-2 rounded-full text-slate-400 hover:text-slate-100 transition hover:bg-white/5 active:scale-95", "p-3 rounded-full text-indigo-300 hover:text-white transition hover:bg-white/10 active:scale-95")}
            >
              <Rewind className={sizeClass("h-4.5 w-4.5", "h-6 w-6")} />
            </button>

            <button
              onClick={() => setIsMeditationPlaying(!isMeditationPlaying)}
              className={sizeClass(
                "w-12 h-12 rounded-full bg-[#7C5CFF] hover:bg-[#6D4AFF] text-slate-900 font-bold shadow-[0_0_15px_rgba(124,92,255,0.4)] flex items-center justify-center text-slate-100 transition transform hover:scale-105 active:scale-95",
                "w-16 h-16 rounded-full bg-[#7C5CFF] hover:bg-[#6D4AFF] text-slate-900 font-bold shadow-[0_0_20px_rgba(124,92,255,0.6)] flex items-center justify-center text-slate-100 transition transform hover:scale-105 active:scale-95"
              )}
            >
              {isMeditationPlaying ? (
                <Pause className={sizeClass("h-5 w-5 text-glow", "h-7 w-7 text-glow")} />
              ) : (
                <Play className={sizeClass("h-5 w-5 fill-slate-100 text-glow ml-0.5", "h-7 w-7 fill-slate-100 text-glow ml-1")} />
              )}
            </button>

            <button
              onClick={handleNextTrack}
              title="Next Track"
              className={sizeClass("p-2 rounded-full text-slate-400 hover:text-slate-100 transition hover:bg-white/5 active:scale-95", "p-3 rounded-full text-indigo-300 hover:text-white transition hover:bg-white/10 active:scale-95")}
            >
              <FastForward className={sizeClass("h-4.5 w-4.5", "h-6 w-6")} />
            </button>
          </div>

        </div>
      </div>

      {/* 3. MUSIC LIBRARY PLAYLIST TABS Selector */}
      <div className="space-y-3">
        <div className="flex border-b border-white/5 pb-2.5 justify-between items-center select-none">
          <div className="flex items-center gap-1 text-slate-300 font-display text-xs font-bold uppercase">
            <ListMusic className="h-3.5 w-3.5 text-[#7C5CFF]" />
            <span>{lang === "zh" ? "佛乐法音库" : "Sensory Tracks Library"}</span>
          </div>
          
          <div className="flex bg-[#0A0D1A]/80 border border-white/5 p-0.5 rounded-xl">
            <button
              onClick={() => setActiveSubTab("meditation")}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-tight transition-all duration-150 ${activeSubTab === "meditation" ? "bg-[#7C5CFF] text-[#090D1C] font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              🧘 Zen
            </button>
            <button
              onClick={() => setActiveSubTab("sleep")}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-tight transition-all duration-150 ${activeSubTab === "sleep" ? "bg-[#7C5CFF] text-[#090D1C] font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              🌙 Sleep
            </button>
            <button
              onClick={() => setActiveSubTab("trends")}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-tight transition-all duration-150 ${activeSubTab === "trends" ? "bg-[#7C5CFF] text-[#090D1C] font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              📈 Trends
            </button>
          </div>
        </div>

        {/* Tracks List Render block */}
        <div className="space-y-2">
          {activeSubTab === "meditation" && (
            <div className="space-y-2">
              {MEDITATION_SESSIONS.map((session) => {
                const isSelected = selectedMeditation.id === session.id;
                return (
                  <div
                    key={session.id}
                    onClick={() => selectTrack(session)}
                    className={`cursor-pointer p-3 border rounded-2xl transition-all flex items-center justify-between gap-3 group ${
                      isSelected 
                        ? "border-[#7C5CFF]/60 bg-[#1C1736]/60 shadow-[inset_0_1px_3px_rgba(255,255,255,0.05)]" 
                        : "border-white/5 bg-[#0D1126] hover:border-white/10 hover:bg-[#131936]"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs shrink-0 text-slate-300">
                        {isSelected && isMeditationPlaying ? (
                          <Activity className="h-4.5 w-4.5 text-teal-400 animate-pulse" />
                        ) : (
                          <Music className="h-4 w-4" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-display font-semibold text-slate-200 text-xs truncate group-hover:text-glow transition-all">{session.title}</h4>
                        <p className="text-slate-400 text-[9px] mt-0.5 line-clamp-1 leading-tight font-sans">
                          {session.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[9px] text-slate-400 shrink-0">
                      <span>{(session.duration / 60).toFixed(0)}m</span>
                      {isSelected && isMeditationPlaying ? (
                        <span className="text-teal-400 bg-teal-400/10 px-1 py-0.2 rounded font-bold">LIVE</span>
                      ) : (
                        <Play className="h-3 w-3 text-slate-500 hover:text-white" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeSubTab === "sleep" && (
            <div className="space-y-2">
              {sleepStories.map((story) => {
                const isSelected = selectedMeditation.id === story.id;
                return (
                  <div
                    key={story.id}
                    onClick={() => selectTrack(story)}
                    className={`cursor-pointer p-3 border rounded-2xl transition-all flex items-center justify-between gap-3 group ${
                      isSelected 
                        ? "border-[#7C5CFF]/60 bg-[#1C1736]/60 shadow-[inset_0_1px_3px_rgba(255,255,255,0.05)]" 
                        : "border-white/5 bg-[#0D1126] hover:border-white/10 hover:bg-[#131936]"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-[#FFD166]/10 flex items-center justify-center text-xs shrink-0 text-[#FFD166]">
                        {isSelected && isMeditationPlaying ? (
                          <Activity className="h-4.5 w-4.5 text-glow animate-pulse" />
                        ) : (
                          <Moon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-display font-semibold text-slate-200 text-xs truncate group-hover:text-glow transition-all">{story.title}</h4>
                        <p className="text-slate-400 text-[9px] mt-0.5 line-clamp-1 leading-tight font-sans">
                          {story.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[9px] text-slate-400 shrink-0">
                      <span>{(story.duration / 60).toFixed(0)}m</span>
                      {isSelected && isMeditationPlaying ? (
                        <span className="text-[#FFD166] bg-[#FFD166]/10 px-1 py-0.2 rounded font-bold">PLAY</span>
                      ) : (
                        <Play className="h-3 w-3 text-slate-500 hover:text-white" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeSubTab === "trends" && (
            <div className="bg-[#0D1126] border border-white/5 p-4 rounded-2xl space-y-3.5">
              <div className="flex justify-between items-center bg-white/[0.01] p-1.5 rounded-lg">
                <h4 className="font-display font-semibold text-xs text-slate-300 flex items-center gap-1.5">
                  <BarChart2 className="h-4 w-4 text-[#7C5CFF]" />
                  <span>Somatic Mood Flow Diagnostic</span>
                </h4>
                <span className="font-mono text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Auspicious</span>
              </div>

              {/* Responsive SVG mood waveform */}
              <div className="relative w-full h-24 bg-white/[0.01] border border-white/[0.03] rounded-xl p-2">
                <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                  <line x1="0" y1="10" x2="100" y2="10" stroke="white" strokeWidth="0.05" strokeDasharray="1,1" />
                  <line x1="0" y1="20" x2="100" y2="20" stroke="white" strokeWidth="0.05" strokeDasharray="1,1" />
                  <line x1="0" y1="30" x2="100" y2="30" stroke="white" strokeWidth="0.05" strokeDasharray="1,1" />
                  
                  <path
                    d="M 5,28 L 20,20 L 35,32 L 50,15 L 65,10 L 80,18 L 95,8"
                    fill="none"
                    stroke="url(#gradient-cosmos)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />

                  <defs>
                    <linearGradient id="gradient-cosmos" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7C5CFF" />
                      <stop offset="50%" stopColor="#FFD166" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>

                  <circle cx="5" cy="28" r="1.5" fill="#7C5CFF" className="animate-pulse" />
                  <circle cx="20" cy="20" r="1.5" fill="#7C5CFF" />
                  <circle cx="35" cy="32" r="1.5" fill="#7C5CFF" />
                  <circle cx="50" cy="15" r="1.5" fill="#FFD166" />
                  <circle cx="65" cy="10" r="1.5" fill="#FFD166" />
                  <circle cx="80" cy="18" r="1.5" fill="#10B981" />
                  <circle cx="95" cy="8" r="1.5" fill="#10B981" className="animate-pulse" />
                </svg>

                <div className="flex justify-between font-mono text-[7px] text-slate-500 mt-1">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-sans leading-relaxed px-1">
                {lang === "zh" ? "本周身心能量指数呈「平稳向合」状态。初期烦躁火元素已通过佛乐引导顺利回归中正地气，心神安宁。" : "Your somatic diagnostic indices chart a peaceful ascending frequency. Anxious indices represent balanced integration."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. MUSIC COMPANION INSTRUMENTS (调音工具): Mood, Breathing, Affirmations, Liners */}
      <div className="space-y-4 pt-2">
        <h3 className={sizeClass("text-xs font-semibold font-mono text-teal-400 tracking-wider uppercase border-b border-white/[0.04] pb-1", "text-sm font-bold font-mono text-teal-300 tracking-wider uppercase border-b border-white/[0.08] pb-1.5")}>
          ⚙️ {lang === "zh" ? "身心调音面板" : "Somatic Tuners Panel"}
        </h3>

        {/* A. Emotional Climate Checker */}
        <div className="bg-[#0D1126] border border-white/5 rounded-2xl p-4" id="emotional-checkin-widget">
          <h4 className={sizeClass("font-display text-xs font-semibold text-slate-300", "font-display text-sm font-bold text-slate-200")}>
            {lang === "zh" ? "调音：检查当前身心理想频率" : "Tuning: Your Emotional Base Pitch"}
          </h4>
          <p className={sizeClass("text-slate-400 text-[10px] mt-0.5 mb-3 leading-tight", "text-slate-300 text-xs mt-1 mb-4 leading-normal")}>
            Creates self-awareness to refine the healing audio synthesis.
          </p>

          <div className="grid grid-cols-5 gap-2.5">
            {(Object.keys(moodEmojis) as MoodType[]).map((mKey) => {
              const isChecked = activeMood === mKey || checkedMoods[0]?.mood === mKey;
              return (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => handleMoodCheckIn(mKey)}
                  className={`py-3.5 px-1 border rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${moodEmojis[mKey].bg} ${
                    isChecked 
                      ? "bg-white/10 border-star text-glow shadow-[0_0_15px_rgba(124,92,255,0.15)] scale-105" 
                      : "bg-white/[0.02] border-white/5"
                  }`}
                >
                  <span className={sizeClass("text-lg mb-0.5", "text-2xl mb-1")}>{moodEmojis[mKey].emoji}</span>
                  <span className={sizeClass("font-mono text-[8px] tracking-wider uppercase font-semibold", "font-mono text-[10px] tracking-wide uppercase font-bold")}>{mKey}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* B. Breath Metronome */}
        <div className="bg-[#0D1126] border border-white/5 rounded-2xl p-4 flex flex-col items-center" id="breathing-trainer">
          <div className="w-full text-left">
            <h4 className="font-display text-xs font-semibold text-slate-300">
              🌀 {lang === "zh" ? "节拍：止观呼吸谐振器" : "Tempo: Resonating Breath Sequencer"}
            </h4>
            <p className="text-slate-400 text-[10px] mt-0.5 mb-3 leading-tight">
              Calibrates heart-rate variability on a rhythmic 16s cycle.
            </p>
          </div>

          <div className="my-2 relative flex items-center justify-center w-28 h-28">
            <AnimatePresence>
              {isBreathingActive && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.3 }}
                  animate={{
                    scale: breathPhase === "inhale" ? 1.4 : breathPhase === "hold" ? 1.4 : breathPhase === "exhale" ? 0.9 : 0.8,
                    opacity: breathPhase === "hold" ? 0.6 : 0.3
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="absolute inset-x-0 inset-y-0 bg-[#7C5CFF]/10 rounded-full border border-star/20 blur-sm"
                />
              )}
            </AnimatePresence>

            <motion.div
              animate={{
                scale: breathPhase === "inhale" ? 1.25 : breathPhase === "hold" ? 1.25 : breathPhase === "exhale" ? 0.95 : 0.85,
                backgroundColor: breathPhase === "inhale" ? "#7C5CFF" : breathPhase === "hold" ? "#FFD166" : breathPhase === "exhale" ? "#10B981" : "#1C2344"
              }}
              transition={{ duration: 4, ease: "easeInOut" }}
              className="w-18 h-18 rounded-full flex flex-col items-center justify-center text-center shadow-lg relative z-10 border border-white/10"
            >
              <span className="font-mono text-[8px] uppercase font-bold tracking-widest text-[#090D1C] select-none">
                {breathPhase === "still" ? "STILL" : breathPhase}
              </span>
              {isBreathingActive && (
                <span className="font-display text-[10px] text-slate-900 font-bold mt-0.5">
                  {(breathSeconds % 4) + 1}s
                </span>
              )}
            </motion.div>
          </div>

          <span className="text-[10px] font-sans text-slate-400 block min-h-[16px] text-center my-1">
            {breathPhase === "still" && "Press start below to sync your lungs."}
            {breathPhase === "inhale" && "🌬️ Inhale deep cosmic energy..."}
            {breathPhase === "hold" && "🛑 Retain breath..."}
            {breathPhase === "exhale" && "🍃 Slow release of heavy thoughts..."}
          </span>

          <button
            onClick={() => setIsBreathingActive(!isBreathingActive)}
            className={`w-full py-2.5 rounded-xl font-mono text-[9px] font-semibold flex items-center justify-center gap-1.5 transition duration-200 border mt-2 ${
              isBreathingActive
                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                : "bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border-teal-500/30"
            }`}
          >
            {isBreathingActive ? "PAUSE PACER" : "START BREATH PACER"}
          </button>
        </div>

        {/* C. Affirmation liner notes */}
        <div className="bg-gradient-to-r from-[#171A30] to-[#0A0D1E] border border-[#7C5CFF]/30 rounded-2xl p-4 relative overflow-hidden" id="affirmation-widget">
          <span className="bg-[#7C5CFF]/20 text-[#AC96FF] font-mono text-[8px] px-2 py-0.5 rounded tracking-wider uppercase font-semibold">
            ✦ Spiritual Mantra Liner Notes
          </span>
          <p className="text-slate-200 text-xs italic font-sans leading-relaxed mt-2.5">
            &ldquo;{affirmation}&rdquo;
          </p>
          <button
            onClick={scrambleAffirmation}
            className="mt-3 text-[#FFD166] hover:text-white font-mono text-[9px] flex items-center gap-1"
          >
            ✦ Next Mantra Word →
          </button>
        </div>

        {/* D. Liner Notes & Reflective Journal Entry */}
        <div className="bg-[#0D1126] border border-white/5 rounded-2xl p-4 space-y-4" id="healing-journal-workspace">
          <div>
            <h4 className={sizeClass("font-display text-xs font-semibold text-slate-300", "font-display text-base font-bold text-slate-200")}>
              ✍️ {lang === "zh" ? "随笔：观心觉照修行日记" : "Reflection: Songwriting & Liner Notes"}
            </h4>
            <p className={sizeClass("text-slate-400 text-[10px] mt-0.5 mb-1.5 leading-tight", "text-slate-300 text-xs mt-1.5 mb-3 leading-normal")}>
              A locked digital diary to release somatic tension and register daily karma integration.
            </p>
          </div>

          <form onSubmit={handleCreateJournal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={sizeClass("text-slate-400 font-mono text-[8px] uppercase tracking-wider block mb-1", "text-slate-300 font-mono text-xs font-bold block mb-1.5")}>Journal Title</label>
                <input
                  type="text"
                  required
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  placeholder="e.g. Cleansing water..."
                  className={sizeClass(
                    "w-full bg-[#050714] border border-white/5 rounded-xl px-2.5 py-2 text-slate-200 text-xs focus:outline-none",
                    "w-full bg-[#050714] border border-white/10 rounded-xl px-3.5 py-3 text-slate-100 text-sm font-semibold focus:outline-none"
                  )}
                />
              </div>
              <div>
                <label className={sizeClass("text-slate-400 font-mono text-[8px] uppercase tracking-wider block mb-1", "text-slate-300 font-mono text-xs font-bold block mb-1.5")}>Session Pitch/Theme</label>
                <select
                  value={journalMood}
                  onChange={(e) => setJournalMood(e.target.value as MoodType)}
                  className={sizeClass(
                    "w-full bg-[#050714] border border-white/5 rounded-xl px-2.5 py-2 text-slate-200 text-[10px] focus:outline-none",
                    "w-full bg-[#050714] border border-white/10 rounded-xl px-3.5 py-3 text-slate-100 text-sm font-bold focus:outline-none"
                  )}
                >
                  <option value="calm">😊 Peaceful Calm</option>
                  <option value="neutral">😐 Centered Observation</option>
                  <option value="sad">😢 Sinking Grief</option>
                  <option value="angry">😡 Channeling Fire</option>
                  <option value="tired">😴 Decompressing</option>
                </select>
              </div>
            </div>

            <div>
              <label className={sizeClass("text-slate-400 font-mono text-[8px] uppercase tracking-wider block mb-1", "text-slate-300 font-mono text-xs font-bold block mb-1.5")}>Liner Notes Text</label>
              <textarea
                required
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                placeholder="Write your observation..."
                rows={2}
                className={sizeClass(
                  "w-full bg-[#050714] border border-white/5 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none",
                  "w-full bg-[#050714] border border-white/10 rounded-xl p-3.5 text-slate-100 text-sm font-semibold focus:outline-none"
                )}
              />
            </div>

            <button
              type="submit"
              className={sizeClass(
                "w-full bg-[#7C5CFF] hover:bg-[#6D4AFF] text-slate-100 py-2 rounded-xl text-xs font-mono font-semibold transition cursor-pointer",
                "w-full bg-[#7C5CFF] hover:bg-[#6D4AFF] text-slate-100 py-3.5 rounded-xl text-sm font-bold transition cursor-pointer"
              )}
            >
              Seal Liner Entry
            </button>
          </form>

          {/* Sealed logs folder */}
          <div className="border-t border-white/[0.04] pt-3.5 space-y-2">
            <h5 className={sizeClass("font-mono text-[9px] text-[#A78BFA] uppercase tracking-widest flex justify-between", "font-mono text-xs font-bold text-indigo-300 uppercase tracking-wider flex justify-between")}>
              <span>Sealed Notes Cache ({journals.length})</span>
              <span>Encrypted</span>
            </h5>
            
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 scrollbar-hidden">
              {journals.length === 0 ? (
                <p className={sizeClass("text-[10px] text-slate-600 italic py-2 text-center", "text-xs text-slate-400 font-bold italic py-3 text-center")}>No cached liner logs yet.</p>
              ) : (
                journals.map((ent) => (
                  <div key={ent.id} className="bg-[#050714] border border-white/5 rounded-xl p-2.5 relative">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-mono text-[7px] text-slate-500 block leading-none">{ent.date}</span>
                        <h4 className={sizeClass("font-display font-semibold text-slate-200 text-[11px] mt-1 select-all", "font-display font-extrabold text-slate-100 text-sm mt-1.5 select-all")}>{ent.title}</h4>
                      </div>
                      <button
                        onClick={() => onDeleteJournal(ent.id)}
                        className="text-slate-500 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className={sizeClass("text-slate-300 text-[10px] mt-1 pr-4 bg-white/[0.01] p-1.5 rounded select-text", "text-slate-200 text-sm font-semibold leading-relaxed mt-2 pr-4 bg-white/[0.02] p-2 rounded select-text")}>{ent.content}</p>
                    <div className={sizeClass("flex justify-between items-center text-[7px] font-mono text-slate-600 mt-2", "flex justify-between items-center text-[10px] font-mono text-slate-400 mt-2.5")}>
                      <span>MOOD: {ent.mood.toUpperCase()}</span>
                      <span className="text-teal-500">🔒 SECURED ENCLAVE</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
