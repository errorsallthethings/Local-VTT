import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

export function validatePackageArtifacts({ platform = "win", files = [] } = {}) {
  if (platform === "win") {
    return validateWindowsPackageArtifacts(files);
  }

  if (platform === "mac" || platform === "macos") {
    return validateMacPackageArtifacts(files);
  }

  if (platform === "linux") {
    return validateLinuxPackageArtifacts(files);
  }

  return [`Unsupported package artifact platform ${formatValue(platform)}.`];
}

export function validateWindowsPackageArtifacts(files) {
  const normalizedFiles = normalizeRelativeFiles(files);
  const errors = [];

  if (!normalizedFiles.some((file) => file.startsWith("release/") && !file.slice("release/".length).includes("/") && file.endsWith(".exe"))) {
    errors.push("Windows packaging must produce a release/*.exe installer.");
  }
  if (!normalizedFiles.some((file) => file.startsWith("release/") && !file.slice("release/".length).includes("/") && file.endsWith(".exe.blockmap"))) {
    errors.push("Windows packaging must produce a release/*.exe.blockmap update blockmap.");
  }
  if (!normalizedFiles.includes("release/latest.yml")) {
    errors.push("Windows packaging must produce release/latest.yml.");
  }
  if (!normalizedFiles.includes("release/win-unpacked/Local VTT.exe")) {
    errors.push("Windows packaging must produce release/win-unpacked/Local VTT.exe for local smoke testing.");
  }

  return errors;
}

export function validateMacPackageArtifacts(files) {
  const normalizedFiles = normalizeRelativeFiles(files);
  const errors = [];

  if (!normalizedFiles.some((file) => file.startsWith("release/") && !file.slice("release/".length).includes("/") && (file.endsWith(".dmg") || file.endsWith(".zip")))) {
    errors.push("macOS packaging must produce a release/*.dmg or release/*.zip package.");
  }
  if (!normalizedFiles.includes("release/latest-mac.yml")) {
    errors.push("macOS packaging must produce release/latest-mac.yml.");
  }

  return errors;
}

export function validateLinuxPackageArtifacts(files) {
  const normalizedFiles = normalizeRelativeFiles(files);
  const errors = [];

  if (!normalizedFiles.some((file) => file.startsWith("release/") && !file.slice("release/".length).includes("/") && file.endsWith(".AppImage"))) {
    errors.push("Linux packaging must produce a release/*.AppImage package.");
  }
  if (!normalizedFiles.some((file) => file.startsWith("release/") && !file.slice("release/".length).includes("/") && file.endsWith(".deb"))) {
    errors.push("Linux packaging must produce a release/*.deb package.");
  }
  if (!normalizedFiles.some((file) => file.startsWith("release/") && !file.slice("release/".length).includes("/") && file.endsWith(".rpm"))) {
    errors.push("Linux packaging must produce a release/*.rpm package.");
  }
  if (!normalizedFiles.includes("release/latest-linux.yml")) {
    errors.push("Linux packaging must produce release/latest-linux.yml.");
  }

  return errors;
}

export function listPackageArtifactFiles(root = repoRoot, releaseDir = "release") {
  const absoluteReleaseDir = path.resolve(root, releaseDir);
  return listFilesRecursive(absoluteReleaseDir).map((filePath) => normalizePath(path.relative(root, filePath)));
}

function listFilesRecursive(directory) {
  try {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const filePath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFilesRecursive(filePath) : [filePath];
    });
  } catch {
    return [];
  }
}

function normalizeRelativeFiles(files) {
  return Array.isArray(files) ? files.map((file) => normalizePath(String(file))) : [];
}

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/");
}

function formatValue(value) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const platform = process.argv[2] ?? "win";
  const files = listPackageArtifactFiles(repoRoot);
  const errors = validatePackageArtifacts({ platform, files });
  if (errors.length > 0) {
    console.error("Package artifact validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Package artifact validation passed.");
  }
}
