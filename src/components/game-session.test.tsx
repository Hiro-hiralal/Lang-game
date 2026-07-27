import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GameSession } from "@/components/game-session";
import type { AttemptInput } from "@/hooks/use-learning-record";
import type { Narrator } from "@/hooks/use-narrator";
import type { Activity, Adventure } from "@/lib/game-types";

function narrator(): Narrator {
  return {
    speak: vi.fn(),
    stop: vi.fn(),
    preload: vi.fn(),
    isSpeaking: false,
    voiceMode: "ai",
  };
}

function letterActivity(): Activity {
  return {
    key: "test-letter",
    id: "letter-lanterns",
    kind: "letter",
    skillId: "ls-m",
    title: "Lantern",
    eyebrow: "Lantern puzzle",
    instruction: "Tap the letter that makes Pip's sound.",
    prompt: "Which letter hums?",
    helper: "Close your lips and hum.",
    options: [
      { id: "s", label: "s", spokenLabel: "s", correct: false },
      { id: "m", label: "m", spokenLabel: "m", correct: true },
      { id: "t", label: "t", spokenLabel: "t", correct: false },
    ],
    celebration: "You lit the lantern!",
    skill: "Letter sound: m",
    voice: {
      prompt: "v.prompt",
      hints: ["v.hint1", "v.hint2"],
      correct: "v.correct",
      wrong: {},
    },
    bubble: {
      prompt: "Which letter hums?",
      hints: ["Hum with me.", "It is lowercase m."],
      correct: "You lit the lantern!",
      wrong: {},
    },
  };
}

function blendActivity(): Activity {
  return {
    ...letterActivity(),
    key: "test-blend",
    id: "blend-bridge",
    kind: "blend",
    skillId: "blend-cvc",
    letters: ["m", "a", "t"],
    options: [
      { id: "mat", label: "Mat", spokenLabel: "mat", icon: "🟫", correct: true },
      { id: "sun", label: "Sun", spokenLabel: "sun", icon: "☀️", correct: false },
      { id: "cat", label: "Cat", spokenLabel: "cat", icon: "🐈", correct: false },
    ],
  };
}

function adventureOf(...activities: Activity[]): Adventure {
  return {
    id: "test-adventure",
    regionId: activities[0].id,
    title: "Test Adventure",
    chapter: 1,
    description: "A test chapter.",
    minutes: 5,
    difficulty: 1,
    rewardStickerId: "test-sticker",
    rewardName: "Test Treasure",
    activities,
  };
}

interface Harness {
  attempts: AttemptInput[];
  onComplete: ReturnType<typeof vi.fn>;
}

function renderSession(adventure: Adventure): Harness {
  const attempts: AttemptInput[] = [];
  const onComplete = vi.fn();

  render(
    <GameSession
      childName="explorer"
      adventure={adventure}
      reducedMotion
      narrator={narrator()}
      playSound={vi.fn()}
      onExit={vi.fn()}
      onComplete={onComplete}
      onAttempt={(attempt) => attempts.push(attempt)}
    />,
  );

  return { attempts, onComplete };
}

function answerCards() {
  return screen
    .getAllByRole("button")
    .filter((button) => button.className.includes("answer-card"));
}

describe("answer leakage", () => {
  /**
   * Regression test. The lantern visual used to render
   * `activity.options.find(o => o.correct)?.label`, so every letter activity
   * displayed its own answer in 4.4rem type before the child did anything.
   */
  it("does not show the answer letter before the child answers", () => {
    render(
      <GameSession
        childName="explorer"
        adventure={adventureOf(letterActivity())}
        reducedMotion
        narrator={narrator()}
        playSound={vi.fn()}
        onExit={vi.fn()}
        onComplete={vi.fn()}
        onAttempt={vi.fn()}
      />,
    );

    const lantern = document.querySelector(".letter-lantern");
    expect(lantern).not.toBeNull();
    expect(lantern?.textContent).not.toContain("m");
    expect(lantern).toHaveClass("letter-lantern--dark");
  });

  it("lights the lantern with the letter only after a correct answer", async () => {
    const user = userEvent.setup();
    renderSession(adventureOf(letterActivity()));

    const correct = answerCards().find((card) =>
      card.getAttribute("aria-label") === "m",
    );
    await user.click(correct!);

    const lantern = document.querySelector(".letter-lantern");
    expect(lantern?.textContent).toContain("m");
    expect(lantern).not.toHaveClass("letter-lantern--dark");
  });

  it("hides picture cues on a blending item until the answer is in", async () => {
    const user = userEvent.setup();
    renderSession(adventureOf(blendActivity()));

    // PRD section 7: the picture must not become a guessing cue.
    expect(screen.queryByText("🟫")).not.toBeInTheDocument();
    expect(screen.queryByText("☀️")).not.toBeInTheDocument();

    await user.click(
      answerCards().find((card) => card.getAttribute("aria-label") === "mat")!,
    );

    expect(screen.getByText("🟫")).toBeInTheDocument();
  });

  it("keeps picture cues on a rhyming item, where they are the question", () => {
    const rhyme: Activity = {
      ...letterActivity(),
      key: "test-rhyme",
      kind: "rhyme",
      skillId: "rhyme",
      id: "sound-safari",
      options: [
        { id: "fun", label: "Fun", spokenLabel: "fun", icon: "🎉", correct: true },
        { id: "fish", label: "Fish", spokenLabel: "fish", icon: "🐟", correct: false },
      ],
    };

    renderSession(adventureOf(rhyme));
    expect(screen.getByText("🎉")).toBeInTheDocument();
  });
});

