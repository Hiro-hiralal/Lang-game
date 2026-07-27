import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActivityView } from "@/components/activities";
import {
  manipulationShare,
  type ActivityResult,
} from "@/lib/activity-types";
import type { Activity } from "@/lib/game-types";

function baseActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    key: "test",
    id: "word-garden",
    kind: "word",
    skillId: "build-cvc",
    title: "Test",
    eyebrow: "Test",
    instruction: "Do the thing.",
    prompt: "Do the thing?",
    helper: "Here is a nudge.",
    options: [],
    celebration: "Nice!",
    skill: "Testing",
    voice: {
      prompt: "v.prompt",
      hints: ["v.h1", "v.h2"],
      correct: "v.correct",
      wrong: {},
    },
    bubble: {
      prompt: "Do the thing?",
      hints: ["Here is a nudge.", "Here is a bigger nudge."],
      correct: "Nice!",
      wrong: {},
    },
    ...overrides,
  };
}

function renderActivity(activity: Activity) {
  const results: ActivityResult[] = [];
  render(
    <ActivityView
      activity={activity}
      reducedMotion
      answered={false}
      hintLevel={0}
      onAnswer={(result) => results.push(result)}
      speak={vi.fn()}
    />,
  );
  return results;
}

describe("WordBuilder", () => {
  const buildActivity = baseActivity({
    interaction: "build",
    build: {
      word: "map",
      tiles: ["m", "a", "p", "s"],
      slots: [null, null, null],
    },
  });

  it("builds a word by tapping a tile then tapping a slot", async () => {
    const user = userEvent.setup();
    const results = renderActivity(buildActivity);

    for (const [position, letter] of [["1", "m"], ["2", "a"], ["3", "p"]]) {
      await user.click(screen.getByRole("button", { name: `Letter ${letter}` }));
      await user.click(
        screen.getByRole("button", { name: `Empty slot ${position}` }),
      );
    }

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      correct: true,
      mode: "drag",
      chosenId: "map",
      expectedId: "map",
    });
  });

  it("reports a wrong build without crediting it", async () => {
    const user = userEvent.setup();
    const results = renderActivity(buildActivity);

    for (const [position, letter] of [["1", "s"], ["2", "a"], ["3", "p"]]) {
      await user.click(screen.getByRole("button", { name: `Letter ${letter}` }));
      await user.click(
        screen.getByRole("button", { name: `Empty slot ${position}` }),
      );
    }

    expect(results[0]).toMatchObject({ correct: false, chosenId: "sap" });
  });

  it("keeps given letters fixed in a medial-vowel substitution", async () => {
    const user = userEvent.setup();
    const results = renderActivity(
      baseActivity({
        interaction: "build",
        skillId: "medial-vowel",
        build: { word: "sit", tiles: ["a", "i", "o"], slots: ["s", null, "t"] },
      }),
    );

    // Only the middle slot is open; s and t are not choices.
    expect(
      screen.queryByRole("button", { name: /Empty slot 1/ }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Letter i" }));
    await user.click(screen.getByRole("button", { name: "Empty slot 2" }));

    expect(results[0]).toMatchObject({ correct: true, chosenId: "sit" });
  });

  it("spends a tile once it is placed", async () => {
    const user = userEvent.setup();
    renderActivity(buildActivity);

    await user.click(screen.getByRole("button", { name: "Letter m" }));
    await user.click(screen.getByRole("button", { name: "Empty slot 1" }));

    expect(screen.getByRole("button", { name: "Letter m" })).toBeDisabled();
  });
});

describe("BlendSweep", () => {
  const sweepActivity = baseActivity({
    interaction: "blend-sweep",
    kind: "blend",
    skillId: "blend-cvc",
    blendSweep: {
      graphemes: ["m", "a", "t"],
      phonemes: ["mmmmm", "aaaaa", "t"],
      word: "mat",
    },
  });

  it("completes when the stones are touched left to right", async () => {
    const user = userEvent.setup();
    const results = renderActivity(sweepActivity);

    await user.click(screen.getByRole("button", { name: "m, next" }));
    await user.click(screen.getByRole("button", { name: "a, next" }));
    await user.click(screen.getByRole("button", { name: "t, next" }));

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ correct: true, chosenId: "mat" });
  });

  it("ignores stones touched out of order, because blending runs left to right", async () => {
    const user = userEvent.setup();
    const results = renderActivity(sweepActivity);

    await user.click(screen.getByRole("button", { name: "t" }));
    await user.click(screen.getByRole("button", { name: "a" }));

    expect(results).toHaveLength(0);
    expect(screen.getByRole("button", { name: "m, next" })).toBeInTheDocument();
  });
});

