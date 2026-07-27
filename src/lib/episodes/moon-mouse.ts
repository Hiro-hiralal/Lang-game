import { registerVoiceLine } from "@/lib/narration-registry";
import type { Activity } from "@/lib/game-types";
import type { Episode } from "@/lib/episodes/types";

const NIGHT_SKY =
  "linear-gradient(180deg, #2b3a63 0%, #47548a 46%, #7d7fa8 78%, #b9a68f 100%)";
const GROVE_SKY =
  "linear-gradient(180deg, #3d4a76 0%, #6d6f9c 40%, #9d8f8c 72%, #cbb492 100%)";
const DAWN_SKY =
  "linear-gradient(180deg, #f7c98b 0%, #f2b455 38%, #d9e0b4 72%, #e2edd9 100%)";

function line(id: string, text: string, mood: Parameters<typeof registerVoiceLine>[2]) {
  return registerVoiceLine(`episode.moon-mouse.${id}`, text, mood);
}

/**
 * "Mo has a map. The map sat in the moss. Mo is not sad!"
 *
 * Every word is decodable from the letter-sounds taught up to this point
 * (m, a, t, s, p, i, n, d, o) apart from the heart words below, which are
 * introduced explicitly rather than left to be guessed. PRD section 7.
 */
const ENDING_LINES = [
  "Mo has a map.",
  "The map sat in the moss.",
  "Mo is not sad!",
];

export const MOON_MOUSE_HEART_WORDS = ["the", "has", "is", "a"];

/**
 * Beat 3. Sorting objects by first sound, rather than picking one of three.
 * Moon Mouse can only carry the things that start with her own sound.
 */
const findTheSoundActivity: Activity = {
  key: "moon-mouse-find-m",
  id: "letter-lanterns",
  kind: "sound",
  skillId: "first-sound",
  interaction: "sort",
  title: "Mo’s Basket",
  eyebrow: "Lantern Grove · First sounds",
  instruction: "Fill Mo’s basket with mmmmm words.",
  prompt: "Which of these begin with mmmmm, like Mo?",
  helper: "Close your lips and hum the very first sound: mmmmm.",
  options: [],
  celebration: "Every mmmmm word is in the basket. Mo can carry them home!",
  skill: "First sounds",
  sort: {
    baskets: [
      { id: "m-basket", label: "Mo’s mmmmm basket", icon: "🧺" },
      { id: "other-basket", label: "Leave it here", icon: "🍃" },
    ],
    items: [
      { id: "moon", label: "Moon", spokenLabel: "moon", icon: "🌙", basketId: "m-basket" },
      { id: "moss", label: "Moss", spokenLabel: "moss", icon: "🌿", basketId: "m-basket" },
      { id: "mushroom", label: "Mushroom", spokenLabel: "mushroom", icon: "🍄", basketId: "m-basket" },
      { id: "sun", label: "Sun", spokenLabel: "sun", icon: "☀️", basketId: "other-basket" },
      { id: "bell", label: "Bell", spokenLabel: "bell", icon: "🔔", basketId: "other-basket" },
    ],
  },
  voice: {
    prompt: line(
      "find.prompt",
      "Mo can only carry things that start with her own sound. Listen: mmmmm. Moon. Mmmmm. Moss. Put every mmmmm word in her basket, and leave the rest on the ground.",
      "curious",
    ),
    hints: [
      line(
        "find.hint1",
        "Close your lips and hum the very first sound. Mmmmm-oon. Mmmmm-oss. Does this one begin with that hum?",
        "coach",
      ),
      line(
        "find.hint2",
        "Say the word slowly and stop at the very first sound. If your lips press together and hum, it belongs in Mo’s basket.",
        "coach",
      ),
    ],
    correct: line(
      "find.correct",
      "Moon, moss, mushroom. Every single mmmmm word is in the basket. Mo can carry them all the way home!",
      "celebrate",
    ),
    wrong: {},
  },
  bubble: {
    prompt: "Mo can only carry mmmmm words. Which ones begin with her sound?",
    hints: [
      "Close your lips and hum the first sound: mmmmm.",
      "Say it slowly and stop at the first sound.",
    ],
    correct: "Moon, moss, mushroom. All the mmmmm words are packed!",
    wrong: {},
  },
};

