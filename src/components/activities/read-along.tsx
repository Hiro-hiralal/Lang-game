"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Pause, Play, Volume2 } from "lucide-react";
import type { ActivityViewProps } from "@/lib/activity-types";

const DEFAULT_WORD_MS = 620;

interface WordRef {
  lineIndex: number;
  wordIndex: number;
  text: string;
}

/**
 * Connected text with word-by-word highlighting.
 *
 * Every session should end in real reading rather than isolated items, and the
 * highlight is what ties the sound the child hears to the word their eye is on.
 * Any word can be tapped on its own, so a child who stalls can unstick a single
 * word without replaying the line. PRD sections 5 and 7.
 */
export function ReadAlong({
  activity,
  reducedMotion,
  answered,
  onAnswer,
  speak,
}: ActivityViewProps) {
  const config = activity.readAlong;
  const [cursor, setCursor] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const timer = useRef<number | null>(null);

  const words: WordRef[] = (config?.lines ?? []).flatMap((line, lineIndex) =>
    line
      .split(/\s+/)
      .filter(Boolean)
      .map((text, wordIndex) => ({ lineIndex, wordIndex, text })),
  );

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    if (!playing) return;

    const stepMs = config?.wordDurationMs ?? DEFAULT_WORD_MS;
    timer.current = window.setTimeout(() => {
      setCursor((current) => {
        const next = current + 1;
        if (next >= words.length) {
          setPlaying(false);
          setFinished(true);
          return words.length - 1;
        }
        return next;
      });
    }, stepMs);

    return clearTimer;
  }, [clearTimer, config?.wordDurationMs, cursor, playing, words.length]);

  if (!config) return null;

  const startPlayback = () => {
    if (answered) return;
    setCursor(-1);
    setFinished(false);
    setPlaying(true);
    if (config.narrationId) {
      speak(config.narrationId, config.lines.join(" "));
    }
  };

  const stopPlayback = () => {
    setPlaying(false);
    clearTimer();
  };

  const globalIndex = (lineIndex: number, wordIndex: number) =>
    words.findIndex(
      (word) => word.lineIndex === lineIndex && word.wordIndex === wordIndex,
    );

  return (
    <div className="activity-visual reader">
      <div className="reader__page">
        {config.lines.map((line, lineIndex) => (
          <p className="reader__line" key={lineIndex}>
            {line
              .split(/\s+/)
              .filter(Boolean)
              .map((word, wordIndex) => {
                const index = globalIndex(lineIndex, wordIndex);
                const isCurrent = index === cursor;
                const isRead = index < cursor;

                return (
                  <motion.button
                    key={`${lineIndex}-${wordIndex}`}
                    type="button"
                    className={`reader__word ${isCurrent ? "reader__word--current" : ""} ${isRead ? "reader__word--read" : ""}`}
                    onClick={() => {
                      setCursor(index);
                      // A single word, on its own, as many times as needed.
                      speak(activity.voice.prompt, word.replace(/[.,!?]/g, ""));
                    }}
                    animate={
                      isCurrent && !reducedMotion ? { scale: [1, 1.08, 1] } : {}
                    }
                    transition={{ duration: 0.3 }}
                    aria-label={`Hear the word ${word.replace(/[.,!?]/g, "")}`}
                  >
                    {word}
                  </motion.button>
                );
              })}
          </p>
        ))}
      </div>

      <div className="reader__controls">
        <button
          type="button"
          className="reader__play"
          onClick={playing ? stopPlayback : startPlayback}
          disabled={answered}
        >
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          {playing ? "Pause" : cursor >= 0 ? "Read it again" : "Read with me"}
        </button>

        <span className="reader__tip">
          <Volume2 aria-hidden="true" />
          Tap any word to hear it on its own.
        </span>
      </div>

      {finished && !answered && (
        <motion.button
          type="button"
          className="primary-button"
          onClick={() =>
            onAnswer({ correct: true, mode: "sequence", expectedId: "read" })
          }
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          I read the whole thing
        </motion.button>
      )}
    </div>
  );
}
