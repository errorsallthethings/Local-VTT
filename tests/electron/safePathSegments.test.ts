import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertSafePathSegment } from "../../electron/safePathSegments";

describe("safe path segment helpers", () => {
  it("accepts simple file or id segments", () => {
    expect(() => assertSafePathSegment("scene-1", "Unsafe segment.")).not.toThrow();
    expect(() => assertSafePathSegment("map-1.png", "Unsafe segment.")).not.toThrow();
  });

  it("rejects empty, traversal, separator, and absolute segments", () => {
    for (const value of ["", ".", "..", "../scene", "folder/scene", "folder\\scene", path.resolve("scene")]) {
      expect(() => assertSafePathSegment(value, "Unsafe segment.")).toThrow("Unsafe segment.");
    }
  });
});
