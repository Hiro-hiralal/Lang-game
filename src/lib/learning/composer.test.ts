import { describe, expect, it } from "vitest";
import {
  composeSession,
  dueForReview,
  newSkillCount,
  nextNewSkill,
  seededRandom,
} from "@/lib/learning/composer";
import { deriveMastery } from "@/lib/learning/mastery";
import type { SkillId } from "@/lib/learning/skills";
import type { Attempt } from "@/lib/learning/types";
import type { Activity } from "@/lib/game-types";

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 1);

function activity(key: string, skillId: SkillId): Activity {
  return {
    key,
    id: "sound-safari",
    kind: "rhyme",
    skillId,
    title: key,
    eyebrow: "",
    instruction: "",
    prompt: "",
    helper: "",
    options: [],
    celebration: "",
    skill: skillId,
    voice: { prompt: "p", hints: ["h1", "h2"], correct: "c", wrong: {} },
    bubble: { prompt: "", hints: ["", ""], correct: "", wrong: {} },
  };
}

/** Several activities per skill, so the composer has room to choose. */
const CATALOG: Activity[] = [
  "rhyme",
  "syllables",
  "first-sound",
  "last-sound",
  "ls-m",
  "ls-a",
  "ls-t",
  "ls-s",
  "blend-cvc",
  "build-cvc",
  "heart-words",
  "connected-text",
  "story-meaning",
].flatMap((skillId) =>
  [1, 2, 3].map((n) => activity(`${skillId}-${n}`, skillId as SkillId)),
);

function attempt(overrides: Partial<Attempt> & { skillId: SkillId }): Attempt {
  return {
    itemId: "item",
    sessionId: "s1",
    ts: T0,
    correct: true,
    hintLevel: 0,
    retries: 0,
    mode: "tap",
    latencyMs: 3000,
    contentVersion: "test",
    ...overrides,
  };
}

/** Four independent successes across three sessions, one of them delayed. */
function secure(skillId: SkillId, offset = 0): Attempt[] {
  return [
    attempt({ skillId, sessionId: "s1", ts: T0 + offset }),
    attempt({ skillId, sessionId: "s2", ts: T0 + offset + DAY }),
    attempt({ skillId, sessionId: "s3", ts: T0 + offset + 2 * DAY }),
    attempt({ skillId, sessionId: "s3", ts: T0 + offset + 2 * DAY + 500 }),
  ];
}

function practising(skillId: SkillId): Attempt[] {
  return [
    attempt({ skillId, sessionId: "p1", ts: T0 }),
    attempt({ skillId, sessionId: "p1", ts: T0 + 100 }),
    attempt({ skillId, sessionId: "p2", ts: T0 + DAY }),
  ];
}

describe("seededRandom", () => {
  it("is reproducible for a given seed", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("differs across seeds", () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });
});

describe("nextNewSkill", () => {
  it("opens with the first skill in the sequence for a brand-new child", () => {
    expect(nextNewSkill(deriveMastery([], T0))).toBe("rhyme");
  });

  it("will not offer a skill whose prerequisites are unmet", () => {
    const mastery = deriveMastery([], T0);
    // Blending needs first-sound and the core letter-sounds, none of which
    // this child has touched.
    expect(nextNewSkill(mastery)).not.toBe("blend-cvc");
  });

  it("moves on once the earlier skill is practising", () => {
    const mastery = deriveMastery(practising("rhyme"), T0 + DAY);
    expect(nextNewSkill(mastery)).not.toBe("rhyme");
  });
});

