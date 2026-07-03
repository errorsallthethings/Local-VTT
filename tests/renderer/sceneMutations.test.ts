import { describe, expect, it } from "vitest";
import { createDefaultScene, type EnvironmentEffectMask, type FogShape, type Token } from "../../src/shared/localvtt";
import {
  applySceneColorDialog,
  getSceneColorDialogState,
  getSceneItemRenameName,
  getTokenColorDialogState,
  renameEnvironmentEffect,
  renameFogShape,
  renameSceneToken,
  setSceneTokenColor
} from "../../src/renderer/lib/scene";

const now = "2026-07-03T12:00:00.000Z";

function fogShape(patch: Partial<FogShape> = {}): FogShape {
  return {
    id: "fog-1",
    operation: "hide",
    kind: "rectangle",
    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    visibleInGm: true,
    visibleInPlayer: true,
    ...patch
  };
}

function environmentEffect(patch: Partial<EnvironmentEffectMask> = {}): EnvironmentEffectMask {
  return {
    id: "effect-1",
    kind: "rectangle",
    effect: "water",
    points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
    visibleInGm: true,
    visibleInPlayer: true,
    ...patch
  };
}

function token(patch: Partial<Token> = {}): Token {
  return {
    id: "token-1",
    name: "Old Token",
    assetId: "asset-1",
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
    hidden: false,
    visibleInGm: true,
    visibleInPlayer: true,
    ...patch
  };
}

describe("scene mutation helpers", () => {
  it("derives rename dialog names with fallback labels", () => {
    const scene = createDefaultScene("Names");
    scene.fog.shapes = [fogShape({ name: "  Hidden Door  " })];
    scene.environment.effects = [environmentEffect({ name: "" })];
    scene.tokens = [token({ name: "  Rogue  " })];

    expect(getSceneItemRenameName(scene, "fog-shape", "fog-1", "Fallback Fog")).toBe("Hidden Door");
    expect(getSceneItemRenameName(scene, "environment-effect", "effect-1", "Fallback Effect")).toBe("Fallback Effect");
    expect(getSceneItemRenameName(scene, "token", "token-1", "Fallback Token")).toBe("Rogue");
    expect(getSceneItemRenameName(null, "token", "token-1", "Fallback Token")).toBe("Fallback Token");
  });

  it("renames fog shapes and rejects blank names", () => {
    const scene = createDefaultScene("Fog");
    scene.fog.shapes = [fogShape()];

    expect(renameFogShape(scene, "fog-1", "  Secret Fog  ", now)?.fog.shapes[0].name).toBe("Secret Fog");
    expect(renameFogShape(scene, "fog-1", "   ", now)).toBeNull();
  });

  it("renames environment effects and tokens", () => {
    const scene = createDefaultScene("Names");
    scene.environment.effects = [environmentEffect()];
    scene.tokens = [token()];

    const withEffectName = renameEnvironmentEffect(scene, "effect-1", "  Acid Pool  ", now);
    expect(withEffectName?.environment.effects[0].name).toBe("Acid Pool");
    expect(withEffectName?.updatedAt).toBe(now);

    const withTokenName = renameSceneToken(scene, "token-1", "  Rogue  ", now);
    expect(withTokenName?.tokens[0].name).toBe("Rogue");
    expect(withTokenName?.updatedAt).toBe(now);
    expect(renameSceneToken(scene, "token-1", "   ", now)).toBeNull();
  });

  it("builds scene color dialog state and routes color patches", () => {
    const scene = createDefaultScene("Colors");
    scene.fog.color = "#111111";
    scene.grid.color = "#222222";

    expect(getSceneColorDialogState(scene, "fog")).toEqual({
      kind: "fog",
      title: "Fog Color",
      value: "#111111"
    });
    expect(getSceneColorDialogState(scene, "grid")).toEqual({
      kind: "grid",
      title: "Grid Color",
      value: "#222222"
    });
    expect(applySceneColorDialog({ kind: "fog", title: "Fog Color", value: "#abcdef" })).toEqual({
      fogPatch: { color: "#abcdef" },
      gridPatch: null
    });
    expect(applySceneColorDialog({ kind: "grid", title: "Grid Color", value: "#fedcba" })).toEqual({
      fogPatch: null,
      gridPatch: { color: "#fedcba" }
    });
  });

  it("builds token color dialog state with token name fallback", () => {
    const scene = createDefaultScene("Token Color Dialog");
    scene.tokens = [token({ name: "  Rogue  " })];

    expect(getTokenColorDialogState(scene, "token-1", "#abcdef", "glow")).toEqual({
      tokenId: "token-1",
      tokenName: "Rogue",
      value: "#abcdef",
      kind: "glow"
    });
    expect(getTokenColorDialogState(scene, "missing", "#abcdef", "border").tokenName).toBe("Token");
  });

  it("sets token border and glow colors", () => {
    const scene = createDefaultScene("Token Color");
    scene.tokens = [token()];

    const withBorder = setSceneTokenColor(scene, "token-1", "#ff0000", "border", now);
    expect(withBorder.tokens[0].borderColor).toBe("#ff0000");
    expect(withBorder.tokens[0].glowColor).toBeUndefined();
    expect(withBorder.updatedAt).toBe(now);

    const withGlow = setSceneTokenColor(scene, "token-1", "#00ff00", "glow", now);
    expect(withGlow.tokens[0].glowColor).toBe("#00ff00");
    expect(withGlow.tokens[0].borderColor).toBeUndefined();
  });
});
