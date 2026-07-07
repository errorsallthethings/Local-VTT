import { describe, expect, it } from "vitest";
import { getRendererRoute } from "../../src/renderer/router";

describe("renderer route helper", () => {
  it("routes the player window from the player hash", () => {
    expect(getRendererRoute("#/player")).toBe("player");
  });

  it("defaults unknown or empty hashes to the GM window", () => {
    expect(getRendererRoute("")).toBe("gm");
    expect(getRendererRoute("#/gm")).toBe("gm");
    expect(getRendererRoute("#/settings")).toBe("gm");
  });
});
