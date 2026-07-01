# Local VTT

Local VTT is a lightweight, local-first Electron desktop app for in-person tabletop RPG sessions. It gives a Game Master a private control view and a separate player-facing view for a TV, monitor, or projector used as a physical battle map.

No login, accounts, cloud sync, or internet connection are required during play. Campaigns are portable local folders.

Local VTT is intentionally not a full campaign-management VTT. Tokens are lightweight map markers, not character sheets or combat entities.

## Downloads

GitHub Releases provide packaged desktop builds:

- Windows: use the `.exe` installer.
- macOS: use the `.dmg` or `.zip` artifact.
- Linux: use the `.AppImage`, `.deb`, or `.rpm` artifact for your distribution.

The Windows installer is not code signed, and macOS builds are not notarized yet, so operating systems may show publisher or security warnings on first launch.

## Useful Links

- [GitHub Releases](https://github.com/errorsallthethings/Local-VTT/releases): packaged builds and release notes.
- [GitHub Wiki](https://github.com/errorsallthethings/Local-VTT/wiki): user guides, troubleshooting, and workflow documentation.

## Current Capabilities

- Create, open, save, and quickly reopen portable local campaigns.
- Manage scenes, scene folders, scene thumbnails, and folder colors.
- Import static image maps, animated GIF maps, video maps, and reusable token assets.
- Use a private GM View with pan/zoom, resizable panels, layer controls, Token Library, and GM tools.
- Open a separate Player View, send scenes to it, target a saved display, and preserve fullscreen behavior during scene changes.
- Keep Player View open on a friendly waiting screen when the shown scene is deleted or unavailable.
- Replace a scene's map asset while preserving the scene setup, with a confirmation when replacement dimensions differ.
- Configure gridless, square, and hex scenes with per-scene measurement settings.
- Draw manual fog of war with brush, rectangle, circle, and polygon tools.
- Draw map annotations, shapes, and area templates with reusable tool settings and grid footprint previews.
- Add lightweight tokens, style them, reorder them, duplicate them, and animate visible Player View movement along waypoint paths.
- Assign token conditions with GM-only or Player View-visible ring indicators.
- Measure distance with a GM-only ruler, including waypoints, snapped grid points, crossed-cell highlights, and distance-mode readouts.
- Use live Table Tools for configurable click pings and a fading laser pointer trail.
- Run turn orders with campaign players, initiative values, Player View turn indicators, and display placement controls.
- Roll dice from the GM toolbar with formulas, custom presets, recent history, text results, 3D Panels, and scene-based 3D physics rolls.
- Add per-scene weather effects and localized animated effects from the Effects layer.
- Regenerate campaign thumbnails for imported maps and token assets when previews need to be rebuilt.
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

## Install Troubleshooting

`npm install` may report deprecation warnings from transitive Electron packaging dependencies, such as `rimraf`, `inflight`, `glob`, or `boolean`. To see why a package is installed, run:

```bash
npm explain rimraf
npm explain inflight
npm explain glob
npm explain boolean
```

If Electron did not create `node_modules/electron/path.txt` during install, first check whether lifecycle scripts are disabled:

```bash
npm config get ignore-scripts
```

When scripts are enabled, Local VTT runs `scripts/ensure-electron.mjs` after install to repair or download the Electron binary. You can also run it manually:

```bash
npm run electron:install
```

### Linux Graphics Options

Linux users can test Electron's Ozone platform and Vulkan flags when diagnosing Wayland, X11, or GPU driver issues:

```bash
LOCALVTT_OZONE_PLATFORM=wayland npm run dev
LOCALVTT_OZONE_PLATFORM=x11 npm run dev
LOCALVTT_OZONE_PLATFORM=auto npm run dev
LOCALVTT_ENABLE_VULKAN=1 npm run dev
LOCALVTT_DISABLE_VULKAN=1 npm run dev
```

These options are opt-in because the best combination depends on the compositor, GPU driver, and Electron/Chromium version. `LOCALVTT_DISABLE_VULKAN=1` takes precedence when both Vulkan variables are set.

## Backups And Recovery

Local VTT creates metadata-only JSON backups before overwriting `campaign.json` or existing scene JSON files. It keeps the latest 10 campaign backups and latest 10 backups per scene.

Backups intentionally do not copy assets, maps, videos, token images, or thumbnails so campaign folders do not balloon in size.

Use the Campaign panel's Restore Revision option to review and restore available metadata revisions from inside Local VTT. The restore dialog also includes Open Backups Folder for inspecting backup files in Explorer. Manual recovery should still be done while Local VTT is closed: copy a campaign backup over `campaign.json`, or copy a scene backup over the matching file in `scenes/`.

## Feature Overview

### Campaigns And Scenes

- Campaigns are local folders with portable JSON metadata.
- Recent Campaigns lets the GM reopen recently used campaigns and remove stale entries.
- Scene cards show compact map thumbnails when available.
- Scene folders support rename, color, collapse, drag/drop ordering, duplication, deletion, and saving all dirty scenes in a folder.
- Deleting a folder does not delete its scenes; scenes move back to Unfiled Scenes.
- Save indicators distinguish saved, unsaved scene, and unsaved campaign state.
- Campaign tools include Restore Revision and Regenerate Thumbnails actions for recovery and preview maintenance.

### Maps And Player View

- Static image, animated GIF, `.mp4`, and `.webm` maps can be imported.
- Video maps render muted and looped in GM View and Player View.
- Video map playback can be paused/resumed, muted/unmuted, and inspected with optional diagnostics from contextual GM canvas controls.
- Map assets can be replaced from the Map layer while preserving scene fog, tokens, drawings, effects, grid, and Player View setup.
- If a replacement map has different dimensions than the current map, Local VTT confirms the dimensions before applying the change.
- Table Display Setup walks through the common flow for choosing the Player View display, previewing a test pattern, setting the scene grid, fitting the map, and previewing Player View.
- Map fit presets include Manual, Fit Whole Map, Stretch to Grid, and Image Size.
- Static image maps can use known map grid dimensions, such as `44` by `25`, or filename hints such as `44x25`, to help fit the map to the scene grid.
- Advanced Map Calibration can align imported image maps to printed grids, borders, padding, or a drawn calibration area when normal fit presets are not enough.
- GM View uses adaptive static map rendering quality to keep large maps responsive while Player View can preserve the source image where practical.
- Player View can be opened, fullscreened, moved to a preferred display, exited from fullscreen, and closed from the Player View menu.
- Player View Setup can save, rename, switch, and delete named display profiles for different tables, screens, or testing displays.
- If a preferred Player View display is disconnected, Local VTT opens the Player View normally so the GM can drag it manually.
- Table Display Setup, Player View Setup, and Advanced Map Calibration are available from the Player View menu.

### Grid, Measurement, And Ruler

- Grid modes support gridless, square, and hex scenes.
- Grid & Maps controls include quick grid visibility, configurable coordinate labels, opacity reset, reusable color swatches, map fit presets, and advanced transform controls for static image maps.
- Grid coordinate labels can be placed inside cells or along grid edges, use independent X/Y alpha or numeric formats, and have configurable GM/Player label sizes and color.
- Measurement settings are available from Grid & Maps when square or hex grids are active.
- Player View Setup stores campaign-level calibration for the external player-facing display, including optional physical table scale for manual scene grids.
- Table Tools include the GM-only ruler, configurable ping, and laser pointer.
- The ruler supports square, hex, and gridless scenes.
- Ctrl/Cmd snaps ruler points to square grid centers or hex centers. Gridless measurement stays freeform.
- Drawing, template, and mask placement can snap to square grid centers, corners, and side centers, or hex centers/corners where applicable.
- Shift adds ruler waypoints while dragging. Right-click removes the last active ruler waypoint.
- Escape clears the active ruler measurement.
- The ruler highlights crossed squares/hexes and displays total path distance using the scene's Measurement settings.
- When the selected distance mode is not Euclidean, the ruler also shows a straight-line comparison.
- Ping sends a configurable live attention marker to GM View and Player View when the GM clicks the map.
- Laser Pointer shows a live fading trail in GM View and Player View while the GM drags on the map.

### Dice And Turn Order

- Dice rolls support standard polyhedral dice, coin flips, percentile rolls, arithmetic modifiers, advantage/disadvantage, quick dice buttons, and custom presets.
- The Tools menu opens the Dice Bag and Turn Order as draggable modals for live-session workflows.
- Dice display settings are campaign-specific and can independently show or hide GM View and Player View results.
- Dice results can render as text-only results, a 3D Panel, or a 3D Scene Roll with physics and delayed result reveal.
- Recent dice roll history is capped and keeps delayed 3D/scene roll results in sync with the final visible result.
- Turn orders can be built from campaign players or tokens, sorted by initiative, reset between encounters, and played/paused for Player View display.
- Turn orders support linked scene tokens, turn groups, round tracking, count tracker entries, and per-entry countdowns.
- Player View turn order indicators include configurable multi-edge placement, facing, sizing, avatar masks, visible-entry limits, round display, and player status styling.

### Effects Layer

- Effects are configured per scene from the Effects layer.
- Weather effects render as lightweight map-bound canvas overlays and respect GM View and Player View layer visibility.
- Weather effects currently include rain, snow, fog, and sand patterns.
- Weather controls include effect, enabled state, intensity, opacity, speed, drift, masks, and advanced pattern tuning.
- Weather masks exclude per-scene weather effects from specific map areas.
- Animated Effects are localized drawn areas for environmental visuals such as water, fire, smoke, fog, lava, electric, arcane, radiant, field, chaos, void, and nature effects.
- Animated Effects are drawn from the Effects Tools menu, appear as sub-layers under Effects, and can be selected, hidden, edited, or deleted from the GM canvas and layer list.
- Animated Effects include preset families for water, lava, smoke, fire, fog, cold, electric, acid, poison, darkness, arcane, radiant, force fields, shockwaves, chaos, void, and nature growth.
- Weather masks can be selected from the GM canvas, highlighted in their layer list, and toggled from a context menu.

### Drawing And Template Tools

- Drawing Tools support brush, line, rectangle, ellipse, triangle, polygon, stroke/fill controls, opacity presets, thickness presets, and custom tuning.
- Placed drawings can be selected, moved, resized, rotated, duplicated, hidden, deleted, and managed from Drawing sub-layers.
- Template Tools support line, radius, cube, and cone templates with configurable length/radius, width, stroke thickness, visual effect presets, live preview, and optional grid footprint display.
- Template labels scale with scene zoom and show only while drawing or when the template is selected.

### Fog Of War

- Fog mode can start fully revealed, fully hidden, or partially revealed.
- GM and Player fog opacity can be configured independently.
- New fog shapes can default to revealed or hidden in Player View.
- Brush, rectangle, circle, and polygon fog tools are available from the Tools Menu.
- Rectangle tools support Shift-drag to constrain to a square.
- Ctrl/Cmd shows the nearest square grid-corner or hex-corner snap point for rectangle, circle, and polygon placement.
- Polygon drawing supports Enter or double-click to finish, Escape to cancel, and right-click to remove the last active point.
- Fog shapes appear as sub-layers under Fog of War with tool icons, rename, reorder, GM/Player visibility, delete controls, and temporary canvas highlighting.
- Fog masks can be selected from the GM canvas, highlighted in their layer list, and toggled from a context menu while token selection keeps priority.
- In partially or fully hidden fog modes, Player View tokens are shown only where a player-visible reveal shape overlaps them.

### Tokens And Token Library

- Tokens are lightweight map markers for tracking physical or virtual positions.
- Token image assets can be imported from the Token Layer or directly into the Token Library.
- Imported token thumbnails are center-cropped to square previews. The token import flow supports manual crop framing before a token is added.
- Token Library assets can be searched, sorted, resized between list/small/medium/large views, renamed, deleted with scene-usage warnings, and assigned presentation defaults.
- Library tokens can be dragged onto the GM canvas or added to the active scene with the add button.
- Token sub-layers support selection, rename, duplicate, drag/drop reordering, GM/Player visibility, deletion, and per-token presentation settings.
- Token presentation settings include size presets, mask shape, border style, border width, border/glow colors, and optional footprint highlights.
- Token conditions can be assigned from the token context menu, hidden from Player View, and displayed as rotating condition rings.
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
- Player View Setup and Advanced Map Calibration use collapsible sections, inline help, readouts, and fixed footer actions.
- The Tools Menu groups Fog of War Tools, Effects Tools, Drawing Tools, Text Tools, Template Tools, Dynamic Lighting, Dice Bag, Turn Order, and Table Tools.

## Future Ideas

### Custom And Specialty Dice

- Add additional RPG-friendly dice such as D3, Fate/Fudge dice, and D66 table rolls.
- Support GM-defined custom dice with text or symbol faces, such as oracle, reaction, weather, hit-location, or complication dice.
- Allow themed dice appearances, including reusable color palettes or style presets for different campaigns and game systems.
- Keep custom dice campaign-specific so different game systems can maintain their own dice preferences and face sets.

## Architecture

- `electron/main.ts`: application lifecycle, secure window creation, campaign folder IO, asset import/copy, metadata backups, and Player View window control.
- `electron/preload.ts`: typed `contextBridge` API. The renderer never receives unrestricted filesystem access.
- `src/shared`: TypeScript models, default scene data, validation, and player-safe scene projection.
- `src/renderer`: React GM View, React Player View, and a Canvas 2D scene renderer.
- `src/renderer/styles`: focused CSS files imported by `src/renderer/styles.css`.

Rendering uses Canvas 2D for static and video maps, pan/zoom, grids, manual fog of war, ruler measurement, and lightweight GM tokens. The scene model and renderer boundary are intentionally isolated so future versions can replace or augment the canvas layer with PixiJS/WebGL for very large maps, advanced vision, lighting, and overlays.

See [`docs/architecture.md`](docs/architecture.md) for data flow notes and [`docs/layer-ownership-rules.md`](docs/layer-ownership-rules.md) for layer ownership rules.

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

Run the Electron runtime smoke test after a production build:

```bash
npm run smoke:electron
```

`npm run smoke:electron` builds the app, launches the production Electron entrypoint, verifies the GM preload bridge, opens Player View through IPC, sends a Player View idle state, and checks Electron display enumeration.

## Project Documentation

- [`docs/architecture.md`](docs/architecture.md): runtime structure, data flow, and layer ownership rules.
- [`docs/canvas-performance-budget.md`](docs/canvas-performance-budget.md): canvas performance targets, stress scenes, and measurement strategy.
- [`docs/codebase-audit.md`](docs/codebase-audit.md): audit progress, current hotspots, and recommended refactor sequence.
- [`docs/layer-ownership-rules.md`](docs/layer-ownership-rules.md): layer responsibilities, visibility rules, and guidance for placing new scene features.
- [`docs/release-process.md`](docs/release-process.md): release branch flow, packaging notes, and smoke test checklist.

## Known Limitations

- The Windows installer is not code signed, so Windows may show a publisher warning.
- Local VTT does not currently include health bars, permissions, character sheets, or combat automation.
- Dynamic lighting, walls, doors, windows, and vision-aware fog are not implemented yet.
- Token Library export/import packs are deferred.
- Backups cover campaign and scene JSON metadata only; map, video, token, and thumbnail assets are not duplicated.
- macOS notarization, auto-update, and release-channel infrastructure are not configured yet.

## Deferred Ideas

These ideas are intentionally outside the current focus:

- Token Library export/import packs.
- Health bars, permissions, and advanced token sheets.
- Full dynamic lighting, walls, doors, windows, and vision-aware fog.
- Text tools, pin tools, reusable object/prop layers, and advanced animated effect authoring.
- Advanced token library tags, grouping, bulk editing, and external asset management.
- Localization/string resource files after UI wording stabilizes.
- Light/custom themes after the dark-theme CSS token structure is stable.
- Installer signing, macOS notarization, auto-update, and release-channel polish.

Deferred features are represented in the TypeScript scene model so saved data can evolve without a redesign.
