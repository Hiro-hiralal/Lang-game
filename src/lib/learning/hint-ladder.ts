import type { Activity, AnswerOption } from "@/lib/game-types";
import type { ResponseMode } from "@/lib/learning/types";

/**
 * PRD section 5: "Give the smallest useful hint: repeat -> emphasize sound ->
 * animate mouth/letter -> model -> offer two choices."
 *
 * This replaces the previous behaviour, where a wrong tap permanently disabled
 * that option. With three choices, two taps therefore guaranteed a correct
 * answer regardless of what the child knew, and nothing recorded how the answer
 * was reached. Now only the final rung narrows the field, and reaching it marks
 * the attempt `assisted` so it can never count toward mastery.
 */
export type HintLevel = 0 | 1 | 2 | 3 | 4;

export const MAX_HINT_LEVEL: HintLevel = 4;

/** The rung at which the choices narrow, and the answer stops being independent. */
export const ASSIST_LEVEL: HintLevel = 4;

export interface HintStep {
  level: HintLevel;
  voiceId: string;
  message: string;
  narrows: boolean;
}

export function nextHintLevel(current: HintLevel): HintLevel {
  return Math.min(current + 1, MAX_HINT_LEVEL) as HintLevel;
}

export function isAssisted(level: HintLevel): boolean {
  return level >= ASSIST_LEVEL;
}

export function responseMode(level: HintLevel, base: ResponseMode): ResponseMode {
  return isAssisted(level) ? "assisted" : base;
}

/** The line to deliver at a given rung. Level 0 is the plain prompt. */
export function hintStep(activity: Activity, level: HintLevel): HintStep {
  switch (level) {
    case 0:
    case 1:
      // Rung 1 is simply the prompt again, unhurried. Often that is enough.
      return {
        level,
        voiceId: activity.voice.prompt,
        message: activity.bubble.prompt,
        narrows: false,
      };
    case 2:
      return {
        level,
        voiceId: activity.voice.hints[0],
        message: activity.bubble.hints[0],
        narrows: false,
      };
    case 3:
      return {
        level,
        voiceId: activity.voice.hints[1],
        message: activity.bubble.hints[1],
        narrows: false,
      };
    default:
      return {
        level: MAX_HINT_LEVEL,
        voiceId: activity.voice.hints[1],
        message: `${activity.bubble.hints[1]} Let us try with just two choices.`,
        narrows: true,
      };
  }
}

/**
 * The final rung leaves the correct answer and one distractor. Prefer a
 * distractor the child has not already ruled out, so the pair still poses a
 * real question rather than re-offering a choice they just rejected.
 */
export function narrowOptions(
  options: AnswerOption[],
  triedIds: string[],
): AnswerOption[] {
  const correct = options.find((option) => option.correct);
  if (!correct) return options;

  const distractors = options.filter((option) => !option.correct);
  const untried = distractors.filter((option) => !triedIds.includes(option.id));
  const keep = untried[0] ?? distractors[0];
  if (!keep) return options;

  // Preserve the original on-screen order so the answer does not jump position.
  return options.filter(
    (option) => option.id === correct.id || option.id === keep.id,
  );
}

/**
 * Pictures are a decoding shortcut: a child who cannot read "mat" can still
 * pick the mat photograph. PRD section 7 requires the picture to arrive only
 * after the decoding attempt, so blending and word-building hide them until the
 * answer is in.
 */
export function hidesPicturesUntilAnswered(kind: Activity["kind"]): boolean {
  return kind === "blend" || kind === "word";
}
