# Layer Ownership Rules

Local VTT layers define where scene data belongs, how it renders, and which tools own it. Keep layer ownership narrow so GM View, Player View, saving/loading, selection, context menus, and future features stay predictable.

Larger layer `order` values render above lower values. Layer ids are saved data and should remain stable.

## Core Rules

- Put data in the layer that owns its behavior, not just the layer that visually resembles it.
- Keep GM-only data out of Player View projection by default.
- Keep reusable asset-library concepts separate from placed scene instances.
- Prefer moving data between layers with explicit commands instead of making one layer serve several unrelated purposes.
- Add new sub-layer collections only when the layer owns repeated placed items. Map and Grid currently expose settings but no sub-layers.

## Layer Responsibilities

| Layer | Owns | Does Not Own | Player View Default |
| --- | --- | --- | --- |
| GM | Private GM notes, markers, reminders, secret prep overlays, and GM-only staging content. | Player-facing art, tokens, weather, fog reveal logic, or map calibration. | Hidden |
| Fog of War | Reveal/hide masks that control what players can see and which player-visible tokens are revealed. | Weather masks, environmental visuals, drawing shapes, or decorative darkness effects. | Visible |
| Effects | Per-scene weather settings, weather masks that exclude weather, and localized animated environmental effects. | Fog reveal/hide rules, generic drawings, spell templates, or token auras. | Visible |
| Drawings | Freehand marks, geometric drawing shapes, text, spell/area templates, and GM-authored tactical annotations. | Weather/environment animations, fog visibility logic, tokens, props, or overhead cover art. | Visible |
| Foreground | Overhead scene art that should sit above tokens, such as roofs, tree canopies, bridges, upper floors, or foreground terrain. | Movable props, token auras, weather, fog, or generic drawings. | Visible |
| Tokens | Movable creature/NPC/object markers that participate in token selection, ordering, visibility, presentation, and movement paths. | Static map props, reusable library assets by themselves, fog, or overhead roof art. | Hidden |
| Objects | Future reusable placed props and interactable objects that are not creatures/tokens. | Current token workflows until Objects is implemented. | Visible |
| Dynamic Lighting | Future walls, doors, windows, light sources, vision blockers, and line-of-sight data. | Fog masks, decorative lighting effects, or map/grid calibration. | Visible |
| Grid | Grid mode, visual grid styling, measurement settings, snapping, opacity, and fit/calibration helpers. | Map transform source data, ruler events, tokens, drawings, or templates. | Visible |
| Map | Base scene image/GIF/video map, map transform, map asset state, and map fit behavior. | Grid settings, token placement, weather, fog, drawings, or foreground overlays. | Visible |

## Common Placement Decisions

- **Hidden GM reminder**: GM Layer.
- **Area players cannot see through**: Fog of War Layer.
- **Rain, snow, fog, sand, lava, water, smoke, or other animated environmental area**: Effects Layer.
- **Area that blocks weather from showing**: Effects Layer as a weather mask.
- **Freehand arrow, circle, square, measurement template, or spell area template**: Drawings Layer.
- **Roof, canopy, bridge surface, or upper-floor art that should cover tokens**: Foreground Layer.
- **Creature, NPC, player, hazard marker, or movable point of interest**: Tokens Layer.
- **Reusable chair, crate, door prop, trap tile, or interactable scenery**: Objects Layer once implemented. Until then, use Tokens only if it needs token-like movement/visibility.
- **Vision wall, door, light source, or line-of-sight blocker**: Dynamic Lighting Layer once implemented.
- **Grid color, opacity, square/hex mode, snapping, and measurement scale**: Grid Layer.
- **Imported battle map image/video and fit/transform settings**: Map Layer.

## Visibility And Projection

Player View receives a projected scene payload from shared model code. New features should use that projection path instead of sending raw scene data.

- GM Layer content should be excluded from Player View unless a future reveal/move feature explicitly changes ownership.
- Layer visibility gates sub-layer visibility. A player-visible item on a player-hidden layer should not appear in Player View.
- Sub-layer GM/Player visibility controls should only affect items owned by that layer.
- Fog of War visibility is special: it controls reveal/hide behavior and can also gate token visibility in hidden/partial fog modes.
- Weather masks affect weather rendering only. They are not fog masks.
- Effects are per-scene. They are not global application settings.

## Tool Ownership

- Fog of War Tools create and edit Fog of War Layer shapes.
- Effects Tools create and edit Effects Layer weather masks and animated environmental effects.
- Drawing Tools and Template Tools create Drawings Layer elements.
- Table Tools create live transient events. They do not create saved layer items unless a future feature explicitly adds persisted measurements or markers.
- Dice Bag and Turn Order are modal workflows, not scene layers.
- Dynamic Lighting tools should create Dynamic Lighting Layer data when that feature is implemented.

## Selection And Context Menus

Selection should follow layer ownership:

- Selecting a token highlights Tokens Layer sub-layers.
- Selecting a drawing or template highlights Drawings Layer sub-layers.
- Selecting a fog mask highlights Fog of War Layer sub-layers.
- Selecting a weather mask or animated environmental effect highlights Effects Layer sub-layers.
- Future Foreground, Objects, and Dynamic Lighting selections should highlight their own layer groups.

Context menus should expose only actions relevant to the selected item's owner. For example, a template can toggle its footprint, while a weather mask should not expose fog reveal behavior.

## Adding A New Layer Feature

Before adding a feature, answer these questions:

1. Is it saved scene data or a transient live event?
2. Is it GM-only, player-facing, or independently visible in each view?
3. Does it affect visibility rules, or is it just visual?
4. Does it move/select like a token, render like art, or configure a system such as grid/map/weather?
5. Which existing layer owns that behavior today?
6. Does Player View projection already filter it correctly?
7. Does it need sub-layer UI, context menu actions, selection highlighting, tests, or schema normalization?

If the feature does not clearly belong to an existing layer, document the intended ownership before adding new saved fields.

## Current Reserved Layers

The GM, Foreground, Objects, and Dynamic Lighting layers exist in the scene model before all related tools are implemented. Keep them as reserved ownership boundaries:

- Do not overload Drawings or Effects with future object/lighting behavior just because those tools exist now.
- Do not repurpose Foreground for generic props; it is for art that visually sits above tokens.
- Do not repurpose Dynamic Lighting for decorative light effects; it is for vision and line-of-sight rules.
- Do not store campaign-wide data in scene layers. Scene layers own per-scene behavior.
