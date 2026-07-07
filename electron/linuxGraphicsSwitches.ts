export interface LinuxGraphicsEnvironment {
  LOCALVTT_OZONE_PLATFORM?: string;
  LOCALVTT_DISABLE_VULKAN?: string;
  LOCALVTT_ENABLE_VULKAN?: string;
}

export interface CommandLineSwitch {
  name: string;
  value?: string;
}

export function getLinuxGraphicsSwitches(platform: NodeJS.Platform, env: LinuxGraphicsEnvironment): CommandLineSwitch[] {
  if (platform !== "linux") {
    return [];
  }

  const switches: CommandLineSwitch[] = [];
  const ozonePlatform = env.LOCALVTT_OZONE_PLATFORM;

  if (ozonePlatform === "wayland" || ozonePlatform === "x11") {
    switches.push({ name: "ozone-platform", value: ozonePlatform });
  } else if (ozonePlatform === "auto") {
    switches.push({ name: "ozone-platform-hint", value: "auto" });
  }

  if (env.LOCALVTT_DISABLE_VULKAN === "1") {
    switches.push({ name: "disable-features", value: "Vulkan" });
  } else if (env.LOCALVTT_ENABLE_VULKAN === "1") {
    switches.push({ name: "enable-features", value: "Vulkan" });
  }

  return switches;
}
