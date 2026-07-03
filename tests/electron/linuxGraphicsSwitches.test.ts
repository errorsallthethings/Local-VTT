import { describe, expect, it } from "vitest";
import { getLinuxGraphicsSwitches } from "../../electron/linuxGraphicsSwitches";

describe("Linux graphics switches", () => {
  it("does not add graphics switches for non-Linux platforms", () => {
    expect(
      getLinuxGraphicsSwitches("win32", {
        LOCALVTT_OZONE_PLATFORM: "wayland",
        LOCALVTT_DISABLE_VULKAN: "1"
      })
    ).toEqual([]);
  });

  it("adds explicit ozone platform switches for supported platforms", () => {
    expect(getLinuxGraphicsSwitches("linux", { LOCALVTT_OZONE_PLATFORM: "wayland" })).toEqual([
      { name: "ozone-platform", value: "wayland" }
    ]);
    expect(getLinuxGraphicsSwitches("linux", { LOCALVTT_OZONE_PLATFORM: "x11" })).toEqual([{ name: "ozone-platform", value: "x11" }]);
  });

  it("adds the automatic ozone platform hint", () => {
    expect(getLinuxGraphicsSwitches("linux", { LOCALVTT_OZONE_PLATFORM: "auto" })).toEqual([
      { name: "ozone-platform-hint", value: "auto" }
    ]);
  });

  it("ignores unsupported ozone platform values", () => {
    expect(getLinuxGraphicsSwitches("linux", { LOCALVTT_OZONE_PLATFORM: "mir" })).toEqual([]);
  });

  it("adds Vulkan feature switches and prefers disable over enable", () => {
    expect(getLinuxGraphicsSwitches("linux", { LOCALVTT_DISABLE_VULKAN: "1" })).toEqual([{ name: "disable-features", value: "Vulkan" }]);
    expect(getLinuxGraphicsSwitches("linux", { LOCALVTT_ENABLE_VULKAN: "1" })).toEqual([{ name: "enable-features", value: "Vulkan" }]);
    expect(getLinuxGraphicsSwitches("linux", { LOCALVTT_DISABLE_VULKAN: "1", LOCALVTT_ENABLE_VULKAN: "1" })).toEqual([
      { name: "disable-features", value: "Vulkan" }
    ]);
  });

  it("preserves switch order for ozone before Vulkan", () => {
    expect(getLinuxGraphicsSwitches("linux", { LOCALVTT_OZONE_PLATFORM: "auto", LOCALVTT_ENABLE_VULKAN: "1" })).toEqual([
      { name: "ozone-platform-hint", value: "auto" },
      { name: "enable-features", value: "Vulkan" }
    ]);
  });
});
