import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Download, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { api } from "../lib/api";

interface PolicySection {
  title: string;
  content: string;
}

interface PrivacyPolicy {
  lastUpdated: string;
  sections: PolicySection[];
}

interface PrivacyViewProps {
  largeTextMode?: boolean;
}

export default function PrivacyView({ largeTextMode = false }: PrivacyViewProps) {
  const { t } = useTranslation();
  const sizeClass = (normal: string, large: string) => (largeTextMode ? large : normal);

  const [policy, setPolicy] = useState<PrivacyPolicy | null>(null);
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    api.getPrivacyPolicy().then(setPolicy).catch(() => {});
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "soulai-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("privacy.exportSuccess"));
    } catch {
      toast.error(t("privacy.exportError"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteInput !== "DELETE") return;
    setIsDeleting(true);
    try {
      await api.deleteData();
      toast.success(t("privacy.deleteSuccess"));
      setShowDeleteConfirm(false);
      setDeleteInput("");
    } catch {
      toast.error(t("privacy.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D1C] px-4 pt-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#7C5CFF]/15 flex items-center justify-center">
            <Shield className={sizeClass("h-5 w-5", "h-6 w-6")} style={{ color: "#7C5CFF" }} />
          </div>
          <div>
            <h1 className={sizeClass("text-xl font-bold text-white", "text-2xl font-bold text-white")}>
              {t("privacy.title")}
            </h1>
            <p className={sizeClass("text-xs text-slate-400", "text-sm text-slate-400")}>
              {t("privacy.subtitle")}
            </p>
          </div>
        </div>

        {/* Privacy Policy */}
        <section className="border border-white/5 bg-[#11162E] rounded-2xl overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <h2 className={sizeClass("text-sm font-semibold text-slate-200", "text-base font-semibold text-slate-200")}>
              {t("privacy.policyTitle")}
            </h2>
            {policy && (
              <span className="text-[10px] text-slate-500">
                {t("privacy.lastUpdated")}: {policy.lastUpdated}
              </span>
            )}
          </div>

          {policy?.sections.map((section, idx) => (
            <div key={idx} className="border-t border-white/[0.03]">
              <button
                type="button"
                onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 outline-none cursor-pointer"
              >
                <span className={sizeClass("text-xs font-medium text-slate-300", "text-sm font-medium text-slate-300")}>
                  {section.title}
                </span>
                {expandedSection === idx ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
              </button>
              <AnimatePresence>
                {expandedSection === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-[#0A0D22] border-t border-white/[0.03]"
                  >
                    <p className={sizeClass("p-4 text-[11px] text-slate-400 leading-relaxed", "p-4 text-sm text-slate-400 leading-relaxed")}>
                      {section.content}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {!policy && (
            <div className="p-4 text-xs text-slate-500">{t("common.loading")}</div>
          )}
        </section>

        {/* Export Data */}
        <section className="border border-white/5 bg-[#11162E] rounded-2xl p-4 space-y-3">
          <h2 className={sizeClass("text-sm font-semibold text-slate-200", "text-base font-semibold text-slate-200")}>
            {t("privacy.exportTitle")}
          </h2>
          <p className={sizeClass("text-[11px] text-slate-400 leading-relaxed", "text-sm text-slate-400 leading-relaxed")}>
            {t("privacy.exportDesc")}
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            style={{ background: "#7C5CFF", color: "#fff" }}
          >
            <Download className="h-4 w-4" />
            {isExporting ? t("common.loading") : t("privacy.exportBtn")}
          </button>
        </section>

        {/* Delete Data */}
        <section className="border border-red-500/20 bg-[#11162E] rounded-2xl p-4 space-y-3">
          <h2 className={sizeClass("text-sm font-semibold text-red-400", "text-base font-semibold text-red-400")}>
            {t("privacy.deleteTitle")}
          </h2>
          <p className={sizeClass("text-[11px] text-slate-400 leading-relaxed", "text-sm text-slate-400 leading-relaxed")}>
            {t("privacy.deleteDesc")}
          </p>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              {t("privacy.deleteBtn")}
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10"
            >
              <p className={sizeClass("text-xs font-semibold text-red-400", "text-sm font-semibold text-red-400")}>
                {t("privacy.deleteConfirmTitle")}
              </p>
              <p className={sizeClass("text-[10px] text-slate-400 leading-relaxed", "text-xs text-slate-400 leading-relaxed")}>
                {t("privacy.deleteConfirmDesc")}
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={t("privacy.deleteConfirm")}
                className="w-full px-3 py-2 rounded-lg bg-[#090D1C] border border-white/10 text-sm text-white placeholder-slate-600 outline-none focus:border-red-500/50"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 border border-white/10 hover:bg-white/5 transition-all"
                >
                  {t("privacy.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteInput !== "DELETE" || isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white disabled:opacity-30 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {isDeleting ? t("common.loading") : t("privacy.confirm")}
                </button>
              </div>
            </motion.div>
          )}
        </section>
      </motion.div>
    </div>
  );
}
