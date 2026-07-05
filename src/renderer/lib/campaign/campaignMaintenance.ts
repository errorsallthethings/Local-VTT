import type { CampaignSummary, ThumbnailRegenerationProgress } from "../../../shared/localvtt";

export interface CampaignBusyState {
  title: string;
  message: string;
  current: number;
  total: number;
  unitLabel?: string;
}

export type CampaignMaintenanceKind = "thumbnail-regeneration" | "token-asset-promotion" | "unreferenced-asset-pruning";

export function getCampaignMaintenanceInitialBusyState(kind: CampaignMaintenanceKind): CampaignBusyState {
  if (kind === "thumbnail-regeneration") {
    return {
      title: "Regenerating Thumbnails",
      message: "Preparing thumbnail regeneration.",
      current: 0,
      total: 0,
      unitLabel: "assets"
    };
  }
  if (kind === "token-asset-promotion") {
    return {
      title: "Optimizing Tokens",
      message: "Promoting framed token images.",
      current: 0,
      total: 0,
      unitLabel: "assets"
    };
  }
  return {
    title: "Pruning Assets",
    message: "Removing unreferenced campaign assets.",
    current: 0,
    total: 0,
    unitLabel: "assets"
  };
}

export function getThumbnailRegenerationBusyState(progress: ThumbnailRegenerationProgress): CampaignBusyState {
  return {
    title: "Regenerating Thumbnails",
    message: progress.message,
    current: progress.current,
    total: progress.total,
    unitLabel: "assets"
  };
}

export interface RunSavedCampaignMaintenanceOptions<TResult> {
  campaignPath: string | null | undefined;
  campaignAvailable: boolean;
  hasUnsavedChanges: boolean;
  initialBusyState: CampaignBusyState;
  onBusyChange: (busyState: CampaignBusyState | null) => void;
  onComplete: (result: TResult) => void;
  runOperation: (campaignPath: string) => Promise<TResult>;
  saveCampaign: () => Promise<boolean>;
  subscribeProgress?: () => () => void;
}

export async function runSavedCampaignMaintenance<TResult>(options: RunSavedCampaignMaintenanceOptions<TResult>): Promise<boolean> {
  if (!options.campaignPath || !options.campaignAvailable) {
    return false;
  }

  if (options.hasUnsavedChanges) {
    const saved = await options.saveCampaign();
    if (!saved) {
      return false;
    }
  }

  const removeProgressListener = options.subscribeProgress?.();
  options.onBusyChange(options.initialBusyState);
  try {
    const result = await options.runOperation(options.campaignPath);
    options.onComplete(result);
    return true;
  } finally {
    removeProgressListener?.();
    options.onBusyChange(null);
  }
}

export interface CampaignMaintenanceResult {
  campaignSummary: CampaignSummary;
}

export interface CompleteCampaignMaintenanceOptions<TResult extends CampaignMaintenanceResult> {
  result: TResult;
  applySummary: (summary: CampaignSummary) => void;
  setCampaignDirty: (dirty: boolean) => void;
  setError: (message: string | null) => void;
  onComplete: (result: TResult) => void;
}

export function completeCampaignMaintenance<TResult extends CampaignMaintenanceResult>(options: CompleteCampaignMaintenanceOptions<TResult>): void {
  options.applySummary(options.result.campaignSummary);
  options.setCampaignDirty(false);
  options.setError(null);
  options.onComplete(options.result);
}

export interface OpenSavedCampaignHealthOptions {
  campaignPath: string | null | undefined;
  campaignAvailable: boolean;
  hasUnsavedChanges: boolean;
  saveCampaign: () => Promise<boolean>;
  refreshCampaign: (campaignPath: string) => Promise<CampaignSummary>;
  applySummary: (summary: CampaignSummary) => void;
  onOpen: () => void;
}

export async function openSavedCampaignHealth(options: OpenSavedCampaignHealthOptions): Promise<boolean> {
  if (!options.campaignPath || !options.campaignAvailable) {
    return false;
  }

  if (options.hasUnsavedChanges) {
    const saved = await options.saveCampaign();
    if (!saved) {
      return false;
    }
  }

  const summary = await options.refreshCampaign(options.campaignPath);
  options.applySummary(summary);
  options.onOpen();
  return true;
}
