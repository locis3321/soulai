import React from "react";
import { AlertTriangle, Shield, Info } from "lucide-react";

interface DisclaimerProps {
  type?: "general" | "ai" | "divination" | "healing" | "payment";
  className?: string;
}

const disclaimerContent = {
  general: {
    icon: <Info className="h-4 w-4" />,
    title: "Important Notice",
    message: "SoulAI provides content for self-exploration, cultural entertainment, emotional awareness, and personal growth reference. It does not constitute medical, psychological, legal, financial, or other professional advice."
  },
  ai: {
    icon: <Shield className="h-4 w-4" />,
    title: "AI Advisor Disclaimer",
    message: "AI advisors offer spiritual guidance and emotional support. They are not substitutes for professional mental health care. If you are in crisis, please contact local emergency services or a qualified professional immediately."
  },
  divination: {
    icon: <AlertTriangle className="h-4 w-4" />,
    title: "Divination Disclaimer",
    message: "Divination tools (tarot, astrology, numerology) are for reflection and self-discovery only. They do not predict guaranteed outcomes. Use insights as guidance, not absolute truth."
  },
  healing: {
    icon: <Shield className="h-4 w-4" />,
    title: "Healing Disclaimer",
    message: "Healing content supports emotional well-being and mindfulness. It is not a substitute for professional medical or psychological treatment. Consult healthcare providers for medical concerns."
  },
  payment: {
    icon: <Shield className="h-4 w-4" />,
    title: "Payment & Subscription Disclaimer",
    message: "Subscriptions provide access to enhanced spiritual wellness features for reflection and self-discovery. They are not prediction services. Payments are processed securely. You may cancel at any time. No refunds for partial periods."
  }
};

export default function Disclaimer({ type = "general", className = "" }: DisclaimerProps) {
  const content = disclaimerContent[type];

  return (
    <div className={`bg-amber-950/20 border border-amber-500/20 rounded-xl p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="text-amber-400 mt-0.5 shrink-0">
          {content.icon}
        </div>
        <div>
          <h4 className="text-amber-300 font-semibold text-sm mb-1">
            {content.title}
          </h4>
          <p className="text-amber-200/80 text-xs leading-relaxed">
            {content.message}
          </p>
        </div>
      </div>
    </div>
  );
}

export function InlineDisclaimer({ type = "general", className = "" }: DisclaimerProps) {
  const content = disclaimerContent[type];

  return (
    <div className={`flex items-start gap-2 text-xs text-amber-200/60 ${className}`}>
      <div className="mt-0.5 shrink-0">
        {content.icon}
      </div>
      <p>{content.message}</p>
    </div>
  );
}
