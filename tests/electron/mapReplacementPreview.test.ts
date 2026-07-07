import { describe, expect, it } from "vitest";
import { getMapReplacementPreview, type ReadMapMediaDimensions } from "../../electron/mapReplacementPreview";

describe("map replacement preview", () => {
  it("reads current and next dimensions and returns warnings for large differences", async () => {
    const calls: Array<[string, "image" | "video"]> = [];
    const readDimensions: ReadMapMediaDimensions = async (sourcePath, mediaType) => {
      calls.push([sourcePath, mediaType]);
      return sourcePath === "current.png" ? { width: 4000, height: 3000 } : { width: 5200, height: 3000 };
    };

    const preview = await getMapReplacementPreview("current.png", "image", "next.webm", "video", readDimensions);

    expect(calls).toEqual([
      ["current.png", "image"],
      ["next.webm", "video"]
    ]);
    expect(preview.currentDimensions).toEqual({ width: 4000, height: 3000 });
    expect(preview.nextDimensions).toEqual({ width: 5200, height: 3000 });
    expect(preview.warning).toContain("Current map: 4000 x 3000");
  });

  it("omits warnings when dimensions are missing or close enough", async () => {
    await expect(
      getMapReplacementPreview("current.png", "image", "next.png", "image", async () => undefined)
    ).resolves.toEqual({
      currentDimensions: undefined,
      nextDimensions: undefined,
      warning: undefined
    });

    await expect(
      getMapReplacementPreview("current.png", "image", "next.png", "image", async (sourcePath) =>
        sourcePath === "current.png" ? { width: 4000, height: 3000 } : { width: 4200, height: 3100 }
      )
    ).resolves.toEqual({
      currentDimensions: { width: 4000, height: 3000 },
      nextDimensions: { width: 4200, height: 3100 },
      warning: undefined
    });
  });
});
