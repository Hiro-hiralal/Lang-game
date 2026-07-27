/**
 * Canonical skill catalog.
 *
 * Before this existed, `Activity.skill` was free text: "Hear matching endings",
 * "Rhyme recognition" and "Independent rhyming" were three different strings for
 * one underlying skill, so nothing could aggregate across activities. Every
 * activity now points at exactly one `SkillId`, which is what mastery and the
 * session composer are computed over.
 */

export type SkillStrand =
  | "phonological"
  | "letter-sound"
  | "decoding"
  | "text";

export type PhonologicalSkillId =
  | "rhyme"
  | "first-sound"
  | "last-sound"
  | "syllables";

export type LetterSoundSkillId =
  | "ls-m"
  | "ls-s"
  | "ls-a"
  | "ls-t"
  | "ls-p"
  | "ls-i"
  | "ls-n"
  | "ls-d"
  | "ls-f"
  | "ls-o"
  | "ls-g"
  | "ls-c"
  | "ls-r"
  | "ls-h"
  | "ls-e"
  | "ls-b";

export type DecodingSkillId =
  | "blend-cvc"
  | "segment-cvc"
  | "build-cvc"
  | "medial-vowel"
  | "heart-words";

export type TextSkillId = "connected-text" | "story-meaning";

export type SkillId =
  | PhonologicalSkillId
  | LetterSoundSkillId
  | DecodingSkillId
  | TextSkillId;

export interface Skill {
  id: SkillId;
  /** Parent-facing name. Shown in the grown-up dashboard, never to the child. */
  label: string;
  strand: SkillStrand;
  /** Must be at least `practicing` before this skill is introduced. */
  prerequisites: SkillId[];
  /** Letter-sound skills only. */
  grapheme?: string;
  /** How the phoneme is written in narration copy, e.g. "mmmmm". */
  phoneme?: string;
  keyword?: string;
}

/**
 * Teaching order for letter-sounds: high-utility, visually distinct, and
 * front-loaded so that CVC words become buildable as early as possible
 * (m, s, a, t alone yield sat/mat/at/sam). PRD section 5.
 */
const LETTER_SOUNDS: Array<{
  id: LetterSoundSkillId;
  grapheme: string;
  phoneme: string;
  keyword: string;
}> = [
  { id: "ls-m", grapheme: "m", phoneme: "mmmmm", keyword: "moon" },
  { id: "ls-a", grapheme: "a", phoneme: "aaaaa", keyword: "apple" },
  { id: "ls-t", grapheme: "t", phoneme: "t", keyword: "top" },
  { id: "ls-s", grapheme: "s", phoneme: "sssss", keyword: "sun" },
  { id: "ls-p", grapheme: "p", phoneme: "p", keyword: "pip" },
  { id: "ls-i", grapheme: "i", phoneme: "ih", keyword: "insect" },
  { id: "ls-n", grapheme: "n", phoneme: "nnnnn", keyword: "nest" },
  { id: "ls-d", grapheme: "d", phoneme: "d", keyword: "dog" },
  { id: "ls-f", grapheme: "f", phoneme: "fffff", keyword: "fox" },
  { id: "ls-o", grapheme: "o", phoneme: "ooo", keyword: "otter" },
  { id: "ls-g", grapheme: "g", phoneme: "g", keyword: "gate" },
  { id: "ls-c", grapheme: "c", phoneme: "kuh", keyword: "cat" },
  { id: "ls-r", grapheme: "r", phoneme: "rrrrr", keyword: "root" },
  { id: "ls-h", grapheme: "h", phoneme: "h", keyword: "hat" },
  { id: "ls-e", grapheme: "e", phoneme: "eh", keyword: "egg" },
  { id: "ls-b", grapheme: "b", phoneme: "b", keyword: "bell" },
];

/** The first three letter-sounds gate blending: m + a + t makes "mat". */
const CORE_LETTER_SOUNDS: LetterSoundSkillId[] = ["ls-m", "ls-a", "ls-t"];

const PHONOLOGICAL: Skill[] = [
  {
    id: "rhyme",
    label: "Hearing rhyme",
    strand: "phonological",
    prerequisites: [],
  },
  {
    id: "syllables",
    label: "Counting syllables",
    strand: "phonological",
    prerequisites: [],
  },
  {
    id: "first-sound",
    label: "First sounds in words",
    strand: "phonological",
    prerequisites: ["rhyme"],
  },
  {
    id: "last-sound",
    label: "Last sounds in words",
    strand: "phonological",
    prerequisites: ["first-sound"],
  },
];

const DECODING: Skill[] = [
  {
    id: "blend-cvc",
    label: "Blending sounds into words",
    strand: "decoding",
    prerequisites: ["first-sound", ...CORE_LETTER_SOUNDS],
  },
  {
    id: "segment-cvc",
    label: "Breaking words into sounds",
    strand: "decoding",
    prerequisites: ["blend-cvc", "last-sound"],
  },
  {
    id: "build-cvc",
    label: "Building words with letters",
    strand: "decoding",
    prerequisites: ["blend-cvc"],
  },
  {
    id: "medial-vowel",
    label: "Changing the middle sound",
    strand: "decoding",
    prerequisites: ["build-cvc", "ls-i"],
  },
  {
    id: "heart-words",
    label: "Everyday heart words",
    strand: "decoding",
    prerequisites: ["blend-cvc"],
  },
];

const TEXT: Skill[] = [
  {
    id: "connected-text",
    label: "Reading a whole sentence",
    strand: "text",
    prerequisites: ["blend-cvc", "heart-words"],
  },
  {
    id: "story-meaning",
    label: "Understanding the story",
    strand: "text",
    prerequisites: ["connected-text"],
  },
];

export const SKILLS: Skill[] = [
  ...PHONOLOGICAL,
  ...LETTER_SOUNDS.map<Skill>((entry, index) => ({
    id: entry.id,
    label: `Letter sound: ${entry.grapheme}`,
    strand: "letter-sound",
    // Each new letter-sound waits on the previous one, so the sequence is
    // taught in order rather than all sixteen unlocking at once.
    prerequisites:
      index === 0 ? ["first-sound"] : [LETTER_SOUNDS[index - 1].id],
    grapheme: entry.grapheme,
    phoneme: entry.phoneme,
    keyword: entry.keyword,
  })),
  ...DECODING,
  ...TEXT,
];

const SKILL_BY_ID = new Map<SkillId, Skill>(
  SKILLS.map((skill) => [skill.id, skill]),
);

export function getSkill(id: SkillId): Skill {
  const skill = SKILL_BY_ID.get(id);
  if (!skill) throw new Error(`Unknown skill: ${id}`);
  return skill;
}

export function isSkillId(value: string): value is SkillId {
  return SKILL_BY_ID.has(value as SkillId);
}

/** Teaching order — the composer introduces new skills in this sequence. */
export const SKILL_SEQUENCE: SkillId[] = SKILLS.map((skill) => skill.id);

export function letterSoundSkill(grapheme: string): LetterSoundSkillId | null {
  const match = LETTER_SOUNDS.find((entry) => entry.grapheme === grapheme);
  return match ? match.id : null;
}

export const TAUGHT_GRAPHEMES: string[] = LETTER_SOUNDS.map(
  (entry) => entry.grapheme,
);
