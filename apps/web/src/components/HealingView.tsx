import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, BookOpen, Smile, Frown, Meh, Angry, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UserProfile, HealingJournal, MoodType } from "../types";
import { useLogMood, useMoodHistory, useJournals, useCreateJournal, useDeleteJournal } from "../hooks/useApi";

interface HealingViewProps {}

const MOOD_OPTIONS: { value: MoodType; icon: any; labelKey: string; color: string }[] = [
  { value: "calm", icon: Smile, labelKey: "calm", color: "bg-green-500/20 text-green-400" },
  { value: "neutral", icon: Meh, labelKey: "neutral", color: "bg-yellow-500/20 text-yellow-400" },
  { value: "sad", icon: Frown, labelKey: "sad", color: "bg-blue-500/20 text-blue-400" },
  { value: "angry", icon: Angry, labelKey: "angry", color: "bg-red-500/20 text-red-400" },
  { value: "tired", icon: Heart, labelKey: "tired", color: "bg-purple-500/20 text-purple-400" },
];

export default function HealingView({}: HealingViewProps) {
  const { t } = useTranslation();

  // State
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [moodNote, setMoodNote] = useState("");
  const [journalTitle, setJournalTitle] = useState("");
  const [journalContent, setJournalContent] = useState("");
  const [activeTab, setActiveTab] = useState<"mood" | "journal">("mood");

  // React Query hooks
  const { data: moodHistoryData, isLoading: moodLoading } = useMoodHistory(7);
  const { data: journalsData, isLoading: journalsLoading } = useJournals();
  const logMoodMutation = useLogMood();
  const createJournalMutation = useCreateJournal();
  const deleteJournalMutation = useDeleteJournal();

  const moodHistory = moodHistoryData?.moods || [];
  const journals = journalsData?.journals || [];

  const handleLogMood = async () => {
    if (!selectedMood) return;

    try {
      await logMoodMutation.mutateAsync({
        mood: selectedMood,
        note: moodNote || undefined,
        energyScore: selectedMood === "calm" ? 90 : selectedMood === "neutral" ? 70 : selectedMood === "sad" ? 50 : selectedMood === "angry" ? 40 : 60
      });
      setSelectedMood(null);
      setMoodNote("");
    } catch (error) {
      console.error("Failed to log mood:", error);
    }
  };

  const handleCreateJournal = async () => {
    if (!journalTitle.trim() || !journalContent.trim()) return;

    try {
      await createJournalMutation.mutateAsync({
        title: journalTitle.trim(),
        content: journalContent.trim(),
        mood: selectedMood || undefined
      });
      setJournalTitle("");
      setJournalContent("");
    } catch (error) {
      console.error("Failed to create journal:", error);
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (window.confirm(t('common.confirm'))) {
      await deleteJournalMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6 p-4 max-w-lg mx-auto bg-temple-dark min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-temple-cream flex items-center gap-2">
          <Heart className="w-6 h-6 text-temple-red" />
          {t('recoveryTitle')}
        </h1>
        <p className="text-sm text-temple-cream/60 mt-1">
          {t('recoveryDesc')}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-temple-deep/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("mood")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "mood"
              ? "bg-temple-red text-temple-cream"
              : "text-temple-cream/60 hover:text-temple-cream"
          }`}
        >
          {t('moodCheckIn')}
        </button>
        <button
          onClick={() => setActiveTab("journal")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "journal"
              ? "bg-temple-red text-temple-cream"
              : "text-temple-cream/60 hover:text-temple-cream"
          }`}
        >
          {t('spiritualJournal')}
        </button>
      </div>

      {/* Mood Check-in Tab */}
      {activeTab === "mood" && (
        <div className="space-y-6">
          {/* Mood Selection */}
          <div className="bg-temple-deep/50 border border-temple-gold/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-temple-cream mb-4">{t('howAreYouFeeling')}</h2>
            <div className="grid grid-cols-5 gap-3">
              {MOOD_OPTIONS.map((mood) => {
                const Icon = mood.icon;
                const isSelected = selectedMood === mood.value;
                return (
                  <motion.button
                    key={mood.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedMood(mood.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                      isSelected
                        ? `${mood.color} border-2 border-current`
                        : "bg-temple-dark border border-transparent hover:border-temple-gold/20"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs">{t(mood.labelKey)}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Mood Note */}
          {selectedMood && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-temple-deep/50 border border-temple-gold/20 rounded-2xl p-6"
            >
              <h3 className="text-sm font-medium text-temple-cream/80 mb-3">
                {t('addNote')}
              </h3>
              <textarea
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                placeholder={t('whatsOnYourMind')}
                rows={3}
                className="w-full bg-temple-dark border border-temple-gold/30 rounded-xl px-4 py-3 text-temple-cream placeholder-temple-cream/40 focus:outline-none focus:border-temple-gold resize-none"
              />
              <button
                onClick={handleLogMood}
                disabled={logMoodMutation.isPending}
                className="mt-3 w-full py-3 bg-temple-red hover:bg-temple-red/80 disabled:bg-temple-red/50 text-temple-cream font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {logMoodMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    {t('recordMood')}
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Mood History */}
          <div className="bg-temple-deep/50 border border-temple-gold/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-temple-cream mb-4">{t('recentMoods')}</h2>
            {moodLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-temple-gold animate-spin" />
              </div>
            ) : moodHistory.length === 0 ? (
              <p className="text-temple-cream/60 text-center py-8">{t('common.loading')}</p>
            ) : (
              <div className="space-y-3">
                {moodHistory.slice(0, 5).map((mood: any) => {
                  const moodOption = MOOD_OPTIONS.find(m => m.value === mood.mood);
                  const Icon = moodOption?.icon || Heart;
                  return (
                    <div
                      key={mood.id}
                      className="flex items-center gap-3 bg-temple-dark/50 rounded-lg p-3"
                    >
                      <div className={`p-2 rounded-lg ${moodOption?.color || "bg-slate-700"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-temple-cream capitalize">{mood.mood}</p>
                        {mood.note && (
                          <p className="text-xs text-temple-cream/60 mt-1">{mood.note}</p>
                        )}
                      </div>
                      <span className="text-xs text-temple-cream/40">
                        {new Date(mood.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Journal Tab */}
      {activeTab === "journal" && (
        <div className="space-y-6">
          {/* Create Journal */}
          <div className="bg-temple-deep/50 border border-temple-gold/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-temple-cream mb-4">{t('newJournalEntry')}</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
                placeholder={t('title')}
                className="w-full bg-temple-dark border border-temple-gold/30 rounded-xl px-4 py-3 text-temple-cream placeholder-temple-cream/40 focus:outline-none focus:border-temple-gold"
              />
              <textarea
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                placeholder={t('writeVulnerableThoughts')}
                rows={6}
                className="w-full bg-temple-dark border border-temple-gold/30 rounded-xl px-4 py-3 text-temple-cream placeholder-temple-cream/40 focus:outline-none focus:border-temple-gold resize-none"
              />
              <button
                onClick={handleCreateJournal}
                disabled={!journalTitle.trim() || !journalContent.trim() || createJournalMutation.isPending}
                className="w-full py-3 bg-temple-red hover:bg-temple-red/80 disabled:bg-temple-red/50 text-temple-cream font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {createJournalMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {t('saveJournal')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Journal List */}
          <div className="bg-temple-deep/50 border border-temple-gold/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-temple-cream mb-4">{t('journalEntries')}</h2>
            {journalsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-temple-gold animate-spin" />
              </div>
            ) : journals.length === 0 ? (
              <p className="text-temple-cream/60 text-center py-8">{t('noSealedLogs')}</p>
            ) : (
              <div className="space-y-4">
                {journals.map((journal: any) => (
                  <motion.div
                    key={journal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-temple-dark/50 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-temple-cream">{journal.title}</h3>
                      <button
                        onClick={() => handleDeleteJournal(journal.id)}
                        className="text-temple-cream/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-temple-cream/80 line-clamp-3">{journal.content}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-temple-cream/40">
                      <span>{new Date(journal.created_at).toLocaleDateString()}</span>
                      {journal.mood && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{journal.mood}</span>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
