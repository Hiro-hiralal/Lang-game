"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PROGRESS } from "@/lib/game-data";
import type { PlayerProgress } from "@/lib/game-types";

const STORAGE_KEY = "story-sprouts-progress-v1";

export function usePersistentProgress() {
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setProgress({ ...DEFAULT_PROGRESS, ...JSON.parse(saved) });
        }
      } catch {
        // Keep the polished showcase defaults if storage is unavailable or corrupt.
      } finally {
        setHydrated(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [hydrated, progress]);

  const updateProgress = useCallback(
    (updater: (current: PlayerProgress) => PlayerProgress) => {
      setProgress((current) => updater(current));
    },
    [],
  );

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { progress, updateProgress, resetProgress, hydrated };
}
