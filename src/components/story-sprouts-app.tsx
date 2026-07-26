"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { GardenMap } from "@/components/garden-map";
import { GameSession } from "@/components/game-session";
import { ParentDashboard } from "@/components/parent-dashboard";
import { TopBar } from "@/components/top-bar";
import { WelcomeScreen } from "@/components/welcome-screen";
import { useNarrator } from "@/hooks/use-narrator";
import { usePersistentProgress } from "@/hooks/use-persistent-progress";
import { useSoundscape } from "@/hooks/use-soundscape";
import { ACTIVITIES } from "@/lib/game-data";
import type { Screen } from "@/lib/game-types";

export function StorySproutsApp() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [gardenGrew, setGardenGrew] = useState(false);
  const { progress, updateProgress, resetProgress } = usePersistentProgress();
  const narrator = useNarrator(progress.soundOn);
  const soundscape = useSoundscape(progress.soundOn);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "reduce-motion",
      progress.reducedMotion,
    );
    return () => document.documentElement.classList.remove("reduce-motion");
  }, [progress.reducedMotion]);

  const navigate = (next: Screen) => {
    narrator.stop();
    setScreen(next);
  };

  const startAdventure = () => {
    setGardenGrew(false);
    soundscape.start();
    navigate("session");
    narrator.speak(
      ACTIVITIES[0].voice.prompt,
      "First, a listening game. Which picture rhymes with star: car, moon, or fish?",
    );
  };

  const completeAdventure = () => {
    updateProgress((current) => ({
      ...current,
      sessionsCompleted: current.sessionsCompleted + 1,
      seeds: current.seeds + 1,
      gardenLevel: Math.min(current.gardenLevel + 1, 5),
      masteredWords: Array.from(new Set([...current.masteredWords, "sit"])),
      lastPlayed: new Date().toISOString(),
    }));
    setGardenGrew(true);
    navigate("map");
  };

  const toggleSound = () => {
    if (progress.soundOn) {
      narrator.stop();
      soundscape.stop();
    } else {
      soundscape.start(true);
    }
    updateProgress((current) => ({ ...current, soundOn: !current.soundOn }));
  };

  const toggleReducedMotion = () => {
    updateProgress((current) => ({
      ...current,
      reducedMotion: !current.reducedMotion,
    }));
  };

  const resetShowcase = () => {
    const confirmed = window.confirm(
      "Reset the showcase garden to its polished starting point?",
    );
    if (!confirmed) return;
    resetProgress();
    navigate("welcome");
  };

  return (
    <div className="app-shell">
      {screen !== "welcome" && screen !== "session" && (
        <TopBar
          screen={screen}
          soundOn={progress.soundOn}
          seeds={progress.seeds}
          onNavigate={navigate}
          onToggleSound={toggleSound}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          className="screen-stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: progress.reducedMotion ? 0 : 0.28 }}
        >
          {screen === "welcome" && (
            <WelcomeScreen
              childName={progress.childName}
              sessionsCompleted={progress.sessionsCompleted}
              soundOn={progress.soundOn}
              onStart={startAdventure}
              onExplore={() => navigate("map")}
              onHearWelcome={() =>
                narrator.speak(
                  "welcome",
                  "Oh! There you are, story explorer! I found a path with silly sounds, glowing letters, and one tiny story. Ready to make words bloom?",
                )
              }
              isSpeaking={narrator.isSpeaking}
            />
          )}

          {screen === "map" && (
            <>
              {gardenGrew && (
                <div className="garden-toast" role="status">
                  <span>✦</span>
                  A moonflower seed joined your garden!
                </div>
              )}
              <GardenMap
                childName={progress.childName}
                seeds={progress.seeds}
                sessionsCompleted={progress.sessionsCompleted}
                onStart={startAdventure}
                onSpeak={() =>
                  narrator.speak(
                    "map",
                    "I picked a path with sounds you know and one new word-growing trick. We will do it together!",
                  )
                }
              />
            </>
          )}

          {screen === "session" && (
            <GameSession
              childName={progress.childName}
              reducedMotion={progress.reducedMotion}
              narrator={narrator}
              playSound={soundscape.play}
              onExit={() => navigate("map")}
              onComplete={completeAdventure}
            />
          )}

          {screen === "grownup" && (
            <ParentDashboard
              progress={progress}
              onBack={() => navigate("map")}
              onToggleSound={toggleSound}
              onToggleReducedMotion={toggleReducedMotion}
              onReset={resetShowcase}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
