import { describe, expect, it } from "vitest";
import { appendPolygonDraftPoint, appendScopedPolygonDraftPoint, removeLastPolygonDraftPoint, updatePolygonDraftCurrent } from "../../src/renderer/canvas/scene";

describe("polygon draft helpers", () => {
  it("starts a new generic draft with the first point", () => {
    expect(appendPolygonDraftPoint(null, { x: 1, y: 2 })).toEqual({
      points: [{ x: 1, y: 2 }],
      current: { x: 1, y: 2 }
    });
  });

  it("appends a point to an existing generic draft", () => {
    expect(appendPolygonDraftPoint({ points: [{ x: 1, y: 2 }], current: { x: 1, y: 2 } }, { x: 3, y: 4 })).toEqual({
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 }
      ],
      current: { x: 3, y: 4 }
    });
  });

  it("appends to a scoped draft when the scope matches", () => {
    const draft = {
      operation: "hide" as const,
      points: [{ x: 1, y: 2 }],
      current: { x: 1, y: 2 }
    };

    expect(appendScopedPolygonDraftPoint(draft, { x: 3, y: 4 }, "operation", "hide")).toEqual({
      operation: "hide",
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 }
      ],
      current: { x: 3, y: 4 }
    });
  });

  it("starts a new scoped draft when the scope changes", () => {
    const draft = {
      operation: "hide" as "hide" | "reveal",
      points: [{ x: 1, y: 2 }],
      current: { x: 1, y: 2 }
    };

    expect(appendScopedPolygonDraftPoint(draft, { x: 3, y: 4 }, "operation", "reveal")).toEqual({
      operation: "reveal",
      points: [{ x: 3, y: 4 }],
      current: { x: 3, y: 4 }
    });
  });

  it("updates the current preview point while preserving draft fields", () => {
    expect(updatePolygonDraftCurrent({ operation: "hide" as const, points: [{ x: 1, y: 2 }], current: { x: 1, y: 2 } }, { x: 7, y: 8 })).toEqual({
      operation: "hide",
      points: [{ x: 1, y: 2 }],
      current: { x: 7, y: 8 }
    });
  });

  it("removes the last point and moves current to the new last point", () => {
    const draft = {
      operation: "hide" as const,
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 }
      ],
      current: { x: 10, y: 12 }
    };

    expect(removeLastPolygonDraftPoint(draft)).toEqual({
      operation: "hide",
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 }
      ],
      current: { x: 3, y: 4 }
    });
  });

  it("clears the draft when the last point is removed", () => {
    expect(removeLastPolygonDraftPoint({ points: [{ x: 1, y: 2 }], current: { x: 1, y: 2 } })).toBeNull();
  });
});
