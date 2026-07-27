import { prerequisitesMet } from "@/lib/learning/mastery";
import { SKILL_SEQUENCE, type SkillId } from "@/lib/learning/skills";
import type { MasteryMap, MasteryState } from "@/lib/learning/types";
import type { Activity } from "@/lib/game-types";

/**
 * Deterministic small PRNG (mulberry32).
 *
 * The composer has to make choices — which review item, which of two equally
 * ready skills — without being the same every single day or different on every
 * render. Seeding it means a given child on a given day gets a stable session,
 * and tests get reproducible output.
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

/** Roles a slot can play, in the order they are placed in the session. */
export type SlotRole = "warm-up" | "review" | "focus" | "stretch" | "application";

export interface ComposedItem {
  activity: Activity;
  role: SlotRole;
  skillId: SkillId;
  state: MasteryState;
}

export interface ComposeOptions {
  mastery: MasteryMap;
  catalog: Activity[];
  now: number;
  seed: number;
  /** Total scored opportunities to place. PRD section 6 targets 8-14. */
  length?: number;
}

const DEFAULT_LENGTH = 10;

/**
 * PRD section 8 mix: roughly 60% secure/review, 25% current focus, 15% new.
 * These are targets for slot counts, not hard quotas — a child with nothing
 * secure yet cannot be given six secure items.
 */
const SECURE_SHARE = 0.6;
const FOCUS_SHARE = 0.25;

function statesOf(mastery: MasteryMap, skillId: SkillId): MasteryState {
  return mastery.get(skillId)?.state ?? "new";
}

function activitiesForSkill(catalog: Activity[], skillId: SkillId): Activity[] {
  return catalog.filter((activity) => activity.skillId === skillId);
}

/**
 * The single next skill this child is ready to meet: earliest in the teaching
 * sequence, untouched, and with every prerequisite already at practicing.
 */
export function nextNewSkill(mastery: MasteryMap): SkillId | null {
  for (const skillId of SKILL_SEQUENCE) {
    if (statesOf(mastery, skillId) !== "new") continue;
    if (!prerequisitesMet(skillId, mastery)) continue;
    return skillId;
  }
  return null;
}

export function skillsInState(
  mastery: MasteryMap,
  states: MasteryState[],
): SkillId[] {
  return SKILL_SEQUENCE.filter((skillId) =>
    states.includes(statesOf(mastery, skillId)),
  );
}

/**
 * Skills due for spaced retrieval, soonest first. `deriveMastery` has already
 * flipped these from `secure` to `review` once their interval elapsed.
 */
export function dueForReview(mastery: MasteryMap, now: number): SkillId[] {
  return SKILL_SEQUENCE.filter((skillId) => {
    const record = mastery.get(skillId);
    return (
      record?.state === "review" && record.dueAt !== null && record.dueAt <= now
    );
  }).sort((a, b) => (mastery.get(a)?.dueAt ?? 0) - (mastery.get(b)?.dueAt ?? 0));
}

/**
 * Assembles one session from what the child has actually demonstrated.
 *
 * Replaces the previous `getDailyAdventure`, which rotated on
 * `Date.now() / 86_400_000` — the same chapter for everyone on a given day,
 * regardless of what any particular child knew.
 *
 * Shape: one confidence-building warm-up, targeted review, current focus, at
 * most one new skill, and a connected-text application to finish, because a
 * session that never reaches real text never practises reading.
 */
