"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  HelpCircle,
  Home,
  Lightbulb,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { PipGuide } from "@/components/pip-guide";
import type { Narrator } from "@/hooks/use-narrator";
import { ZONES } from "@/lib/game-data";
import type { Activity, Adventure, AnswerOption } from "@/lib/game-types";

interface GameSessionProps {
  childName: string;
  adventure: Adventure;
  reducedMotion: boolean;
  narrator: Narrator;
  playSound: (effect: "tap" | "correct" | "try-again" | "hint" | "complete") => void;
  onExit: () => void;
  onComplete: () => void;
}

export function GameSession({
  childName,
  adventure,
  reducedMotion,
  narrator,
  playSound,
  onExit,
  onComplete,
}: GameSessionProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "try-again" | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [hintLevel, setHintLevel] = useState(0);
  const [completed, setCompleted] = useState(false);
  const retryTimer = useRef<number | null>(null);
  const { speak, stop, preload, isSpeaking } = narrator;
  const activities = adventure.activities;
  const activity = activities[index];
  const zone = ZONES.find((item) => item.id === activity.id) ?? ZONES[0];
  const percent = ((index + (feedback === "correct" ? 1 : 0)) / activities.length) * 100;

  useEffect(() => {
    const next = activities[index + 1];
    if (next) preload(next.voice.prompt);
  }, [activities, index, preload]);

  useEffect(
    () => () => {
      stop();
      if (retryTimer.current) window.clearTimeout(retryTimer.current);
    },
    [stop],
  );

  const chooseAnswer = (option: AnswerOption) => {
    if (feedback === "correct" || eliminated.includes(option.id)) return;
    setSelected(option.id);
    playSound("tap");

    if (option.correct) {
      setFeedback("correct");
      setFeedbackMessage(activity.bubble.correct);
      playSound("correct");
      speak(activity.voice.correct, activity.celebration);
      if (!reducedMotion) {
        void confetti({
          particleCount: 58,
          spread: 68,
          origin: { y: 0.72 },
          colors: ["#F3B658", "#E8836D", "#78AE68", "#67AFC0", "#9B86C4"],
          scalar: 0.85,
          ticks: 140,
        });
      }
    } else {
      setFeedback("try-again");
      const nextHint = Math.min(hintLevel + 1, 2);
      const message =
        activity.bubble.wrong[option.id] ?? activity.bubble.hints[nextHint - 1];
      const voiceLine =
        activity.voice.wrong[option.id] ?? activity.voice.hints[nextHint - 1];
      setHintLevel(nextHint);
      setFeedbackMessage(message);
      setEliminated((current) => [...current, option.id]);
      playSound("try-again");
      speak(voiceLine, message);
      retryTimer.current = window.setTimeout(() => {
        setSelected(null);
        setFeedback(null);
        setFeedbackMessage(null);
      }, 1650);
    }
  };

  const showHint = () => {
    const nextHint = Math.min(hintLevel + 1, 2);
    setHintLevel(nextHint);
    setFeedbackMessage(activity.bubble.hints[nextHint - 1]);
    playSound("hint");
    speak(activity.voice.hints[nextHint - 1], activity.bubble.hints[nextHint - 1]);
  };

  const continueSession = () => {
    if (retryTimer.current) window.clearTimeout(retryTimer.current);
    if (index === activities.length - 1) {
      setCompleted(true);
      playSound("complete");
      speak(
        "complete",
        "You did it! Chapter complete. You earned a magical treasure and a glowing garden seed. High five!",
      );
      return;
    }
    const nextIndex = index + 1;
    const nextActivity = activities[nextIndex];
    setIndex(nextIndex);
    setSelected(null);
    setFeedback(null);
    setFeedbackMessage(null);
    setEliminated([]);
    setHintLevel(0);
    playSound("tap");
    speak(nextActivity.voice.prompt, nextActivity.bubble.prompt);
  };

  if (completed) {
    return (
      <CompletionScreen
        childName={childName}
        adventure={adventure}
        reducedMotion={reducedMotion}
        onComplete={onComplete}
      />
    );
  }

  return (
    <main
      className="game-session"
      style={
        {
          "--zone-color": zone.color,
          "--zone-glow": zone.glow,
        } as React.CSSProperties
      }
    >
      <header className="session-header">
        <button className="session-close" onClick={onExit} aria-label="Leave adventure">
          <X />
        </button>
        <div className="session-progress">
          <div className="session-progress__label">
            <span>
              Challenge {index + 1} of {activities.length}
            </span>
            <strong>{activity.title}</strong>
          </div>
          <div className="session-progress__track">
            <motion.span animate={{ width: `${percent}%` }} />
          </div>
        </div>
        <button
          className={`session-speak ${isSpeaking ? "is-speaking" : ""}`}
          onClick={() => speak(activity.voice.prompt, activity.bubble.prompt)}
          aria-label={isSpeaking ? "Pip is speaking" : "Hear the instruction again"}
        >
          <Volume2 />
        </button>
      </header>

      <AnimatePresence mode="wait">
        <motion.section
          key={activity.key}
          className="activity-shell"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: reducedMotion ? 0 : 0.32 }}
        >
          <div className="activity-shell__top">
            <div>
              <span className="activity-eyebrow">{activity.eyebrow}</span>
              <h1>{activity.instruction}</h1>
            </div>
            <span className="skill-chip">
              <Sparkles />
              {activity.skill}
            </span>
          </div>

          <PipGuide
            message={
              feedbackMessage ??
              (feedback === "correct"
                ? activity.bubble.correct
                : hintLevel > 0
                  ? activity.bubble.hints[hintLevel - 1]
                  : activity.bubble.prompt)
            }
            mood={feedback === "correct" ? "celebrate" : hintLevel > 0 ? "thinking" : "hello"}
            onSpeak={() =>
              speak(
                feedback === "correct"
                  ? activity.voice.correct
                  : hintLevel > 0
                    ? activity.voice.hints[hintLevel - 1]
                    : activity.voice.prompt,
                feedback === "correct"
                  ? activity.celebration
                  : hintLevel > 0
                    ? activity.bubble.hints[hintLevel - 1]
                    : activity.bubble.prompt,
              )
            }
            compact
            isSpeaking={isSpeaking}
          />

          <ActivityVisual activity={activity} reducedMotion={reducedMotion} />

          <div className={`answer-grid answer-grid--${activity.kind}`}>
            {activity.options.map((option) => {
              const isSelected = selected === option.id;
              const isEliminated = eliminated.includes(option.id);
              const state =
                isSelected && feedback === "correct"
                  ? "correct"
                  : isSelected && feedback === "try-again"
                    ? "wrong"
                    : "";
              return (
                <motion.button
                  key={option.id}
                  className={`answer-card ${state ? `answer-card--${state}` : ""} ${isEliminated && !isSelected ? "answer-card--eliminated" : ""}`}
                  onClick={() => chooseAnswer(option)}
                  disabled={isEliminated}
                  whileHover={reducedMotion ? {} : { y: -4, scale: 1.015 }}
                  whileTap={{ scale: 0.97 }}
                  animate={
                    state === "wrong" && !reducedMotion
                      ? { x: [0, -8, 7, -4, 0] }
                      : {}
                  }
                  aria-label={option.spokenLabel}
                >
                  {option.icon && (
                    <span className="answer-card__icon" aria-hidden="true">
                      {option.icon}
                    </span>
                  )}
                  <strong>{option.label}</strong>
                  <span className="answer-card__state" aria-hidden="true">
                    {state === "correct" ? <Check /> : state === "wrong" ? <X /> : null}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <div className="activity-footer">
            <button className="hint-button" onClick={showHint}>
              {hintLevel > 0 ? <Lightbulb /> : <HelpCircle />}
              {hintLevel > 0 ? "Hear the hint again" : "I’d like a hint"}
            </button>
            <AnimatePresence>
              {feedback === "correct" && (
                <motion.button
                  className="primary-button"
                  onClick={continueSession}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {index === activities.length - 1 ? "Claim my treasure" : "Next stop"}
                  <ArrowRight />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </AnimatePresence>
    </main>
  );
}

interface ActivityVisualProps {
  activity: Activity;
  reducedMotion: boolean;
}

function ActivityVisual({ activity, reducedMotion }: ActivityVisualProps) {
  if (activity.kind === "rhyme" || activity.kind === "sound") {
    return (
      <div className="activity-visual sound-visual" aria-hidden="true">
        <motion.span
          className="sound-visual__star"
          animate={reducedMotion ? {} : { rotate: [0, 7, -5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          {activity.kind === "rhyme" ? "♪" : "✦"}
        </motion.span>
        <div>
          <span>{activity.kind === "rhyme" ? "echo" : "listen"}</span>
          <div className="sound-wave">
            {[1, 2, 3, 4, 5].map((bar) => (
              <motion.i
                key={bar}
                animate={reducedMotion ? {} : { height: [8, 22 + bar * 2, 8] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: bar * 0.08 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activity.kind === "letter") {
    return (
      <div className="activity-visual lantern-visual" aria-hidden="true">
        <div className="lantern-cord" />
        <motion.div
          className="letter-lantern"
          animate={
            reducedMotion
              ? {}
              : { filter: ["drop-shadow(0 0 8px #f5bd63)", "drop-shadow(0 0 22px #f5bd63)", "drop-shadow(0 0 8px #f5bd63)"] }
          }
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          {activity.options.find((option) => option.correct)?.label ?? "m"}
        </motion.div>
        <span className="lantern-glow" />
      </div>
    );
  }

  if (activity.kind === "blend") {
    return (
      <div className="activity-visual bridge-visual" aria-hidden="true">
        <div className="bridge-visual__river" />
        <div className="bridge-visual__stones">
          {activity.letters?.map((letter, letterIndex) => (
            <motion.span
              key={letter}
              animate={reducedMotion ? {} : { y: [0, -4, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: letterIndex * 0.18,
              }}
            >
              {letter}
            </motion.span>
          ))}
        </div>
        <motion.div
          className="bridge-visual__firefly"
          animate={reducedMotion ? {} : { left: ["18%", "50%", "82%"] }}
          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.6 }}
        />
      </div>
    );
  }

  if (activity.kind === "word") {
    return (
      <div className="activity-visual word-visual" aria-hidden="true">
        <div className="word-visual__tiles">
          {activity.letters?.map((letter, letterIndex) => (
            <motion.span
              key={`${letter}-${letterIndex}`}
              className={letter === "_" ? "word-visual__blank" : ""}
              animate={
                letter === "_" && !reducedMotion
                  ? { boxShadow: ["0 6px 0 #bf7c4c", "0 6px 0 #bf7c4c, 0 0 24px #f5c961", "0 6px 0 #bf7c4c"] }
                  : {}
              }
              transition={{ duration: 1.7, repeat: Infinity }}
            >
              {letter === "_" ? "?" : letter}
            </motion.span>
          ))}
        </div>
        <div className="word-visual__soil" />
        <motion.span
          className="word-visual__sprout"
          animate={reducedMotion ? {} : { rotate: [-4, 4, -4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🌱
        </motion.span>
      </div>
    );
  }

  const storyText =
    activity.storyWords?.join(" ") ??
    activity.prompt.split("?")[0] ??
    "A tiny story is ready.";
  const storyIcon =
    activity.options.find((option) => option.correct)?.icon ?? "📖";

  return (
    <div className="activity-visual story-visual">
      <div className="story-visual__stage" aria-hidden="true">
        <span className="story-visual__curtain story-visual__curtain--left" />
        <span className="story-visual__curtain story-visual__curtain--right" />
      </div>
      <p className="story-visual__text">
        <span>{storyText}</span>
      </p>
      <div className="story-visual__characters" aria-hidden="true">
        <span>🦊</span>
        <span>{storyIcon}</span>
      </div>
    </div>
  );
}

interface CompletionScreenProps {
  childName: string;
  adventure: Adventure;
  reducedMotion: boolean;
  onComplete: () => void;
}

function CompletionScreen({
  childName,
  adventure,
  reducedMotion,
  onComplete,
}: CompletionScreenProps) {
  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setTimeout(() => {
      void confetti({
        particleCount: 110,
        spread: 95,
        startVelocity: 28,
        origin: { y: 0.55 },
        colors: ["#F4C56E", "#EC8D79", "#82B56C", "#6CB2C0", "#A08EC9"],
      });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <main className="completion">
      <Image
        src="/art/story-garden.webp"
        alt=""
        fill
        priority
        sizes="100vw"
      />
      <div className="completion__veil" />
      <motion.section
        className="completion__card"
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
      >
        <div className="completion__portrait">
          <Image src="/art/pip-fox.webp" alt="Pip celebrating" fill sizes="180px" />
          <motion.span
            className="completion__seed"
            animate={reducedMotion ? {} : { y: [0, -8, 0], rotate: [-3, 3, -3] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            ✦
          </motion.span>
        </div>
        <span className="completion__kicker">Chapter complete</span>
        <h1>You made words bloom, {childName}!</h1>
        <p>
          You finished <strong>{adventure.title}</strong>. Pip found a glowing
          seed and added <strong>{adventure.rewardName}</strong> to your treasure book.
        </p>
        <div className="completion__wins">
          <span>
            <Check /> {adventure.activities.length} reading challenges
          </span>
          <span>
            <Sparkles /> +1 glowing seed
          </span>
          <span>
            <Check /> New treasure: {adventure.rewardName}
          </span>
        </div>
        <button className="primary-button primary-button--hero" onClick={onComplete}>
          <Home />
          See my garden grow
          <ArrowRight />
        </button>
        <small>All done for today. High five a grown-up!</small>
      </motion.section>
    </main>
  );
}
