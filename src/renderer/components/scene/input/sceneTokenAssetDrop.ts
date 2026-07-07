import type { Asset, Campaign } from "../../../../shared/localvtt";
import { getTokenLibraryAssetDragId, hasTokenLibraryAssetDrag } from "../../../lib/tokens";

export interface TokenAssetDropAvailabilityOptions {
  dataTransferTypes: DOMStringList | readonly string[];
  hasCampaign: boolean;
  hasDropHandler: boolean;
  hasScene: boolean;
  mode: "gm" | "player";
}

export function canAcceptTokenAssetDrop(options: TokenAssetDropAvailabilityOptions): boolean {
  return Boolean(
    options.mode === "gm" &&
      options.hasScene &&
      options.hasCampaign &&
      options.hasDropHandler &&
      hasTokenLibraryAssetDrag(options.dataTransferTypes)
  );
}

export function getDroppedTokenAsset(campaign: Campaign | null | undefined, dataTransfer: Pick<DataTransfer, "getData">): Asset | null {
  const assetId = getTokenLibraryAssetDragId(dataTransfer);
  return campaign?.assets.find((candidate) => candidate.id === assetId && candidate.kind === "token") ?? null;
}
