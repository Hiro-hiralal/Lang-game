"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, RotateCcw } from "lucide-react";
import { strokesFor } from "@/lib/letter-strokes";
import type { ActivityViewProps } from "@/lib/activity-types";

const VIEWBOX = 100;
const DEFAULT_TOLERANCE = 0.14;
/** Share of guide points the finger must pass near for the stroke to count. */
const COVERAGE_TARGET = 0.6;
const SAMPLES_PER_STROKE = 48;

interface Point {
  x: number;
  y: number;
}

/**
 * Trace a letter along an animated stroke guide.
 *
 * Deliberately forgiving, and deliberately not a gate. The child can accept
 * their trace at any point, and the activity never blocks story progress on
 * motor accuracy — PRD section 3 rules handwriting instruction out of scope,
 * so this exists to connect the shape to the sound, nothing more.
 */
export function TraceLetter({
  activity,
  reducedMotion,
  answered,
  onAnswer,
  speak,
}: ActivityViewProps) {
  const config = activity.trace;
  const letter = config?.letter ?? "";
  const strokes = strokesFor(letter);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const drawn = useRef<Point[]>([]);
  const [strokeIndex, setStrokeIndex] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [trail, setTrail] = useState<Point[]>([]);

  const tolerance =
    (config?.toleranceFraction ?? DEFAULT_TOLERANCE) * VIEWBOX;

  const toLocal = useCallback((event: React.PointerEvent): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEWBOX,
      y: ((event.clientY - rect.top) / rect.height) * VIEWBOX,
    };
  }, []);

  /**
   * Sample the guide and ask what share of it the finger passed near. jsdom and
   * older engines lack `getPointAtLength`; when it is unavailable the stroke is
   * accepted rather than blocking the child on a browser capability.
   */
  const strokeCoverage = useCallback((index: number): number => {
    const path = pathRefs.current[index];
    if (!path || typeof path.getPointAtLength !== "function") return 1;

    let length = 0;
    try {
      length = path.getTotalLength();
    } catch {
      return 1;
    }
    if (!Number.isFinite(length) || length === 0) return 1;

    let hits = 0;
    for (let step = 0; step <= SAMPLES_PER_STROKE; step += 1) {
      const point = path.getPointAtLength((length * step) / SAMPLES_PER_STROKE);
      const near = drawn.current.some((entry) => {
        const dx = entry.x - point.x;
        const dy = entry.y - point.y;
        return Math.sqrt(dx * dx + dy * dy) <= tolerance;
      });
      if (near) hits += 1;
    }

    return hits / (SAMPLES_PER_STROKE + 1);
  }, [tolerance]);

  const finishStroke = useCallback(() => {
    if (!drawing) return;
    setDrawing(false);

    const covered = strokeCoverage(strokeIndex) >= COVERAGE_TARGET;
    drawn.current = [];
    setTrail([]);

    if (!covered) return;

    const next = strokeIndex + 1;
    setStrokeIndex(next);

    if (next >= strokes.length) {
      speak(activity.voice.correct, activity.celebration);
      onAnswer({ correct: true, mode: "trace", expectedId: letter });
    }
  }, [
    activity.celebration,
    activity.voice.correct,
    drawing,
    letter,
    onAnswer,
    speak,
    strokeCoverage,
    strokeIndex,
    strokes.length,
  ]);

  if (!config || strokes.length === 0) return null;

  const handleDown = (event: React.PointerEvent) => {
    if (answered) return;
    const point = toLocal(event);
    if (!point) return;
    drawn.current = [point];
    setTrail([point]);
    setDrawing(true);
  };

  const handleMove = (event: React.PointerEvent) => {
    if (!drawing || answered) return;
    const point = toLocal(event);
    if (!point) return;
    drawn.current = [...drawn.current, point];
    setTrail((current) => [...current, point]);
  };

  const restart = () => {
    drawn.current = [];
    setTrail([]);
    setStrokeIndex(0);
  };

  /** Always available. Tracing must never be the reason a child cannot continue. */
  const acceptTrace = () => {
    if (answered) return;
    onAnswer({ correct: true, mode: "trace", expectedId: letter });
  };

  const trailPath =
    trail.length > 1
      ? trail
          .map((point, index) =>
            `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`,
          )
          .join(" ")
      : "";

  return (
    <div className="activity-visual tracer">
      <svg
        ref={svgRef}
        className="tracer__canvas"
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        role="img"
        aria-label={`Trace the letter ${letter}`}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={finishStroke}
        onPointerLeave={finishStroke}
        onPointerCancel={finishStroke}
      >
        <line className="tracer__rule" x1="6" y1="78" x2="94" y2="78" />
        <line className="tracer__rule tracer__rule--dashed" x1="6" y1="44" x2="94" y2="44" />

        {strokes.map((stroke, index) => (
          <path
            key={index}
            ref={(node) => {
              pathRefs.current[index] = node;
            }}
            d={stroke}
            className={`tracer__guide ${index < strokeIndex ? "tracer__guide--done" : ""} ${index === strokeIndex ? "tracer__guide--active" : ""}`}
          />
        ))}

        {strokeIndex < strokes.length && !reducedMotion && (
          <motion.circle
            className="tracer__pip"
            r="4.5"
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{ offsetPath: `path("${strokes[strokeIndex]}")` }}
          />
        )}

        {trailPath && <path className="tracer__trail" d={trailPath} />}
      </svg>

      <p className="tracer__caption" aria-live="polite">
        {answered
          ? `You traced ${letter}!`
          : `Stroke ${Math.min(strokeIndex + 1, strokes.length)} of ${strokes.length} · follow the glowing path`}
      </p>

      {!answered && (
        <div className="tracer__actions">
          <button type="button" className="tracer__reset" onClick={restart}>
            <RotateCcw aria-hidden="true" />
            Try the trace again
          </button>
          <button type="button" className="tracer__accept" onClick={acceptTrace}>
            <Check aria-hidden="true" />
            I traced it
          </button>
        </div>
      )}
    </div>
  );
}
