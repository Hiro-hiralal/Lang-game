import { describe, expect, it } from "vitest";
import {
  DELAYED_SUCCESS_MS,
  deriveMastery,
  isIndependentSuccess,
  prerequisitesMet,
} from "@/lib/learning/mastery";
import type { Attempt, ResponseMode } from "@/lib/learning/types";
import type { SkillId } from "@/lib/learning/skills";

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 1);

interface AttemptOverrides {
  skillId?: SkillId;
  sessionId?: string;
  itemId?: string;
  ts?: number;
  correct?: boolean;
  hintLevel?: number;
  mode?: ResponseMode;
  chosenId?: string;
  expectedId?: string;
}

function attempt(overrides: AttemptOverrides = {}): Attempt {
  return {
    itemId: "item-1",
    skillId: "rhyme",
    sessionId: "session-1",
    ts: T0,
    correct: true,
    hintLevel: 0,
    retries: 0,
    mode: "tap",
    latencyMs: 4000,
    contentVersion: "test",
    ...overrides,
  };
}

/** Four independent successes across three sessions, the last one delayed. */
function securingRun(skillId: SkillId = "rhyme"): Attempt[] {
  return [
    attempt({ skillId, sessionId: "s1", ts: T0 }),
    attempt({ skillId, sessionId: "s2", ts: T0 + DAY }),
    attempt({ skillId, sessionId: "s3", ts: T0 + 2 * DAY }),
    attempt({ skillId, sessionId: "s3", ts: T0 + 2 * DAY + 1000 }),
  ];
}

describe("deriveMastery", () => {
  it("reports every catalog skill as new when there are no attempts", () => {
    const mastery = deriveMastery([], T0);
    expect(mastery.get("rhyme")?.state).toBe("new");
    expect(mastery.get("connected-text")?.state).toBe("new");
    expect(mastery.get("rhyme")?.totalAttempts).toBe(0);
  });

  it("moves a skill to learning after a first success", () => {
    const mastery = deriveMastery([attempt()], T0);
    expect(mastery.get("rhyme")?.state).toBe("learning");
  });

  it("stays learning while successes are confined to one session", () => {
    const attempts = [
      attempt({ ts: T0 }),
      attempt({ ts: T0 + 1000 }),
      attempt({ ts: T0 + 2000 }),
      attempt({ ts: T0 + 3000 }),
    ];
    const mastery = deriveMastery(attempts, T0 + 4000);
    // Four successes, but a single sitting is recall, not retention.
    expect(mastery.get("rhyme")?.state).toBe("learning");
  });

  it("reaches practicing at three successes across two sessions", () => {
    const attempts = [
      attempt({ sessionId: "s1", ts: T0 }),
      attempt({ sessionId: "s1", ts: T0 + 1000 }),
      attempt({ sessionId: "s2", ts: T0 + DAY }),
    ];
    const mastery = deriveMastery(attempts, T0 + DAY);
    expect(mastery.get("rhyme")?.state).toBe("practicing");
  });

  it("reaches secure only with a delayed independent success", () => {
    const mastery = deriveMastery(securingRun(), T0 + 2 * DAY + 2000);
    const record = mastery.get("rhyme");
    expect(record?.state).toBe("secure");
    expect(record?.hasDelayedSuccess).toBe(true);
    expect(record?.independentSuccesses).toBe(4);
  });

  it("withholds secure when all four successes land inside the delay window", () => {
    const attempts = [
      attempt({ sessionId: "s1", ts: T0 }),
      attempt({ sessionId: "s2", ts: T0 + 1000 }),
      attempt({ sessionId: "s3", ts: T0 + 2000 }),
      attempt({ sessionId: "s4", ts: T0 + 3000 }),
    ];
    const mastery = deriveMastery(attempts, T0 + 4000);
    expect(mastery.get("rhyme")?.state).toBe("practicing");
    expect(mastery.get("rhyme")?.hasDelayedSuccess).toBe(false);
  });

  it("surfaces a secure skill as review once spaced retrieval comes due", () => {
    const attempts = securingRun();
    const lastSuccess = T0 + 2 * DAY + 1000;
    const before = deriveMastery(attempts, lastSuccess + DAY / 2);
    const after = deriveMastery(attempts, lastSuccess + DAY + 1000);

    expect(before.get("rhyme")?.state).toBe("secure");
    expect(after.get("rhyme")?.state).toBe("review");
  });
});

