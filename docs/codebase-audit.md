# Codebase Audit Notes

These notes summarize the mid-0.1.x codebase audit work and the next practical cleanup targets. The goal is to keep Local VTT reliable for live tabletop sessions while reducing large-component risk over time.

## Completed Audit Improvements

- Added campaign and scene schema versioning foundations so future migrations have an explicit upgrade path.
- Added Electron smoke-test coverage for the packaged runtime path.
- Documented architecture, data flow, and layer ownership in `docs/architecture.md`.
- Extracted modal and tool UI pieces out of `GmApp` and `ToolsMenu` where the split was low risk.
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
- Expanded Player View sync tests so explicit sends and background updates are covered as projection-only operations that strip GM-only payload data without mutating the GM campaign or scene state.
- Hardened metadata backup restore for missing scene files and expanded recovery regressions for malformed backups and unsafe portable paths so failed restores cannot overwrite current campaign metadata.
- Expanded Electron file-safety regressions for unreferenced asset pruning and campaign path boundaries so stale hydrated paths outside the campaign are retained for review instead of deleted.
- Extracted and tested SceneCanvas interaction cancellation policy so Escape handling and cancelable interaction detection are no longer inline component logic.
- Extracted and tested SceneCanvas pointer-up routing and hover reset policy, reducing inline interaction branch ordering in the canvas component.
- Extracted and tested SceneCanvas context-menu routing for waypoint removal, polygon backtracking, and target menu kind selection.
- Split the environment effect drawer registry out of the layer renderer so future effect-family modules can move behind a stable registry seam.
- Extracted shared WebGL environment-effect runtime helpers and moved the smoke/fog effect family into its own renderer module while preserving the existing public effect exports.
- Added focused unit tests around those helper seams.

## Current Hotspots

- `src/renderer/canvas/effects/environmentEffectsRenderer.ts`: still a large effect-rendering module, but shared runtime code and smoke/fog are now split out. Future work should move the remaining effect families behind the same registry-backed renderer pattern.
- `src/renderer/components/SceneCanvas.tsx`: high-responsibility canvas interaction component. Split by interaction mode before adding more tools.
- `src/renderer/canvas/drawingRenderer.ts`: large mixed renderer for drawings, templates, labels, and effect fills. Separate template rendering from freehand/shape rendering.
- `src/renderer/components/layers/LayerPanel.tsx`: layer UI is feature rich but broad. Extract per-layer panels when touching those areas.
- `src/renderer/views/GmApp.tsx`: smaller after audit work, but still coordinates many workflows. Prefer extracting domain helpers or feature hooks before adding new state.
- `electron/main.ts`: smaller after audit work, but still coordinates app lifecycle, IPC, windows, file IO, asset copy/delete, and Player View control. Continue extracting pure helpers or injectable service functions before changing behavior.

## Next Recommended Refactors

1. Split `SceneCanvas` interaction modes into hooks or controllers: selection, token drag, drawing, templates, fog, effects, ruler, and calibration.
2. Continue converting animated environmental effects into one module per effect family, using the smoke/fog split as the pattern.
3. Split `LayerPanel` by layer type after the scene canvas interaction split stabilizes.
4. Keep large renderer changes incremental and screenshot/smoke tested where visual behavior matters.

## Audit Guardrails

- Prefer helper extraction with focused tests over broad rewrites.
- Keep renderer and domain logic separate when practical.
- Do not move state ownership unless the new owner is obvious and testable.
- Preserve Player View projection as the trust boundary for GM-only data.
- Run `npm run check` after each meaningful slice.
