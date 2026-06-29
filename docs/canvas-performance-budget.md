# Canvas Performance Budget

This budget defines the minimum canvas performance expectations for release testing. It is intentionally practical: Local VTT does not yet have automated frame-time telemetry, so the current budget combines repeatable stress-scene fixtures, manual measurement steps, and clear thresholds for when a canvas change needs follow-up work.

## Target Experience

Local VTT should remain usable on a typical Windows tabletop setup while showing one GM View and one Player View at 1080p. These budgets should be treated as release warning gates until automated telemetry exists.

| Metric | Target | Warning threshold |
| --- | ---: | ---: |
| Idle GM canvas frame time, p95 | <= 16.7 ms | > 33.3 ms |
| Pan or zoom frame time, p95 | <= 33.3 ms | > 50 ms |
| Long frame during interaction | none above 100 ms | any repeated 100 ms+ stall |
| Static map first ready frame | <= 1.5 s | > 2.5 s |
| Video map first ready frame | <= 2.5 s | > 4 s |
| Combined stress scene ready | <= 3 s | > 5 s |

## Representative Stress Scenes

Use these scene sizes when validating renderer changes, release candidates, or performance-sensitive features:

| Scenario | Representative load |
| --- | --- |
| Large static map | 8192 x 8192 image map, 128 x 128 square grid |
| Large video map | 3840 x 2160 video map, looping in GM View and Player View |
| Many tokens | 250 visible or mixed-visibility tokens on one scene |
| Many fog shapes | 500 fog shapes mixed across rectangle, circle, and polygon masks |
| Active effects | 24 localized animated effects using several effect families |
| Weather masks | 24 weather exclusion masks while weather is enabled |
| Combined stress | 8192 x 8192 map, 250 tokens, 500 fog shapes, 16 animated effects, and enabled weather |

The Vitest fixture in `tests/shared/canvasPerformanceBudget.test.ts` keeps the representative counts from accidentally drifting downward.

## Measurement Strategy

1. Start the app with `npm run dev` or open the packaged release candidate.
2. Open a smoke or performance campaign that contains the representative scenes above.
3. Measure GM View and Player View separately when practical. Record which display is the physical player-facing display.
4. Capture at least 30 seconds for each interaction with Chromium DevTools Performance:
   - idle on the scene,
   - pan across the map,
   - zoom in and out,
   - toggle layer visibility for fog, tokens, and effects,
   - switch from another scene into the stress scene.
5. Record the app version, commit SHA, operating system, display resolution, GPU, map asset dimensions, token count, fog shape count, effect count, and whether Player View was open.
6. Open a follow-up issue if a warning threshold is exceeded repeatedly or if interaction feels frozen even when average frame time looks acceptable.

## Release Checklist

Before publishing a release that changes canvas rendering, scene layers, maps, tokens, fog, weather, effects, or Player View projection:

- Run `npm run check`.
- Run `npm run build`.
- Run the smoke checklist in `docs/release-process.md`.
- Exercise the representative stress scenes and record any warning-threshold misses.
- Link any performance follow-up issues from the release notes when they affect normal play.
