import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { downloadArtifact } from "@electron/get";
import extract from "extract-zip";

const root = path.resolve(import.meta.dirname, "..");
const electronPackageRoot = path.join(root, "node_modules", "electron");
const electronInstallScript = path.join(electronPackageRoot, "install.js");
const electronPathFile = path.join(electronPackageRoot, "path.txt");
const electronDistPath = path.join(electronPackageRoot, "dist");
const electronPackageJson = path.join(electronPackageRoot, "package.json");
const electronChecksumsJson = path.join(electronPackageRoot, "checksums.json");
const platformPath = getPlatformPath();
const electronExecutable = path.join(electronDistPath, platformPath);
const platform = process.env.ELECTRON_INSTALL_PLATFORM || process.env.npm_config_platform || os.platform();
const arch = process.env.ELECTRON_INSTALL_ARCH || process.env.npm_config_arch || os.arch();

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

console.warn(`Electron package installer did not produce a usable binary. Status: ${install.status ?? "unknown"}.`);
printDiagnostics();

try {
  await installElectronDirectly();
  if (isElectronReady() || repairPathFileFromExistingDist()) {
    console.log(`Electron binary ready: ${electronExecutable}`);
    process.exit(0);
  }
} catch (caught) {
  console.error("Direct Electron binary install failed.", caught);
}

console.error("Electron binary install failed.");
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

async function installElectronDirectly() {
  const version = JSON.parse(readFileSync(electronPackageJson, "utf8")).version;
  const checksums = existsSync(electronChecksumsJson) ? JSON.parse(readFileSync(electronChecksumsJson, "utf8")) : undefined;

  console.log(`Downloading Electron ${version} for ${platform}/${arch}...`);
  const zipPath = await downloadArtifact({
    version,
    artifactName: "electron",
    cacheRoot: process.env.electron_config_cache,
    checksums,
    force: process.env.CI === "true"
  });

  console.log(`Extracting Electron binary from ${zipPath}...`);
  rmSync(electronDistPath, { recursive: true, force: true });
  mkdirSync(electronDistPath, { recursive: true });
  await extract(zipPath, { dir: electronDistPath });
  writeFileSync(electronPathFile, platformPath);
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
