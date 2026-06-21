import { describe, expect, it } from "vitest";
import {
  parseCampaignMetadata,
  parseSceneMetadata,
  toPortableCampaignMetadata,
  toPortableSceneMetadata
} from "../../electron/persistenceCodecs";
import { createDefaultCampaign, createDefaultScene, type Asset, type Scene } from "../../src/shared/localvtt";

describe("persistence codecs", () => {
  it("strips runtime-only asset paths before campaign metadata is saved", () => {
    const campaign = createDefaultCampaign("Portable Campaign");
    const asset: Asset = {
      id: "map-1",
      name: "Map",
      kind: "map",
      mediaType: "image",
      relativePath: "assets/maps/map.png",
      thumbnailRelativePath: "assets/thumbnails/map-1.jpg",
      originalFileName: "map.png",
      createdAt: "2026-06-01T00:00:00.000Z",
      absolutePath: "C:\\Campaign\\assets\\maps\\map.png",
      thumbnailAbsolutePath: "C:\\Campaign\\assets\\thumbnails\\map-1.jpg"
    };
    campaign.assets = [asset];

    const portable = toPortableCampaignMetadata(campaign);
    const persistedJson = JSON.stringify(portable);

    expect(portable.assets[0]).toMatchObject({
      id: "map-1",
      relativePath: "assets/maps/map.png",
      thumbnailRelativePath: "assets/thumbnails/map-1.jpg"
    });
    expect(portable.assets[0]).not.toHaveProperty("absolutePath");
    expect(portable.assets[0]).not.toHaveProperty("thumbnailAbsolutePath");
    expect(persistedJson).not.toContain("C:\\Campaign");
  });

  it("normalizes scene metadata before saving", () => {
    const legacyScene = {
      ...createDefaultScene("Legacy Scene"),
      tokens: undefined,
      layers: []
    } as Partial<Scene> as Scene;

    const portable = toPortableSceneMetadata(legacyScene);

    expect(portable.tokens).toEqual([]);
    expect(portable.layers.length).toBeGreaterThan(0);
    expect(portable.schemaVersion).toBeDefined();
  });

  it("parses valid campaign and scene metadata", () => {
    const campaign = createDefaultCampaign("Parsed Campaign");
    const scene = createDefaultScene("Parsed Scene");

    expect(parseCampaignMetadata(JSON.stringify(campaign)).id).toBe(campaign.id);
    expect(parseSceneMetadata(JSON.stringify(scene)).id).toBe(scene.id);
  });

  it("rejects invalid campaign and scene metadata", () => {
    expect(() => parseCampaignMetadata(JSON.stringify({ id: "", name: "Broken", scenes: [] }))).toThrow(/Invalid campaign/);
    expect(() => parseSceneMetadata(JSON.stringify({ id: "scene", name: "Broken", layers: "nope" }))).toThrow(/Invalid scene/);
  });
});
