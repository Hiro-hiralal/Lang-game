"use client";

import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  LockKeyhole,
  Sparkles,
  Star,
} from "lucide-react";
import { ZONES } from "@/lib/game-data";
import { adventuresForRegion } from "@/lib/world-data";
import type { PlayerProgress, ZoneId } from "@/lib/game-types";

interface RegionScreenProps {
  regionId: ZoneId;
  progress: PlayerProgress;
  onBack: () => void;
  onPlay: (adventureId: string) => void;
}

export function RegionScreen({
  regionId,
  progress,
  onBack,
  onPlay,
}: RegionScreenProps) {
  const zone = ZONES.find((item) => item.id === regionId) ?? ZONES[0];
  const regionIndex = ZONES.findIndex((item) => item.id === regionId);
  const adventures = adventuresForRegion(regionId);

  return (
    <main
      className="region-screen"
      style={
        {
          "--zone-color": zone.color,
          "--zone-glow": zone.glow,
          "--region-position": `${regionIndex * 25}%`,
        } as React.CSSProperties
      }
    >
      <section className="region-hero">
        <div className="region-hero__art" />
        <div className="region-hero__veil" />
        <button className="back-button region-hero__back" onClick={onBack}>
          <ArrowLeft /> Back to world
        </button>
        <div className="region-hero__copy">
          <span>{zone.eyebrow}</span>
          <h1>{zone.name}</h1>
          <p>{zone.description}</p>
        </div>
      </section>

      <section className="region-path">
        <div className="region-path__heading">
          <div>
            <span>Four-chapter journey</span>
            <h2>Choose an adventure</h2>
          </div>
          <p>Each chapter unlocks the next and adds a treasure to your book.</p>
        </div>

        <div className="adventure-list">
          {adventures.map((adventure, index) => {
            const previous = adventures[index - 1];
            const unlocked =
              index === 0 ||
              progress.completedAdventureIds.includes(previous.id);
            const completed = progress.completedAdventureIds.includes(adventure.id);
            return (
              <motion.article
                className={`adventure-card ${!unlocked ? "adventure-card--locked" : ""}`}
                key={adventure.id}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <div className="adventure-card__chapter">
                  {completed ? <Check /> : unlocked ? adventure.chapter : <LockKeyhole />}
                </div>
                <div className="adventure-card__copy">
                  <span>Chapter {adventure.chapter}</span>
                  <h3>{adventure.title}</h3>
                  <p>{adventure.description}</p>
                  <div>
                    <small><Clock3 /> {adventure.minutes} min</small>
                    <small>{Array.from({ length: adventure.difficulty }).map((_, star) => <Star key={star} fill="currentColor" />)}</small>
                    <small><Sparkles /> {adventure.rewardName}</small>
                  </div>
                </div>
                <button
                  className={completed ? "adventure-card__replay" : "primary-button"}
                  onClick={() => onPlay(adventure.id)}
                  disabled={!unlocked}
                >
                  {completed ? "Play again" : unlocked ? "Begin" : "Locked"}
                  {unlocked && <ArrowRight />}
                </button>
              </motion.article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
