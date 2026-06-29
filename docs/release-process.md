# Release Process

Release builds are created by GitHub Actions when a version tag matching `v*.*.*` is pushed. The release branch should contain the merged feature work and the matching app version before the tag is created.

## Release Branch Flow

Example release flow for `0.1.6`:

```bash
git fetch origin --prune
git switch release/0.1.6
git pull --ff-only origin release/0.1.6
git merge --no-ff feature/3d-dice-maybe -m "Merge 3D dice feature into release 0.1.6"
```

Bump the app version before tagging so `electron-builder` produces installers with the correct version:

```bash
npm version 0.1.6 --no-git-tag-version
```

Update `CHANGELOG.md`, then verify the release branch:

```bash
npm run release:notes -- --milestone 0.1.6 --output docs/release-notes/v0.1.6.md
npm run check
npm run build
npm run smoke:electron
```

Commit the release metadata:

```bash
git add package.json package-lock.json CHANGELOG.md docs/release-notes/v0.1.6.md
git commit -m "Prepare 0.1.6 release"
```

Push the release branch, create the release tag on that commit, and push the tag:

```bash
git push origin release/0.1.6
git tag -a v0.1.6 -m "Local VTT v0.1.6"
git push origin v0.1.6
```

Pushing the tag triggers `.github/workflows/release.yml`, which packages the Windows, macOS, and Linux builds and publishes the GitHub release assets. Use a new version/tag for each release; existing release assets are treated as immutable.

## Creating A Release

Use this process when preparing a new release:

1. Confirm the working tree is clean:

```bash
git status
```

2. Update release metadata if needed:

- `package.json` version, for example `0.1.1`.
- `package-lock.json` version if `npm version --no-git-tag-version` changed it.
- `src/shared/localvtt.ts` campaign and scene schema constants if the release changes persisted campaign or scene JSON shape.
- `CHANGELOG.md` release notes.
- `docs/release-notes/vX.Y.Z.md` generated from the matching GitHub milestone, then reviewed for human-readable wording.
- README known limitations or smoke checklist updates.

3. Generate release notes from the GitHub milestone:

```bash
npm run release:notes -- --milestone 0.1.1 --output docs/release-notes/v0.1.1.md
```

Review the generated notes before committing. They are grouped by existing `type:*` labels and are used by the GitHub Release workflow when the release tag is pushed.

4. Run local verification:

```bash
npm run check
npm run build
npm run smoke:electron
```

5. Commit the release metadata changes:

```bash
git add package.json package-lock.json src/shared/localvtt.ts CHANGELOG.md README.md docs
git commit -m "Prepare release 0.1.1"
git push
```

Only include `package-lock.json` if the version or dependencies changed there.

6. Create a tag on the exact commit you want to release:

```bash
git tag v0.1.1
git push origin v0.1.1
```

The release workflow listens for tags that match `v*.*.*`. Pushing the tag is what starts the release build. Creating a tag locally is not enough.

7. In GitHub, open Actions -> Build Release and confirm the run is for the tag, such as `refs/tags/v0.1.1`, not a manual run on `main`.

8. If the workflow succeeds, check GitHub Releases for the published release assets. The workflow also uploads Windows, macOS, and Linux build artifacts to the workflow run page.

GitHub Releases may be immutable after publishing. If a release workflow fails after creating a release, prepare a new version and tag instead of trying to replace assets on the existing release. If the release workflow fails before publishing the GitHub Release, read the failing step message first:

- Platform artifact validation failures mean the package job did not produce the expected installer or package files. Fix the packaging issue on the release branch, move or recreate the tag on the corrected commit if the tag has not published a release, and rerun by pushing that tag.
- Publish validation failures mean one or more platform artifacts were missing after download. Check the platform upload jobs before rerunning.
- Existing-release failures mean the tag already has a GitHub Release. Do not retry the same tag; create a new version and tag.

Manual `workflow_dispatch` runs are useful for testing the release workflow, but they do not publish a GitHub Release unless the run is for a tag. Download test builds from the workflow run's Artifacts section.

## Packaging

Packaging is configured with `electron-builder`. Put app icon assets in `build/`: `icon.svg` for the editable source, `icon.ico` for Windows, and `icon.icns` for macOS. The Windows build uses `build/icon.ico`, the macOS build uses `build/icon.icns`, and the Windows app window is also given `build/icon.ico` at runtime. The Windows installer creates Desktop and Start Menu shortcuts and uses an assisted per-user installer so the install location can be reviewed during setup.

The editable icon source is `build/icon.svg`. To regenerate the Windows icon file after changing the source artwork, run:

```bash
npm run generate:icon
```

Package for Windows:

```bash
npm run package:win
```

Package for macOS:

```bash
npm run package:mac
```

Successful Windows packaging creates:

```text
release/
  Local VTT Setup 0.1.0.exe
  win-unpacked/
    Local VTT.exe
```

Use `release/win-unpacked/Local VTT.exe` for quick local smoke testing before sharing the installer.

Code signing, macOS notarization, auto-update, and release-channel infrastructure are deferred.

## Installer Upgrade And Downgrade Testing

