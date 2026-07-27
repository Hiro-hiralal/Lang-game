import { beforeEach, describe, expect, it } from "vitest";
import {
  REQUESTS_PER_MINUTE,
  clientKey,
  rateLimit,
  recordSpend,
  resetRateLimits,
  resetSpend,
  voiceEnabled,
} from "@/lib/narration-budget";

const T0 = Date.UTC(2026, 6, 1, 12, 0, 0);

beforeEach(() => {
  resetRateLimits();
  resetSpend();
});

describe("rateLimit", () => {
  it("allows a normal session's worth of requests", () => {
    for (let i = 0; i < REQUESTS_PER_MINUTE; i += 1) {
      expect(rateLimit("child", T0 + i).allowed).toBe(true);
    }
  });

  it("blocks once a caller goes past the limit", () => {
    for (let i = 0; i < REQUESTS_PER_MINUTE; i += 1) rateLimit("abuser", T0);
    const blocked = rateLimit("abuser", T0);

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps callers in separate buckets", () => {
    for (let i = 0; i < REQUESTS_PER_MINUTE; i += 1) rateLimit("abuser", T0);
    expect(rateLimit("abuser", T0).allowed).toBe(false);
    expect(rateLimit("someone-else", T0).allowed).toBe(true);
  });

  it("lets a blocked caller back in after the window", () => {
    for (let i = 0; i < REQUESTS_PER_MINUTE + 5; i += 1) rateLimit("abuser", T0);
    expect(rateLimit("abuser", T0).allowed).toBe(false);
    expect(rateLimit("abuser", T0 + 61_000).allowed).toBe(true);
  });
});

describe("clientKey", () => {
  it("takes the first hop of x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" });
    expect(clientKey(headers)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip", () => {
    expect(clientKey(new Headers({ "x-real-ip": "203.0.113.9" }))).toBe(
      "203.0.113.9",
    );
  });

  it("fails closed into a shared bucket when no address is present", () => {
    // Everyone sharing one bucket throttles harder than intended, which is the
    // safe direction for a route that spends money.
    expect(clientKey(new Headers())).toBe("unknown");
  });
});

describe("recordSpend", () => {
  it("permits normal usage", () => {
    expect(recordSpend(500, T0, { VOICE_DAILY_CHAR_BUDGET: "10000" }).withinBudget).toBe(
      true,
    );
  });

  it("stops once the daily ceiling is crossed", () => {
    const env = { VOICE_DAILY_CHAR_BUDGET: "1000" };
    expect(recordSpend(900, T0, env).withinBudget).toBe(true);
    expect(recordSpend(200, T0, env).withinBudget).toBe(false);
  });

  it("starts a fresh budget the next day", () => {
    const env = { VOICE_DAILY_CHAR_BUDGET: "1000" };
    recordSpend(1500, T0, env);
    expect(recordSpend(10, T0, env).withinBudget).toBe(false);
    expect(recordSpend(10, T0 + 86_400_000, env).withinBudget).toBe(true);
  });
});

describe("voiceEnabled", () => {
  it("is on unless explicitly switched off", () => {
    expect(voiceEnabled({})).toBe(true);
    expect(voiceEnabled({ VOICE_ENABLED: "true" })).toBe(true);
    expect(voiceEnabled({ VOICE_ENABLED: "false" })).toBe(false);
  });
});
