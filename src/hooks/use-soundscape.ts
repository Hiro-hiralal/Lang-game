"use client";

import { useCallback, useEffect, useRef } from "react";

type SoundEffect = "tap" | "correct" | "try-again" | "hint" | "complete";

interface SoundscapeNodes {
  context: AudioContext;
  music: GainNode;
  effects: GainNode;
  timer: number;
  step: number;
}

function makeTone(
  context: AudioContext,
  destination: AudioNode,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  wave: OscillatorType = "sine",
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

export function useSoundscape(enabled: boolean) {
  const nodes = useRef<SoundscapeNodes | null>(null);

  const playGardenNote = useCallback((state: SoundscapeNodes) => {
    const notes = [261.63, 329.63, 392, 440, 392, 329.63, 293.66, 392];
    const frequency = notes[state.step % notes.length];
    const now = state.context.currentTime;
    makeTone(state.context, state.music, frequency, now, 1.35, 0.12, "sine");
    makeTone(
      state.context,
      state.music,
      frequency / 2,
      now,
      1.65,
      0.045,
      "triangle",
    );
    state.step += 1;
  }, []);

  const start = useCallback(
    (force = false) => {
      if ((!enabled && !force) || typeof AudioContext === "undefined") return;

      if (nodes.current) {
        void nodes.current.context.resume();
        return;
      }

      const context = new AudioContext();
      const master = context.createGain();
      const music = context.createGain();
      const effects = context.createGain();
      master.gain.value = 0.72;
      music.gain.value = 0.07;
      effects.gain.value = 0.16;
      music.connect(master);
      effects.connect(master);
      master.connect(context.destination);

      const state: SoundscapeNodes = {
        context,
        music,
        effects,
        timer: 0,
        step: 0,
      };
      nodes.current = state;
      playGardenNote(state);
      state.timer = window.setInterval(() => playGardenNote(state), 2100);
      void context.resume();
    },
    [enabled, playGardenNote],
  );

  const stop = useCallback(() => {
    const state = nodes.current;
    if (!state) return;
    window.clearInterval(state.timer);
    void state.context.close();
    nodes.current = null;
  }, []);

  const play = useCallback(
    (effect: SoundEffect) => {
      if (!enabled) return;
      start();
      const state = nodes.current;
      if (!state) return;
      const now = state.context.currentTime;

      if (effect === "tap") {
        makeTone(state.context, state.effects, 520, now, 0.12, 0.17, "sine");
      } else if (effect === "hint") {
        makeTone(state.context, state.effects, 440, now, 0.24, 0.12, "sine");
        makeTone(state.context, state.effects, 554.37, now + 0.1, 0.3, 0.1, "sine");
      } else if (effect === "try-again") {
        makeTone(state.context, state.effects, 349.23, now, 0.22, 0.1, "triangle");
        makeTone(state.context, state.effects, 293.66, now + 0.13, 0.3, 0.08, "triangle");
      } else if (effect === "correct") {
        [523.25, 659.25, 783.99].forEach((note, index) =>
          makeTone(
            state.context,
            state.effects,
            note,
            now + index * 0.09,
            0.48,
            0.12,
            "sine",
          ),
        );
      } else {
        [261.63, 329.63, 392, 523.25].forEach((note, index) =>
          makeTone(
            state.context,
            state.effects,
            note,
            now + index * 0.12,
            0.85,
            0.11,
            "sine",
          ),
        );
      }
    },
    [enabled, start],
  );

  useEffect(() => {
    const handleVoice = (event: Event) => {
      const state = nodes.current;
      if (!state) return;
      const speaking = (event as CustomEvent<{ speaking: boolean }>).detail
        ?.speaking;
      const now = state.context.currentTime;
      state.music.gain.cancelScheduledValues(now);
      state.music.gain.linearRampToValueAtTime(speaking ? 0.018 : 0.07, now + 0.25);
    };

    window.addEventListener("story-sprouts:voice", handleVoice);
    return () => window.removeEventListener("story-sprouts:voice", handleVoice);
  }, []);

  useEffect(() => {
    if (!enabled) stop();
  }, [enabled, stop]);

  useEffect(() => stop, [stop]);

  return { start, stop, play };
}
