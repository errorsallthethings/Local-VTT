import { describe, expect, it, vi } from "vitest";
import { getTokenLibraryAssetDragId, hasTokenLibraryAssetDrag, TOKEN_LIBRARY_ASSET_DRAG_TYPE } from "../../src/renderer/lib/tokens";

describe("drag type helpers", () => {
  it("detects token library asset drags from DataTransfer types", () => {
    expect(hasTokenLibraryAssetDrag([TOKEN_LIBRARY_ASSET_DRAG_TYPE, "text/plain"])).toBe(true);
    expect(hasTokenLibraryAssetDrag(["text/plain"])).toBe(false);
  });

  it("reads token library asset ids from the expected drag type", () => {
    const getData = vi.fn((type: string) => (type === TOKEN_LIBRARY_ASSET_DRAG_TYPE ? "asset-1" : ""));

    expect(getTokenLibraryAssetDragId({ getData })).toBe("asset-1");
    expect(getData).toHaveBeenCalledWith(TOKEN_LIBRARY_ASSET_DRAG_TYPE);
  });
});
