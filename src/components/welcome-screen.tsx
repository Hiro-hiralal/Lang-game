"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight, Play, Sparkles, Volume2 } from "lucide-react";
import { StoryLogo } from "@/components/story-logo";

interface WelcomeScreenProps {
  /** Pip's own line for this arrival: notices absence and recent mastery. */
  greeting: string;
  sessionsCompleted: number;
  soundOn: boolean;
  isSpeaking: boolean;
  onStart: () => void;
  onExplore: () => void;
  onHearWelcome: () => void;
}

export function WelcomeScreen({
  greeting,
  sessionsCompleted,
  soundOn,
  isSpeaking,
  onStart,
  onExplore,
  onHearWelcome,
}: WelcomeScreenProps) {
  return (
    <main className="welcome-screen">
      <Image
        className="welcome-screen__art"
        src="/art/story-garden.webp"
        alt=""
        fill
        priority
        sizes="100vw"
      />
      <div className="welcome-screen__veil" />
      <motion.div
        className="welcome-firefly welcome-firefly--one"
        aria-hidden="true"
        animate={{ x: [0, 25, -5, 0], y: [0, -18, 7, 0], opacity: [0.5, 1, 0.7, 0.5] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="welcome-firefly welcome-firefly--two"
        aria-hidden="true"
        animate={{ x: [0, -20, 8, 0], y: [0, 10, -15, 0], opacity: [0.4, 0.9, 0.6, 0.4] }}
        transition={{ duration: 7.5, repeat: Infinity, delay: 1 }}
      />

      <section className="welcome-screen__content">
        <motion.div
          className="welcome-screen__card"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        >
          <StoryLogo />
          <p className="welcome-screen__eyebrow">
            <Sparkles aria-hidden="true" />
            A little reading adventure
          </p>
          <h1>
            Ready to make
            <span> words bloom?</span>
          </h1>
          <p className="welcome-screen__intro">
            Explore five magical regions, complete reading quests, grow a
            living garden and fill your treasure book with Pip.
          </p>

          <div className="welcome-screen__profile">
            <div className="welcome-screen__avatar">
              <Image
                src="/art/pip-fox.webp"
                alt=""
                fill
                sizes="68px"
              />
            </div>
            <div>
              <span>{greeting}</span>
              <small>
                {sessionsCompleted === 0
                  ? "Your very first adventure is ready"
                  : `${sessionsCompleted} adventures complete · Pip saved your place`}
              </small>
            </div>
            {soundOn && (
              <button
                className={`icon-button icon-button--warm ${isSpeaking ? "is-speaking" : ""}`}
                onClick={onHearWelcome}
                aria-label="Hear the welcome message"
              >
                <Volume2 />
              </button>
            )}
          </div>

          <div className="welcome-screen__buttons">
            <button className="primary-button primary-button--hero" onClick={onStart}>
              <span className="primary-button__icon">
                <Play fill="currentColor" />
              </span>
              Start today’s adventure
              <ArrowRight />
            </button>
            <button className="text-button" onClick={onExplore}>
              Explore my world
              <ArrowRight />
            </button>
          </div>

          <p className="welcome-screen__grownup-note">
            Grown-ups: Pip uses an expressive AI voice with gentle garden
            music. No microphone or sign-in is needed.
          </p>
        </motion.div>
      </section>
    </main>
  );
}
