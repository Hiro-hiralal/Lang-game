import { SKILLS, type SkillId } from "@/lib/learning/skills";
import type {
  Attempt,
  ConfusionPair,
  MasteryMap,
  MasteryRecord,
  MasteryState,
} from "@/lib/learning/types";

const DAY_MS = 86_400_000;

/** A success this long after the first one demonstrates retention, not recall. */
export const DELAYED_SUCCESS_MS = 2 * DAY_MS;

/** PRD section 8 thresholds, kept as named constants so tests read plainly. */
export const SECURE_INDEPENDENT_SUCCESSES = 4;
export const SECURE_DISTINCT_SESSIONS = 3;
export const PRACTICING_SUCCESSES = 3;
export const PRACTICING_DISTINCT_SESSIONS = 2;

/** Spaced retrieval ladder, applied once a skill is secure. */
export const REVIEW_INTERVALS_MS = [
  1 * DAY_MS,
  3 * DAY_MS,
  7 * DAY_MS,
  14 * DAY_MS,
];

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/**
 * An attempt counts as independent only when the child answered with no hints
 * and the hint ladder had not narrowed the options. This is the single rule
 * that keeps "Secure" meaningful: a child who only ever succeeds after being
 * shown the answer never reaches it.
 */
export function isIndependentSuccess(attempt: Attempt): boolean {
  return (
    attempt.correct && attempt.hintLevel === 0 && attempt.mode !== "assisted"
  );
}

function emptyRecord(skillId: SkillId): MasteryRecord {
  return {
    skillId,
    state: "new",
    totalAttempts: 0,
    successes: 0,
    independentSuccesses: 0,
    assistedSuccesses: 0,
    distinctSessions: 0,
    firstSuccessAt: null,
    lastSuccessAt: null,
    lastAttemptAt: null,
    firstAttemptAccuracy: 0,
    hintDependence: 0,
    hasDelayedSuccess: false,
    medianLatencyMs: null,
    dueAt: null,
    confusions: [],
  };
}

function classify(record: MasteryRecord, now: number): MasteryState {
  if (record.totalAttempts === 0) return "new";

  const secure =
    record.independentSuccesses >= SECURE_INDEPENDENT_SUCCESSES &&
    record.distinctSessions >= SECURE_DISTINCT_SESSIONS &&
    record.hasDelayedSuccess;

  if (secure) {
    // A secure skill that is due for spaced retrieval surfaces as `review` so
    // the composer pulls it back in. It has not been forgotten, just scheduled.
    return record.dueAt !== null && record.dueAt <= now ? "review" : "secure";
  }

  const practicing =
    record.successes >= PRACTICING_SUCCESSES &&
    record.distinctSessions >= PRACTICING_DISTINCT_SESSIONS;

  return practicing ? "practicing" : "learning";
}

function computeDueAt(record: MasteryRecord): number | null {
  if (record.lastSuccessAt === null) return null;
  if (record.independentSuccesses < SECURE_INDEPENDENT_SUCCESSES) return null;

  const step = Math.min(
    record.independentSuccesses - SECURE_INDEPENDENT_SUCCESSES,
    REVIEW_INTERVALS_MS.length - 1,
  );
  return record.lastSuccessAt + REVIEW_INTERVALS_MS[step];
}

function summariseConfusions(attempts: Attempt[]): ConfusionPair[] {
  const counts = new Map<string, ConfusionPair>();

  for (const attempt of attempts) {
    if (attempt.correct) continue;
    if (!attempt.chosenId || !attempt.expectedId) continue;
    const key = `${attempt.expectedId}>${attempt.chosenId}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        expectedId: attempt.expectedId,
        chosenId: attempt.chosenId,
        count: 1,
      });
    }
  }

  return [...counts.values()]
    .filter((pair) => pair.count > 1)
    .sort((a, b) => b.count - a.count);
}

/**
 * Share of items whose *first* encounter in a session was correct. Grouping by
 * (item, session) rather than by item keeps repeated practice of the same item
 * on later days from being scored as a first attempt.
 */
function computeFirstAttemptAccuracy(attempts: Attempt[]): number {
  const firstByItem = new Map<string, Attempt>();

  for (const attempt of attempts) {
    const key = `${attempt.sessionId}:${attempt.itemId}`;
    const existing = firstByItem.get(key);
    if (!existing || attempt.ts < existing.ts) {
      firstByItem.set(key, attempt);
    }
  }

  if (firstByItem.size === 0) return 0;
  const correct = [...firstByItem.values()].filter((a) => a.correct).length;
  return correct / firstByItem.size;
}

function buildRecord(
  skillId: SkillId,
  attempts: Attempt[],
  now: number,
): MasteryRecord {
  const record = emptyRecord(skillId);
  if (attempts.length === 0) return record;

  const ordered = [...attempts].sort((a, b) => a.ts - b.ts);
  const successes = ordered.filter((attempt) => attempt.correct);
  const independent = ordered.filter(isIndependentSuccess);

  record.totalAttempts = ordered.length;
  record.successes = successes.length;
  record.independentSuccesses = independent.length;
  record.assistedSuccesses = successes.length - independent.length;
  record.distinctSessions = new Set(ordered.map((a) => a.sessionId)).size;
  record.lastAttemptAt = ordered[ordered.length - 1].ts;
  record.firstSuccessAt = successes.length > 0 ? successes[0].ts : null;
  record.lastSuccessAt =
    successes.length > 0 ? successes[successes.length - 1].ts : null;
  record.firstAttemptAccuracy = computeFirstAttemptAccuracy(ordered);
  record.hintDependence =
    successes.length === 0
      ? 0
      : successes.filter((a) => a.hintLevel > 0 || a.mode === "assisted")
          .length / successes.length;
  record.medianLatencyMs = median(successes.map((a) => a.latencyMs));
  record.confusions = summariseConfusions(ordered);

  // Retention, not recall: an independent success well after the first one.
  if (record.firstSuccessAt !== null) {
    const firstAt = record.firstSuccessAt;
    record.hasDelayedSuccess = independent.some(
      (attempt) => attempt.ts - firstAt >= DELAYED_SUCCESS_MS,
    );
  }

  record.dueAt = computeDueAt(record);
  record.state = classify(record, now);

  return record;
}

/**
 * Derive mastery for every skill in the catalog. Pure: same attempts and same
 * `now` always produce the same map, which is what makes this testable and what
 * makes the parent dashboard reproducible.
 */
export function deriveMastery(attempts: Attempt[], now: number): MasteryMap {
  const bySkill = new Map<SkillId, Attempt[]>();

  for (const attempt of attempts) {
    const bucket = bySkill.get(attempt.skillId);
    if (bucket) {
      bucket.push(attempt);
    } else {
      bySkill.set(attempt.skillId, [attempt]);
    }
  }

  const map: MasteryMap = new Map();
  for (const skill of SKILLS) {
    map.set(skill.id, buildRecord(skill.id, bySkill.get(skill.id) ?? [], now));
  }
  return map;
}

/** True when every prerequisite is at least `practicing`. */
export function prerequisitesMet(
  skillId: SkillId,
  mastery: MasteryMap,
): boolean {
  const skill = SKILLS.find((entry) => entry.id === skillId);
  if (!skill) return false;

  return skill.prerequisites.every((prerequisite) => {
    const state = mastery.get(prerequisite)?.state ?? "new";
    return state === "practicing" || state === "secure" || state === "review";
  });
}

export function isIntroduced(record: MasteryRecord): boolean {
  return record.state !== "new";
}
