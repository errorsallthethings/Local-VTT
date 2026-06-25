# Changelog

## 0.1.10

### Changed

- Updated Vite and React build tooling for the 0.1.10 security release.

### Fixed

- Addressed GitHub Dependabot dependency alerts.
- Removed unsafe Electron web security overrides reported by CodeQL.

## 0.1.9

### Changed

- Added packaged application icons for Windows and macOS builds.

## 0.1.8

### Added

- Added a redesigned Tools Menu with grouped Fog of War, Effects, Drawing, Template, Table, Dice Bag, and Turn Order workflows.
- Added Drawing Tools for brush, line, rectangle, ellipse, triangle, and polygon annotations with stroke/fill controls, opacity presets, thickness presets, selection, movement, resizing, rotation, and layer sub-items.
- Added Template Tools for line, radius, cube, and cone areas with measurement labels, configurable length/radius and width, grid footprint previews, visual effect presets, and Player View live preview controls.
- Added localized Animated Effects under the Effects layer, including water, lava, smoke, fire, fog, cold, electric, acid, poison, darkness, arcane, radiant, force field, shockwave, chaos, void, and nature growth effect families.
- Added token condition management from token context menus with Player View visibility control and rotating condition ring indicators.
- Added turn order round counters, count tracker entries, countdown support, scene-token linking, turn groups, multi-edge Player View trackers, visible-entry limits, and avatar mask settings.
- Added schema version `2` for campaign and scene save data.

### Changed

- Renamed the Weather layer to Effects and separated Fog of War tools from Effects tools.
- Improved context menus for tokens, fog masks, weather/effects masks, drawings, templates, and animated effects with more consistent labels, toggles, duplicate/delete actions, and edge-aware positioning.
- Improved map, token library, effects rendering, and scene canvas performance through virtualization, memoization, renderer cleanup, and viewport/bounds checks.
- Improved Player View synchronization, scene switching, and projected scene filtering so GM-only state does not drift or leak to Player View.
- Improved project structure by grouping canvas, component, layer, hook, and library modules into clearer feature-oriented folders.
- Improved error handling and diagnostics for local file access, metadata reads/writes, missing assets, renderer crashes, and Electron smoke testing.

### Fixed

- Fixed token import cropping for non-square source images.
- Fixed repeated dice result and WebGL context issues during 3D Scene Rolls.
- Fixed context menus appearing behind drawers or too close to viewport edges.
- Fixed duplicated/reordered scenes changing Player View without explicit GM action.
- Fixed drawing selection hit areas and bounds for thicker strokes.
- Fixed animated effects disappearing or losing animation after scene changes.
- Fixed turn order tracker overflow by limiting visible entries and showing hidden-entry counts.

## 0.1.7

### Added

- Added configurable Player View turn indicator sizing and class-inspired visual themes for player turn status indicators.
- Added sonar ping size and color controls for table tools.
- Added map calibration assistance for aligning imported maps to scene grid dimensions, including drawn calibration areas and reset/apply controls.
- Added Player View setup refinements with collapsible settings sections, clearer display targeting, and table scale calibration controls.
- Added weather and fog mask canvas selection, highlighting, and right-click visibility actions while preserving token selection priority.

### Changed

- Improved dice display settings with explicit GM/Player display modes, including Hidden, Text Result Only, 3D Panel, and 3D Scene Roll.
- Improved 3D scene dice rolling with stronger scatter/throw tuning, clearer result rings, settled-face highlighting, and tighter six/nine underline treatment.
- Improved dice roll result handling so Recent rolls, visible results, modifiers, percentile totals, and delayed 3D/scene results stay in sync.
- Improved turn order Player View readability with larger player turn indicators, themed frames, and more polished main turn order tracker styling.
- Improved grid controls with opacity reset, visibility toggle polish, and updated default swatches.
- Improved large static map rendering performance with adaptive GM View image quality while preserving Player View quality where possible.
- Improved Player View and Map Calibration modal layout, helper text, collapsible sections, and fixed modal footers.