/**
 * Beat 4. The sound-orbs. Building "map" from tiles, because producing the
 * word is the skill; recognising it in a list is not.
 */
const buildMapActivity: Activity = {
  key: "moon-mouse-build-map",
  id: "word-garden",
  kind: "word",
  skillId: "build-cvc",
  interaction: "build",
  title: "The Sound Orbs",
  eyebrow: "Lantern Grove · Building words",
  instruction: "Pull the three sound orbs together to make the word.",
  prompt: "Mmmmm… aaaaa… p. Build the word Mo is looking for.",
  helper: "Take them in order. The humming sound comes first.",
  options: [],
  celebration: "M–a–p. Map! The orbs snapped together and the map appeared.",
  skill: "Building a word",
  build: {
    word: "map",
    tiles: ["m", "a", "p", "s", "t"],
    slots: [null, null, null],
  },
  voice: {
    prompt: line(
      "build.prompt",
      "Three sound orbs are floating in the dark. Listen while I stretch them: mmmmm… aaaaa… p. Mmmmm-aaaaa-p. Map! Pull the orbs together in that order to build it.",
      "curious",
    ),
    hints: [
      line(
        "build.hint1",
        "Start with the sound Mo makes: mmmmm. That orb goes first, right at the front of the word.",
        "coach",
      ),
      line(
        "build.hint2",
        "Mmmmm goes first. Then the wide open aaaaa in the middle. Then a quick p at the end. M, a, p.",
        "coach",
      ),
    ],
    correct: line(
      "build.correct",
      "M, a, p. Map! The orbs snapped together and there it is, glowing in your hands. That is the map Mo lost!",
      "celebrate",
    ),
    wrong: {},
  },
  bubble: {
    prompt: "Mmmmm… aaaaa… p. Pull the orbs together to build it.",
    hints: [
      "The humming sound goes first: mmmmm.",
      "M, then a, then p. Map.",
    ],
    correct: "M–a–p. Map! You built the lost map.",
    wrong: {},
  },
};

/** Beat 5. Tracing m is what physically relights the lantern. */
const traceLanternActivity: Activity = {
  key: "moon-mouse-trace-m",
  id: "letter-lanterns",
  kind: "letter",
  skillId: "ls-m",
  interaction: "trace",
  title: "Relight the Lantern",
  eyebrow: "Lantern Grove · Letter sound m",
  instruction: "Draw the letter m to wake the lantern’s light.",
  prompt: "The lantern needs its letter back. Trace lowercase m.",
  helper: "Down the tall line, then over one hill, then over the other.",
  options: [],
  celebration: "The lantern is glowing again! Mmmmm for Mo, mmmmm for moon.",
  skill: "Letter sound: m",
  trace: { letter: "m" },
  voice: {
    prompt: line(
      "trace.prompt",
      "Look! The lantern has lost its letter. It cannot glow without it. Draw a lowercase m on the glass: straight down the tall line, then over one little hill, then over the other.",
      "curious",
    ),
    hints: [
      line(
        "trace.hint1",
        "Begin at the top of the tall line and slide your finger all the way down. That is the first stroke.",
        "coach",
      ),
      line(
        "trace.hint2",
        "Now two little hills, one after the other, both starting from that tall line. Down, over, over. That is m.",
        "coach",
      ),
    ],
    correct: line(
      "trace.correct",
      "The lantern is glowing again! Look at the light spilling across the moss. Mmmmm for Mo. Mmmmm for moon. Mmmmm for the map you found.",
      "celebrate",
    ),
    wrong: {},
  },
  bubble: {
    prompt: "Trace lowercase m to wake the lantern.",
    hints: [
      "Down the tall line first.",
      "Then over one hill, then the other.",
    ],
    correct: "The lantern is glowing again!",
    wrong: {},
  },
};

