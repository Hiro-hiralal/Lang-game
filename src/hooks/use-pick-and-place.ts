"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const DROP_TARGET_ATTR = "data-drop-target";

/** Movement past this many pixels turns a press into a drag rather than a tap. */
const DRAG_THRESHOLD_PX = 6;

interface GhostPosition {
  x: number;
  y: number;
}

interface Options {
  /** Called when a held item is dropped on, or tapped onto, a target. */
  onPlace: (itemId: string, targetId: string) => void;
  disabled?: boolean;
}

/**
 * Drag-and-drop that is also tap-and-tap.
 *
 * Four- and five-year-olds vary enormously in fine-motor control, and some
 * children use a switch or a keyboard. Every draggable and every target is a
 * real `<button>`, so the whole interaction works by tapping the item and then
 * tapping where it goes. Pointer dragging is layered on top for the tactile
 * feel, never as the only route. PRD section 13.
 *
 * A press only becomes a drag once the pointer actually moves. Without that
 * threshold, pressing an item would pick it up on `pointerdown` and the
 * `click` that follows would immediately put it back down.
 */
export function usePickAndPlace({ onPlace, disabled = false }: Options) {
  const [held, setHeld] = useState<string | null>(null);
  const [ghost, setGhost] = useState<GhostPosition | null>(null);
  const origin = useRef<{ itemId: string; x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const suppressClick = useRef(false);
  const placeRef = useRef(onPlace);

  useEffect(() => {
    placeRef.current = onPlace;
  }, [onPlace]);

  const reset = useCallback(() => {
    origin.current = null;
    dragging.current = false;
    setHeld(null);
    setGhost(null);
  }, []);

  /** Tap route: pick up, or put down if the same item is tapped twice. */
  const pick = useCallback(
    (itemId: string) => {
      if (disabled) return;
      // Swallow the click that trails a completed drag.
      if (suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      setHeld((current) => (current === itemId ? null : itemId));
      setGhost(null);
    },
    [disabled],
  );

  /** Tap route: place whatever is held onto this target. */
  const place = useCallback(
    (targetId: string) => {
      if (disabled || !held) return;
      placeRef.current(held, targetId);
      reset();
    },
    [disabled, held, reset],
  );

  const beginDrag = useCallback(
    (itemId: string, event: React.PointerEvent) => {
      if (disabled) return;
      // Keyboard-initiated activation surfaces as a pointer event with no
      // pointer behind it. Those go through the tap route.
      if (!event.pointerType) return;

      origin.current = { itemId, x: event.clientX, y: event.clientY };
      dragging.current = false;
    },
    [disabled],
  );

  useEffect(() => {
    if (disabled) return;

    const handleMove = (event: PointerEvent) => {
      const start = origin.current;
      if (!start) return;

      if (!dragging.current) {
        const moved = Math.hypot(
          event.clientX - start.x,
          event.clientY - start.y,
        );
        if (moved < DRAG_THRESHOLD_PX) return;
        dragging.current = true;
        setHeld(start.itemId);
      }

      setGhost({ x: event.clientX, y: event.clientY });
    };

    const handleUp = (event: PointerEvent) => {
      const start = origin.current;
      if (!start) return;

      if (!dragging.current) {
        // A press with no movement. Let the click handler run the tap route.
        origin.current = null;
        return;
      }

      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);

      // jsdom, and some older engines, do not implement elementFromPoint.
      // Without it the drop simply falls back to the tap route.
      const element =
        typeof document.elementFromPoint === "function"
          ? document.elementFromPoint(event.clientX, event.clientY)
          : null;
      const target = element?.closest(`[${DROP_TARGET_ATTR}]`);
      const targetId = target?.getAttribute(DROP_TARGET_ATTR);

      if (targetId) {
        placeRef.current(start.itemId, targetId);
        reset();
        return;
      }

      // Released over nothing. Keep the item held so the tap route can finish
      // the move, rather than silently undoing the child's intent.
      origin.current = null;
      dragging.current = false;
      setGhost(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [disabled, reset]);

  return { held, ghost, pick, place, beginDrag, reset };
}
