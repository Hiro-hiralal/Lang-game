"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, SkipForward } from "lucide-react";
import type { StoryCard } from "@/lib/episodes/types";

const CARD_MS = 5200;

interface StoryCardsProps {
  cards: StoryCard[];
  reducedMotion: boolean;
  speak: (voiceId: string, fallback: string) => void;
  onDone: () => void;
  skipLabel?: string;
}

/**
 * The cinematic beats — the opening and the finale.
 *
 * Always skippable, and a tap always advances: PRD section 6 requires that no
 * animation delays the next meaningful interaction, and a four-year-old who has
 * seen the opening once should never have to sit through it again.
 */
export function StoryCards({
  cards,
  reducedMotion,
  speak,
  onDone,
  skipLabel = "Skip the story",
}: StoryCardsProps) {
  const [index, setIndex] = useState(0);
  const card = cards[index];

  useEffect(() => {
    if (!card) return;
    speak(card.voiceId, card.text);
  }, [card, speak]);

  useEffect(() => {
    if (!card) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => {
        if (current >= cards.length - 1) return current;
        return current + 1;
      });
    }, CARD_MS);
    return () => window.clearTimeout(timer);
  }, [card, cards.length]);

  if (!card) return null;

  const isLast = index === cards.length - 1;

  const advance = () => {
    if (isLast) {
      onDone();
      return;
    }
    setIndex((current) => current + 1);
  };

  return (
    <div
      className="story-cards"
      style={{ background: card.sky }}
      onClick={advance}
      role="presentation"
    >
      <button className="story-cards__skip" onClick={onDone} type="button">
        <SkipForward aria-hidden="true" />
        {skipLabel}
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={card.id}
          className="story-cards__scene"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0, scale: 1.04 }}
          transition={{ duration: reducedMotion ? 0 : 0.7 }}
        >
          <div className="story-cards__cast" aria-hidden="true">
            {card.cast.map((member, memberIndex) => (
              <motion.span
                key={`${card.id}-${memberIndex}`}
                animate={
                  reducedMotion
                    ? {}
                    : { y: [0, -14, 0], rotate: [-3, 3, -3] }
                }
                transition={{
                  duration: 3.4,
                  repeat: Infinity,
                  delay: memberIndex * 0.4,
                }}
              >
                {member}
              </motion.span>
            ))}
          </div>

          <motion.p
            className="story-cards__text"
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0 : 0.3 }}
          >
            {card.text}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      <div className="story-cards__footer">
        <div className="story-cards__dots" aria-hidden="true">
          {cards.map((entry, dotIndex) => (
            <span
              key={entry.id}
              className={dotIndex === index ? "is-active" : ""}
            />
          ))}
        </div>
        <button className="primary-button" onClick={advance} type="button">
          {isLast ? "Let’s go" : "Next"}
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
