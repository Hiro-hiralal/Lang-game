import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EpisodePlayer } from "@/components/episode/episode-player";
import type { AttemptInput } from "@/hooks/use-learning-record";
import type { Narrator } from "@/hooks/use-narrator";
import {
  MOON_MOUSE_EPISODE,
  episodeActivities,
} from "@/lib/episodes/moon-mouse";
import { manipulationShare } from "@/lib/activity-types";
import { TAUGHT_GRAPHEMES } from "@/lib/learning/skills";

function narrator(): Narrator {
  return {
    speak: vi.fn(),
    stop: vi.fn(),
    preload: vi.fn(),
    isSpeaking: false,
    voiceMode: "ai",
  };
}

interface Harness {
  attempts: AttemptInput[];
  completedWith: string[];
}

function renderEpisode(): Harness {
  const attempts: AttemptInput[] = [];
  const completedWith: string[] = [];

  render(
    <EpisodePlayer
      episode={MOON_MOUSE_EPISODE}
      reducedMotion
      narrator={narrator()}
      playSound={vi.fn()}
      onExit={vi.fn()}
      onComplete={(plantId) => completedWith.push(plantId)}
      onAttempt={(attempt) => attempts.push(attempt)}
    />,
  );

  return { attempts, completedWith };
}

describe("Moon Mouse episode content", () => {
  it("is mostly manipulation rather than picking from a list", () => {
    const activities = episodeActivities(MOON_MOUSE_EPISODE);
    expect(activities.length).toBeGreaterThan(0);
    // The whole point of the episode: the child produces answers.
    expect(manipulationShare(activities)).toBe(1);
  });

  it("uses a different system for every scored beat", () => {
    const interactions = episodeActivities(MOON_MOUSE_EPISODE).map(
      (activity) => activity.interaction,
    );
    expect(new Set(interactions).size).toBe(interactions.length);
  });

  it("teaches the letter the story is about", () => {
    const skills = episodeActivities(MOON_MOUSE_EPISODE).map(
      (activity) => activity.skillId,
    );
    expect(skills).toContain("ls-m");
    expect(skills).toContain("connected-text");
  });

  it("keeps the closing story to taught letters plus heart words", () => {
    const beat = MOON_MOUSE_EPISODE.beats.find(
      (entry) => entry.kind === "activity" && entry.activity.readAlong,
    );
    const lines =
      beat?.kind === "activity" ? (beat.activity.readAlong?.lines ?? []) : [];
    expect(lines.length).toBeGreaterThan(0);

    const heartWords = ["the", "has", "is", "a"];
    const proper = ["mo"];

    for (const word of lines.join(" ").toLowerCase().split(/[^a-z]+/)) {
      if (!word || heartWords.includes(word) || proper.includes(word)) continue;
      for (const letter of word) {
        expect(TAUGHT_GRAPHEMES).toContain(letter);
      }
    }
  });
});

describe("playing the episode through", () => {
  it("opens on the story, not on a question", () => {
    renderEpisode();
    expect(
      screen.getByText(/one lantern keeps Lantern Grove glowing/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Skip the story/i }),
    ).toBeInTheDocument();
  });

  it("runs from the opening to the reward, scoring every activity beat", async () => {
    const user = userEvent.setup();
    const { attempts, completedWith } = renderEpisode();

    // The opening is skippable, as every animation must be.
    await user.click(screen.getByRole("button", { name: /Skip the story/i }));

    // Explore: tap around the dark grove until the story can move on.
    const objects = screen
      .getAllByRole("button")
      .filter((button) =>
        button.className.includes("explore-scene__object"),
      );
    for (const object of objects.slice(0, 4)) {
      await user.click(object);
    }
    await user.click(screen.getByRole("button", { name: /Go and find Mo/i }));

    // Beat 3: sort the mmmmm words into Mo's basket.
    for (const word of ["moon", "moss", "mushroom"]) {
      await user.click(screen.getByRole("button", { name: word }));
      await user.click(
        screen.getByRole("button", { name: /Basket: Mo’s mmmmm basket/i }),
      );
    }
    for (const word of ["sun", "bell"]) {
      await user.click(screen.getByRole("button", { name: word }));
      await user.click(
        screen.getByRole("button", { name: /Basket: Leave it here/i }),
      );
    }
    await user.click(screen.getByRole("button", { name: /What happens next/i }));

    // Beat 4: build "map" from the sound orbs.
    for (const [slot, letter] of [["1", "m"], ["2", "a"], ["3", "p"]]) {
      await user.click(screen.getByRole("button", { name: `Letter ${letter}` }));
      await user.click(screen.getByRole("button", { name: `Empty slot ${slot}` }));
    }
    await user.click(screen.getByRole("button", { name: /What happens next/i }));

    // Beat 5: trace the m. Tracing is never a gate, so accepting is enough.
    await user.click(screen.getByRole("button", { name: /I traced it/i }));
    await user.click(screen.getByRole("button", { name: /What happens next/i }));

    // Beat 6: read the closing story. Playback is offered, but a child who
    // reads it themselves by tapping through gets to the end just the same.
    expect(screen.getByRole("button", { name: /Read with me/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hear the word sad" }));
    await user.click(
      screen.getByRole("button", { name: /I read the whole thing/i }),
    );
    await user.click(screen.getByRole("button", { name: /What happens next/i }));

    // Finale: the seed plants itself in the garden.
    await user.click(
      screen.getByRole("button", { name: /Straight to my garden/i }),
    );

    expect(completedWith).toEqual(["lantern-seed"]);

    const scored = attempts.filter((attempt) => attempt.correct);
    expect(scored.map((attempt) => attempt.skillId)).toEqual([
      "first-sound",
      "build-cvc",
      "ls-m",
      "connected-text",
    ]);
    // Not one of them was answered by tapping a card.
    expect(scored.every((attempt) => attempt.mode !== "tap")).toBe(true);
  }, 20000);

  it("holds the story back until enough of the grove is explored", async () => {
    const user = userEvent.setup();
    renderEpisode();
    await user.click(screen.getByRole("button", { name: /Skip the story/i }));

    expect(screen.getByRole("button", { name: /Go and find Mo/i })).toBeDisabled();

    const objects = screen
      .getAllByRole("button")
      .filter((button) => button.className.includes("explore-scene__object"));
    for (const object of objects.slice(0, 4)) {
      await user.click(object);
    }

    expect(
      screen.getByRole("button", { name: /Go and find Mo/i }),
    ).not.toBeDisabled();
  });
});
