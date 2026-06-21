import { describe, expect, it } from "vitest";
import {
  getSnappedTokenPosition,
  getTokenHexFootprintCenters,
  isTokenRevealedByFog
} from "../../src/renderer/canvas/tokens";
import { createDefaultScene, type Token } from "../../src/shared/localvtt";

function token(patch: Partial<Token> = {}): Token {
  return {
    id: "token-1",
    name: "Token",
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
    hidden: false,
    visibleInPlayer: true,
    ...patch
  };
}

describe("token geometry", () => {
  it("snaps tiny square-grid tokens to cell centers", () => {
    const scene = createDefaultScene("Square");
    scene.grid = { ...scene.grid, type: "square", sizePx: 100, offsetX: 0, offsetY: 0 };
    const tinyToken = token({ sizePreset: "tiny", size: { width: 50, height: 50 } });

    expect(getSnappedTokenPosition({ x: 12, y: 18 }, tinyToken, scene)).toEqual({ x: 25, y: 25 });
  });

  it("snaps medium square-grid tokens to grid corners", () => {
    const scene = createDefaultScene("Square");
    scene.grid = { ...scene.grid, type: "square", sizePx: 100, offsetX: 0, offsetY: 0 };
    const mediumToken = token({ sizePreset: "medium", size: { width: 100, height: 100 } });

    expect(getSnappedTokenPosition({ x: 62, y: 141 }, mediumToken, scene)).toEqual({ x: 100, y: 100 });
  });

  it("uses expected hex footprint counts for supported token sizes", () => {
    const scene = createDefaultScene("Hex");
    scene.grid = { ...scene.grid, type: "hex", sizePx: 100, offsetX: 0, offsetY: 0 };

    expect(getTokenHexFootprintCenters(scene, token({ sizePreset: "large" }))).toHaveLength(3);
    expect(getTokenHexFootprintCenters(scene, token({ sizePreset: "huge" }))).toHaveLength(7);
    expect(getTokenHexFootprintCenters(scene, token({ sizePreset: "gargantuan" }))).toHaveLength(19);
  });

  it("reveals a token when any sampled part overlaps a player-visible reveal shape", () => {
    const scene = createDefaultScene("Fog");
    scene.fog.mode = "partial";
    scene.fog.shapes = [
      {
        id: "reveal-edge",
        operation: "reveal",
        kind: "rectangle",
        points: [
          { x: 90, y: 90 },
          { x: 120, y: 120 }
        ],
        visibleInPlayer: true
      }
    ];

    expect(isTokenRevealedByFog(token({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }), scene)).toBe(true);
  });

  it("ignores GM-only reveal shapes for Player View token reveal checks", () => {
    const scene = createDefaultScene("Fog");
    scene.fog.mode = "partial";
    scene.fog.shapes = [
      {
        id: "gm-only",
        operation: "reveal",
        kind: "rectangle",
        points: [
          { x: 0, y: 0 },
          { x: 120, y: 120 }
        ],
        visibleInPlayer: false
      }
    ];

    expect(isTokenRevealedByFog(token(), scene)).toBe(false);
  });
});
