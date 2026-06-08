# Local VTT
Local VTT is a lightweight, local-first Electron desktop app for in-person tabletop RPG sessions. It is designed for a Game Master with a private control display and a second player-facing display, such as a TV used as a physical battle map.

No login, accounts, cloud sync, or internet connection are required during use. Campaigns are stored as portable local folders.

## Architecture

- `electron/main.ts`: application lifecycle, secure window creation, campaign folder IO, asset import/copy, and Player View window control.
- `electron/preload.ts`: typed `contextBridge` API. The renderer never receives unrestricted filesystem access.
- `src/shared`: TypeScript models, default scene data, validation, and player-safe scene projection.
- `src/renderer`: React GM View, React Player View, and a Canvas 2D scene renderer.

Rendering uses Canvas 2D for static and video maps, pan/zoom, grids, manual fog of war, ruler measurement, and lightweight GM tokens. The scene model and renderer boundary are intentionally isolated so future versions can replace or augment the canvas layer with PixiJS/WebGL for very large maps, advanced vision, lighting, and overlays.

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

Imported static image and video maps generate small JPEG thumbnails in `assets/thumbnails/` for the scene list. Video thumbnails are captured from the first frame during import when Electron can decode the source video. Imported token assets also generate square, center-cropped JPEG thumbnails for token sub-layer previews and the Token Library. Thumbnails are metadata on assets and avoid loading full-resolution battle maps, token art, or live video elements just to render sidebars.

Local VTT creates metadata-only JSON backups before overwriting `campaign.json` or existing scene JSON files. Backups are stored under `backups/campaign/` and `backups/scenes/<scene-id>/`, with the latest 10 campaign backups and latest 10 backups per scene retained. These backups intentionally do not copy assets, maps, videos, token images, or thumbnails so campaign folders do not balloon in size.

Use the Campaign panel's Open Backups Folder button to inspect backup files in Explorer. Manual recovery should be done while Local VTT is closed: copy a campaign backup over `campaign.json`, or copy a scene backup over the matching file in `scenes/`.

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

## Packaging Notes

Packaging is configured with `electron-builder`. The Windows build uses the Local VTT icon in `build/icon.ico`, creates Desktop and Start Menu shortcuts, and uses an assisted per-user installer so the install location can be reviewed during setup.

The editable icon source is `build/icon.svg`. To regenerate the Windows icon file after changing the source artwork, run:

```bash
npm run generate:icon
```

Code signing, macOS notarization, auto-update, and release-channel infrastructure are deferred.

macOS:

```bash
npm run package:mac
```

Windows:

```bash
npm run package:win
```

Successful Windows packaging creates:

```text
release/
  Local VTT Setup 0.1.0.exe
  win-unpacked/
    Local VTT.exe
```

Use `release/win-unpacked/Local VTT.exe` for quick local smoke testing before sharing the installer.

## MVP Scope

The current MVP is focused on a local-first battle map companion for in-person play:

- Create/open/save portable local campaign folders.
- Manage scenes and scene folders.
- Import static image, video, and token assets into the campaign folder.
- Display a private GM View and a separate Player View.
- Send selected scenes to Player View with map, grid, fog, and visible tokens.
- Support lightweight GM token markers, token reuse through the Token Library, manual fog of war, and GM-only ruler measurement.
- Keep campaign data local with no accounts, login, cloud sync, or internet dependency during play.

This version is intentionally not a full campaign-management VTT. Tokens are lightweight map markers, not character sheets or combat entities.

## Current Smoke Test Checklist

Before packaging or sharing a build, run through these workflows:

- Start from a clean app state and confirm no-campaign/no-scene controls guide the GM without dead-end actions.
- Create and open a campaign.
- Reopen a campaign from Recent Campaigns and remove an entry from Recents.
- Create, rename, delete, and save scenes.
- Rename, color, delete, collapse, and reorder scene folders.
- Import static image maps, video maps, and token assets.
- Send scenes to Player View and confirm Player View fullscreen behavior remains stable.
- Resize/collapse GM side panels and the Token Library drawer.
- Change layer visibility and settings.
- Draw, rename, reorder, toggle, and delete fog shapes.
- Configure square, hex, and gridless scenes, including grid fit-to-map for static maps.
- Add, duplicate, move, rename, resize, restyle, and delete tokens.
- Confirm token presentation and movement sync to Player View.
- Use the Token Library to import, rename, search, sort, set defaults, add, drag/drop, and delete tokens with usage warnings.
- Use the ruler on square, hex, and gridless scenes.
- Close with unsaved scene changes, campaign-only changes, and both; confirm Save preserves changes and Close Without Saving discards them.
- Run `npm run check` and `npm run build`.

For packaged Windows builds, also run:

- `npm run package:win`.
- Open `release/win-unpacked/Local VTT.exe`.
- Confirm the app gets past the startup splash.
- Load a campaign and send static and video map scenes to Player View.
- Move tokens with Shift waypoints on square, hex, and gridless scenes.
- Confirm Player View token tweening/path behavior still works.
- Confirm Player View fullscreen behavior remains stable during scene changes.

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

