import { describe, expect, it } from "vitest";
import { getRendererErrorMessage, isLazyLoadError } from "../../src/renderer/components/rendererErrorMessages";

describe("renderer error messages", () => {
  it("identifies common lazy chunk load failures", () => {
    expect(isLazyLoadError(new Error("Loading chunk 123 failed."))).toBe(true);
    expect(isLazyLoadError(new Error("Failed to fetch dynamically imported module: file:///LocalVTT/assets/GmApp.js"))).toBe(true);
    expect(isLazyLoadError(Object.assign(new Error("network failed"), { name: "ChunkLoadError" }))).toBe(true);
  });

  it("uses specific recovery guidance for lazy chunk load failures", () => {
    const message = getRendererErrorMessage(new Error("Failed to fetch dynamically imported module"));

    expect(message.title).toContain("could not load part of the app");
    expect(message.recovery).toContain("Close every Local VTT window");
  });

  it("keeps generic renderer errors separate from lazy load failures", () => {
    const message = getRendererErrorMessage(new Error("Cannot read properties of undefined"));

    expect(isLazyLoadError(null)).toBe(false);
    expect(message.title).toBe("Local VTT ran into a renderer error");
    expect(message.recovery).toContain("Close and reopen Local VTT");
  });
});
