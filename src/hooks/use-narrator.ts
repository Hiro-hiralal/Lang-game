"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function announceVoiceState(speaking: boolean) {
  window.dispatchEvent(
    new CustomEvent("story-sprouts:voice", { detail: { speaking } }),
  );
}

function detachPlayer(player: HTMLAudioElement) {
  player.onplay = null;
  player.onended = null;
  player.onerror = null;
}

export function useNarrator(enabled: boolean) {
  const selectedVoice = useRef<SpeechSynthesisVoice | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  // Every stop or new line invalidates all callbacks belonging to the previous
  // line. pause() and src removal can emit `error`, and a rejected play()
  // promise can settle after the next line has already begun.
  const session = useRef(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState<"ai" | "device">("ai");

  const setSpeaking = useCallback((speaking: boolean) => {
    setIsSpeaking(speaking);
    announceVoiceState(speaking);
  }, []);

  const silenceCurrentSession = useCallback(() => {
    session.current += 1;

    const player = audio.current;
    audio.current = null;
    if (player) {
      // Detach first: changing a media element's source is allowed to emit an
      // error. An interrupted AI line must never fall back to device speech.
      detachPlayer(player);
      player.pause();
      player.removeAttribute("src");
    }

    const currentUtterance = utterance.current;
    utterance.current = null;
    if (currentUtterance) {
      currentUtterance.onstart = null;
      currentUtterance.onend = null;
      currentUtterance.onerror = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const speakWithDeviceVoice = useCallback(
    (text: string, lineSession: number) => {
      if (lineSession !== session.current) return;
      if (!enabled || !("speechSynthesis" in window)) {
        setSpeaking(false);
        return;
      }

      window.speechSynthesis.cancel();
      const deviceLine = new SpeechSynthesisUtterance(text);
      deviceLine.voice = selectedVoice.current;
      deviceLine.rate = 0.88;
      deviceLine.pitch = 1.04;
      deviceLine.volume = 0.95;
      deviceLine.onstart = () => {
        if (lineSession === session.current) setSpeaking(true);
      };
      const finish = () => {
        if (
          lineSession !== session.current ||
          utterance.current !== deviceLine
        ) {
          return;
        }
        utterance.current = null;
        setSpeaking(false);
      };
      deviceLine.onend = finish;
      deviceLine.onerror = finish;
      utterance.current = deviceLine;
      setVoiceMode("device");
      window.speechSynthesis.speak(deviceLine);
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
    };
  }, []);

  const stop = useCallback(() => {
    silenceCurrentSession();
    setSpeaking(false);
  }, [setSpeaking, silenceCurrentSession]);

  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.visibilityState === "hidden") stop();
    };

    window.addEventListener("pagehide", stop);
    document.addEventListener("visibilitychange", stopWhenHidden);
    return () => {
      window.removeEventListener("pagehide", stop);
      document.removeEventListener("visibilitychange", stopWhenHidden);
      silenceCurrentSession();
      announceVoiceState(false);
    };
  }, [silenceCurrentSession, stop]);

  const speak = useCallback(
    (lineId: string, deviceFallback: string) => {
      if (!enabled) return;

      // Narration is exclusive: beginning one line always invalidates and
      // silences both AI audio and device speech from the previous line.
      silenceCurrentSession();
      const lineSession = session.current;
      let fallbackStarted = false;

      const player = new Audio(
        `/api/narrate?line=${encodeURIComponent(lineId)}`,
      );
      player.preload = "auto";
      player.onplay = () => {
        if (lineSession !== session.current || audio.current !== player) return;
        setVoiceMode("ai");
        setSpeaking(true);
      };
      player.onended = () => {
        if (lineSession !== session.current || audio.current !== player) return;
        detachPlayer(player);
        audio.current = null;
        setSpeaking(false);
      };
      const fallback = () => {
        if (
          fallbackStarted ||
          lineSession !== session.current ||
          audio.current !== player
        ) {
          return;
        }
        fallbackStarted = true;
        detachPlayer(player);
        audio.current = null;
        speakWithDeviceVoice(deviceFallback, lineSession);
      };
      player.onerror = fallback;
      audio.current = player;

      void player.play().catch(fallback);
    },
    [enabled, setSpeaking, silenceCurrentSession, speakWithDeviceVoice],
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
