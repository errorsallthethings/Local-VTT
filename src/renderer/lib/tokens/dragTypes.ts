export const TOKEN_LIBRARY_ASSET_DRAG_TYPE = "application/x-localvtt-token-library-asset-id";

export function hasTokenLibraryAssetDrag(types: DOMStringList | readonly string[]): boolean {
  return Array.from(types).includes(TOKEN_LIBRARY_ASSET_DRAG_TYPE);
}

export function getTokenLibraryAssetDragId(dataTransfer: Pick<DataTransfer, "getData">): string {
  return dataTransfer.getData(TOKEN_LIBRARY_ASSET_DRAG_TYPE);
}
