import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Heart, Bookmark, Share2, Plus, Sparkles, Send, ArrowLeft, Eye, MessageCircle } from "lucide-react";
import { UserProfile } from "../types";
import { TRANSLATIONS, LanguageKey } from "../lib/translations";

interface CommunityViewProps {
  profile: UserProfile;
  lang: LanguageKey;
  largeTextMode?: boolean;
}

interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorCoords: string;
  category: "astrology" | "tarot" | "bazi" | "ziwei" | "healing" | "relationships";
  time: string;
  title: string;
  content: string;
  likes: number;
  commentsCount: number;
  bookmarked: boolean;
  liked: boolean;
  commentsList: { author: string; avatar: string; content: string; time: string }[];
}

export default function CommunityView({ profile, lang, largeTextMode = false }: CommunityViewProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  
  // Sizing helper for Senior Mode
  const sizeClass = (normal: string, large: string) => largeTextMode ? large : normal;

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // New Post Draft states
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftCategory, setDraftCategory] = useState<Post["category"]>("astrology");

  // Typed Comment state
  const [commentText, setCommentText] = useState("");

  const [posts, setPosts] = useState<Post[]>([
    {
      id: "post-1",
      authorName: "Sirena Star",
      authorAvatar: "🔮",
      authorCoords: "Bangkok ✦ Taurus Sun",
      category: "tarot",
      time: "24m ago",
      title: "Three of Swords in career spread: Is it always bad?",
      content: "Practitioners, I keeps drawing the Three of Swords regarding my professional trajectory. Does this strictly state an upcoming layoff, or could it mean cutting cord boundaries to establish healthy creative agency? Welcome your perspectives! Let me know.",
      likes: 42,
      commentsCount: 3,
      bookmarked: false,
      liked: false,
      commentsList: [
        { author: "Zen Master Ananda", avatar: "🧘", content: "Recall the law of impermanence. The sword pierces the heart only so the stale, stale breath of attachment can exhale.", time: "18m ago" },
        { author: "Li BaZi Patriarch", avatar: "🐉", content: "Depends on whether your Day Master is Wood or Metal. For wood, cutting blades might prune excessive growth to yield focus.", time: "11m ago" },
        { author: "Sophia Light", avatar: "🌟", content: "I drew this right before switching career paths with complete satisfaction! It means release of professional attachment.", time: "4m ago" }
      ]
    },
    {
      id: "post-2",
      authorName: "Giacomo Sky",
      authorAvatar: "🪐",
      authorCoords: "Singapore ✦ Scorpio Asc",
      category: "astrology",
      time: "2h ago",
      title: "Pluto in Aquarius: Ground-shaking career transformations",
      content: "Currently observing massive alignment shifts as Pluto settles into Aquarius. Anyone experiencing a complete vocational reset? It feels like old corporate structures are crumbling around us. Let's trade notes below.",
      likes: 76,
      commentsCount: 2,
      bookmarked: true,
      liked: true,
      commentsList: [
        { author: "Artemis Silver", avatar: "🌙", content: "My exact 10th house is being conjuncted! I left banking to launch a spiritual wellness sanctuary last month.", time: "1h ago" },
        { author: "Zen Master Bodhi", avatar: "🏯", content: "When the outer castle falls, the inner temple is finally built. No fears.", time: "30m ago" }
      ]
    },
    {
      id: "post-3",
      authorName: "Minh Duc",
      authorAvatar: "🐉",
      authorCoords: "Hanoi ✦ Wood Dragon",
      category: "bazi",
      time: "5h ago",
      title: "Bing Wu (Fire Horse) year guidelines for Earth Master",
      content: "For companions who have Earth (Ji/Wu) Day Masters: This current Hot Fire Horse flow stimulates your raw Direct Resource forces. It brings deep mental breakthroughs, but watch out for liver exhaustion or high stress indices. Drink more warm herbal infusions and practice grounding somatic walks.",
      likes: 122,
      commentsCount: 1,
      bookmarked: false,
      liked: false,
      commentsList: [
        { author: "Nongnoot P.", avatar: "🪷", content: "In Thailand we are preparing summer water therapies! Extremely helpful guidance Minh Duc.", time: "2h ago" }
      ]
    }
  ]);

  const categories = [
    { key: "all", label: "🌐 All Feeds", desc: lang === "zh" ? "探索社区所有讨论频道" : "Explore all discussions across nodes" },
    { key: "astrology", label: "🪐 Astrology", desc: lang === "zh" ? "星盘相位、星座运势分析" : "Planetary movements & alignments" },
    { key: "tarot", label: "🔮 Tarot", desc: lang === "zh" ? "塔罗牌阵、潜意识觉察" : "Card spreads & archetypes" },
    { key: "bazi", label: "🐉 BaZi", desc: lang === "zh" ? "生辰八字、五行流年开运" : "Four Pillars & seasonal flow" },
    { key: "ziwei", label: "☸️ Zi Wei", desc: lang === "zh" ? "紫微斗数、命格玄微批注" : "Purple Star house predictions" },
    { key: "healing", label: "🌿 Healing", desc: lang === "zh" ? "音疗冥想、止止双建共修" : "Somatic integration & wellness" },
    { key: "relationships", label: "💕 Love", desc: lang === "zh" ? "缘分合婚、亲密关系调频" : "Compatibility & ties" }
  ];

  const handleLike = (postId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newLiked = !p.liked;
          return {
            ...p,
            liked: newLiked,
            likes: newLiked ? p.likes + 1 : p.likes - 1
          };
        }
        return p;
      })
    );
  };

  const handleBookmark = (postId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, bookmarked: !p.bookmarked };
        }
        return p;
      })
    );
  };

  const publishDraftPost = () => {
    if (!draftTitle.trim() || !draftContent.trim()) return;

    const newPost: Post = {
      id: `draft-${Date.now()}`,
      authorName: profile.name || "Seer",
      authorAvatar: "☸️",
      authorCoords: "Local Coordinates ✦ Level 1",
      category: draftCategory,
      time: "Just now",
      title: draftTitle,
      content: draftContent,
      likes: 1,
      commentsCount: 0,
      bookmarked: false,
      liked: true,
      commentsList: []
    };

    setPosts([newPost, ...posts]);
    setDraftTitle("");
    setDraftContent("");
    setShowDraftModal(false);
  };

  const submitComment = () => {
    if (!commentText.trim() || !selectedPost) return;

    const newComment = {
      author: profile.name || "Seer",
      avatar: "👤",
      content: commentText,
      time: "Just now"
    };

    // Update active post in posts array
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === selectedPost.id) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            commentsList: [...p.commentsList, newComment]
          };
        }
        return p;
      })
    );

    // Update locally opened model state as well
    setSelectedPost((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        commentsCount: prev.commentsCount + 1,
        commentsList: [...prev.commentsList, newComment]
      };
    });

    setCommentText("");
  };

  const filteredPosts = activeCategory === "all" 
    ? posts 
    : posts.filter((p) => p.category === activeCategory);

  return (
    <div className="space-y-6" id="community-view-sandbox">
      <AnimatePresence mode="wait">
        
        {/* POST DETAIL VIEW (SECONDARY SCREEN WITHIN TAB) */}
        {selectedPost ? (
          <motion.div
            key="detail-screen"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            {/* Header back button */}
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <button 
                onClick={() => setSelectedPost(null)}
                className="p-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-[10px] flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Feed
              </button>
              <span className="font-mono text-[10px] uppercase text-[#7C5CFF]/80">✦ Discussions Detail</span>
            </div>

            {/* Main Post Card */}
            <div className="bg-[#11162E] border border-white/5 p-5 rounded-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-2.5 items-center">
                  <div className="text-2xl bg-white/5 p-1.5 rounded-lg">{selectedPost.authorAvatar}</div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-slate-100">{selectedPost.authorName}</h4>
                    <p className="text-[9px] font-mono text-slate-500">{selectedPost.authorCoords}</p>
                  </div>
                </div>
                <span className="bg-[#7C5CFF]/10 text-[#7C5CFF] text-[9px] font-mono px-2 py-0.5 rounded uppercase font-semibold">
                  {selectedPost.category}
                </span>
              </div>

              <div>
                <h3 className="font-display font-extrabold text-sm text-slate-100 mt-1">{selectedPost.title}</h3>
                <p className="text-slate-300 text-xs mt-2.5 leading-relaxed font-sans font-light bg-[#090D1C]/20 p-3 rounded-xl border border-white/[0.02]">
                  {selectedPost.content}
                </p>
              </div>

              <div className="flex justify-between items-center text-slate-400 text-xs border-t border-white/5 pt-3.5">
                <button 
                  onClick={() => handleLike(selectedPost.id)}
                  className={`flex items-center gap-1.5 p-1 px-2.5 rounded-lg transition-colors ${selectedPost.liked ? "text-glow bg-glow/5" : "hover:text-slate-100 bg-white/0"}`}
                >
                  <Heart className={`h-3.5 w-3.5 ${selectedPost.liked ? "fill-glow text-glow" : ""}`} />
                  <span className="font-mono text-[10px] font-semibold">{selectedPost.likes}</span>
                </button>

                <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                  <MessageSquare className="h-3.5 w-3.5" /> {selectedPost.commentsCount}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleBookmark(selectedPost.id)}
                    className={`p-1.5 rounded-lg transition-colors ${selectedPost.bookmarked ? "text-[#FFD166] bg-[#FFD166]/10" : "hover:text-slate-200"}`}
                  >
                    <Bookmark className={`h-3.5 w-3.5 ${selectedPost.bookmarked ? "fill-[#FFD166]" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Comment Input form */}
            <div className="bg-[#11162E] border border-white/5 p-4 rounded-xl">
              <h4 className="font-display text-xs text-slate-300 font-bold mb-2 uppercase tracking-wider block">Add your counsel to conversation</h4>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Share your spiritual perspective..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-[#090D1C] border border-white/10 rounded-xl px-3.5 py-2.5 pr-12 text-slate-200 text-xs focus:outline-none focus:border-[#7C5CFF]"
                />
                <button
                  onClick={submitComment}
                  className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-[#7C5CFF] text-[#090D1C] font-semibold"
                >
                  <Send className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-2.5">
              <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Responses ({selectedPost.commentsList.length})</h4>
              {selectedPost.commentsList.length > 0 ? (
                selectedPost.commentsList.map((comment, idx) => (
                  <div key={idx} className="bg-white/[0.01] border border-white/5 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{comment.avatar}</span>
                        <span className="font-display font-medium text-xs text-slate-200">{comment.author}</span>
                      </div>
                      <span className="font-mono text-[8px] text-slate-500">{comment.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed pl-1">
                      {comment.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border border-dashed border-white/5 rounded-xl text-slate-600 text-xs font-mono">
                  No responses offered yet. Start the dialogue!
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          
          /* GENERAL DISCUSSION FEED HOME SCREEN */
          <motion.div
            key="feed-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header Title */}
            <div className="border-b border-white/5 pb-4 flex justify-between items-center">
              <div>
                <span className="font-mono text-[10px] text-[#7C5CFF] tracking-widest uppercase">🌿 Collective Council</span>
                <h1 className="font-display text-2xl font-bold text-slate-100 mt-0.5 flex items-center gap-1.5">
                  Spiritual Community
                </h1>
                <p className="text-slate-400 text-xs mt-0.5 pr-8 leading-snug">
                  Align, trade insights, and counsel other seekers across Southeast Asian nodes.
                </p>
              </div>

              {/* Float Posting Button */}
              <button 
                onClick={() => setShowDraftModal(true)}
                className="cursor-pointer p-3 rounded-full bg-[#7C5CFF] text-[#090D1C] font-semibold hover:bg-[#6D4AFF] transition-all shadow-[0_0_15px_rgba(124,92,255,0.4)] whitespace-nowrap"
              >
                <Plus className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Category selection navigation cards deck */}
            <div className={sizeClass("grid grid-cols-2 gap-3 pb-2", "grid grid-cols-1 gap-4 pb-3")} id="category-navigation-deck">
              {categories.map((cat) => {
                const active = activeCategory === cat.key;
                
                // Extract visual parts for the cards
                const labelText = cat.label.replace(/^[\p{Emoji}\s]+/u, ""); // Removes leading emojis
                const labelEmoji = cat.label.match(/^[\p{Emoji}\s]+/u)?.[0]?.trim() || "🔮";
                
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveCategory(cat.key)}
                    className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border text-left flex items-start gap-3.5 relative overflow-hidden group select-none ${
                      active
                        ? "bg-gradient-to-tr from-[#1D173A] to-[#12163E] border-[#7C5CFF] text-[#FFD166] shadow-[0_4px_12px_rgba(124,92,255,0.25)] scale-[1.01]"
                        : "bg-[#11162E] hover:bg-[#1C2344]/40 text-slate-400 border-white/5 hover:border-white/10"
                    }`}
                  >
                    {/* Background visual overlay effect for active card */}
                    {active && (
                      <div className="absolute top-0 right-0 w-16 h-16 bg-[#7C5CFF]/15 rounded-full blur-xl pointer-events-none"></div>
                    )}
                    
                    <span className={sizeClass("text-xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] shrink-0 mt-0.5", "text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] shrink-0 mt-0.5")}>
                      {labelEmoji}
                    </span>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={sizeClass("font-display font-bold text-xs text-slate-100 truncate group-hover:text-[#FFD166] transition-colors", "font-display font-black text-sm text-slate-200 truncate group-hover:text-[#FFD166] transition-colors")}>
                          {labelText}
                        </span>
                        
                        <span className={`text-[8px] font-mono shrink-0 px-1.5 py-0.2 rounded font-semibold ${
                          active 
                            ? "bg-[#FFD166]/20 text-[#FFD166]" 
                            : "bg-white/5 text-slate-500"
                        }`}>
                          {active ? "ACTIVE" : "9k+"}
                        </span>
                      </div>
                      
                      <p className={sizeClass("text-[10px] text-slate-400 mt-1 leading-snug line-clamp-1", "text-xs font-semibold text-slate-300 mt-1 leading-normal line-clamp-2")}>
                        {cat.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Show draft post drafting triggers */}
            {showDraftModal && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#11162E] border border-[#7C5CFF]/30 p-5 rounded-2xl space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-display font-extrabold text-sm text-[#FFD166]">Draft New Cosmic Post</h4>
                  <button onClick={() => setShowDraftModal(false)} className="text-slate-500 hover:text-slate-300 font-mono text-[10px] border border-white/10 px-2 py-0.5 rounded">Cancel</button>
                </div>

                <div className="space-y-3">
                  {/* Category switcher */}
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-[9px] text-slate-400 uppercase">Target Channel:</span>
                    <select
                      value={draftCategory}
                      onChange={(e) => setDraftCategory(e.target.value as Post["category"])}
                      className="bg-[#090D1C] border border-white/10 rounded px-2.5 py-1 text-slate-300 font-mono text-[10px]"
                    >
                      <option value="astrology">🪐 Astrology</option>
                      <option value="tarot">🔮 Tarot</option>
                      <option value="bazi">🐉 BaZi</option>
                      <option value="ziwei">☸️ Zi Wei</option>
                      <option value="healing">🌿 Healing</option>
                      <option value="relationships">💕 Love</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder="Short engaging title..."
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    className="w-full bg-[#090D1C] border border-white/10 p-2.5 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-[#7C5CFF]"
                  />

                  <textarea
                    placeholder="Pour down your vulnerable thoughts or alignment question..."
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    rows={4}
                    className="w-full bg-[#090D1C] border border-white/10 p-3 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-[#7C5CFF] resize-none"
                  />

                  <button
                    onClick={publishDraftPost}
                    className="w-full py-2 bg-[#7C5CFF] hover:bg-[#6D4AFF] text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                  >
                    Publish Post to Community Node <Sparkles className="h-3 w-3 text-glow" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* List of Community Posts */}
            <div className="space-y-4">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="cursor-pointer bg-[#11162E] border border-white/5 hover:border-[#7C5CFF]/30 p-4 rounded-xl transition duration-300 space-y-3 relative overflow-hidden group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-2 items-center">
                        <div className={sizeClass("text-xl bg-white/5 p-1 rounded-lg select-none", "text-2xl bg-white/5 p-2 rounded-lg select-none")}>{post.authorAvatar}</div>
                        <div>
                          <h4 className={sizeClass("font-display font-semibold text-xs text-slate-200 truncate max-w-[150px]", "font-display font-bold text-sm text-slate-100 truncate max-w-[200px]")}>{post.authorName}</h4>
                          <p className={sizeClass("text-[8px] font-mono text-slate-500 leading-tight", "text-[10px] font-mono text-slate-400 font-bold leading-tight")}>{post.authorCoords}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={sizeClass("font-mono text-[8px] text-slate-500", "font-mono text-[10px] text-slate-400 font-bold")}>{post.time}</span>
                        <span className="bg-[#7C5CFF]/10 text-[#7C5CFF]/90 text-[8px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                          {post.category}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className={sizeClass("font-display font-bold text-xs text-slate-100 group-hover:text-[#FFD166] transition-colors", "font-display font-extrabold text-base text-slate-100 group-hover:text-[#FFD166] transition-colors")}>{post.title}</h3>
                      <p className={sizeClass("text-slate-400 text-[11px] mt-1 line-clamp-3 leading-relaxed font-sans pr-2", "text-slate-300 text-sm font-semibold mt-1.5 line-clamp-4 leading-relaxed font-sans pr-2")}>
                        {post.content}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-slate-400 text-xs border-t border-white/5 pt-2.5">
                      <button
                        onClick={(e) => handleLike(post.id, e)}
                        className={`flex items-center gap-1.5 p-1 px-2 hover:bg-white/5 rounded transition-colors ${post.liked ? "text-glow font-bold" : ""}`}
                      >
                        <Heart className={`h-3 w-3 ${post.liked ? "fill-glow text-glow" : ""}`} />
                        <span className="font-mono text-[10px]">{post.likes}</span>
                      </button>

                      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 bg-[#090D1C]/20 px-2 py-0.5 rounded border border-white/[0.02]">
                        <MessageCircle className="h-3 w-3 text-[#A78BFA]" />
                        <span>{post.commentsCount} responses</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => handleBookmark(post.id, e)}
                          className={`p-1.5 hover:bg-white/5 rounded-lg transition-colors ${post.bookmarked ? "text-[#FFD166]" : ""}`}
                        >
                          <Bookmark className={`h-3 w-3 ${post.bookmarked ? "fill-[#FFD166]" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl text-slate-500 text-xs font-mono">
                  No post logs in this category channel yet.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
