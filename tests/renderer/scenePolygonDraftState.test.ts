import { describe, expect, it, vi } from "vitest";
import {
  appendScenePolygonDraftPoint,
  appendScopedScenePolygonDraftPoint,
  clearScenePolygonDraft,
  removeLastScenePolygonDraftPoint,
  setScenePolygonDraft,
  type ScenePolygonDraftState
} from "../../src/renderer/components/scene/scenePolygonDraftState";
import type { Point } from "../../src/shared/localvtt";

type TestDraft = {
  points: Point[];
  current?: Point;
};

type ScopedTestDraft = TestDraft & {
  operation: "hide" | "reveal";
};

function state<TDraft extends TestDraft>(draft: TDraft | null = null): ScenePolygonDraftState<TDraft> & { setDraft: ReturnType<typeof vi.fn> } {
  return {
    ref: { current: draft },
    setDraft: vi.fn()
  };
}

describe("scene polygon draft state helpers", () => {
  it("keeps draft refs and state setters synchronized", () => {
    const draftState = state<TestDraft>();
    const draft = { points: [{ x: 1, y: 2 }], current: { x: 1, y: 2 } };

    expect(setScenePolygonDraft(draftState, draft)).toBe(draft);
    expect(draftState.ref.current).toBe(draft);
    expect(draftState.setDraft).toHaveBeenCalledWith(draft);
  });

  it("appends generic polygon points through the synced state", () => {
    const draftState = state<TestDraft>();

    expect(appendScenePolygonDraftPoint(draftState, { x: 1, y: 2 })).toEqual({
      points: [{ x: 1, y: 2 }],
      current: { x: 1, y: 2 }
    });
    expect(appendScenePolygonDraftPoint(draftState, { x: 3, y: 4 })).toEqual({
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 }
      ],
      current: { x: 3, y: 4 }
    });
    expect(draftState.ref.current?.points).toEqual([
      { x: 1, y: 2 },
      { x: 3, y: 4 }
    ]);
  });

  it("starts a new scoped draft when the scope changes", () => {
    const draftState = state<ScopedTestDraft>({ operation: "hide", points: [{ x: 1, y: 2 }], current: { x: 1, y: 2 } });

    expect(appendScopedScenePolygonDraftPoint(draftState, { x: 3, y: 4 }, "operation", "reveal")).toEqual({
      operation: "reveal",
      points: [{ x: 3, y: 4 }],
      current: { x: 3, y: 4 }
    });
    expect(draftState.ref.current?.operation).toBe("reveal");
  });

  it("removes the last point and clears empty drafts", () => {
    const draftState = state<TestDraft>({
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 }
      ],
      current: { x: 3, y: 4 }
    });

    expect(removeLastScenePolygonDraftPoint(draftState)).toEqual({
      points: [{ x: 1, y: 2 }],
      current: { x: 1, y: 2 }
    });
    expect(removeLastScenePolygonDraftPoint(draftState)).toBeNull();
    expect(draftState.ref.current).toBeNull();
  });

  it("clears draft refs and state together", () => {
    const draftState = state<TestDraft>({ points: [{ x: 1, y: 2 }], current: { x: 1, y: 2 } });

    expect(clearScenePolygonDraft(draftState)).toBeNull();
    expect(draftState.ref.current).toBeNull();
    expect(draftState.setDraft).toHaveBeenCalledWith(null);
  });
});
