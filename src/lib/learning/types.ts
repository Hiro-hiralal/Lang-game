import type { SkillId } from "@/lib/learning/skills";

/**
 * How the child produced the answer. `assisted` means the hint ladder had
 * already narrowed the choices before the answer landed — those successes are
 * recorded honestly and can never count toward `secure`.
 */
export type ResponseMode =
  | "tap"
  | "drag"
  | "trace"
  | "sequence"
  | "assisted";

export type LatencyBucket = "fast" | "typical" | "slow";

/** PRD section 8. Deliberately transparent and deterministic in v1. */
export type MasteryState =
  | "new"
  | "learning"
  | "practicing"
  | "secure"
  | "review";

/** One scored learning opportunity. The unit everything else is derived from. */
export interface Attempt {
  /** Activity key, e.g. "moon-mouse-lantern". */
  itemId: string;
  skillId: SkillId;
  sessionId: string;
  /** Epoch ms. */
  ts: number;
  correct: boolean;
  /** 0 = unaided. 3 = the ladder narrowed the choices. */
  hintLevel: number;
  retries: number;
  mode: ResponseMode;
  latencyMs: number;
  contentVersion: string;
  /**
   * Set on incorrect attempts so the dashboard can surface confusion pairs
   * (m/n, a/i). Option ids, never free text spoken by the child.
   */
  chosenId?: string;
  expectedId?: string;
}

export interface ConfusionPair {
  expectedId: string;
  chosenId: string;
  count: number;
}

export interface MasteryRecord {
  skillId: SkillId;
  state: MasteryState;
  totalAttempts: number;
  successes: number;
  /** Successes with no hints and no assist. Only these can reach `secure`. */
  independentSuccesses: number;
  assistedSuccesses: number;
  distinctSessions: number;
  firstSuccessAt: number | null;
  lastSuccessAt: number | null;
  lastAttemptAt: number | null;
  /** Share of first-try-correct across items, 0-1. */
  firstAttemptAccuracy: number;
  /** Share of successes that needed a hint, 0-1. Lower is better. */
  hintDependence: number;
  /** A success at least two days after the first one. Required for `secure`. */
  hasDelayedSuccess: boolean;
  medianLatencyMs: number | null;
  /** When spaced retrieval should surface this skill again. */
  dueAt: number | null;
  confusions: ConfusionPair[];
}

export type MasteryMap = Map<SkillId, MasteryRecord>;

/** One play session, used for real session counts and durations. */
export interface SessionRecord {
  id: string;
  startedAt: number;
  endedAt: number | null;
  adventureId: string;
  completed: boolean;
}

export interface AttemptStore {
  attempts(): Attempt[];
  sessions(): SessionRecord[];
  appendAttempt(attempt: Attempt): void;
  startSession(session: SessionRecord): void;
  endSession(sessionId: string, endedAt: number, completed: boolean): void;
  clear(): void;
}
