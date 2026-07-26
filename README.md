# Story Sprouts

A polished, five-minute reading adventure for emergent readers ages 4–5. Children help Pip the fox grow a magical garden through rhyme, letter-sound, blending, word-building, and tiny-story activities.

## Showcase features

- Five complete learning activities with hints, retries, celebrations, and a deliberate ending
- Original hand-painted garden world and companion artwork
- Spoken instructions and feedback using the browser's built-in speech synthesis
- Calm animation, confetti, visible world progression, and collectible seeds
- Responsive touch-first UI with keyboard support, mute, and reduced-motion modes
- Grown-up dashboard with progress, practiced skills, offline activity, and privacy settings
- Local progress persistence with no account or child-data collection
- Installable web-app manifest and production-ready Next.js build for Vercel

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm run lint
npm run build
```

## Voice and child privacy

The showcase narrates on-device through the Web Speech API and never opens the microphone or sends child audio anywhere. Live child voice with OpenAI Realtime remains a privacy-gated production feature: it requires verified parental consent, Zero Data Retention eligibility, and legal/safety review before it can be enabled.

## Architecture

- Next.js 16 App Router
- React 19 and TypeScript
- Motion for interface animation
- `canvas-confetti` for restrained celebrations
- `localStorage` for zero-setup showcase progress

The full product requirements, production architecture, Supabase model, Realtime voice design, and release gates are in [`docs/PRD.md`](docs/PRD.md).
