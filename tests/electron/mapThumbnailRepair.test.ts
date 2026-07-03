import path from "node:path";
import { describe, expect, it } from "vitest";
import { ensureMapThumbnails, type CreateMapThumbnail } from "../../electron/mapThumbnailRepair";
import { createDefaultCampaign, type Asset } from "../../src/shared/localvtt";

describe("map thumbnail repair", () => {
  it("keeps existing map thumbnails and ignores non-map assets", async () => {
    const campaign = createCampaign([
      asset({ id: "map-1", kind: "map", relativePath: "assets/maps/map.png", thumbnailRelativePath: "assets/thumbnails/map.jpg" }),
      asset({ id: "token-1", kind: "token", relativePath: "assets/tokens/hero.png" })
    ]);
    const createMapThumbnail: CreateMapThumbnail = async () => {
      throw new Error("should not regenerate");
    };

    const repaired = await ensureMapThumbnails("campaign-root", campaign, createMapThumbnail, async () => ({}));

    expect(repaired).toBe(campaign);
  });

  it("regenerates missing map thumbnails when the source file exists", async () => {
    const campaign = createCampaign([
      asset({ id: "map-1", kind: "map", relativePath: "assets/maps/map.png", thumbnailRelativePath: "assets/thumbnails/missing.jpg" })
    ]);
    const calls: string[] = [];
    const repaired = await ensureMapThumbnails(
      "campaign-root",
      campaign,
      async (_campaignPath, sourcePath, assetId) => {
        calls.push(`${assetId}:${sourcePath}`);
        return { thumbnailRelativePath: "assets/thumbnails/map-1.jpg" };
      },
      async (filePath) => {
        if (filePath.endsWith(path.join("assets", "thumbnails", "missing.jpg"))) {
          throw Object.assign(new Error("missing"), { code: "ENOENT" });
        }
        return {};
      }
    );

    expect(calls).toEqual([`map-1:${path.resolve("campaign-root", "assets/maps/map.png")}`]);
    expect(repaired.assets[0].thumbnailRelativePath).toBe("assets/thumbnails/map-1.jpg");
    expect(repaired.updatedAt).not.toBe(campaign.updatedAt);
  });

  it("leaves maps unchanged when the source file is missing or thumbnail creation fails", async () => {
    const campaign = createCampaign([
      asset({ id: "missing-source", kind: "map", relativePath: "assets/maps/missing.png" }),
      asset({ id: "decode-fail", kind: "map", relativePath: "assets/maps/decode-fail.png" })
    ]);

    const repaired = await ensureMapThumbnails(
      "campaign-root",
      campaign,
      async (_campaignPath, _sourcePath, assetId) => (assetId === "decode-fail" ? { failureReason: "decode failed" } : { thumbnailRelativePath: "unexpected.jpg" }),
      async (filePath) => {
        if (filePath.endsWith(path.join("assets", "maps", "missing.png"))) {
          throw Object.assign(new Error("missing"), { code: "ENOENT" });
        }
        return {};
      }
    );

    expect(repaired).toBe(campaign);
  });

  it("ignores unsafe portable map paths instead of throwing during repair", async () => {
    const campaign = createCampaign([asset({ id: "unsafe", kind: "map", relativePath: "../outside.png" })]);

    const repaired = await ensureMapThumbnails("campaign-root", campaign, async () => ({ thumbnailRelativePath: "unexpected.jpg" }), async () => ({}));

    expect(repaired).toBe(campaign);
  });
});

function createCampaign(assets: Asset[]) {
  const campaign = createDefaultCampaign("Map Thumbnail Repair");
  campaign.updatedAt = "2026-07-02T00:00:00.000Z";
  campaign.assets = assets;
  return campaign;
}

function asset(patch: Partial<Asset> & Pick<Asset, "id" | "kind" | "relativePath">): Asset {
  return {
    id: patch.id,
    name: patch.id,
    kind: patch.kind,
    mediaType: patch.kind === "map" ? "image" : "image",
    relativePath: patch.relativePath,
    originalFileName: path.basename(patch.relativePath),
    createdAt: "2026-07-02T00:00:00.000Z",
    ...patch
  };
}
