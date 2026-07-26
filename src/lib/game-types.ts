export type Screen = "welcome" | "map" | "session" | "grownup";

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
  id: ZoneId;
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
