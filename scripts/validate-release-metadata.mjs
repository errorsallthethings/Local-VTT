import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

export function validateReleaseMetadata({ packageJson, packageLock, tagName = process.env.GITHUB_REF_NAME, refType = process.env.GITHUB_REF_TYPE } = {}) {
  const errors = [];
  const appVersion = packageJson?.version;
  const lockVersion = packageLock?.version;
  const lockRootVersion = packageLock?.packages?.[""]?.version;

  if (!isSemver(appVersion)) {
    errors.push(`package.json version must be a stable semver value, received ${formatValue(appVersion)}.`);
  }
  if (lockVersion !== appVersion) {
    errors.push(`package-lock.json version (${formatValue(lockVersion)}) must match package.json version (${formatValue(appVersion)}).`);
  }
  if (lockRootVersion !== appVersion) {
    errors.push(`package-lock.json root package version (${formatValue(lockRootVersion)}) must match package.json version (${formatValue(appVersion)}).`);
  }

  if (refType === "tag" || tagName?.startsWith("v")) {
    const tagVersion = tagName?.startsWith("v") ? tagName.slice(1) : tagName;
    if (tagVersion !== appVersion) {
      errors.push(`release tag ${formatValue(tagName)} must match package.json version ${formatValue(appVersion)}.`);
    }
  }

  const build = packageJson?.build;
  if (!isRecord(build)) {
    errors.push("package.json build metadata is required for electron-builder.");
  } else {
    requireString(errors, build.appId, "build.appId");
    requireString(errors, build.productName, "build.productName");
    requireString(errors, build.directories?.output, "build.directories.output");
    requireFilesEntry(errors, build.files, "dist/**");
    requireFilesEntry(errors, build.files, "dist-electron/**");
    requireFilesEntry(errors, build.files, "package.json");
    requireString(errors, build.win?.icon, "build.win.icon");
    requireString(errors, build.mac?.icon, "build.mac.icon");
    requireString(errors, build.linux?.icon, "build.linux.icon");
  }

  return errors;
}

export function loadReleaseMetadata(root = repoRoot) {
  return {
    packageJson: readJson(path.join(root, "package.json")),
    packageLock: readJson(path.join(root, "package-lock.json"))
  };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function requireString(errors, value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${label} must be configured.`);
  }
}

function requireFilesEntry(errors, files, expectedEntry) {
  if (!Array.isArray(files) || !files.includes(expectedEntry)) {
    errors.push(`build.files must include ${expectedEntry}.`);
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSemver(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+$/.test(value);
}

function formatValue(value) {
  return typeof value === "string" ? value : JSON.stringify(value);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const errors = validateReleaseMetadata(loadReleaseMetadata());
  if (errors.length > 0) {
    console.error("Release metadata validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Release metadata validation passed.");
  }
}
