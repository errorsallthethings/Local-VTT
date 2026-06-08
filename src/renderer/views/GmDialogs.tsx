import type {
  Asset,
  Campaign,
  CampaignSceneEntry,
  CampaignSceneFolder,
  DisplayCalibration,
  Scene,
  SquareCropRect,
  TokenPresentationDefaults
} from "../../shared/localvtt";
import { ColorPickerField } from "../components/controls/ColorPickerField";
import { ConfirmDialog } from "../components/modals/ConfirmDialog";
import { NameDialog } from "../components/modals/NameDialog";
import { SettingsModal } from "../components/modals/SettingsModal";
import { TokenCropDialog } from "../components/modals/TokenCropDialog";
import { PlayerDisplayScalePanel, type DisplayInfo } from "../components/settings/PlayerDisplayScalePanel";
import { PlayerViewDisplayPanel } from "../components/settings/PlayerViewDisplayPanel";
import { TokenDefaultsPanel } from "../components/tokens/TokenDefaultsPanel";

export type SceneNameDialog = { mode: "create" } | { mode: "rename"; sceneId: string };
export type FolderNameDialog = { mode: "create" } | { mode: "rename"; folderId: string };
export type FolderColorDialog = { folderId: string; folderName: string };
export type SceneColorDialog = { kind: "fog" | "grid"; title: string; value: string };
export type FogShapeNameDialog = { shapeId: string };
export type TokenNameDialog = { tokenId: string };
export type TokenColorDialog = { tokenId: string; tokenName: string; value: string; kind: "border" | "glow" };
export type TokenCropDialogState = { asset: Asset; mode: "scene" | "library" };
export type TokenAssetNameDialog = { assetId: string };
export type TokenDefaultsDialog = { assetId: string; assetName: string; draft: TokenPresentationDefaults };
export type TokenAssetDeleteDialog = { asset: Asset; usage: Array<{ sceneId: string; sceneName: string; count: number }> };

