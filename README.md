# Local VTT
LocalVTT is a lightweight, local-first Electron desktop app for in-person tabletop RPG sessions. It is designed for a Game Master with a private control display and a second player-facing display, such as a TV used as a physical battle map.

No login, accounts, cloud sync, or internet connection are required during use. Campaigns are stored as portable local folders.

## Phase 1 Architecture

- `electron/main.ts`: application lifecycle, secure window creation, campaign folder IO, asset import/copy, and Player View window control.
- `electron/preload.ts`: typed `contextBridge` API. The renderer never receives unrestricted filesystem access.
- `src/shared`: TypeScript models, default scene data, validation, and player-safe scene projection.
- `src/renderer`: React GM View, React Player View, and a Canvas 2D scene renderer.

Rendering currently uses Canvas 2D because Phase 1 only requires a single static map, pan/zoom, and grid rendering. The scene model and renderer boundary are intentionally isolated so Phase 2+ can replace or augment the canvas layer with PixiJS/WebGL for very large maps, animated maps, fog masks, lighting, and overlays.

## Campaign Folder Format

```text
LocalVTT Campaign/
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
```

Assets are stored with relative paths in JSON so campaign folders can be backed up or moved between computers.

Imported static image maps generate small JPEG thumbnails in `assets/thumbnails/` for the scene list. Thumbnails are metadata on map assets and avoid loading full-resolution battle maps just to render the sidebar.

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

## Packaging Notes

Packaging is configured with `electron-builder`, but signing, notarization, icons, auto-update, and installer polish are deferred.

macOS:

```bash
npm run package:mac
```

Windows:

```bash
npm run package:win
```

## Phase 1 Implemented

- Electron + React + TypeScript scaffold.
- Secure preload IPC surface.
- Create and open local campaign folders.
- Portable campaign/scene JSON.
- Scene library.
- Import static image and video map assets into `assets/maps`.
- GM View canvas with pan/zoom.
- Player View as a second `BrowserWindow`.
- Send active scene to Player View.
- Square grid controls with independent GM/Player visibility.
- Basic default layer model.
- Missing asset warnings.

## Phase 2A Started

- `.mp4` and `.webm` maps can be imported as video map assets.
- Video maps render in the GM and Player canvas, muted and looped.
- Video map playback can be paused/resumed, muted/unmuted, and inspected with optional diagnostics from the GM settings menu.
- Animated `.gif` image maps are redrawn continuously when used as the active map.
- Grid mode supports gridless, square, and hex options from the Grid Layer.
- Static image maps can use known map grid dimensions, such as 44x25, to calculate a matching grid cell size.
- Player View can be opened, fullscreened, exited from fullscreen, and closed from the Player View menu.
- Player Display Scale is available from the GM settings menu.
- Measurement settings are available from the GM settings menu.
- Static image scene thumbnails are shown in the scene list when available.

## Map Fit Modes

Map fit mode is configured from the Map Layer controls.

- `Manual`: uses the saved X/Y position, scale, and rotation values directly.
- `Fit contain`: scales the map so the entire image fits inside the current view without cropping.
- `Fit cover`: scales the map so it fills the current view; edges may be cropped.
- `Actual size`: draws the map at its native pixel size and centers it.

For maps built for a known grid size, enter the map grid width and height in the Grid Layer controls, for example `44` by `25`, then choose `Fit grid to map dimensions`. LocalVTT reads the static image dimensions and calculates a grid cell size from the image's native pixel size. This workflow currently supports static image maps.

## Player Display Scale

Player Display Scale stores calibration for the table-facing display. It is intended to help a GM target physical scale, such as one grid cell equaling one inch on a TV. These settings do not directly change the GM View grid or scene grid size.

- `Manual pixels per inch`: enter a known display density.
- `Screen size estimate`: enter resolution and diagonal size, then use the estimated PPI if it looks right.
- `Grid cell size`: enter the desired physical inches per grid cell and review the resulting target player cell size.

The panel shows readouts for saved player display PPI, target player grid cell size, and current scene grid cell size. When `Use physical display scale` is enabled and the settings are applied, the Player View renderer scales the scene so the player-facing grid targets that physical size. GM View remains unchanged.

Player Display Scale is campaign-level because the external display normally stays the same across scenes. Scene measurement and Grid Layer settings remain per-scene.

## Fog of War Tools

Manual fog of war is currently implemented with a floating GM canvas Tools Menu.

- Fog mode can start fully revealed, fully hidden, or partially revealed.
- GM and Player fog opacity can be configured independently.
- Reveal/hide operations are controlled by a toggle in the Fog of War Tools flyout.
- Brush, rectangle, and polygon fog tools are available.
- Rectangle tools support Shift-drag to constrain to a square.
- Holding Ctrl/Cmd shows the nearest grid-corner snap point for rectangle and polygon placement.
- Polygon drawing supports Enter or double-click to finish, Escape to cancel, and right-click to remove the last active point.
- Undo Last Fog Shape and Delete All Fog Shapes are available from the Tools Menu. Delete All prompts for confirmation.

## UI Notes

- The Campaign panel contains campaign name editing, New/Open/Save Campaign actions, and the local campaign file path.
- The Scene list uses compact scene cards with the scene name, thumbnail preview, per-scene save button, and scene actions menu.
- Scene folders can organize scenes in the sidebar. Scenes can be dragged into folders or back to Unfiled Scenes.
- Folder actions support rename, delete, and saving all dirty scenes in that folder.
- Layer settings are collapsible. Map, Grid, and Fog of War layer settings expand only when needed.
- The floating Tools Menu is intended to become the home for future GM tools such as drawings, ruler, pings, walls, lighting, and tokens.

## Roadmap

- Near-term: scene folder polish, including folder ordering, folder collapse/expand state, and stronger drag/drop affordances.
- Near-term: polish static and video scene thumbnails, including video first-frame thumbnails if reliable cross-platform.
- Phase 2: Player View fullscreen targeting, display calibration refinement, hex/gridless polish, improved grid alignment.
- Phase 3: manual fog of war polish, player-preview mode, fog persistence refinements, and later vision-aware fog structures.
- Phase 4: GM tokens, optional player-visible tokens, token image import, aura, light/vision data model.
- Phase 5: wall, door, and window drawing and editing.
- Phase 6: light sources, ambient light/darkness, bright/dim radius, optional wall-blocked lighting.
- Phase 7: drawings, pings, laser pointer, ruler, and spell templates.
- Phase 8: imported animated overlays/effects, opacity/scale/rotation, optional polygon masking.

Deferred features are represented in the TypeScript scene model so saved data can evolve without a redesign.
