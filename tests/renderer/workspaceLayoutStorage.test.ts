import { describe, expect, it } from "vitest";
import {
  DEFAULT_WORKSPACE_LAYOUT,
  DEFAULT_TOKEN_LIBRARY_HEIGHT,
  TOKEN_LIBRARY_HEIGHT_STORAGE_KEY,
  WORKSPACE_LAYOUT_STORAGE_KEY,
  loadTokenLibraryHeight,
  loadWorkspaceLayout,
  saveTokenLibraryHeight,
  saveWorkspaceLayout
} from "../../src/renderer/lib/workspace";

function createStorage(initialValues: Record<string, string | null> = {}) {
  const values = new Map(Object.entries(initialValues).filter((entry): entry is [string, string] => entry[1] !== null));

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    }
  };
}

describe("workspace layout storage", () => {
  it("loads the default workspace layout when stored data is missing", () => {
    expect(loadWorkspaceLayout(createStorage())).toEqual(DEFAULT_WORKSPACE_LAYOUT);
  });

  it("loads defaults when workspace storage cannot be read", () => {
    const throwingStorage = { getItem: () => { throw new Error("blocked"); } };

    expect(loadWorkspaceLayout(throwingStorage)).toEqual(DEFAULT_WORKSPACE_LAYOUT);
    expect(loadTokenLibraryHeight(throwingStorage)).toBe(DEFAULT_TOKEN_LIBRARY_HEIGHT);
  });

  it("saves and reloads workspace layout values", () => {
    const storage = createStorage();
    const layout = { leftWidth: 320, rightWidth: 360, leftCollapsed: true, rightCollapsed: false };

    saveWorkspaceLayout(layout, storage);

    expect(storage.getItem(WORKSPACE_LAYOUT_STORAGE_KEY)).toBe(JSON.stringify(layout));
    expect(loadWorkspaceLayout(storage)).toEqual(layout);
  });

  it("ignores workspace save failures", () => {
    const throwingStorage = { setItem: () => { throw new Error("quota"); } };

    expect(() => saveWorkspaceLayout(DEFAULT_WORKSPACE_LAYOUT, throwingStorage)).not.toThrow();
    expect(() => saveTokenLibraryHeight(312, throwingStorage)).not.toThrow();
  });

  it("saves and reloads token library height values", () => {
    const storage = createStorage();

    saveTokenLibraryHeight(312, storage);

    expect(storage.getItem(TOKEN_LIBRARY_HEIGHT_STORAGE_KEY)).toBe("312");
    expect(loadTokenLibraryHeight(storage)).toBe(312);
  });
});
