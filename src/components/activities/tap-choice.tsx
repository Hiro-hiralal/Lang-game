"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import {
  hidesPicturesUntilAnswered,
  isAssisted,
  narrowOptions,
} from "@/lib/learning/hint-ladder";
import type { ActivityViewProps } from "@/lib/activity-types";
import type { AnswerOption } from "@/lib/game-types";

/**
 * The original interaction: pick one of three.
 *
 * Still the right tool for judgements that are genuinely a choice — which
 * picture rhymes, what the story said — but no longer the only one, and no
 * longer allowed to give its answer away. Picture cues stay hidden on decoding
 * items until the attempt is in (PRD section 7), and the choices narrow only on
 * the final rung of the hint ladder.
 */
export function TapChoice({
  activity,
  reducedMotion,
  answered,
  hintLevel,
  onAnswer,
}: ActivityViewProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);

  const showPictures = answered || !hidesPicturesUntilAnswered(activity.kind);

  const visibleOptions = useMemo(
    () =>
      isAssisted(hintLevel) && !answered
        ? narrowOptions(
            activity.options,
            wrongId ? [wrongId] : [],
          )
        : activity.options,
    [activity.options, answered, hintLevel, wrongId],
  );

  const choose = (option: AnswerOption) => {
    if (answered) return;
    setSelected(option.id);

    if (!option.correct) {
      setWrongId(option.id);
      window.setTimeout(() => {
        setSelected(null);
      }, 1650);
    }

    onAnswer({
      correct: option.correct,
      mode: isAssisted(hintLevel) ? "assisted" : "tap",
      chosenId: option.id,
      expectedId: activity.options.find((entry) => entry.correct)?.id,
    });
  };

  return (
    <div className={`answer-grid answer-grid--${activity.kind}`}>
      {visibleOptions.map((option) => {
        const isSelected = selected === option.id;
        const state =
          isSelected && answered
            ? "correct"
            : isSelected && !option.correct
              ? "wrong"
              : "";

        return (
          <motion.button
            key={option.id}
            className={`answer-card ${state ? `answer-card--${state}` : ""}`}
            onClick={() => choose(option)}
            disabled={answered}
            whileHover={reducedMotion ? {} : { y: -4, scale: 1.015 }}
            whileTap={{ scale: 0.97 }}
            animate={
              state === "wrong" && !reducedMotion ? { x: [0, -8, 7, -4, 0] } : {}
            }
            aria-label={option.spokenLabel}
          >
            {option.icon && showPictures && (
              <span className="answer-card__icon" aria-hidden="true">
                {option.icon}
              </span>
            )}
            <strong>{option.label}</strong>
            <span className="answer-card__state" aria-hidden="true">
              {state === "correct" ? <Check /> : state === "wrong" ? <X /> : null}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