/** Beat 6. The payoff is reading it, not being read to. */
const readEndingActivity: Activity = {
  key: "moon-mouse-read-ending",
  id: "story-stage",
  kind: "story",
  skillId: "connected-text",
  interaction: "read-along",
  title: "Mo’s Story",
  eyebrow: "Lantern Grove · Reading it yourself",
  instruction: "Read Mo’s story in the lantern light.",
  prompt: "Mo has a map. The map sat in the moss. Mo is not sad!",
  helper: "Take one word at a time. Tap any word to hear it again.",
  options: [],
  celebration: "You read Mo’s whole story by yourself. Every single word.",
  skill: "Reading a whole story",
  readAlong: {
    lines: ENDING_LINES,
    wordDurationMs: 700,
    narrationId: line(
      "read.narration",
      "Mo has a map. The map sat in the moss. Mo is not sad!",
      "story",
    ),
  },
  voice: {
    prompt: line(
      "read.prompt",
      "Here is Mo’s story, written in the lantern light. Read it with me. You know every one of these words now.",
      "story",
    ),
    hints: [
      line(
        "read.hint1",
        "Take one word at a time. You can tap any word on its own to hear it again.",
        "coach",
      ),
      line(
        "read.hint2",
        "Sound each word out from left to right, the way you swept the orbs together. Mmmmm-aaaaa-p. Map.",
        "coach",
      ),
    ],
    correct: line(
      "read.correct",
      "You read Mo’s whole story. Every single word, all by yourself. That is real reading, and I saw you do it.",
      "celebrate",
    ),
    wrong: {},
  },
  bubble: {
    prompt: "Read Mo’s story in the lantern light.",
    hints: [
      "One word at a time. Tap a word to hear it.",
      "Sweep the sounds together, left to right.",
    ],
    correct: "You read the whole story yourself!",
    wrong: {},
  },
};

