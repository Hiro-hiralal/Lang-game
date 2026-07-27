/**
 * The single entry point for narration lookup.
 *
 * Importing this module guarantees both line catalogues have registered
 * themselves before any lookup runs — the guarantee that used to come from a
 * circular import at the bottom of `voice-lines.ts`.
 */
import "@/lib/voice-lines";
import "@/lib/world-data";

export {
  allVoiceLines,
  lookupVoiceLine as getVoiceLine,
  voiceLineCount,
  type VoiceLine,
  type VoiceMood,
} from "@/lib/narration-registry";
