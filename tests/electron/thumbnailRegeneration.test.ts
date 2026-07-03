import path from "node:path";
import { describe, expect, it } from "vitest";
import { isManualTokenCropThumbnail, regenerateThumbnailAssets, shouldRegenerateAssetThumbnail, type CreateAssetThumbnail } from "../../electron/thumbnailRegeneration";
import { createDefaultCampaign, type Asset, type ThumbnailRegenerationProgress } from "../../src/shared/localvtt";

describe("thumbnail regeneration", () => {
  it("classifies token thumbnails that should not be regenerated", () => {
    expect(isManualTokenCropThumbnail(asset({ id: "token-1", kind: "token", relativePath: "assets/tokens/token-1.png", thumbnailRelativePath: "assets/thumbnails/token-1-crop-123.jpg" }))).toBe(true);
    expect(shouldRegenerateAssetThumbnail(asset({ id: "map-1", kind: "map", relativePath: "assets/maps/map.png", thumbnailRelativePath: "assets/thumbnails/map-1.jpg" }))).toBe(true);
    expect(shouldRegenerateAssetThumbnail(asset({ id: "token-1", kind: "token", relativePath: "assets/tokens/token-1.jpg", thumbnailRelativePath: "assets/tokens/token-1.jpg" }))).toBe(false);
    expect(shouldRegenerateAssetThumbnail(asset({ id: "token-2", kind: "token", relativePath: "assets/tokens/token-2.png", thumbnailRelativePath: "assets/thumbnails/token-2-crop-123.jpg" }))).toBe(false);
    expect(shouldRegenerateAssetThumbnail(asset({ id: "token-3", kind: "token", relativePath: "assets/tokens/token-3.png", thumbnailRelativePath: "assets/thumbnails/token-3.jpg" }))).toBe(true);
  });

  it("regenerates map and token thumbnails while skipping unrelated assets", async () => {
    const campaign = createCampaign([
      asset({ id: "map-1", kind: "map", relativePath: "assets/maps/map.png", thumbnailRelativePath: "assets/thumbnails/old-map.jpg" }),
      asset({ id: "token-1", kind: "token", relativePath: "assets/tokens/hero.png" }),
      asset({ id: "overlay-1", kind: "overlay", relativePath: "assets/overlays/aura.png" })
    ]);
    const progress: ThumbnailRegenerationProgress[] = [];

    const plan = await regenerateThumbnailAssets(
      "campaign-root",
      campaign,
      async (candidate) => ({ thumbnailRelativePath: `assets/thumbnails/${candidate.id}.jpg` }),
      (event) => progress.push(event),
      async () => ({})
    );

    expect(plan.regenerated).toBe(2);
    expect(plan.skipped).toBe(1);
    expect(plan.failed).toEqual([]);
    expect(plan.previousThumbnailPaths.get("map-1")).toBe("assets/thumbnails/old-map.jpg");
    expect(plan.campaign.assets.map((candidate) => candidate.thumbnailRelativePath)).toEqual([
      "assets/thumbnails/map-1.jpg",
      "assets/thumbnails/token-1.jpg",
      undefined
    ]);
    expect(plan.campaign.updatedAt).not.toBe(campaign.updatedAt);
    expect(progress.map((event) => event.message)).toEqual([
      "Preparing thumbnail regeneration.",
      "Regenerating map-1.",
      "Processed map-1.",
      "Regenerating token-1.",
      "Processed token-1."
    ]);
  });

  it("preserves canonical and manually cropped token assets during regeneration", async () => {
    const manualCrop = asset({ id: "manual-crop", kind: "token", relativePath: "assets/tokens/manual.png", thumbnailRelativePath: "assets/thumbnails/manual-crop-123.jpg" });
    const canonical = asset({ id: "canonical", kind: "token", relativePath: "assets/tokens/canonical.jpg", thumbnailRelativePath: "assets/tokens/canonical.jpg" });
    const campaign = createCampaign([
      asset({ id: "map-1", kind: "map", relativePath: "assets/maps/map.png", thumbnailRelativePath: "assets/thumbnails/old-map.jpg" }),
      manualCrop,
      canonical
    ]);

    const plan = await regenerateThumbnailAssets(
      "campaign-root",
      campaign,
      async (candidate) => ({ thumbnailRelativePath: `assets/thumbnails/${candidate.id}.jpg` }),
      undefined,
      async () => ({})
    );

    expect(plan.regenerated).toBe(1);
    expect(plan.skipped).toBe(2);
    expect(plan.campaign.assets).toEqual([
      { ...campaign.assets[0], thumbnailRelativePath: "assets/thumbnails/map-1.jpg" },
      manualCrop,
      canonical
    ]);
  });

  it("records failures when thumbnail creation returns no thumbnail or the source file cannot be read", async () => {
    const campaign = createCampaign([
      asset({ id: "decode-fail", kind: "map", relativePath: "assets/maps/decode-fail.png" }),
      asset({ id: "missing-source", kind: "token", relativePath: "assets/tokens/missing.png" })
    ]);
    const createThumbnail: CreateAssetThumbnail = async () => ({ failureReason: "decode failed" });

    const plan = await regenerateThumbnailAssets("campaign-root", campaign, createThumbnail, undefined, async (filePath) => {
      if (filePath.endsWith(path.join("assets", "tokens", "missing.png"))) {
        throw new Error("missing source");
      }
      return {};
    });

    expect(plan.regenerated).toBe(0);
    expect(plan.skipped).toBe(0);
    expect(plan.campaign).toEqual(campaign);
    expect(plan.failed).toMatchObject([
      { assetId: "decode-fail", reason: "decode failed" },
      { assetId: "missing-source", reason: "missing source" }
    ]);
  });

  it("keeps campaigns unchanged when there are no regenerated thumbnails", async () => {
    const campaign = createCampaign([asset({ id: "overlay-1", kind: "overlay", relativePath: "assets/overlays/aura.png" })]);

    const plan = await regenerateThumbnailAssets("campaign-root", campaign, async () => ({ thumbnailRelativePath: "unexpected.jpg" }), undefined, async () => ({}));

    expect(plan.regenerated).toBe(0);
    expect(plan.skipped).toBe(1);
    expect(plan.campaign).toEqual(campaign);
  });
});

function createCampaign(assets: Asset[]) {
  const campaign = createDefaultCampaign("Thumbnail Regeneration");
  campaign.updatedAt = "2026-07-02T00:00:00.000Z";
  campaign.assets = assets;
  return campaign;
}

function asset(patch: Partial<Asset> & Pick<Asset, "id" | "kind" | "relativePath">): Asset {
  return {
    id: patch.id,
    name: patch.id,
    kind: patch.kind,
    mediaType: "image",
    relativePath: patch.relativePath,
    originalFileName: path.basename(patch.relativePath),
    createdAt: "2026-07-02T00:00:00.000Z",
    ...patch
  };
}
