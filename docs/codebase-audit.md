# Codebase Audit Notes

These notes summarize the mid-0.1.x codebase audit work and the next practical cleanup targets. The goal is to keep Local VTT reliable for live tabletop sessions while reducing large-component risk over time.

## Completed Audit Improvements

- Added campaign and scene schema versioning foundations so future migrations have an explicit upgrade path.
- Added Electron smoke-test coverage for the packaged runtime path.
- Documented architecture, data flow, and layer ownership in `docs/architecture.md`.
- Extracted modal and tool UI pieces out of `GmApp` and `ToolsMenu` where the split was low risk.
- Extracted GM workspace topbar bridge wiring so Player View menu actions and dice setting prop mapping live beside the workspace topbar instead of the app composition root.
- Moved repeated scene mutation rules into focused helpers:
  - selection visibility and deletion
  - environment effect type switching
  - map calibration draft application
  - dice history capping and deduplication
  - player idle state projection
  - turn-order player entry synchronization
- Extracted and tested Electron main-process helpers for:
  - campaign metadata paths and required campaign folders
  - atomic campaign/scene metadata writes
  - metadata backup naming, path resolution, and restore-preview entries
  - atomic metadata backup creation
  - asset import validation, safe filenames, import paths, thumbnail paths, and removal paths
  - unreferenced asset pruning with shared-file protection
  - asset path hydration and local asset protocol allowlist registration
  - map replacement warnings and map asset reuse checks
  - token asset usage checks
  - token asset promotion from legacy source-plus-thumbnail assets to canonical cropped assets
  - scene entry creation, duplication insertion, and save-time metadata updates
  - thumbnail import, regeneration diagnostics, and video thumbnail fallback capture
