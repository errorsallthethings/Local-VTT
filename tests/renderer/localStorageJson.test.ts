import { describe, expect, it } from "vitest";
import {
  loadLocalStorageJson,
  parseLocalStorageJson,
  readLocalStorageItem,
  saveLocalStorageJson,
  writeLocalStorageItem
} from "../../src/renderer/lib/storage/localStorageJson";

describe("local storage JSON helpers", () => {
  it("returns fallbacks for missing, malformed, or unreadable values", () => {
    expect(parseLocalStorageJson(null, [])).toEqual([]);
    expect(parseLocalStorageJson("{bad json", [])).toEqual([]);
    expect(readLocalStorageItem({ getItem: () => { throw new Error("blocked"); } }, "key")).toBeNull();
    expect(loadLocalStorageJson({ getItem: () => { throw new Error("blocked"); } }, "key", { ok: false })).toEqual({ ok: false });
  });

  it("writes plain and JSON values when storage is available", () => {
    const values = new Map<string, string>();
    const storage = {
      setItem: (key: string, value: string) => values.set(key, value)
    };

    expect(writeLocalStorageItem(storage, "plain", "value")).toBe(true);
    expect(saveLocalStorageJson(storage, "json", { ok: true })).toBe(true);
    expect(values.get("plain")).toBe("value");
    expect(values.get("json")).toBe("{\"ok\":true}");
  });

  it("reports write failures without throwing", () => {
    const storage = {
      setItem: () => {
        throw new Error("quota");
      }
    };
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(writeLocalStorageItem(storage, "plain", "value")).toBe(false);
    expect(saveLocalStorageJson(storage, "json", circular)).toBe(false);
  });
});
