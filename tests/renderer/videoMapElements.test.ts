import { describe, expect, it } from "vitest";
import { getVideoMapElementPlans } from "../../src/renderer/components/scene/VideoMapElements";

describe("video map elements", () => {
  it("renders only the active and prepared video buffers", () => {
    expect(
      getVideoMapElementPlans({
        activeVideoIndex: 0,
        preparedVideoIndex: 1,
        paused: false,
        urls: ["primary.mp4", "buffer.mp4", "unused.mp4"]
      })
    ).toEqual([
      { autoPlay: true, index: 0, opacity: 1, url: "primary.mp4" },
      { autoPlay: false, index: 1, opacity: 0, url: "buffer.mp4" }
    ]);
  });

  it("uses map layer opacity only for the active video", () => {
    expect(
      getVideoMapElementPlans({
        activeVideoIndex: 1,
        mapLayerOpacity: 0.42,
        preparedVideoIndex: 0,
        paused: false,
        urls: ["primary.mp4", "buffer.mp4"]
      })
    ).toEqual([
      { autoPlay: false, index: 0, opacity: 0, url: "primary.mp4" },
      { autoPlay: true, index: 1, opacity: 0.42, url: "buffer.mp4" }
    ]);
  });

  it("does not autoplay the active video while paused", () => {
    expect(
      getVideoMapElementPlans({
        activeVideoIndex: 0,
        preparedVideoIndex: null,
        paused: true,
        urls: ["primary.mp4", "buffer.mp4"]
      })
    ).toEqual([{ autoPlay: false, index: 0, opacity: 1, url: "primary.mp4" }]);
  });
});
