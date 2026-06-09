# Local VTT

Local VTT is a lightweight, local-first Electron desktop app for in-person tabletop RPG sessions. It gives a Game Master a private control view and a separate player-facing view for a TV, monitor, or projector used as a physical battle map.

No login, accounts, cloud sync, or internet connection are required during play. Campaigns are portable local folders.

This version is intentionally not a full campaign-management VTT. Tokens are lightweight map markers, not character sheets or combat entities.

## Current MVP

- Create, open, save, and quickly reopen portable local campaigns.
- Manage scenes, scene folders, scene thumbnails, and folder colors.
- Import static image maps, animated GIF maps, video maps, and reusable token assets.
- Use a private GM View with pan/zoom, resizable panels, layer controls, Token Library, and GM tools.
- Open a separate Player View, send scenes to it, target a saved display, and preserve fullscreen behavior during scene changes.
- Keep Player View open on a friendly waiting screen when the shown scene is deleted or unavailable.
- Configure gridless, square, and hex scenes with per-scene measurement settings.
- Draw manual fog of war with brush, rectangle, circle, and polygon tools.
- Add lightweight tokens, style them, reorder them, duplicate them, and animate visible Player View movement along waypoint paths.
- Measure distance with a GM-only ruler, including waypoints, snapped grid points, crossed-cell highlights, and distance-mode readouts.
- Use live Table Tools for click pings and a fading laser pointer trail.
- Add configurable rain weather effects from the Weather layer.
- Store metadata-only backups for campaign and scene JSON before overwrites.

## Campaign Folder Format

```text
Local VTT Campaign/
  campaign.json
  assets/
    maps/
    thumbnails/
    tokens/
    overlays/
    effects/
    handouts/
  scenes/
    scene-id.scene.json
  backups/
    campaign/
    scenes/
      scene-id/
```

Assets are stored with relative paths in JSON so campaign folders can be backed up or moved between computers.

Imported static image and video maps generate small JPEG thumbnails in `assets/thumbnails/` for the scene list. Video thumbnails are captured from the first frame during import when Electron can decode the source video. Imported token assets also generate square JPEG thumbnails for token sub-layer previews and the Token Library.

## Backups And Recovery

Local VTT creates metadata-only JSON backups before overwriting `campaign.json` or existing scene JSON files. It keeps the latest 10 campaign backups and latest 10 backups per scene.

Backups intentionally do not copy assets, maps, videos, token images, or thumbnails so campaign folders do not balloon in size.

Use the Campaign panel's Open Backups Folder button to inspect backup files in Explorer. Manual recovery should be done while Local VTT is closed: copy a campaign backup over `campaign.json`, or copy a scene backup over the matching file in `scenes/`.

## Feature Overview

### Campaigns And Scenes

- Campaigns are local folders with portable JSON metadata.
- Recent Campaigns lets the GM reopen recently used campaigns and remove stale entries.
- Scene cards show compact map thumbnails when available.
- Scene folders support rename, color, collapse, drag/drop ordering, duplication, deletion, and saving all dirty scenes in a folder.
- Deleting a folder does not delete its scenes; scenes move back to Unfiled Scenes.
- Save indicators distinguish saved, unsaved scene, and unsaved campaign state.

### Maps And Player View

- Static image, animated GIF, `.mp4`, and `.webm` maps can be imported.
- Video maps render muted and looped in GM View and Player View.
- Video map playback can be paused/resumed, muted/unmuted, and inspected with optional diagnostics from contextual GM canvas controls.
- Map fit modes include Manual, Fit contain, Fit cover, and Actual size.
- Static image maps can use known map grid dimensions, such as `44` by `25`, to fit the grid to the map's native pixel size.
- Player View can be opened, fullscreened, moved to a preferred display, exited from fullscreen, and closed from the Player View menu.
- If a preferred Player View display is disconnected, Local VTT opens the Player View normally so the GM can drag it manually.
- Player View Display and Player Display Scale are available from the Player View menu.

### Grid, Measurement, And Ruler

- Grid modes support gridless, square, and hex scenes.
- Measurement settings are available from the Grid Layer when square or hex grids are active.
- Player Display Scale stores campaign-level calibration for the external player-facing display.
- Table Tools include the GM-only ruler, ping, and laser pointer.
- The ruler supports square, hex, and gridless scenes.
- Ctrl/Cmd snaps ruler points to square grid centers or hex centers. Gridless measurement stays freeform.
- Shift adds ruler waypoints while dragging. Right-click removes the last active ruler waypoint.
- Escape clears the active ruler measurement.
- The ruler highlights crossed squares/hexes and displays total path distance using the scene's Measurement settings.
- When the selected distance mode is not Euclidean, the ruler also shows a straight-line comparison.
- Ping sends a live attention marker to GM View and Player View when the GM clicks the map.
- Laser Pointer shows a live fading trail in GM View and Player View while the GM drags on the map.

### Weather Effects

- Weather is configured per scene from the Weather layer.
- Weather effects render as lightweight map-bound canvas overlays and respect GM View and Player View layer visibility.
- Rain effects currently include Light Rain, Rain, Heavy Rain, and Rain Storm.
- Weather controls include effect, enabled state, intensity, opacity, speed, and direction/drift.

### Fog Of War

- Fog mode can start fully revealed, fully hidden, or partially revealed.
- GM and Player fog opacity can be configured independently.
- New fog shapes can default to revealed or hidden in Player View.
- Brush, rectangle, circle, and polygon fog tools are available from the floating Tools Menu.
- Rectangle tools support Shift-drag to constrain to a square.
- Ctrl/Cmd shows the nearest square grid-corner or hex-corner snap point for rectangle, circle, and polygon placement.
- Polygon drawing supports Enter or double-click to finish, Escape to cancel, and right-click to remove the last active point.
- Fog shapes appear as sub-layers under Fog of War with tool icons, rename, reorder, GM/Player visibility, delete controls, and temporary canvas highlighting.
- In partially or fully hidden fog modes, Player View tokens are shown only where a player-visible reveal shape overlaps them.

