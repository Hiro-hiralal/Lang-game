import { getSkill, type SkillId } from "@/lib/learning/skills";
import type { Attempt, MasteryMap } from "@/lib/learning/types";

const DAY_MS = 86_400_000;

export type PipMood = "hello" | "thinking" | "celebrate";

export interface PipReaction {
  text: string;
  mood: PipMood;
  /** Why this line fired. Not shown to the child; used in tests. */
  reason: string;
}

/**
 * Pip's reaction to what just happened.
 *
 * Pip's lines were all written in advance and identical every time: the same
 * celebration whether the child got it instantly or after three hints, and the
 * same greeting whether they played yesterday or three weeks ago. A companion
 * who never notices anything is set dressing.
 *
 * These are short on purpose. Young children reliably act on a clear outcome
 * signal and reliably tune out a paragraph, so the rule here is one sentence
 * that names the specific thing that just happened.
 *
 * Every line is authored here, never generated. PRD section 16 forbids runtime
 * generation of child-facing content.
 */
export function reactToAnswer(
  attempt: Pick<Attempt, "correct" | "hintLevel" | "mode" | "retries">,
  skillId: SkillId,
): PipReaction {
  const skill = getSkill(skillId);
  const target = skill.grapheme ?? "";

  if (!attempt.correct) {
    if (attempt.retries === 0) {
      return {
        text: "Ooh, not that one. Have another look.",
        mood: "thinking",
        reason: "first-miss",
      };
    }
    return {
      text: "Still not it. Let’s slow right down together.",
      mood: "thinking",
      reason: "repeat-miss",
    };
  }

  // Got there after being shown the answer. Worth naming the effort, and worth
  // not pretending it was unaided.
  if (attempt.mode === "assisted") {
    return {
      text: "We got there together. Next time it’ll be all you.",
      mood: "celebrate",
      reason: "assisted",
    };
  }

  if (attempt.hintLevel > 0) {
    return {
      text: "You took the hint and ran with it. That counts.",
      mood: "celebrate",
      reason: "hinted",
    };
  }

  if (attempt.retries > 0) {
    return {
      text: "You changed your mind and got it. That’s good thinking.",
      mood: "celebrate",
      reason: "recovered",
    };
  }

  return {
    text: target
      ? `Straight to it. You just knew ${target}.`
      : "Straight to it. No hints, no wobble.",
    mood: "celebrate",
    reason: "clean",
  };
}

/**
 * What Pip says when the child arrives. Notices how long they have been away
 * and what they were last working on, rather than greeting everyone the same.
 */
export function greet(
  childName: string,
  lastPlayed: string | null,
  mastery: MasteryMap,
  now: number,
): PipReaction {
  if (!lastPlayed) {
    return {
      text: `Oh! Hello. I’m Pip. Shall we go and find some words, ${childName}?`,
      mood: "hello",
      reason: "first-visit",
    };
  }

  const last = new Date(lastPlayed).getTime();
  const daysAway = Number.isNaN(last)
    ? 0
    : Math.floor((now - last) / DAY_MS);

  const justSecured = [...mastery.values()]
    .filter((record) => record.state === "secure" || record.state === "review")
    .sort((a, b) => (b.lastSuccessAt ?? 0) - (a.lastSuccessAt ?? 0))[0];

  if (daysAway >= 7) {
    return {
      text: "There you are! The garden has been very quiet without you.",
      mood: "hello",
      reason: "long-absence",
    };
  }

  if (daysAway >= 1 && justSecured) {
    const skill = getSkill(justSecured.skillId);
    return {
      // A callback to the specific thing they did last time.
      text: `Back again! Last time you had ${skill.label.toLowerCase()} completely sorted.`,
      mood: "hello",
      reason: "callback",
    };
  }

  return {
    text: `Ready for another one, ${childName}?`,
    mood: "hello",
    reason: "same-day",
  };
}

/**
 * How a region looks on the map, from what the child has actually mastered
 * there rather than from how many chapters they clicked through.
 */
export type RegionHealth = "sleeping" | "stirring" | "growing" | "blooming";

export function regionHealth(
  skillIds: SkillId[],
  mastery: MasteryMap,
): { health: RegionHealth; secure: number; introduced: number } {
  const records = skillIds
    .map((skillId) => mastery.get(skillId))
    .filter((record): record is NonNullable<typeof record> => Boolean(record));

  const introduced = records.filter((r) => r.state !== "new").length;
  const secure = records.filter(
    (r) => r.state === "secure" || r.state === "review",
  ).length;

  if (introduced === 0) return { health: "sleeping", secure, introduced };
  if (secure === 0) return { health: "stirring", secure, introduced };
  if (secure < records.length) return { health: "growing", secure, introduced };
  return { health: "blooming", secure, introduced };
}

export const REGION_HEALTH_LABEL: Record<RegionHealth, string> = {
  sleeping: "Waiting for you",
  stirring: "Waking up",
  growing: "Growing",
  blooming: "In full bloom",
};
