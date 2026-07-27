import type { Activity, ZoneId } from "@/lib/game-types";

/**
 * An episode is a story whose beats happen to teach reading, rather than a
 * quiz with a story pasted on either end. Scored activities sit in the middle
 * of the narrative and advance it — the lantern relights because the child
 * traced the letter, not as a reward for having done so.
 */
export interface StoryCard {
  id: string;
  text: string;
  /** Registered narration line id. */
  voiceId: string;
  /** Emoji cast for the scene, drawn large and animated. */
  cast: string[];
  /** CSS gradient for the backdrop. */
  sky: string;
}

export interface ExploreObject {
  id: string;
  label: string;
  icon: string;
  /** Spoken when tapped. */
  voiceId: string;
  /** True when the name begins with the sound being taught. */
  startsWithTarget: boolean;
  /** Position within the scene, as percentages. */
  x: number;
  y: number;
}

export type EpisodeBeat =
  | {
      kind: "opening";
      id: string;
      cards: StoryCard[];
    }
  | {
      kind: "explore";
      id: string;
      title: string;
      instruction: string;
      voiceId: string;
      sky: string;
      objects: ExploreObject[];
      /** How many objects must be discovered before the story moves on. */
      requiredTaps: number;
    }
  | {
      kind: "activity";
      id: string;
      /** Story text shown above the activity, tying it to the narrative. */
      beatText: string;
      activity: Activity;
    }
  | {
      kind: "finale";
      id: string;
      cards: StoryCard[];
      /** Garden plant unlocked permanently on completion. */
      rewardPlantId: string;
      rewardName: string;
    };

export interface Episode {
  id: string;
  regionId: ZoneId;
  title: string;
  subtitle: string;
  minutes: number;
  /** The adventure this episode replaces in the region path. */
  adventureId: string;
  rewardStickerId: string;
  rewardName: string;
  beats: EpisodeBeat[];
}
