# Local VTT Architecture Notes

Local VTT is a local-first Electron desktop app with a private GM View and a separate Player View. The app keeps campaign data in portable local folders and treats the Player View as a projected, filtered view of the active scene.

For Wiki-ready diagrams of the same architecture, see [`diagrams/README.md`](diagrams/README.md).

## Runtime Structure

- `electron/main.ts`: application lifecycle, secure window creation, campaign folder IO, asset import/copy, metadata backups, and Player View window control.
- `electron/preload.ts`: typed `contextBridge` API. The renderer never receives unrestricted filesystem access.
- `src/shared`: TypeScript models, default scene data, validation, schema normalization, and player-safe scene projection.
- `src/renderer`: React GM View, React Player View, and Canvas 2D scene rendering.
- `src/renderer/styles`: focused CSS files imported by `src/renderer/styles.css`.

Rendering uses Canvas 2D for static and video maps, pan/zoom, grids, manual fog of war, ruler measurement, lightweight GM tokens, drawings, templates, and scene overlays. Three.js is used where 3D rendering is needed, such as dice.

## Data Flow

- Campaigns are stored as local folders with `campaign.json`, scene JSON files, and relative asset paths.
- Electron resolves absolute asset paths at runtime after a campaign is opened.
- Renderer code saves campaign and scene changes through the preload API.
- Player View receives a projected scene payload that strips GM-only content before crossing the IPC boundary.
- Campaign and scene files include schema versions so future migrations have an explicit upgrade path. Local VTT `0.1.8` writes campaign and scene schema version `2`.

## Layer Ownership

Layer responsibilities are intentionally narrow so tools, rendering, visibility, and persistence stay predictable as Local VTT grows. See [`layer-ownership-rules.md`](layer-ownership-rules.md) for detailed ownership rules, examples, visibility guidance, and feature-placement questions.

- **GM Layer**: GM-only notes, markers, secret overlays, and private prep content. Content here should not be projected to Player View unless a future feature explicitly moves or reveals it.
- **Fog of War Layer**: reveal/hide masks that control what parts of the map and player-visible tokens are visible to players.
- **Effects Layer**: per-scene weather settings, weather masks that exclude weather from areas, and localized animated environmental effects.
- **Drawings Layer**: GM-created drawing marks, shapes, text, and spell/area templates that are placed directly on the map.
- **Foreground Layer**: overhead scene assets such as roofs, tree canopies, bridges, or other visuals intended to appear above tokens.
- **Tokens Layer**: lightweight movable map markers for creatures, objects, or points of interest that participate in token selection, visibility, ordering, and movement paths.
- **Objects Layer**: reserved for future reusable props or interactable placed objects that are not tokens.
- **Dynamic Lighting Layer**: reserved for future walls, light sources, vision blockers, and line-of-sight data.
- **Grid Layer**: grid display, measurement, snapping, and calibration-related grid settings.
- **Map Layer**: the scene's base static image, animated GIF, or video map and its map transform/settings.

## Ownership Guidelines

- Put visual, map-bound GM annotations in Drawings unless they are private, then use GM Layer.
- Put weather, masks for weather, and localized animated environmental visuals in Effects.
- Put visibility/reveal logic in Fog of War, not Effects or Drawings.
- Put overhead cover art in Foreground.
- Put movable creatures, NPCs, objects, and table markers in Tokens until the future Objects layer is implemented.
- Keep Player View projection rules centralized so GM-only data does not leak through feature-specific code paths.
- Do not overload reserved layers. GM, Foreground, Objects, and Dynamic Lighting exist to keep future features from being folded into the wrong data model.
