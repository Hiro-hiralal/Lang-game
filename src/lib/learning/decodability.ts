import { SKILL_SEQUENCE, getSkill, type SkillId } from "@/lib/learning/skills";

/**
 * Heart words: high-frequency words a child cannot sound out yet, taught
 * explicitly rather than left to be guessed. PRD section 5 allows these in
 * decodable text; everything else must be built from taught letter-sounds.
 */
export const HEART_WORDS = [
  "the",
  "a",
  "is",
  "was",
  "has",
  "his",
  "to",
  "of",
  "said",
  "you",
];

export interface DecodabilityReport {
  decodable: boolean;
  /** Words containing a grapheme that has not been taught yet. */
  offenders: Array<{ word: string; untaught: string[] }>;
}

function normalise(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z']+/)
    .filter(Boolean);
}

/**
 * Checks a passage against the letters actually taught.
 *
 * PRD section 18 asks for "automated content lint [that] prevents untaught
 * patterns from entering decodable stories". Without it, story text drifts
 * ahead of the curriculum and a child is asked to read letters nobody has
 * shown them, which reads to them as failure rather than as a content bug.
 */
export function checkDecodable(
  text: string,
  taughtGraphemes: string[],
  options: { heartWords?: string[]; properNouns?: string[] } = {},
): DecodabilityReport {
  const taught = new Set(taughtGraphemes.map((g) => g.toLowerCase()));
  const heart = new Set(
    (options.heartWords ?? HEART_WORDS).map((w) => w.toLowerCase()),
  );
  const proper = new Set(
    (options.properNouns ?? []).map((w) => w.toLowerCase()),
  );

  const offenders: DecodabilityReport["offenders"] = [];

  for (const word of normalise(text)) {
    if (heart.has(word) || proper.has(word)) continue;

    const untaught = [...word]
      .filter((letter) => /[a-z]/.test(letter) && !taught.has(letter))
      .filter((letter, index, all) => all.indexOf(letter) === index);

    if (untaught.length > 0) offenders.push({ word, untaught });
  }

  return { decodable: offenders.length === 0, offenders };
}

/**
 * The graphemes a child has been taught by the time a given skill comes up.
 * Used to check story text against the point in the sequence it appears at,
 * rather than against the whole alphabet.
 */
export function graphemesTaughtBy(skillId: SkillId): string[] {
  const cutoff = SKILL_SEQUENCE.indexOf(skillId);
  if (cutoff < 0) return [];

  return SKILL_SEQUENCE.slice(0, cutoff + 1)
    .map((id) => getSkill(id).grapheme)
    .filter((grapheme): grapheme is string => Boolean(grapheme));
}