describe("hint ladder", () => {
  /**
   * Regression test. A wrong tap used to disable that option permanently, so
   * with three choices two taps always produced a correct answer no matter what
   * the child knew.
   */
  it("leaves a wrong option tappable instead of eliminating it", async () => {
    const user = userEvent.setup();
    renderSession(adventureOf(letterActivity()));

    const wrong = answerCards().find(
      (card) => card.getAttribute("aria-label") === "s",
    );
    await user.click(wrong!);

    expect(wrong).not.toBeDisabled();
    expect(answerCards()).toHaveLength(3);
  });

  it("narrows to two choices only at the final rung", async () => {
    const user = userEvent.setup();
    renderSession(adventureOf(letterActivity()));

    const hintButton = screen.getByRole("button", { name: /hint/i });

    // Rungs 1 to 3: repeat, emphasize, model. The field stays wide.
    for (let rung = 0; rung < 3; rung += 1) {
      await user.click(hintButton);
      expect(answerCards()).toHaveLength(3);
    }

    // Rung 4 offers two choices, one of which is correct.
    await user.click(hintButton);
    const narrowed = answerCards();
    expect(narrowed).toHaveLength(2);
    expect(
      narrowed.some((card) => card.getAttribute("aria-label") === "m"),
    ).toBe(true);
  });
});

describe("attempt recording", () => {
  it("records a clean answer as independent", async () => {
    const user = userEvent.setup();
    const { attempts } = renderSession(adventureOf(letterActivity()));

    await user.click(
      answerCards().find((card) => card.getAttribute("aria-label") === "m")!,
    );

    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      itemId: "test-letter",
      skillId: "ls-m",
      correct: true,
      hintLevel: 0,
      mode: "tap",
    });
  });

  it("records an answer reached after narrowing as assisted", async () => {
    const user = userEvent.setup();
    const { attempts } = renderSession(adventureOf(letterActivity()));

    const hintButton = screen.getByRole("button", { name: /hint/i });
    for (let rung = 0; rung < 4; rung += 1) {
      await user.click(hintButton);
    }

    await user.click(
      answerCards().find((card) => card.getAttribute("aria-label") === "m")!,
    );

    const success = attempts.find((attempt) => attempt.correct);
    expect(success).toMatchObject({ mode: "assisted", hintLevel: 4 });
  });

  it("records the chosen and expected option on a miss, for confusion tracking", async () => {
    const user = userEvent.setup();
    const { attempts } = renderSession(adventureOf(letterActivity()));

    await user.click(
      answerCards().find((card) => card.getAttribute("aria-label") === "s")!,
    );

    expect(attempts[0]).toMatchObject({
      correct: false,
      chosenId: "s",
      expectedId: "m",
    });
  });
});

describe("session flow", () => {
  it("advances through activities and completes the adventure", async () => {
    const user = userEvent.setup();
    const letter = letterActivity();
    const blend = blendActivity();
    const { onComplete } = renderSession(adventureOf(letter, blend));

    expect(screen.getByText("Challenge 1 of 2")).toBeInTheDocument();

    await user.click(
      answerCards().find((card) => card.getAttribute("aria-label") === "m")!,
    );
    await user.click(screen.getByRole("button", { name: /Next stop/i }));

    expect(screen.getByText("Challenge 2 of 2")).toBeInTheDocument();

    await user.click(
      answerCards().find((card) => card.getAttribute("aria-label") === "mat")!,
    );
    await user.click(
      screen.getByRole("button", { name: /Claim my treasure/i }),
    );

    const completion = screen.getByText(/Chapter complete/i);
    expect(completion).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /See my garden grow/i }),
    );
    expect(onComplete).toHaveBeenCalled();
  });

  it("resets the hint ladder between activities", async () => {
    const user = userEvent.setup();
    renderSession(adventureOf(letterActivity(), blendActivity()));

    const hintButton = screen.getByRole("button", { name: /hint/i });
    for (let rung = 0; rung < 4; rung += 1) {
      await user.click(hintButton);
    }
    expect(answerCards()).toHaveLength(2);

    await user.click(
      answerCards().find((card) => card.getAttribute("aria-label") === "m")!,
    );
    await user.click(screen.getByRole("button", { name: /Next stop/i }));

    // The next item starts from rung zero with every choice available.
    expect(answerCards()).toHaveLength(3);
    expect(
      within(screen.getByRole("button", { name: /hint/i })).queryByText(
        /Hear the hint again/i,
      ),
    ).not.toBeInTheDocument();
  });
});
