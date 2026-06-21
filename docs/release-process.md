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
npm run check
npm run build
npm run smoke:electron
```

Commit the release metadata:

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "Prepare 0.1.6 release"
```

Push the release branch, create the release tag on that commit, and push the tag:

```bash
git push origin release/0.1.6
git tag -a v0.1.6 -m "Local VTT v0.1.6"
git push origin v0.1.6
```

Pushing the tag triggers `.github/workflows/release.yml`, which packages the Windows and macOS builds and publishes the GitHub release assets. Use a new version/tag for each release; existing release assets are treated as immutable.

## Creating A Release

Use this process when preparing a new release:

1. Confirm the working tree is clean:

```bash
git status
```

2. Update release metadata if needed:

- `package.json` version, for example `0.1.1`.
- `CHANGELOG.md` release notes.
- README known limitations or smoke checklist updates.

3. Run local verification:

```bash
npm run check
npm run build
npm run smoke:electron
```

4. Commit the release metadata changes:

```bash
git add package.json package-lock.json CHANGELOG.md README.md
git commit -m "Prepare release 0.1.1"
git push
```

Only include `package-lock.json` if the version or dependencies changed there.

5. Create a tag on the exact commit you want to release:

```bash
git tag v0.1.1
git push origin v0.1.1
```

The release workflow listens for tags that match `v*.*.*`. Pushing the tag is what starts the release build. Creating a tag locally is not enough.

6. In GitHub, open Actions -> Build Release and confirm the run is for the tag, such as `refs/tags/v0.1.1`, not a manual run on `main`.

7. If the workflow succeeds, check GitHub Releases for the published release assets. The workflow also uploads Windows and macOS build artifacts to the workflow run page.

GitHub Releases may be immutable after publishing. If a release workflow fails after creating a release, prepare a new version and tag instead of trying to replace assets on the existing release.

Manual `workflow_dispatch` runs are useful for testing the release workflow, but they do not publish a GitHub Release unless the run is for a tag. Download test builds from the workflow run's Artifacts section.

## Packaging

Packaging is configured with `electron-builder`. The Windows build uses the Local VTT icon in `build/icon.ico`, creates Desktop and Start Menu shortcuts, and uses an assisted per-user installer so the install location can be reviewed during setup.

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
