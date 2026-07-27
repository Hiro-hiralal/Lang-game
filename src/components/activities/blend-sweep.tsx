"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { ActivityViewProps } from "@/lib/activity-types";

/**
 * Blend Bridge as a physical sweep rather than a quiz.
 *
 * PRD section 7: the child drags a firefly across the stones while the sounds
 * hold into one another, and the bridge joins when the sounds form the word.
 * Blending left to right without stopping between phonemes is the thing being
 * taught, so the interaction has to be continuous — a multiple-choice question
 * about which word you heard tests listening, not blending.
 */
export function BlendSweep({
  activity,
  reducedMotion,
  answered,
  onAnswer,
  speak,
}: ActivityViewProps) {
  const config = activity.blendSweep;
  const [reached, setReached] = useState(0);
  const [sweeping, setSweeping] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const reachedRef = useRef(0);

  const total = config?.graphemes.length ?? 0;

  useEffect(() => {
    reachedRef.current = reached;
  }, [reached]);

  const soundStone = useCallback(
    (index: number) => {
      if (!config) return;
      const phoneme = config.phonemes[index] ?? config.graphemes[index];
      speak(`${activity.voice.prompt}`, phoneme);
    },
    [activity.voice.prompt, config, speak],
  );

  /** Stones must be touched in order: blending is a left-to-right act. */
  const touchStone = useCallback(
    (index: number) => {
      if (answered || !config) return;
      if (index !== reachedRef.current) return;

      const next = index + 1;
      reachedRef.current = next;
      setReached(next);
      soundStone(index);

      if (next === config.graphemes.length) {
        setSweeping(false);
        onAnswer({
          correct: true,
          mode: "drag",
          chosenId: config.word,
          expectedId: config.word,
        });
      }
    },
    [answered, config, onAnswer, soundStone],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const element = document.elementFromPoint(event.clientX, event.clientY);
      const stone = element?.closest("[data-stone-index]");
      const index = stone?.getAttribute("data-stone-index");
      if (index !== null && index !== undefined) {
        touchStone(Number(index));
      }
    },
    [touchStone],
  );

  useEffect(() => {
    if (!sweeping) return;

    const stopSweep = () => setSweeping(false);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopSweep);
    window.addEventListener("pointercancel", stopSweep);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopSweep);
      window.removeEventListener("pointercancel", stopSweep);
    };
  }, [handlePointerMove, sweeping]);

  if (!config) return null;

  const restart = () => {
    reachedRef.current = 0;
    setReached(0);
  };

  const progress = total === 0 ? 0 : reached / total;

  return (
    <div className="activity-visual bridge-visual bridge-visual--sweep">
      <div className="bridge-visual__river" aria-hidden="true" />

      <div
        className="bridge-visual__stones"
        ref={trackRef}
        onPointerDown={() => setSweeping(true)}
        role="group"
        aria-label={`Sweep across ${total} sounds to make a word`}
      >
        {config.graphemes.map((grapheme, index) => {
          const lit = index < reached;
          const isNext = index === reached;

          return (
            <motion.button
              key={`${grapheme}-${index}`}
              type="button"
              data-stone-index={index}
              className={`blend-stone ${lit ? "blend-stone--lit" : ""} ${isNext ? "blend-stone--next" : ""}`}
              // Tapping each stone in turn is the accessible route to the same
              // left-to-right sweep.
              onClick={() => touchStone(index)}
              disabled={answered}
              animate={
                isNext && !reducedMotion
                  ? { y: [0, -5, 0], scale: [1, 1.04, 1] }
                  : {}
              }
              transition={{ duration: 1.3, repeat: Infinity }}
              aria-label={
                lit
                  ? `${grapheme}, sounded`
                  : isNext
                    ? `${grapheme}, next`
                    : grapheme
              }
            >
              {grapheme}
            </motion.button>
          );
        })}
      </div>

      <motion.div
        className="bridge-visual__firefly bridge-visual__firefly--tracked"
        animate={{ left: `${12 + progress * 76}%` }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        aria-hidden="true"
      />

      <div className="bridge-visual__plank" aria-hidden="true">
        <motion.span
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
        />
      </div>

      <p className="bridge-visual__caption" aria-live="polite">
        {/* The heading already says what to do; this line carries the sounds
            as they join up, so the child sees the blend accumulating. */}
        {answered
          ? `${config.word}! The bridge is joined.`
          : reached === 0
            ? "Start on the left."
            : `${config.phonemes.slice(0, reached).join("–")}…`}
      </p>

      {!answered && reached > 0 && (
        <button className="bridge-visual__restart" type="button" onClick={restart}>
          Start the sweep again
        </button>
      )}
    </div>
  );
}
