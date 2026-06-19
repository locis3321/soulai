import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserProfile } from "../types";
import { useChatSessions, useChatMessages, useSendMessage, useCreateChatSession } from "../hooks/useApi";

interface ChatViewProps {
  profile: UserProfile;
  isPremium: boolean;
}

export default function ChatView({ profile, isPremium }: ChatViewProps) {
  const { t } = useTranslation();
  const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Advisors list with translations
  const ADVISORS = [
    { key: "luna", name: t('advisors.luna.name'), avatar: "🌊", title: t('advisors.luna.title'), color: "from-teal-500/20 to-teal-600/5" },
    { key: "athena", name: t('advisors.athena.name'), avatar: "🦉", title: t('advisors.athena.title'), color: "from-indigo-500/20 to-indigo-600/5" },
    { key: "mystic", name: t('advisors.mystic.name'), avatar: "🔮", title: t('advisors.mystic.title'), color: "from-fuchsia-500/20 to-fuchsia-600/5" },
    { key: "zen", name: t('advisors.zen.name'), avatar: "🧘", title: t('advisors.zen.title'), color: "from-emerald-500/20 to-emerald-600/5" },
  ];

  // React Query hooks
  const { data: sessionsData, isLoading: sessionsLoading } = useChatSessions();
  const createSessionMutation = useCreateChatSession();

  // Find or create session for selected advisor
  const currentSession = sessionsData?.sessions?.find(
    (s: any) => s.advisor_key === selectedAdvisor
  );

  const { data: messagesData, isLoading: messagesLoading } = useChatMessages(
    currentSession?.id || ""
  );

  const sendMessageMutation = useSendMessage();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData?.messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentSession?.id) return;

    try {
      await sendMessageMutation.mutateAsync({
        sessionId: currentSession.id,
        content: messageInput.trim()
      });
      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleSelectAdvisor = async (advisorKey: string) => {
    setSelectedAdvisor(advisorKey);

    // Create session if doesn't exist
    const existingSession = sessionsData?.sessions?.find(
      (s: any) => s.advisor_key === advisorKey
    );

    if (!existingSession) {
      await createSessionMutation.mutateAsync(advisorKey);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const messages = messagesData?.messages || [];
  const advisor = ADVISORS.find(a => a.key === selectedAdvisor);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-temple-dark">
      {/* Header */}
      <div className="p-4 border-b border-temple-gold/20 bg-temple-deep/50">
        <h1 className="text-xl font-bold text-temple-cream flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-temple-gold" />
          {t('chatAdvisorTitle')}
        </h1>
        <p className="text-sm text-temple-cream/60 mt-1">
          {t('chatAdvisorDesc')}
        </p>
      </div>

      {/* Advisor Selection */}
      {!selectedAdvisor && (
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            {ADVISORS.map((adv) => (
              <motion.button
                key={adv.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectAdvisor(adv.key)}
                className={`bg-gradient-to-br ${adv.color} border border-temple-gold/20 rounded-2xl p-6 text-left transition-all hover:border-temple-gold/40`}
              >
                <div className="text-4xl mb-3">{adv.avatar}</div>
                <h3 className="font-semibold text-temple-cream text-lg">{adv.name}</h3>
                <p className="text-sm text-temple-cream/60 mt-1">{adv.title}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Area */}
      {selectedAdvisor && (
        <>
          {/* Chat Header */}
          <div className="p-4 border-b border-temple-gold/20 flex items-center gap-3 bg-temple-deep/30">
            <button
              onClick={() => setSelectedAdvisor(null)}
              className="text-temple-cream/60 hover:text-temple-cream transition-colors"
            >
              ← {t('common.back')}
            </button>
            <div className="flex items-center gap-3 flex-1">
              <span className="text-2xl">{advisor?.avatar}</span>
              <div>
                <h3 className="font-semibold text-temple-cream">{advisor?.name}</h3>
                <p className="text-xs text-temple-cream/60">{advisor?.title}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-temple-gold animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="text-4xl mb-4">{advisor?.avatar}</span>
                <h3 className="text-lg font-semibold text-temple-cream mb-2">
                  {t('chatPlaceholder')}
                </h3>
                <p className="text-sm text-temple-cream/60 max-w-sm">
                  {t('suggestedTopics')}
                </p>
              </div>
            ) : (
              messages.map((msg: any) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-temple-red text-temple-cream"
                        : "bg-temple-deep text-temple-cream"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{advisor?.avatar}</span>
                        <span className="text-xs font-medium text-temple-cream/60">{advisor?.name}</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-temple-gold/20 bg-temple-deep/30">
            <div className="flex gap-2 max-w-lg mx-auto">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('typeMessage')}
                rows={1}
                className="flex-1 bg-temple-dark border border-temple-gold/30 rounded-xl px-4 py-3 text-temple-cream placeholder-temple-cream/40 focus:outline-none focus:border-temple-gold resize-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
                className="px-4 py-3 bg-temple-red hover:bg-temple-red/80 disabled:bg-temple-red/50 text-temple-cream rounded-xl transition-colors"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
