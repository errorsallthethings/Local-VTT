import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createStagedTokenImportStore, type StagedTokenImport } from "../../electron/stagedTokenImports";

function stagedImport(overrides: Partial<StagedTokenImport> = {}): StagedTokenImport {
  return {
    assetId: "token-1",
    campaignPath: path.join("C:", "Campaigns", "One"),
    createdAt: "2026-07-05T12:00:00.000Z",
    finalRelativePath: "assets/tokens/token-1.jpg",
    sourcePath: path.join("C:", "Imports", "hero.png"),
    ...overrides
  };
}

describe("staged token import store", () => {
  it("registers temporary external access while a token import is staged", () => {
    const access = {
      registerTemporaryExternalAssetPath: vi.fn(),
      unregisterTemporaryExternalAssetPath: vi.fn()
    };
    const store = createStagedTokenImportStore(access);
    const staged = stagedImport();

    store.register(staged);

    expect(store.get(staged.assetId)).toEqual(staged);
    expect(access.registerTemporaryExternalAssetPath).toHaveBeenCalledWith(staged.sourcePath);
    expect(access.unregisterTemporaryExternalAssetPath).not.toHaveBeenCalled();
  });

  it("consumes a staged import and removes temporary external access", () => {
    const access = {
      registerTemporaryExternalAssetPath: vi.fn(),
      unregisterTemporaryExternalAssetPath: vi.fn()
    };
    const store = createStagedTokenImportStore(access);
    const staged = stagedImport();
    store.register(staged);

    expect(store.consume(staged.assetId)).toEqual(staged);

    expect(store.get(staged.assetId)).toBeNull();
    expect(access.unregisterTemporaryExternalAssetPath).toHaveBeenCalledWith(staged.sourcePath);
  });

  it("discards only staged imports owned by the requested campaign", () => {
    const access = {
      registerTemporaryExternalAssetPath: vi.fn(),
      unregisterTemporaryExternalAssetPath: vi.fn()
    };
    const store = createStagedTokenImportStore(access);
    const staged = stagedImport();
    store.register(staged);

    expect(store.discardForCampaign(staged.assetId, path.join("C:", "Campaigns", "Two"))).toBe(false);
    expect(store.get(staged.assetId)).toEqual(staged);
    expect(access.unregisterTemporaryExternalAssetPath).not.toHaveBeenCalled();

    expect(store.discardForCampaign(staged.assetId, staged.campaignPath)).toBe(true);
    expect(store.get(staged.assetId)).toBeNull();
    expect(access.unregisterTemporaryExternalAssetPath).toHaveBeenCalledWith(staged.sourcePath);
  });
});