export const MOON_MOUSE_EPISODE: Episode = {
  id: "moon-mouse-lantern",
  regionId: "letter-lanterns",
  title: "Moon Mouse and the Lost Lantern",
  subtitle: "A night-time rescue in Lantern Grove",
  minutes: 11,
  adventureId: "moon-mouse",
  rewardStickerId: "moon-mouse",
  rewardName: "Moon Mouse",
  beats: [
    {
      kind: "opening",
      id: "opening",
      cards: [
        {
          id: "card-1",
          text: "Every night, one lantern keeps Lantern Grove glowing.",
          voiceId: line(
            "open.1",
            "Every night, one lantern keeps the whole of Lantern Grove glowing. It has never once gone out.",
            "story",
          ),
          cast: ["🏮"],
          sky: NIGHT_SKY,
        },
        {
          id: "card-2",
          text: "Tonight, it went dark.",
          voiceId: line(
            "open.2",
            "But tonight… it went dark. Every path in the grove disappeared into the shadows.",
            "story",
          ),
          cast: ["🌑"],
          sky: GROVE_SKY,
        },
        {
          id: "card-3",
          text: "Mo the mouse cannot find her way home.",
          voiceId: line(
            "open.3",
            "And somewhere in that dark, a little mouse named Mo is lost. She had a map, but the map is gone too.",
            "story",
          ),
          cast: ["🐭", "🌿"],
          sky: GROVE_SKY,
        },
        {
          id: "card-4",
          text: "Only you can bring the light back.",
          voiceId: line(
            "open.4",
            "You and I are going to find her map and light that lantern again. Ready? Come on. Quietly now.",
            "welcome",
          ),
          cast: ["🦊", "🐭"],
          sky: GROVE_SKY,
        },
      ],
    },
    {
      kind: "explore",
      id: "explore-grove",
      title: "Lantern Grove",
      instruction: "Tap things in the dark to see what they are.",
      voiceId: line(
        "explore.prompt",
        "It is very dark. Tap anything you can see and I will tell you what it is. Listen carefully to how each one starts.",
        "curious",
      ),
      sky: GROVE_SKY,
      requiredTaps: 4,
      objects: [
        {
          id: "moon",
          label: "moon",
          icon: "🌙",
          startsWithTarget: true,
          x: 74,
          y: 16,
          voiceId: line("explore.moon", "The moon. Mmmmm-oon.", "curious"),
        },
        {
          id: "moss",
          label: "moss",
          icon: "🌿",
          startsWithTarget: true,
          x: 20,
          y: 68,
          voiceId: line("explore.moss", "Soft moss. Mmmmm-oss.", "curious"),
        },
        {
          id: "mushroom",
          label: "mushroom",
          icon: "🍄",
          startsWithTarget: true,
          x: 46,
          y: 74,
          voiceId: line(
            "explore.mushroom",
            "A little mushroom. Mmmmm-ushroom.",
            "curious",
          ),
        },
        {
          id: "lantern",
          label: "lantern",
          icon: "🏮",
          startsWithTarget: false,
          x: 62,
          y: 44,
          voiceId: line(
            "explore.lantern",
            "There it is. The lantern. Completely dark.",
            "story",
          ),
        },
        {
          id: "mouse",
          label: "Mo",
          icon: "🐭",
          startsWithTarget: true,
          x: 32,
          y: 40,
          voiceId: line(
            "explore.mouse",
            "There you are, Mo! Mmmmm-o. She is shivering.",
            "story",
          ),
        },
        {
          id: "bell",
          label: "bell",
          icon: "🔔",
          startsWithTarget: false,
          x: 84,
          y: 60,
          voiceId: line("explore.bell", "An old bell. B-ell.", "curious"),
        },
      ],
    },
    {
      kind: "activity",
      id: "beat-find",
      beatText:
        "Mo can only carry things that share her sound. Help her pack.",
      activity: findTheSoundActivity,
    },
    {
      kind: "activity",
      id: "beat-build",
      beatText: "Three sound orbs are floating where the map used to be.",
      activity: buildMapActivity,
    },
    {
      kind: "activity",
      id: "beat-trace",
      beatText: "The lantern glass is empty. Its letter is missing.",
      activity: traceLanternActivity,
    },
    {
      kind: "activity",
      id: "beat-read",
      beatText: "In the new light, words appear across the moss.",
      activity: readEndingActivity,
    },
    {
      kind: "finale",
      id: "finale",
      rewardPlantId: "lantern-seed",
      rewardName: "Mo’s Lantern Seed",
      cards: [
        {
          id: "finale-1",
          text: "Mo found her way home.",
          voiceId: line(
            "finale.1",
            "Mo followed the map, all the way along the glowing path, right back to her mossy front door.",
            "story",
          ),
          cast: ["🐭", "🏮"],
          sky: DAWN_SKY,
        },
        {
          id: "finale-2",
          text: "She left you a seed from the lantern.",
          voiceId: line(
            "finale.2",
            "And she left something behind for you. A seed from the lantern itself. Plant it in your garden, and it will glow there every single night.",
            "celebrate",
          ),
          cast: ["🌱", "🏮"],
          sky: DAWN_SKY,
        },
      ],
    },
  ],
};

export const EPISODES: Episode[] = [MOON_MOUSE_EPISODE];

export function getEpisodeForAdventure(adventureId: string) {
  return EPISODES.find((episode) => episode.adventureId === adventureId);
}

export function episodeActivities(episode: Episode) {
  return episode.beats
    .filter((beat) => beat.kind === "activity")
    .map((beat) => beat.activity);
}
