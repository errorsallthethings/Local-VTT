import { describe, expect, it } from "vitest";
import { DEFAULT_DICE_SETTINGS, type DiceSettings } from "../../src/shared/localvtt";
import { normalizeDiceSettingsPreference } from "../../src/renderer/lib/diceSettingsPreference";

describe("dice settings preferences", () => {
  it("normalizes valid stored dice display preferences", () => {
    const settings = normalizeDiceSettingsPreference({
      gmDisplayMode: "panel",
      playerDisplayMode: "hidden",
      sceneRollEnabled: true,
      sceneRollTarget: "player",
      gmSceneSize: "xl",
      playerSceneSize: "xs",
      gmPanelEdge: "left",
      playerPanelEdge: "bottom",
      gmPanelFacing: "outward",
      playerPanelFacing: "inward",
      gmPanelPosition: 0.25,
      playerPanelPosition: 0.75,
      gmPanelAdvanced: true,
      playerPanelAdvanced: true
    });

    expect(settings).toMatchObject({
      gmDisplayMode: "panel",
      playerDisplayMode: "hidden",
      sceneRollEnabled: true,
      sceneRollTarget: "player",
      gmSceneSize: "xl",
      playerSceneSize: "xs",
      gmPanelEdge: "left",
      playerPanelEdge: "bottom",
      gmPanelFacing: "outward",
      playerPanelFacing: "inward",
      gmPanelPosition: 0.25,
      playerPanelPosition: 0.75,
      gmPanelAdvanced: true,
      playerPanelAdvanced: true
    });
  });

  it("falls back for invalid stored dice display preferences", () => {
    const settings = normalizeDiceSettingsPreference({
      gmDisplayMode: "bad",
      playerDisplayMode: "bad",
      sceneRollEnabled: "yes",
      sceneRollTarget: "table",
      gmSceneSize: "huge",
      playerSceneSize: "tiny",
      gmPanelEdge: "center",
      playerPanelEdge: "middle",
      gmPanelFacing: "sideways",
      playerPanelFacing: "sideways",
      gmPanelPosition: Number.NaN,
      playerPanelPosition: "0.5",
      gmPanelAdvanced: "true",
      playerPanelAdvanced: null
    } as Partial<DiceSettings>);

    expect(settings).toEqual(DEFAULT_DICE_SETTINGS);
  });

  it("clamps panel positions from stored preferences", () => {
    expect(normalizeDiceSettingsPreference({ gmPanelPosition: -1, playerPanelPosition: 2 })).toMatchObject({
      gmPanelPosition: 0,
      playerPanelPosition: 1
    });
  });
});
