import { describe, expect, it } from "vitest";
import {
  formatVideoDebug,
  getVideoBufferUrls,
  shouldPrepareVideoBuffer,
  shouldRestartVideo
} from "../../src/renderer/canvas/map";

function video(overrides: Partial<HTMLVideoElement> = {}): HTMLVideoElement {
  return {
    currentTime: 0,
    duration: 10,
    ended: false,
    paused: false,
    readyState: 2,
    ...overrides
  } as HTMLVideoElement;
}

describe("video map helpers", () => {
  it("builds stable primary and buffer video URLs", () => {
    expect(getVideoBufferUrls(null, true, [0, 0])).toEqual([]);
    expect(getVideoBufferUrls("localvtt://asset/map.mp4", false, [0, 0])).toEqual([]);
    expect(getVideoBufferUrls("localvtt://asset/map.mp4", true, [2, 7])).toEqual([
      "localvtt://asset/map.mp4?buffer=0&take=2#t=0.05",
      "localvtt://asset/map.mp4?buffer=1&take=7#t=0.05"
    ]);
  });

  it("preserves existing query strings and hash fragments when building video URLs", () => {
    expect(getVideoBufferUrls("localvtt://asset/map.mp4?cache=1#t=2", true, [1, 3])).toEqual([
      "localvtt://asset/map.mp4?cache=1&buffer=0&take=1#t=2",
      "localvtt://asset/map.mp4?cache=1&buffer=1&take=3#t=2"
    ]);
  });

  it("restarts only near the end of finite video maps", () => {
    expect(shouldRestartVideo(video({ currentTime: 9.7 }))).toBe(false);
    expect(shouldRestartVideo(video({ currentTime: 9.9 }))).toBe(true);
    expect(shouldRestartVideo(video({ ended: true }))).toBe(true);
    expect(shouldRestartVideo(video({ duration: Number.POSITIVE_INFINITY, currentTime: 100 }))).toBe(false);
  });

  it("prepares the alternate buffer before restart time", () => {
    expect(shouldPrepareVideoBuffer(video({ currentTime: 6.9 }))).toBe(false);
    expect(shouldPrepareVideoBuffer(video({ currentTime: 7.1 }))).toBe(true);
    expect(shouldPrepareVideoBuffer(video({ currentTime: 9.9 }))).toBe(false);
    expect(shouldPrepareVideoBuffer(video({ duration: 0, currentTime: 1 }))).toBe(false);
  });

  it("formats compact playback diagnostics", () => {
    expect(formatVideoDebug([video({ currentTime: 1.234, duration: 5 }), null], 0)).toBe(
      "Active=Primary\nPrimary: t=1.23 dur=5.00 paused=false ended=false ready=2\nBuffer: missing"
    );
    expect(formatVideoDebug([null, video({ duration: Number.NaN, paused: true })], 1)).toContain("dur=unknown paused=true");
  });
});
