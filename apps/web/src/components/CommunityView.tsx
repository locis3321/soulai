import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Heart, Bookmark, Share2, Plus, Sparkles, Send, ArrowLeft, Eye, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserProfile } from "../types";
import { api } from "../lib/api";

interface CommunityViewProps {
  profile: UserProfile;
  largeTextMode?: boolean;
}

interface Comment {
  id?: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

interface Post {
  id: string;
  authorName: string;
  authorAvatar: string;
  category: "astrology" | "tarot" | "bazi" | "ziwei" | "healing" | "relationships";
  title: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  liked: boolean;
  bookmarked: boolean;
  createdAt: string;
}

function relativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

export default function CommunityView({ profile, largeTextMode = false }: CommunityViewProps) {
  const { t, i18n } = useTranslation();
  
  const sizeClass = (normal: string, large: string) => largeTextMode ? large : normal;

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedPostComments, setSelectedPostComments] = useState<Comment[]>([]);

  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftCategory, setDraftCategory] = useState<Post["category"]>("astrology");

  const [commentText, setCommentText] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const catParam = category === "all" ? undefined : category;
      const data = await api.getCommunityPosts(catParam);
      setPosts(data.posts);
    } catch {
      setError(t("community.errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPosts(activeCategory);
  }, [activeCategory, fetchPosts]);

  const categories = [
    { key: "all", label: `🌐 ${t('community.allFeedsLabel')}`, desc: t('community.allFeeds') },
    { key: "astrology", label: `🪐 ${t('community.astrologyLabel')}`, desc: t('community.astrologyDesc') },
    { key: "tarot", label: `🔮 ${t('community.tarotLabel')}`, desc: t('community.tarotDesc') },
    { key: "bazi", label: `🐉 ${t('community.baziLabel')}`, desc: t('community.baziDesc') },
    { key: "ziwei", label: `☸️ ${t('community.ziweiLabel')}`, desc: t('community.ziweiDesc') },
    { key: "healing", label: `🌿 ${t('community.healingLabel')}`, desc: t('community.healingDesc') },
    { key: "relationships", label: `💕 ${t('community.relationshipsLabel')}`, desc: t('community.relationshipsDesc') }
  ];

  const handleLike = async (postId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      const data = await api.toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              liked: data.liked,
              likesCount: data.liked ? p.likesCount + 1 : p.likesCount - 1,
            };
          }
          return p;
        })
      );
      if (selectedPost?.id === postId) {
        setSelectedPost((prev) =>
          prev ? { ...prev, liked: data.liked, likesCount: data.liked ? prev.likesCount + 1 : prev.likesCount - 1 } : null
        );
      }
    } catch {
      // silently ignore
    }
  };

  const handleBookmark = async (postId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      const data = await api.toggleBookmark(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, bookmarked: data.bookmarked } : p))
      );
      if (selectedPost?.id === postId) {
        setSelectedPost((prev) => (prev ? { ...prev, bookmarked: data.bookmarked } : null));
      }
    } catch {
      // silently ignore
    }
  };

  const publishDraftPost = async () => {
    if (!draftTitle.trim() || !draftContent.trim()) return;

    try {
      const data = await api.createCommunityPost({
        category: draftCategory,
        title: draftTitle,
        content: draftContent,
      });
      const newPost: Post = {
        id: data.post.id,
        authorName: profile.name || "Seer",
        authorAvatar: "👤",
        category: data.post.category,
        title: data.post.title,
        content: data.post.content,
        likesCount: data.post.likesCount ?? 0,
        commentsCount: data.post.commentsCount ?? 0,
        liked: false,
        bookmarked: false,
        createdAt: data.post.createdAt,
      };
      setPosts((prev) => [newPost, ...prev]);
      setDraftTitle("");
      setDraftContent("");
      setShowDraftModal(false);
    } catch {
      // silently ignore
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || !selectedPost) return;

    try {
      const data = await api.addComment(selectedPost.id, commentText);
      const newComment: Comment = {
        id: data.comment.id,
        authorName: profile.name || "Seer",
        authorAvatar: "👤",
        content: data.comment.content,
        createdAt: data.comment.created_at,
      };

      setSelectedPostComments((prev) => [...prev, newComment]);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === selectedPost.id ? { ...p, commentsCount: p.commentsCount + 1 } : p
        )
      );
      setSelectedPost((prev) =>
        prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null
      );
      setCommentText("");
    } catch {
      // silently ignore
    }
  };

  const openPostDetail = async (post: Post) => {
    setSelectedPost(post);
    setSelectedPostComments([]);
    try {
      const data = await api.getCommunityPost(post.id);
      setSelectedPost({
        ...post,
        likesCount: data.post.likesCount ?? post.likesCount,
        commentsCount: data.post.commentsCount ?? post.commentsCount,
        liked: data.post.liked ?? post.liked,
        bookmarked: data.post.bookmarked ?? post.bookmarked,
      });
      setSelectedPostComments(data.comments || []);
    } catch {
      // keep the summary post data, no comments
    }
  };

  return (
    <div className="space-y-6" id="community-view-sandbox">
      <AnimatePresence mode="wait">
        
        {/* POST DETAIL VIEW */}
        {selectedPost ? (
          <motion.div
            key="detail-screen"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <button 
                onClick={() => { setSelectedPost(null); setSelectedPostComments([]); }}
                className="p-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-[10px] flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Feed
              </button>
              <span className="font-mono text-[10px] uppercase text-[#7C5CFF]/80">✦ Discussions Detail</span>
            </div>

            <div className="bg-[#11162E] border border-white/5 p-5 rounded-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-2.5 items-center">
                  <div className="text-2xl bg-white/5 p-1.5 rounded-lg">{selectedPost.authorAvatar}</div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-slate-100">{selectedPost.authorName}</h4>
                    <p className="text-[9px] font-mono text-slate-500">{relativeTime(selectedPost.createdAt)}</p>
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
                  <span className="font-mono text-[10px] font-semibold">{selectedPost.likesCount}</span>
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

            <div className="space-y-2.5">
              <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Responses ({selectedPostComments.length})</h4>
              {selectedPostComments.length > 0 ? (
                selectedPostComments.map((comment, idx) => (
                  <div key={comment.id || idx} className="bg-white/[0.01] border border-white/5 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{comment.authorAvatar}</span>
                        <span className="font-display font-medium text-xs text-slate-200">{comment.authorName}</span>
                      </div>
                      <span className="font-mono text-[8px] text-slate-500">{relativeTime(comment.createdAt)}</span>
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
          <motion.div
            key="feed-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
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

              <button 
                onClick={() => setShowDraftModal(true)}
                className="cursor-pointer p-3 rounded-full bg-[#7C5CFF] text-[#090D1C] font-semibold hover:bg-[#6D4AFF] transition-all shadow-[0_0_15px_rgba(124,92,255,0.4)] whitespace-nowrap"
              >
                <Plus className="h-4 w-4 text-white" />
              </button>
            </div>

            <div className={sizeClass("grid grid-cols-2 gap-3 pb-2", "grid grid-cols-1 gap-4 pb-3")} id="category-navigation-deck">
              {categories.map((cat) => {
                const active = activeCategory === cat.key;
                
                const labelText = cat.label.replace(/^[\p{Emoji}\s]+/u, "");
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

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-slate-400 text-xs font-mono">
                  {t("community.loading")}
                </div>
              ) : error ? (
                <div className="text-center py-12 border border-dashed border-red-500/30 rounded-2xl text-red-400 text-xs font-mono">
                  {error}
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => openPostDetail(post)}
                    className="cursor-pointer bg-[#11162E] border border-white/5 hover:border-[#7C5CFF]/30 p-4 rounded-xl transition duration-300 space-y-3 relative overflow-hidden group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-2 items-center">
                        <div className={sizeClass("text-xl bg-white/5 p-1 rounded-lg select-none", "text-2xl bg-white/5 p-2 rounded-lg select-none")}>{post.authorAvatar || '👤'}</div>
                        <div>
                          <h4 className={sizeClass("font-display font-semibold text-xs text-slate-200 truncate max-w-[150px]", "font-display font-bold text-sm text-slate-100 truncate max-w-[200px]")}>{post.authorName}</h4>
                          <p className={sizeClass("text-[8px] font-mono text-slate-500 leading-tight", "text-[10px] font-mono text-slate-400 font-bold leading-tight")}>{relativeTime(post.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={sizeClass("font-mono text-[8px] text-slate-500", "font-mono text-[10px] text-slate-400 font-bold")}>{relativeTime(post.createdAt)}</span>
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
                        <span className="font-mono text-[10px]">{post.likesCount}</span>
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
