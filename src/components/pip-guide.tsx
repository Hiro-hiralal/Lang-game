"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Volume2 } from "lucide-react";

interface PipGuideProps {
  message: string;
  onSpeak?: () => void;
  mood?: "hello" | "thinking" | "celebrate";
  compact?: boolean;
  isSpeaking?: boolean;
}

export function PipGuide({
  message,
  onSpeak,
  mood = "hello",
  compact = false,
  isSpeaking = false,
}: PipGuideProps) {
  return (
    <motion.div
      className={`pip-guide pip-guide--${mood} ${compact ? "pip-guide--compact" : ""}`}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <motion.div
        className="pip-guide__portrait"
        animate={mood === "celebrate" ? { rotate: [-2, 3, -2], y: [0, -5, 0] } : {}}
        transition={{ duration: 0.7 }}
      >
        <Image
          src="/art/pip-fox.webp"
          alt="Pip, a friendly orange fox wearing a green leaf scarf"
          fill
          sizes={compact ? "72px" : "104px"}
          priority
        />
      </motion.div>
      <div className="pip-guide__bubble">
        <span className="pip-guide__name">
          {isSpeaking && <i className="pip-guide__wave" aria-hidden="true" />}
          {isSpeaking ? "Pip is performing" : "Pip says"}
        </span>
        <p>{message}</p>
        {onSpeak && (
          <button
            className="pip-guide__speak"
            onClick={onSpeak}
            aria-label="Hear Pip say this again"
          >
            <Volume2 />
            {isSpeaking ? "Playing…" : "Hear it"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