Run this checklist before publishing a Windows release installer. Use a disposable Windows user profile or VM when practical, and keep test campaign folders outside the application install directory so uninstall behavior is easy to verify.

### Windows Upgrade Checklist

1. Build or download the previous released Windows installer from GitHub Releases.
2. Build the candidate installer from the release branch:

```bash
npm run package:win
```

3. Install the previous release with the default per-user installer options.
4. Launch Local VTT from the Start Menu shortcut.
5. Create or open a campaign in a normal user folder, such as Documents.
6. Import at least one map and one token, save, close, and relaunch the previous release.
7. Install the candidate release over the previous release.
8. Launch Local VTT from the Start Menu shortcut and from the Desktop shortcut.
9. Confirm the app opens without startup errors.
10. Confirm the existing campaign opens and the campaign folder contents were not removed or rewritten unexpectedly.
11. Confirm Player View can still open from the upgraded install.
12. Uninstall Local VTT from Windows Apps or Programs and Features.
13. Confirm the campaign folder and its backups still exist after uninstall.
14. Reinstall the candidate release and confirm shortcuts are recreated.

### Windows Downgrade Checklist

1. Install and launch the candidate release.
2. Create or open a campaign, save it, then close the app.
3. Attempt to install the previous release over the candidate release.
4. Record whether the installer blocks, warns, or allows the downgrade.
5. If the downgrade is allowed, launch the previous release and try to open the campaign created or saved by the candidate release.
6. Confirm any schema-version warning or file-access failure is understandable and does not corrupt the campaign folder.
7. Uninstall the previous release and confirm the campaign folder remains intact.

Downgrades are not a supported recovery path unless a release explicitly says otherwise. If a downgrade is allowed by the installer, treat the result as compatibility evidence only, and warn users to keep campaign backups before opening files with an older app version.

### Result Log Template

```text
Release candidate:
Previous release tested:
Windows version:
Install type:
Upgrade result:
Downgrade attempt result:
Campaign folder retained after upgrade:
Campaign folder retained after uninstall:
Desktop shortcut result:
Start Menu shortcut result:
Notes or follow-up issues:
```

For macOS and Linux, test the closest equivalent flow where practical: install or unpack the previous artifact, open a campaign, replace it with the candidate artifact, confirm launch and campaign access, then remove the app artifact and confirm campaign folders remain.

## Smoke Test Checklist

Before packaging or sharing a build, run through these workflows:

- Start from a clean app state and confirm no-campaign/no-scene controls guide the GM without dead-end actions.
- Create and open a campaign.
- Reopen a campaign from Recent Campaigns and remove an entry from Recents.
- Create, rename, delete, duplicate, reorder, and save scenes.
- Rename, color, delete, duplicate, collapse, and reorder scene folders.
- Import static image maps, video maps, and token assets.
- Send scenes to Player View and confirm Player View fullscreen behavior remains stable.
- Delete the scene currently shown to players and confirm Player View switches to the waiting screen instead of closing.
- Resize/collapse GM side panels and the Token Library drawer.
- Change layer visibility and settings.
- Draw, rename, reorder, toggle, and delete fog shapes.
- Select weather and fog masks from the GM canvas and confirm token selection still takes priority.
- Configure square, hex, and gridless scenes, including grid fit-to-map for static maps.
- Use Player View Setup and Map Calibration Assistant on at least one static image map.
- Add, duplicate, move, rename, resize, restyle, and delete tokens.
- Confirm token presentation and movement sync to Player View.
- Use the Token Library to import, rename, search, sort, set defaults, add, drag/drop, and delete tokens with usage warnings.
- Use Table Tools: ruler on square, hex, and gridless scenes; ping by clicking after changing size/color; laser pointer by dragging.
- Open the Turn Order modal from Tools; build, clear, rebuild, play, pause, collapse, drag, and advance a turn order; confirm Player View indicators update correctly.
- Open the Dice Bag from Tools; roll dice with quick dice, formulas with modifiers, custom presets, GM/Player Hidden display modes, 3D Panel, and 3D Scene Roll.
- Close with unsaved scene changes, campaign-only changes, and both; confirm Save preserves changes and Close Without Saving discards them.
- Confirm common failure messages are actionable, including missing recent campaigns, missing assets, and disconnected Player View displays.
- For canvas-sensitive releases, run the representative stress scenes in `docs/canvas-performance-budget.md` and record any warning-threshold misses.
- Run `npm run check` and `npm run build`.
- Run `npm run smoke:electron` to launch the built Electron app, confirm the GM preload bridge is available, open Player View through IPC, send a Player View idle state, and verify display enumeration.

For packaged Windows builds, also run:

- `npm run package:win`.
- Open `release/win-unpacked/Local VTT.exe`.
- Confirm the app gets past the startup splash.
- Load a campaign and send static and video map scenes to Player View.
- Move tokens with Shift waypoints on square, hex, and gridless scenes.
- Confirm Player View token tweening/path behavior still works.
- Confirm Player View fullscreen behavior remains stable during scene changes.
- Confirm Open Backups Folder opens Explorer.
