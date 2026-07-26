# Lang-game PRD: Story Sprouts

**Status:** Proposed  
**Product:** Story Sprouts (working title)  
**Audience:** Children ages 4–5 and their parents/caregivers  
**Platforms:** Responsive web app, optimized for tablets and phones  
**Repository:** `Hiro-hiralal/Lang-game`  
**Deployment:** Vercel  
**Data:** Supabase  
**Voice:** OpenAI Realtime API over WebRTC, subject to the child-privacy launch gate below

## 1. Product summary

Story Sprouts is a five-to-eight-minute reading adventure in which a child helps a magical garden grow by listening, tapping, dragging letters, blending sounds, recognizing words, and reading tiny decodable stories aloud.

The experience should feel like a warm animated game, not a test. A friendly character demonstrates each activity, celebrates effort, and offers one small hint at a time. The game quietly adapts to the child's demonstrated skills and gives the parent a simple view of progress and suggested offline practice.

## 2. Problem

Children entering kindergarten often have very different levels of oral-language, phonological-awareness, letter-sound, and early decoding experience. Many reading apps either:

- reward tapping without teaching transferable reading skills;
- move too quickly from letter names to memorizing whole words;
- use interfaces that require reading, typing, or adult help;
- treat imperfect speech recognition as a wrong answer; or
- optimize for screen time rather than short, successful practice.

Story Sprouts should provide structured, evidence-aligned practice while remaining playful enough that a four-year-old asks to return.

## 3. Goals

### Product goals

1. A child can begin and complete a session with minimal adult help after onboarding.
2. Every session practices at least one observable reading-related skill.
3. Difficulty adapts without labeling, shaming, or visibly ranking the child.
4. Voice makes the experience more natural, but the core learning loop remains usable without a microphone or live AI.
5. Parents understand what the child practiced and what to try next.
6. The product is safe, privacy-minimizing, accessible, and deployable as a production web app on Vercel.

### Learning goals

The initial curriculum will help children:

- hear and manipulate parts of spoken words, starting with rhyme and syllables and progressing to phonemes;
- connect a deliberately sequenced set of letters with their most common sounds;
- blend sounds from left to right into simple consonant-vowel-consonant words;
- segment simple words into sounds;
- build and read decodable words with letter tiles;
- recognize a small, explicitly taught set of high-frequency words; and
- listen to, discuss, and eventually read short connected decodable text.

### Non-goals for the first release

- replacing a teacher, speech-language pathologist, dyslexia screening, or clinical assessment;
- unrestricted conversation with an AI character;
- grading pronunciation or accent;
- handwriting instruction;
- public profiles, leaderboards, chat, social sharing, advertising, or in-app purchases;
- maximizing streak length or time spent in the app;
- generating unreviewed lesson content for children at runtime; or
- supporting a full school/classroom administration product.

## 4. Users

### Child player

- Age 4–5; pre-reader or emergent reader.
- Has limited reading, typing, working-memory, and fine-motor capacity.
- May speak softly, omit sounds, have an accent, use a dialect, or be in a noisy room.
- Needs large targets, short instructions, repetition, and immediate cause-and-effect.

### Parent or caregiver

- Creates and controls the account.
- Completes consent and device/audio setup.
- Wants proof of useful learning without a complicated dashboard.
- May co-play, manage more than one child profile, and request data deletion.

### Content reviewer

- Reviews the skill sequence, word lists, decodable stories, voice scripts, hints, and accessibility metadata before publication.
- This is an internal role in the first release, not a public-facing authoring system.

## 5. Learning design

The curriculum follows this progression:

1. **Oral language and sound play:** rhyme, first-sound matching, syllable clapping, vocabulary, and story discussion.
2. **Letter-sound mapping:** introduce a small set of high-utility, visually distinct letters and their common sounds.
3. **Phonemic awareness with print:** select and move letter tiles while hearing and producing sounds.
4. **Blending and segmenting:** work left to right with familiar CVC words; model continuous blending when possible.
5. **Word recognition:** repeatedly decode words in isolation and in meaningful text; explicitly teach the small number of essential irregular words.
6. **Connected text:** read or echo-read short decodable sentences and stories every session once the child is ready.