### Tokens And Token Library

- Tokens are lightweight map markers for tracking physical or virtual positions.
- Token image assets can be imported from the Token Layer or directly into the Token Library.
- Imported token thumbnails are center-cropped to square previews. The token import flow supports manual crop framing before a token is added.
- Token Library assets can be searched, sorted, resized between list/small/medium/large views, renamed, deleted with scene-usage warnings, and assigned presentation defaults.
- Library tokens can be dragged onto the GM canvas or added to the active scene with the add button.
- Token sub-layers support selection, rename, duplicate, drag/drop reordering, GM/Player visibility, deletion, and per-token presentation settings.
- Token presentation settings include size presets, mask shape, border style, border width, border/glow colors, and optional footprint highlights.
- Square/gridless scenes keep token art square and snap to grid on release when a grid is active.
- Hex scenes keep token art square while using hex-aware snapping and footprint clusters.
- Shift adds token movement waypoints while dragging. Square and hex waypoints snap to grid/hex centers; gridless waypoints remain freeform.
- Token movement paths highlight crossed squares/hexes and show total movement distance using scene Measurement settings.
- Player View animates visible token movement along the GM's waypoint route.

### Interface Notes

- GM side panels and the Token Library drawer can be resized and collapsed.
- Layer settings are collapsible. Map, Grid, Fog of War, and Tokens expose controls only when relevant.
- Empty Campaign, Scenes, Layers, and Token Library areas show contextual helper text.
- Fog and Grid color controls open a modal picker with native color selection and reusable swatches.
- The floating Tools Menu currently contains Fog of War tools and Table Tools.

## Architecture

- `electron/main.ts`: application lifecycle, secure window creation, campaign folder IO, asset import/copy, metadata backups, and Player View window control.
- `electron/preload.ts`: typed `contextBridge` API. The renderer never receives unrestricted filesystem access.
- `src/shared`: TypeScript models, default scene data, validation, and player-safe scene projection.
- `src/renderer`: React GM View, React Player View, and a Canvas 2D scene renderer.
- `src/renderer/styles`: focused CSS files imported by `src/renderer/styles.css`.

Rendering uses Canvas 2D for static and video maps, pan/zoom, grids, manual fog of war, ruler measurement, and lightweight GM tokens. The scene model and renderer boundary are intentionally isolated so future versions can replace or augment the canvas layer with PixiJS/WebGL for very large maps, advanced vision, lighting, and overlays.

## Development

Install dependencies:

```bash
npm install
```

Run the app in development:

```bash
npm run dev
```

Build renderer and Electron files:

```bash
npm run build
```

Run ESLint:

```bash
npm run lint
```

Run the Vitest suite:

```bash
npm test
```

Run the full local verification pass:

```bash
npm run check
```

`npm run check` runs TypeScript typechecking, ESLint, and the Vitest suite.

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

## Creating A Release

GitHub Actions builds release packages from `.github/workflows/release.yml`.

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
- Configure square, hex, and gridless scenes, including grid fit-to-map for static maps.
- Add, duplicate, move, rename, resize, restyle, and delete tokens.
- Confirm token presentation and movement sync to Player View.
- Use the Token Library to import, rename, search, sort, set defaults, add, drag/drop, and delete tokens with usage warnings.
- Use Table Tools: ruler on square, hex, and gridless scenes; ping by clicking; laser pointer by dragging.
- Close with unsaved scene changes, campaign-only changes, and both; confirm Save preserves changes and Close Without Saving discards them.
- Confirm common failure messages are actionable, including missing recent campaigns, missing assets, and disconnected Player View displays.
- Run `npm run check` and `npm run build`.

For packaged Windows builds, also run:

- `npm run package:win`.
- Open `release/win-unpacked/Local VTT.exe`.
- Confirm the app gets past the startup splash.
- Load a campaign and send static and video map scenes to Player View.
- Move tokens with Shift waypoints on square, hex, and gridless scenes.
- Confirm Player View token tweening/path behavior still works.
- Confirm Player View fullscreen behavior remains stable during scene changes.
- Confirm Open Backups Folder opens Explorer.

## Known Limitations

- The Windows installer is not code signed, so Windows may show a publisher warning.
- Local VTT does not currently include initiative tracking, health bars, permissions, character sheets, or combat automation.
- Dynamic lighting, walls, doors, windows, and vision-aware fog are not implemented yet.
- Token Library export/import packs are deferred.
- Backups cover campaign and scene JSON metadata only; map, video, token, and thumbnail assets are not duplicated.
- macOS notarization, auto-update, and release-channel infrastructure are not configured yet.

## Deferred / Future Enhancements

These ideas are intentionally outside the current MVP unless they become release blockers:

- Token Library export/import packs.
- Initiative, health bars, conditions, permissions, and advanced token sheets.
- Full dynamic lighting, walls, doors, windows, and vision-aware fog.
- Drawing layers, pings, laser pointer, spell templates, overlays, and animated effects.
- Advanced token library tags, grouping, bulk editing, and external asset management.
- Localization/string resource files after UI wording stabilizes.
- Light/custom themes after the dark-theme CSS token structure is stable.
- Installer signing, macOS notarization, auto-update, and release-channel polish.

Deferred features are represented in the TypeScript scene model so saved data can evolve without a redesign.
