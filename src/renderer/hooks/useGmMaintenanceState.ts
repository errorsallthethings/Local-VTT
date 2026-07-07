import { useCallback, useMemo, useReducer } from "react";
import type { AssetPruneResult, ThumbnailRegenerationResult, TokenAssetPromotionResult } from "../../shared/localvtt";
import type { CampaignBusyState, MapReplacementPreview } from "./useCampaignActions";

export interface GmMaintenanceState {
  assetPruneConfirmOpen: boolean;
  assetPruneResult: AssetPruneResult | null;
  busyState: CampaignBusyState | null;
  campaignHealthOpen: boolean;
  mapReplacementPreview: MapReplacementPreview | null;
  metadataRestoreOpen: boolean;
  thumbnailRegenerationResult: ThumbnailRegenerationResult | null;
  tokenAssetPromotionResult: TokenAssetPromotionResult | null;
}

export type GmMaintenanceAction =
  | { type: "assetPruneConfirmOpened" }
  | { type: "assetPruneConfirmClosed" }
  | { type: "assetPruneCompleted"; result: AssetPruneResult }
  | { type: "assetPruneResultClosed" }
  | { type: "busyChanged"; busyState: CampaignBusyState | null }
  | { type: "campaignHealthOpened" }
  | { type: "campaignHealthClosed" }
  | { type: "mapReplacementPreviewed"; preview: MapReplacementPreview }
  | { type: "mapReplacementHandled" }
  | { type: "metadataRestoreOpened" }
  | { type: "metadataRestoreClosed" }
  | { type: "thumbnailRegenerationCompleted"; result: ThumbnailRegenerationResult }
  | { type: "thumbnailRegenerationResultClosed" }
  | { type: "tokenAssetPromotionCompleted"; result: TokenAssetPromotionResult }
  | { type: "tokenAssetPromotionResultClosed" };

export const INITIAL_GM_MAINTENANCE_STATE: GmMaintenanceState = {
  assetPruneConfirmOpen: false,
  assetPruneResult: null,
  busyState: null,
  campaignHealthOpen: false,
  mapReplacementPreview: null,
  metadataRestoreOpen: false,
  thumbnailRegenerationResult: null,
  tokenAssetPromotionResult: null
};

export function gmMaintenanceReducer(state: GmMaintenanceState, action: GmMaintenanceAction): GmMaintenanceState {
  switch (action.type) {
    case "assetPruneConfirmOpened":
      return { ...state, assetPruneConfirmOpen: true };
    case "assetPruneConfirmClosed":
      return { ...state, assetPruneConfirmOpen: false };
    case "assetPruneCompleted":
      return { ...state, assetPruneResult: action.result };
    case "assetPruneResultClosed":
      return { ...state, assetPruneResult: null };
    case "busyChanged":
      return { ...state, busyState: action.busyState };
    case "campaignHealthOpened":
      return { ...state, campaignHealthOpen: true };
    case "campaignHealthClosed":
      return { ...state, campaignHealthOpen: false };
    case "mapReplacementPreviewed":
      return { ...state, mapReplacementPreview: action.preview };
    case "mapReplacementHandled":
      return { ...state, mapReplacementPreview: null };
    case "metadataRestoreOpened":
      return { ...state, metadataRestoreOpen: true };
    case "metadataRestoreClosed":
      return { ...state, metadataRestoreOpen: false };
    case "thumbnailRegenerationCompleted":
      return { ...state, thumbnailRegenerationResult: action.result };
    case "thumbnailRegenerationResultClosed":
      return { ...state, thumbnailRegenerationResult: null };
    case "tokenAssetPromotionCompleted":
      return { ...state, tokenAssetPromotionResult: action.result };
    case "tokenAssetPromotionResultClosed":
      return { ...state, tokenAssetPromotionResult: null };
    default:
      return state;
  }
}

export function useGmMaintenanceState() {
  const [state, dispatch] = useReducer(gmMaintenanceReducer, INITIAL_GM_MAINTENANCE_STATE);

  const openAssetPruneConfirm = useCallback(() => dispatch({ type: "assetPruneConfirmOpened" }), []);
  const closeAssetPruneConfirm = useCallback(() => dispatch({ type: "assetPruneConfirmClosed" }), []);
  const closeAssetPruneResult = useCallback(() => dispatch({ type: "assetPruneResultClosed" }), []);
  const closeCampaignHealth = useCallback(() => dispatch({ type: "campaignHealthClosed" }), []);
  const closeMapReplacementPreview = useCallback(() => dispatch({ type: "mapReplacementHandled" }), []);
  const closeMetadataRestore = useCallback(() => dispatch({ type: "metadataRestoreClosed" }), []);
  const closeThumbnailRegenerationResult = useCallback(() => dispatch({ type: "thumbnailRegenerationResultClosed" }), []);
  const closeTokenAssetPromotionResult = useCallback(() => dispatch({ type: "tokenAssetPromotionResultClosed" }), []);

  const campaignActionCallbacks = useMemo(() => ({
    onAssetPruneComplete: (result: AssetPruneResult) => dispatch({ type: "assetPruneCompleted", result }),
    onBusyChange: (busyState: CampaignBusyState | null) => dispatch({ type: "busyChanged", busyState }),
    onCampaignHealthOpen: () => dispatch({ type: "campaignHealthOpened" }),
    onMapReplacementHandled: () => dispatch({ type: "mapReplacementHandled" }),
    onMapReplacementPreview: (preview: MapReplacementPreview) => dispatch({ type: "mapReplacementPreviewed", preview }),
    onMetadataRestoreClosed: () => dispatch({ type: "metadataRestoreClosed" }),
    onMetadataRestoreOpen: () => dispatch({ type: "metadataRestoreOpened" }),
    onThumbnailRegenerationComplete: (result: ThumbnailRegenerationResult) => dispatch({ type: "thumbnailRegenerationCompleted", result }),
    onTokenAssetPromotionComplete: (result: TokenAssetPromotionResult) => dispatch({ type: "tokenAssetPromotionCompleted", result })
  }), []);

  const dialogActions = useMemo(() => ({
    onCloseAssetPruneConfirm: closeAssetPruneConfirm,
    onCloseAssetPruneResult: closeAssetPruneResult,
    onCloseCampaignHealth: closeCampaignHealth,
    onCloseMetadataRestore: closeMetadataRestore,
    onCloseThumbnailRegenerationResult: closeThumbnailRegenerationResult,
    onCloseTokenAssetPromotionResult: closeTokenAssetPromotionResult
  }), [
    closeAssetPruneConfirm,
    closeAssetPruneResult,
    closeCampaignHealth,
    closeMetadataRestore,
    closeThumbnailRegenerationResult,
    closeTokenAssetPromotionResult
  ]);

  return {
    ...state,
    campaignActionCallbacks,
    closeMapReplacementPreview,
    dialogActions,
    openAssetPruneConfirm
  };
}
