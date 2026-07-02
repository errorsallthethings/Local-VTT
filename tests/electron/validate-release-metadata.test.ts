import { describe, expect, it } from "vitest";

const { validateReleaseMetadata } = await import("../../scripts/validate-release-metadata.mjs");

function validPackageJson(overrides = {}) {
  return {
    version: "0.1.15",
    build: {
      appId: "app.localvtt.desktop",
      productName: "Local VTT",
      files: ["dist/**", "dist-electron/**", "build/icon.ico", "package.json"],
      directories: { output: "release" },
      win: { icon: "build/icon.ico" },
      mac: { icon: "build/icon.icns" },
      linux: { icon: "build/icons" }
    },
    ...overrides
  };
}

function validPackageLock(overrides = {}) {
  return {
    version: "0.1.15",
    packages: {
      "": {
        version: "0.1.15"
      }
    },
    ...overrides
  };
}

describe("validateReleaseMetadata", () => {
  it("accepts matching package, lockfile, tag, and builder metadata", () => {
    expect(
      validateReleaseMetadata({
        packageJson: validPackageJson(),
        packageLock: validPackageLock(),
        tagName: "v0.1.15",
        refType: "tag"
      })
    ).toEqual([]);
  });

  it("reports package-lock version drift", () => {
    expect(
      validateReleaseMetadata({
        packageJson: validPackageJson(),
        packageLock: validPackageLock({ version: "0.1.14" })
      })
    ).toContain("package-lock.json version (0.1.14) must match package.json version (0.1.15).");
  });

  it("reports release tag drift", () => {
    expect(
      validateReleaseMetadata({
        packageJson: validPackageJson(),
        packageLock: validPackageLock(),
        tagName: "v0.1.14",
        refType: "tag"
      })
    ).toContain("release tag v0.1.14 must match package.json version 0.1.15.");
  });

  it("reports missing required electron-builder metadata", () => {
    const packageJson = validPackageJson({
      build: {
        appId: "app.localvtt.desktop",
        productName: "",
        files: ["dist/**"],
        directories: {},
        win: {},
        mac: {},
        linux: {}
      }
    });

    expect(validateReleaseMetadata({ packageJson, packageLock: validPackageLock() })).toEqual(
      expect.arrayContaining([
        "build.productName must be configured.",
        "build.directories.output must be configured.",
        "build.files must include dist-electron/**.",
        "build.files must include package.json.",
        "build.win.icon must be configured.",
        "build.mac.icon must be configured.",
        "build.linux.icon must be configured."
      ])
    );
  });
});
