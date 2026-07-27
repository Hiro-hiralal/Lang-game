import { describe, expect, it } from "vitest";
import { deriveMastery } from "@/lib/learning/mastery";
import type { SkillId } from "@/lib/learning/skills";
import type { Attempt } from "@/lib/learning/types";
import {
  greet,
  reactToAnswer,
  regionHealth,
} from "@/lib/pip-reactions";

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 10);

function answer(overrides: Partial<Parameters<typeof reactToAnswer>[0]> = {}) {
  return reactToAnswer(
    { correct: true, hintLevel: 0, mode: "tap", retries: 0, ...overrides },
    "ls-m",
  );
}

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

function secure(skillId: SkillId): Attempt[] {
  return [
    attempt({ skillId, sessionId: "s1", ts: T0 - 5 * DAY }),
    attempt({ skillId, sessionId: "s2", ts: T0 - 4 * DAY }),
    attempt({ skillId, sessionId: "s3", ts: T0 - 2 * DAY }),
    attempt({ skillId, sessionId: "s3", ts: T0 - 2 * DAY + 500 }),
  ];
}

describe("reactToAnswer", () => {
  it("says something different for a clean answer than for a hinted one", () => {
    const clean = answer();
    const hinted = answer({ hintLevel: 2 });

    expect(clean.reason).toBe("clean");
    expect(hinted.reason).toBe("hinted");
    expect(clean.text).not.toBe(hinted.text);
  });

  it("names the letter on a clean letter-sound answer", () => {
    expect(answer().text).toContain("m");
  });

  it("does not claim an assisted answer was unaided", () => {
    const assisted = answer({ mode: "assisted", hintLevel: 4 });
    expect(assisted.reason).toBe("assisted");
    // The honest version: we got there together, not "you just knew it".
    expect(assisted.text).toContain("together");
  });

  it("credits a child who changed their mind and got it", () => {
    expect(answer({ retries: 1 }).reason).toBe("recovered");
  });

  it("escalates from a first miss to a repeated one", () => {
    const first = answer({ correct: false, retries: 0 });
    const again = answer({ correct: false, retries: 2 });

    expect(first.reason).toBe("first-miss");
    expect(again.reason).toBe("repeat-miss");
    expect(first.text).not.toBe(again.text);
  });

  it("keeps every line to one short sentence", () => {
    const lines = [
      answer(),
      answer({ hintLevel: 2 }),
      answer({ mode: "assisted" }),
      answer({ retries: 1 }),
      answer({ correct: false }),
      answer({ correct: false, retries: 2 }),
    ];
    for (const line of lines) {
      expect(line.text.length, line.text).toBeLessThan(70);
    }
  });
});

describe("greet", () => {
  const mastery = deriveMastery(secure("rhyme"), T0);

  it("introduces itself on a first visit", () => {
    expect(greet("Ada", null, mastery, T0).reason).toBe("first-visit");
  });

  it("calls back to what the child last had sorted", () => {
    const reaction = greet(
      "Ada",
      new Date(T0 - 2 * DAY).toISOString(),
      mastery,
      T0,
    );
    expect(reaction.reason).toBe("callback");
    expect(reaction.text.toLowerCase()).toContain("rhyme");
  });

  it("notices a long absence", () => {
    const reaction = greet(
      "Ada",
      new Date(T0 - 20 * DAY).toISOString(),
      mastery,
      T0,
    );
    expect(reaction.reason).toBe("long-absence");
  });

  it("does not say welcome back twice in one day", () => {
    const reaction = greet("Ada", new Date(T0).toISOString(), mastery, T0);
    expect(reaction.reason).toBe("same-day");
    expect(reaction.text).toContain("Ada");
  });

  it("survives a corrupt timestamp", () => {
    expect(() => greet("Ada", "not-a-date", mastery, T0)).not.toThrow();
  });
});

describe("regionHealth", () => {
  const skills: SkillId[] = ["rhyme", "first-sound"];

  it("sleeps until something there has been touched", () => {
    expect(regionHealth(skills, deriveMastery([], T0)).health).toBe("sleeping");
  });

  it("stirs once a skill is met but none is secure", () => {
    const mastery = deriveMastery([attempt({ skillId: "rhyme" })], T0);
    expect(regionHealth(skills, mastery).health).toBe("stirring");
  });

  it("grows when some but not all of its skills are secure", () => {
    const mastery = deriveMastery(
      [...secure("rhyme"), attempt({ skillId: "first-sound" })],
      T0,
    );
    expect(regionHealth(skills, mastery).health).toBe("growing");
  });

  it("blooms only when every skill in it is secure", () => {
    const mastery = deriveMastery(
      [...secure("rhyme"), ...secure("first-sound")],
      T0,
    );
    const result = regionHealth(skills, mastery);
    expect(result.health).toBe("blooming");
    expect(result.secure).toBe(2);
  });

  it("cannot be made to bloom by replaying chapters", () => {
    // Twenty assisted successes: plenty of completions, no mastery.
    const grinding = Array.from({ length: 20 }, (_, i) =>
      attempt({
        skillId: "rhyme",
        sessionId: `s${i}`,
        ts: T0 - i * DAY,
        hintLevel: 4,
        mode: "assisted",
      }),
    );
    expect(regionHealth(skills, deriveMastery(grinding, T0)).health).not.toBe(
      "blooming",
    );
  });
});
