/**
 * Renders every narration line to a static MP3 in public/narration.
 *
 * Without this, `/api/narrate` calls a paid OpenAI endpoint on every cache
 * miss: the first child through any line waits on a live synthesis round-trip,
 * and the bill scales with traffic. Pre-generating turns the common path into
 * a static file read — no latency, no cost, no key required at runtime — and
 * leaves live synthesis as a fallback for lines added since the last build.
 *
 *   OPENAI_API_KEY=... npx tsx scripts/pregenerate-audio.ts
 *
 * Already-rendered lines are skipped, so re-running after a content change
 * only pays for what changed. Delete public/narration to force a full rebuild.
 */
import { createHash } from "node:crypto";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { allVoiceLines, type VoiceMood } from "../src/lib/narration";

const OUT_DIR = path.join(process.cwd(), "public", "narration");
const ENDPOINT = "https://api.openai.com/v1/audio/speech";
const MODEL = process.env.VOICE_MODEL ?? "gpt-4o-mini-tts";
const VOICE = process.env.VOICE_NAME ?? "marin";
/** Keep well inside provider rate limits; this runs at build time, not in a session. */
const CONCURRENCY = 4;

const MOOD_DIRECTION: Record<VoiceMood, string> = {
  welcome:
    "Sound delighted to see the child. Begin with a tiny gasp of discovery and finish with an inviting lift.",
  curious:
    "Sound playful and curious. Use clear contrast, varied tempo, and a little suspense before the question.",
  coach:
    "Sound patient, warm, and confidence-building. Slow down for modeled sounds. Never sound disappointed.",
  celebrate:
    "Sound genuinely thrilled and proud, like a beloved storybook character celebrating a brave reader.",
  story:
    "Perform this as a miniature story. Use gentle characterful phrasing, a short dramatic pause, and then a clear question.",
};

const BASE_DIRECTION =
  "You are Pip, a warm, mischievous storybook fox guiding a four-year-old learning to read. Speak naturally, expressively, and conversationally. Never sound like a screen reader. Do not announce punctuation. Do not pronounce isolated letters by their letter names unless the script explicitly requests it. Carefully perform stretched phoneme sounds such as mmmmm, sssss, aaaaa, and ih. Keep the energy playful but never frantic.";

/** Must match `narrationFileName` in the route handler. */
function fileNameFor(lineId: string, text: string): string {
  const digest = createHash("sha256")
    .update(`${lineId}::${text}`)
    .digest("hex")
    .slice(0, 16);
  return `${digest}.mp3`;
}

async function synthesise(
  text: string,
  mood: VoiceMood,
  apiKey: string,
): Promise<Buffer> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      voice: VOICE,
      input: text,
      instructions: `${BASE_DIRECTION} ${MOOD_DIRECTION[mood]}`,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Synthesis failed (${response.status}): ${await response.text()}`,
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set. Nothing to do.");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const existing = new Set(await readdir(OUT_DIR).catch(() => []));

  const lines = Object.entries(allVoiceLines());
  const pending = lines.filter(
    ([id, line]) => !existing.has(fileNameFor(id, line.text)),
  );

  console.log(
    `${lines.length} lines registered, ${pending.length} to render, ${lines.length - pending.length} already up to date.`,
  );
  if (pending.length === 0) return;

  let done = 0;
  let failed = 0;
  const queue = [...pending];

  const worker = async () => {
    for (;;) {
      const next = queue.shift();
      if (!next) return;
      const [id, line] = next;
      try {
        const audio = await synthesise(line.text, line.mood, apiKey);
        await writeFile(path.join(OUT_DIR, fileNameFor(id, line.text)), audio);
        done += 1;
        if (done % 25 === 0) console.log(`  ${done}/${pending.length}…`);
      } catch (error) {
        failed += 1;
        console.error(`  failed: ${id} — ${(error as Error).message}`);
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`Rendered ${done} lines${failed ? `, ${failed} failed` : ""}.`);
  // A failed line is not fatal: the route falls back to live synthesis for
  // anything missing, so the game still speaks.
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
