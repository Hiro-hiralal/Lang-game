"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, HelpCircle, Lightbulb, Volume2, X } from "lucide-react";
import { ActivityView } from "@/components/activities";
import { ExploreScene } from "@/components/episode/explore-scene";
import { StoryCards } from "@/components/episode/story-cards";
import { PipGuide } from "@/components/pip-guide";
import type { AttemptInput } from "@/hooks/use-learning-record";
import type { Narrator } from "@/hooks/use-narrator";
import {
  hintStep,
  isAssisted,
  nextHintLevel,
  type HintLevel,
} from "@/lib/learning/hint-ladder";
import type { ActivityResult } from "@/lib/activity-types";
import type { Episode } from "@/lib/episodes/types";

interface EpisodePlayerProps {
  episode: Episode;
  reducedMotion: boolean;
  narrator: Narrator;
  playSound: (effect: "tap" | "correct" | "try-again" | "hint" | "complete") => void;
  onExit: () => void;
  onComplete: (rewardPlantId: string) => void;
  onAttempt: (attempt: AttemptInput) => void;
}

/**
 * Plays an episode beat by beat.
 *
 * The shell is the same one the ordinary session uses — hint ladder, narration,
 * attempt log — but the beats between activities are story, and the activities
 * are the actions that move the story on.
 */
export function EpisodePlayer({
  episode,
  reducedMotion,
  narrator,
  playSound,
  onExit,
  onComplete,
  onAttempt,
}: EpisodePlayerProps) {
  const [beatIndex, setBeatIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState<HintLevel>(0);
  const [misses, setMisses] = useState(0);
  const beatStartedAt = useRef(0);
  const retryTimer = useRef<number | null>(null);
  const { speak, stop, isSpeaking } = narrator;

  const beat = episode.beats[beatIndex];
  const activityBeats = episode.beats.filter((entry) => entry.kind === "activity");
  const activityNumber =
    beat?.kind === "activity"
      ? activityBeats.findIndex((entry) => entry.id === beat.id) + 1
      : 0;

  // Only the clock is touched here. Per-beat state is reset in `advance`,
  // where the beat actually changes, rather than reacting to it afterwards.
  useEffect(() => {
    beatStartedAt.current = Date.now();
  }, [beatIndex]);

  useEffect(() => {
    if (beat?.kind !== "activity") return;
    speak(beat.activity.voice.prompt, beat.activity.bubble.prompt);
  }, [beat, speak]);

  useEffect(
    () => () => {
      stop();
      if (retryTimer.current) window.clearTimeout(retryTimer.current);
    },
    [stop],
  );

  if (!beat) return null;

  const advance = () => {
    stop();
    if (beatIndex >= episode.beats.length - 1) return;
    setBeatIndex((current) => current + 1);
    setAnswered(false);
    setFeedbackMessage(null);
    setHintLevel(0);
    setMisses(0);
  };

  const handleAnswer = (result: ActivityResult) => {
    if (beat.kind !== "activity" || answered) return;
    playSound("tap");

    // Runs only from a user gesture, never during render.
    const latencyMs = Date.now() - beatStartedAt.current;

    onAttempt({
      itemId: beat.activity.key,
      skillId: beat.activity.skillId,
      correct: result.correct,
      hintLevel,
      retries: misses,
      mode: isAssisted(hintLevel) ? "assisted" : result.mode,
      latencyMs,
      chosenId: result.chosenId,
      expectedId: result.expectedId,
    });

    if (result.correct) {
      setAnswered(true);
      setFeedbackMessage(beat.activity.bubble.correct);
      playSound("correct");
      speak(beat.activity.voice.correct, beat.activity.celebration);
      return;
    }

    const raised = nextHintLevel(hintLevel);
    const step = hintStep(beat.activity, raised);
    setHintLevel(raised);
    setMisses((current) => current + 1);
    setFeedbackMessage(step.message);
    playSound("try-again");
    speak(step.voiceId, step.message);

    retryTimer.current = window.setTimeout(
      () => setFeedbackMessage(null),
      1650,
    );
  };

  const showHint = () => {
    if (beat.kind !== "activity") return;
    const raised = nextHintLevel(hintLevel);
    const step = hintStep(beat.activity, raised);
    setHintLevel(raised);
    setFeedbackMessage(step.message);
    playSound("hint");
    speak(step.voiceId, step.message);
  };

  if (beat.kind === "opening") {
    return (
      <main className="episode episode--cinematic">
        <StoryCards
          cards={beat.cards}
          reducedMotion={reducedMotion}
          speak={speak}
          onDone={advance}
        />
      </main>
    );
  }

  if (beat.kind === "finale") {
    return (
      <main className="episode episode--cinematic">
        <StoryCards
          cards={beat.cards}
          reducedMotion={reducedMotion}
          speak={speak}
          skipLabel="Straight to my garden"
          onDone={() => {
            playSound("complete");
            onComplete(beat.rewardPlantId);
          }}
        />
      </main>
    );
  }

  if (beat.kind === "explore") {
    return (
      <main className="episode">
        <button className="episode__close" onClick={onExit} aria-label="Leave the episode">
          <X />
        </button>
        <ExploreScene
          title={beat.title}
          instruction={beat.instruction}
          voiceId={beat.voiceId}
          sky={beat.sky}
          objects={beat.objects}
          requiredTaps={beat.requiredTaps}
          reducedMotion={reducedMotion}
          speak={speak}
          onDone={advance}
        />
      </main>
    );
  }

  const activity = beat.activity;
  const bubbleMessage =
    feedbackMessage ??
    (answered
      ? activity.bubble.correct
      : hintLevel > 0
        ? hintStep(activity, hintLevel).message
        : activity.bubble.prompt);

  return (
    <main className="episode">
      <header className="episode__header">
        <button className="episode__close" onClick={onExit} aria-label="Leave the episode">
          <X />
        </button>
        <div className="episode__progress">
          <span>
            Part {activityNumber} of {activityBeats.length}
          </span>
          <strong>{episode.title}</strong>
        </div>
        <button
          className={`session-speak ${isSpeaking ? "is-speaking" : ""}`}
          onClick={() => speak(activity.voice.prompt, activity.bubble.prompt)}
          aria-label="Hear that again"
        >
          <Volume2 />
        </button>
      </header>

      <AnimatePresence mode="wait">
        <motion.section
          key={beat.id}
          className="episode__beat"
          initial={reducedMotion ? false : { opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -22 }}
          transition={{ duration: reducedMotion ? 0 : 0.34 }}
        >
          <p className="episode__beat-text">{beat.beatText}</p>
          <h1 className="episode__instruction">{activity.instruction}</h1>

          <PipGuide
            message={bubbleMessage}
            mood={answered ? "celebrate" : hintLevel > 0 ? "thinking" : "hello"}
            onSpeak={() =>
              speak(
                answered ? activity.voice.correct : activity.voice.prompt,
                bubbleMessage,
              )
            }
            compact
            isSpeaking={isSpeaking}
          />

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
            {answered && (
              <motion.button
                className="primary-button"
                onClick={advance}
                initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                What happens next
                <ArrowRight />
              </motion.button>
            )}
          </div>
        </motion.section>
      </AnimatePresence>
    </main>
  );
}