export function composeSession({
  mastery,
  catalog,
  now,
  seed,
  length = DEFAULT_LENGTH,
}: ComposeOptions): ComposedItem[] {
  const random = seededRandom(seed);
  const items: ComposedItem[] = [];
  const usedKeys = new Set<string>();

  const take = (skillId: SkillId, role: SlotRole): boolean => {
    const candidates = activitiesForSkill(catalog, skillId).filter(
      (activity) => !usedKeys.has(activity.key),
    );
    if (candidates.length === 0) return false;

    const chosen = shuffle(candidates, random)[0];
    usedKeys.add(chosen.key);
    items.push({
      activity: chosen,
      role,
      skillId,
      state: statesOf(mastery, skillId),
    });
    return true;
  };

  const secureOrReview = skillsInState(mastery, ["secure", "review"]);
  const practising = skillsInState(mastery, ["practicing", "learning"]);
  const reviewDue = dueForReview(mastery, now);

  // 1. Warm-up. Something they can already do, so the session opens on a win.
  const warmUpPool = secureOrReview.length > 0 ? secureOrReview : practising;
  for (const skillId of shuffle(warmUpPool, random)) {
    if (take(skillId, "warm-up")) break;
  }

  // 2. Review, weighted to whatever spaced retrieval says is due.
  const reviewTarget = Math.max(
    0,
    Math.round(length * SECURE_SHARE) - items.length,
  );
  const reviewPool = [
    ...reviewDue,
    ...shuffle(
      secureOrReview.filter((skillId) => !reviewDue.includes(skillId)),
      random,
    ),
  ];
  let placed = 0;
  for (const skillId of reviewPool) {
    if (placed >= reviewTarget) break;
    if (take(skillId, "review")) placed += 1;
  }

  // 3. Current focus: what they are mid-way through.
  const focusTarget = Math.round(length * FOCUS_SHARE);
  placed = 0;
  for (const skillId of shuffle(practising, random)) {
    if (placed >= focusTarget) break;
    if (take(skillId, "focus")) placed += 1;
  }

  // 4. At most one new concept, ever. PRD section 5.
  const newSkill = nextNewSkill(mastery);
  if (newSkill) take(newSkill, "stretch");

  // 5. Finish in connected text whenever the child is ready for it, so the
  //    session ends in reading rather than in isolated items.
  const textSkills: SkillId[] = ["connected-text", "story-meaning"];
  for (const skillId of textSkills) {
    if (statesOf(mastery, skillId) === "new" && !prerequisitesMet(skillId, mastery)) {
      continue;
    }
    if (take(skillId, "application")) break;
  }

  // 6. Top up from anything already introduced, never with a second new skill.
  if (items.length < length) {
    const fillPool = shuffle([...secureOrReview, ...practising], random);
    for (const skillId of fillPool) {
      if (items.length >= length) break;
      take(skillId, "review");
    }
  }

  return items.slice(0, length);
}

interface AdventureLike {
  id: string;
  chapter: number;
  regionId: string;
  activities: Activity[];
}

/**
 * Picks the chapter to offer as today's quest.
 *
 * Replaces a rotation on `Date.now() / 86_400_000`, which handed every child
 * in the world the same chapter on a given day regardless of what any of them
 * knew. Preference order: the chapter that introduces the one skill this child
 * is ready to meet, then whichever unlocked chapter covers the most skills due
 * for review, then the first chapter they have not finished.
 */
export function pickDailyAdventure<T extends AdventureLike>(
  adventures: T[],
  completedIds: string[],
  mastery: MasteryMap,
  now: number,
): T | undefined {
  if (adventures.length === 0) return undefined;

  const unlocked = adventures.filter((adventure) => {
    const siblings = adventures.filter(
      (entry) => entry.regionId === adventure.regionId,
    );
    const previous = siblings[adventure.chapter - 2];
    return !previous || completedIds.includes(previous.id);
  });
  const pool = unlocked.length > 0 ? unlocked : adventures;
  const unfinished = pool.filter(
    (adventure) => !completedIds.includes(adventure.id),
  );
  const candidates = unfinished.length > 0 ? unfinished : pool;

  const newSkill = nextNewSkill(mastery);
  if (newSkill) {
    const introduces = candidates.find((adventure) =>
      adventure.activities.some((activity) => activity.skillId === newSkill),
    );
    if (introduces) return introduces;
  }

  const due = new Set(dueForReview(mastery, now));
  if (due.size > 0) {
    const scored = candidates
      .map((adventure) => ({
        adventure,
        score: adventure.activities.filter((activity) =>
          due.has(activity.skillId),
        ).length,
      }))
      .sort((a, b) => b.score - a.score);
    if (scored[0]?.score > 0) return scored[0].adventure;
  }

  return candidates[0];
}

/** Count of genuinely new skills in a composed session. Must never exceed one. */
export function newSkillCount(
  items: ComposedItem[],
  mastery: MasteryMap,
): number {
  const skills = new Set(
    items
      .filter((item) => statesOf(mastery, item.skillId) === "new")
      .map((item) => item.skillId),
  );
  return skills.size;
}
