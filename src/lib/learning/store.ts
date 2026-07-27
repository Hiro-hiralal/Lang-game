import type {
  Attempt,
  AttemptStore,
  SessionRecord,
} from "@/lib/learning/types";

const ATTEMPTS_KEY = "story-sprouts-attempts-v1";
const SESSIONS_KEY = "story-sprouts-sessions-v1";

/**
 * Keep the log bounded. At roughly a dozen scored opportunities per session
 * this holds well over a hundred sessions, which is far more history than any
 * mastery or dashboard calculation looks at.
 */
export const MAX_ATTEMPTS = 2000;
export const MAX_SESSIONS = 400;

function readJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    // A corrupt log should cost the child their history, never the session.
    return [];
  }
}

function writeJson<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exhausted or storage disabled. The game stays playable; only the
    // record is lost, so this must not throw into the render path.
  }
}

/**
 * Local-first attempt log. Deliberately behind the `AttemptStore` interface so
 * a server-backed adapter can replace it later without touching game code.
 *
 * Stores only lesson outcomes: item, skill, correctness, hint level, response
 * mode and latency. No audio, no transcripts, no free text. PRD section 14.
 */
export class LocalAttemptStore implements AttemptStore {
  attempts(): Attempt[] {
    return readJson<Attempt>(ATTEMPTS_KEY);
  }

  sessions(): SessionRecord[] {
    return readJson<SessionRecord>(SESSIONS_KEY);
  }

  appendAttempt(attempt: Attempt): void {
    const next = [...this.attempts(), attempt];
    writeJson(ATTEMPTS_KEY, next.slice(-MAX_ATTEMPTS));
  }

  startSession(session: SessionRecord): void {
    const next = [...this.sessions(), session];
    writeJson(SESSIONS_KEY, next.slice(-MAX_SESSIONS));
  }

  endSession(sessionId: string, endedAt: number, completed: boolean): void {
    const next = this.sessions().map((session) =>
      session.id === sessionId ? { ...session, endedAt, completed } : session,
    );
    writeJson(SESSIONS_KEY, next);
  }

  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ATTEMPTS_KEY);
    window.localStorage.removeItem(SESSIONS_KEY);
  }
}

/** In-memory implementation, used by tests and by server rendering. */
export class MemoryAttemptStore implements AttemptStore {
  private attemptLog: Attempt[] = [];
  private sessionLog: SessionRecord[] = [];

  attempts(): Attempt[] {
    return [...this.attemptLog];
  }

  sessions(): SessionRecord[] {
    return [...this.sessionLog];
  }

  appendAttempt(attempt: Attempt): void {
    this.attemptLog = [...this.attemptLog, attempt].slice(-MAX_ATTEMPTS);
  }

  startSession(session: SessionRecord): void {
    this.sessionLog = [...this.sessionLog, session].slice(-MAX_SESSIONS);
  }

  endSession(sessionId: string, endedAt: number, completed: boolean): void {
    this.sessionLog = this.sessionLog.map((session) =>
      session.id === sessionId ? { ...session, endedAt, completed } : session,
    );
  }

  clear(): void {
    this.attemptLog = [];
    this.sessionLog = [];
  }
}

export function createSessionId(now: number, random = Math.random): string {
  return `s-${now.toString(36)}-${Math.floor(random() * 1e6).toString(36)}`;
}

/** Latency buckets keep response time coarse — PRD section 17 forbids exact timing in analytics. */
export function latencyBucket(latencyMs: number) {
  if (latencyMs < 3000) return "fast" as const;
  if (latencyMs < 10_000) return "typical" as const;
  return "slow" as const;
}
