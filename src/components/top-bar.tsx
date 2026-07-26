"use client";

import { BarChart3, Home, Settings2, Volume2, VolumeX } from "lucide-react";
import { StoryLogo } from "@/components/story-logo";
import type { Screen } from "@/lib/game-types";

interface TopBarProps {
  screen: Screen;
  soundOn: boolean;
  seeds: number;
  onNavigate: (screen: Screen) => void;
  onToggleSound: () => void;
}

export function TopBar({
  screen,
  soundOn,
  seeds,
  onNavigate,
  onToggleSound,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <button
        className="top-bar__brand"
        onClick={() => onNavigate("welcome")}
        aria-label="Go to the Story Sprouts welcome screen"
      >
        <StoryLogo compact />
      </button>

      <nav className="top-bar__actions" aria-label="Game controls">
        {screen !== "welcome" && (
          <button
            className="icon-button"
            onClick={() => onNavigate("map")}
            aria-label="Garden map"
            title="Garden map"
          >
            <Home />
          </button>
        )}
        <div className="seed-pill" aria-label={`${seeds} glowing seeds`}>
          <span aria-hidden="true">✦</span>
          <strong>{seeds}</strong>
        </div>
        <button
          className="icon-button"
          onClick={onToggleSound}
          aria-label={soundOn ? "Turn voice and music off" : "Turn voice and music on"}
          title={soundOn ? "Voice and music on" : "Voice and music off"}
        >
          {soundOn ? <Volume2 /> : <VolumeX />}
        </button>
        <button
          className="icon-button top-bar__grownup"
          onClick={() => onNavigate("grownup")}
          aria-label="Open grown-up garden"
          title="Grown-up garden"
        >
          {screen === "grownup" ? <Settings2 /> : <BarChart3 />}
        </button>
      </nav>
    </header>
  );
}
