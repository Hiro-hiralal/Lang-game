import { describe, expect, it } from "vitest";
import {
  buildDashboardStats,
  formatDuration,
  formatRate,
} from "@/lib/learning/dashboard";
import { deriveMastery } from "@/lib/learning/mastery";
import type { SkillId } from "@/lib/learning/skills";
import type { Attempt, SessionRecord } from "@/lib/learning/types";

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 1);

function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    itemId: "item",
    skillId: "rhyme" as SkillId,
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

function session(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: "s1",
    startedAt: T0,
    endedAt: T0 + 5 * 60_000,
    adventureId: "a1",
    completed: true,
    ...overrides,
  };
}

function build(attempts: Attempt[], sessions: SessionRecord[], now = T0 + DAY) {
  return buildDashboardStats(
    attempts,
    sessions,
    deriveMastery(attempts, now),
    now,
  );
}

describe("an empty record", () => {
  it("reports emptiness rather than zeros dressed as findings", () => {
    const stats = build([], []);
    expect(stats.isEmpty).toBe(true);
    expect(stats.introduced).toEqual([]);
    expect(stats.medianSessionMs).toBeNull();
    expect(stats.independentRate).toBeNull();
  });

  it("renders no duration and no rate rather than a placeholder number", () => {
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(0)).toBeNull();
    expect(formatRate(null)).toBeNull();
  });
});

describe("thin evidence", () => {
  it("withholds an independence rate until there is enough practice", () => {
    const stats = build([attempt(), attempt({ ts: T0 + 10 })], [session()]);
    expect(stats.totalAttempts).toBe(2);
    // Two data points is not a percentage.
    expect(stats.independentRate).toBeNull();
  });

  it("reports a rate once there is enough", () => {
    const attempts = [
      ...Array.from({ length: 6 }, (_, i) => attempt({ ts: T0 + i })),
      ...Array.from({ length: 2 }, (_, i) =>
        attempt({ ts: T0 + 100 + i, hintLevel: 2 }),
      ),
    ];
    const stats = build(attempts, [session()]);
    expect(stats.independentRate).toBeCloseTo(6 / 8);
    expect(formatRate(stats.independentRate)).toBe("75%");
  });
});

describe("real numbers", () => {
  it("takes session length from what actually happened", () => {
    const sessions = [
      session({ id: "a", startedAt: T0, endedAt: T0 + 4 * 60_000 }),
      session({ id: "b", startedAt: T0, endedAt: T0 + 6 * 60_000 }),
      session({ id: "c", startedAt: T0, endedAt: T0 + 8 * 60_000 }),
    ];
    const stats = build([attempt()], sessions);
    expect(stats.medianSessionMs).toBe(6 * 60_000);
    expect(formatDuration(stats.medianSessionMs)).toBe("6m 00s");
  });

  it("ignores abandoned sessions when timing an adventure", () => {
    const sessions = [
      session({ id: "a", startedAt: T0, endedAt: T0 + 5 * 60_000 }),
      session({ id: "b", startedAt: T0, endedAt: null, completed: false }),
    ];
    const stats = build([attempt()], sessions);
    expect(stats.completedSessions).toBe(1);
    expect(stats.medianSessionMs).toBe(5 * 60_000);
  });

  it("counts only this week's sessions in the weekly figure", () => {
    const now = T0 + 30 * DAY;
    const sessions = [
      session({ id: "old", startedAt: T0 }),
      session({ id: "recent", startedAt: now - 2 * DAY }),
    ];
    const stats = build([attempt()], sessions, now);
    expect(stats.sessionsThisWeek).toBe(1);
  });

  it("lists only skills that have actually come up", () => {
    const stats = build([attempt({ skillId: "rhyme" })], [session()]);
    const labels = stats.introduced.map((entry) => entry.skillId);
    expect(labels).toEqual(["rhyme"]);
    expect(labels).not.toContain("connected-text");
  });

  it("separates secure skills from those still needing practice", () => {
    const attempts = [
      // rhyme reaches secure: four independent, three sessions, one delayed.
      attempt({ skillId: "rhyme", sessionId: "s1", ts: T0 }),
      attempt({ skillId: "rhyme", sessionId: "s2", ts: T0 + DAY }),
      attempt({ skillId: "rhyme", sessionId: "s3", ts: T0 + 2 * DAY }),
      attempt({ skillId: "rhyme", sessionId: "s3", ts: T0 + 2 * DAY + 10 }),
      // syllables is only just met.
      attempt({ skillId: "syllables", sessionId: "s1", ts: T0 }),
    ];
    const stats = build(attempts, [session()], T0 + 2 * DAY + 20);

    expect(stats.secure.map((s) => s.skillId)).toEqual(["rhyme"]);
    expect(stats.needsPractice.map((s) => s.skillId)).toEqual(["syllables"]);
  });

  it("surfaces repeated confusions for the parent", () => {
    const attempts = Array.from({ length: 3 }, (_, i) =>
      attempt({
        skillId: "ls-m",
        correct: false,
        expectedId: "m",
        chosenId: "n",
        ts: T0 + i,
      }),
    );
    const stats = build(attempts, [session()]);
    expect(stats.confusions[0]).toMatchObject({
      expectedId: "m",
      chosenId: "n",
      count: 3,
    });
  });

  it("counts a skill as remembered only after a delayed success", () => {
    const sameDay = [
      attempt({ skillId: "rhyme", sessionId: "s1", ts: T0 }),
      attempt({ skillId: "rhyme", sessionId: "s2", ts: T0 + 1000 }),
    ];
    expect(build(sameDay, [session()]).delayedSuccesses).toBe(0);

    const laterToo = [
      ...sameDay,
      attempt({ skillId: "rhyme", sessionId: "s3", ts: T0 + 3 * DAY }),
    ];
    expect(build(laterToo, [session()], T0 + 3 * DAY).delayedSuccesses).toBe(1);
  });
});

describe("formatting", () => {
  it("pads seconds", () => {
    expect(formatDuration(5 * 60_000 + 8000)).toBe("5m 08s");
    expect(formatDuration(65_000)).toBe("1m 05s");
  });
});
