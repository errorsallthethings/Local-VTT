import { useMemo, useState } from "react";
import {
  DEFAULT_SCENE_FOLDER_COLOR,
  DEFAULT_TOKEN_BORDER_COLOR
} from "../../shared/localvtt";

export interface GmDialogDraftValues {
  newCampaignName: string;
  newEnvironmentEffectName: string;
  newFogShapeName: string;
  newFolderColor: string;
  newFolderName: string;
  newSceneName: string;
  newTokenBorderColor: string;
  newTokenName: string;
}

export interface GmDialogDraftSetters {
  setNewCampaignName: (name: string) => void;
  setNewEnvironmentEffectName: (name: string) => void;
  setNewFogShapeName: (name: string) => void;
  setNewFolderColor: (color: string) => void;
  setNewFolderName: (name: string) => void;
  setNewSceneName: (name: string) => void;
  setNewTokenBorderColor: (color: string) => void;
  setNewTokenName: (name: string) => void;
}

export interface GmDialogDraftDialogProps extends GmDialogDraftValues {
  onNewCampaignNameChange: (name: string) => void;
  onNewEnvironmentEffectNameChange: (name: string) => void;
  onNewFogShapeNameChange: (name: string) => void;
  onNewFolderColorChange: (color: string) => void;
  onNewFolderNameChange: (name: string) => void;
  onNewSceneNameChange: (name: string) => void;
  onNewTokenBorderColorChange: (color: string) => void;
  onNewTokenNameChange: (name: string) => void;
}

export function getInitialGmDialogDraftValues(): GmDialogDraftValues {
  return {
    newCampaignName: "",
    newEnvironmentEffectName: "",
    newFogShapeName: "",
    newFolderColor: DEFAULT_SCENE_FOLDER_COLOR,
    newFolderName: "New Folder",
    newSceneName: "New Battle Map",
    newTokenBorderColor: DEFAULT_TOKEN_BORDER_COLOR,
    newTokenName: ""
  };
}

export function getGmDialogDraftDialogProps(
  values: GmDialogDraftValues,
  setters: GmDialogDraftSetters
): GmDialogDraftDialogProps {
  return {
    ...values,
    onNewCampaignNameChange: setters.setNewCampaignName,
    onNewEnvironmentEffectNameChange: setters.setNewEnvironmentEffectName,
    onNewFogShapeNameChange: setters.setNewFogShapeName,
    onNewFolderColorChange: setters.setNewFolderColor,
    onNewFolderNameChange: setters.setNewFolderName,
    onNewSceneNameChange: setters.setNewSceneName,
    onNewTokenBorderColorChange: setters.setNewTokenBorderColor,
    onNewTokenNameChange: setters.setNewTokenName
  };
}

export function useGmDialogDraftState() {
  const initialValues = useMemo(() => getInitialGmDialogDraftValues(), []);
  const [newCampaignName, setNewCampaignName] = useState(initialValues.newCampaignName);
  const [newEnvironmentEffectName, setNewEnvironmentEffectName] = useState(initialValues.newEnvironmentEffectName);
  const [newFogShapeName, setNewFogShapeName] = useState(initialValues.newFogShapeName);
  const [newFolderColor, setNewFolderColor] = useState(initialValues.newFolderColor);
  const [newFolderName, setNewFolderName] = useState(initialValues.newFolderName);
  const [newSceneName, setNewSceneName] = useState(initialValues.newSceneName);
  const [newTokenBorderColor, setNewTokenBorderColor] = useState(initialValues.newTokenBorderColor);
  const [newTokenName, setNewTokenName] = useState(initialValues.newTokenName);

  const values = useMemo<GmDialogDraftValues>(() => ({
    newCampaignName,
    newEnvironmentEffectName,
    newFogShapeName,
    newFolderColor,
    newFolderName,
    newSceneName,
    newTokenBorderColor,
    newTokenName
  }), [
    newCampaignName,
    newEnvironmentEffectName,
    newFogShapeName,
    newFolderColor,
    newFolderName,
    newSceneName,
    newTokenBorderColor,
    newTokenName
  ]);

  const setters = useMemo<GmDialogDraftSetters>(() => ({
    setNewCampaignName,
    setNewEnvironmentEffectName,
    setNewFogShapeName,
    setNewFolderColor,
    setNewFolderName,
    setNewSceneName,
    setNewTokenBorderColor,
    setNewTokenName
  }), []);

  const dialogProps = useMemo(
    () => getGmDialogDraftDialogProps(values, setters),
    [setters, values]
  );

  return {
    dialogProps,
    setters,
    values
  };
}
