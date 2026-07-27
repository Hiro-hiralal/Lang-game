# Story Sprouts

A reading adventure for emergent readers ages 4–5. Children help Pip the fox
grow a magical garden through rhyme, letter-sounds, blending, word-building and
tiny decodable stories.

## What's here

- **Seven activity systems**, not one repeated. Children sort words into
  baskets, sweep across sounds to blend them, trace letters along a stroke
  guide, build words from draggable tiles, tap out syllables, read connected
  text with word-by-word highlighting, and — where a judgement really is a
  choice — pick from options.
- **A flagship episode**, *Moon Mouse and the Lost Lantern*, where the reading
  is the story: every exercise is an action that moves the plot on, and the
  seed the child is given at the end is permanently in their garden.
- **A learning record.** Every scored attempt logs the item, skill, hint level,
  response mode and latency, and `deriveMastery` turns that into transparent
  states — learning, practising, secure, due for review.
- **A session composer** that assembles each session from what the child has
  demonstrated: a confidence-building warm-up, review weighted to spaced
  retrieval, current focus, at most one new concept, and a connected-text
  finish.
- **A parent dashboard driven entirely by that record**, which says "not enough
  practice yet" rather than showing a number it cannot support.
- Original garden artwork, calm animation, collectible treasures and a visibly
  growing world.
- Local-first storage. No account, no backend, no child data leaves the device.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Append `?demo=1` for a populated showcase profile;
the default is a genuinely empty one.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Narration

Pip is voiced by OpenAI text-to-speech, rendered server-side. There are three
layers, in order:

1. **Pre-generated audio.** `npm run narration:generate` (needs
   `OPENAI_API_KEY`) renders every registered line to `public/narration/`. The
   route serves these as static files, so the common path costs nothing and
   adds no latency. Output is gitignored and rebuildable.
2. **Live synthesis**, for lines added since the last generation run. Rate
   limited per client, with a daily character budget and a `VOICE_ENABLED` kill
   switch.
3. **Device speech synthesis**, if the endpoint is unavailable, unconfigured or
   switched off.

The game is fully playable with no API key at all — every instruction, hint and
story has an on-screen equivalent, and the microphone is never opened.

### Environment

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Server-only. Live narration and pre-generation. |
| `VOICE_ENABLED` | Set to `false` to switch live synthesis off. |
| `VOICE_MODEL` | Defaults to `gpt-4o-mini-tts`. |
| `VOICE_DAILY_CHAR_BUDGET` | Daily ceiling on characters sent for synthesis. |

## Child privacy

The microphone is never opened and no child audio is recorded or transmitted.
The learning record holds lesson outcomes only — which item, whether it was
right, whether a hint was used — never speech, transcripts or free text.
Everything is stored in the browser and can be erased from the grown-up page.

Live child voice with the OpenAI Realtime API remains a privacy-gated future
feature: it requires verifiable parental consent, Zero Data Retention
eligibility and legal review before it can be enabled. See PRD section 10.

## Architecture

- Next.js 16 App Router, React 19, TypeScript
- Motion for interface animation; `canvas-confetti` for restrained celebrations
- Vitest and Testing Library
- `localStorage` behind an `AttemptStore` interface, so a server-backed adapter
  can replace it without touching game code

The full product requirements, production architecture, Supabase model,
Realtime voice design and release gates are in [`docs/PRD.md`](docs/PRD.md).