- Hardened metadata read diagnostics so invalid JSON, invalid structure, and newer-schema files produce clearer recovery guidance.
- Added Campaign Health refresh-on-open and a maintenance action for pruning unreferenced assets.
- Changed new token imports to persist the cropped/token-ready image as the canonical token asset instead of retaining oversized source art in the campaign folder.
- Added an explicit, tested 2D environment effect draw registry guard so future effect-family renderer splits stay aligned with the public effect catalog.
- Extracted tested template-effect asset/glow support helpers, overlay cache helpers, and renderable registry guards from the drawing renderer as the first step toward separating template rendering from base drawing rendering.
- Moved LayerPanel weather update transitions into tested helpers, reducing inline UI orchestration for weather categories, effect selection, and tuning resets.
- Split the shared layer row chrome out of `LayerPanel`, leaving the parent component focused on per-layer content and state coordination.
- Centralized SceneCanvas selection-clearing policy into a tested helper so token, drawing, fog, weather, and environment selections do not drift independently.
- Extracted SceneCanvas render-plan calculations for render camera, map sources, weather source readiness, and grid visibility into a tested canvas helper.
- Made SceneCanvas pointer-down route selection explicit and tested, preserving the existing branch order while reducing long repeated boolean guards in the handler.
- Consolidated GmApp selected-scene-item payload construction into a tested scene helper and reused it for visibility/delete actions.
- Tightened Windows package artifact validation so release checks require the installer blockmap alongside the installer, update metadata, and unpacked executable.
- Converted environment-effect tuning field resolution to a tested registry, including the legacy `electric` to `lightningTuning` mapping.
- Extracted and tested environment-effect layer tuning override construction so the long draw API's positional parameters are guarded against drift.
- Extracted drawing preview-to-render-element conversion from the large drawing renderer, keeping preview rendering semantics covered separately from committed drawing creation.
- Extracted and tested GmApp map fit scene builders for wizard and preset flows so the view coordinates image loading/player sync instead of duplicating grid/map-transform construction.
- Extracted and tested GmApp scene/folder/campaign naming reducers and dialog state builders so name trimming, draft rename propagation, and active-scene rename updates are no longer inline view logic.
- Expanded Player View sync tests so explicit sends and background updates are covered as projection-only operations that strip GM-only payload data without mutating the GM campaign or scene state.
- Hardened metadata backup restore for missing scene files and expanded recovery regressions for malformed backups and unsafe portable paths so failed restores cannot overwrite current campaign metadata.
- Expanded Electron file-safety regressions for unreferenced asset pruning and campaign path boundaries so stale hydrated paths outside the campaign are retained for review instead of deleted.
- Extracted and tested SceneCanvas interaction cancellation policy so Escape handling and cancelable interaction detection are no longer inline component logic.
- Extracted and tested SceneCanvas pointer-up routing and hover reset policy, reducing inline interaction branch ordering in the canvas component.
- Extracted and tested SceneCanvas pointer-move route selection so active drag branch ordering is explicit before deeper interaction-mode splits.
- Extracted and tested SceneCanvas pointer-move fallback routing for polygon drafts, brush hover, and default hover/snap updates.
- Extracted and tested SceneCanvas pointer-move fallback update helpers for polygon draft current points and brush hover point selection.
- Extracted and tested token pointer-move action policy so missing-token cancellation and drag preview updates are no longer inline SceneCanvas branching.
- Extracted and tested fog, weather-mask, and environment-effect pointer-move action policies so preview/ref updates are no longer inline SceneCanvas branching.
- Extracted and tested drawing, ruler, and laser pointer-move action policies so preview/ref/live-event updates are no longer inline SceneCanvas branching.
- Extracted and tested map calibration, drawing-transform, and mask/effect pointer-move action policies so draft, preview, and snap updates are no longer inline SceneCanvas branching.
- Extracted and tested map calibration, drawing-transform, and mask/effect pointer-completion action policies so finish/commit side effects are explicit before SceneCanvas applies them.
- Extracted and tested drag creation commit actions for drawings, fog, weather masks, and environment effects so SceneCanvas creation branches no longer interpret nullable commit helpers inline.
- Extracted and tested polygon draft commit actions for drawings, fog, weather masks, and environment effects so keyboard/double-click draft commits follow the same explicit action pattern as drag commits.
- Extracted and tested SceneCanvas keyboard waypoint actions, double-click draft routing, and hover/snap update helpers so several event decisions now live in focused policy helpers.
- Extracted and tested SceneCanvas map viewport policy for GM auto-fit and video-map error/readiness handling so media viewport decisions are no longer inline condition ladders.
- Extracted and tested SceneCanvas lifecycle reset action policies so scene/tool/mode cleanup effects share explicit reset lists instead of repeated inline clearing code.
- Extracted and tested SceneCanvas context-menu routing for waypoint removal, polygon backtracking, and target menu kind selection.
- Split the environment effect drawer registry out of the layer renderer so future effect-family modules can move behind a stable registry seam.
- Extracted shared WebGL environment-effect runtime helpers and moved the smoke/fog effect family into its own renderer module while preserving the existing public effect exports.
- Moved the lava/fire/lightning elemental effect family into its own renderer module and pointed the drawer registry at that module directly.
- Moved the acid/poison/cold/darkness hazard effect family into its own renderer module and pointed the drawer registry at that module directly.
- Moved the arcane/chaos/void/nature/radiant/force-field/shockwave/distortion magic effect family into its own renderer module and pointed the drawer registry at that module directly.
- Moved the remaining water effect implementation into its own renderer module, leaving `environmentEffectsRenderer.ts` as the compatibility export and runtime disposal coordinator.
- Extracted and tested GmApp campaign asset modeling, campaign maintenance state, and dialog draft state so the GM composition root owns less modal and asset-prep wiring.
- Split repetitive GM name/color dialogs out of `GmDialogs`, keeping the modal aggregator focused on workflow composition.
- Extracted and tested SceneCanvas context-menu state/opening coordination so selection callback dispatch and menu state updates no longer live inline in the canvas component.
- Extracted and tested SceneCanvas asset preparation, selection state preparation, and environment-effect tuning aggregation so render/input code consumes focused view models instead of rebuilding them inline.
- Documented that Electron smoke and visual smoke should run sequentially because both scripts drive Player View IPC and can interfere when launched concurrently.
- Split drawing stroke dash policy and template asset overlay composition out of `drawingRenderer.ts`, reducing the drawing renderer to shape orchestration while keeping cached template overlays behind a focused module.
- Centralized template-effect WebGL canvas creation, snapshotting, and disposal so generated template renderables share one lifecycle path instead of repeating setup/cleanup in every effect recipe.
- Split drawing transform point-snapshot movement helpers and pure resize/rotation geometry out of `drawingTransform.ts`, leaving the transform module focused on selected-drawing bounds, handle hit-testing, and drag-start orchestration.
- Moved template grid-highlight rendering into the grid-highlight module and isolated rectangle/circle/polygon intersection math with direct tests, keeping template presentation focused on fills, effect paths, and labels.
- Split template-effect renderable runtime setup, shared lightning-line primitives, and the fog/lightning/storm/thunder family out of the main renderable catalog while preserving the stable renderable asset ids.
- Split the acid/poison/cold/darkness hazard template-effect family out of the main renderable catalog while keeping shared lightning-line primitives reusable across effect families.
- Split the nature/radiant/water/web template-effect family out of the main renderable catalog, leaving `templateEffectRenderables.ts` as mostly registry/cache plus the remaining arcane/psychic/fire recipes.
- Extracted SceneCanvas viewport center reporting, wheel zoom wiring, and video-map event handling into focused hooks so map media/lifecycle mechanics no longer sit inline with pointer-mode orchestration.
- Extracted SceneCanvas polygon draft state, refs, keyboard commit/cancel behavior, and per-draft commit handlers into a focused hook so fog, drawing, weather, and environment polygon lifecycles share one owner.
- Extracted SceneCanvas token-asset drop wiring and hover/snap/tool-point event helpers into focused hooks so browser event mechanics and canvas point resolution are separated from pointer-mode routing.
- Extracted SceneCanvas mouse-event handling for pointer leave, ping clicks, double-click draft commits, and context-menu routing into a focused hook so non-drag mouse behavior is no longer inline with pointer drag handlers.
- Extracted the SceneCanvas render loop into a dedicated renderer hook, keeping canvas drawing, resize handling, animation-frame scheduling, and visual-layer ordering out of the main interaction component.
- Extracted SceneCanvas pointer-down/start-interaction orchestration into a focused hook so panning, calibration, ruler, laser, authoring starts, selection hits, and marquee starts are no longer inline in the component.
- Extracted SceneCanvas pointer-up/finalize-interaction orchestration into a focused hook so drag commits, transform commits, mask/effect commits, ruler completion, selection completion, laser cleanup, and token movement completion are no longer inline in the component.
- Extracted SceneCanvas pointer-move/update-interaction orchestration into a focused hook so active drag updates, polygon draft hover updates, brush hover, pan updates, and default hover/snap refreshes are no longer inline in the component.
- Extracted SceneCanvas keyboard interaction wiring and lifecycle reset application into focused hooks so Escape/waypoint keys and scene/tool cleanup effects no longer live inline with canvas composition.
- Extracted SceneCanvas map readiness/auto-fit wiring and selection routing callbacks into focused hooks so viewport readiness and selection dispatch now sit beside their tested policy helpers.
- Split map layer settings into grid-basics and advanced-settings sections, with tested map-fit action dispatch, so the layer panel map controls are no longer concentrated in one broad component.
- Centralized layer item drag/drop decisions for drawing, fog-shape, and token lists so row reordering no longer repeats source-id, placement, and drag-end fallback logic in each list component.
- Split low-level drawing shape rendering out of the drawing renderer so scene drawing orchestration is separated from primitive line, shape, guide, and template-fill rendering.
- Moved the remaining arcane, psychic, and fire template-effect recipes into a dedicated renderable-family module, leaving `templateEffectRenderables.ts` as a small registry/cache layer.
- Extracted GM environment-effect editor wiring out of `GmApp` so tuning reset/change handlers live beside the modal instead of bloating the app composition root.
- Extracted GM floating workspace state and turn-order dock composition out of `GmApp` so floating panels, selector filters, and initiative panel wiring share focused owners.
- Extracted GM workspace shell state initialization and the status footer out of `GmApp` so layout persistence and footer formatting no longer add view-root noise.
- Grouped drawing/template and environment-effect tuning props inside `ToolsMenu` panels so tool-surface sections have clearer state and handler contracts.
- Grouped mouse, table-tool, and fog-tool panel props inside `ToolsMenu` so utility panels now follow the same state/action contract pattern as drawing and effect panels.
- Centralized GM Player View menu and display/calibration dialog navigation actions so topbar and modal wiring no longer duplicate panel-switching rules.
- Extracted layer-row content switching and expansion/settings state out of `LayerPanel` so the panel root focuses on scene mutation wiring and row orchestration.
- Split weather category list and expanded weather tuning controls out of `WeatherSettingsPanel` so the weather layer settings root is now a small composition component.
- Extracted animated-effect layer rows and their row presentation helper out of `EnvironmentEffectList`, with regression coverage for labels, shape text, visibility defaults, and selection state.
- Extracted drawing layer rows and row presentation state out of `DrawingList`, with regression coverage for labels, visibility defaults, selection, dragging, and drop placement.
- Extracted Electron map/token thumbnail creation into an injectable thumbnail service, with tests covering image maps, video fallback, decode failures, and token thumbnails.
- Added focused unit tests around those helper seams.

