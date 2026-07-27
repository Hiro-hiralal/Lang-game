import { getSkill, type SkillId } from "@/lib/learning/skills";
import type {
  Attempt,
  MasteryMap,
  MasteryRecord,
  SessionRecord,
} from "@/lib/learning/types";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

/**
 * Below this many attempts, a percentage is noise dressed as evidence. The
 * dashboard says so instead of drawing a number.
 */
export const MIN_ATTEMPTS_FOR_RATE = 5;

export interface SkillSummary {
  skillId: SkillId;
  label: string;
  record: MasteryRecord;
  /** Null when there is not yet enough practice to say anything. */
  independentRate: number | null;
}

export interface DashboardStats {
  sessionsThisWeek: number;
  completedSessions: number;
  /** Null until at least one session has been finished. */
  medianSessionMs: number | null;
  totalAttempts: number;
  /** Share of successes reached with no hints. Null when evidence is thin. */
  independentRate: number | null;
  /** Successes on a skill at least two days after first getting it right. */
  delayedSuccesses: number;
  introduced: SkillSummary[];
  secure: SkillSummary[];
  needsPractice: SkillSummary[];
  confusions: Array<{ label: string; expectedId: string; chosenId: string; count: number }>;
  /** True when there is not yet enough evidence to report anything at all. */
  isEmpty: boolean;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function summarise(record: MasteryRecord): SkillSummary {
  return {
    skillId: record.skillId,
    label: getSkill(record.skillId).label,
    record,
    independentRate:
      record.successes >= MIN_ATTEMPTS_FOR_RATE
        ? record.independentSuccesses / record.successes
        : null,
  };
}

/**
 * Everything the grown-up view shows, derived from what actually happened.
 *
 * This replaces `SKILL_ROWS`, a hand-written array of five skills with
 * invented percentages, and an "average adventure: 5m 08s" that was a string
 * literal. Nothing here is a constant; where the evidence is too thin to
 * support a number, the field is null and the UI says so rather than filling
 * the gap. PRD section 11.
 */
export function buildDashboardStats(
  attempts: Attempt[],
  sessions: SessionRecord[],
  mastery: MasteryMap,
  now: number,
): DashboardStats {
  const finished = sessions.filter(
    (session) => session.endedAt !== null && session.completed,
  );
  const sessionsThisWeek = sessions.filter(
    (session) => now - session.startedAt <= WEEK_MS,
  ).length;

  const durations = finished
    .map((session) => (session.endedAt ?? 0) - session.startedAt)
    .filter((duration) => duration > 0);

  const successes = attempts.filter((attempt) => attempt.correct);
  const independent = successes.filter(
    (attempt) => attempt.hintLevel === 0 && attempt.mode !== "assisted",
  );

  const records = [...mastery.values()];
  const introduced = records
    .filter((record) => record.state !== "new")
    .map(summarise);

  const confusions = records
    .flatMap((record) =>
      record.confusions.map((pair) => ({
        label: getSkill(record.skillId).label,
        ...pair,
      })),
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return {
    sessionsThisWeek,
    completedSessions: finished.length,
    medianSessionMs: median(durations),
    totalAttempts: attempts.length,
    independentRate:
      successes.length >= MIN_ATTEMPTS_FOR_RATE
        ? independent.length / successes.length
        : null,
    delayedSuccesses: records.filter((record) => record.hasDelayedSuccess).length,
    introduced,
    secure: introduced.filter(
      (summary) =>
        summary.record.state === "secure" || summary.record.state === "review",
    ),
    needsPractice: introduced.filter(
      (summary) =>
        summary.record.state === "learning" ||
        summary.record.state === "practicing",
    ),
    confusions,
    isEmpty: attempts.length === 0,
  };
}

/** "5m 08s". Returns null rather than a placeholder when there is no data. */
export function formatDuration(ms: number | null): string | null {
  if (ms === null || ms <= 0) return null;
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function formatRate(rate: number | null): string | null {
  if (rate === null) return null;
  return `${Math.round(rate * 100)}%`;
}

/** Parent-facing wording for a mastery state. Never shown to the child. */
export const STATE_LABEL: Record<MasteryRecord["state"], string> = {
  new: "Not started",
  learning: "Just met it",
  practicing: "Practising",
  secure: "Secure",
  review: "Due for review",
};

export const STATE_COLOR: Record<MasteryRecord["state"], string> = {
  new: "#B9C4BC",
  learning: "#8E7AB9",
  practicing: "#5CA7B7",
  secure: "#6EAB72",
  review: "#E79A59",
};
