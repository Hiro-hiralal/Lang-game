"use client";

import { useCallback, useEffect, useRef } from "react";

export function useNarrator(enabled: boolean) {
  const selectedVoice = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      selectedVoice.current =
        voices.find(
          (voice) =>
            voice.lang.startsWith("en") &&
            /samantha|ava|serena|victoria|zira|female/i.test(voice.name),
        ) ??
        voices.find((voice) => voice.lang.startsWith("en")) ??
        null;
    };

    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string, interrupt = true) => {
      if (!enabled || !("speechSynthesis" in window)) return;
      if (interrupt) window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice.current;
      utterance.rate = 0.82;
      utterance.pitch = 1.08;
      utterance.volume = 0.95;
      window.speechSynthesis.speak(utterance);
    },
    [enabled],
  );

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return { speak, stop };
}
