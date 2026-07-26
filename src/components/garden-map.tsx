"use client";

import Image from "next/image";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Clock3,
  LockKeyhole,
  MapPin,
  Sparkles,
} from "lucide-react";
import { PipGuide } from "@/components/pip-guide";
import { ZONES } from "@/lib/game-data";

interface GardenMapProps {
  childName: string;
  seeds: number;
  sessionsCompleted: number;
  onStart: () => void;
  onSpeak: () => void;
}

export function GardenMap({
  childName,
  seeds,
  sessionsCompleted,
  onStart,
  onSpeak,
}: GardenMapProps) {
  return (
    <main className="garden-map">
      <div className="garden-map__hero">
        <Image
          src="/art/story-garden.webp"
          alt="A magical reading garden with lanterns, flowers, a bridge and a story stage"
          fill
          priority
          sizes="100vw"
        />
        <div className="garden-map__hero-shade" />
        <div className="garden-map__hero-copy">
          <p>
            <MapPin aria-hidden="true" />
            {childName}’s reading garden
          </p>
          <h1>Every brave try helps the garden grow.</h1>
          <div className="garden-map__stats">
            <span>
              <strong>{seeds}</strong> glowing seeds
            </span>
            <span>
              <strong>{sessionsCompleted}</strong> adventures
            </span>
          </div>
        </div>
      </div>

      <section className="garden-map__content">
        <div className="today-card">
          <div className="today-card__meta">
            <span className="today-card__badge">
              <Sparkles />
              Today’s path
            </span>
            <span>
              <Clock3 />
              5–7 min
            </span>
          </div>
          <h2>From silly sounds to a tiny story</h2>
          <p>
            Five playful stops, chosen to mix confident wins with one fresh
            reading stretch.
          </p>
          <button className="primary-button" onClick={onStart}>
            Go with Pip
            <ArrowRight />
          </button>
        </div>

        <PipGuide
          message="I picked a path with sounds you know and one new word-growing trick. We’ll do it together!"
          onSpeak={onSpeak}
          compact
        />

        <div className="zone-heading">
          <div>
            <span>Your world</span>
            <h2>Five places to grow</h2>
          </div>
          <p>Complete today’s path to earn a new moonflower seed.</p>
        </div>

        <div className="zone-grid">
          {ZONES.map((zone, index) => {
            const unlocked = seeds >= zone.requiredSeeds;
            const completed = index < Math.min(sessionsCompleted, 3);
            return (
              <motion.article
                className={`zone-card ${unlocked ? "" : "zone-card--locked"}`}
                key={zone.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                style={
                  {
                    "--zone-color": zone.color,
                    "--zone-glow": zone.glow,
                  } as React.CSSProperties
                }
              >
                <div className="zone-card__number">{index + 1}</div>
                <div className="zone-card__icon" aria-hidden="true">
                  {zone.icon}
                </div>
                <div className="zone-card__copy">
                  <span>{zone.eyebrow}</span>
                  <h3>{zone.name}</h3>
                  <p>{zone.description}</p>
                </div>
                <div className="zone-card__status">
                  {completed ? (
                    <>
                      <Check />
                      Visited
                    </>
                  ) : unlocked ? (
                    <>
                      <span className="zone-card__dot" />
                      Ready
                    </>
                  ) : (
                    <>
                      <LockKeyhole />
                      {zone.requiredSeeds - seeds} more seed
                      {zone.requiredSeeds - seeds === 1 ? "" : "s"}
                    </>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
