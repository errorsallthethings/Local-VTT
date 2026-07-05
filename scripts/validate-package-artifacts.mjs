import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

export function validatePackageArtifacts({ platform = "win", files = [], version } = {}) {
  if (platform === "win") {
    return validateWindowsPackageArtifacts(files, { version });
  }

  if (platform === "mac" || platform === "macos") {
    return validateMacPackageArtifacts(files, { version });
  }

  if (platform === "linux") {
    return validateLinuxPackageArtifacts(files, { version });
  }

  return [`Unsupported package artifact platform ${formatValue(platform)}.`];
}

export function validateWindowsPackageArtifacts(files, { version } = {}) {
  const normalizedFiles = normalizeRelativeFiles(files);
  const errors = [];
  const installerFiles = getRootReleaseFiles(normalizedFiles, (file) => file.endsWith(".exe"));
  const blockmapFiles = getRootReleaseFiles(normalizedFiles, (file) => file.endsWith(".exe.blockmap"));

  if (installerFiles.length === 0) {
    errors.push("Windows packaging must produce a release/*.exe installer.");
  }
  if (blockmapFiles.length === 0) {
    errors.push("Windows packaging must produce a release/*.exe.blockmap update blockmap.");
  }
  requireVersionedArtifact(errors, installerFiles, version, "Windows installer");
  requireVersionedArtifact(errors, blockmapFiles, version, "Windows installer blockmap");
  if (!normalizedFiles.includes("release/latest.yml")) {
    errors.push("Windows packaging must produce release/latest.yml.");
  }
  if (!normalizedFiles.includes("release/win-unpacked/Local VTT.exe")) {
    errors.push("Windows packaging must produce release/win-unpacked/Local VTT.exe for local smoke testing.");
  }

  return errors;
}

export function validateMacPackageArtifacts(files, { version } = {}) {
  const normalizedFiles = normalizeRelativeFiles(files);
  const errors = [];
  const packageFiles = getRootReleaseFiles(normalizedFiles, (file) => file.endsWith(".dmg") || file.endsWith(".zip"));

  if (packageFiles.length === 0) {
    errors.push("macOS packaging must produce a release/*.dmg or release/*.zip package.");
  }
  requireVersionedArtifact(errors, packageFiles, version, "macOS package");
  if (!normalizedFiles.includes("release/latest-mac.yml")) {
    errors.push("macOS packaging must produce release/latest-mac.yml.");
  }

  return errors;
}

export function validateLinuxPackageArtifacts(files, { version } = {}) {
  const normalizedFiles = normalizeRelativeFiles(files);
  const errors = [];
  const appImageFiles = getRootReleaseFiles(normalizedFiles, (file) => file.endsWith(".AppImage"));
  const debFiles = getRootReleaseFiles(normalizedFiles, (file) => file.endsWith(".deb"));
  const rpmFiles = getRootReleaseFiles(normalizedFiles, (file) => file.endsWith(".rpm"));

  if (appImageFiles.length === 0) {
    errors.push("Linux packaging must produce a release/*.AppImage package.");
  }
  if (debFiles.length === 0) {
    errors.push("Linux packaging must produce a release/*.deb package.");
  }
  if (rpmFiles.length === 0) {
    errors.push("Linux packaging must produce a release/*.rpm package.");
  }
  requireVersionedArtifact(errors, appImageFiles, version, "Linux AppImage package");
  requireVersionedArtifact(errors, debFiles, version, "Linux deb package");
  requireVersionedArtifact(errors, rpmFiles, version, "Linux rpm package");
  if (!normalizedFiles.includes("release/latest-linux.yml")) {
    errors.push("Linux packaging must produce release/latest-linux.yml.");
  }

  return errors;
}

export function listPackageArtifactFiles(root = repoRoot, releaseDir = "release") {
  const absoluteReleaseDir = path.resolve(root, releaseDir);
  return listFilesRecursive(absoluteReleaseDir).map((filePath) => normalizePath(path.relative(root, filePath)));
}

export function loadPackageVersion(root = repoRoot) {
  return JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
}

function getRootReleaseFiles(files, predicate) {
  return files.filter((file) => file.startsWith("release/") && !file.slice("release/".length).includes("/") && predicate(file));
}

function requireVersionedArtifact(errors, files, version, label) {
  if (files.length === 0 || typeof version !== "string" || version.length === 0) {
    return;
  }
  if (!files.some((file) => path.basename(file).includes(version))) {
    errors.push(`${label} filename must include package version ${version}.`);
  }
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
  const version = loadPackageVersion(repoRoot);
  const errors = validatePackageArtifacts({ platform, files, version });
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
