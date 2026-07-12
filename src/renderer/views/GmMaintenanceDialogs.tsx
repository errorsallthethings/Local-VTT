import type { AssetCleanupPreviewResult, AssetPruneResult, ThumbnailRegenerationResult, TokenAssetPromotionResult } from "../../shared/localvtt";
import type { CampaignHealthReport } from "../../shared/campaignHealth";
import { AssetCleanupPreviewDialog } from "../components/modals/AssetCleanupPreviewDialog";
import { AssetPruneResultDialog } from "../components/modals/AssetPruneResultDialog";
import { CampaignBusyOverlay } from "../components/modals/CampaignBusyOverlay";
import { CampaignHealthDialog } from "../components/modals/CampaignHealthDialog";
import { MetadataBackupRestoreDialog } from "../components/modals/MetadataBackupRestoreDialog";
import { ThumbnailRegenerationResultDialog } from "../components/modals/ThumbnailRegenerationResultDialog";
import { TokenAssetPromotionResultDialog } from "../components/modals/TokenAssetPromotionResultDialog";
import type { CampaignBusyState } from "../hooks/useCampaignActions";
import { formatUserFacingError } from "../lib/errors";
import { logRendererError } from "../lib/rendererDiagnostics";

interface GmMaintenanceDialogsProps {
  assetCleanupPreview: AssetCleanupPreviewResult | null;
  assetPruneResult: AssetPruneResult | null;
  busyState: CampaignBusyState | null;
  campaignHealth: CampaignHealthReport;
  campaignHealthOpen: boolean;
  campaignPath: string | null;
  metadataRestoreOpen: boolean;
  thumbnailRegenerationResult: ThumbnailRegenerationResult | null;
  tokenAssetPromotionResult: TokenAssetPromotionResult | null;
  onCloseAssetCleanupPreview: () => void;
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
  assetPruneResult,
  assetCleanupPreview,
  busyState,
  campaignHealth,
  campaignHealthOpen,
  campaignPath,
  metadataRestoreOpen,
  thumbnailRegenerationResult,
  tokenAssetPromotionResult,
  onCloseAssetCleanupPreview,
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
      {assetCleanupPreview && (
        <AssetCleanupPreviewDialog
          preview={assetCleanupPreview}
          onCancel={onCloseAssetCleanupPreview}
          onConfirm={() => {
            onCloseAssetCleanupPreview();
            onPruneUnreferencedAssets();
          }}
        />
      )}
      {busyState && <CampaignBusyOverlay busyState={busyState} />}
      {thumbnailRegenerationResult && <ThumbnailRegenerationResultDialog result={thumbnailRegenerationResult} onClose={onCloseThumbnailRegenerationResult} />}
      {tokenAssetPromotionResult && <TokenAssetPromotionResultDialog result={tokenAssetPromotionResult} onClose={onCloseTokenAssetPromotionResult} />}
      {assetPruneResult && <AssetPruneResultDialog result={assetPruneResult} onClose={onCloseAssetPruneResult} />}
    </>
  );
}
