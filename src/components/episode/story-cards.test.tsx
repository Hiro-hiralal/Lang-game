import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StoryCards } from "@/components/episode/story-cards";
import type { StoryCard } from "@/lib/episodes/types";

const cards: StoryCard[] = [
  {
    id: "one",
    text: "First card",
    voiceId: "voice-one",
    cast: ["🌱"],
    sky: "linear-gradient(#fff, #eee)",
  },
  {
    id: "two",
    text: "Second card",
    voiceId: "voice-two",
    cast: ["🐭"],
    sky: "linear-gradient(#eee, #ddd)",
  },
  {
    id: "three",
    text: "Third card",
    voiceId: "voice-three",
    cast: ["✨"],
    sky: "linear-gradient(#ddd, #ccc)",
  },
];

describe("StoryCards", () => {
  it("advances exactly one card when the Next button is tapped", async () => {
    const user = userEvent.setup();
    render(
      <StoryCards
        cards={cards}
        reducedMotion
        speak={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Second card")).toBeInTheDocument();
    expect(screen.queryByText("Third card")).not.toBeInTheDocument();
  });

  it("calls the finale action exactly once when Skip is tapped", async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(
      <StoryCards
        cards={cards}
        reducedMotion
        speak={vi.fn()}
        onDone={onDone}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Skip the story" }));

    expect(onDone).toHaveBeenCalledOnce();
  });
});
