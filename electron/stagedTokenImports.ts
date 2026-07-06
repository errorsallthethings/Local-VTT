import path from "node:path";

export interface StagedTokenImport {
  assetId: string;
  campaignPath: string;
  createdAt: string;
  finalRelativePath: string;
  sourcePath: string;
}

export interface StagedTokenImportAccess {
  registerTemporaryExternalAssetPath: (sourcePath: string) => void;
  unregisterTemporaryExternalAssetPath: (sourcePath: string) => void;
}

export interface StagedTokenImportStore {
  consume: (assetId: string) => StagedTokenImport | null;
  discardForCampaign: (assetId: string, campaignPath: string) => boolean;
  get: (assetId: string) => StagedTokenImport | null;
  register: (stagedImport: StagedTokenImport) => void;
}

export function createStagedTokenImportStore({
  registerTemporaryExternalAssetPath,
  unregisterTemporaryExternalAssetPath
}: StagedTokenImportAccess): StagedTokenImportStore {
  const stagedTokenImports = new Map<string, StagedTokenImport>();

  const consume = (assetId: string): StagedTokenImport | null => {
    const stagedImport = stagedTokenImports.get(assetId) ?? null;
    if (stagedImport) {
      stagedTokenImports.delete(assetId);
      unregisterTemporaryExternalAssetPath(stagedImport.sourcePath);
    }
    return stagedImport;
  };

  return {
    consume,
    discardForCampaign: (assetId, campaignPath) => {
      const stagedImport = stagedTokenImports.get(assetId);
      if (!stagedImport || path.resolve(stagedImport.campaignPath) !== path.resolve(campaignPath)) {
        return false;
      }
      consume(assetId);
      return true;
    },
    get: (assetId) => stagedTokenImports.get(assetId) ?? null,
    register: (stagedImport) => {
      stagedTokenImports.set(stagedImport.assetId, stagedImport);
      registerTemporaryExternalAssetPath(stagedImport.sourcePath);
    }
  };
}
