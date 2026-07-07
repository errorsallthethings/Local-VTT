import { describe, expect, it, vi } from "vitest";
import { applyDrawingStrokeStyle } from "../../src/renderer/canvas/drawings";

describe("drawing stroke styles", () => {
  it("maps named stroke styles to stable canvas dash patterns", () => {
    const ctx = { setLineDash: vi.fn() } as unknown as CanvasRenderingContext2D;

    applyDrawingStrokeStyle(ctx, "solid", 10);
    applyDrawingStrokeStyle(ctx, "dashed", 10);
    applyDrawingStrokeStyle(ctx, "dotted", 10);
    applyDrawingStrokeStyle(ctx, "dash-dot", 10);
    applyDrawingStrokeStyle(ctx, "sketch", 10);

    expect(ctx.setLineDash).toHaveBeenNthCalledWith(1, []);
    expect(ctx.setLineDash).toHaveBeenNthCalledWith(2, [18, 11]);
    expect(ctx.setLineDash).toHaveBeenNthCalledWith(3, [1.2, 11]);
    expect(ctx.setLineDash).toHaveBeenNthCalledWith(4, [18, 8, 1.7999999999999998, 8]);
    expect(ctx.setLineDash).toHaveBeenNthCalledWith(5, [21, 4.5, 7, 5.5]);
  });
});