## Foundational Features

- Electron + React + TypeScript scaffold.
- Secure preload IPC surface.
- Create and open local campaign folders.
- Portable campaign/scene JSON.
- Scene library.
- Import static image and video map assets into `assets/maps`.
- GM View canvas with pan/zoom.
- Player View as a second `BrowserWindow`.
- Send active scene to Player View.
- Grid controls with independent GM/Player visibility.
- Basic default layer model.
- Missing asset warnings.

## Implemented Feature Summary

- Static image maps, animated GIF maps, `.mp4` maps, and `.webm` maps can be imported as map assets.
- Video maps render in the GM and Player canvas, muted and looped.
- Video map playback can be paused/resumed, muted/unmuted, and inspected with optional diagnostics from contextual GM canvas controls.
- Video map scenes use generated JPEG thumbnails when available, with a lightweight video fallback if thumbnail capture fails.
- Animated `.gif` image maps are redrawn continuously when used as the active map.
- Grid mode supports gridless, square, and hex options from the Grid Layer.
- Static image maps can use known map grid dimensions, such as 44 by 25, to calculate a matching grid cell size.
- Player View can be opened, fullscreened, exited from fullscreen, and closed from the Player View menu.
- Player View can target a saved display and optionally open fullscreen there. If the saved display is missing, Local VTT falls back to a normal draggable Player View window.
- Player View display selection and Player Display Scale are available from the Player View menu.
- Measurement settings are available from the Grid Layer settings when square or hex grids are active.
- Static image and video scene thumbnails are shown in the scene list when available.
- GM View side panels can be resized, collapsed, and restored with persistent local workspace layout preferences.
- Scene folders support collapse state persistence, drag/drop targets, folder colors, and color preset swatches.
- CSS custom properties are defined in `src/renderer/styles/base.css` to support repeated UI values and future theme work.
- Token image assets can be imported into `assets/tokens` with generated square thumbnails for the Token Layer.
- The Token Library drawer can import reusable token assets, filter/sort them, change thumbnail display size, drag them onto the GM canvas, or add them to the active scene from the library.
- Token Library assets can be renamed, deleted with scene-usage warnings, and assigned presentation defaults directly from the library menu.
- Token sub-layers support rename, reordering, GM/Player visibility, deletion, and per-token presentation settings.
- Token presentation settings include size presets, mask shape, border style, border width, border/glow colors, and optional footprint highlights.
- Token movement supports waypoint previews, crossed-cell highlights, measured route distance, and Player View tweening along the route.
- Player-visible tokens render in Player View and respect manual fog visibility rules.
- GM-only ruler measurement supports square, hex, and gridless scenes, waypoint paths, crossed-cell highlights, and distance-mode readouts.

## Map Fit Modes

Map fit mode is configured from the Map Layer controls.

- `Manual`: uses the saved X/Y position, scale, and rotation values directly.
- `Fit contain`: scales the map so the entire image fits inside the current view without cropping.
- `Fit cover`: scales the map so it fills the current view; edges may be cropped.
- `Actual size`: draws the map at its native pixel size and centers it.

For maps built for a known grid size, enter the map grid width and height in the Grid Layer controls, for example `44` by `25`, then choose `Fit grid to map dimensions`. Local VTT reads the static image dimensions and calculates a grid cell size from the image's native pixel size. This workflow supports static image maps.

## Player Display Scale

Player Display Scale stores calibration for the table-facing display. It is intended to help a GM target physical scale, such as one grid cell equaling one inch on a TV. These settings do not directly change the GM View grid or scene grid size.

- `Manual pixels per inch`: enter a known display density.
- `Screen size estimate`: enter resolution and diagonal size, then use the estimated PPI if it looks right.
- `Grid cell size`: enter the desired physical inches per grid cell and review the resulting target player cell size.

The panel shows readouts for saved player display PPI, target player grid cell size, and current scene grid cell size. When `Use physical display scale` is enabled and the settings are applied, the Player View renderer scales the scene so the player-facing grid targets that physical size. GM View remains unchanged.

Player Display Scale is campaign-level because the external display normally stays the same across scenes. Scene measurement and Grid Layer settings remain per-scene.

## Fog of War Tools

Manual fog of war is controlled from the floating GM canvas Tools Menu.

- Fog mode can start fully revealed, fully hidden, or partially revealed.
- GM and Player fog opacity can be configured independently.
- New fog shapes can default to revealed or hidden in Player View.
- Reveal/hide operations are controlled by a toggle in the Fog of War Tools flyout.
- Brush, rectangle, circle, and polygon fog tools are available.
- Rectangle tools support Shift-drag to constrain to a square.
- Holding Ctrl/Cmd shows the nearest square grid-corner or hex-corner snap point for rectangle, circle, and polygon placement.
- Polygon drawing supports Enter or double-click to finish, Escape to cancel, and right-click to remove the last active point.
- Undo Last Fog Shape and Delete All Fog Shapes are available from the Tools Menu. Delete All prompts for confirmation.
- Fog shapes appear as sub-layers under the Fog of War Layer, with tool icons, rename, reordering, GM/Player visibility, delete controls, and temporary canvas highlighting when selected.
- In partially or fully hidden fog modes, Player View tokens are shown only when a player-visible reveal shape overlaps the token.

