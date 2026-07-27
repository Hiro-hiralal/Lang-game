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
import { ActivityView } from "@/components/activities";
import { PipGuide } from "@/components/pip-guide";
import type { Narrator } from "@/hooks/use-narrator";
import type { AttemptInput } from "@/hooks/use-learning-record";
import { ZONES } from "@/lib/game-data";
import {
  hintStep,
  isAssisted,
  nextHintLevel,
  type HintLevel,
} from "@/lib/learning/hint-ladder";
import { interactionOf, type ActivityResult } from "@/lib/activity-types";
import { reactToAnswer } from "@/lib/pip-reactions";
import type { Activity, Adventure } from "@/lib/game-types";

interface GameSessionProps {
  childName: string;
  adventure: Adventure;
  reducedMotion: boolean;
  narrator: Narrator;
  playSound: (effect: "tap" | "correct" | "try-again" | "hint" | "complete") => void;
  onExit: () => void;
  onComplete: () => void;
  onAttempt: (attempt: AttemptInput) => void;
}

export function GameSession({
  childName,
  adventure,
  reducedMotion,
  narrator,
  playSound,
  onExit,
  onComplete,
  onAttempt,
}: GameSessionProps) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "try-again" | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const [hintLevel, setHintLevel] = useState<HintLevel>(0);
  const [completed, setCompleted] = useState(false);
  const retryTimer = useRef<number | null>(null);
  // Set in an effect rather than at render so the clock is read once per item,
  // not on every re-render.
  const itemStartedAt = useRef<number>(0);
  const { speak, stop, preload, isSpeaking } = narrator;
  const activities = adventure.activities;
  const activity = activities[index];
  const zone = ZONES.find((item) => item.id === activity.id) ?? ZONES[0];
  const percent = ((index + (feedback === "correct" ? 1 : 0)) / activities.length) * 100;

  const answered = feedback === "correct";

  // The answer is only ever drawn once the child has produced it.
  const revealed = answered;

  useEffect(() => {
    const next = activities[index + 1];
    if (next) preload(next.voice.prompt);
  }, [activities, index, preload]);

  useEffect(() => {
    itemStartedAt.current = Date.now();
  }, [index]);

  useEffect(
    () => () => {
      stop();
      if (retryTimer.current) window.clearTimeout(retryTimer.current);
    },
    [stop],
  );

  /**
   * Every activity system reports its outcome here. The shell owns the hint
   * ladder, narration and the attempt log; a system only has to say whether the
   * child got it and how they answered.
   */
  const handleAnswer = (result: ActivityResult) => {
    if (answered) return;
    playSound("tap");

    // Runs only from a user gesture, never during render.
    const latencyMs = Date.now() - itemStartedAt.current;

    onAttempt({
      itemId: activity.key,
      skillId: activity.skillId,
      correct: result.correct,
      hintLevel,
      retries: misses,
      // A success reached only after the ladder narrowed the field is recorded
      // as assisted, and can never contribute to mastery.
      mode: isAssisted(hintLevel) ? "assisted" : result.mode,
      latencyMs,
      chosenId: result.chosenId,
      expectedId: result.expectedId,
    });

    const reaction = reactToAnswer(
      {
        correct: result.correct,
        hintLevel,
        mode: isAssisted(hintLevel) ? "assisted" : result.mode,
        retries: misses,
      },
      activity.skillId,
    );

    if (result.correct) {
      setFeedback("correct");
      // Pip's own reaction first, then the authored celebration. A clean
      // first try and a fourth attempt after three hints used to get the
      // identical line.
      setFeedbackMessage(`${reaction.text} ${activity.bubble.correct}`);
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
      return;
    }

    // A miss climbs one rung and gives targeted feedback where the content has
    // it, but nothing is taken away: the child still has to produce the answer.
    const raised = nextHintLevel(hintLevel);
    const step = hintStep(activity, raised);
    const targeted = result.chosenId
      ? activity.bubble.wrong[result.chosenId]
      : undefined;
    const targetedVoice = result.chosenId
      ? activity.voice.wrong[result.chosenId]
      : undefined;
    const message = `${reaction.text} ${targeted ?? step.message}`;
    const voiceLine = targetedVoice ?? step.voiceId;

    setFeedback("try-again");
    setHintLevel(raised);
    setFeedbackMessage(message);
    setMisses((current) => current + 1);
    playSound("try-again");
    speak(voiceLine, message);

    retryTimer.current = window.setTimeout(() => {
      setFeedback(null);
      setFeedbackMessage(null);
    }, 1650);
  };

  const showHint = () => {
    const raised = nextHintLevel(hintLevel);
    const step = hintStep(activity, raised);
    setHintLevel(raised);
    setFeedbackMessage(step.message);
    playSound("hint");
    speak(step.voiceId, step.message);
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
    setFeedback(null);
    setFeedbackMessage(null);
    setMisses(0);
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

  const bubbleMessage =
    feedbackMessage ??
    (answered
      ? activity.bubble.correct
      : hintLevel > 0
        ? hintStep(activity, hintLevel).message
        : activity.bubble.prompt);

  const bubbleVoiceId = answered
    ? activity.voice.correct
    : hintLevel > 0
      ? hintStep(activity, hintLevel).voiceId
      : activity.voice.prompt;

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
            message={bubbleMessage}
            mood={answered ? "celebrate" : hintLevel > 0 ? "thinking" : "hello"}
            onSpeak={() => speak(bubbleVoiceId, bubbleMessage)}
            compact
            isSpeaking={isSpeaking}
          />

          {/*
            `choice` items keep the scene-setting visual above their options.
            The other systems are the visual — the child manipulates the scene
            itself rather than looking at it and picking from a list below.
          */}
          {interactionOf(activity) === "choice" && (
            <ActivityVisual
              activity={activity}
              reducedMotion={reducedMotion}
              revealed={revealed}
            />
          )}

          <ActivityView
            activity={activity}
            reducedMotion={reducedMotion}
            answered={answered}
            hintLevel={hintLevel}
            onAnswer={handleAnswer}
            speak={speak}
          />

          <div className="activity-footer">
            <button className="hint-button" onClick={showHint} disabled={answered}>
              {hintLevel > 0 ? <Lightbulb /> : <HelpCircle />}
              {hintLevel > 0 ? "Hear the hint again" : "I’d like a hint"}
            </button>
            <AnimatePresence>
              {answered && (
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
  /** True once the child has answered. Nothing that gives the answer away may render before this. */
  revealed: boolean;
}

function ActivityVisual({
  activity,
  reducedMotion,
  revealed,
}: ActivityVisualProps) {
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
    // The lantern used to render the correct option's label, which meant every
    // letter activity displayed its own answer in 96px type. The child could
    // shape-match without ever hearing the sound. The lantern now stays dark
    // until answered; the sound is available only through the speaker button.
    const answerLetter = activity.options.find((option) => option.correct)?.label;

    return (
      <div className="activity-visual lantern-visual" aria-hidden="true">
        <div className="lantern-cord" />
        <motion.div
          className={`letter-lantern ${revealed ? "" : "letter-lantern--dark"}`}
          animate={
            revealed && !reducedMotion
              ? {
                  filter: [
                    "drop-shadow(0 0 8px #f5bd63)",
                    "drop-shadow(0 0 22px #f5bd63)",
                    "drop-shadow(0 0 8px #f5bd63)",
                  ],
                }
              : {}
          }
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          {revealed ? (
            answerLetter
          ) : (
            <motion.span
              className="letter-lantern__listen"
              animate={reducedMotion ? {} : { scale: [1, 1.12, 1], opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 1.9, repeat: Infinity }}
            >
              ?
            </motion.span>
          )}
        </motion.div>
        {revealed && <span className="lantern-glow" />}
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

  // Previously the stage displayed the correct option's icon, so the answer to
  // the comprehension question stood on stage next to Pip.
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
        <span>📖</span>
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