### Instruction rules

- Model first, practice together, then invite independent play.
- Introduce no more than one new skill or pattern in a session.
- Mix new items with mastered items for confidence and retention.
- Give the smallest useful hint: repeat → emphasize sound → animate mouth/letter → model → offer two choices.
- Treat silence, background noise, and low-confidence speech as “I didn’t catch that,” never “wrong.”
- Accept dialectal and age-appropriate pronunciation variation.
- Never infer a disability or show a reading-level label to the child.
- All instructional content is human-authored or human-reviewed before publication.

## 6. Core experience

### First-time parent flow

1. Parent sees the value proposition and a clear “For grown-ups” gate.
2. Parent signs in using an adult email or approved OAuth provider.
3. Parent creates a child profile using a nickname/avatar and broad age band; no child email, full name, or exact birth date is required.
4. Parent reviews privacy disclosures, analytics settings, and a separate microphone/AI voice consent.
5. The app tests audio and offers a no-microphone path.
6. Parent chooses session length (5 or 8 minutes), sound level, and accessibility options.
7. Child chooses a companion and begins a gentle, non-diagnostic placement journey.

### Repeat child flow

1. Tap the child's avatar.
2. Companion recaps the last achievement in one sentence.
3. Play three short activities: warm-up, focus skill, and story/application.
4. Earn one seed or story sticker for effort and completion.
5. Watch the garden change.
6. End deliberately with “All done for today”; offer a parent-facing offline activity instead of an endless loop.

### Core loop

**Hear → See → Try → Receive a hint → Succeed → Apply in a tiny story → Grow the world**

Sessions should contain 8–14 scored learning opportunities, depending on the child's pace. Animations may delight but must not delay the next meaningful interaction by more than two seconds and must be skippable.

## 7. Game worlds and activities

### Sound Safari

Sound-only play before or alongside print:

- identify which two pictures rhyme;
- feed the creature pictures that start with a target sound;
- clap or tap the number of syllables;
- stretch a word and pick its first or last sound.

### Letter Lanterns

- Hear a sound and tap the matching letter.
- Trace a large animated path with a finger as an optional reinforcement, not handwriting assessment.
- Match uppercase and lowercase only after each form is familiar.
- Tap a letter to hear a clean sound, a keyword, and a short animation.

### Blend Bridge

- Three stepping stones show letter tiles.
- The companion models a smooth left-to-right blend.
- The child drags a firefly across the tiles while saying or listening to the sounds.
- The bridge joins when the sounds form the word.
- A picture appears only after the decoding attempt, so it does not become a guessing cue.

### Word Garden

- Build a spoken CVC word with draggable letter tiles.
- Change one phoneme to grow a new plant: `sat → sit → sip`.
- Sort words by spelling pattern after the pattern has been explicitly taught.
- Practice a small number of high-frequency “heart words,” showing the regular and irregular parts.

### Story Stage

- 1–4 sentence decodable micro-stories using only taught patterns plus explicitly introduced story words.
- Modes: listen, echo-read, read together, or child reads.
- Words highlight in sync with narration only in listen/echo modes.
- One picture-comprehension question and one oral-language prompt follow the story.
- The AI coach may respond only within a narrow, pre-authored set of intents and vocabulary.

## 8. Adaptation and mastery

Each item attempt records:

- skill and content version;
- response mode (tap, drag, voice, assisted);
- correctness or voice-confidence band;
- latency bucket;
- hint level;
- retry count; and
- session context.

The mastery model should be transparent and deterministic in v1:

- **New:** not yet introduced.
- **Learning:** fewer than three supported successes across at least two sessions.
- **Practicing:** improving but inconsistent.
- **Secure:** at least four independent successes across three sessions, including one delayed review.
- **Review:** secure item scheduled through spaced retrieval.

The session composer targets roughly:

- 60% secure/review items;
- 25% current focus items;
- 15% new items, with a maximum of one new concept.

