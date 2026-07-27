/**
 * Leaf module for narration lines.
 *
 * `voice-lines.ts` and `world-data.ts` previously imported each other —
 * `voice-lines.ts` carried an `import` of `world-data.ts` at the *bottom* of the
 * file purely to force the world's lines to register. Both now depend on this
 * module instead, which imports nothing, so the cycle is gone.
 *
 * Import `@/lib/narration` (not this file) to look a line up: that module pulls
 * in both catalogues for their registration side effects first.
 */

export type VoiceMood =
  | "welcome"
  | "curious"
  | "coach"
  | "celebrate"
  | "story";

export interface VoiceLine {
  text: string;
  mood: VoiceMood;
}

const REGISTRY = new Map<string, VoiceLine>();

/** Registers a line and returns its id, so callers can inline the call. */
export function registerVoiceLine(
  id: string,
  text: string,
  mood: VoiceMood,
): string {
  REGISTRY.set(id, { text, mood });
  return id;
}

export function registerVoiceLines(lines: Record<string, VoiceLine>): void {
  for (const [id, line] of Object.entries(lines)) {
    REGISTRY.set(id, line);
  }
}

export function lookupVoiceLine(id: string): VoiceLine | undefined {
  return REGISTRY.get(id);
}

export function allVoiceLines(): Record<string, VoiceLine> {
  return Object.fromEntries(REGISTRY);
}

export function voiceLineCount(): number {
  return REGISTRY.size;
}