## Ruler and Measurement

The GM-only ruler tool lives in the floating Tools Menu.

- Left-drag to measure a path.
- Holding Ctrl/Cmd snaps ruler points to square grid centers or hex centers. Gridless measurement stays freeform.
- Press Shift while dragging to add a ruler waypoint. Ctrl/Cmd + Shift adds a snapped waypoint.
- Right-click removes the last active ruler waypoint.
- Escape clears the active ruler measurement.
- The ruler highlights crossed squares/hexes and displays total path distance using the scene Measurement settings.
- When the selected distance mode is not Euclidean, the ruler also shows a straight-line comparison.
- The Measurement settings panel includes a help button explaining Euclidean, Manhattan, Grid snapped, and 5/10/5/10 diagonal modes.

## Tokens

Tokens are intentionally lightweight for this version of Local VTT. They are meant to help the GM track physical or virtual markers on the map without turning the app into a full campaign-management VTT.

- Import token image assets from the Token Layer or directly into the Token Library.
- Imported token thumbnails are center-cropped to square previews. The token import flow also supports manual crop framing before a token is added.
- Token sub-layers provide quick selection, rename, duplicate, drag/drop reordering, GM/Player visibility toggles, and an options menu.
- Per-token settings include:
  - Size preset: Tiny/Small, Medium, Large, Huge, Gargantuan, and Custom for non-hex grids.
  - Mask: circle, square, or none.
  - Border style: none, solid, dashed, dotted, double line, embossed, inner shadow, or glow.
  - Border width presets with a custom pixel value.
  - Border color and glow color.
  - Optional footprint highlight shown in GM and Player views when enabled.
- Square/gridless scenes keep token art square and snap to grid on release when a grid is active.
- Hex scenes keep token art square while using hex-aware snapping and footprint clusters. Large, Huge, and Gargantuan footprints approximate 3, 7, and 19 occupied hexes respectively.
- While dragging a token, press Shift to add a waypoint. Square and hex waypoints snap to grid/hex centers; gridless waypoints remain freeform.
- Token movement paths highlight crossed squares/hexes and show total movement distance using the scene Measurement settings.
- Escape cancels the active token drag without moving the token.
- Player View animates visible token movement along the GM's waypoint route.

## UI Notes

- The Campaign panel contains campaign name editing, New/Open/Save Campaign actions, and the local campaign file path.
- The Scene list uses compact scene cards with the scene name, thumbnail preview, per-scene save button, and scene actions menu.
- Scene folders can organize scenes in the sidebar. Scenes can be dragged into folders or back to Unfiled Scenes.
- Scene folders visually wrap their scenes, can be collapsed, and can use custom folder colors.
- Folder actions support rename, color, delete, and saving all dirty scenes in that folder.
- Deleting a folder does not delete its scenes; scenes in that folder move back to Unfiled Scenes.
- Empty Campaign, Scenes, and Layers panels show contextual helper text so the GM knows the next setup step.
- Layer settings are collapsible. Map, Grid, Fog of War, and Token layer controls expand only when needed.
- Token and fog sub-layers can be managed from the Layers panel. Token presentation settings live on each token sub-layer.
- The Token Library drawer can be collapsed, resized, searched, sorted, and switched between list/small/medium/large thumbnail views.
- Use a library token's Rename, Set Defaults, and Delete actions to manage reusable token assets without changing custom names already assigned to placed scene tokens.
- Set Defaults reuses size, mask, border, glow, and footprint presentation on future adds.
- Fog and Grid color controls use compact color rows that open a modal picker with native color selection and reusable swatches.
- The floating Tools Menu contains Fog of War tools and the GM-only ruler. It is intended to become the home for future GM tools such as drawings, pings, walls, and lighting.

## Styling Notes

- Global styles are split across focused files in `src/renderer/styles/`, with `src/renderer/styles.css` serving as the import manifest.
- Shared CSS custom properties live in `src/renderer/styles/base.css`.
- Current color preset swatches are centralized in `src/renderer/components/controls/ColorPickerField.tsx`.
- The current UI is dark-theme-first. The CSS token structure is intended to make later light/custom themes easier without adding Sass/Less yet.

## Roadmap

- Pre-MVP stabilization: release-blocker review, packaging checks, documentation cleanup, and targeted bug fixes from smoke testing.
- MVP polish: continue token, fog, layer-panel, ruler, and Player View interaction polish based on tabletop use.
- Post-MVP: revisit the deferred feature list once the lightweight local battle-map workflow is stable.

Deferred features are represented in the TypeScript scene model so saved data can evolve without a redesign.
