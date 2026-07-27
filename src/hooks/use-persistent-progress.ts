"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PROGRESS, DEMO_PROGRESS } from "@/lib/game-data";
import type { PlayerProgress } from "@/lib/game-types";

const STORAGE_KEY = "story-sprouts-progress-v2";
const LEGACY_STORAGE_KEY = "story-sprouts-progress-v1";
const SCHEMA_VERSION = 2;

interface StoredProgress {
  version: number;
  progress: PlayerProgress;
}

/**
 * v1 wrote the shape straight to storage and merged it back with
 * `{...DEFAULT_PROGRESS, ...JSON.parse(saved)}`, so any stale or renamed field
 * survived silently and every save was contaminated with the old fictional
 * starting state. v2 is versioned and explicitly keyed, and the unreadable v1
 * blob is dropped rather than merged.
 */
function readStored(): PlayerProgress | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as StoredProgress).version !== SCHEMA_VERSION
    ) {
      return null;
    }

    const stored = parsed as StoredProgress;
    // Fill in fields added since the save was written, without letting removed
    // fields ride along.
    return { ...DEFAULT_PROGRESS, ...stored.progress };
  } catch {
    return null;
  }
}

function isDemoRequested(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("demo") === "1";
  } catch {
    return false;
  }
}

export function usePersistentProgress() {
  const [progress, setProgress] = useState<PlayerProgress>(DEFAULT_PROGRESS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);

        if (isDemoRequested()) {
          setProgress(DEMO_PROGRESS);
          return;
        }

        const saved = readStored();
        if (saved) setProgress(saved);
      } catch {
        // Storage unavailable or blocked. Play on with an empty profile.
      } finally {
        setHydrated(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload: StoredProgress = {
        version: SCHEMA_VERSION,
        progress,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Quota or private-mode failures must not break the session.
    }
  }, [hydrated, progress]);

  const updateProgress = useCallback(
    (updater: (current: PlayerProgress) => PlayerProgress) => {
      setProgress((current) => updater(current));
    },
    [],
  );

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  }, []);

  return { progress, updateProgress, resetProgress, hydrated };
}

/**
 * Consecutive-day streak from the last play timestamp.
 *
 * `streak` was declared on `PlayerProgress` and rendered, but never once
 * written after the initial fixture. This is the rule that backs it.
 */
export function nextStreak(
  lastPlayed: string | null,
  currentStreak: number,
  now: Date,
): number {
  if (!lastPlayed) return 1;

  const last = new Date(lastPlayed);
  if (Number.isNaN(last.getTime())) return 1;

  const startOfDay = (date: Date) =>
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayGap = Math.round(
    (startOfDay(now) - startOfDay(last)) / 86_400_000,
  );

  if (dayGap <= 0) return Math.max(currentStreak, 1);
  if (dayGap === 1) return currentStreak + 1;
  return 1;
}
