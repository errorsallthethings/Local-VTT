import { describe, expect, it } from "vitest";
import { createRendererVideoThumbnailPlan } from "../../electron/rendererVideoThumbnailPlan";

describe("renderer video thumbnail plan", () => {
  it("creates local asset URLs and capture settings", () => {
    expect(createRendererVideoThumbnailPlan("C:\\Campaign Maps\\Cave Entrance.mp4", "map-1")).toEqual({
      baseAssetUrl: "localvtt://asset/C%3A%5CCampaign%20Maps%5CCave%20Entrance.mp4",
      thumbnailAssetUrl: "localvtt://asset/C%3A%5CCampaign%20Maps%5CCave%20Entrance.mp4?thumbnail=1#t=0.05",
      maxWidth: 180,
      maxHeight: 112,
      timeoutMs: 12000
    });
  });
});
