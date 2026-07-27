/**
 * Stroke guides for lowercase letters, in a 100x100 box.
 *
 * Baseline sits at y=78, x-height at y=44, ascenders reach y=26 and descenders
 * fall to y=92. Strokes are listed in handwriting order so the animated guide
 * moves the way the letter is actually written.
 *
 * These are guides for reinforcement, not a handwriting curriculum — PRD
 * section 3 lists handwriting instruction as a non-goal and section 7 calls
 * tracing "optional reinforcement, not handwriting assessment".
 */
export const LETTER_STROKES: Record<string, string[]> = {
  m: [
    "M32,78 L32,44",
    "M32,53 C35,45 45,44 48,53 L48,78",
    "M48,53 C51,45 61,44 64,53 L64,78",
  ],
  a: [
    "M62,52 C55,44 40,46 40,60 C40,74 55,76 62,68",
    "M62,44 L62,78",
  ],
  t: [
    "M48,28 L48,71 C48,77 54,79 61,76",
    "M35,46 L62,46",
  ],
  s: ["M62,51 C58,44 42,43 40,51 C38,59 58,60 60,68 C58,77 42,77 38,69"],
  p: [
    "M38,46 L38,92",
    "M38,54 C44,45 62,46 62,60 C62,74 44,75 38,66",
  ],
  i: ["M50,48 L50,78", "M50,34 L50,37"],
  n: ["M36,78 L36,46", "M36,54 C40,45 60,44 62,54 L62,78"],
  d: [
    "M60,52 C54,44 38,46 38,60 C38,74 54,76 60,68",
    "M60,26 L60,78",
  ],
  f: ["M61,30 C52,25 46,30 46,40 L46,78", "M35,48 L58,48"],
  o: [
    "M50,44 C38,44 34,52 34,61 C34,70 38,76 50,76 C62,76 66,70 66,61 C66,52 62,44 50,44",
  ],
  g: [
    "M60,52 C54,44 38,46 38,58 C38,70 54,72 60,64",
    "M60,44 L60,82 C60,92 48,94 40,89",
  ],
  c: ["M62,52 C56,44 38,46 38,60 C38,74 56,76 62,68"],
  r: ["M40,78 L40,48", "M40,56 C44,48 54,45 62,48"],
  h: ["M36,78 L36,26", "M36,54 C40,45 60,44 62,54 L62,78"],
  e: [
    "M36,61 L62,61 C62,50 52,44 44,48 C36,52 34,64 40,71 C46,78 58,76 62,70",
  ],
  b: [
    "M38,26 L38,78",
    "M38,60 C38,47 58,44 62,54 C66,64 58,76 46,74 C41,73 38,68 38,60",
  ],
};

export function strokesFor(letter: string): string[] {
  return LETTER_STROKES[letter.toLowerCase()] ?? [];
}

export function hasStrokes(letter: string): boolean {
  return strokesFor(letter).length > 0;
}
