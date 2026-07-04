import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hydrateSceneSummaries } from "../../electron/campaignSceneSummaries";
import { createDefaultCampaign, createDefaultScene } from "../../src/shared/localvtt";

describe("campaign scene summaries", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "localvtt-scene-summaries-"));
    await mkdir(path.join(tempRoot, "scenes"), { recursive: true });
  });

  afterEach(async () => {
    await rm(tempRoot, { recursive: true, force: true });
  });

  it("hydrates missing scene summary fields from valid scene files", async () => {
    const scene = createDefaultScene("Scene One");
    scene.id = "scene-1";
    scene.mapAssetId = "map-1";
    scene.weather = { type: "rain", intensity: 0.5 };
    await writeFile(path.join(tempRoot, "scenes", "scene-1.scene.json"), JSON.stringify(scene), "utf8");
    const campaign = {
      ...createDefaultCampaign("Campaign"),
      scenes: [{ id: "scene-1", name: "Scene One", file: "scenes/scene-1.scene.json" }]
    };

    const hydrated = await hydrateSceneSummaries(tempRoot, campaign);

    expect(hydrated.scenes[0].mapAssetId).toBe("map-1");
    expect(hydrated.scenes[0].weather).toMatchObject({ type: "rain", intensity: 0.5 });
  });

  it("keeps already-hydrated entries without reading scene files", async () => {
    const campaign = {
      ...createDefaultCampaign("Campaign"),
      scenes: [
        {
          id: "scene-1",
          name: "Scene One",
          file: "scenes/missing.scene.json",
          mapAssetId: "map-1",
          weather: { type: "snow", intensity: 0.4 }
        }
      ]
    };

    await expect(hydrateSceneSummaries(tempRoot, campaign)).resolves.toMatchObject({ scenes: campaign.scenes });
  });

  it("leaves entries unchanged when scene files are missing, invalid, or outside the campaign", async () => {
    await writeFile(path.join(tempRoot, "scenes", "invalid.scene.json"), "{nope", "utf8");
    const campaign = {
      ...createDefaultCampaign("Campaign"),
      scenes: [
        { id: "missing", name: "Missing", file: "scenes/missing.scene.json" },
        { id: "invalid", name: "Invalid", file: "scenes/invalid.scene.json" },
        { id: "outside", name: "Outside", file: "../outside.scene.json" },
        { id: "absolute", name: "Absolute", file: path.resolve(tempRoot, "scenes", "scene-1.scene.json") }
      ]
    };

    const hydrated = await hydrateSceneSummaries(tempRoot, campaign);

    expect(hydrated.scenes).toEqual(campaign.scenes);
  });
});
