import { ColorPickerField } from "../components/controls/ColorPickerField";
import { NameDialog } from "../components/modals/NameDialog";
import type {
  EnvironmentEffectNameDialog,
  FogShapeNameDialog,
  FolderColorDialog,
  FolderNameDialog,
  MapVariantNameDialog,
  SceneColorDialog,
  SceneNameDialog,
  TokenAssetNameDialog,
  TokenColorDialog,
  TokenNameDialog
} from "./GmDialogs";

interface GmNameAndColorDialogsProps {
  campaignNameDialogOpen: boolean;
  environmentEffectDialog: EnvironmentEffectNameDialog | null;
  fogShapeDialog: FogShapeNameDialog | null;
  folderColorDialog: FolderColorDialog | null;
  folderDialog: FolderNameDialog | null;
  mapVariantDialog: MapVariantNameDialog | null;
  newCampaignName: string;
  newEnvironmentEffectName: string;
  newFogShapeName: string;
  newFolderColor: string;
  newFolderName: string;
  newMapVariantName: string;
  newSceneName: string;
  newTokenBorderColor: string;
  newTokenName: string;
  sceneColorDialog: SceneColorDialog | null;
  sceneDialog: SceneNameDialog | null;
  tokenAssetDialog: TokenAssetNameDialog | null;
  tokenColorDialog: TokenColorDialog | null;
  tokenDialog: TokenNameDialog | null;
  onCancelCampaignNameDialog: () => void;
  onCancelEnvironmentEffectDialog: () => void;
  onCancelFogShapeDialog: () => void;
  onCancelFolderColorDialog: () => void;
  onCancelFolderDialog: () => void;
  onCancelMapVariantDialog: () => void;
  onCancelSceneColorDialog: () => void;
  onCancelSceneDialog: () => void;
  onCancelTokenAssetDialog: () => void;
  onCancelTokenColorDialog: () => void;
  onCancelTokenDialog: () => void;
  onNewCampaignNameChange: (value: string) => void;
  onNewEnvironmentEffectNameChange: (value: string) => void;
  onNewFogShapeNameChange: (value: string) => void;
  onNewFolderColorChange: (value: string) => void;
  onNewFolderNameChange: (value: string) => void;
  onNewMapVariantNameChange: (value: string) => void;
  onNewSceneNameChange: (value: string) => void;
  onNewTokenBorderColorChange: (value: string) => void;
  onNewTokenNameChange: (value: string) => void;
  onSubmitCampaignName: () => void;
  onSubmitEnvironmentEffectName: () => void;
  onSubmitFogShapeName: () => void;
  onSubmitFolderColor: () => void;
  onSubmitFolderName: () => void;
  onSubmitMapVariantName: () => void;
  onSubmitSceneColor: () => void;
  onSubmitSceneName: () => void;
  onSubmitTokenAssetName: () => void;
  onSubmitTokenBorderColor: () => void;
  onSubmitTokenName: () => void;
  onUpdateSceneColorDraft: (value: string) => void;
}

