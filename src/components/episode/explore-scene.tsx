"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Volume2 } from "lucide-react";
import type { ExploreObject } from "@/lib/episodes/types";

interface ExploreSceneProps {
  title: string;
  instruction: string;
  voiceId: string;
  sky: string;
  objects: ExploreObject[];
  requiredTaps: number;
  reducedMotion: boolean;
  speak: (voiceId: string, fallback: string) => void;
  onDone: () => void;
}

/**
 * Free exploration, deliberately unscored.
 *
 * Nothing here is right or wrong — the child pokes at a dark grove and hears
 * what each thing is called. It builds the vocabulary the next beat sorts by,
 * and it gives the child a say in how the story unfolds, which is the part
 * that makes it feel like a place rather than a worksheet.
 */
export function ExploreScene({
  title,
  instruction,
  voiceId,
  sky,
  objects,
  requiredTaps,
  reducedMotion,
  speak,
  onDone,
}: ExploreSceneProps) {
  const [found, setFound] = useState<string[]>([]);

  useEffect(() => {
    speak(voiceId, instruction);
  }, [instruction, speak, voiceId]);

  const discover = (object: ExploreObject) => {
    speak(object.voiceId, object.label);
    setFound((current) =>
      current.includes(object.id) ? current : [...current, object.id],
    );
  };

  const ready = found.length >= requiredTaps;

  return (
    <div className="explore-scene" style={{ background: sky }}>
      <header className="explore-scene__header">
        <div>
          <span className="explore-scene__eyebrow">{title}</span>
          <h1>{instruction}</h1>
        </div>
        <button
          className="icon-button icon-button--warm"
          onClick={() => speak(voiceId, instruction)}
          aria-label="Hear that again"
          type="button"
        >
          <Volume2 />
        </button>
      </header>

      <div className="explore-scene__stage">
        {objects.map((object) => {
          const discovered = found.includes(object.id);
          return (
            <motion.button
              key={object.id}
              type="button"
              className={`explore-scene__object ${discovered ? "is-found" : ""}`}
              style={{ left: `${object.x}%`, top: `${object.y}%` }}
              onClick={() => discover(object)}
              // The glow pulses, the target does not. Scaling a tap target that
              // a four-year-old is aiming at makes it harder to hit, so the
              // "there is something here" cue is carried by opacity alone.
              animate={
                reducedMotion || discovered
                  ? { opacity: 1 }
                  : { opacity: [0.5, 0.9, 0.5] }
              }
              transition={{ duration: 2.6, repeat: discovered ? 0 : Infinity }}
              whileTap={reducedMotion ? {} : { scale: 0.9 }}
              aria-label={
                discovered ? `${object.label}, found` : "Something in the dark"
              }
            >
              <span aria-hidden="true">{object.icon}</span>
              {discovered && (
                <motion.small
                  initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {object.label}
                </motion.small>
              )}
            </motion.button>
          );
        })}
      </div>

      <footer className="explore-scene__footer">
        <p aria-live="polite">
          {ready
            ? "You have found enough to go on."
            : `Found ${found.length} of ${requiredTaps} things so far.`}
        </p>
        <button
          className="primary-button"
          onClick={onDone}
          disabled={!ready}
          type="button"
        >
          Go and find Mo
          <ArrowRight aria-hidden="true" />
        </button>
      </footer>
    </div>
  );
}
