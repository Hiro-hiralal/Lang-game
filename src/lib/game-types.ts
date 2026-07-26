export type Screen =
  | "welcome"
  | "map"
  | "region"
  | "session"
  | "garden"
  | "stories"
  | "collection"
  | "grownup";

export type ZoneId =
  | "sound-safari"
  | "letter-lanterns"
  | "blend-bridge"
  | "word-garden"
  | "story-stage";

export interface PlayerProgress {
  childName: string;
  sessionsCompleted: number;
  seeds: number;
  streak: number;
  masteredLetters: string[];
  masteredWords: string[];
  gardenLevel: number;
  soundOn: boolean;
  reducedMotion: boolean;
  lastPlayed: string | null;
  completedAdventureIds: string[];
  plantedSeedIds: string[];
  unlockedStickerIds: string[];
  readStoryIds: string[];
  totalStars: number;
  dailyQuestDate: string | null;
}

export interface Zone {
  id: ZoneId;
  name: string;
  eyebrow: string;
  description: string;
  color: string;
  glow: string;
  icon: string;
  requiredSeeds: number;
}

export interface AnswerOption {
  id: string;
  label: string;
  spokenLabel: string;
  icon?: string;
  correct: boolean;
}

export interface ActivityVoice {
  prompt: string;
  hints: [string, string];
  correct: string;
  wrong: Record<string, string>;
}

export interface ActivityBubble {
  prompt: string;
  hints: [string, string];
  correct: string;
  wrong: Record<string, string>;
}

export interface Activity {
  key: string;
  id: ZoneId;
  kind: "rhyme" | "sound" | "letter" | "blend" | "word" | "story";
  title: string;
  eyebrow: string;
  instruction: string;
  prompt: string;
  helper: string;
  options: AnswerOption[];
  celebration: string;
  skill: string;
  voice: ActivityVoice;
  bubble: ActivityBubble;
  letters?: string[];
  storyWords?: string[];
}

export interface Adventure {
  id: string;
  regionId: ZoneId;
  title: string;
  chapter: number;
  description: string;
  minutes: number;
  difficulty: 1 | 2 | 3 | 4;
  rewardStickerId: string;
  rewardName: string;
  storyId?: string;
  activities: Activity[];
}

export interface LibraryStory {
  id: string;
  title: string;
  subtitle: string;
  regionId: ZoneId;
  lines: string[];
  narrationId: string;
  unlockAdventureId: string;
}

export interface Sticker {
  id: string;
  name: string;
  icon: string;
  regionId: ZoneId;
  description: string;
}
