import { NextRequest, NextResponse } from "next/server";
import { getVoiceLine, type VoiceMood } from "@/lib/voice-lines";

export const runtime = "nodejs";

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

export async function GET(request: NextRequest) {
  const lineId = request.nextUrl.searchParams.get("line") ?? "";
  const line = getVoiceLine(lineId);

  if (!line) {
    return NextResponse.json({ error: "Unknown narration line." }, { status: 404 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Expressive narration is not configured." },
      { status: 503 },
    );
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "marin",
      input: line.text,
      instructions: `${BASE_DIRECTION} ${MOOD_DIRECTION[line.mood]}`,
      response_format: "mp3",
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Pip's expressive voice is taking a short rest." },
      { status: 502 },
    );
  }

  return new NextResponse(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
