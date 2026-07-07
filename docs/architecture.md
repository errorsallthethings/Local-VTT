# Local VTT Architecture Notes

Local VTT is a local-first Electron desktop app with a private GM View and a separate Player View. The app keeps campaign data in portable local folders and treats the Player View as a projected, filtered view of the active scene.

## Runtime Structure

- `electron/main.ts`: application lifecycle, secure window creation, service registration, and Player View window control. Feature-specific filesystem workflows should stay in focused Electron services or IPC modules rather than growing this file.
- `electron/preload.ts`: typed `contextBridge` API. The renderer never receives unrestricted filesystem access.
- `src/shared`: TypeScript models, default scene data, validation, schema normalization, and player-safe scene projection.
- `src/renderer`: React GM View, React Player View, and Canvas 2D scene rendering.
- `src/renderer/styles`: focused CSS files imported by `src/renderer/styles.css`.

Rendering uses Canvas 2D for static and video maps, pan/zoom, grids, manual fog of war, ruler measurement, lightweight GM tokens, drawings, templates, weather, effects, and scene overlays. Three.js supports 3D dice plus WebGL-backed weather, environment effects, and cached template visuals that are composited back into the Canvas 2D scene.

GM and Player windows run with `contextIsolation: true`, `nodeIntegration: false`, and a narrow preload bridge. Renderer sandboxing is currently deferred because the Electron preload is emitted as NodeNext/ESM JavaScript, which Electron's sandbox preload loader rejects. Enabling `sandbox: true` should be paired with changing the preload build output to a sandbox-compatible CommonJS bundle and rerunning the Electron smoke tests.

## Application Structure

Local VTT follows a React-friendly, Electron-friendly version of MVC rather than strict classic MVC:

- **Model / domain:** `src/shared`, `src/renderer/lib`, and focused Electron helpers own schemas, migrations, validation, projections, pure state transitions, persistence codecs, and reusable file/path rules.
- **View:** React components in `src/renderer/components` and app-level view composition in `src/renderer/views` render UI and expose typed user actions.
- **Controller / workflow coordination:** React hooks in `src/renderer/hooks` and Electron IPC registration modules coordinate app workflows, async work, and state transitions between views, domain helpers, and platform services.
- **Platform adapters:** Electron services in `electron/` own windows, dialogs, filesystem access, protocols, thumbnail/media integration, and packaging/runtime checks.

The purpose of this structure is separation of concerns, not pattern purity. New code should keep domain rules, React rendering, workflow orchestration, persistence, and native platform access in their existing lanes. See [`project-structure.md`](project-structure.md) for folder growth guidance and preferred future subfolders.

Wiki-ready PlantUML versions of the architecture diagrams live in [`diagrams/plantuml.md`](diagrams/plantuml.md). Keep those diagrams aligned when changing runtime boundaries, persistence flows, Player View projection, asset import/delete behavior, or smoke-test coverage.

## Data Flow

- Campaigns are stored as local folders with `campaign.json`, scene JSON files, and relative asset paths.
- JSON is the current persistence format for readability, backup friendliness, and easy sharing between Local VTT users. It should not be treated as a stable external editing API until import/export or a documented file contract exists.
- A portable campaign is the full campaign folder, not only `campaign.json`. Shared or backed-up campaigns must keep `campaign.json`, `scenes/`, and `assets/` together.
- Electron resolves absolute asset paths at runtime after a campaign is opened.
- Imported map and video assets are copied into campaign-owned asset folders before being referenced by metadata. Imported token art is cropped into a square token-ready campaign asset; the original oversized token source file is not retained after the crop is confirmed. Thumbnail generation is best-effort; missing thumbnails should not make campaign metadata invalid.
- Saved campaign metadata must not contain absolute asset paths. Persistence codecs strip runtime-only absolute paths and reject asset paths that are absolute, contain drive prefixes, or traverse outside the campaign folder.
- Renderer asset URLs use the `localvtt://asset/` protocol. The preload helper only formats URLs; the main-process protocol handler enforces the trust boundary by allowing only registered campaign asset paths or short-lived registered external token-import paths.
- Renderer code saves campaign and scene changes through the preload API.
- Player View receives a projected scene payload that strips GM-only content before crossing the IPC boundary.
- Campaign and scene files include schema versions so future migrations have an explicit upgrade path. Local VTT `0.1.8` writes campaign and scene schema version `2`.

## Schema Migrations

Schema version constants and version-support checks live in `src/shared/schemaMigrations.ts`. `src/shared/localvtt.ts` still owns broad normalization and default backfills, but version policy should stay in the migration module so future persisted-data changes have one obvious entry point.

When a release changes `campaign.json` or `*.scene.json` shape, update the relevant current schema version, add an explicit migration step in `schemaMigrations.ts`, and extend `tests/shared/schemaMigrationHarness.test.ts` with a legacy fixture or targeted regression. Future schema versions should continue to fail with a clear unsupported-version message instead of being silently rewritten.

## Campaign Health

Campaign summaries include a structured health report from `electron/campaignHealth.ts`. The current UI still uses the existing `missingAssets` list for compatibility, while the richer report tracks missing asset files, stale thumbnails, unreadable scene files, unknown asset references, and unreferenced campaign assets. This keeps JSON-folder campaigns easy to inspect without committing Local VTT to a database before there is a concrete need.

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