describe("SyllableTap", () => {
  const clapActivity = baseActivity({
    interaction: "syllables",
    skillId: "syllables",
    syllables: { word: "butterfly", count: 3, icon: "🦋" },
  });

  it("accepts the right number of beats", async () => {
    const user = userEvent.setup();
    const results = renderActivity(clapActivity);

    const drum = screen.getByRole("button", { name: /Tap once for each beat/ });
    await user.click(drum);
    await user.click(drum);
    await user.click(drum);
    await user.click(screen.getByRole("button", { name: /That’s my answer/ }));

    expect(results[0]).toMatchObject({
      correct: true,
      mode: "sequence",
      chosenId: "3",
      expectedId: "3",
    });
  });

  it("does not check the count until the child says they are done", async () => {
    const user = userEvent.setup();
    const results = renderActivity(clapActivity);

    const drum = screen.getByRole("button", { name: /Tap once for each beat/ });
    await user.click(drum);
    await user.click(drum);

    // Two beats so far, but no verdict: the rhythm is not a race.
    expect(results).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /That’s my answer/ }));
    expect(results[0]).toMatchObject({ correct: false, chosenId: "2" });
  });
});

describe("SortBaskets", () => {
  const sortActivity = baseActivity({
    interaction: "sort",
    kind: "rhyme",
    skillId: "rhyme",
    sort: {
      baskets: [
        { id: "at", label: "-at words", icon: "🧺" },
        { id: "og", label: "-og words", icon: "🧺" },
      ],
      items: [
        { id: "cat", label: "Cat", spokenLabel: "cat", icon: "🐈", basketId: "at" },
        { id: "dog", label: "Dog", spokenLabel: "dog", icon: "🐕", basketId: "og" },
      ],
    },
  });

  it("credits the item only when every word is sorted", async () => {
    const user = userEvent.setup();
    const results = renderActivity(sortActivity);

    await user.click(screen.getByRole("button", { name: "cat" }));
    await user.click(screen.getByRole("button", { name: "Basket: -at words" }));
    expect(results).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "dog" }));
    await user.click(screen.getByRole("button", { name: "Basket: -og words" }));

    expect(results.at(-1)).toMatchObject({ correct: true, mode: "drag" });
  });

  it("reports a miss and leaves the word to be sorted again", async () => {
    const user = userEvent.setup();
    const results = renderActivity(sortActivity);

    await user.click(screen.getByRole("button", { name: "cat" }));
    await user.click(screen.getByRole("button", { name: "Basket: -og words" }));

    expect(results[0]).toMatchObject({
      correct: false,
      chosenId: "og",
      expectedId: "at",
    });
    expect(screen.getByRole("button", { name: "cat" })).toBeInTheDocument();
  });
});

describe("ReadAlong", () => {
  const readActivity = baseActivity({
    interaction: "read-along",
    kind: "story",
    skillId: "connected-text",
    readAlong: {
      lines: ["Sam sat.", "A cat sat with Sam."],
      wordDurationMs: 5,
    },
  });

  it("renders every word as its own tappable target", () => {
    renderActivity(readActivity);
    // "Sam" appears in both lines, so each occurrence is separately tappable.
    expect(
      screen.getAllByRole("button", { name: "Hear the word Sam" }),
    ).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Hear the word cat" }),
    ).toBeInTheDocument();
  });

  it("offers playback of the whole passage", () => {
    renderActivity(readActivity);
    expect(
      screen.getByRole("button", { name: /Read with me/ }),
    ).toBeInTheDocument();
  });
});

describe("manipulationShare", () => {
  it("counts systems where the child produces rather than picks", () => {
    const activities = [
      baseActivity({ key: "a", interaction: "choice" }),
      baseActivity({ key: "b", interaction: "build" }),
      baseActivity({ key: "c", interaction: "blend-sweep" }),
      baseActivity({ key: "d", interaction: "trace" }),
    ];
    expect(manipulationShare(activities)).toBe(0.75);
  });

  it("treats an activity with no declared interaction as a choice", () => {
    expect(manipulationShare([baseActivity({ interaction: undefined })])).toBe(0);
  });
});