describe("composeSession", () => {
  const now = T0 + 3 * DAY;

  it("gives a brand-new child exactly one new concept", () => {
    const mastery = deriveMastery([], now);
    const session = composeSession({
      mastery,
      catalog: CATALOG,
      now,
      seed: 1,
    });

    expect(session.length).toBeGreaterThan(0);
    expect(newSkillCount(session, mastery)).toBe(1);
  });

  it("never introduces two new skills, however long the session", () => {
    const mastery = deriveMastery(
      [...secure("rhyme"), ...secure("syllables"), ...practising("first-sound")],
      now,
    );
    const session = composeSession({
      mastery,
      catalog: CATALOG,
      now,
      seed: 7,
      length: 14,
    });

    expect(newSkillCount(session, mastery)).toBeLessThanOrEqual(1);
  });

  it("opens on something the child can already do", () => {
    const mastery = deriveMastery(
      [...secure("rhyme"), ...practising("first-sound")],
      now,
    );
    const session = composeSession({
      mastery,
      catalog: CATALOG,
      now,
      seed: 3,
    });

    expect(session[0].role).toBe("warm-up");
    expect(["secure", "review"]).toContain(session[0].state);
  });

  it("weights the session toward what is already secure", () => {
    const attempts = [
      ...secure("rhyme"),
      ...secure("syllables"),
      ...secure("first-sound"),
      ...secure("ls-m"),
      ...practising("ls-a"),
    ];
    const mastery = deriveMastery(attempts, now);
    const session = composeSession({
      mastery,
      catalog: CATALOG,
      now,
      seed: 5,
      length: 10,
    });

    const consolidating = session.filter(
      (item) => item.state === "secure" || item.state === "review",
    );
    // PRD section 8 targets roughly 60% secure/review.
    expect(consolidating.length / session.length).toBeGreaterThanOrEqual(0.5);
  });

  it("is deterministic for a given seed and unstable across seeds", () => {
    const mastery = deriveMastery(
      [...secure("rhyme"), ...secure("syllables"), ...practising("first-sound")],
      now,
    );
    const options = { mastery, catalog: CATALOG, now, length: 8 };

    const a = composeSession({ ...options, seed: 11 }).map((i) => i.activity.key);
    const b = composeSession({ ...options, seed: 11 }).map((i) => i.activity.key);
    const c = composeSession({ ...options, seed: 12 }).map((i) => i.activity.key);

    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("never repeats the same activity inside one session", () => {
    const mastery = deriveMastery(
      [...secure("rhyme"), ...secure("syllables")],
      now,
    );
    const session = composeSession({
      mastery,
      catalog: CATALOG,
      now,
      seed: 9,
      length: 12,
    });

    const keys = session.map((item) => item.activity.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("prioritises skills that spaced retrieval says are due", () => {
    // Secured a week ago, so its review interval has long since elapsed.
    const stale = secure("rhyme", -8 * DAY);
    const fresh = secure("syllables", -1 * DAY);
    const mastery = deriveMastery([...stale, ...fresh], now);

    expect(dueForReview(mastery, now)).toContain("rhyme");

    const session = composeSession({
      mastery,
      catalog: CATALOG,
      now,
      seed: 4,
      length: 8,
    });
    expect(session.map((item) => item.skillId)).toContain("rhyme");
  });

  it("finishes in connected text once the child is ready for it", () => {
    const attempts = [
      ...secure("rhyme"),
      ...secure("first-sound"),
      ...secure("ls-m"),
      ...secure("ls-a"),
      ...secure("ls-t"),
      ...secure("blend-cvc"),
      ...secure("heart-words"),
    ];
    const mastery = deriveMastery(attempts, now);
    const session = composeSession({
      mastery,
      catalog: CATALOG,
      now,
      seed: 2,
      length: 10,
    });

    expect(session.some((item) => item.role === "application")).toBe(true);
  });

  it("does not force connected text on a child with no letter-sounds yet", () => {
    const mastery = deriveMastery([], now);
    const session = composeSession({
      mastery,
      catalog: CATALOG,
      now,
      seed: 6,
    });

    expect(session.some((item) => item.skillId === "connected-text")).toBe(false);
  });

  it("returns nothing rather than inventing items when the catalog is empty", () => {
    expect(
      composeSession({
        mastery: deriveMastery([], now),
        catalog: [],
        now,
        seed: 1,
      }),
    ).toEqual([]);
  });
});
