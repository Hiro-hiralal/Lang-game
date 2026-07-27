"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { DROP_TARGET_ATTR, usePickAndPlace } from "@/hooks/use-pick-and-place";
import type { ActivityViewProps } from "@/lib/activity-types";

/**
 * Word Garden as the PRD actually describes it: the child builds the word by
 * moving letter tiles, rather than picking a finished word off a list.
 *
 * Producing "map" from tiles is a different act from recognising "map" among
 * three options — it requires knowing which grapheme carries each sound and
 * where it sits. Substituting one phoneme (sat -> sit) uses the same system
 * with a single empty slot.
 */
export function WordBuilder({
  activity,
  reducedMotion,
  answered,
  onAnswer,
  speak,
}: ActivityViewProps) {
  const config = activity.build;
  const [slots, setSlots] = useState<(string | null)[]>(
    () => config?.slots ?? [],
  );
  const [shakeSlot, setShakeSlot] = useState<number | null>(null);

  // No effect syncs `slots` back to `config`: the session shell keys each item
  // on `activity.key`, so moving to a new activity remounts this component and
  // the initialiser runs again.

  const openSlots = useMemo(
    () =>
      (config?.slots ?? []).map((slot, index) => (slot === null ? index : -1))
        .filter((index) => index >= 0),
    [config],
  );

  /** Tiles already placed are spent, so each one can be used once. */
  const usedTiles = useMemo(
    () =>
      slots
        .map((slot, index) => (openSlots.includes(index) ? slot : null))
        .filter((value): value is string => value !== null),
    [openSlots, slots],
  );

  const handlePlace = (tileId: string, targetId: string) => {
    if (answered || !config) return;

    const slotIndex = Number(targetId.replace("slot-", ""));
    if (!Number.isInteger(slotIndex) || !openSlots.includes(slotIndex)) return;

    const letter = tileId.replace(/^tile-\d+-/, "");
    const next = [...slots];
    next[slotIndex] = letter;
    setSlots(next);

    const filled = openSlots.every((index) => next[index] !== null);
    if (!filled) {
      speak(activity.voice.prompt, activity.bubble.prompt);
      return;
    }

    const built = next.join("");
    const correct = built.toLowerCase() === config.word.toLowerCase();

    if (!correct) {
      setShakeSlot(slotIndex);
      window.setTimeout(() => setShakeSlot(null), 600);
    }

    onAnswer({
      correct,
      mode: "drag",
      chosenId: built,
      expectedId: config.word,
    });

    if (!correct) {
      // Clear only what the child placed, so the given letters stay put and
      // they retry the decision rather than rebuilding from nothing.
      window.setTimeout(() => {
        setSlots(config.slots);
      }, 700);
    }
  };

  const { held, pick, place, beginDrag } = usePickAndPlace({
    onPlace: handlePlace,
    disabled: answered,
  });

  if (!config) return null;

  const reset = () => setSlots(config.slots);

  return (
    <div className="activity-visual builder">
      <div className="builder__soil" aria-hidden="true" />

      <div className="builder__slots" role="group" aria-label="Word being built">
        {slots.map((letter, index) => {
          const isOpen = openSlots.includes(index);
          const filled = letter !== null;

          if (!isOpen) {
            return (
              <span className="builder__slot builder__slot--given" key={index}>
                {letter}
              </span>
            );
          }

          return (
            <motion.button
              key={index}
              className={`builder__slot ${filled ? "builder__slot--filled" : "builder__slot--open"}`}
              onClick={() => place(`slot-${index}`)}
              disabled={answered || (!held && !filled)}
              animate={
                shakeSlot === index && !reducedMotion
                  ? { x: [0, -7, 6, -3, 0] }
                  : {}
              }
              aria-label={
                filled
                  ? `Slot ${index + 1}, holding ${letter}`
                  : `Empty slot ${index + 1}`
              }
              {...{ [DROP_TARGET_ATTR]: `slot-${index}` }}
            >
              {letter ?? ""}
            </motion.button>
          );
        })}
      </div>

      <p className="builder__hint">
        {held
          ? "Now tap where it goes."
          : "Tap a letter, then tap its place."}
      </p>

      <div className="builder__tray" role="group" aria-label="Letter tiles">
        {config.tiles.map((tile, index) => {
          const tileId = `tile-${index}-${tile}`;
          // Each tile is spent once placed, so a duplicate letter still offers
          // two usable tiles.
          const spent =
            usedTiles.filter((used) => used === tile).length >
            config.tiles
              .slice(0, index)
              .filter((earlier) => earlier === tile).length;

          return (
            <motion.button
              key={tileId}
              className={`builder__tile ${held === tileId ? "builder__tile--held" : ""} ${spent ? "builder__tile--spent" : ""}`}
              onClick={() => pick(tileId)}
              onPointerDown={(event) => beginDrag(tileId, event)}
              disabled={answered || spent}
              whileTap={reducedMotion ? {} : { scale: 0.92 }}
              aria-label={`Letter ${tile}`}
              aria-pressed={held === tileId}
            >
              {tile}
            </motion.button>
          );
        })}
      </div>

      {!answered && (
        <button className="builder__reset" onClick={reset} type="button">
          <RotateCcw aria-hidden="true" />
          Start the word again
        </button>
      )}
    </div>
  );
}