Voice confidence must not directly lower mastery. A low-confidence voice attempt triggers a tap/drag confirmation or a modeled retry. The product records the confirmed response mode.

## 9. Delight and “bells and whistles”

### P0 delight

- Animated companion with distinct listening, thinking, hinting, and celebrating states.
- A garden/world map that visibly grows after every completed session.
- Tactile-feeling drag interactions, subtle haptics on supported devices, and rich but calm sound design.
- Collectible seeds, story stickers, and companion accessories earned through skill variety and effort.
- Personalized recap using only approved templates and the child's nickname.
- “Grown-up high five” ending that invites a short offline activity.

### P1 delight

- Seasonal garden themes without manipulative limited-time pressure.
- Co-play mode where adult and child take turns.
- Create-a-story ending: choose one of two characters, settings, and endings from reviewed content.
- Karaoke-style echo reading.
- Printable or shareable parent activity cards with no child-identifying data.
- Multiple companion voices and reduced-stimulation mode.

### P2 exploration

- Additional languages and dialect-aware content designed with language experts.
- Classroom mode.
- Downloadable lesson packs for intermittent connectivity.
- On-device speech pre-checks before sending audio.

## 10. Voice coach

### Proposed implementation

- Use `gpt-realtime-2.1-mini` for the pilot to balance latency and cost; evaluate `gpt-realtime-2.1` for difficult acoustic conditions.
- Connect from the browser through WebRTC, the recommended client connection method for realtime voice.
- A Next.js Route Handler creates the Realtime session through OpenAI's unified `/v1/realtime/calls` interface. The standard `OPENAI_API_KEY` exists only in Vercel server-side environment variables and is never sent to the browser.
- The server supplies the complete session configuration: model, voice, constrained instructions, allowed tools/intents, target word list, maximum turn length, and a hashed safety identifier.
- Use push-to-talk for child responses in v1. It is more understandable, reduces accidental collection, and bounds cost better than always-on listening.
- Do not store raw audio or full transcripts by default. Store only the lesson item, response mode, confidence band, and learning outcome.

### Voice behavior

The coach may:

- play reviewed narration and phoneme models;
- invite a target sound, word, or one-sentence response;
- give one of the reviewed hints;
- acknowledge effort;
- call tightly scoped functions such as `record_attempt`, `request_tap_confirmation`, or `advance_activity`; and
- answer a small set of lesson-related “what does this word mean?” questions using reviewed definitions.

The coach may not:

- hold open-ended conversations;
- ask for a name, location, school, contact detail, photo, secret, or personal story;
- make emotional dependency claims;
- diagnose, rank, shame, or compare children;
- generate a new lesson, reward, or URL;
- browse the web; or
- retain memory across sessions beyond explicit, non-sensitive learning state.

### Voice fallback

If voice is unavailable, declined, low-confidence, over budget, or blocked by the privacy gate:

- use human-reviewed prerecorded narration or server-generated audio approved before release;
- let the child answer by tap and drag;
- offer a “say it with me” activity without recording; and
- preserve the same learning progression.

### Child-privacy launch gate

Live child audio is a separate, gated capability—not a default assumption. Before enabling it in production:

1. Obtain and document verifiable parental consent and a separate microphone/AI disclosure.
2. Implement OpenAI Zero Data Retention as required by current OpenAI guidance before processing personal data from children under 13.
3. Complete legal/privacy review for every launch geography, including COPPA and applicable state/international rules.
4. Verify provider data-flow, retention, deletion, incident-response, and subprocessor documentation.
5. Pass scripted safety, prompt-injection, background-speech, and accidental-PII tests.
6. Provide a parent kill switch and deletion/export path.

Until every gate passes, production uses the no-live-audio fallback.

## 11. Parent experience

The parent dashboard shows:

- sessions completed this week;
- skills introduced, practicing, and secure;
- examples of words and stories the child encountered;
- effort-oriented highlights such as “kept trying after a hint”;
- a two-minute offline activity;
- microphone/AI and analytics settings;
- data export and delete controls; and
- support information.

It must not show a single reductive reading age, percentile, diagnosis, or prediction.

