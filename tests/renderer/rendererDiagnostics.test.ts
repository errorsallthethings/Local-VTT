import { describe, expect, it, vi } from "vitest";
import { formatRendererDiagnosticDetail, logRendererError, logRendererWarning } from "../../src/renderer/lib/rendererDiagnostics";

describe("renderer diagnostics", () => {
  it("formats errors with stable fields", () => {
    const error = new TypeError("Broken");

    expect(formatRendererDiagnosticDetail(error)).toMatchObject({
      name: "TypeError",
      message: "Broken"
    });
  });

  it("formats unusual and circular details without throwing", () => {
    const detail: { name: string; self?: unknown; callback?: () => void } = { name: "detail" };
    detail.self = detail;
    detail.callback = () => undefined;

    expect(formatRendererDiagnosticDetail(detail)).toBe('{"name":"detail","self":"[Circular]","callback":"() => undefined"}');
    expect(formatRendererDiagnosticDetail(undefined)).toBe("undefined");
    expect(formatRendererDiagnosticDetail(1n)).toBe("1");
  });

  it("logs errors and warnings with formatted details", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warningSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    try {
      logRendererError("LOCALVTT_TEST_ERROR", new Error("Boom"));
      logRendererWarning("LOCALVTT_TEST_WARNING", { ok: true });

      expect(errorSpy).toHaveBeenCalledWith("LOCALVTT_TEST_ERROR", expect.objectContaining({ name: "Error", message: "Boom" }));
      expect(warningSpy).toHaveBeenCalledWith("LOCALVTT_TEST_WARNING", '{"ok":true}');
    } finally {
      errorSpy.mockRestore();
      warningSpy.mockRestore();
    }
  });
});
