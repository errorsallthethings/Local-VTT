# Project Structure Guide

This guide explains how Local VTT's folders are intended to evolve. It is meant to help future contributors find the right owner for new code without forcing large organizational refactors.

## Architectural Shape

Local VTT uses a React-friendly, Electron-friendly version of MVC rather than strict classic MVC:

- **Model / domain:** `src/shared`, `src/renderer/lib`, and focused Electron helpers. These files should own data shapes, validation, pure transformations, persistence codecs, and reusable business rules.
- **View:** React components under `src/renderer/components` and `src/renderer/views`. These files should render UI and translate user gestures into typed callbacks.
- **Controller / workflow coordination:** React hooks under `src/renderer/hooks` plus Electron IPC registration modules. These files coordinate state, app workflows, async calls, and IPC boundaries.
- **Platform adapters:** Electron services under `electron/`. These files own desktop windows, dialogs, filesystem access, protocol handling, package/runtime checks, and thumbnail/media integrations.

The goal is not to make every feature fit a rigid pattern. The goal is to keep rendering, workflow coordination, domain rules, persistence, and platform access from drifting into one another.

## Top-Level Folders

- `electron/`: Electron main-process runtime, IPC registration, filesystem/persistence services, protocol handling, backup/health/asset maintenance, and smoke-test support.
- `src/shared/`: shared schema types, defaults, normalization, migrations, and Player View projection rules.
- `src/renderer/views/`: app-level React composition roots for GM and Player View screens.
- `src/renderer/components/`: reusable UI, layer panels, tool panels, scene canvas support components, settings panels, and modal components.
- `src/renderer/components/scene/`: scene-canvas React support code grouped by responsibility:
  - `context-menu/`: context-menu components, target detection, routing, and opening state.
  - `hooks/`: scene-canvas React hooks that coordinate canvas input, rendering, lifecycle, selection, assets, and viewport reporting.
  - `input/`: pointer, keyboard, hover, selection, token, drawing, fog, ruler, and weather/effect interaction helpers.
  - `map/`: map calibration, video map elements, map readiness, and video-map viewport policy.
  - `overlays/`: Player View turn/seat overlays, scene status strips, and tool status overlays.
  - `state/`: scene-canvas state transitions that are shared by hooks and tests.
- `src/renderer/canvas/`: canvas rendering, geometry, hit-testing, visual effects, measurement, selection, and drawing/template renderers.
- `src/renderer/hooks/`: renderer workflow controllers and state coordinators.
- `src/renderer/lib/`: renderer-side domain helpers, pure state transitions, display/player-view helpers, dice logic, and UI-neutral utilities.
- `src/renderer/styles/`: CSS organized by surface or feature and imported from `src/renderer/styles.css`.
- `tests/`: unit and integration-style tests grouped by runtime area. Renderer scene-canvas tests live under `tests/renderer/scene/` to mirror `src/renderer/components/scene/`.
- `docs/`: architecture, release, performance, ownership, and contributor guidance.

## Folder Growth Rules

Avoid mass-moving files only to make directory counts look smaller. File moves should happen when they improve ownership, reduce noisy imports during active work, or make a feature easier to test.

Use these thresholds as guidance:

- If a folder has more than about 25 direct files and contributors have to scan filenames to find related owners, create domain subfolders during the next feature touch.
- If a component or hook family shares state vocabulary, callback contracts, or tests, keep it together.
- If a file is mostly pure logic, prefer `src/renderer/lib`, `src/shared`, or a focused Electron helper over a component or hook folder.
- If a file touches the filesystem, windows, dialogs, protocol registration, or native media behavior, keep it in `electron/` behind an injectable service/helper seam.

## Active Scene Component Subfolders

`src/renderer/components/scene/` is intentionally split because scene authoring combines React overlays, canvas hooks, input/controller helpers, map/video support, and state transition helpers. Keep new scene-canvas files in the smallest matching subfolder:

- Use `context-menu/` for menu rendering, opening, target, and action-routing code.
- Use `hooks/` for React hooks that wire `SceneCanvas` to state, refs, renderer calls, or browser events.
- Use `input/` for pure pointer/keyboard/hover/drag routing helpers and interaction-specific action builders.
- Use `map/` for map calibration, video map element planning, and map readiness policy.
- Use `overlays/` for React components rendered over the canvas.
- Use `state/` for reusable scene-canvas state transition helpers.

Tests for these files should usually live in `tests/renderer/scene/` and keep the source filename in the test filename.

## Preferred Future Subfolders

These are good destinations when future work already touches the relevant files:

- `src/renderer/hooks/campaign/`: campaign open/save/import/export and campaign summary workflows.
- `src/renderer/hooks/gm/`: GM workspace shell, dialog, tool, maintenance, and inspector coordination.
- `src/renderer/hooks/player-view/`: Player View sync, display profiles, test pattern, and projected-event coordination.
- `src/renderer/hooks/scene-canvas/`: canvas input, lifecycle, selection, readiness, and viewport hooks.
- `tests/renderer/canvas/`: canvas renderer, geometry, token, drawing, weather/effects, and template rendering tests.
- `tests/renderer/lib/`: renderer domain helpers and UI-neutral utility tests.
- `tests/renderer/components/`: reusable component behavior tests that are not specific to the scene canvas.

Do not create these folders empty. Move files into them only when the move is part of a reviewed feature or cleanup bundle.

## Dependency Direction

- `src/shared` should not import renderer or Electron code.
- `src/renderer/lib` should avoid importing React components. It may expose pure helpers consumed by hooks/components.
- `src/renderer/components` can import shared types, renderer lib helpers, and hooks when a component owns local interaction state.
- `src/renderer/views` should compose hooks and components, but avoid owning detailed domain logic.
- `electron` can import `src/shared` types/models and Electron helpers, but renderer code should reach Electron only through the preload bridge.

## Testing Expectations

- Pure domain helpers should have direct unit tests.
- Renderer workflow helpers and policies should have targeted tests when they encode branching behavior.
- Electron helpers that touch paths, temporary access, metadata writes, deletion, backups, or thumbnails should have focused Electron tests.
- UI-only composition changes usually need `npm run check`; DOM, canvas, Player View, media, app-window, or protocol changes should also run the Electron/visual smoke checks.
