"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { DROP_TARGET_ATTR, usePickAndPlace } from "@/hooks/use-pick-and-place";
import type { ActivityViewProps } from "@/lib/activity-types";

/**
 * Sorting into baskets — rhyme families, first sounds, word patterns.
 *
 * Sorting asks for a judgement about every item rather than one pick out of
 * three, so a lucky guess cannot carry the whole question, and the child has to
 * hold the target sound in mind across several decisions.
 */
export function SortBaskets({
  activity,
  reducedMotion,
  answered,
  onAnswer,
  speak,
}: ActivityViewProps) {
  const config = activity.sort;
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [wrongItem, setWrongItem] = useState<string | null>(null);

  const remaining = useMemo(
    () => (config?.items ?? []).filter((item) => !placements[item.id]),
    [config, placements],
  );

  const handlePlace = (itemId: string, basketId: string) => {
    if (answered || !config) return;

    const item = config.items.find((entry) => entry.id === itemId);
    if (!item) return;

    const correct = item.basketId === basketId;

    if (!correct) {
      setWrongItem(itemId);
      window.setTimeout(() => setWrongItem(null), 700);
      speak(activity.voice.hints[0], activity.bubble.hints[0]);
      onAnswer({
        correct: false,
        mode: "drag",
        chosenId: basketId,
        expectedId: item.basketId,
      });
      return;
    }

    const next = { ...placements, [itemId]: basketId };
    setPlacements(next);

    const everyItemPlaced = config.items.every((entry) => next[entry.id]);
    if (everyItemPlaced) {
      onAnswer({ correct: true, mode: "drag" });
    }
  };

  const { held, pick, place, beginDrag } = usePickAndPlace({
    onPlace: handlePlace,
    disabled: answered,
  });

  if (!config) return null;

  return (
    <div className="activity-visual sorter">
      <div className="sorter__tray" role="group" aria-label="Words to sort">
        {remaining.map((item) => (
          <motion.button
            key={item.id}
            type="button"
            className={`sorter__item ${held === item.id ? "sorter__item--held" : ""} ${wrongItem === item.id ? "sorter__item--wrong" : ""}`}
            onClick={() => pick(item.id)}
            onPointerDown={(event) => beginDrag(item.id, event)}
            disabled={answered}
            animate={
              wrongItem === item.id && !reducedMotion
                ? { x: [0, -8, 7, -4, 0] }
                : {}
            }
            whileTap={reducedMotion ? {} : { scale: 0.94 }}
            aria-label={item.spokenLabel}
            aria-pressed={held === item.id}
          >
            <span aria-hidden="true">{item.icon}</span>
            <strong>{item.label}</strong>
          </motion.button>
        ))}
        {remaining.length === 0 && (
          <p className="sorter__empty">Every word found its basket.</p>
        )}
      </div>

      <p className="sorter__hint">
        {held ? "Now tap a basket." : "Tap a word, then tap its basket."}
      </p>

      <div className="sorter__baskets">
        {config.baskets.map((basket) => {
          const contents = config.items.filter(
            (item) => placements[item.id] === basket.id,
          );

          return (
            <button
              key={basket.id}
              type="button"
              className={`sorter__basket ${held ? "sorter__basket--ready" : ""}`}
              onClick={() => place(basket.id)}
              disabled={answered || !held}
              aria-label={`Basket: ${basket.label}`}
              {...{ [DROP_TARGET_ATTR]: basket.id }}
            >
              <span className="sorter__basket-label">
                {basket.icon && <span aria-hidden="true">{basket.icon}</span>}
                {basket.label}
              </span>
              <span className="sorter__basket-contents">
                {contents.map((item) => (
                  <motion.span
                    key={item.id}
                    initial={reducedMotion ? false : { scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </motion.span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