### Fixed

- Fixed dice formula totals with `+` and `-` modifiers so displayed results and recent roll history match the actual rolled value.
- Fixed scene dice result styling so normal multi-die rolls do not show critical, fumble, or highest-result styling unless the roll rules call for it.
- Fixed turn order reset behavior so cleared and rebuilt encounters do not retain stale current-turn state.
- Fixed Player View scene synchronization so importing a map into a new scene does not unexpectedly replace the currently shown player scene.
- Fixed fog mask selection highlighting and reduced weather/mask rendering stutter on the GM canvas.
- Fixed dropdown label cropping in compact settings controls.

## 0.1.6

### Added

- Added configurable weather effects for scenes, including rain, snow, fog, and sand with per-effect tuning and mask support.
- Added Table Tools for live pings and laser pointer trails shared between GM View and Player View.
- Added turn order management with campaign players, token-to-turn-order actions, initiative rolling, drag-and-drop reordering, play/pause controls, and Player View indicators.
- Added dice rolling from the GM toolbar with quick dice, formulas, custom presets, recent roll history, and GM/Player display settings.
- Added 3D dice rendering for standard polyhedral dice, coin rolls, percentile rolls, results-only display, panel placement controls, and scene-based physics rolls.
- Added percentile dice support with `D%`, `d%`, `d100`, and legacy `d00` formula handling.
- Added Player View hold and blackout display modes.
- Added Token Library drawer height persistence and improved panel collapse/expand behavior.
- Added token movement path animation support for Player View.
- Added release process documentation for version bumping, tagging, and GitHub Actions release builds.

### Changed

- Improved Weather layer organization, controls, and visual tuning.
- Improved floating menu positioning for tools and contextual menus.
- Improved dice panel layout, settings grouping, display labels, and helper text.
- Improved 3D dice face labels, colors, percentile behavior, and D10/D12/D20 six/nine readability.
- Split dice overlay and physics dependencies into separate build chunks to keep production builds warning-free.

### Fixed

- Pause active turn orders on application close.
- Keep campaign player lists collapsed by default when loading campaigns.
- Fix Player View turn order and active-player indicators so they animate on and off scene instead of only toggling visibility.
- Fix percentile roll totals and max-result styling, including `00 + 0 = 100`.
- Fix Player-targeted scene dice results so the GM waits for the resolved Player View physics result instead of revealing a precomputed value.

## 0.1.5

### Fixed

- Fix immutable GitHub release publishing

## 0.1.4

### Fixed

- Fix GitHub release publish repo context

## 0.1.3

### Fixed

- Updated GitHub release workflow to publish artifacts from a single release job and avoid duplicate asset upload failures.

## 0.1.2

### Notes

- Continuing to work on getting Windows and MacOS builds/release working with GitHub Actions

## 0.1.1

### Notes

- Attempting to get Windows and MacOS builds/release working with GitHub Actions

## 0.1.0

Initial Local VTT MVP release candidate.

### Added

- Local-first campaign folders with portable campaign and scene JSON.
- GM View and separate Player View windows for in-person tabletop play.
- Static image, animated GIF, MP4, and WebM map imports.
- Scene folders, scene thumbnails, Recent Campaigns, and metadata-only JSON backups.
- Manual fog of war with brush, rectangle, circle, and polygon tools.
- Gridless, square, and hex grid support with scene measurement settings.
- GM-only ruler with snapping, waypoints, crossed-cell highlights, and distance readouts.
- Lightweight tokens with sub-layers, presentation settings, movement waypoints, Player View tweening, and Token Library reuse.
- Player View display selection, fullscreen support, physical display scale calibration, and waiting screen behavior.

### Notes

- This release is intentionally focused on local battle-map display and lightweight markers.
- The installer is not code signed.
- Advanced VTT systems such as initiative, health tracking, permissions, character sheets, and dynamic lighting are deferred.
