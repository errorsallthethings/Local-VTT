import { describe, expect, it, vi } from "vitest";
import { drawShockwaveFallback, drawWaterFallback } from "../../src/renderer/canvas/effects";

function createMockCanvasContext() {
  const state = {
    globalAlpha: 1,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1
  };

  return {
    ctx: {
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      ellipse: vi.fn(),
      stroke: vi.fn(),
      get globalAlpha() {
        return state.globalAlpha;
      },
      set globalAlpha(value: number) {
        state.globalAlpha = value;
      },
      get fillStyle() {
        return state.fillStyle;
      },
      set fillStyle(value: string) {
        state.fillStyle = value;
      },
      get strokeStyle() {
        return state.strokeStyle;
      },
      set strokeStyle(value: string) {
        state.strokeStyle = value;
      },
      get lineWidth() {
        return state.lineWidth;
      },
      set lineWidth(value: number) {
        state.lineWidth = value;
      }
    } as unknown as CanvasRenderingContext2D,
    state
  };
}

describe("environment effect fallbacks", () => {
  it("draws filled fallbacks with clamped layer opacity", () => {
    const { ctx, state } = createMockCanvasContext();

    drawWaterFallback(ctx, { x: 10, y: 20, width: 300, height: 200 }, 2);

    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.fillRect).toHaveBeenCalledWith(10, 20, 300, 200);
    expect(state.globalAlpha).toBe(0.18);
    expect(state.fillStyle).toBe("rgb(0, 145, 190)");
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });

  it("draws shockwave fallbacks as three centered rings", () => {
    const { ctx, state } = createMockCanvasContext();

    drawShockwaveFallback(ctx, { x: 10, y: 20, width: 300, height: 200 }, 0.5);

    expect(state.globalAlpha).toBe(0.14);
    expect(state.strokeStyle).toBe("rgb(147, 197, 253)");
    expect(state.lineWidth).toBeCloseTo(7);
    expect(ctx.beginPath).toHaveBeenCalledTimes(3);
    expect(ctx.ellipse).toHaveBeenNthCalledWith(3, 160, 120, 92, 92, 0, 0, Math.PI * 2);
    expect(ctx.stroke).toHaveBeenCalledTimes(3);
  });
});
