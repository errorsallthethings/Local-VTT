# Codebase Audit Notes

These notes summarize the 0.1.8 codebase audit work and the next practical cleanup targets. The goal is to keep Local VTT reliable for live tabletop sessions while reducing large-component risk over time.

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
- Added focused unit tests around those helper seams.

## Current Hotspots

- `src/renderer/canvas/environmentEffectsRenderer.ts`: very large effect-rendering module. Future work should move each effect family into a registry-backed renderer module.
- `src/renderer/components/SceneCanvas.tsx`: high-responsibility canvas interaction component. Split by interaction mode before adding more tools.
- `src/renderer/canvas/drawingRenderer.ts`: large mixed renderer for drawings, templates, labels, and effect fills. Separate template rendering from freehand/shape rendering.
- `src/renderer/components/layers/LayerPanel.tsx`: layer UI is feature rich but broad. Extract per-layer panels when touching those areas.
- `src/renderer/views/GmApp.tsx`: smaller after audit work, but still coordinates many workflows. Prefer extracting domain helpers or feature hooks before adding new state.

## Next Recommended Refactors

1. Split `SceneCanvas` interaction modes into hooks or controllers: selection, token drag, drawing, templates, fog, effects, ruler, and calibration.
2. Convert animated environmental effects into a formal registry with one module per effect family.
3. Split `LayerPanel` by layer type after the scene canvas interaction split stabilizes.
4. Add more tests around Player View projection, scene switching, missing assets, and campaign save/load recovery.
5. Keep large renderer changes incremental and screenshot/smoke tested where visual behavior matters.

## Audit Guardrails

- Prefer helper extraction with focused tests over broad rewrites.
- Keep renderer and domain logic separate when practical.
- Do not move state ownership unless the new owner is obvious and testable.
- Preserve Player View projection as the trust boundary for GM-only data.
- Run `npm run check` after each meaningful slice.
