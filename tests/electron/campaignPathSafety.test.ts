import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertInsidePath, isInsidePath } from "../../electron/campaignPathSafety";

describe("campaign path safety", () => {
  it("accepts the root folder and nested paths", () => {
    expect(isInsidePath("campaign-root", "campaign-root")).toBe(true);
    expect(isInsidePath("campaign-root", path.join("campaign-root", "assets", "maps", "map.png"))).toBe(true);
  });

  it("rejects paths outside the root folder", () => {
    expect(isInsidePath("campaign-root", path.join("campaign-root", "..", "outside", "map.png"))).toBe(false);
    expect(() => assertInsidePath("campaign-root", path.join("campaign-root", "..", "outside", "map.png"))).toThrow(
      "Path is outside the selected campaign folder."
    );
  });

  it("rejects sibling paths that only share the campaign folder prefix", () => {
    const rootPath = path.resolve("campaign-root");

    expect(isInsidePath(rootPath, `${rootPath}-backup`)).toBe(false);
    expect(isInsidePath(rootPath, path.join(path.dirname(rootPath), `${path.basename(rootPath)}-backup`, "map.png"))).toBe(false);
  });

  it("supports caller-provided error messages", () => {
    expect(() => assertInsidePath("campaign-root", path.join("campaign-root", "..", "outside"), "Outside campaign.")).toThrow(
      "Outside campaign."
    );
  });
});
