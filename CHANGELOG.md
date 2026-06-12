# Changelog

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
