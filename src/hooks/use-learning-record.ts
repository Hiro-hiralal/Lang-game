"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deriveMastery } from "@/lib/learning/mastery";
import {
  LocalAttemptStore,
  createSessionId,
} from "@/lib/learning/store";
import type {
  Attempt,
  MasteryMap,
  SessionRecord,
} from "@/lib/learning/types";

export const CONTENT_VERSION = "2026.07-a";

export interface AttemptInput {
  itemId: string;
  skillId: Attempt["skillId"];
  correct: boolean;
  hintLevel: number;
  retries: number;
  mode: Attempt["mode"];
  latencyMs: number;
  chosenId?: string;
  expectedId?: string;
}

/**
 * Owns the attempt log and everything derived from it.
 *
 * Kept separate from `usePersistentProgress`, which tracks the meta-game
 * (seeds, plants, stickers). That is reward state; this is learning evidence,
 * and only this may back anything shown to a parent.
 */
export function useLearningRecord() {
  const storeRef = useRef<LocalAttemptStore | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);
  /**
   * The clock reading that `mastery` was derived against. Sampled alongside
   * every mutation rather than during render, so a secure skill coming due for
   * review is a consequence of new evidence, not of an unrelated re-render.
   */
  const [evaluatedAt, setEvaluatedAt] = useState(0);
  const activeSessionId = useRef<string | null>(null);

  if (storeRef.current === null) {
    storeRef.current = new LocalAttemptStore();
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;
    setAttempts(store.attempts());
    setSessions(store.sessions());
    setEvaluatedAt(Date.now());
    setHydrated(true);
  }, []);

  const beginSession = useCallback((adventureId: string) => {
    const store = storeRef.current;
    if (!store) return "";

    const now = Date.now();
    const session: SessionRecord = {
      id: createSessionId(now),
      startedAt: now,
      endedAt: null,
      adventureId,
      completed: false,
    };

    activeSessionId.current = session.id;
    store.startSession(session);
    setSessions(store.sessions());
    return session.id;
  }, []);

  const finishSession = useCallback((completed: boolean) => {
    const store = storeRef.current;
    const sessionId = activeSessionId.current;
    if (!store || !sessionId) return;

    store.endSession(sessionId, Date.now(), completed);
    activeSessionId.current = null;
    setSessions(store.sessions());
  }, []);

  const recordAttempt = useCallback((input: AttemptInput) => {
    const store = storeRef.current;
    if (!store) return;

    const attempt: Attempt = {
      ...input,
      // An attempt outside a session still counts; it just gets its own id
      // rather than being silently dropped.
      sessionId: activeSessionId.current ?? "unscoped",
      ts: Date.now(),
      contentVersion: CONTENT_VERSION,
    };

    store.appendAttempt(attempt);
    setAttempts(store.attempts());
    setEvaluatedAt(attempt.ts);
  }, []);

  const clearRecord = useCallback(() => {
    const store = storeRef.current;
    if (!store) return;
    store.clear();
    activeSessionId.current = null;
    setAttempts([]);
    setSessions([]);
    setEvaluatedAt(Date.now());
  }, []);

  const mastery: MasteryMap = useMemo(
    () => deriveMastery(attempts, evaluatedAt),
    [attempts, evaluatedAt],
  );

  return {
    attempts,
    sessions,
    mastery,
    evaluatedAt,
    hydrated,
    beginSession,
    finishSession,
    recordAttempt,
    clearRecord,
  };
}

export type LearningRecord = ReturnType<typeof useLearningRecord>;
