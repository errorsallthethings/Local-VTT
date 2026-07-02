import { describe, expect, it } from "vitest";

const { validatePackageArtifacts, validateWindowsPackageArtifacts } = await import("../../scripts/validate-package-artifacts.mjs");

describe("validatePackageArtifacts", () => {
  it("accepts a complete Windows package artifact set", () => {
    expect(
      validateWindowsPackageArtifacts([
        "release/Local VTT Setup 0.1.15.exe",
        "release/latest.yml",
        "release/win-unpacked/Local VTT.exe"
      ])
    ).toEqual([]);
  });

  it("normalizes Windows separators", () => {
    expect(
      validatePackageArtifacts({
        platform: "win",
        files: [
          "release\\Local VTT Setup 0.1.15.exe",
          "release\\latest.yml",
          "release\\win-unpacked\\Local VTT.exe"
        ]
      })
    ).toEqual([]);
  });

  it("reports missing Windows installer metadata and unpacked executable", () => {
    expect(validateWindowsPackageArtifacts(["release/win-unpacked/resources/app.asar"])).toEqual([
      "Windows packaging must produce a release/*.exe installer.",
      "Windows packaging must produce release/latest.yml.",
      "Windows packaging must produce release/win-unpacked/Local VTT.exe for local smoke testing."
    ]);
  });

  it("rejects unsupported platforms", () => {
    expect(validatePackageArtifacts({ platform: "plan9", files: [] })).toEqual(["Unsupported package artifact platform plan9."]);
  });
});
