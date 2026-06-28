export const MISSING_ASSETS_WARNING_MESSAGE =
  "Some campaign assets could not be found. They may have been moved, renamed, or deleted. Re-import missing files or restore them from a backup:";

export function getMissingAssetsWarningItems(missingAssets: readonly string[]): string[] {
  return [...new Set(missingAssets.filter((asset) => asset.trim().length > 0))];
}
