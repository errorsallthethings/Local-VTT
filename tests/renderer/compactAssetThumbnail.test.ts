import { describe, expect, it } from "vitest";
import { shouldShowCompactAssetThumbnail } from "../../src/renderer/components/assets/CompactAssetThumbnail";

describe("compact asset thumbnail", () => {
  it("hides missing, empty, or failed thumbnail previews", () => {
    expect(shouldShowCompactAssetThumbnail(null, null)).toBe(false);
    expect(shouldShowCompactAssetThumbnail("", null)).toBe(false);
    expect(shouldShowCompactAssetThumbnail("C:/tokens/thumb.jpg", "C:/tokens/thumb.jpg")).toBe(false);
  });

  it("shows a thumbnail when it has not failed or the path changed after failure", () => {
    expect(shouldShowCompactAssetThumbnail("C:/tokens/thumb.jpg", null)).toBe(true);
    expect(shouldShowCompactAssetThumbnail("C:/tokens/next-thumb.jpg", "C:/tokens/thumb.jpg")).toBe(true);
  });
});
