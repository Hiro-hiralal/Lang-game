"use client";

import Image from "next/image";
import { motion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Flower2,
  Library,
  MapPin,
  Sparkles,
} from "lucide-react";
import { PipGuide } from "@/components/pip-guide";
import { ZONES } from "@/lib/game-data";
import { ADVENTURES } from "@/lib/world-data";
import { adventuresForRegion } from "@/lib/world-data";
import type { Adventure, PlayerProgress, ZoneId } from "@/lib/game-types";

interface GardenMapProps {
  progress: PlayerProgress;
  /** Chosen by the session composer from this child's mastery, not the date. */
  dailyAdventure: Adventure;
  onStart: (adventureId: string) => void;
  onOpenRegion: (regionId: ZoneId) => void;
  onOpenGarden: () => void;
  onOpenStories: () => void;
  onOpenCollection: () => void;
  onSpeak: () => void;
  isSpeaking: boolean;
}

export function GardenMap({
  progress,
  dailyAdventure,
  onStart,
  onOpenRegion,
  onOpenGarden,
  onOpenStories,
  onOpenCollection,
  onSpeak,
  isSpeaking,
}: GardenMapProps) {
  const totalAdventures = ADVENTURES.length;
  const storiesUnlocked = progress.completedAdventureIds.filter((id) =>
    ["moon-mouse", "rhyme-river", "sam-and-cat", "red-hat", "moon-picnic", "sun-sail", "frog-ferry", "word-sprouts", "vowel-vines", "echo-festival"].includes(id),
  ).length;

  return (
    <main className="world-map">
      <section className="world-map__hero">
        <Image
          src="/art/story-world.webp"
          alt="The Story Sprouts world, with Echo Meadow, Lantern Grove, Blend Brook, Word Garden and Story Theater"
          fill
          priority
          sizes="100vw"
        />
        <div className="world-map__hero-shade" />
        <div className="world-map__hero-copy">
          <p>
            <MapPin aria-hidden="true" />
            {progress.childName}’s reading world
          </p>
          <h1>Five magical regions. Twenty adventures. One growing reader.</h1>
          <div className="world-map__stats">
            <span><strong>{progress.completedAdventureIds.length}</strong> / {totalAdventures} quests</span>
            <span><strong>{progress.totalStars}</strong> stars</span>
            <span><strong>{progress.unlockedStickerIds.length}</strong> treasures</span>
          </div>
        </div>
      </section>

      <section className="world-map__body">
        <div className="world-map__dashboard">
          <motion.article
            className="daily-quest"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="daily-quest__top">
              <span><Sparkles /> Pip’s daily quest</span>
              <small><Clock3 /> {dailyAdventure.minutes} min</small>
            </div>
            <p>Chapter {dailyAdventure.chapter} · {ZONES.find((zone) => zone.id === dailyAdventure.regionId)?.name}</p>
            <h2>{dailyAdventure.title}</h2>
            <p>{dailyAdventure.description}</p>
            <button className="primary-button" onClick={() => onStart(dailyAdventure.id)}>
              Start quest <ArrowRight />
            </button>
          </motion.article>

          <PipGuide
            message="Every landmark is open to explore. Finish a chapter to reveal the next path, earn a treasure and unlock stories."
            onSpeak={onSpeak}
            isSpeaking={isSpeaking}
            compact
          />
        </div>

        <div className="world-shortcuts" aria-label="World collections">
          <button onClick={onOpenGarden}>
            <span className="world-shortcuts__icon world-shortcuts__icon--garden"><Flower2 /></span>
            <div><strong>My living garden</strong><small>{progress.plantedSeedIds.length} of 8 plants growing</small></div>
            <ArrowRight />
          </button>
          <button onClick={onOpenStories}>
            <span className="world-shortcuts__icon world-shortcuts__icon--stories"><BookOpen /></span>
            <div><strong>Story library</strong><small>{storiesUnlocked} of 10 tales unlocked</small></div>
            <ArrowRight />
          </button>
          <button onClick={onOpenCollection}>
            <span className="world-shortcuts__icon world-shortcuts__icon--treasure"><Library /></span>
            <div><strong>Treasure book</strong><small>{progress.unlockedStickerIds.length} of 20 collected</small></div>
            <ArrowRight />
          </button>
        </div>

        <div className="world-heading">
          <div>
            <span>Choose your path</span>
            <h2>Explore the five regions</h2>
          </div>
          <p>Each region contains four real adventures with a new treasure at the end.</p>
        </div>

        <div className="world-region-grid">
          {ZONES.map((zone, index) => {
            const regionAdventures = adventuresForRegion(zone.id);
            const completed = regionAdventures.filter((adventure) =>
              progress.completedAdventureIds.includes(adventure.id),
            ).length;
            return (
              <motion.button
                className="world-region-card"
                key={zone.id}
                onClick={() => onOpenRegion(zone.id)}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
                style={
                  {
                    "--zone-color": zone.color,
                    "--zone-glow": zone.glow,
                    "--region-position": `${index * 25}%`,
                  } as React.CSSProperties
                }
              >
                <span className="world-region-card__art" aria-hidden="true" />
                <span className="world-region-card__number">{index + 1}</span>
                <span className="world-region-card__copy">
                  <small>{zone.eyebrow}</small>
                  <strong>{zone.name}</strong>
                  <span>{zone.description}</span>
                </span>
                <span className="world-region-card__progress">
                  {completed === 4 ? <Check /> : <Sparkles />}
                  {completed} of 4 complete
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
