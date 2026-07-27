import { describe, expect, it } from "vitest";
import {
  interactionOf,
  isManipulative,
  manipulationShare,
} from "@/lib/activity-types";
import { MOON_MOUSE_EPISODE, episodeActivities } from "@/lib/episodes/moon-mouse";
import { checkDecodable, graphemesTaughtBy } from "@/lib/learning/decodability";
import { isSkillId, TAUGHT_GRAPHEMES } from "@/lib/learning/skills";
import { hasStrokes } from "@/lib/letter-strokes";
import { getVoiceLine } from "@/lib/narration";
import { ADVENTURES, LIBRARY_STORIES, STICKERS } from "@/lib/world-data";

const ALL_ACTIVITIES = ADVENTURES.flatMap((adventure) => adventure.activities);
const PROPER_NOUNS = ["mia", "pip", "sam", "meg", "mo"];

describe("world integrity", () => {
  it("has no duplicate activity keys", () => {
    const keys = ALL_ACTIVITIES.map((activity) => activity.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("points every activity at a real skill", () => {
    for (const activity of ALL_ACTIVITIES) {
      expect(isSkillId(activity.skillId), `${activity.key}`).toBe(true);
    }
  });

  it("resolves every narration line an activity references", () => {
    // A missing line is silent failure at runtime: the audio 404s and the
    // child gets device speech reading raw fallback text.
    for (const activity of ALL_ACTIVITIES) {
      const ids = [
        activity.voice.prompt,
        ...activity.voice.hints,
        activity.voice.correct,
        ...Object.values(activity.voice.wrong),
      ];
      for (const id of ids) {
        expect(getVoiceLine(id), `${activity.key} -> ${id}`).toBeDefined();
      }
    }
  });

  it("resolves every episode narration line", () => {
    for (const beat of MOON_MOUSE_EPISODE.beats) {
      if (beat.kind === "opening" || beat.kind === "finale") {
        for (const card of beat.cards) {
          expect(getVoiceLine(card.voiceId), card.id).toBeDefined();
        }
      }
      if (beat.kind === "explore") {
        expect(getVoiceLine(beat.voiceId)).toBeDefined();
        for (const object of beat.objects) {
          expect(getVoiceLine(object.voiceId), object.id).toBeDefined();
        }
      }
    }
  });

  it("awards only stickers that exist", () => {
    const stickerIds = new Set(STICKERS.map((sticker) => sticker.id));
    for (const adventure of ADVENTURES) {
      expect(
        stickerIds.has(adventure.rewardStickerId),
        `${adventure.id} -> ${adventure.rewardStickerId}`,
      ).toBe(true);
    }
  });
});

describe("activity systems have the config they need", () => {
  it("gives every blend sweep a full set of graphemes and phonemes", () => {
    for (const activity of ALL_ACTIVITIES) {
      if (interactionOf(activity) !== "blend-sweep") continue;
      const config = activity.blendSweep;
      expect(config, activity.key).toBeDefined();
      expect(config!.graphemes.length).toBeGreaterThan(1);
      expect(config!.phonemes).toHaveLength(config!.graphemes.length);
      expect(config!.word).toBe(config!.graphemes.join(""));
    }
  });

  it("gives every word build a solvable slot pattern", () => {
    for (const activity of ALL_ACTIVITIES) {
      if (interactionOf(activity) !== "build") continue;
      const config = activity.build;
      expect(config, activity.key).toBeDefined();

      const open = config!.slots.filter((slot) => slot === null).length;
      expect(open, `${activity.key} has no open slot`).toBeGreaterThan(0);
      expect(config!.slots).toHaveLength(config!.word.length);

      // Every letter the child must place is actually on offer.
      const needed = config!.slots
        .map((slot, index) => (slot === null ? config!.word[index] : null))
        .filter((letter): letter is string => letter !== null);
      for (const letter of needed) {
        expect(config!.tiles, `${activity.key} missing tile ${letter}`).toContain(
          letter,
        );
      }
    }
  });

  it("only asks children to trace letters that have a stroke guide", () => {
    for (const activity of ALL_ACTIVITIES) {
      if (interactionOf(activity) !== "trace") continue;
      expect(activity.trace, activity.key).toBeDefined();
      expect(hasStrokes(activity.trace!.letter), activity.key).toBe(true);
    }
  });

  it("gives every sort at least two baskets and a home for each item", () => {
    for (const activity of ALL_ACTIVITIES) {
      if (interactionOf(activity) !== "sort") continue;
      const config = activity.sort;
      expect(config, activity.key).toBeDefined();
      expect(config!.baskets.length).toBeGreaterThanOrEqual(2);

      const basketIds = new Set(config!.baskets.map((basket) => basket.id));
      for (const item of config!.items) {
        expect(basketIds.has(item.basketId), `${activity.key}/${item.id}`).toBe(
          true,
        );
      }
      // A sort where everything goes in one basket is not a judgement.
      expect(new Set(config!.items.map((i) => i.basketId)).size).toBeGreaterThan(1);
    }
  });

  it("gives every read-along real lines", () => {
    for (const activity of ALL_ACTIVITIES) {
      if (interactionOf(activity) !== "read-along") continue;
      const lines = activity.readAlong?.lines ?? [];
      expect(lines.length, activity.key).toBeGreaterThan(0);
      for (const line of lines) expect(line.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("manipulation over selection", () => {
  it("keeps most of the world hands-on rather than multiple choice", () => {
    // Every activity used to be tap-one-of-three. Rhyme matching and story
    // comprehension are genuinely choices and stay that way; the rest ask the
    // child to produce something.
    expect(manipulationShare(ALL_ACTIVITIES)).toBeGreaterThanOrEqual(0.6);
  });

  it("makes the flagship episode entirely hands-on", () => {
    expect(manipulationShare(episodeActivities(MOON_MOUSE_EPISODE))).toBe(1);
  });

  it("uses more than one manipulative system across the world", () => {
    const systems = new Set(
      ALL_ACTIVITIES.map(interactionOf).filter(isManipulative),
    );
    expect(systems.size).toBeGreaterThanOrEqual(4);
  });
});

describe("decodability lint", () => {
  it("passes every library story against the taught alphabet", () => {
    for (const story of LIBRARY_STORIES) {
      const report = checkDecodable(story.lines.join(" "), TAUGHT_GRAPHEMES, {
        properNouns: PROPER_NOUNS,
      });
      expect(
        report.decodable,
        `${story.id}: ${report.offenders.map((o) => o.word).join(", ")}`,
      ).toBe(true);
    }
  });

  it("passes every read-along passage", () => {
    for (const activity of ALL_ACTIVITIES) {
      if (interactionOf(activity) !== "read-along") continue;
      const report = checkDecodable(
        (activity.readAlong?.lines ?? []).join(" "),
        TAUGHT_GRAPHEMES,
        { properNouns: PROPER_NOUNS },
      );
      expect(
        report.decodable,
        `${activity.key}: ${report.offenders.map((o) => o.word).join(", ")}`,
      ).toBe(true);
    }
  });

  it("holds the flagship story to the letters taught by that point", () => {
    // The sequence-aware check: not "is this in the alphabet" but "has this
    // child been shown it yet". The episode teaches m, so its closing text may
    // only use m and what came before, plus heart words.
    const beat = MOON_MOUSE_EPISODE.beats.find(
      (entry) => entry.kind === "activity" && entry.activity.readAlong,
    );
    const lines =
      beat?.kind === "activity" ? (beat.activity.readAlong?.lines ?? []) : [];

    const report = checkDecodable(lines.join(" "), graphemesTaughtBy("ls-o"), {
      heartWords: ["the", "has", "is", "a"],
      properNouns: ["mo"],
    });
    expect(report.decodable, report.offenders.map((o) => o.word).join(", ")).toBe(
      true,
    );
  });

  it("catches a word built from an untaught letter", () => {
    // The lint has to actually fail on bad content, or it is decoration.
    const report = checkDecodable("The zebra sat.", ["t", "h", "e", "s", "a"], {
      heartWords: ["the"],
    });
    expect(report.decodable).toBe(false);
    expect(report.offenders[0].word).toBe("zebra");
    expect(report.offenders[0].untaught).toContain("z");
  });

  it("allows heart words that are not yet decodable", () => {
    const report = checkDecodable("The cat was sad.", ["c", "a", "t", "s", "d"], {
      heartWords: ["the", "was"],
    });
    expect(report.decodable).toBe(true);
  });
});
