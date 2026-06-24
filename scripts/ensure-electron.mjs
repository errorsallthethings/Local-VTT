import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const electronPackageRoot = path.join(root, "node_modules", "electron");
const electronInstallScript = path.join(electronPackageRoot, "install.js");
const electronPathFile = path.join(electronPackageRoot, "path.txt");
const electronDistPath = path.join(electronPackageRoot, "dist");
const platformPath = getPlatformPath();
const electronExecutable = path.join(electronDistPath, platformPath);

if (isElectronReady()) {
  console.log(`Electron binary ready: ${electronExecutable}`);
  process.exit(0);
}

if (repairPathFileFromExistingDist()) {
  console.log(`Electron path.txt repaired: ${platformPath}`);
  process.exit(0);
}

if (!existsSync(electronInstallScript)) {
  console.error("Electron install script was not found. Run npm ci before running Electron checks.");
  printDiagnostics();
  process.exit(1);
}

console.log("Installing Electron binary...");
const install = spawnSync(process.execPath, [electronInstallScript], {
  cwd: root,
  env: {
    ...process.env,
    force_no_cache: process.env.CI === "true" ? "true" : process.env.force_no_cache
  },
  stdio: "inherit"
});

if (install.status === 0 && (isElectronReady() || repairPathFileFromExistingDist())) {
  console.log(`Electron binary ready: ${electronExecutable}`);
  process.exit(0);
}

console.error(`Electron binary install failed with status ${install.status ?? "unknown"}.`);
printDiagnostics();
process.exit(1);

function isElectronReady() {
  if (!existsSync(electronPathFile) || !existsSync(electronExecutable)) {
    return false;
  }
  return readFileSync(electronPathFile, "utf8") === platformPath;
}

function repairPathFileFromExistingDist() {
  if (!existsSync(electronExecutable)) {
    return false;
  }
  writeFileSync(electronPathFile, platformPath);
  return isElectronReady();
}

function printDiagnostics() {
  console.error(`Expected path.txt: ${electronPathFile}`);
  console.error(`Expected executable: ${electronExecutable}`);
  console.error(`path.txt exists: ${existsSync(electronPathFile)}`);
  console.error(`executable exists: ${existsSync(electronExecutable)}`);
  console.error(`electron package exists: ${existsSync(electronPackageRoot)}`);
  console.error(`electron dist entries: ${safeList(electronDistPath).join(", ") || "(none)"}`);
}

function safeList(directory) {
  try {
    return readdirSync(directory);
  } catch {
    return [];
  }
}

function getPlatformPath() {
  const platform = process.env.ELECTRON_INSTALL_PLATFORM || process.env.npm_config_platform || os.platform();
  switch (platform) {
    case "mas":
    case "darwin":
      return "Electron.app/Contents/MacOS/Electron";
    case "freebsd":
    case "openbsd":
    case "linux":
      return "electron";
    case "win32":
      return "electron.exe";
    default:
      throw new Error(`Electron builds are not available on platform: ${platform}`);
  }
}
