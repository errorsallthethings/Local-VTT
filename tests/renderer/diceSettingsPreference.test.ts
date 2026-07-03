import { describe, expect, it } from "vitest";
import { createDefaultCampaign, DEFAULT_DICE_SETTINGS, type DiceSettings } from "../../src/shared/localvtt";
import { applyDiceSettingsPatch, getEffectiveDiceSettings, normalizeDiceSettingsPreference } from "../../src/renderer/lib/dice";

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

  it("uses campaign dice settings before local preferences", () => {
    const preference = { ...DEFAULT_DICE_SETTINGS, gmDisplayMode: "hidden" as const };
    const campaign = {
      ...createDefaultCampaign("Dice"),
      diceSettings: { ...DEFAULT_DICE_SETTINGS, gmDisplayMode: "panel" as const, playerDisplayMode: "results" as const }
    };

    expect(getEffectiveDiceSettings(null, preference).gmDisplayMode).toBe("hidden");
    expect(getEffectiveDiceSettings(campaign, preference)).toMatchObject({
      gmDisplayMode: "panel",
      playerDisplayMode: "results"
    });
  });

  it("applies dice settings patches to preferences when no campaign is open", () => {
    const result = applyDiceSettingsPatch(DEFAULT_DICE_SETTINGS, { gmDisplayMode: "hidden" }, null, "later");

    expect(result).toEqual({
      kind: "preference",
      settings: { ...DEFAULT_DICE_SETTINGS, gmDisplayMode: "hidden" }
    });
  });

  it("applies dice settings patches to campaign drafts when a campaign is open", () => {
    const campaign = createDefaultCampaign("Dice");
    const result = applyDiceSettingsPatch(DEFAULT_DICE_SETTINGS, { playerPanelPosition: 0.75 }, campaign, "later");

    expect(result.kind).toBe("campaign");
    if (result.kind === "campaign") {
      expect(result.settings.playerPanelPosition).toBe(0.75);
      expect(result.campaign.diceSettings.playerPanelPosition).toBe(0.75);
      expect(result.campaign.updatedAt).toBe("later");
    }
  });
});
