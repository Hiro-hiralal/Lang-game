"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CollectionBook } from "@/components/collection-book";
import { EpisodePlayer } from "@/components/episode/episode-player";
import { GardenMap } from "@/components/garden-map";
import { GameSession } from "@/components/game-session";
import { MyGarden } from "@/components/my-garden";
import { ParentDashboard } from "@/components/parent-dashboard";
import { RegionScreen } from "@/components/region-screen";
import { StoryLibrary } from "@/components/story-library";
import { TopBar } from "@/components/top-bar";
import { WelcomeScreen } from "@/components/welcome-screen";
import { useLearningRecord } from "@/hooks/use-learning-record";
import { useNarrator } from "@/hooks/use-narrator";
import {
  nextStreak,
  usePersistentProgress,
} from "@/hooks/use-persistent-progress";
import { useSoundscape } from "@/hooks/use-soundscape";
import { getEpisodeForAdventure } from "@/lib/episodes/moon-mouse";
import { pickDailyAdventure } from "@/lib/learning/composer";
import { buildDashboardStats } from "@/lib/learning/dashboard";
import { ADVENTURES, getAdventure } from "@/lib/world-data";
import type {
  Adventure,
  LibraryStory,
  Screen,
  ZoneId,
} from "@/lib/game-types";

export function StorySproutsApp() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [selectedRegion, setSelectedRegion] =
    useState<ZoneId>("sound-safari");
  const [activeAdventure, setActiveAdventure] = useState<Adventure>(
    ADVENTURES[0],
  );
  const [worldToast, setWorldToast] = useState<string | null>(null);
  const { progress, updateProgress, resetProgress } = usePersistentProgress();
  const learning = useLearningRecord();
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

  const startAdventure = (adventureId: string) => {
    const adventure = getAdventure(adventureId) ?? ADVENTURES[0];
    setActiveAdventure(adventure);
    setSelectedRegion(adventure.regionId);
    setWorldToast(null);
    soundscape.start();
    learning.beginSession(adventure.id);

    // Some chapters are full episodes, which open on their own story beat
    // rather than straight into a question.
    if (getEpisodeForAdventure(adventure.id)) {
      navigate("episode");
      return;
    }

    navigate("session");
    const first = adventure.activities[0];
    narrator.speak(first.voice.prompt, first.bubble.prompt);
  };

  const leaveAdventure = () => {
    learning.finishSession(false);
    navigate("region");
  };

  const completeAdventure = (rewardPlantId?: string) => {
    const alreadyCompleted = progress.completedAdventureIds.includes(
      activeAdventure.id,
    );
    learning.finishSession(true);
    updateProgress((current) => ({
      ...current,
      sessionsCompleted: current.sessionsCompleted + 1,
      streak: nextStreak(current.lastPlayed, current.streak, new Date()),
      seeds: current.seeds + 1,
      gardenLevel: Math.min(current.gardenLevel + (alreadyCompleted ? 0 : 1), 8),
      masteredWords: Array.from(
        new Set([
          ...current.masteredWords,
          ...activeAdventure.activities
            .filter((activity) => activity.kind === "blend" || activity.kind === "word")
            .map((activity) => {
              const correct = activity.options.find((option) => option.correct);
              return correct?.label.toLowerCase() ?? "";
            })
            .filter(Boolean),
        ]),
      ),
      completedAdventureIds: Array.from(
        new Set([...current.completedAdventureIds, activeAdventure.id]),
      ),
      unlockedStickerIds: Array.from(
        new Set([
          ...current.unlockedStickerIds,
          activeAdventure.rewardStickerId,
        ]),
      ),
      // An episode's reward plants itself: the seed the child was handed in
      // the story is in their garden when they get there, permanently.
      plantedSeedIds: rewardPlantId
        ? Array.from(new Set([...current.plantedSeedIds, rewardPlantId]))
        : current.plantedSeedIds,
      totalStars: current.totalStars + (alreadyCompleted ? 1 : 3),
      dailyQuestDate: new Date().toISOString().slice(0, 10),
      lastPlayed: new Date().toISOString(),
    }));
    setWorldToast(
      alreadyCompleted
        ? "Replay complete · one bonus star and a new seed!"
        : `${activeAdventure.rewardName} joined your treasure book!`,
    );
    navigate("garden");
  };

  const plantSeed = (plantId: string, cost: number) => {
    if (
      progress.plantedSeedIds.includes(plantId) ||
      progress.seeds < cost
    ) {
      return;
    }
    soundscape.play("correct");
    updateProgress((current) => ({
      ...current,
      seeds: current.seeds - cost,
      plantedSeedIds: [...current.plantedSeedIds, plantId],
    }));
  };

  const readStory = (story: LibraryStory) => {
    updateProgress((current) => ({
      ...current,
      readStoryIds: Array.from(new Set([...current.readStoryIds, story.id])),
    }));
    narrator.speak(story.narrationId, `${story.title}. ${story.lines.join(" ")}`);
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
      "Reset the whole reading world to its starting progress?",
    );
    if (!confirmed) return;
    resetProgress();
    learning.clearRecord();
    setWorldToast(null);
    navigate("welcome");
  };

  const openRegion = (regionId: ZoneId) => {
    setSelectedRegion(regionId);
    navigate("region");
  };

  // Today's quest comes from what this child has demonstrated, not from the
  // calendar.
  const dailyAdventure =
    pickDailyAdventure(
      ADVENTURES,
      progress.completedAdventureIds,
      learning.mastery,
      learning.evaluatedAt,
    ) ?? ADVENTURES[0];
  const episode = getEpisodeForAdventure(activeAdventure.id);

  return (
    <div className="app-shell">
      {screen !== "welcome" && screen !== "session" && screen !== "episode" && (
        <TopBar
          screen={screen}
          soundOn={progress.soundOn}
          seeds={progress.seeds}
          onNavigate={navigate}
          onToggleSound={toggleSound}
        />
      )}

      {worldToast && screen !== "session" && screen !== "episode" && (
        <div className="garden-toast" role="status">
          <span>✦</span>
          {worldToast}
        </div>
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
              onStart={() => startAdventure(dailyAdventure.id)}
              onExplore={() => navigate("map")}
              onHearWelcome={() =>
                narrator.speak(
                  "welcome",
                  "Oh! There you are, story explorer! Five magical regions are waiting. Ready to make words bloom?",
                )
              }
              isSpeaking={narrator.isSpeaking}
            />
          )}

          {screen === "map" && (
            <GardenMap
              progress={progress}
              dailyAdventure={dailyAdventure}
              onStart={startAdventure}
              onOpenRegion={openRegion}
              onOpenGarden={() => navigate("garden")}
              onOpenStories={() => navigate("stories")}
              onOpenCollection={() => navigate("collection")}
              onSpeak={() =>
                narrator.speak(
                  "map",
                  "Every landmark is ready to explore. Finish a chapter to reveal the next path and earn a magical treasure.",
                )
              }
              isSpeaking={narrator.isSpeaking}
            />
          )}

          {screen === "region" && (
            <RegionScreen
              regionId={selectedRegion}
              progress={progress}
              onBack={() => navigate("map")}
              onPlay={startAdventure}
            />
          )}

          {screen === "session" && (
            <GameSession
              childName={progress.childName}
              adventure={activeAdventure}
              reducedMotion={progress.reducedMotion}
              narrator={narrator}
              playSound={soundscape.play}
              onExit={leaveAdventure}
              onComplete={completeAdventure}
              onAttempt={learning.recordAttempt}
            />
          )}

          {screen === "episode" && episode && (
            <EpisodePlayer
              episode={episode}
              reducedMotion={progress.reducedMotion}
              narrator={narrator}
              playSound={soundscape.play}
              onExit={leaveAdventure}
              onComplete={completeAdventure}
              onAttempt={learning.recordAttempt}
            />
          )}

          {screen === "garden" && (
            <MyGarden
              seeds={progress.seeds}
              plantedSeedIds={progress.plantedSeedIds}
              onBack={() => navigate("map")}
              onPlant={plantSeed}
            />
          )}

          {screen === "stories" && (
            <StoryLibrary
              completedAdventureIds={progress.completedAdventureIds}
              readStoryIds={progress.readStoryIds}
              onBack={() => navigate("map")}
              onRead={readStory}
            />
          )}

          {screen === "collection" && (
            <CollectionBook
              unlockedStickerIds={progress.unlockedStickerIds}
              onBack={() => navigate("map")}
            />
          )}

          {screen === "grownup" && (
            <ParentDashboard
              progress={progress}
              stats={buildDashboardStats(
                learning.attempts,
                learning.sessions,
                learning.mastery,
                learning.evaluatedAt,
              )}
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
