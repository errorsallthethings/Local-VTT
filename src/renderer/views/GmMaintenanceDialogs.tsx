import type { AssetPruneResult, ThumbnailRegenerationResult, TokenAssetPromotionResult } from "../../shared/localvtt";
import type { CampaignHealthReport } from "../../shared/campaignHealth";
import { AssetPruneResultDialog } from "../components/modals/AssetPruneResultDialog";
import { CampaignBusyOverlay } from "../components/modals/CampaignBusyOverlay";
import { CampaignHealthDialog } from "../components/modals/CampaignHealthDialog";
import { ConfirmDialog } from "../components/modals/ConfirmDialog";
import { MetadataBackupRestoreDialog } from "../components/modals/MetadataBackupRestoreDialog";
import { ThumbnailRegenerationResultDialog } from "../components/modals/ThumbnailRegenerationResultDialog";
import { TokenAssetPromotionResultDialog } from "../components/modals/TokenAssetPromotionResultDialog";
import type { CampaignBusyState } from "../hooks/useCampaignActions";
import { formatUserFacingError } from "../lib/errors";
import { logRendererError } from "../lib/rendererDiagnostics";

interface GmMaintenanceDialogsProps {
  assetPruneConfirmOpen: boolean;
  assetPruneResult: AssetPruneResult | null;
  busyState: CampaignBusyState | null;
  campaignHealth: CampaignHealthReport;
  campaignHealthOpen: boolean;
  campaignPath: string | null;
  metadataRestoreOpen: boolean;
  thumbnailRegenerationResult: ThumbnailRegenerationResult | null;
  tokenAssetPromotionResult: TokenAssetPromotionResult | null;
  onCloseAssetPruneConfirm: () => void;
  onCloseAssetPruneResult: () => void;
  onCloseCampaignHealth: () => void;
  onCloseMetadataRestore: () => void;
  onCloseThumbnailRegenerationResult: () => void;
  onCloseTokenAssetPromotionResult: () => void;
  onMetadataRestore: Parameters<typeof MetadataBackupRestoreDialog>[0]["onRestore"];
  onOpenBackupsFolder: () => void;
  onPruneUnreferencedAssets: () => void;
  onSetError: (message: string) => void;
}

export function GmMaintenanceDialogs({
  assetPruneConfirmOpen,
  assetPruneResult,
  busyState,
  campaignHealth,
  campaignHealthOpen,
  campaignPath,
  metadataRestoreOpen,
  thumbnailRegenerationResult,
  tokenAssetPromotionResult,
  onCloseAssetPruneConfirm,
  onCloseAssetPruneResult,
  onCloseCampaignHealth,
  onCloseMetadataRestore,
  onCloseThumbnailRegenerationResult,
  onCloseTokenAssetPromotionResult,
  onMetadataRestore,
  onOpenBackupsFolder,
  onPruneUnreferencedAssets,
  onSetError
}: GmMaintenanceDialogsProps) {
  const pruneCopy = getAssetPruneConfirmCopy(campaignHealth.unreferencedAssets.length);

  return (
    <>
      {metadataRestoreOpen && campaignPath && (
        <MetadataBackupRestoreDialog
          campaignPath={campaignPath}
          onCancel={onCloseMetadataRestore}
          onOpenBackupsFolder={onOpenBackupsFolder}
          onRestore={onMetadataRestore}
          onError={(caught) => {
            logRendererError("LOCALVTT_METADATA_BACKUP_RESTORE_FAILED", caught);
            onSetError(formatUserFacingError(caught));
          }}
        />
      )}
      {campaignHealthOpen && <CampaignHealthDialog health={campaignHealth} onClose={onCloseCampaignHealth} />}
      {assetPruneConfirmOpen && (
        <ConfirmDialog
          title="Prune Unreferenced Assets?"
          confirmLabel="Prune Assets"
          onCancel={onCloseAssetPruneConfirm}
          onConfirm={() => {
            onCloseAssetPruneConfirm();
            onPruneUnreferencedAssets();
          }}
        >
          <p>{pruneCopy.summary}</p>
          <p>{pruneCopy.retention}</p>
        </ConfirmDialog>
      )}
      {busyState && <CampaignBusyOverlay busyState={busyState} />}
      {thumbnailRegenerationResult && <ThumbnailRegenerationResultDialog result={thumbnailRegenerationResult} onClose={onCloseThumbnailRegenerationResult} />}
      {tokenAssetPromotionResult && <TokenAssetPromotionResultDialog result={tokenAssetPromotionResult} onClose={onCloseTokenAssetPromotionResult} />}
      {assetPruneResult && <AssetPruneResultDialog result={assetPruneResult} onClose={onCloseAssetPruneResult} />}
    </>
  );
}

export function getAssetPruneConfirmCopy(unreferencedAssetCount: number): { summary: string; retention: string } {
  const assetLabel = unreferencedAssetCount === 1 ? "asset" : "assets";
  return {
    summary: `This will remove ${unreferencedAssetCount} unreferenced ${assetLabel} from the campaign and delete their unused files from the campaign folder.`,
    retention: "Referenced maps, tokens, player portraits, scene overlays, and turn-order assets will be kept."
  };
}
