import { describe, expect, it } from "vitest";
import { createSmokeTestScript, getSmokeTestTimeoutMs } from "../../electron/smokeTestPlan";

describe("smoke test plan", () => {
  it("uses a longer timeout for visual smoke tests", () => {
    expect(getSmokeTestTimeoutMs(false)).toBe(15000);
    expect(getSmokeTestTimeoutMs(true)).toBe(45000);
  });

  it("builds the preload bridge smoke script", () => {
    const script = createSmokeTestScript();

    expect(script).toContain("window.localVtt.openPlayerView");
    expect(script).toContain("window.localVtt.showPlayerIdle");
    expect(script).toContain("window.localVtt.getLastPlayerState");
    expect(script).toContain("window.localVtt.getDisplays");
    expect(script).toContain("hasPreloadBridge");
    expect(script).toContain("hasCreateCampaign");
    expect(script).toContain("hasPlayerBridge");
    expect(script.trim()).toMatch(/^\(async \(\) => \{/);
    expect(script.trim()).toMatch(/\}\)\(\)$/);
  });

  it("can build a side-effect-light script for visual smoke tests", () => {
    const script = createSmokeTestScript({ includePlayerIdle: false });

    expect(script).not.toContain("window.localVtt.openPlayerView");
    expect(script).not.toContain("window.localVtt.showPlayerIdle");
    expect(script).not.toContain("window.localVtt.getLastPlayerState");
    expect(script).toContain("window.localVtt.getDisplays");
    expect(script).toContain("hasPreloadBridge");
    expect(script).toContain("hasCreateCampaign");
    expect(script).toContain("hasPlayerBridge");
  });
});