export function GmNameAndColorDialogs({
  campaignNameDialogOpen,
  environmentEffectDialog,
  fogShapeDialog,
  folderColorDialog,
  folderDialog,
  mapVariantDialog,
  newCampaignName,
  newEnvironmentEffectName,
  newFogShapeName,
  newFolderColor,
  newFolderName,
  newMapVariantName,
  newSceneName,
  newTokenBorderColor,
  newTokenName,
  sceneColorDialog,
  sceneDialog,
  tokenAssetDialog,
  tokenColorDialog,
  tokenDialog,
  onCancelCampaignNameDialog,
  onCancelEnvironmentEffectDialog,
  onCancelFogShapeDialog,
  onCancelFolderColorDialog,
  onCancelFolderDialog,
  onCancelMapVariantDialog,
  onCancelSceneColorDialog,
  onCancelSceneDialog,
  onCancelTokenAssetDialog,
  onCancelTokenColorDialog,
  onCancelTokenDialog,
  onNewCampaignNameChange,
  onNewEnvironmentEffectNameChange,
  onNewFogShapeNameChange,
  onNewFolderColorChange,
  onNewFolderNameChange,
  onNewMapVariantNameChange,
  onNewSceneNameChange,
  onNewTokenBorderColorChange,
  onNewTokenNameChange,
  onSubmitCampaignName,
  onSubmitEnvironmentEffectName,
  onSubmitFogShapeName,
  onSubmitFolderColor,
  onSubmitFolderName,
  onSubmitMapVariantName,
  onSubmitSceneColor,
  onSubmitSceneName,
  onSubmitTokenAssetName,
  onSubmitTokenBorderColor,
  onSubmitTokenName,
  onUpdateSceneColorDraft
}: GmNameAndColorDialogsProps) {
  return (
    <>
      {sceneDialog && (
        <NameDialog
          title={sceneDialog.mode === "create" ? "New Scene" : "Rename Scene"}
          label="Scene name"
          value={newSceneName}
          submitLabel={sceneDialog.mode === "create" ? "Create" : "Save"}
          onChange={onNewSceneNameChange}
          onCancel={onCancelSceneDialog}
          onSubmit={onSubmitSceneName}
        />
      )}

      {folderDialog && (
        <NameDialog
          title={folderDialog.mode === "create" ? "New Scene Folder" : "Rename Scene Folder"}
          label="Folder name"
          value={newFolderName}
          submitLabel={folderDialog.mode === "create" ? "Create" : "Save"}
          onChange={onNewFolderNameChange}
          onCancel={onCancelFolderDialog}
          onSubmit={onSubmitFolderName}
        />
      )}

      {fogShapeDialog && (
        <NameDialog
          title="Rename Fog Shape"
          label="Fog shape name"
          value={newFogShapeName}
          submitLabel="Save"
          onChange={onNewFogShapeNameChange}
          onCancel={onCancelFogShapeDialog}
          onSubmit={onSubmitFogShapeName}
        />
      )}

      {environmentEffectDialog && (
        <NameDialog
          title="Rename Environmental Effect"
          label="Effect name"
          value={newEnvironmentEffectName}
          submitLabel="Save"
          onChange={onNewEnvironmentEffectNameChange}
          onCancel={onCancelEnvironmentEffectDialog}
          onSubmit={onSubmitEnvironmentEffectName}
        />
      )}

      {tokenDialog && (
        <NameDialog
          title="Rename Token"
          label="Token name"
          value={newTokenName}
          submitLabel="Save"
          onChange={onNewTokenNameChange}
          onCancel={onCancelTokenDialog}
          onSubmit={onSubmitTokenName}
        />
      )}

      {mapVariantDialog && (
        <NameDialog
          title="Rename Map Variant"
          label="Variant name"
          value={newMapVariantName}
          submitLabel="Save"
          onChange={onNewMapVariantNameChange}
          onCancel={onCancelMapVariantDialog}
          onSubmit={onSubmitMapVariantName}
        />
      )}

      {tokenAssetDialog && (
        <NameDialog
          title="Rename Library Token"
          label="Token name"
          value={newTokenName}
          submitLabel="Save"
          onChange={onNewTokenNameChange}
          onCancel={onCancelTokenAssetDialog}
          onSubmit={onSubmitTokenAssetName}
        />
      )}

      {folderColorDialog && (
        <div className="modal-backdrop" onMouseDown={onCancelFolderColorDialog}>
          <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <h2>Change Folder Color</h2>
            <ColorPickerField label={folderColorDialog.folderName} value={newFolderColor} onChange={onNewFolderColorChange} />
            <div className="button-row modal-actions">
              <button onClick={onCancelFolderColorDialog}>Cancel</button>
              <button onClick={onSubmitFolderColor}>Save</button>
            </div>
          </div>
        </div>
      )}

      {sceneColorDialog && (
        <div className="modal-backdrop" onMouseDown={onCancelSceneColorDialog}>
          <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <h2>{sceneColorDialog.title}</h2>
            <ColorPickerField label="Color" value={sceneColorDialog.value} onChange={onUpdateSceneColorDraft} />
            <div className="button-row modal-actions">
              <button onClick={onCancelSceneColorDialog}>Cancel</button>
              <button onClick={onSubmitSceneColor}>Save</button>
            </div>
          </div>
        </div>
      )}

      {tokenColorDialog && (
        <div className="modal-backdrop" onMouseDown={onCancelTokenColorDialog}>
          <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
            <h2>{tokenColorDialog.kind === "glow" ? "Token Glow Color" : "Token Border Color"}</h2>
            <ColorPickerField label={tokenColorDialog.tokenName} value={newTokenBorderColor} onChange={onNewTokenBorderColorChange} />
            <div className="button-row modal-actions">
              <button onClick={onCancelTokenColorDialog}>Cancel</button>
              <button onClick={onSubmitTokenBorderColor}>Save</button>
            </div>
          </div>
        </div>
      )}

      {campaignNameDialogOpen && (
        <NameDialog
          title="Rename Campaign"
          label="Campaign name"
          value={newCampaignName}
          submitLabel="Save"
          onChange={onNewCampaignNameChange}
          onCancel={onCancelCampaignNameDialog}
          onSubmit={onSubmitCampaignName}
        />
      )}
    </>
  );
}