## Current Hotspots

- `src/renderer/views/GmApp.tsx`: still the largest renderer composition root. It is now mostly orchestration, but topbar/player-view wiring, ToolsMenu props, inspector/dialog wiring, and maintenance actions still make changes noisy.
- `src/renderer/components/tools/menu/ToolsMenu.tsx`: improved after state/action prop grouping, but it remains the densest live GM tool-surface component. Further work should extract cohesive category orchestration or prop builders only if tool behavior changes.
- `src/renderer/views/GmDialogs.tsx`: still a broad modal aggregator. It is acceptable as a composition file, but new modal families should be grouped outside this file instead of adding more direct prop threading.
- `electron/mapAssetIpc.ts` and `electron/tokenAssetIpc.ts`: still relatively large IPC modules around import/delete/update workflows. Future file-safety or asset lifecycle changes should prefer service/helper seams with Electron tests.
- `electron/main.ts`: now primarily app composition and service registration. Avoid growing it again; add injectable services for new runtime policies such as metadata restore, asset maintenance, or thumbnail behavior.
- `electron/videoThumbnailFallback.ts`: large but specialized. Treat it as a media compatibility module and add regressions before changing video thumbnail fallback behavior.

## Next Recommended Refactors

1. If continuing renderer cleanup, target `GmApp` topbar/player-view coordination or dialog prop mapping as a bundled pass; avoid extracting tiny one-off wrappers.
2. If continuing tool cleanup, extract `ToolsMenu` category orchestration or prop-builder helpers behind the existing state/action groups, with behavior tests around `toolMenuState`.
3. If continuing Electron cleanup, target `mapAssetIpc.ts` or `tokenAssetIpc.ts` workflow helpers with tests around path safety, thumbnail failure handling, and campaign summary writes.
4. Keep `LayerPanel`, SceneCanvas, and drawing/template renderer work opportunistic rather than primary unless a feature touches those areas.
5. Run Electron or visual smoke tests whenever DOM, canvas, Player View, media playback, or app-window behavior changes; otherwise `npm run check` is the default verification gate.

## Audit Guardrails

- Prefer helper extraction with focused tests over broad rewrites.
- Keep renderer and domain logic separate when practical.
- Do not move state ownership unless the new owner is obvious and testable.
- Preserve Player View projection as the trust boundary for GM-only data.
- Run `npm run check` after each meaningful slice.
