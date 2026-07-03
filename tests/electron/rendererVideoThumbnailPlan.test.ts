import { describe, expect, it } from "vitest";
import {
  createRendererVideoThumbnailCleanupScript,
  createRendererVideoThumbnailPlan,
  getRendererVideoThumbnailCaptureRect
} from "../../electron/rendererVideoThumbnailPlan";

describe("renderer video thumbnail plan", () => {
  it("creates local asset URLs and capture settings", () => {
    expect(createRendererVideoThumbnailPlan("C:\\Campaign Maps\\Cave Entrance.mp4", "map-1")).toEqual({
      baseAssetUrl: "localvtt://asset/C%3A%5CCampaign%20Maps%5CCave%20Entrance.mp4",
      thumbnailAssetUrl: "localvtt://asset/C%3A%5CCampaign%20Maps%5CCave%20Entrance.mp4?thumbnail=1#t=0.05",
      captureSurfaceId: "localvtt-video-thumbnail-map-1",
      captureRect: { x: 24, y: 24, width: 180, height: 112 },
      timeoutMs: 12000
    });
  });

  it("normalizes renderer preparation results", () => {
    expect(getRendererVideoThumbnailCaptureRect({ captureRect: { x: 1, y: 2, width: 3, height: 4 } })).toEqual({ x: 1, y: 2, width: 3, height: 4 });
    expect(getRendererVideoThumbnailCaptureRect({ failureReason: "not ready" })).toBe("not ready");
    expect(getRendererVideoThumbnailCaptureRect(null)).toBe("Renderer video frame could not be prepared for capture.");
  });

  it("creates cleanup scripts for capture surfaces", () => {
    const script = createRendererVideoThumbnailCleanupScript("surface-1");

    expect(script).toContain('document.getElementById("surface-1")');
    expect(script).toContain('video.removeAttribute("src")');
    expect(script).toContain("captureSurface?.remove()");
  });
});
