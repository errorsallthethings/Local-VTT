import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SCENE_FOLDER_COLOR,
  DEFAULT_TOKEN_BORDER_COLOR
} from "../../src/shared/localvtt";
import {
  getGmDialogDraftDialogProps,
  getInitialGmDialogDraftValues,
  type GmDialogDraftSetters,
  type GmDialogDraftValues
} from "../../src/renderer/hooks/useGmDialogDraftState";

function makeValues(): GmDialogDraftValues {
  return {
    newCampaignName: "Campaign",
    newEnvironmentEffectName: "Mist",
    newFogShapeName: "Fog",
    newFolderColor: "#123456",
    newFolderName: "Folder",
    newMapVariantName: "Variant",
    newSceneName: "Scene",
    newTokenBorderColor: "#abcdef",
    newTokenName: "Token"
  };
}

function makeSetters(): GmDialogDraftSetters {
  return {
    setNewCampaignName: vi.fn(),
    setNewEnvironmentEffectName: vi.fn(),
    setNewFogShapeName: vi.fn(),
    setNewFolderColor: vi.fn(),
    setNewFolderName: vi.fn(),
    setNewMapVariantName: vi.fn(),
    setNewSceneName: vi.fn(),
    setNewTokenBorderColor: vi.fn(),
    setNewTokenName: vi.fn()
  };
}

describe("GM dialog draft state", () => {
  it("uses consistent defaults for dialog drafts", () => {
    expect(getInitialGmDialogDraftValues()).toEqual({
      newCampaignName: "",
      newEnvironmentEffectName: "",
      newFogShapeName: "",
      newFolderColor: DEFAULT_SCENE_FOLDER_COLOR,
      newFolderName: "New Folder",
      newMapVariantName: "",
      newSceneName: "New Battle Map",
      newTokenBorderColor: DEFAULT_TOKEN_BORDER_COLOR,
      newTokenName: ""
    });
  });

  it("maps draft values and setters to dialog props", () => {
    const values = makeValues();
    const setters = makeSetters();
    const props = getGmDialogDraftDialogProps(values, setters);

    expect(props).toMatchObject(values);
    props.onNewSceneNameChange("Next Scene");
    props.onNewFolderNameChange("Next Folder");
    props.onNewMapVariantNameChange("Next Variant");
    props.onNewFogShapeNameChange("Next Fog");
    props.onNewEnvironmentEffectNameChange("Next Effect");
    props.onNewTokenNameChange("Next Token");
    props.onNewFolderColorChange("#222222");
    props.onNewTokenBorderColorChange("#333333");
    props.onNewCampaignNameChange("Next Campaign");

    expect(setters.setNewSceneName).toHaveBeenCalledWith("Next Scene");
    expect(setters.setNewFolderName).toHaveBeenCalledWith("Next Folder");
    expect(setters.setNewMapVariantName).toHaveBeenCalledWith("Next Variant");
    expect(setters.setNewFogShapeName).toHaveBeenCalledWith("Next Fog");
    expect(setters.setNewEnvironmentEffectName).toHaveBeenCalledWith("Next Effect");
    expect(setters.setNewTokenName).toHaveBeenCalledWith("Next Token");
    expect(setters.setNewFolderColor).toHaveBeenCalledWith("#222222");
    expect(setters.setNewTokenBorderColor).toHaveBeenCalledWith("#333333");
    expect(setters.setNewCampaignName).toHaveBeenCalledWith("Next Campaign");
  });
});
