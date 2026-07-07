import { describe, expect, it } from "vitest";
import { getMapGridDimensionHint } from "../../src/renderer/lib/map";

describe("map grid filename hints", () => {
  it("reads compact grid dimensions from a map filename", () => {
    expect(getMapGridDimensionHint("Dungeon_Level_02_44x32.webp")).toMatchObject({ columns: 44, rows: 32 });
  });

  it("reads spaced grid dimensions from a map filename", () => {
    expect(getMapGridDimensionHint("Castle Courtyard (30 x 24).jpg")).toMatchObject({ columns: 30, rows: 24 });
  });

  it("ignores common pixel resolutions", () => {
    expect(getMapGridDimensionHint("battle-map-1920x1080.png")).toBeNull();
  });

  it("ignores dimensions that are too large for grid counts", () => {
    expect(getMapGridDimensionHint("massive-map-500x400.png")).toBeNull();
  });
});