Weekly updates are opt-in and addressed only to the parent. No child-directed push notifications are included.

## 12. Functional requirements

### P0 — beta

- Responsive child game shell with large touch targets.
- Parent authentication and protected grown-up area.
- Up to three pseudonymous child profiles per parent.
- Consent versioning and microphone/AI control.
- Placement journey with a skip option.
- Sound Safari, Letter Lanterns, Blend Bridge, Word Garden, and Story Stage.
- Initial English content pack: 12–16 high-utility letter-sound correspondences, at least 60 decodable CVC words, 20 oral-language activities, 10 explicitly taught high-frequency words, and 12 micro-stories.
- Deterministic session composer and mastery states.
- Review scheduling across sessions.
- Companion, world-map progression, and core rewards.
- Live voice behind feature flag and privacy gate.
- Complete no-microphone fallback.
- Parent progress dashboard.
- Data export/delete request.
- Accessibility settings and reduced-motion/reduced-stimulation modes.
- Vercel preview and production deployments.
- Error, performance, cost, and safety monitoring without raw child content.

### P1 — public release

- Co-play mode.
- Multiple companions/voices.
- Seasonal content system.
- Parent activity cards.
- Offline-tolerant caching for approved content and session recovery.
- English-language learner supports designed and reviewed by specialists.

### P2 — later

- Additional languages.
- School/classroom plans.
- Educator content-review console.

## 13. Accessibility and child usability

- Minimum 48×48 CSS pixel targets; primary child actions target 64×64 or larger.
- No action relies on color, sound, voice, hover, or reading text alone.
- Every spoken instruction has a visual demonstration; grown-up areas have captions/text.
- Support keyboard and switch-style navigation where practical.
- Respect reduced motion and muted audio.
- Avoid time limits for child responses.
- Use dyslexia-friendly layout principles: generous spacing, clear sans-serif type, stable word placement, and no unnecessary all-caps.
- Keep child-facing written instructions to reviewed, decodable text where possible.
- Test on current iPadOS Safari, Android Chrome, and desktop Chrome/Safari.

## 14. Safety, privacy, and compliance requirements

- Parent-owned account; no child login credentials.
- Collect the minimum data necessary. Use nickname/avatar and age band, not full name or exact birth date.
- No ads, third-party behavioral analytics, social graph, public content, or dark patterns.
- Verifiable parental consent before collecting child personal information.
- Separate consent for any third-party disclosure not integral to the service.
- Clear parent notice, privacy policy, retention schedule, access/export, revocation, and secure deletion.
- Raw child audio and full transcripts are off by default and excluded from analytics and logs.
- Use short, documented retention windows for operational data.
- Age-appropriate AI disclosure: the companion is a computer character and can make mistakes.
- Rate limit and authenticate the Realtime-session endpoint; bind it to an authorized parent/child profile and active consent version.
- Red-team background adult conversation, sibling use, attempts to disclose personal information, and prompt injection spoken aloud.
- Complete a formal legal review before launch; this PRD is a product requirement, not legal advice.

## 15. Technical architecture

### Application

- Next.js App Router with TypeScript, React, and server-first rendering for parent/account surfaces.
- Client Components only for game state, animation, audio, microphone, and gesture-heavy interactions.
- Node.js 22 or later.
- Route Handlers for Realtime session creation, secure progress mutations, consent actions, and parent data export/deletion.
- Content bundles are versioned and can be statically delivered; the session plan and child state are dynamic.
- Progressive Web App metadata and asset caching may be added in P1.

### Vercel

- Git-connected Vercel project with Preview and Production environments.
- Required server-only variables: `OPENAI_API_KEY`, `SUPABASE_SECRET_KEY`.
- Public variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Optional controls: `VOICE_ENABLED`, `VOICE_MODEL`, `VOICE_DAILY_BUDGET_USD`, `CONTENT_VERSION`.
- Preview deployments use test data and never production child records.
- Protect non-production deployments and prevent search indexing.
- Use WebRTC directly between browser and OpenAI after authenticated server-side session initialization; do not proxy a long-lived audio stream through a Vercel Function.

### Supabase

