/**
 * Guards on the narration endpoint.
 *
 * `/api/narrate` is an unauthenticated route that calls a paid OpenAI endpoint
 * on every miss. The line id is validated against the registry, which bounds
 * *what* can be asked for, but nothing bounded *how often* — so anyone could
 * hold the route open and spend the project's balance.
 *
 * Pre-generated audio is the real fix (see scripts/pregenerate-audio.ts): with
 * a static file on disk the route never reaches OpenAI at all. These limits
 * cover the gap for lines that have not been rendered yet.
 */

const WINDOW_MS = 60_000;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Generous enough for a real session, which preloads a line at a time. */
export const REQUESTS_PER_MINUTE = 40;

/** Serverless instances are short-lived, but a hot one should not leak. */
const MAX_TRACKED_CLIENTS = 5000;

export function rateLimit(
  clientId: string,
  now: number,
  limit = REQUESTS_PER_MINUTE,
): { allowed: boolean; retryAfterSeconds: number } {
  const existing = buckets.get(clientId);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size > MAX_TRACKED_CLIENTS) buckets.clear();
    buckets.set(clientId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimits() {
  buckets.clear();
}

/**
 * Best-effort client key. Behind Vercel this is the real client address; with
 * no headers at all every caller shares one bucket, which fails closed rather
 * than open.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/** Only the keys these guards read, so tests can pass a bare object. */
type Env = Record<string, string | undefined>;

/** PRD section 15: `VOICE_ENABLED` as an operational kill switch. */
export function voiceEnabled(env: Env = process.env): boolean {
  return env.VOICE_ENABLED !== "false";
}

/**
 * A crude daily spend ceiling. `gpt-4o-mini-tts` bills per input token; lines
 * here average well under a hundred, so a character count is a close enough
 * proxy to stop a runaway loop costing real money.
 */
const DAILY_CHAR_BUDGET_DEFAULT = 2_000_000;

let spend = { day: "", chars: 0 };

export function recordSpend(
  characters: number,
  now: number,
  env: Env = process.env,
): { withinBudget: boolean } {
  const day = new Date(now).toISOString().slice(0, 10);
  if (spend.day !== day) spend = { day, chars: 0 };

  const budget = Number(
    env.VOICE_DAILY_CHAR_BUDGET ?? DAILY_CHAR_BUDGET_DEFAULT,
  );
  if (!Number.isFinite(budget) || budget <= 0) return { withinBudget: true };

  spend.chars += characters;
  return { withinBudget: spend.chars <= budget };
}

export function resetSpend() {
  spend = { day: "", chars: 0 };
}
