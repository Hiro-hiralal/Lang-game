"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import type { ActivityViewProps } from "@/lib/activity-types";

/**
 * Clap or tap once per syllable.
 *
 * Syllable awareness is a whole-body skill before it is a visual one, so the
 * child produces the count by tapping rather than reading three numbers and
 * choosing. The answer is only checked when they say they are done, so the
 * beats stay a rhythm rather than a race.
 */
export function SyllableTap({
  activity,
  reducedMotion,
  answered,
  onAnswer,
}: ActivityViewProps) {
  const config = activity.syllables;
  const [taps, setTaps] = useState(0);
  const [pulse, setPulse] = useState(0);

  if (!config) return null;

  const registerTap = () => {
    if (answered) return;
    setTaps((current) => current + 1);
    setPulse((current) => (current + 1) % 2);
  };

  const confirm = () => {
    if (answered || taps === 0) return;
    onAnswer({
      correct: taps === config.count,
      mode: "sequence",
      chosenId: String(taps),
      expectedId: String(config.count),
    });
    if (taps !== config.count) {
      window.setTimeout(() => setTaps(0), 700);
    }
  };

  return (
    <div className="activity-visual clapper">
      <div className="clapper__word">
        {config.icon && <span aria-hidden="true">{config.icon}</span>}
        <strong>{config.word}</strong>
      </div>

      <motion.button
        type="button"
        className="clapper__drum"
        onClick={registerTap}
        disabled={answered}
        // Animate on a toggling value rather than a remounting `key`: keying
        // the button would tear it down and rebuild it on every beat.
        animate={reducedMotion ? {} : { scale: pulse === 0 ? 1 : 0.94 }}
        transition={{ duration: 0.11 }}
        aria-label={`Tap once for each beat in ${config.word}. ${taps} so far.`}
      >
        <span aria-hidden="true">🥁</span>
      </motion.button>

      <div className="clapper__beats" aria-live="polite">
        {Array.from({ length: taps }).map((_, index) => (
          <motion.span
            key={index}
            className="clapper__beat"
            initial={reducedMotion ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            aria-hidden="true"
          />
        ))}
        {taps === 0 && (
          <span className="clapper__placeholder">
            Tap the drum for each beat you hear.
          </span>
        )}
      </div>

      {!answered && (
        <div className="clapper__actions">
          <button type="button" className="clapper__reset" onClick={() => setTaps(0)}>
            <RotateCcw aria-hidden="true" />
            Start over
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={confirm}
            disabled={taps === 0}
          >
            That’s my answer
          </button>
        </div>
      )}
    </div>
  );
}