Supabase provides parent authentication, Postgres, and optionally Storage for reviewed content assets.

Proposed tables:

- `parent_profiles`
- `child_profiles`
- `consent_records`
- `skills`
- `content_items`
- `content_versions`
- `sessions`
- `attempts`
- `mastery_states`
- `rewards`
- `child_rewards`
- `feature_flags`
- `deletion_requests`

Security rules:

- Enable Row Level Security on every exposed table.
- A parent can access only rows belonging to child profiles they own.
- Use the browser-safe publishable key in the client.
- Keep the secret key server-only; it bypasses RLS and must never reach the browser.
- Put authorization claims in `app_metadata`, not user-editable metadata.
- Index ownership and policy filter columns.
- Prefer a private schema for internal functions and non-public operational tables.
- Explicitly configure which schemas/tables are exposed to the Data API because new Supabase projects no longer expose new tables automatically.
- Store no audio blob in Supabase in v1.

### Logical request flow

1. Parent authenticates with Supabase.
2. Client loads child state through RLS-protected queries.
3. Server composes or validates a session from versioned content.
4. If live voice is enabled and consent/privacy gates pass, client sends SDP to `/api/voice/session`.
5. Route Handler authenticates the parent, checks child ownership, consent version, budget, and feature flag, then creates a constrained OpenAI Realtime call.
6. Browser and OpenAI exchange bounded audio through WebRTC.
7. The game confirms ambiguous voice results through tap/drag.
8. Minimal attempt and mastery events are written to Supabase.

## 16. Content system

Every content item includes:

- skill ID and prerequisite skill IDs;
- grapheme/phoneme or vocabulary target;
- allowed/review words;
- prompt and hint ladder;
- response modes;
- illustration and audio asset references;
- decodability report;
- accessibility labels/captions;
- locale/dialect metadata;
- reviewer and approval date; and
- immutable content version.

Runtime generation may personalize only presentation from approved options. It may not introduce a new target word, fact, phonics rule, story, or child-facing URL.

## 17. Analytics and success

### North-star outcome

The percentage of active children who independently demonstrate delayed mastery of at least one targeted skill per week.

### Product metrics

- 70% of onboarded families complete a first session.
- Median session completion rate of at least 80%.
- At least 50% of active families complete three sessions in a week during beta.
- At least 70% of parents agree that progress is understandable and the child wants to return.
- Fewer than 2% of sessions end because the child is stuck on one item.

### Learning metrics

- independent versus hinted success by skill;
- delayed retrieval success after 2–7 days;
- successful CVC blends across unfamiliar words;
- connected-text completion and self-correction;
- generalization to unpracticed but decodable items; and
- parent-reported offline transfer.

### Reliability, safety, and cost metrics

- P75 child interaction response under 300 ms for local/tap actions.
- P75 voice turn response under 1.5 seconds after end of speech.
- Crash-free session rate above 99.5%.
- Voice fallback rate and low-confidence rate tracked by device/noise bucket.
- Zero raw audio or child transcript content in application logs.
- Voice cost per completed session and daily hard-budget enforcement.
- Safety test pass rate of 100% for release-blocking scenarios.

Analytics events use random internal IDs and coarse buckets. Do not send child nickname, spoken content, exact age, or free text to analytics.

## 18. Evaluation and testing

### Learning/content

- Reading specialist approves scope, sequence, phoneme models, word lists, decodability, and hint ladders.
- Automated content lint prevents untaught patterns from entering decodable stories.
- Pilot with caregivers and children representing varied accents, dialects, abilities, and device familiarity.

### Voice

- Curated audio set covers quiet/noisy rooms, soft/loud speech, hesitations, common childhood speech patterns, and multiple dialects.
- Measure false rejection separately from false acceptance.
- Any uncertain result has a non-voice confirmation.
- Scripted evals verify that the coach stays within the lesson, refuses personal-data collection, and ends when asked.

### Engineering

