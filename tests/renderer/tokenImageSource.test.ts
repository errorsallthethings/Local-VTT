import { describe, expect, it } from "vitest";
import { parseTokenImageSourceKey } from "../../src/renderer/canvas/tokenImageSource";

describe("token image source parsing", () => {
  it("returns valid image sources from a JSON array", () => {
    expect(parseTokenImageSourceKey(JSON.stringify([{ id: "asset-1", path: "C:/maps/token.png" }]))).toEqual([
      { id: "asset-1", path: "C:/maps/token.png" }
    ]);
  });

  it("filters entries without usable ids or paths", () => {
    const key = JSON.stringify([
      { id: "asset-1", path: "C:/maps/token.png" },
      { id: "", path: "C:/maps/missing-id.png" },
      { id: "asset-2", path: "" },
      { id: "asset-3" },
      null,
      "not-an-object"
    ]);

    expect(parseTokenImageSourceKey(key)).toEqual([{ id: "asset-1", path: "C:/maps/token.png" }]);
  });

  it("returns an empty list for invalid or unexpected JSON", () => {
    expect(parseTokenImageSourceKey("{")).toEqual([]);
    expect(parseTokenImageSourceKey(JSON.stringify({ id: "asset-1", path: "C:/maps/token.png" }))).toEqual([]);
  });
});
