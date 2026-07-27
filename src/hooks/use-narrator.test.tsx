import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNarrator } from "@/hooks/use-narrator";

class MockUtterance {
  voice: SpeechSynthesisVoice | null = null;
  rate = 1;
  pitch = 1;
  volume = 1;
  onstart: ((event: SpeechSynthesisEvent) => void) | null = null;
  onend: ((event: SpeechSynthesisEvent) => void) | null = null;
  onerror: ((event: SpeechSynthesisErrorEvent) => void) | null = null;

  constructor(readonly text: string) {}
}

class MockAudio {
  static instances: MockAudio[] = [];
  static playResults: Promise<void>[] = [];
  preload = "";
  onplay: ((event: Event) => void) | null = null;
  onended: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  pause = vi.fn();
  removeAttribute = vi.fn();
  play = vi.fn<() => Promise<void>>(
    () => MockAudio.playResults.shift() ?? Promise.resolve(),
  );

  constructor(readonly src: string) {
    MockAudio.instances.push(this);
  }
}

describe("useNarrator", () => {
  beforeEach(() => {
    MockAudio.instances = [];
    MockAudio.playResults = [];
    vi.stubGlobal("Audio", MockAudio);
    vi.stubGlobal("SpeechSynthesisUtterance", MockUtterance);
    vi.mocked(window.speechSynthesis.speak).mockClear();
    vi.mocked(window.speechSynthesis.cancel).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not let an interrupted player start a stale device voice", async () => {
    let rejectOldPlay!: (reason?: unknown) => void;
    const oldPlay = new Promise<void>((_, reject) => {
      rejectOldPlay = reject;
    });
    MockAudio.playResults = [oldPlay, Promise.resolve()];

    const { result } = renderHook(() => useNarrator(true));

    act(() => {
      result.current.speak("old", "The old line");
    });
    const old = MockAudio.instances[0];
    const staleError = old.onerror;

    act(() => {
      result.current.speak("new", "The new line");
    });

    await act(async () => {
      staleError?.(new Event("error"));
      rejectOldPlay(new Error("interrupted"));
      await Promise.resolve();
    });

    expect(window.speechSynthesis.speak).not.toHaveBeenCalled();
    expect(old.pause).toHaveBeenCalledOnce();
    expect(old.removeAttribute).toHaveBeenCalledWith("src");
  });

  it("falls back once when the current AI line genuinely fails", async () => {
    const { result } = renderHook(() => useNarrator(true));

    act(() => {
      result.current.speak("current", "Read this with the device voice");
    });
    const current = MockAudio.instances[0];

    await act(async () => {
      current.onerror?.(new Event("error"));
      await Promise.resolve();
    });

    expect(window.speechSynthesis.speak).toHaveBeenCalledOnce();
    expect(window.speechSynthesis.speak).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Read this with the device voice" }),
    );
  });

  it("stops narration when the page is hidden", () => {
    const { result } = renderHook(() => useNarrator(true));

    act(() => {
      result.current.speak("current", "A line");
    });
    const current = MockAudio.instances[0];
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(current.pause).toHaveBeenCalledOnce();
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });
});
