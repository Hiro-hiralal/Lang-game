import type { Activity } from "@/lib/game-types";
import type { HintLevel } from "@/lib/learning/hint-ladder";
import type { ResponseMode } from "@/lib/learning/types";

/**
 * How a child answers an item.
 *
 * Every activity in the game used to be `choice` — tap one of three — sixty
 * times over. One interaction repeated cannot teach transfer, so an activity
 * now declares which system renders it. `choice` stays the default so existing
 * content keeps working unchanged.
 */
export type InteractionKind =
  | "choice"
  | "sort"
  | "blend-sweep"
  | "trace"
  | "build"
  | "syllables"
  | "read-along";

/** Drag pictures into labelled baskets, e.g. words that rhyme with "cat". */
export interface SortBasket {
  id: string;
  label: string;
  icon?: string;
}

export interface SortItem {
  id: string;
  label: string;
  spokenLabel: string;
  icon: string;
  /** The basket this item belongs in. */
  basketId: string;
}

export interface SortConfig {
  baskets: SortBasket[];
  items: SortItem[];
}

/** Sweep left to right across stones, holding each sound into the next. */
export interface BlendSweepConfig {
  /** One grapheme per stone, in reading order. */
  graphemes: string[];
  /** How each sound is written for narration, e.g. "mmmmm". */
  phonemes: string[];
  /** The word the sweep produces. */
  word: string;
}

/** Trace a letter along an animated stroke guide. */
export interface TraceConfig {
  letter: string;
  /**
   * Reinforcement, never assessment. PRD section 3 lists handwriting
   * instruction as a non-goal, so tolerance is generous and the child can
   * always move on.
   */
  toleranceFraction?: number;
}

/** Build a word by dragging letter tiles into slots. */
export interface BuildConfig {
  word: string;
  /** Tiles offered, including distractors. */
  tiles: string[];
  /**
   * Pre-filled slots. `null` means the child fills it. A single null in
   * ["s", null, "t"] is a medial-vowel substitution; all null is a full build.
   */
  slots: (string | null)[];
}

/** Tap or clap once per syllable. */
export interface SyllablesConfig {
  word: string;
  count: number;
  icon?: string;
}

/** Read a short decodable text with word-by-word highlighting. */
export interface ReadAlongConfig {
  lines: string[];
  /** Milliseconds each word stays highlighted during playback. */
  wordDurationMs?: number;
  /** Narration line id for the whole passage. */
  narrationId?: string;
}

/** What an activity system reports back when the child produces an answer. */
export interface ActivityResult {
  correct: boolean;
  mode: ResponseMode;
  /** Option or item id the child picked, for confusion tracking. */
  chosenId?: string;
  expectedId?: string;
}

/**
 * The contract every activity system implements. Systems own their own
 * interaction and accessibility affordances; the session shell owns the hint
 * ladder, narration, attempt recording and progression.
 */
export interface ActivityViewProps {
  activity: Activity;
  reducedMotion: boolean;
  /** True once the item is solved. Systems must stop accepting input. */
  answered: boolean;
  hintLevel: HintLevel;
  onAnswer: (result: ActivityResult) => void;
  speak: (voiceId: string, fallback: string) => void;
}

export function interactionOf(activity: Activity): InteractionKind {
  return activity.interaction ?? "choice";
}

/**
 * Systems where the child manipulates, orders or produces something, as
 * opposed to picking from a list. PRD-aligned target: most of a session's
 * scored opportunities should come from these.
 */
const MANIPULATIVE: InteractionKind[] = [
  "sort",
  "blend-sweep",
  "trace",
  "build",
  "syllables",
  "read-along",
];

export function isManipulative(kind: InteractionKind): boolean {
  return MANIPULATIVE.includes(kind);
}

export function manipulationShare(activities: Activity[]): number {
  if (activities.length === 0) return 0;
  const manipulative = activities.filter((activity) =>
    isManipulative(interactionOf(activity)),
  ).length;
  return manipulative / activities.length;
}
