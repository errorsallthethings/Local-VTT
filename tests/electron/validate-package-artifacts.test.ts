import { describe, expect, it } from "vitest";

const {
  validateLinuxPackageArtifacts,
  validateMacPackageArtifacts,
  validatePackageArtifacts,
  validateWindowsPackageArtifacts
} = await import("../../scripts/validate-package-artifacts.mjs");

describe("validatePackageArtifacts", () => {
  it("accepts a complete Windows package artifact set", () => {
    expect(
      validateWindowsPackageArtifacts([
        "release/Local VTT Setup 0.1.15.exe",
        "release/Local VTT Setup 0.1.15.exe.blockmap",
        "release/latest.yml",
        "release/win-unpacked/Local VTT.exe"
      ])
    ).toEqual([]);
  });

  it("normalizes Windows separators", () => {
    expect(
      validatePackageArtifacts({
        platform: "win",
        version: "0.1.15",
        files: [
          "release\\Local VTT Setup 0.1.15.exe",
          "release\\Local VTT Setup 0.1.15.exe.blockmap",
          "release\\latest.yml",
          "release\\win-unpacked\\Local VTT.exe"
        ]
      })
    ).toEqual([]);
  });

  it("reports Windows package artifact version drift", () => {
    expect(
      validatePackageArtifacts({
        platform: "win",
        version: "0.1.15",
        files: [
          "release/Local VTT Setup 0.1.14.exe",
          "release/Local VTT Setup 0.1.14.exe.blockmap",
          "release/latest.yml",
          "release/win-unpacked/Local VTT.exe"
        ]
      })
    ).toEqual([
      "Windows installer filename must include package version 0.1.15.",
      "Windows installer blockmap filename must include package version 0.1.15."
    ]);
  });

  it("reports missing Windows installer metadata and unpacked executable", () => {
    expect(validateWindowsPackageArtifacts(["release/win-unpacked/resources/app.asar"])).toEqual([
      "Windows packaging must produce a release/*.exe installer.",
      "Windows packaging must produce a release/*.exe.blockmap update blockmap.",
      "Windows packaging must produce release/latest.yml.",
      "Windows packaging must produce release/win-unpacked/Local VTT.exe for local smoke testing."
    ]);
  });

  it("accepts complete macOS package artifacts", () => {
    expect(validateMacPackageArtifacts(["release/Local VTT-0.1.15.dmg", "release/latest-mac.yml"])).toEqual([]);
    expect(validatePackageArtifacts({ platform: "macos", version: "0.1.15", files: ["release/Local VTT-0.1.15.zip", "release/latest-mac.yml"] })).toEqual([]);
  });

  it("reports incomplete macOS package artifacts", () => {
    expect(validateMacPackageArtifacts(["release/Local VTT-0.1.15.dmg"])).toEqual(["macOS packaging must produce release/latest-mac.yml."]);
    expect(validateMacPackageArtifacts(["release/latest-mac.yml"])).toEqual(["macOS packaging must produce a release/*.dmg or release/*.zip package."]);
  });

  it("reports macOS package artifact version drift", () => {
    expect(validateMacPackageArtifacts(["release/Local VTT-0.1.14.dmg", "release/latest-mac.yml"], { version: "0.1.15" })).toEqual([
      "macOS package filename must include package version 0.1.15."
    ]);
  });

  it("accepts complete Linux package artifacts", () => {
    expect(
      validateLinuxPackageArtifacts([
        "release/Local VTT-0.1.15.AppImage",
        "release/localvtt_0.1.15_amd64.deb",
        "release/localvtt-0.1.15.x86_64.rpm",
        "release/latest-linux.yml"
      ])
    ).toEqual([]);
  });

  it("reports incomplete Linux package artifacts", () => {
    expect(validateLinuxPackageArtifacts(["release/Local VTT-0.1.15.AppImage"])).toEqual([
      "Linux packaging must produce a release/*.deb package.",
      "Linux packaging must produce a release/*.rpm package.",
      "Linux packaging must produce release/latest-linux.yml."
    ]);
  });

  it("reports Linux package artifact version drift", () => {
    expect(
      validateLinuxPackageArtifacts(
        [
          "release/Local VTT-0.1.14.AppImage",
          "release/localvtt_0.1.14_amd64.deb",
          "release/localvtt-0.1.14.x86_64.rpm",
          "release/latest-linux.yml"
        ],
        { version: "0.1.15" }
      )
    ).toEqual([
      "Linux AppImage package filename must include package version 0.1.15.",
      "Linux deb package filename must include package version 0.1.15.",
      "Linux rpm package filename must include package version 0.1.15."
    ]);
  });

  it("rejects unsupported platforms", () => {
    expect(validatePackageArtifacts({ platform: "plan9", files: [] })).toEqual(["Unsupported package artifact platform plan9."]);
  });
});
