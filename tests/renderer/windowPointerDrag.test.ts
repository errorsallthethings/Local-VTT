import { describe, expect, it, vi } from "vitest";
import { startWindowPointerDrag } from "../../src/renderer/lib/workspace";

describe("window pointer drag lifecycle", () => {
  it("prevents default, adds the resize class, wires pointer listeners, and cleans up on stop", () => {
    const preventDefault = vi.fn();
    const addClass = vi.fn();
    const removeClass = vi.fn();
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    const onPointerMove = vi.fn();

    const stop = startWindowPointerDrag({
      startEvent: { preventDefault },
      bodyClassName: "resizing-panels",
      onPointerMove,
      body: { classList: { add: addClass, remove: removeClass } },
      windowTarget: { addEventListener, removeEventListener }
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(addClass).toHaveBeenCalledWith("resizing-panels");
    expect(addEventListener).toHaveBeenCalledWith("pointermove", onPointerMove);
    expect(addEventListener).toHaveBeenCalledWith("pointerup", expect.any(Function), { once: true });

    stop();

    expect(removeClass).toHaveBeenCalledWith("resizing-panels");
    expect(removeEventListener).toHaveBeenCalledWith("pointermove", onPointerMove);
    expect(removeEventListener).toHaveBeenCalledWith("pointerup", expect.any(Function));
  });
});