describe("assisted successes", () => {
  it("does not count a hinted answer as independent", () => {
    expect(isIndependentSuccess(attempt({ hintLevel: 1 }))).toBe(false);
    expect(isIndependentSuccess(attempt({ mode: "assisted" }))).toBe(false);
    expect(isIndependentSuccess(attempt({ correct: false }))).toBe(false);
    expect(isIndependentSuccess(attempt())).toBe(true);
  });

  it("never reaches secure on assisted successes alone", () => {
    // Twenty perfect answers, every one of them after the ladder narrowed the
    // choices. This is the child who always needs to be shown the answer.
    const attempts = Array.from({ length: 20 }, (_, index) =>
      attempt({
        sessionId: `s${index}`,
        ts: T0 + index * DAY,
        hintLevel: 3,
        mode: "assisted",
      }),
    );

    const mastery = deriveMastery(attempts, T0 + 21 * DAY);
    const record = mastery.get("rhyme");

    expect(record?.successes).toBe(20);
    expect(record?.independentSuccesses).toBe(0);
    expect(record?.assistedSuccesses).toBe(20);
    expect(record?.state).toBe("practicing");
    expect(record?.state).not.toBe("secure");
  });

  it("tracks hint dependence as a share of successes", () => {
    const attempts = [
      attempt({ sessionId: "s1", ts: T0, hintLevel: 0 }),
      attempt({ sessionId: "s2", ts: T0 + DAY, hintLevel: 2 }),
      attempt({ sessionId: "s3", ts: T0 + 2 * DAY, hintLevel: 2 }),
      attempt({ sessionId: "s4", ts: T0 + 3 * DAY, hintLevel: 2 }),
    ];
    const mastery = deriveMastery(attempts, T0 + 4 * DAY);
    expect(mastery.get("rhyme")?.hintDependence).toBe(0.75);
  });
});

describe("evidence for the parent dashboard", () => {
  it("scores first-attempt accuracy per item per session", () => {
    const attempts = [
      // First encounter wrong, then corrected — one item, scored as a miss.
      attempt({ itemId: "a", sessionId: "s1", ts: T0, correct: false }),
      attempt({ itemId: "a", sessionId: "s1", ts: T0 + 500, correct: true }),
      // Clean first attempt on a second item.
      attempt({ itemId: "b", sessionId: "s1", ts: T0 + 1000, correct: true }),
    ];
    const mastery = deriveMastery(attempts, T0 + 2000);
    expect(mastery.get("rhyme")?.firstAttemptAccuracy).toBe(0.5);
  });

  it("surfaces repeated confusions but ignores one-offs", () => {
    const attempts = [
      attempt({ correct: false, expectedId: "m", chosenId: "n", ts: T0 }),
      attempt({ correct: false, expectedId: "m", chosenId: "n", ts: T0 + 10 }),
      attempt({ correct: false, expectedId: "m", chosenId: "s", ts: T0 + 20 }),
    ];
    const mastery = deriveMastery(attempts, T0 + 30);
    const confusions = mastery.get("rhyme")?.confusions ?? [];

    expect(confusions).toHaveLength(1);
    expect(confusions[0]).toMatchObject({
      expectedId: "m",
      chosenId: "n",
      count: 2,
    });
  });

  it("takes median latency from successful attempts only", () => {
    const attempts = [
      { ...attempt({ ts: T0 }), latencyMs: 1000 },
      { ...attempt({ ts: T0 + 10 }), latencyMs: 3000 },
      { ...attempt({ ts: T0 + 20 }), latencyMs: 5000 },
      { ...attempt({ ts: T0 + 30, correct: false }), latencyMs: 60_000 },
    ];
    const mastery = deriveMastery(attempts, T0 + 40);
    expect(mastery.get("rhyme")?.medianLatencyMs).toBe(3000);
  });
});

describe("prerequisitesMet", () => {
  it("keeps a skill closed until its prerequisites are practicing", () => {
    const empty = deriveMastery([], T0);
    expect(prerequisitesMet("rhyme", empty)).toBe(true);
    expect(prerequisitesMet("first-sound", empty)).toBe(false);
  });

  it("opens a skill once its prerequisite reaches practicing", () => {
    const mastery = deriveMastery(
      [
        attempt({ skillId: "rhyme", sessionId: "s1", ts: T0 }),
        attempt({ skillId: "rhyme", sessionId: "s1", ts: T0 + 10 }),
        attempt({ skillId: "rhyme", sessionId: "s2", ts: T0 + DAY }),
      ],
      T0 + DAY,
    );

    expect(mastery.get("rhyme")?.state).toBe("practicing");
    expect(prerequisitesMet("first-sound", mastery)).toBe(true);
    // Blending still waits on the core letter-sounds.
    expect(prerequisitesMet("blend-cvc", mastery)).toBe(false);
  });

  it("requires every prerequisite, not just the first", () => {
    const attempts = [
      ...securingRun("first-sound"),
      ...securingRun("ls-m"),
      ...securingRun("ls-a"),
    ];
    const partial = deriveMastery(attempts, T0 + 3 * DAY);
    // ls-t is still untouched, so blending stays closed.
    expect(prerequisitesMet("blend-cvc", partial)).toBe(false);

    const complete = deriveMastery(
      [...attempts, ...securingRun("ls-t")],
      T0 + 3 * DAY,
    );
    expect(prerequisitesMet("blend-cvc", complete)).toBe(true);
  });
});

describe("delay window", () => {
  it("uses a two-day retention gap", () => {
    expect(DELAYED_SUCCESS_MS).toBe(2 * DAY);
  });
});
