"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function announceVoiceState(speaking: boolean) {
  window.dispatchEvent(
    new CustomEvent("story-sprouts:voice", { detail: { speaking } }),
  );
}

export function useNarrator(enabled: boolean) {
  const selectedVoice = useRef<SpeechSynthesisVoice | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const fallbackText = useRef("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState<"ai" | "device">("ai");

  const setSpeaking = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking);
    announceVoiceState(speaking);
  }, []);

  const speakWithDeviceVoice = useCallback(
    (text: string) => {
      if (!enabled || !("speechSynthesis" in window)) {
        setSpeaking(false);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice.current;
      utterance.rate = 0.88;
      utterance.pitch = 1.04;
      utterance.volume = 0.95;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setVoiceMode("device");
      window.speechSynthesis.speak(utterance);
    },
    [enabled, setSpeaking],
  );

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
      audio.current?.pause();
      announceVoiceState(false);
    };
  }, []);

  const stop = useCallback(() => {
    if (audio.current) {
      audio.current.pause();
      audio.current.removeAttribute("src");
      audio.current.load();
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [setSpeaking]);

  const speak = useCallback(
    (lineId: string, deviceFallback: string, interrupt = true) => {
      if (!enabled) return;
      if (interrupt) stop();

      fallbackText.current = deviceFallback;
      const player = new Audio(
        `/api/narrate?line=${encodeURIComponent(lineId)}`,
      );
      player.preload = "auto";
      player.onplay = () => {
        setVoiceMode("ai");
        setSpeaking(true);
      };
      player.onended = () => setSpeaking(false);
      player.onerror = () => {
        player.onerror = null;
        speakWithDeviceVoice(fallbackText.current);
      };
      audio.current = player;

      void player.play().catch(() => {
        player.onerror = null;
        speakWithDeviceVoice(fallbackText.current);
      });
    },
    [enabled, setSpeaking, speakWithDeviceVoice, stop],
  );

  const preload = useCallback((lineId: string) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = `/api/narrate?line=${encodeURIComponent(lineId)}`;
    link.as = "audio";
    document.head.appendChild(link);
    window.setTimeout(() => link.remove(), 30_000);
  }, []);

  return { speak, stop, preload, isSpeaking, voiceMode };
}

export type Narrator = ReturnType<typeof useNarrator>;