export function GmDialogs({
  sceneDialog,
  folderDialog,
  fogShapeDialog,
  tokenDialog,
  tokenCropDialog,
  tokenAssetDialog,
  tokenDefaultsDialog,
  folderColorDialog,
  sceneColorDialog,
  tokenColorDialog,
  campaignNameDialogOpen,
  playerDisplayDialogOpen,
  playerViewDisplayDialogOpen,
  sceneToDelete,
  folderToDelete,
  mapAssetToDelete,
  tokenAssetToDelete,
  confirmClearFogOpen,
  campaign,
  activeScene,
  playerSceneId,
  dirtySceneIds,
  displays,
  newSceneName,
  newFolderName,
  newFogShapeName,
  newTokenName,
  newFolderColor,
  newTokenBorderColor,
  newCampaignName,
  onNewSceneNameChange,
  onNewFolderNameChange,
  onNewFogShapeNameChange,
  onNewTokenNameChange,
  onNewFolderColorChange,
  onNewTokenBorderColorChange,
  onNewCampaignNameChange,
  onCancelSceneDialog,
  onCancelFolderDialog,
  onCancelFogShapeDialog,
  onCancelTokenDialog,
  onCancelTokenCropDialog,
  onCancelTokenAssetDialog,
  onCancelTokenDefaultsDialog,
  onCancelFolderColorDialog,
  onCancelSceneColorDialog,
  onCancelTokenColorDialog,
  onCancelCampaignNameDialog,
  onCancelPlayerDisplayDialog,
  onCancelPlayerViewDisplayDialog,
  onCancelSceneDelete,
  onCancelFolderDelete,
  onCancelMapAssetDelete,
  onCancelTokenAssetDelete,
  onCancelClearFog,
  onSubmitSceneName,
  onSubmitFolderName,
  onSubmitFogShapeName,
  onSubmitTokenName,
  onSubmitTokenCrop,
  onSubmitTokenAssetName,
  onUpdateTokenDefaultsDraft,
  onSubmitTokenDefaults,
  onUseDefaultTokenCrop,
  onSubmitFolderColor,
  onUpdateSceneColorDraft,
  onSubmitSceneColor,
  onSubmitTokenBorderColor,
  onSubmitCampaignName,
  onUpdatePlayerDisplay,
  onRefreshDisplays,
  onConfirmDeleteScene,
  onConfirmDeleteFolder,
  onConfirmDeleteMapAsset,
  onConfirmDeleteTokenAsset,
  onConfirmClearFog
}: {
  sceneDialog: SceneNameDialog | null;
  folderDialog: FolderNameDialog | null;
  fogShapeDialog: FogShapeNameDialog | null;
  tokenDialog: TokenNameDialog | null;
  tokenCropDialog: TokenCropDialogState | null;
  tokenAssetDialog: TokenAssetNameDialog | null;
  tokenDefaultsDialog: TokenDefaultsDialog | null;
  folderColorDialog: FolderColorDialog | null;
  sceneColorDialog: SceneColorDialog | null;
  tokenColorDialog: TokenColorDialog | null;
  campaignNameDialogOpen: boolean;
  playerDisplayDialogOpen: boolean;
  playerViewDisplayDialogOpen: boolean;
  sceneToDelete: CampaignSceneEntry | null;
  folderToDelete: CampaignSceneFolder | null;
  mapAssetToDelete: Asset | null;
  tokenAssetToDelete: TokenAssetDeleteDialog | null;
  confirmClearFogOpen: boolean;
  campaign: Campaign | null;
  activeScene: Scene | null;
  playerSceneId: string | null;
  dirtySceneIds: Set<string>;
  displays: DisplayInfo[];
  newSceneName: string;
  newFolderName: string;
  newFogShapeName: string;
  newTokenName: string;
  newFolderColor: string;
  newTokenBorderColor: string;
  newCampaignName: string;
  onNewSceneNameChange: (value: string) => void;
  onNewFolderNameChange: (value: string) => void;
  onNewFogShapeNameChange: (value: string) => void;
  onNewTokenNameChange: (value: string) => void;
  onNewFolderColorChange: (value: string) => void;
  onNewTokenBorderColorChange: (value: string) => void;
  onNewCampaignNameChange: (value: string) => void;
  onCancelSceneDialog: () => void;
  onCancelFolderDialog: () => void;
  onCancelFogShapeDialog: () => void;
  onCancelTokenDialog: () => void;
  onCancelTokenCropDialog: () => void;
  onCancelTokenAssetDialog: () => void;
  onCancelTokenDefaultsDialog: () => void;
  onCancelFolderColorDialog: () => void;
  onCancelSceneColorDialog: () => void;
  onCancelTokenColorDialog: () => void;
  onCancelCampaignNameDialog: () => void;
  onCancelPlayerDisplayDialog: () => void;
  onCancelPlayerViewDisplayDialog: () => void;
  onCancelSceneDelete: () => void;
  onCancelFolderDelete: () => void;
  onCancelMapAssetDelete: () => void;
  onCancelTokenAssetDelete: () => void;
  onCancelClearFog: () => void;
  onSubmitSceneName: () => void;
  onSubmitFolderName: () => void;
  onSubmitFogShapeName: () => void;
  onSubmitTokenName: () => void;
  onSubmitTokenCrop: (crop: SquareCropRect) => void;
  onSubmitTokenAssetName: () => void;
  onUpdateTokenDefaultsDraft: (draft: TokenPresentationDefaults) => void;
  onSubmitTokenDefaults: () => void;
  onUseDefaultTokenCrop: () => void;
  onSubmitFolderColor: () => void;
  onUpdateSceneColorDraft: (value: string) => void;
  onSubmitSceneColor: () => void;
  onSubmitTokenBorderColor: () => void;
  onSubmitCampaignName: () => void;
  onUpdatePlayerDisplay: (nextDisplay: DisplayCalibration) => void;
  onRefreshDisplays: () => Promise<boolean | undefined>;
  onConfirmDeleteScene: (scene: CampaignSceneEntry) => void;
  onConfirmDeleteFolder: (folder: CampaignSceneFolder) => void;
  onConfirmDeleteMapAsset: () => void;
  onConfirmDeleteTokenAsset: () => void;
  onConfirmClearFog: () => void;
}) {
  const sceneDeleteDetail = sceneToDelete ? getSceneDeleteDetail(sceneToDelete, dirtySceneIds, playerSceneId) : null;
  const folderDeleteDetail = folderToDelete && campaign ? getFolderDeleteDetail(folderToDelete, campaign, dirtySceneIds, playerSceneId) : null;

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

      {tokenCropDialog && (
        <TokenCropDialog
          asset={tokenCropDialog.asset}
          title={tokenCropDialog.mode === "library" ? "Add Token to Library" : "Frame Token"}
          submitLabel={tokenCropDialog.mode === "library" ? "Add to Library" : "Add Token"}
          onCancel={onCancelTokenCropDialog}
          onUseDefault={onUseDefaultTokenCrop}
          onSubmit={onSubmitTokenCrop}
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

      {tokenDefaultsDialog && (
        <div className="modal-backdrop" onMouseDown={onCancelTokenDefaultsDialog}>
          <div className="modal settings-modal" onMouseDown={(event) => event.stopPropagation()}>
            <h2>Token Defaults</h2>
            <p className="inline-help">Defaults for {tokenDefaultsDialog.assetName} apply to future tokens added from this library asset.</p>
            <TokenDefaultsPanel draft={tokenDefaultsDialog.draft} onChange={onUpdateTokenDefaultsDraft} />
            <div className="button-row modal-actions">
              <button onClick={onCancelTokenDefaultsDialog}>Cancel</button>
              <button onClick={onSubmitTokenDefaults}>Save Defaults</button>
            </div>
          </div>
        </div>
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

      {playerDisplayDialogOpen && campaign && activeScene && (
        <SettingsModal onClose={onCancelPlayerDisplayDialog}>
          <PlayerDisplayScalePanel
            scene={activeScene}
            calibration={campaign.playerDisplay}
            displays={displays}
            onApply={onUpdatePlayerDisplay}
            onRefreshDisplays={onRefreshDisplays}
          />
        </SettingsModal>
      )}

      {playerViewDisplayDialogOpen && campaign && (
        <SettingsModal onClose={onCancelPlayerViewDisplayDialog}>
          <PlayerViewDisplayPanel
            calibration={campaign.playerDisplay}
            displays={displays}
            onApply={onUpdatePlayerDisplay}
            onRefreshDisplays={onRefreshDisplays}
          />
        </SettingsModal>
      )}

      {sceneToDelete && (
        <ConfirmDialog
          title="Delete Scene"
          confirmLabel="Delete"
          onCancel={onCancelSceneDelete}
          onConfirm={() => onConfirmDeleteScene(sceneToDelete)}
        >
          <p>
            Delete <strong>{sceneToDelete.name}</strong>? This removes the scene JSON file from the campaign folder.
          </p>
          {sceneDeleteDetail?.isPlayerScene && <p>This scene is currently shown in Player View. Player View will be closed when the scene is deleted.</p>}
          {sceneDeleteDetail?.isDirty && <p>This scene has unsaved changes. Deleting it will discard those changes.</p>}
        </ConfirmDialog>
      )}

      {folderToDelete && (
        <ConfirmDialog
          title="Delete Scene Folder"
          confirmLabel="Delete Folder"
          onCancel={onCancelFolderDelete}
          onConfirm={() => onConfirmDeleteFolder(folderToDelete)}
        >
          <p>
            Delete <strong>{folderToDelete.name}</strong>? The folder will be removed, but its scenes will not be deleted.
          </p>
          <p>{formatFolderDeleteSceneCount(folderDeleteDetail?.sceneCount ?? 0)} will move to Unfiled Scenes.</p>
          {folderDeleteDetail && folderDeleteDetail.dirtySceneCount > 0 && (
            <p>
              {folderDeleteDetail.dirtySceneCount} unsaved scene{folderDeleteDetail.dirtySceneCount === 1 ? "" : "s"} in this folder will keep their unsaved changes.
            </p>
          )}
          {folderDeleteDetail?.containsPlayerScene && <p>This folder contains the scene currently shown in Player View. Player View will stay open.</p>}
        </ConfirmDialog>
      )}

      {mapAssetToDelete && (
        <ConfirmDialog
          title="Delete Map Asset"
          confirmLabel="Delete Asset"
          onCancel={onCancelMapAssetDelete}
          onConfirm={onConfirmDeleteMapAsset}
        >
          Delete <strong>{mapAssetToDelete.name}</strong> from the campaign folder? This cannot be undone.
        </ConfirmDialog>
      )}

      {tokenAssetToDelete && (
        <ConfirmDialog title="Delete Library Token" confirmLabel="Delete" onCancel={onCancelTokenAssetDelete} onConfirm={onConfirmDeleteTokenAsset}>
          Delete <strong>{tokenAssetToDelete.asset.name}</strong> from the token library? This cannot be undone.
          {tokenAssetToDelete.usage.length > 0 && (
            <>
              {" "}
              This will also remove {formatTokenAssetUsage(tokenAssetToDelete.usage)}:
              <ul className="confirm-detail-list">
                {tokenAssetToDelete.usage.map((scene) => (
                  <li key={scene.sceneId}>
                    {scene.sceneName} ({scene.count})
                  </li>
                ))}
              </ul>
            </>
          )}
        </ConfirmDialog>
      )}

      {confirmClearFogOpen && (
        <ConfirmDialog
          title="Clear Fog Shapes"
          confirmLabel="Clear Fog"
          onCancel={onCancelClearFog}
          onConfirm={onConfirmClearFog}
        >
          Delete all fog reveal and hide shapes from this scene? This cannot be undone.
        </ConfirmDialog>
      )}
    </>
  );
}

function getSceneDeleteDetail(scene: CampaignSceneEntry, dirtySceneIds: Set<string>, playerSceneId: string | null) {
  return {
    isDirty: dirtySceneIds.has(scene.id),
    isPlayerScene: playerSceneId === scene.id
  };
}

function getFolderDeleteDetail(folder: CampaignSceneFolder, campaign: Campaign, dirtySceneIds: Set<string>, playerSceneId: string | null) {
  const folderScenes = campaign.scenes.filter((scene) => scene.folderId === folder.id);
  return {
    sceneCount: folderScenes.length,
    dirtySceneCount: folderScenes.filter((scene) => dirtySceneIds.has(scene.id)).length,
    containsPlayerScene: Boolean(playerSceneId && folderScenes.some((scene) => scene.id === playerSceneId))
  };
}

function formatFolderDeleteSceneCount(sceneCount: number): string {
  if (sceneCount === 0) {
    return "No scenes";
  }
  if (sceneCount === 1) {
    return "1 scene";
  }
  return `${sceneCount} scenes`;
}

function formatTokenAssetUsage(usage: Array<{ sceneId: string; sceneName: string; count: number }>): string {
  const tokenCount = usage.reduce((total, scene) => total + scene.count, 0);
  const sceneCount = usage.length;
  return `${tokenCount} token instance${tokenCount === 1 ? "" : "s"} from ${sceneCount} scene${sceneCount === 1 ? "" : "s"}`;
}