- Unit tests for session composition and mastery transitions.
- Database tests for every RLS policy and deletion cascade.
- Contract tests for content versions.
- End-to-end tests for onboarding, consent change, no-mic session, voice fallback, session recovery, dashboard, export, and deletion.
- Performance tests on mid-range mobile hardware and constrained networks.
- Preview deployment smoke test before every production promotion.

## 19. Delivery phases

### Phase 0 — learning and safety foundation

- Approve curriculum scope and initial sequence.
- Define child-data map, consent flow, retention, ZDR path, and launch gates.
- Prototype the core child interaction with families.

### Phase 1 — platform foundation

- Scaffold Next.js app and Vercel environments.
- Provision Supabase, parent auth, schema, RLS, and consent records.
- Build the design system, game shell, and content format.

### Phase 2 — playable learning loop

- Build the five core activities.
- Add session composition, deterministic adaptation, persistence, and the starter content pack.
- Add companion and garden progression.

### Phase 3 — voice coach

- Implement authenticated WebRTC session creation.
- Add constrained prompts/tools, push-to-talk, confidence handling, and fallback.
- Complete voice quality, privacy, and safety evals.

### Phase 4 — parent value and hardening

- Build progress dashboard, offline activities, settings, export, and deletion.
- Complete accessibility, performance, observability, and cost controls.

### Phase 5 — private beta

- Ship a protected Vercel production beta.
- Run family usability and learning pilots.
- Review metrics and incidents weekly; expand only after release gates pass.

## 20. Release gates

The private beta may launch only when:

- the no-microphone experience is complete and independently usable;
- a reading specialist has approved the initial content;
- parent consent, privacy notice, export, and deletion work end to end;
- all exposed Supabase tables pass RLS tests;
- logs and analytics contain no disallowed child data;
- accessibility and target device checks pass;
- incident response and rollback procedures are documented; and
- live voice is disabled unless the separate child-privacy launch gate in Section 10 has passed.

## 21. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Speech systems mishear young children | Push-to-talk, confidence bands, tap confirmation, no pronunciation grading, diverse eval set |
| AI drifts beyond lesson | Reviewed content, narrow prompt, allowlisted functions, short turns, no web, automated evals |
| Voice privacy/compliance blocks launch | Voice feature flag and complete narrated no-mic experience |
| Rewards become manipulative | Reward completion/effort, no purchases/leaderboards, deliberate session ending |
| Children guess from pictures | Show picture after the decoding attempt; measure transfer to unfamiliar words |
| Curriculum advances too quickly | One new concept per session, delayed retrieval, transparent mastery rules |
| Database authorization mistake | RLS everywhere, policy tests, parent ownership checks, server-only secret key |
| Realtime cost spikes | Push-to-talk, bounded sessions/turns, model/budget flags, daily hard limit and fallback |
| Poor connectivity | Resume-safe session state and approved-content caching in P1 |

## 22. Open product decisions

1. Final brand/name and companion art direction.
2. Initial letter-sound teaching sequence and locale.
3. Verifiable parental consent method and launch geographies.
4. Whether the beta includes live voice or starts with reviewed narration only.
5. Voice choice after testing intelligibility with young children.
6. Beta cohort size and target devices.
7. Whether parent authentication starts with email magic link, passkey, or OAuth.

## 23. Reference basis

- U.S. Institute of Education Sciences, *Foundational Skills to Support Reading for Understanding in Kindergarten Through 3rd Grade*: https://ies.ed.gov/ncee/wwc/Docs/PracticeGuide/wwc_foundationalreading_040717.pdf
- OpenAI, *Realtime API with WebRTC*: https://developers.openai.com/api/docs/guides/realtime-webrtc
- OpenAI, *GPT-Realtime-2.1 mini*: https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini
- OpenAI, *Under 18 API Guidance*: https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance
- FTC, *Complying with COPPA: Frequently Asked Questions*: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- Supabase, *Securing your data*: https://supabase.com/docs/guides/database/secure-data
- Supabase, *Understanding API keys*: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase changelog: https://supabase.com/changelog
- Vercel, *Next.js on Vercel*: https://vercel.com/docs/frameworks/full-stack/nextjs
- Vercel, *Environment variables*: https://vercel.com/docs/environment-variables
