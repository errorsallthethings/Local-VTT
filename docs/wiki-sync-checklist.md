# Wiki Sync Checklist

Use this checklist when updating the external Local VTT wiki from the repository docs. The repo remains the source of truth for code-adjacent architecture, release, and testing details; the wiki can present the same information in a more user-friendly or navigable format.

## Pages To Sync After The Audit Wave

- **Architecture / Developer Overview**
  - Source: `docs/architecture.md`
  - Include: local-first Electron runtime, GM/Player View split, preload bridge boundary, data flow, Player View projection, schema migration entry points, and campaign health.

- **Project Structure / Contributor Guide**
  - Source: `docs/project-structure.md`
  - Include: React/Electron MVC-style ownership, top-level folders, folder growth rules, dependency direction, and testing expectations.

- **Layer Ownership**
  - Source: `docs/layer-ownership-rules.md`
  - Include: current layer responsibilities, reserved future layers, Player View visibility guidance, and feature-placement questions.

- **Release / Packaging Process**
  - Source: `docs/release-process.md`
  - Include: release branch flow, version/tag expectations, package metadata validation, platform artifact checks, and upgrade/downgrade checklist.

- **Smoke Testing**
  - Sources: `README.md`, `docs/release-process.md`
  - Include: `npm run check`, `npm run smoke`, `npm run smoke:electron`, `npm run smoke:visual`, sequential smoke-test warning, Player View IPC coverage, visual smoke coverage, screenshot location behavior, and manual video-map coverage.

- **Canvas Performance**
  - Source: `docs/canvas-performance-budget.md`
  - Include: expected performance budgets, representative stress scenes, and when to record warning-threshold misses.

- **Audit Status**
  - Source: `docs/codebase-audit.md`
  - Include: current readiness summary, remaining hotspots, guardrails, and the recommendation to stop broad audit-only refactors unless a feature touches the area.

## User-Facing Wiki Pages To Check

- Getting Started
- Campaign Folder Basics
- Importing Maps And Tokens
- Player View Setup
- Campaign Health And Asset Maintenance
- Backups And Restore Revision
- Smoke Testing / Troubleshooting
- Known Limitations

## Sync Rules

- Keep commands and release requirements copied from repo docs, not from memory.
- Keep user-facing wiki language less implementation-heavy than repo docs.
- Link back to repo docs when a page describes contributor-only details.
- If a wiki page documents persisted campaign JSON fields, clearly mark it as informational rather than a stable manual-editing API.
- If a release changes schema versions, local storage behavior, asset handling, smoke coverage, or known limitations, update both repo docs and wiki pages in the same release-prep pass.
