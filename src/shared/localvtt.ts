export type AssetKind = "map" | "token" | "overlay" | "effect" | "handout";
export type AssetMediaType = "image" | "video";
export type GridType = "square" | "hex" | "gridless";
export type MeasurementUnit = "feet" | "meters" | "miles";
export type WallType = "wall" | "door" | "window" | "terrain";
export type DrawingKind = "freehand" | "line" | "rectangle" | "circle" | "ellipse" | "triangle" | "polygon" | "cone" | "text" | "ping" | "laser";
export type TokenSizePreset = "tiny" | "medium" | "large" | "huge" | "gargantuan" | "custom";
export type TokenMask = "none" | "circle" | "square";
export type TokenBorderStyle = "none" | "solid" | "dashed" | "dotted" | "double-line" | "embossed" | "inner-shadow" | "glow";
export type TokenBorderWidthPreset = "thin" | "medium" | "thick" | "custom";

export interface TokenPresentationDefaults {
  sizePreset?: TokenSizePreset;
  customSizeCells?: { width: number; height: number };
  mask?: TokenMask;
  borderColor?: string;
  borderStyle?: TokenBorderStyle;
  borderWidth?: number;
  borderWidthPreset?: TokenBorderWidthPreset;
  glowColor?: string;
  footprintVisible?: boolean;
}

export interface Asset {
  id: string;
  name: string;
  kind: AssetKind;
  mediaType: AssetMediaType;
  relativePath: string;
  thumbnailRelativePath?: string;
  originalFileName: string;
  createdAt: string;
  /** Defaults only affect future tokens added from this library asset; placed scene tokens keep their own presentation. */
  tokenDefaults?: TokenPresentationDefaults;
  /** Runtime-only absolute paths are resolved by Electron after a campaign folder is opened. */
  absolutePath?: string;
  thumbnailAbsolutePath?: string;
}

export interface MeasurementSettings {
  unit: MeasurementUnit;
  unitsPerGridCell: number;
  distanceMode: "euclidean" | "manhattan" | "grid" | "diagonal-5-10";
}

export interface GridSettings {
  type: GridType;
  sizePx: number;
  offsetX: number;
  offsetY: number;
  mapGridColumns: number;
  mapGridRows: number;
  color: string;
  opacity: number;
  lineThickness: number;
  showOnGm: boolean;
  showOnPlayer: boolean;
  measurement: MeasurementSettings;
}

export interface DisplayCalibration {
  physicalScaleEnabled: boolean;
  mode: "manual" | "screen-size" | "grid-cell";
  selectedDisplayId?: number;
  selectedDisplayLabel?: string;
  openPlayerViewFullscreen: boolean;
  pixelsPerInch: number;
  inchesPerGridCell: number;
  screenDiagonalInches: number;
  screenAspectRatio: "16:9" | "16:10" | "4:3" | "custom";
  screenResolutionWidth: number;
  screenResolutionHeight: number;
  defaultScaleLabel: string;
}

export interface Layer {
  id: string;
  name: string;
  kind:
    | "gm"
    | "fog"
    | "drawing"
    | "grid"
    | "effects"
    | "token"
    | "foreground"
    | "object"
    | "lighting"
    | "map"
    | "custom";
  order: number;
  visibleInGm: boolean;
  visibleInPlayer: boolean;
  locked: boolean;
  opacity: number;
}

export interface MapTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  fitMode: "manual" | "contain" | "cover" | "actual-size";
}

export interface FogSettings {
  mode: "hidden" | "revealed" | "partial";
  color: string;
  /** Legacy campaign files used one shared opacity. New scenes store GM and Player opacity independently. */
  opacity: number;
  gmOpacity: number;
  playerOpacity: number;
  brushSize: number;
  previewOnGm: boolean;
  newShapesVisibleInPlayer: boolean;
  shapes: FogShape[];
}

export type RainWeatherEffectType = "light-rain" | "rain" | "heavy-rain" | "rain-storm";
export type FogWeatherEffectType = "light-fog" | "fog" | "heavy-fog";
export type SnowWeatherEffectType = "light-snow" | "snow" | "blizzard";
export type SandWeatherEffectType = "light-sand" | "sand" | "sandstorm";
export type WeatherPatternEffectType = RainWeatherEffectType | FogWeatherEffectType | SnowWeatherEffectType | SandWeatherEffectType;
export type WeatherEffectType = "none" | WeatherPatternEffectType;
export type WeatherQualityLevel = "low" | "balanced" | "high";

export interface WeatherTuningSettings {
  intensity: number;
  opacity: number;
  color: string;
  speed: number;
  directionDegrees: number;
  driftStrength: number;
  edgeBias: number;
  quietAreaSize: number;
  centerStrayDrops: number;
  streakLength: number;
  lightningFrequency: number;
  flashStrength: number;
  quality: WeatherQualityLevel;
}

export interface WeatherEffectSlot<TPattern extends WeatherPatternEffectType = WeatherPatternEffectType> {
  enabled: boolean;
  pattern: TPattern;
  settings: WeatherTuningSettings;
}

export interface WeatherEffectSlots {
  rain: WeatherEffectSlot<RainWeatherEffectType>;
  fog: WeatherEffectSlot<FogWeatherEffectType>;
  snow: WeatherEffectSlot<SnowWeatherEffectType>;
  sand: WeatherEffectSlot<SandWeatherEffectType>;
}

export interface WeatherSettings extends WeatherTuningSettings {
  enabled: boolean;
  /** Legacy single-pattern field kept for old saves and transitional UI compatibility. */
  effect: WeatherEffectType;
  effectSettings: Partial<Record<WeatherPatternEffectType, WeatherTuningSettings>>;
  effects: WeatherEffectSlots;
  masks: WeatherMask[];
}

export interface WeatherMask {
  id: string;
  name?: string;
  kind: "rectangle" | "polygon" | "circle";
  points: Point[];
  radius?: number;
  visible?: boolean;
}

export type EnvironmentEffectType = "water" | "lava" | "smoke" | "fog" | "fire" | "electric" | "arcane" | "radiant" | "field" | "shockwave";

export interface WaterEffectTuningSettings {
  opacity: number;
  bandScale: number;
  bandWidth: number;
  speed: number;
  directionDegrees: number;
  distortion: number;
  verticalDistortion: number;
  distortionVariation: number;
  bandBreakup: number;
  bandVariation: number;
  bandOverlap: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  highlightAlpha: number;
  deepColor: string;
  waterColor: string;
  highlightColor: string;
}

export const DEFAULT_WATER_EFFECT_TUNING_SETTINGS: WaterEffectTuningSettings = {
  opacity: 0.92,
  bandScale: 3.2,
  bandWidth: 0.16,
  speed: 0.18,
  directionDegrees: 270,
  distortion: 0.04,
  verticalDistortion: 0.055,
  distortionVariation: 0.9,
  bandBreakup: 0.78,
  bandVariation: 1.35,
  bandOverlap: 0.42,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.14,
  highlightAlpha: 0.58,
  deepColor: "#002e4d",
  waterColor: "#008cb8",
  highlightColor: "#ffffff"
};

export interface LavaEffectTuningSettings {
  opacity: number;
  flowScale: number;
  speed: number;
  directionDegrees: number;
  distortion: number;
  crust: number;
  glow: number;
  ember: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  darkColor: string;
  lavaColor: string;
  hotColor: string;
}

export const DEFAULT_LAVA_EFFECT_TUNING_SETTINGS: LavaEffectTuningSettings = {
  opacity: 0.9,
  flowScale: 5.2,
  speed: 0.42,
  directionDegrees: 270,
  distortion: 0.55,
  crust: 0.48,
  glow: 0.72,
  ember: 0.38,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.42,
  darkColor: "#2a0805",
  lavaColor: "#d84315",
  hotColor: "#ffd166"
};

export interface FireEffectTuningSettings {
  opacity: number;
  flameScale: number;
  speed: number;
  directionDegrees: number;
  turbulence: number;
  tongues: number;
  tongueVariation: number;
  breakup: number;
  flameStretch: number;
  flicker: number;
  ember: number;
  heat: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  emberColor: string;
  flameColor: string;
  hotColor: string;
}

export const DEFAULT_FIRE_EFFECT_TUNING_SETTINGS: FireEffectTuningSettings = {
  opacity: 0.86,
  flameScale: 6.4,
  speed: 0.62,
  directionDegrees: 270,
  turbulence: 0.92,
  tongues: 0.58,
  tongueVariation: 0.86,
  breakup: 0.64,
  flameStretch: 0.58,
  flicker: 0.74,
  ember: 0.34,
  heat: 0.78,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.26,
  emberColor: "#4a1205",
  flameColor: "#f97316",
  hotColor: "#fff2a8"
};

export interface LightningEffectTuningSettings {
  opacity: number;
  arcScale: number;
  speed: number;
  directionDegrees: number;
  boltDensity: number;
  branchiness: number;
  jitter: number;
  glow: number;
  strikeWidth: number;
  segmentBreaks: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  backgroundColor: string;
  arcColor: string;
  coreColor: string;
}

export const DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS: LightningEffectTuningSettings = {
  opacity: 0.7,
  arcScale: 1,
  speed: 0.21,
  directionDegrees: 18,
  boltDensity: 0.49,
  branchiness: 0.9,
  jitter: 0.91,
  glow: 0.88,
  strikeWidth: 0.67,
  segmentBreaks: 0.33,
  panFollow: 1,
  zoomScale: 1.15,
  baseAlpha: 0.18,
  backgroundColor: "#081226",
  arcColor: "#60a5fa",
  coreColor: "#f8fbff"
};

export interface ArcaneEffectTuningSettings {
  opacity: number;
  glyphScale: number;
  speed: number;
  rotationSpeed: number;
  glyphDensity: number;
  ringDensity: number;
  circleScale: number;
  spokeAmount: number;
  pulse: number;
  drift: number;
  glow: number;
  lineWidth: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  backgroundColor: string;
  glyphColor: string;
  glowColor: string;
}

export const DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS: ArcaneEffectTuningSettings = {
  opacity: 0.82,
  glyphScale: 4.8,
  speed: 0.24,
  rotationSpeed: 0.28,
  glyphDensity: 0.62,
  ringDensity: 0.58,
  circleScale: 6.5,
  spokeAmount: 0.62,
  pulse: 0.72,
  drift: 0.3,
  glow: 0.74,
  lineWidth: 0.46,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.2,
  backgroundColor: "#14051f",
  glyphColor: "#c084fc",
  glowColor: "#f5d0fe"
};

export interface RadiantEffectTuningSettings {
  opacity: number;
  rayScale: number;
  speed: number;
  directionDegrees: number;
  rayDensity: number;
  rayBreakup: number;
  raySpread: number;
  rayDistance: number;
  moteDensity: number;
  moteSize: number;
  shimmer: number;
  bloom: number;
  streakWidth: number;
  pulse: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  backgroundColor: string;
  rayColor: string;
  coreColor: string;
}

export const DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS: RadiantEffectTuningSettings = {
  opacity: 0.78,
  rayScale: 4.8,
  speed: 0.18,
  directionDegrees: 270,
  rayDensity: 0.12,
  rayBreakup: 0.55,
  raySpread: 0.18,
  rayDistance: 0.4,
  moteDensity: 0.58,
  moteSize: 2,
  shimmer: 0.62,
  bloom: 0.76,
  streakWidth: 2,
  pulse: 0.5,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.1,
  backgroundColor: "#1c1607",
  rayColor: "#fde68a",
  coreColor: "#fffdf4"
};

export interface ForceFieldEffectTuningSettings {
  opacity: number;
  fieldScale: number;
  speed: number;
  directionDegrees: number;
  gridDensity: number;
  gridWarp: number;
  rippleStrength: number;
  rippleFrequency: number;
  edgeStrength: number;
  pulse: number;
  glow: number;
  refraction: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  backgroundColor: string;
  gridColor: string;
  edgeColor: string;
}

export const DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS: ForceFieldEffectTuningSettings = {
  opacity: 0.78,
  fieldScale: 5.4,
  speed: 0.22,
  directionDegrees: 278,
  gridDensity: 0.62,
  gridWarp: 0.42,
  rippleStrength: 0.5,
  rippleFrequency: 0.56,
  edgeStrength: 0.78,
  pulse: 0.48,
  glow: 0.74,
  refraction: 0.46,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.2,
  backgroundColor: "#03131f",
  gridColor: "#67e8f9",
  edgeColor: "#d8b4fe"
};

export interface ShockwaveEffectTuningSettings {
  opacity: number;
  ringScale: number;
  speed: number;
  directionDegrees: number;
  ringCount: number;
  ringWidth: number;
  ringSharpness: number;
  distortion: number;
  turbulence: number;
  centerStrength: number;
  fade: number;
  pulse: number;
  glow: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  backgroundColor: string;
  ringColor: string;
  coreColor: string;
}

export const DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS: ShockwaveEffectTuningSettings = {
  opacity: 0.78,
  ringScale: 6,
  speed: 0.42,
  directionDegrees: 270,
  ringCount: 0.58,
  ringWidth: 0.48,
  ringSharpness: 0.62,
  distortion: 0.45,
  turbulence: 0.42,
  centerStrength: 0.72,
  fade: 0.55,
  pulse: 0.62,
  glow: 0.7,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.12,
  backgroundColor: "#07111f",
  ringColor: "#93c5fd",
  coreColor: "#f8fbff"
};

export interface SmokeEffectTuningSettings {
  opacity: number;
  cloudScale: number;
  speed: number;
  directionDegrees: number;
  turbulence: number;
  softness: number;
  density: number;
  lift: number;
  panFollow: number;
  zoomScale: number;
  baseAlpha: number;
  shadowColor: string;
  smokeColor: string;
  highlightColor: string;
}

export const DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS: SmokeEffectTuningSettings = {
  opacity: 0.82,
  cloudScale: 4.8,
  speed: 0.16,
  directionDegrees: 270,
  turbulence: 0.72,
  softness: 0.64,
  density: 0.58,
  lift: 0.35,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.22,
  shadowColor: "#1f2933",
  smokeColor: "#8c98a5",
  highlightColor: "#d7dee6"
};

export type FogEffectTuningSettings = SmokeEffectTuningSettings;

export const DEFAULT_FOG_EFFECT_TUNING_SETTINGS: FogEffectTuningSettings = {
  opacity: 0.62,
  cloudScale: 3.6,
  speed: 0.08,
  directionDegrees: 282,
  turbulence: 0.42,
  softness: 0.9,
  density: 0.48,
  lift: 0.08,
  panFollow: 1,
  zoomScale: 0,
  baseAlpha: 0.18,
  shadowColor: "#52606d",
  smokeColor: "#b7c2cc",
  highlightColor: "#f3f7fb"
};

export interface EnvironmentEffectMask {
  id: string;
  name?: string;
  kind: "rectangle" | "polygon" | "circle";
  effect: EnvironmentEffectType;
  points: Point[];
  radius?: number;
  feather?: number;
  waterTuning?: WaterEffectTuningSettings;
  lavaTuning?: LavaEffectTuningSettings;
  fireTuning?: FireEffectTuningSettings;
  lightningTuning?: LightningEffectTuningSettings;
  arcaneTuning?: ArcaneEffectTuningSettings;
  radiantTuning?: RadiantEffectTuningSettings;
  fieldTuning?: ForceFieldEffectTuningSettings;
  shockwaveTuning?: ShockwaveEffectTuningSettings;
  smokeTuning?: SmokeEffectTuningSettings;
  fogTuning?: FogEffectTuningSettings;
  visibleInGm?: boolean;
  visibleInPlayer?: boolean;
}

export interface EnvironmentSettings {
  effects: EnvironmentEffectMask[];
}

export interface FogShape {
  id: string;
  name?: string;
  operation: "reveal" | "hide";
  kind: "brush" | "rectangle" | "polygon" | "circle";
  points: Point[];
  radius?: number;
  visibleInGm?: boolean;
  visibleInPlayer?: boolean;
  visible?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface SquareCropRect {
  x: number;
  y: number;
  size: number;
}

export interface Token {
  id: string;
  name: string;
  assetId?: string;
  position: Point;
  size: { width: number; height: number };
  sizePreset?: TokenSizePreset;
  mask?: TokenMask;
  borderColor?: string;
  borderStyle?: TokenBorderStyle;
  borderWidth?: number;
  borderWidthPreset?: TokenBorderWidthPreset;
  glowColor?: string;
  footprintVisible?: boolean;
  order?: number;
  auraRadius?: number;
  hidden: boolean;
  visibleInGm?: boolean;
  visibleInPlayer: boolean;
  vision?: {
    enabled: boolean;
    radius: number;
  };
  light?: {
    enabled: boolean;
    brightRadius: number;
    dimRadius: number;
    color: string;
    intensity: number;
  };
}

export interface TokenMovementPath {
  tokenId: string;
  points: Point[];
}

export interface Wall {
  id: string;
  type: WallType;
  points: Point[];
  open?: boolean;
  color: string;
  thickness: number;
}

export interface LightSource {
  id: string;
  position: Point;
  color: string;
  intensity: number;
  brightRadius: number;
  dimRadius: number;
  opacity: number;
  enabled: boolean;
  flicker: boolean;
  attachedTokenId?: string;
}

export interface DrawingElement {
  id: string;
  name?: string;
  kind: DrawingKind;
  points: Point[];
  text?: string;
  color: string;
  opacity: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWidth: number;
  fill?: string;
  fillColor?: string;
  fillOpacity?: number;
  strokeStyle?: DrawingStrokeStyle;
  templateEffect?: DrawingTemplateEffect;
  templateWidth?: number;
  templateFootprintVisible?: boolean;
  measurementLabelVisible?: boolean;
  visibleInGm?: boolean;
  visibleInPlayer: boolean;
}

export type DrawingStrokeStyle = "solid" | "dashed" | "dotted" | "dash-dot" | "sketch";
export type DrawingTemplateEffect =
  | "plain"
  | "acid"
  | "arcane"
  | "cold"
  | "darkness"
  | "fire"
  | "fog"
  | "lightning"
  | "nature"
  | "poison"
  | "psychic"
  | "radiant"
  | "storm"
  | "thunder"
  | "water"
  | "web";

export interface SceneOverlay {
  id: string;
  assetId: string;
  layerId: string;
  position: Point;
  scale: number;
  rotation: number;
  opacity: number;
  visibleInPlayer: boolean;
  mask?: {
    kind: "polygon" | "rectangle" | "circle";
    points: Point[];
  };
}

export interface VideoPlaybackSettings {
  diagnosticsVisible: boolean;
  paused: boolean;
  muted: boolean;
}

export interface TableToolSettings {
  pingSize: number;
  pingColor: string;
  laserThickness: number;
  laserColor: string;
  rulerLinger: boolean;
}

export interface TurnOrderEntry {
  id: string;
  name: string;
  initiative: number;
  visibleInPlayer: boolean;
  playerId?: string;
  tokenId?: string;
  assetId?: string;
}

export interface PlayerSeatIndicator {
  id: string;
  name: string;
  edge: "top" | "right" | "bottom" | "left";
  position: number;
  color: string;
  assetId?: string;
  visibleInPlayer: boolean;
}

export type PlayerIndicatorTheme =
  | "generic"
  | "barbarian"
  | "bard"
  | "cleric"
  | "druid"
  | "fighter"
  | "monk"
  | "paladin"
  | "ranger"
  | "rogue"
  | "sorcerer"
  | "warlock"
  | "wizard";

export const PLAYER_INDICATOR_THEMES: PlayerIndicatorTheme[] = [
  "generic",
  "barbarian",
  "bard",
  "cleric",
  "druid",
  "fighter",
  "monk",
  "paladin",
  "ranger",
  "rogue",
  "sorcerer",
  "warlock",
  "wizard"
];

export const PLAYER_INDICATOR_THEME_LABELS: Record<PlayerIndicatorTheme, string> = {
  generic: "Generic",
  barbarian: "Barbarian",
  bard: "Bard",
  cleric: "Cleric",
  druid: "Druid",
  fighter: "Fighter",
  monk: "Monk",
  paladin: "Paladin",
  ranger: "Ranger",
  rogue: "Rogue",
  sorcerer: "Sorcerer",
  warlock: "Warlock",
  wizard: "Wizard"
};

export interface TurnOrderSettings {
  active: boolean;
  currentEntryId?: string;
  playerViewVisible: boolean;
  playerViewEdge: "top" | "right" | "bottom" | "left";
  playerViewFacing: "inward" | "outward";
  playerViewSize: "xs" | "sm" | "md" | "lg" | "xl";
  playerTurnStatusSize: "xs" | "sm" | "md" | "lg" | "xl";
  initiativeDiceCount: number;
  initiativeDiceSides: number;
  entries: TurnOrderEntry[];
  seats: PlayerSeatIndicator[];
}

export interface Scene {
  id: string;
  name: string;
  mapAssetId?: string;
  createdAt: string;
  updatedAt: string;
  grid: GridSettings;
  calibration: DisplayCalibration;
  layers: Layer[];
  layerOrderLocked: boolean;
  mapTransform: MapTransform;
  fog: FogSettings;
  weather: WeatherSettings;
  environment: EnvironmentSettings;
  tokens: Token[];
  tokenMovementPath?: TokenMovementPath;
  walls: Wall[];
  lights: LightSource[];
  drawings: DrawingElement[];
  overlays: SceneOverlay[];
  turnOrder: TurnOrderSettings;
  videoPlayback: VideoPlaybackSettings;
  tableTools: TableToolSettings;
  notes: string;
  playerView: {
    backgroundColor: string;
    fitMode: "contain" | "cover" | "actual-size";
  };
}

export interface CampaignSceneEntry {
  id: string;
  name: string;
  file: string;
  mapAssetId?: string;
  folderId?: string;
  weather?: WeatherSettings;
}

export interface CampaignSceneFolder {
  id: string;
  name: string;
  createdAt: string;
  color: string;
}

export interface CampaignPlayer {
  id: string;
  name: string;
  color: string;
  assetId?: string;
  indicatorTheme?: PlayerIndicatorTheme;
  defaultSeatEdge: "top" | "right" | "bottom" | "left";
  defaultSeatPosition: number;
  visibleInPlayer: boolean;
}

export interface SceneLibrarySettings {
  collapsedFolderIds: string[];
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  defaultGrid: GridSettings;
  defaultMeasurement: MeasurementSettings;
  defaultCalibration: DisplayCalibration;
  playerDisplay: DisplayCalibration;
  diceSettings: DiceSettings;
  sceneLibrary: SceneLibrarySettings;
  sceneFolders: CampaignSceneFolder[];
  scenes: CampaignSceneEntry[];
  players: CampaignPlayer[];
  assets: Asset[];
}

export interface CampaignSummary {
  campaignPath: string;
  campaign: Campaign;
  missingAssets: string[];
}

export interface PlayerSceneProjection {
  campaignName: string;
  playerDisplay: DisplayCalibration;
  players: CampaignPlayer[];
  showPlayerSeatIndicators?: boolean;
  scene: Scene;
  assets: Asset[];
}

export interface PlayerSceneProjectionOptions {
  showPlayerSeatIndicators?: boolean;
}

export interface PlayerIdleState {
  type: "idle";
  variant?: "hold" | "blackout";
  title: string;
  message: string;
}

export interface LiveTablePoint {
  point: Point;
  createdAt: number;
}

export type DiceDisplayMode = "results" | "panel" | "scene" | "scene-result" | "hidden";
export type DiceSceneRollTarget = "gm" | "player";
export type DiceSceneSize = "xs" | "sm" | "md" | "lg" | "xl";
export type DicePanelEdge = "top" | "right" | "bottom" | "left";
export type DicePanelFacing = "inward" | "outward";

export interface DiceSettings {
  gmDisplayMode: DiceDisplayMode;
  playerDisplayMode: DiceDisplayMode;
  sceneRollEnabled: boolean;
  sceneRollTarget: DiceSceneRollTarget;
  gmSceneSize: DiceSceneSize;
  playerSceneSize: DiceSceneSize;
  gmPanelEdge: DicePanelEdge;
  playerPanelEdge: DicePanelEdge;
  gmPanelFacing: DicePanelFacing;
  playerPanelFacing: DicePanelFacing;
  gmPanelPosition: number;
  playerPanelPosition: number;
  gmPanelAdvanced: boolean;
  playerPanelAdvanced: boolean;
}

export const DEFAULT_DICE_SETTINGS: DiceSettings = {
  gmDisplayMode: "panel",
  playerDisplayMode: "hidden",
  sceneRollEnabled: false,
  sceneRollTarget: "gm",
  gmSceneSize: "md",
  playerSceneSize: "md",
  gmPanelEdge: "top",
  playerPanelEdge: "top",
  gmPanelFacing: "inward",
  playerPanelFacing: "inward",
  gmPanelPosition: 0.5,
  playerPanelPosition: 0.5,
  gmPanelAdvanced: false,
  playerPanelAdvanced: false
};

export type LiveTableEvent =
  | {
      id: string;
      type: "ping";
      point: Point;
      size?: number;
      color?: string;
      visibleInPlayer?: boolean;
      createdAt: number;
    }
  | {
      id: string;
      type: "laser";
      points: LiveTablePoint[];
      thickness?: number;
      color?: string;
      visibleInPlayer?: boolean;
      createdAt: number;
    }
  | {
      id: string;
      type: "ruler";
      points: Point[];
      primary: string;
      secondary?: string;
      visibleInPlayer?: boolean;
      createdAt: number;
      expiresAt?: number;
    }
  | {
      id: string;
      type: "ruler-clear";
      createdAt: number;
    }
  | {
      id: string;
      type: "dice";
      die: "coin" | "d2" | "d4" | "d6" | "d8" | "d10" | "d00" | "d12" | "d20";
      result: number;
      label: string;
      formula?: string;
      rollLabel?: string;
      seed: number;
      sceneResolvedLabel?: string;
      sceneResolvedSummary?: string;
      sceneResolvedResult?: number;
      gmDiceDisplay?: DiceDisplayMode;
      playerDiceDisplay?: DiceDisplayMode;
      gmDiceSceneSize?: DiceSceneSize;
      playerDiceSceneSize?: DiceSceneSize;
      gmDicePanelEdge?: DicePanelEdge;
      playerDicePanelEdge?: DicePanelEdge;
      gmDicePanelFacing?: DicePanelFacing;
      playerDicePanelFacing?: DicePanelFacing;
      gmDicePanelPosition?: number;
      playerDicePanelPosition?: number;
      gmDicePanelAdvanced?: boolean;
      playerDicePanelAdvanced?: boolean;
      gmPresentation?: "3d" | "result";
      playerPresentation?: "3d" | "result";
      presentation?: "3d" | "result";
      dice?: Array<{
        die: "coin" | "d2" | "d4" | "d6" | "d8" | "d10" | "d00" | "d12" | "d20";
        result: number;
        label: string;
        seed: number;
        kept?: boolean;
      }>;
      createdAt: number;
    }
  | {
      id: string;
      type: "dice-clear";
      createdAt: number;
    };

export const DEFAULT_MEASUREMENT: MeasurementSettings = {
  unit: "feet",
  unitsPerGridCell: 5,
  distanceMode: "euclidean"
};

export const DEFAULT_GRID: GridSettings = {
  type: "gridless",
  sizePx: 100,
  offsetX: 0,
  offsetY: 0,
  mapGridColumns: 44,
  mapGridRows: 25,
  color: "#ffffff",
  opacity: 0.45,
  lineThickness: 1,
  showOnGm: true,
  showOnPlayer: true,
  measurement: DEFAULT_MEASUREMENT
};

export const DEFAULT_CALIBRATION: DisplayCalibration = {
  physicalScaleEnabled: false,
  mode: "manual",
  openPlayerViewFullscreen: false,
  pixelsPerInch: 100,
  inchesPerGridCell: 1,
  screenDiagonalInches: 23.8,
  screenAspectRatio: "16:9",
  screenResolutionWidth: 2560,
  screenResolutionHeight: 1440,
  defaultScaleLabel: "1 inch = 5 feet"
};

export const DEFAULT_MAP_TRANSFORM: MapTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  fitMode: "manual"
};

export const DEFAULT_VIDEO_PLAYBACK: VideoPlaybackSettings = {
  diagnosticsVisible: false,
  paused: false,
  muted: true
};

export const DEFAULT_TABLE_TOOLS: TableToolSettings = {
  pingSize: 1,
  pingColor: "#ffd84d",
  laserThickness: 20,
  laserColor: "#ff525e",
  rulerLinger: false
};

export const DEFAULT_TURN_ORDER: TurnOrderSettings = {
  active: false,
  playerViewVisible: false,
  playerViewEdge: "top",
  playerViewFacing: "inward",
  playerViewSize: "md",
  playerTurnStatusSize: "md",
  initiativeDiceCount: 1,
  initiativeDiceSides: 20,
  entries: [],
  seats: []
};

export const DEFAULT_PLAYER_VIEW: Scene["playerView"] = {
  backgroundColor: "#000000",
  fitMode: "contain"
};

export const DEFAULT_TOKEN_BORDER_COLOR = "#7aa2f7";
export const DEFAULT_TOKEN_BORDER_STYLE: TokenBorderStyle = "none";
export const DEFAULT_TOKEN_BORDER_WIDTH = 24;
export const DEFAULT_TOKEN_BORDER_WIDTH_PRESET: TokenBorderWidthPreset = "medium";
export const DEFAULT_TOKEN_GLOW_COLOR = "#7aa2f7";
export const DEFAULT_TOKEN_FOOTPRINT_VISIBLE = false;
export const DEFAULT_TOKEN_MASK: TokenMask = "circle";
export const DEFAULT_TOKEN_SIZE_PRESET: TokenSizePreset = "medium";

export const DEFAULT_SCENE_FOLDER_COLOR = "#7aa2f7";

export const DEFAULT_FOG: FogSettings = {
  mode: "revealed",
  color: "#000000",
  opacity: 1,
  gmOpacity: 0,
  playerOpacity: 0,
  brushSize: 80,
  previewOnGm: true,
  newShapesVisibleInPlayer: true,
  shapes: []
};

export const DEFAULT_WEATHER_TUNING: WeatherTuningSettings = {
  intensity: 0.65,
  opacity: 0.65,
  color: "#d8dee9",
  speed: 0.6,
  directionDegrees: 0,
  driftStrength: 0,
  edgeBias: 0.72,
  quietAreaSize: 0.72,
  centerStrayDrops: 0.35,
  streakLength: 1,
  lightningFrequency: 0.42,
  flashStrength: 0.22,
  quality: "balanced"
};

export const DEFAULT_WEATHER_EFFECT_SETTINGS: Record<WeatherPatternEffectType, WeatherTuningSettings> = {
  "light-rain": {
    intensity: 0.45,
    opacity: 0.48,
    color: "#d8dee9",
    speed: 0.55,
    directionDegrees: 0,
    driftStrength: 0,
    edgeBias: 0.78,
    quietAreaSize: 0.6,
    centerStrayDrops: 0.18,
    streakLength: 0.72,
    lightningFrequency: 0,
    flashStrength: 0,
    quality: "balanced"
  },
  rain: {
    intensity: 0.58,
    opacity: 0.58,
    color: "#d8dee9",
    speed: 0.6,
    directionDegrees: 0,
    driftStrength: 0,
    edgeBias: 0.72,
    quietAreaSize: 0.6,
    centerStrayDrops: 0.28,
    streakLength: 0.86,
    lightningFrequency: 0,
    flashStrength: 0,
    quality: "balanced"
  },
  "heavy-rain": {
    ...DEFAULT_WEATHER_TUNING,
    quietAreaSize: 0.6
  },
  "rain-storm": {
    intensity: 0.74,
    opacity: 0.68,
    color: "#d8dee9",
    speed: 0.72,
    directionDegrees: 0,
    driftStrength: 0,
    edgeBias: 0.68,
    quietAreaSize: 0.6,
    centerStrayDrops: 0.4,
    streakLength: 1.08,
    lightningFrequency: 0.42,
    flashStrength: 0.22,
    quality: "balanced"
  },
  "light-fog": {
    intensity: 0.9,
    opacity: 0.82,
    color: "#d8dee9",
    speed: 0.76,
    directionDegrees: 0,
    driftStrength: 0.28,
    edgeBias: 0.78,
    quietAreaSize: 0.78,
    centerStrayDrops: 0.18,
    streakLength: 1.05,
    lightningFrequency: 0,
    flashStrength: 0,
    quality: "balanced"
  },
  fog: {
    intensity: 0.98,
    opacity: 0.9,
    color: "#d8dee9",
    speed: 0.84,
    directionDegrees: 0,
    driftStrength: 0.34,
    edgeBias: 0.74,
    quietAreaSize: 0.72,
    centerStrayDrops: 0.24,
    streakLength: 1.16,
    lightningFrequency: 0,
    flashStrength: 0,
    quality: "balanced"
  },
  "heavy-fog": {
    intensity: 1,
    opacity: 1,
    color: "#d8dee9",
    speed: 0.92,
    directionDegrees: 0,
    driftStrength: 0.42,
    edgeBias: 0.7,
    quietAreaSize: 0.66,
    centerStrayDrops: 0.32,
    streakLength: 1.28,
    lightningFrequency: 0,
    flashStrength: 0,
    quality: "balanced"
  },
  "light-snow": {
    intensity: 0.95,
    opacity: 0.82,
    color: "#d8dee9",
    speed: 0.48,
    directionDegrees: 0,
    driftStrength: 0,
    edgeBias: 0.12,
    quietAreaSize: 0.45,
    centerStrayDrops: 0.82,
    streakLength: 1.18,
    lightningFrequency: 0,
    flashStrength: 0,
    quality: "balanced"
  },
  snow: {
    intensity: 1,
    opacity: 0.9,
    color: "#d8dee9",
    speed: 0.58,
    directionDegrees: 0,
    driftStrength: 0,
    edgeBias: 0.1,
    quietAreaSize: 0.45,
    centerStrayDrops: 0.86,
    streakLength: 1.24,
    lightningFrequency: 0,
    flashStrength: 0,
    quality: "balanced"
  },
  blizzard: {
    intensity: 1.08,
    opacity: 1,
    color: "#d8dee9",
    speed: 0.72,
    directionDegrees: 0,
    driftStrength: 0,
    edgeBias: 0.08,
    quietAreaSize: 0.45,
    centerStrayDrops: 0.9,
    streakLength: 1.34,
    lightningFrequency: 0,
    flashStrength: 0,
    quality: "balanced"
  },
  "light-sand": {
    intensity: 0.9,
    opacity: 0.62,
    color: "#d8b16f",
    speed: 0.72,
    directionDegrees: 0,
    driftStrength: 0.58,
    edgeBias: 0.72,
    quietAreaSize: 0.58,
    centerStrayDrops: 0.3,
    streakLength: 0.92,
    lightningFrequency: 0,
    flashStrength: 0,
    quality: "balanced"
  },
  sand: {
    intensity: 1.05,
    opacity: 0.78,
    color: "#d1984e",
    speed: 0.86,
    directionDegrees: 0,
    driftStrength: 0.72,
    edgeBias: 0.66,
    quietAreaSize: 0.52,
    centerStrayDrops: 0.42,
    streakLength: 1.12,
    lightningFrequency: 0,
    flashStrength: 0,
    quality: "balanced"
  },
  sandstorm: {
    intensity: 1.24,
    opacity: 0.98,
    color: "#c87932",
    speed: 1.08,
    directionDegrees: 0,
    driftStrength: 0.88,
    edgeBias: 0.56,
    quietAreaSize: 0.42,
    centerStrayDrops: 0.62,
    streakLength: 1.42,
    lightningFrequency: 0,
    flashStrength: 0,
    quality: "balanced"
  }
};

export const DEFAULT_WEATHER: WeatherSettings = {
  enabled: false,
  effect: "none",
  ...DEFAULT_WEATHER_TUNING,
  effectSettings: {},
  effects: {
    rain: {
      enabled: false,
      pattern: "rain",
      settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS.rain }
    },
    fog: {
      enabled: false,
      pattern: "fog",
      settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS.fog }
    },
    snow: {
      enabled: false,
      pattern: "snow",
      settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS.snow }
    },
    sand: {
      enabled: false,
      pattern: "sand",
      settings: { ...DEFAULT_WEATHER_EFFECT_SETTINGS.sand }
    }
  },
  masks: []
};

export function createDefaultWeather(): WeatherSettings {
  return {
    ...DEFAULT_WEATHER,
    effectSettings: {},
    effects: {
      rain: {
        ...DEFAULT_WEATHER.effects.rain,
        settings: { ...DEFAULT_WEATHER.effects.rain.settings }
      },
      fog: {
        ...DEFAULT_WEATHER.effects.fog,
        settings: { ...DEFAULT_WEATHER.effects.fog.settings }
      },
      snow: {
        ...DEFAULT_WEATHER.effects.snow,
        settings: { ...DEFAULT_WEATHER.effects.snow.settings }
      },
      sand: {
        ...DEFAULT_WEATHER.effects.sand,
        settings: { ...DEFAULT_WEATHER.effects.sand.settings }
      }
    },
    masks: []
  };
}

export const DEFAULT_ENVIRONMENT: EnvironmentSettings = {
  effects: []
};

const WEATHER_EFFECTS = new Set<WeatherEffectType>([
  "none",
  "light-rain",
  "rain",
  "rain-storm",
  "heavy-rain",
  "light-fog",
  "fog",
  "heavy-fog",
  "light-snow",
  "snow",
  "blizzard",
  "light-sand",
  "sand",
  "sandstorm"
]);

const ENVIRONMENT_EFFECTS = new Set<EnvironmentEffectType>(["water", "lava", "smoke", "fog", "fire", "electric", "arcane", "radiant", "field", "shockwave"]);

export const DEFAULT_LAYERS: Layer[] = [
  // Larger order values render/manage above lower values. Keep ids stable for saved scene compatibility.
  { id: "gm", name: "GM", kind: "gm", order: 90, visibleInGm: true, visibleInPlayer: false, locked: false, opacity: 1 },
  { id: "fog", name: "Fog of War", kind: "fog", order: 80, visibleInGm: true, visibleInPlayer: true, locked: false, opacity: 1 },
  { id: "effects", name: "Effects", kind: "effects", order: 70, visibleInGm: true, visibleInPlayer: true, locked: false, opacity: 1 },
  { id: "drawing", name: "Drawings", kind: "drawing", order: 65, visibleInGm: true, visibleInPlayer: true, locked: false, opacity: 1 },
  { id: "foreground", name: "Foreground", kind: "foreground", order: 60, visibleInGm: true, visibleInPlayer: true, locked: false, opacity: 1 },
  { id: "token", name: "Tokens", kind: "token", order: 50, visibleInGm: true, visibleInPlayer: false, locked: false, opacity: 1 },
  { id: "object", name: "Objects", kind: "object", order: 40, visibleInGm: true, visibleInPlayer: true, locked: false, opacity: 1 },
  { id: "lighting", name: "Dynamic Lighting", kind: "lighting", order: 30, visibleInGm: true, visibleInPlayer: true, locked: false, opacity: 1 },
  { id: "grid", name: "Grid", kind: "grid", order: 20, visibleInGm: true, visibleInPlayer: true, locked: false, opacity: 1 },
  { id: "map", name: "Map", kind: "map", order: 10, visibleInGm: true, visibleInPlayer: true, locked: true, opacity: 1 }
];

export function createDefaultCampaign(name: string): Campaign {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    description: "",
    createdAt: now,
    updatedAt: now,
    defaultGrid: { ...DEFAULT_GRID, measurement: { ...DEFAULT_MEASUREMENT } },
    defaultMeasurement: { ...DEFAULT_MEASUREMENT },
    defaultCalibration: { ...DEFAULT_CALIBRATION },
    playerDisplay: { ...DEFAULT_CALIBRATION },
    diceSettings: { ...DEFAULT_DICE_SETTINGS },
    sceneLibrary: { collapsedFolderIds: [] },
    sceneFolders: [],
    scenes: [],
    players: [],
    assets: []
  };
}

export function createDefaultScene(name: string): Scene {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: now,
    updatedAt: now,
    grid: { ...DEFAULT_GRID, measurement: { ...DEFAULT_MEASUREMENT } },
    calibration: { ...DEFAULT_CALIBRATION },
    layers: DEFAULT_LAYERS.map((layer) => ({ ...layer })),
    layerOrderLocked: true,
    mapTransform: { ...DEFAULT_MAP_TRANSFORM },
    fog: { ...DEFAULT_FOG, shapes: [] },
    weather: createDefaultWeather(),
    environment: { ...DEFAULT_ENVIRONMENT, effects: [] },
    tokens: [],
    walls: [],
    lights: [],
    drawings: [],
    overlays: [],
    turnOrder: { ...DEFAULT_TURN_ORDER, entries: [], seats: [] },
    videoPlayback: { ...DEFAULT_VIDEO_PLAYBACK },
    tableTools: { ...DEFAULT_TABLE_TOOLS },
    notes: "",
    playerView: { ...DEFAULT_PLAYER_VIEW }
  };
}

export function duplicateScene(
  source: Scene,
  name: string,
  options: {
    sceneId?: string;
    now?: string;
    createId?: () => string;
  } = {}
): Scene {
  const createId = options.createId ?? (() => crypto.randomUUID());
  const now = options.now ?? new Date().toISOString();
  const duplicated = normalizeScene(structuredClone(source));
  const tokenIds = new Map<string, string>();
  const tokens = duplicated.tokens.map((token) => {
    const id = createId();
    tokenIds.set(token.id, id);
    return { ...token, id };
  });

  return {
    ...duplicated,
    id: options.sceneId ?? createId(),
    name,
    createdAt: now,
    updatedAt: now,
    tokenMovementPath: undefined,
    fog: {
      ...duplicated.fog,
      shapes: duplicated.fog.shapes.map((shape) => ({ ...shape, id: createId() }))
    },
    environment: {
      ...duplicated.environment,
      effects: duplicated.environment.effects.map((effect) => ({ ...effect, id: createId() }))
    },
    tokens,
    walls: duplicated.walls.map((wall) => ({ ...wall, id: createId() })),
    lights: duplicated.lights.map((light) => ({
      ...light,
      id: createId(),
      attachedTokenId: light.attachedTokenId ? (tokenIds.get(light.attachedTokenId) ?? light.attachedTokenId) : undefined
    })),
    drawings: duplicated.drawings.map((drawing) => ({ ...drawing, id: createId() })),
    overlays: duplicated.overlays.map((overlay) => ({ ...overlay, id: createId() }))
  };
}

export function assertValidCampaign(value: unknown): asserts value is Campaign {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.name) || !Array.isArray(value.scenes)) {
    throw new Error("Invalid campaign.json file.");
  }
  if ("assets" in value && !Array.isArray(value.assets)) {
    throw new Error("Invalid campaign assets list.");
  }
  if ("sceneFolders" in value && !Array.isArray(value.sceneFolders)) {
    throw new Error("Invalid campaign scene folders list.");
  }
}

export function assertValidScene(value: unknown): asserts value is Scene {
  if (!isRecord(value) || !isNonEmptyString(value.id) || !isNonEmptyString(value.name) || !Array.isArray(value.layers)) {
    throw new Error("Invalid scene file.");
  }
}

export function isPlayerSceneProjection(value: unknown): value is PlayerSceneProjection {
  return (
    isRecord(value) &&
    typeof value.campaignName === "string" &&
    isRecord(value.playerDisplay) &&
    Array.isArray(value.assets) &&
    (!("players" in value) || Array.isArray(value.players)) &&
    (!("showPlayerSeatIndicators" in value) || typeof value.showPlayerSeatIndicators === "boolean") &&
    isValidSceneShape(value.scene)
  );
}

export function isPlayerIdleState(value: unknown): value is PlayerIdleState {
  return (
    isRecord(value) &&
    value.type === "idle" &&
    (!("variant" in value) || value.variant === "hold" || value.variant === "blackout") &&
    typeof value.title === "string" &&
    typeof value.message === "string"
  );
}

export function isLiveTableEvent(value: unknown): value is LiveTableEvent {
  if (!isRecord(value) || !isNonEmptyString(value.id) || typeof value.createdAt !== "number") {
    return false;
  }
  if (value.type === "ping") {
    return (
      isPoint(value.point) &&
      (!("size" in value) || (typeof value.size === "number" && Number.isFinite(value.size))) &&
      (!("color" in value) || typeof value.color === "string") &&
      (!("visibleInPlayer" in value) || typeof value.visibleInPlayer === "boolean")
    );
  }
  if (value.type === "laser") {
    return (
      Array.isArray(value.points) &&
      value.points.every((entry) => isRecord(entry) && isPoint(entry.point) && typeof entry.createdAt === "number") &&
      (!("thickness" in value) || (typeof value.thickness === "number" && Number.isFinite(value.thickness))) &&
      (!("color" in value) || typeof value.color === "string") &&
      (!("visibleInPlayer" in value) || typeof value.visibleInPlayer === "boolean")
    );
  }
  if (value.type === "ruler") {
    return (
      Array.isArray(value.points) &&
      value.points.length >= 2 &&
      value.points.every(isPoint) &&
      typeof value.primary === "string" &&
      (!("secondary" in value) || typeof value.secondary === "string") &&
      (!("visibleInPlayer" in value) || typeof value.visibleInPlayer === "boolean") &&
      (!("expiresAt" in value) || (typeof value.expiresAt === "number" && Number.isFinite(value.expiresAt)))
    );
  }
  if (value.type === "ruler-clear") {
    return true;
  }
  if (value.type === "dice") {
    return (
      isDiceType(value.die) &&
      typeof value.result === "number" &&
      Number.isInteger(value.result) &&
      typeof value.label === "string" &&
      (!("formula" in value) || typeof value.formula === "string") &&
      (!("rollLabel" in value) || typeof value.rollLabel === "string") &&
      typeof value.seed === "number" &&
      Number.isFinite(value.seed) &&
      (!("sceneResolvedLabel" in value) || typeof value.sceneResolvedLabel === "string") &&
      (!("sceneResolvedSummary" in value) || typeof value.sceneResolvedSummary === "string") &&
      (!("sceneResolvedResult" in value) || (typeof value.sceneResolvedResult === "number" && Number.isInteger(value.sceneResolvedResult))) &&
      (!("gmDiceDisplay" in value) || isDiceDisplayMode(value.gmDiceDisplay)) &&
      (!("playerDiceDisplay" in value) || isDiceDisplayMode(value.playerDiceDisplay)) &&
      (!("gmDiceSceneSize" in value) || isDiceSceneSize(value.gmDiceSceneSize)) &&
      (!("playerDiceSceneSize" in value) || isDiceSceneSize(value.playerDiceSceneSize)) &&
      (!("gmDicePanelEdge" in value) || isDicePanelEdge(value.gmDicePanelEdge)) &&
      (!("playerDicePanelEdge" in value) || isDicePanelEdge(value.playerDicePanelEdge)) &&
      (!("gmDicePanelFacing" in value) || isDicePanelFacing(value.gmDicePanelFacing)) &&
      (!("playerDicePanelFacing" in value) || isDicePanelFacing(value.playerDicePanelFacing)) &&
      (!("gmDicePanelPosition" in value) || isUnitNumber(value.gmDicePanelPosition)) &&
      (!("playerDicePanelPosition" in value) || isUnitNumber(value.playerDicePanelPosition)) &&
      (!("gmDicePanelAdvanced" in value) || typeof value.gmDicePanelAdvanced === "boolean") &&
      (!("playerDicePanelAdvanced" in value) || typeof value.playerDicePanelAdvanced === "boolean") &&
      (!("gmPresentation" in value) || value.gmPresentation === "3d" || value.gmPresentation === "result") &&
      (!("playerPresentation" in value) || value.playerPresentation === "3d" || value.playerPresentation === "result") &&
      (!("presentation" in value) || value.presentation === "3d" || value.presentation === "result") &&
      (!("dice" in value) ||
        (Array.isArray(value.dice) &&
          value.dice.every(
            (die) =>
              isRecord(die) &&
              isDiceType(die.die) &&
              typeof die.result === "number" &&
              Number.isInteger(die.result) &&
              typeof die.label === "string" &&
              typeof die.seed === "number" &&
              Number.isFinite(die.seed) &&
              (!("kept" in die) || typeof die.kept === "boolean")
          )))
    );
  }
  if (value.type === "dice-clear") {
    return true;
  }
  return false;
}

function isDiceType(value: unknown): value is Extract<LiveTableEvent, { type: "dice" }>["die"] {
  return value === "coin" || value === "d2" || value === "d4" || value === "d6" || value === "d8" || value === "d10" || value === "d00" || value === "d12" || value === "d20";
}

function isDiceDisplayMode(value: unknown): value is DiceDisplayMode {
  return value === "results" || value === "panel" || value === "scene" || value === "scene-result" || value === "hidden";
}

function isDiceSceneSize(value: unknown): value is DiceSceneSize {
  return value === "xs" || value === "sm" || value === "md" || value === "lg" || value === "xl";
}

function isDiceSceneRollTarget(value: unknown): value is DiceSceneRollTarget {
  return value === "gm" || value === "player";
}

function isDicePanelEdge(value: unknown): value is DicePanelEdge {
  return value === "top" || value === "right" || value === "bottom" || value === "left";
}

function isDicePanelFacing(value: unknown): value is DicePanelFacing {
  return value === "inward" || value === "outward";
}

function normalizePlayerIndicatorTheme(value: unknown): PlayerIndicatorTheme {
  return PLAYER_INDICATOR_THEMES.includes(value as PlayerIndicatorTheme) ? (value as PlayerIndicatorTheme) : "generic";
}

function normalizeTableTools(settings?: Partial<TableToolSettings>): TableToolSettings {
  return {
    ...DEFAULT_TABLE_TOOLS,
    ...(settings ?? {}),
    pingSize: clampNumber(settings?.pingSize, 0.5, 3, DEFAULT_TABLE_TOOLS.pingSize),
    pingColor: normalizeColor(settings?.pingColor, DEFAULT_TABLE_TOOLS.pingColor),
    laserThickness: clampNumber(settings?.laserThickness, 4, 80, DEFAULT_TABLE_TOOLS.laserThickness),
    laserColor: normalizeColor(settings?.laserColor, DEFAULT_TABLE_TOOLS.laserColor),
    rulerLinger: typeof settings?.rulerLinger === "boolean" ? settings.rulerLinger : DEFAULT_TABLE_TOOLS.rulerLinger
  };
}

function normalizeLayerIdentity(layer: Layer): Layer {
  if (layer.id === "weather" || (layer.kind as string) === "weather") {
    return {
      ...layer,
      id: "effects",
      kind: "effects"
    };
  }
  return layer;
}

function normalizeLayerId(layerId: string): string {
  return layerId === "weather" ? "effects" : layerId;
}

function normalizeSceneOverlays(overlays?: SceneOverlay[]): SceneOverlay[] {
  return (overlays ?? []).map((overlay) => ({
    ...overlay,
    layerId: normalizeLayerId(overlay.layerId)
  }));
}

function isUnitNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isPoint(value: unknown): value is Point {
  return isRecord(value) && typeof value.x === "number" && Number.isFinite(value.x) && typeof value.y === "number" && Number.isFinite(value.y);
}

export function normalizeScene(scene: Scene): Scene {
  const migratedLayers = (scene.layers ?? []).map(normalizeLayerIdentity);
  const layerById = new Map(migratedLayers.map((layer) => [layer.id, layer]));
  // Default layer names/order are application-owned so old scene files pick up current layer labels safely.
  const normalizedLayers = DEFAULT_LAYERS.map((defaultLayer) => ({
    ...defaultLayer,
    ...(layerById.get(defaultLayer.id) ?? {}),
    name: defaultLayer.name,
    order: defaultLayer.order
  }));
  const customLayers = migratedLayers.filter((layer) => !DEFAULT_LAYERS.some((defaultLayer) => defaultLayer.id === layer.id));

  return {
    ...scene,
    grid: { ...DEFAULT_GRID, ...(scene.grid ?? {}), measurement: { ...DEFAULT_MEASUREMENT, ...(scene.grid?.measurement ?? {}) } },
    calibration: { ...DEFAULT_CALIBRATION, ...(scene.calibration ?? {}) },
    layers: [...normalizedLayers, ...customLayers],
    layerOrderLocked: scene.layerOrderLocked ?? true,
    mapTransform: { ...DEFAULT_MAP_TRANSFORM, ...(scene.mapTransform ?? {}) },
    fog: normalizeFog(scene.fog),
    weather: normalizeWeather(scene.weather),
    environment: normalizeEnvironment(scene.environment),
    tokens: normalizeTokens(scene.tokens),
    tokenMovementPath: normalizeTokenMovementPath(scene.tokenMovementPath),
    walls: scene.walls ?? [],
    lights: scene.lights ?? [],
    drawings: normalizeDrawings(scene.drawings),
    overlays: normalizeSceneOverlays(scene.overlays),
    turnOrder: normalizeTurnOrder(scene.turnOrder),
    videoPlayback: { ...DEFAULT_VIDEO_PLAYBACK, ...(scene.videoPlayback ?? {}) },
    tableTools: normalizeTableTools(scene.tableTools),
    notes: scene.notes ?? "",
    playerView: { ...DEFAULT_PLAYER_VIEW, ...(scene.playerView ?? {}) }
  };
}

function isValidSceneShape(value: unknown): value is Scene {
  return isRecord(value) && isNonEmptyString(value.id) && isNonEmptyString(value.name) && Array.isArray(value.layers);
}

function normalizeWeather(weather?: Partial<WeatherSettings>): WeatherSettings {
  const effect = weather?.effect && WEATHER_EFFECTS.has(weather.effect) ? weather.effect : DEFAULT_WEATHER.effect;
  const effectSettings = normalizeWeatherEffectSettings(weather?.effectSettings);
  const activeDefaults = effect !== "none" ? DEFAULT_WEATHER_EFFECT_SETTINGS[effect] : DEFAULT_WEATHER_TUNING;
  const effects = normalizeWeatherEffects(weather, effect, effectSettings);
  const enabled = weather?.enabled ?? hasEnabledWeatherEffect(effects);
  return {
    ...DEFAULT_WEATHER,
    ...(weather ?? {}),
    enabled,
    effect,
    intensity: clampNumber(weather?.intensity, 0, 1, activeDefaults.intensity),
    opacity: clampNumber(weather?.opacity, 0, 1, activeDefaults.opacity),
    speed: clampNumber(weather?.speed, 0.05, 3, activeDefaults.speed),
    directionDegrees: clampNumber(weather?.directionDegrees, 0, 360, activeDefaults.directionDegrees),
    driftStrength: clampNumber(weather?.driftStrength, 0, 1, activeDefaults.driftStrength),
    edgeBias: clampNumber(weather?.edgeBias, 0, 1, activeDefaults.edgeBias),
    quietAreaSize: clampNumber(weather?.quietAreaSize, 0.35, 0.9, activeDefaults.quietAreaSize),
    centerStrayDrops: clampNumber(weather?.centerStrayDrops, 0, 2, activeDefaults.centerStrayDrops),
    streakLength: clampNumber(weather?.streakLength, 0.4, 2, activeDefaults.streakLength),
    lightningFrequency: clampNumber(weather?.lightningFrequency, 0, 1, activeDefaults.lightningFrequency),
    flashStrength: clampNumber(weather?.flashStrength, 0, 1, activeDefaults.flashStrength),
    quality: normalizeWeatherQuality(weather?.quality, activeDefaults.quality),
    effectSettings,
    effects,
    masks: normalizeWeatherMasks(weather?.masks)
  };
}

function normalizeWeatherEffects(
  weather: Partial<WeatherSettings> | undefined,
  legacyEffect: WeatherEffectType,
  effectSettings: WeatherSettings["effectSettings"]
): WeatherEffectSlots {
  const rain = normalizeWeatherEffectSlot(weather?.effects?.rain, "rain", "rain", effectSettings);
  const fog = normalizeWeatherEffectSlot(weather?.effects?.fog, "fog", "fog", effectSettings);
  const snow = normalizeWeatherEffectSlot(weather?.effects?.snow, "snow", "snow", effectSettings);
  const sand = normalizeWeatherEffectSlot(weather?.effects?.sand, "sand", "sand", effectSettings);

  if (legacyEffect !== "none" && !weather?.effects) {
    if (isRainWeatherEffect(legacyEffect)) {
      rain.enabled = weather?.enabled ?? true;
      rain.pattern = legacyEffect;
      rain.settings = normalizeWeatherTuning({ ...rain.settings, ...(weather ?? {}) }, DEFAULT_WEATHER_EFFECT_SETTINGS[legacyEffect]);
    } else if (isFogWeatherEffect(legacyEffect)) {
      fog.enabled = weather?.enabled ?? true;
      fog.pattern = legacyEffect;
      fog.settings = normalizeWeatherTuning({ ...fog.settings, ...(weather ?? {}) }, DEFAULT_WEATHER_EFFECT_SETTINGS[legacyEffect]);
    } else if (isSnowWeatherEffect(legacyEffect)) {
      snow.enabled = weather?.enabled ?? true;
      snow.pattern = legacyEffect;
      snow.settings = normalizeWeatherTuning({ ...snow.settings, ...(weather ?? {}) }, DEFAULT_WEATHER_EFFECT_SETTINGS[legacyEffect]);
    } else if (isSandWeatherEffect(legacyEffect)) {
      sand.enabled = weather?.enabled ?? true;
      sand.pattern = legacyEffect;
      sand.settings = normalizeWeatherTuning({ ...sand.settings, ...(weather ?? {}) }, DEFAULT_WEATHER_EFFECT_SETTINGS[legacyEffect]);
    }
  }

  return { rain, fog, snow, sand };
}

function normalizeWeatherEffectSlot<TPattern extends WeatherPatternEffectType>(
  slot: WeatherEffectSlot<TPattern> | undefined,
  fallbackPattern: TPattern,
  kind: "rain" | "fog" | "snow" | "sand",
  effectSettings: WeatherSettings["effectSettings"]
): WeatherEffectSlot<TPattern> {
  const candidatePattern = slot?.pattern;
  const pattern =
    kind === "rain" && candidatePattern && isRainWeatherEffect(candidatePattern)
      ? candidatePattern
      : kind === "fog" && candidatePattern && isFogWeatherEffect(candidatePattern)
        ? candidatePattern
        : kind === "snow" && candidatePattern && isSnowWeatherEffect(candidatePattern)
          ? candidatePattern
          : kind === "sand" && candidatePattern && isSandWeatherEffect(candidatePattern)
            ? candidatePattern
            : fallbackPattern;
  const defaults = DEFAULT_WEATHER_EFFECT_SETTINGS[pattern];
  return {
    enabled: slot?.enabled ?? false,
    pattern,
    settings: normalizeWeatherTuning({ ...(effectSettings[pattern] ?? {}), ...(slot?.settings ?? {}) }, defaults)
  };
}

function normalizeWeatherMasks(masks?: WeatherMask[]): WeatherMask[] {
  const usedIds = new Set<string>();
  return (masks ?? [])
    .filter((mask) => mask.kind === "rectangle" || mask.kind === "polygon" || mask.kind === "circle")
    .map((mask, index) => {
      const rawId = typeof mask.id === "string" ? mask.id.trim() : "";
      const baseId = rawId || `weather-mask-${index + 1}`;
      let id = baseId;
      let suffix = 2;
      while (usedIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      usedIds.add(id);
      const points = mask.kind === "circle" ? mask.points.slice(0, 1) : mask.points;
      return {
        ...mask,
        id,
        name: typeof mask.name === "string" && mask.name.trim() ? mask.name : `Weather Effect Mask ${index + 1}`,
        points,
        visible: mask.visible ?? true
      };
    });
}

function normalizeEnvironment(environment?: Partial<EnvironmentSettings>): EnvironmentSettings {
  return {
    ...DEFAULT_ENVIRONMENT,
    effects: normalizeEnvironmentEffectMasks(environment?.effects)
  };
}

function normalizeEnvironmentEffectMasks(effects?: EnvironmentEffectMask[]): EnvironmentEffectMask[] {
  const usedIds = new Set<string>();
  return (effects ?? [])
    .filter((effect) => effect.kind === "rectangle" || effect.kind === "polygon" || effect.kind === "circle")
    .map((effect, index) => {
      const rawId = typeof effect.id === "string" ? effect.id.trim() : "";
      const baseId = rawId || `environment-effect-${index + 1}`;
      let id = baseId;
      let suffix = 2;
      while (usedIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      usedIds.add(id);
      const points = effect.kind === "circle" ? effect.points.slice(0, 1) : effect.points;
      const incomingEffectType = (effect as { effect?: unknown }).effect;
      const rawEffectType = incomingEffectType === "lightning" ? "electric" : incomingEffectType;
      const effectType = ENVIRONMENT_EFFECTS.has(rawEffectType as EnvironmentEffectType) ? (rawEffectType as EnvironmentEffectType) : "water";
      return {
        ...effect,
        id,
        name: typeof effect.name === "string" && effect.name.trim() ? effect.name : `${formatEnvironmentEffectName(effectType)} Effect ${index + 1}`,
        effect: effectType,
        points,
        feather: clampNumber(effect.feather, 0, 1, 0),
        waterTuning: effectType === "water" ? normalizeWaterEffectTuning(effect.waterTuning) : undefined,
        lavaTuning: effectType === "lava" ? normalizeLavaEffectTuning(effect.lavaTuning) : undefined,
        fireTuning: effectType === "fire" ? normalizeFireEffectTuning(effect.fireTuning) : undefined,
        lightningTuning: effectType === "electric" ? normalizeLightningEffectTuning(effect.lightningTuning) : undefined,
        arcaneTuning: effectType === "arcane" ? normalizeArcaneEffectTuning(effect.arcaneTuning) : undefined,
        radiantTuning: effectType === "radiant" ? normalizeRadiantEffectTuning(effect.radiantTuning) : undefined,
        fieldTuning: effectType === "field" ? normalizeForceFieldEffectTuning(effect.fieldTuning) : undefined,
        shockwaveTuning: effectType === "shockwave" ? normalizeShockwaveEffectTuning(effect.shockwaveTuning) : undefined,
        smokeTuning: effectType === "smoke" ? normalizeSmokeEffectTuning(effect.smokeTuning) : undefined,
        fogTuning: effectType === "fog" ? normalizeFogEffectTuning(effect.fogTuning) : undefined,
        visibleInGm: effect.visibleInGm ?? true,
        visibleInPlayer: effect.visibleInPlayer ?? true
      };
    });
}

function normalizeWaterEffectTuning(tuning?: WaterEffectTuningSettings): WaterEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.opacity),
    bandScale: clampNumber(tuning?.bandScale, 0.5, 20, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.bandScale),
    bandWidth: clampNumber(tuning?.bandWidth, 0.01, 0.49, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.bandWidth),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.directionDegrees),
    distortion: clampNumber(tuning?.distortion, 0, 2, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.distortion),
    verticalDistortion: clampNumber(tuning?.verticalDistortion, 0, 2, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.verticalDistortion),
    distortionVariation: clampNumber(tuning?.distortionVariation, 0, 2, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.distortionVariation),
    bandBreakup: clampNumber(tuning?.bandBreakup, 0, 1, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.bandBreakup),
    bandVariation: clampNumber(tuning?.bandVariation, 0, 4, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.bandVariation),
    bandOverlap: clampNumber(tuning?.bandOverlap, 0, 1, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.bandOverlap),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.baseAlpha),
    highlightAlpha: clampNumber(tuning?.highlightAlpha, 0, 1, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.highlightAlpha),
    deepColor: normalizeColorValue(tuning?.deepColor, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.deepColor),
    waterColor: normalizeColorValue(tuning?.waterColor, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.waterColor),
    highlightColor: normalizeColorValue(tuning?.highlightColor, DEFAULT_WATER_EFFECT_TUNING_SETTINGS.highlightColor)
  };
}

function normalizeLavaEffectTuning(tuning?: LavaEffectTuningSettings): LavaEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.opacity),
    flowScale: clampNumber(tuning?.flowScale, 0.5, 20, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.flowScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.directionDegrees),
    distortion: clampNumber(tuning?.distortion, 0, 2, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.distortion),
    crust: clampNumber(tuning?.crust, 0, 1, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.crust),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.glow),
    ember: clampNumber(tuning?.ember, 0, 1, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.ember),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.baseAlpha),
    darkColor: normalizeColorValue(tuning?.darkColor, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.darkColor),
    lavaColor: normalizeColorValue(tuning?.lavaColor, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.lavaColor),
    hotColor: normalizeColorValue(tuning?.hotColor, DEFAULT_LAVA_EFFECT_TUNING_SETTINGS.hotColor)
  };
}

function normalizeFireEffectTuning(tuning?: FireEffectTuningSettings): FireEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.opacity),
    flameScale: clampNumber(tuning?.flameScale, 0.5, 20, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.flameScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.directionDegrees),
    turbulence: clampNumber(tuning?.turbulence, 0, 2, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.turbulence),
    tongues: clampNumber(tuning?.tongues, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.tongues),
    tongueVariation: clampNumber(tuning?.tongueVariation, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.tongueVariation),
    breakup: clampNumber(tuning?.breakup, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.breakup),
    flameStretch: clampNumber(tuning?.flameStretch, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.flameStretch),
    flicker: clampNumber(tuning?.flicker, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.flicker),
    ember: clampNumber(tuning?.ember, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.ember),
    heat: clampNumber(tuning?.heat, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.heat),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.baseAlpha),
    emberColor: normalizeColorValue(tuning?.emberColor, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.emberColor),
    flameColor: normalizeColorValue(tuning?.flameColor, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.flameColor),
    hotColor: normalizeColorValue(tuning?.hotColor, DEFAULT_FIRE_EFFECT_TUNING_SETTINGS.hotColor)
  };
}

function normalizeLightningEffectTuning(tuning?: LightningEffectTuningSettings): LightningEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.opacity),
    arcScale: clampNumber(tuning?.arcScale, 0.5, 20, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.arcScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.directionDegrees),
    boltDensity: clampNumber(tuning?.boltDensity, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.boltDensity),
    branchiness: clampNumber(tuning?.branchiness, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.branchiness),
    jitter: clampNumber(tuning?.jitter, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.jitter),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.glow),
    strikeWidth: clampNumber(tuning?.strikeWidth, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.strikeWidth),
    segmentBreaks: clampNumber(tuning?.segmentBreaks, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.segmentBreaks),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.baseAlpha),
    backgroundColor: normalizeColorValue(tuning?.backgroundColor, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.backgroundColor),
    arcColor: normalizeColorValue(tuning?.arcColor, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.arcColor),
    coreColor: normalizeColorValue(tuning?.coreColor, DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS.coreColor)
  };
}

function normalizeArcaneEffectTuning(tuning?: ArcaneEffectTuningSettings): ArcaneEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.opacity),
    glyphScale: clampNumber(tuning?.glyphScale, 0.5, 20, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.glyphScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.speed),
    rotationSpeed: clampNumber(tuning?.rotationSpeed, -2, 2, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.rotationSpeed),
    glyphDensity: clampNumber(tuning?.glyphDensity, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.glyphDensity),
    ringDensity: clampNumber(tuning?.ringDensity, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.ringDensity),
    circleScale: clampNumber(tuning?.circleScale, 1, 20, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.circleScale),
    spokeAmount: clampNumber(tuning?.spokeAmount, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.spokeAmount),
    pulse: clampNumber(tuning?.pulse, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.pulse),
    drift: clampNumber(tuning?.drift, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.drift),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.glow),
    lineWidth: clampNumber(tuning?.lineWidth, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.lineWidth),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.baseAlpha),
    backgroundColor: normalizeColorValue(tuning?.backgroundColor, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.backgroundColor),
    glyphColor: normalizeColorValue(tuning?.glyphColor, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.glyphColor),
    glowColor: normalizeColorValue(tuning?.glowColor, DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS.glowColor)
  };
}

function normalizeRadiantEffectTuning(tuning?: RadiantEffectTuningSettings): RadiantEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.opacity),
    rayScale: clampNumber(tuning?.rayScale, 0.5, 20, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.rayScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.directionDegrees),
    rayDensity: clampNumber(tuning?.rayDensity, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.rayDensity),
    rayBreakup: clampNumber(tuning?.rayBreakup, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.rayBreakup),
    raySpread: clampNumber(tuning?.raySpread, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.raySpread),
    rayDistance: clampNumber(tuning?.rayDistance, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.rayDistance),
    moteDensity: clampNumber(tuning?.moteDensity, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.moteDensity),
    moteSize: clampNumber(tuning?.moteSize, 0, 5, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.moteSize),
    shimmer: clampNumber(tuning?.shimmer, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.shimmer),
    bloom: clampNumber(tuning?.bloom, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.bloom),
    streakWidth: clampNumber(tuning?.streakWidth, 0, 5, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.streakWidth),
    pulse: clampNumber(tuning?.pulse, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.pulse),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.baseAlpha),
    backgroundColor: normalizeColorValue(tuning?.backgroundColor, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.backgroundColor),
    rayColor: normalizeColorValue(tuning?.rayColor, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.rayColor),
    coreColor: normalizeColorValue(tuning?.coreColor, DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS.coreColor)
  };
}

function normalizeForceFieldEffectTuning(tuning?: ForceFieldEffectTuningSettings): ForceFieldEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.opacity),
    fieldScale: clampNumber(tuning?.fieldScale, 0.5, 20, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.fieldScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.directionDegrees),
    gridDensity: clampNumber(tuning?.gridDensity, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.gridDensity),
    gridWarp: clampNumber(tuning?.gridWarp, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.gridWarp),
    rippleStrength: clampNumber(tuning?.rippleStrength, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.rippleStrength),
    rippleFrequency: clampNumber(tuning?.rippleFrequency, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.rippleFrequency),
    edgeStrength: clampNumber(tuning?.edgeStrength, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.edgeStrength),
    pulse: clampNumber(tuning?.pulse, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.pulse),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.glow),
    refraction: clampNumber(tuning?.refraction, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.refraction),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.baseAlpha),
    backgroundColor: normalizeColorValue(tuning?.backgroundColor, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.backgroundColor),
    gridColor: normalizeColorValue(tuning?.gridColor, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.gridColor),
    edgeColor: normalizeColorValue(tuning?.edgeColor, DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS.edgeColor)
  };
}

function normalizeShockwaveEffectTuning(tuning?: ShockwaveEffectTuningSettings): ShockwaveEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.opacity),
    ringScale: clampNumber(tuning?.ringScale, 0.5, 20, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.ringScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.directionDegrees),
    ringCount: clampNumber(tuning?.ringCount, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.ringCount),
    ringWidth: clampNumber(tuning?.ringWidth, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.ringWidth),
    ringSharpness: clampNumber(tuning?.ringSharpness, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.ringSharpness),
    distortion: clampNumber(tuning?.distortion, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.distortion),
    turbulence: clampNumber(tuning?.turbulence, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.turbulence),
    centerStrength: clampNumber(tuning?.centerStrength, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.centerStrength),
    fade: clampNumber(tuning?.fade, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.fade),
    pulse: clampNumber(tuning?.pulse, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.pulse),
    glow: clampNumber(tuning?.glow, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.glow),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.baseAlpha),
    backgroundColor: normalizeColorValue(tuning?.backgroundColor, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.backgroundColor),
    ringColor: normalizeColorValue(tuning?.ringColor, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.ringColor),
    coreColor: normalizeColorValue(tuning?.coreColor, DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS.coreColor)
  };
}

function normalizeSmokeEffectTuning(tuning?: SmokeEffectTuningSettings): SmokeEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.opacity),
    cloudScale: clampNumber(tuning?.cloudScale, 0.5, 20, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.cloudScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.directionDegrees),
    turbulence: clampNumber(tuning?.turbulence, 0, 2, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.turbulence),
    softness: clampNumber(tuning?.softness, 0, 1, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.softness),
    density: clampNumber(tuning?.density, 0, 1, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.density),
    lift: clampNumber(tuning?.lift, 0, 1, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.lift),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.baseAlpha),
    shadowColor: normalizeColorValue(tuning?.shadowColor, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.shadowColor),
    smokeColor: normalizeColorValue(tuning?.smokeColor, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.smokeColor),
    highlightColor: normalizeColorValue(tuning?.highlightColor, DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS.highlightColor)
  };
}

function normalizeFogEffectTuning(tuning?: FogEffectTuningSettings): FogEffectTuningSettings {
  return {
    opacity: clampNumber(tuning?.opacity, 0, 1, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.opacity),
    cloudScale: clampNumber(tuning?.cloudScale, 0.5, 20, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.cloudScale),
    speed: clampNumber(tuning?.speed, 0, 2, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.speed),
    directionDegrees: clampNumber(tuning?.directionDegrees, 0, 360, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.directionDegrees),
    turbulence: clampNumber(tuning?.turbulence, 0, 2, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.turbulence),
    softness: clampNumber(tuning?.softness, 0, 1, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.softness),
    density: clampNumber(tuning?.density, 0, 1, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.density),
    lift: clampNumber(tuning?.lift, 0, 1, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.lift),
    panFollow: 1,
    zoomScale: clampNumber(tuning?.zoomScale, -3, 3, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.zoomScale),
    baseAlpha: clampNumber(tuning?.baseAlpha, 0, 1, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.baseAlpha),
    shadowColor: normalizeColorValue(tuning?.shadowColor, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.shadowColor),
    smokeColor: normalizeColorValue(tuning?.smokeColor, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.smokeColor),
    highlightColor: normalizeColorValue(tuning?.highlightColor, DEFAULT_FOG_EFFECT_TUNING_SETTINGS.highlightColor)
  };
}

function normalizeColorValue(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function formatEnvironmentEffectName(effect: EnvironmentEffectType): string {
  return effect === "water" ? "Water" : effect === "lava" ? "Lava" : effect === "fire" ? "Fire" : effect === "electric" ? "Electric" : effect === "arcane" ? "Arcane" : effect === "radiant" ? "Radiant" : effect === "field" ? "Force Field" : effect === "shockwave" ? "Shockwave" : effect === "fog" ? "Mist" : "Smoke";
}

function normalizeWeatherEffectSettings(settings?: WeatherSettings["effectSettings"]): WeatherSettings["effectSettings"] {
  const normalized: WeatherSettings["effectSettings"] = {};
  if (!isRecord(settings)) {
    return normalized;
  }
  for (const effect of WEATHER_EFFECTS) {
    if (effect === "none") {
      continue;
    }
    const setting = settings[effect];
    if (!isRecord(setting)) {
      continue;
    }
    const defaults = DEFAULT_WEATHER_EFFECT_SETTINGS[effect];
    normalized[effect] = normalizeWeatherTuning(setting, defaults);
  }
  return normalized;
}

function normalizeWeatherTuning(setting: Record<string, unknown>, defaults: WeatherTuningSettings): WeatherTuningSettings {
  return {
    intensity: clampNumber(setting.intensity, 0, 1.5, defaults.intensity),
    opacity: clampNumber(setting.opacity, 0, 1.25, defaults.opacity),
    color: normalizeColor(setting.color, defaults.color),
    speed: clampNumber(setting.speed, 0.05, 3, defaults.speed),
    directionDegrees: clampNumber(setting.directionDegrees, 0, 360, defaults.directionDegrees),
    driftStrength: clampNumber(setting.driftStrength, 0, 1, defaults.driftStrength),
    edgeBias: clampNumber(setting.edgeBias, 0, 1, defaults.edgeBias),
    quietAreaSize: clampNumber(setting.quietAreaSize, 0.35, 0.9, defaults.quietAreaSize),
    centerStrayDrops: clampNumber(setting.centerStrayDrops, 0, 2, defaults.centerStrayDrops),
    streakLength: clampNumber(setting.streakLength, 0.4, 2, defaults.streakLength),
    lightningFrequency: clampNumber(setting.lightningFrequency, 0, 1, defaults.lightningFrequency),
    flashStrength: clampNumber(setting.flashStrength, 0, 1, defaults.flashStrength),
    quality: normalizeWeatherQuality(setting.quality, defaults.quality)
  };
}

function normalizeWeatherQuality(value: unknown, fallback: WeatherQualityLevel): WeatherQualityLevel {
  return value === "low" || value === "balanced" || value === "high" ? value : fallback;
}

function isRainWeatherEffect(effect: WeatherEffectType): effect is RainWeatherEffectType {
  return effect === "light-rain" || effect === "rain" || effect === "heavy-rain" || effect === "rain-storm";
}

function isFogWeatherEffect(effect: WeatherEffectType): effect is FogWeatherEffectType {
  return effect === "light-fog" || effect === "fog" || effect === "heavy-fog";
}

function isSnowWeatherEffect(effect: WeatherEffectType): effect is SnowWeatherEffectType {
  return effect === "light-snow" || effect === "snow" || effect === "blizzard";
}

function isSandWeatherEffect(effect: WeatherEffectType): effect is SandWeatherEffectType {
  return effect === "light-sand" || effect === "sand" || effect === "sandstorm";
}

function hasEnabledWeatherEffect(effects: WeatherEffectSlots): boolean {
  return effects.rain.enabled || effects.fog.enabled || effects.snow.enabled || effects.sand.enabled;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeFog(fog?: Partial<FogSettings>): FogSettings {
  const legacyOpacity = fog?.opacity ?? DEFAULT_FOG.opacity;
  const usedShapeIds = new Set<string>();
  return {
    ...DEFAULT_FOG,
    ...(fog ?? {}),
    opacity: legacyOpacity,
    gmOpacity: fog?.gmOpacity ?? Math.min(legacyOpacity, 0.5),
    playerOpacity: fog?.playerOpacity ?? legacyOpacity,
    newShapesVisibleInPlayer: fog?.newShapesVisibleInPlayer ?? DEFAULT_FOG.newShapesVisibleInPlayer,
    shapes: (fog?.shapes ?? []).map((shape, index) => {
      const legacyVisible = shape.visible ?? true;
      const shapeId = getUniqueFogShapeId(shape.id, index, usedShapeIds);
      return {
        ...shape,
        id: shapeId,
        name: typeof shape.name === "string" && shape.name.trim() ? shape.name : formatDefaultFogShapeName(shape.operation, shape.kind, index),
        visible: legacyVisible,
        visibleInGm: shape.visibleInGm ?? legacyVisible,
        visibleInPlayer: shape.visibleInPlayer ?? legacyVisible
      };
    })
  };
}

function getUniqueFogShapeId(id: unknown, index: number, usedIds: Set<string>): string {
  // Older/manual scene files may contain missing or duplicated fog ids; UI reorder/delete needs stable unique ids.
  const rawId = typeof id === "string" ? id.trim() : "";
  const baseId = rawId || `fog-shape-${index + 1}`;
  let candidateId = baseId;
  let suffix = 2;
  while (usedIds.has(candidateId)) {
    candidateId = `${baseId}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(candidateId);
  return candidateId;
}

export function formatDefaultFogShapeName(operation: FogShape["operation"], kind: FogShape["kind"], index: number): string {
  const operationLabel = operation === "reveal" ? "Reveal" : "Hide";
  const kindLabel = kind[0].toUpperCase() + kind.slice(1);
  return `${operationLabel} ${kindLabel} ${index + 1}`;
}

function normalizeDrawings(drawings?: DrawingElement[]): DrawingElement[] {
  if (!Array.isArray(drawings)) {
    return [];
  }
  const usedIds = new Set<string>();
  return drawings.filter(isRecord).map((drawing, index) => {
    const kind = normalizeDrawingKind(drawing.kind);
    const isTemplateDrawing = drawing.measurementLabelVisible === true;
    return {
      id: getUniqueDrawingId(drawing.id, index, usedIds),
      name: typeof drawing.name === "string" && drawing.name.trim() ? drawing.name.trim() : formatDefaultDrawingName(kind, index),
      kind,
      points: Array.isArray(drawing.points) ? drawing.points.filter(isPoint) : [],
      text: typeof drawing.text === "string" ? drawing.text : undefined,
      color: normalizeColor(drawing.color, "#f6d365"),
      opacity: clampNumber(drawing.opacity, 0, 1, 1),
      strokeColor: normalizeColor(drawing.strokeColor ?? drawing.color, "#f6d365"),
      strokeOpacity: clampNumber(drawing.strokeOpacity ?? drawing.opacity, 0, 1, 1),
      strokeWidth: clampNumber(drawing.strokeWidth, 1, 400, 4),
      fill: typeof drawing.fill === "string" ? normalizeColor(drawing.fill, "transparent") : undefined,
      fillColor: normalizeColor(drawing.fillColor ?? drawing.fill ?? drawing.color, "#f6d365"),
      fillOpacity: clampNumber(drawing.fillOpacity ?? (typeof drawing.fill === "string" ? drawing.opacity : 0), 0, 1, 0),
      strokeStyle: normalizeDrawingStrokeStyle(drawing.strokeStyle),
      templateEffect: isTemplateDrawing ? normalizeDrawingTemplateEffect(drawing.templateEffect) : "plain",
      templateWidth: isTemplateDrawing ? clampNumber(drawing.templateWidth, 0, 100, 5) : 5,
      templateFootprintVisible: isTemplateDrawing ? drawing.templateFootprintVisible === true : undefined,
      measurementLabelVisible: typeof drawing.measurementLabelVisible === "boolean" ? drawing.measurementLabelVisible : undefined,
      visibleInGm: typeof drawing.visibleInGm === "boolean" ? drawing.visibleInGm : true,
      visibleInPlayer: typeof drawing.visibleInPlayer === "boolean" ? drawing.visibleInPlayer : true
    };
  });
}

function normalizeDrawingStrokeStyle(value: unknown): DrawingStrokeStyle {
  return value === "solid" || value === "dashed" || value === "dotted" || value === "dash-dot" || value === "sketch" ? value : "solid";
}

function normalizeDrawingTemplateEffect(value: unknown): DrawingTemplateEffect {
  return value === "acid" ||
    value === "arcane" ||
    value === "cold" ||
    value === "darkness" ||
    value === "fire" ||
    value === "fog" ||
    value === "lightning" ||
    value === "nature" ||
    value === "poison" ||
    value === "psychic" ||
    value === "radiant" ||
    value === "storm" ||
    value === "thunder" ||
    value === "water" ||
    value === "web"
    ? value
    : "plain";
}

function getUniqueDrawingId(id: unknown, index: number, usedIds: Set<string>): string {
  const rawId = typeof id === "string" ? id.trim() : "";
  const baseId = rawId || `drawing-${index + 1}`;
  let candidateId = baseId;
  let suffix = 2;
  while (usedIds.has(candidateId)) {
    candidateId = `${baseId}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(candidateId);
  return candidateId;
}

function normalizeDrawingKind(kind: unknown): DrawingKind {
  return kind === "freehand" ||
    kind === "line" ||
    kind === "rectangle" ||
    kind === "circle" ||
    kind === "ellipse" ||
    kind === "triangle" ||
    kind === "polygon" ||
    kind === "cone" ||
    kind === "text" ||
    kind === "ping" ||
    kind === "laser"
    ? kind
    : "freehand";
}

export function formatDefaultDrawingName(kind: DrawingKind, index: number): string {
  if (kind === "freehand") {
    return `Brush ${index + 1}`;
  }
  const kindLabel = kind
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
  return `${kindLabel} ${index + 1}`;
}

function normalizeTokenMovementPath(path?: TokenMovementPath): TokenMovementPath | undefined {
  if (!path || typeof path.tokenId !== "string" || !Array.isArray(path.points)) {
    return undefined;
  }
  const points = path.points.filter(isPoint);
  return points.length > 0 ? { tokenId: path.tokenId, points } : undefined;
}

function normalizeTokens(tokens?: Token[]): Token[] {
  return (tokens ?? []).map((token, index) => ({
    ...token,
    sizePreset: token.sizePreset ?? DEFAULT_TOKEN_SIZE_PRESET,
    mask: token.mask ?? DEFAULT_TOKEN_MASK,
    borderColor: normalizeColor(token.borderColor, DEFAULT_TOKEN_BORDER_COLOR),
    borderStyle: normalizeTokenBorderStyle(token.borderStyle),
    borderWidth: Number.isFinite(token.borderWidth) ? Math.min(64, Math.max(1, token.borderWidth ?? DEFAULT_TOKEN_BORDER_WIDTH)) : DEFAULT_TOKEN_BORDER_WIDTH,
    borderWidthPreset: token.borderWidthPreset ?? DEFAULT_TOKEN_BORDER_WIDTH_PRESET,
    glowColor: normalizeColor(token.glowColor, normalizeColor(token.borderColor, DEFAULT_TOKEN_GLOW_COLOR)),
    footprintVisible: token.footprintVisible ?? DEFAULT_TOKEN_FOOTPRINT_VISIBLE,
    // Legacy token arrays had no explicit order; keep their visible order stable by assigning descending defaults.
    order: token.order ?? (tokens?.length ?? 0) - index,
    hidden: token.hidden ?? false,
    visibleInGm: token.visibleInGm ?? !(token.hidden ?? false),
    visibleInPlayer: token.hidden ? false : (token.visibleInPlayer ?? false)
  }));
}

function normalizeTurnOrder(turnOrder?: Partial<TurnOrderSettings>): TurnOrderSettings {
  const entryIds = new Set<string>();
  const entries = (turnOrder?.entries ?? []).map((entry, index) => {
    const id = getUniqueTurnOrderId(entry.id, index, entryIds);
    return {
      ...entry,
      id,
      name: typeof entry.name === "string" && entry.name.trim() ? entry.name : `Entry ${index + 1}`,
      initiative: clampNumber(entry.initiative, -99, 99, 0),
      visibleInPlayer: entry.visibleInPlayer ?? true
    };
  });
  const entryIdSet = new Set(entries.map((entry) => entry.id));
  const seats = (turnOrder?.seats ?? []).map((seat, index) => ({
    ...seat,
    id: typeof seat.id === "string" && seat.id.trim() ? seat.id : `seat-${index + 1}`,
    name: typeof seat.name === "string" && seat.name.trim() ? seat.name : `Seat ${index + 1}`,
    edge: seat.edge === "top" || seat.edge === "right" || seat.edge === "bottom" || seat.edge === "left" ? seat.edge : "bottom",
    position: clampNumber(seat.position, 0, 1, 0.5),
    color: normalizeColor(seat.color, DEFAULT_TOKEN_BORDER_COLOR),
    visibleInPlayer: seat.visibleInPlayer ?? true
  }));
  const currentEntryId = turnOrder?.currentEntryId && entryIdSet.has(turnOrder.currentEntryId) ? turnOrder.currentEntryId : entries[0]?.id;
  return {
    ...DEFAULT_TURN_ORDER,
    ...(turnOrder ?? {}),
    active: turnOrder?.active ?? false,
    currentEntryId,
    playerViewVisible: turnOrder?.playerViewVisible ?? false,
    playerViewEdge:
      turnOrder?.playerViewEdge === "top" || turnOrder?.playerViewEdge === "right" || turnOrder?.playerViewEdge === "bottom" || turnOrder?.playerViewEdge === "left"
        ? turnOrder.playerViewEdge
        : DEFAULT_TURN_ORDER.playerViewEdge,
    playerViewFacing: turnOrder?.playerViewFacing === "outward" ? "outward" : DEFAULT_TURN_ORDER.playerViewFacing,
    playerViewSize:
      turnOrder?.playerViewSize === "xs" || turnOrder?.playerViewSize === "sm" || turnOrder?.playerViewSize === "lg" || turnOrder?.playerViewSize === "xl"
        ? turnOrder.playerViewSize
        : DEFAULT_TURN_ORDER.playerViewSize,
    playerTurnStatusSize:
      turnOrder?.playerTurnStatusSize === "xs" || turnOrder?.playerTurnStatusSize === "sm" || turnOrder?.playerTurnStatusSize === "lg" || turnOrder?.playerTurnStatusSize === "xl"
        ? turnOrder.playerTurnStatusSize
        : DEFAULT_TURN_ORDER.playerTurnStatusSize,
    initiativeDiceCount: clampNumber(turnOrder?.initiativeDiceCount, 1, 20, DEFAULT_TURN_ORDER.initiativeDiceCount),
    initiativeDiceSides: clampNumber(turnOrder?.initiativeDiceSides, 2, 100, DEFAULT_TURN_ORDER.initiativeDiceSides),
    entries,
    seats
  };
}

function getUniqueTurnOrderId(id: unknown, index: number, usedIds: Set<string>): string {
  const rawId = typeof id === "string" ? id.trim() : "";
  const baseId = rawId || `turn-entry-${index + 1}`;
  let candidateId = baseId;
  let suffix = 2;
  while (usedIds.has(candidateId)) {
    candidateId = `${baseId}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(candidateId);
  return candidateId;
}

function normalizeTokenBorderStyle(style: unknown): TokenBorderStyle {
  return style === "solid" || style === "dashed" || style === "dotted" || style === "double-line" || style === "embossed" || style === "inner-shadow" || style === "glow"
    ? style
    : DEFAULT_TOKEN_BORDER_STYLE;
}

function normalizeDiceSettings(settings?: Partial<DiceSettings>): DiceSettings {
  return {
    ...DEFAULT_DICE_SETTINGS,
    ...(settings ?? {}),
    gmDisplayMode: isDiceDisplayMode(settings?.gmDisplayMode) ? settings.gmDisplayMode : DEFAULT_DICE_SETTINGS.gmDisplayMode,
    playerDisplayMode: isDiceDisplayMode(settings?.playerDisplayMode) ? settings.playerDisplayMode : DEFAULT_DICE_SETTINGS.playerDisplayMode,
    sceneRollEnabled: typeof settings?.sceneRollEnabled === "boolean" ? settings.sceneRollEnabled : DEFAULT_DICE_SETTINGS.sceneRollEnabled,
    sceneRollTarget: isDiceSceneRollTarget(settings?.sceneRollTarget) ? settings.sceneRollTarget : DEFAULT_DICE_SETTINGS.sceneRollTarget,
    gmSceneSize: isDiceSceneSize(settings?.gmSceneSize) ? settings.gmSceneSize : DEFAULT_DICE_SETTINGS.gmSceneSize,
    playerSceneSize: isDiceSceneSize(settings?.playerSceneSize) ? settings.playerSceneSize : DEFAULT_DICE_SETTINGS.playerSceneSize,
    gmPanelEdge: isDicePanelEdge(settings?.gmPanelEdge) ? settings.gmPanelEdge : DEFAULT_DICE_SETTINGS.gmPanelEdge,
    playerPanelEdge: isDicePanelEdge(settings?.playerPanelEdge) ? settings.playerPanelEdge : DEFAULT_DICE_SETTINGS.playerPanelEdge,
    gmPanelFacing: isDicePanelFacing(settings?.gmPanelFacing) ? settings.gmPanelFacing : DEFAULT_DICE_SETTINGS.gmPanelFacing,
    playerPanelFacing: isDicePanelFacing(settings?.playerPanelFacing) ? settings.playerPanelFacing : DEFAULT_DICE_SETTINGS.playerPanelFacing,
    gmPanelPosition: clampNumber(settings?.gmPanelPosition, 0, 1, DEFAULT_DICE_SETTINGS.gmPanelPosition),
    playerPanelPosition: clampNumber(settings?.playerPanelPosition, 0, 1, DEFAULT_DICE_SETTINGS.playerPanelPosition),
    gmPanelAdvanced: typeof settings?.gmPanelAdvanced === "boolean" ? settings.gmPanelAdvanced : DEFAULT_DICE_SETTINGS.gmPanelAdvanced,
    playerPanelAdvanced: typeof settings?.playerPanelAdvanced === "boolean" ? settings.playerPanelAdvanced : DEFAULT_DICE_SETTINGS.playerPanelAdvanced
  };
}

export function normalizeCampaign(campaign: Campaign): Campaign {
  const sceneFolders = (campaign.sceneFolders ?? []).map((folder) => ({
    ...folder,
    color: normalizeColor(folder.color)
  }));
  const folderIds = new Set(sceneFolders.map((folder) => folder.id));
  // Drop collapsed folder ids that no longer exist so deleted folders do not linger in UI state.
  const collapsedFolderIds = (campaign.sceneLibrary?.collapsedFolderIds ?? []).filter((folderId) => folderIds.has(folderId));

  return {
    ...campaign,
    defaultGrid: { ...DEFAULT_GRID, ...(campaign.defaultGrid ?? {}), measurement: { ...DEFAULT_MEASUREMENT, ...(campaign.defaultGrid?.measurement ?? {}) } },
    defaultMeasurement: { ...DEFAULT_MEASUREMENT, ...(campaign.defaultMeasurement ?? {}) },
    defaultCalibration: { ...DEFAULT_CALIBRATION, ...(campaign.defaultCalibration ?? {}) },
    playerDisplay: { ...DEFAULT_CALIBRATION, ...(campaign.playerDisplay ?? campaign.defaultCalibration ?? {}) },
    diceSettings: normalizeDiceSettings(campaign.diceSettings),
    sceneLibrary: { collapsedFolderIds },
    sceneFolders,
    scenes: (campaign.scenes ?? []).map((scene) => {
      const { folderId, ...sceneWithoutFolder } = scene;
      return {
        ...sceneWithoutFolder,
        ...(folderId && folderIds.has(folderId) ? { folderId } : {}),
        weather: scene.weather ? normalizeWeather(scene.weather) : undefined
      };
    }),
    players: (campaign.players ?? []).map((player, index) => ({
      ...player,
      id: typeof player.id === "string" && player.id.trim() ? player.id : `player-${index + 1}`,
      name: typeof player.name === "string" && player.name.trim() ? player.name : `Player ${index + 1}`,
      color: normalizeColor(player.color, DEFAULT_TOKEN_BORDER_COLOR),
      indicatorTheme: normalizePlayerIndicatorTheme(player.indicatorTheme),
      defaultSeatEdge:
        player.defaultSeatEdge === "top" || player.defaultSeatEdge === "right" || player.defaultSeatEdge === "bottom" || player.defaultSeatEdge === "left" ? player.defaultSeatEdge : "bottom",
      defaultSeatPosition: clampNumber(player.defaultSeatPosition, 0, 1, 0.5),
      visibleInPlayer: player.visibleInPlayer ?? true
    })),
    assets: (campaign.assets ?? []).map(normalizeAsset)
  };
}

function normalizeAsset(asset: Asset): Asset {
  if (asset.kind !== "token" || !asset.tokenDefaults) {
    return asset;
  }
  return {
    ...asset,
    tokenDefaults: normalizeTokenPresentationDefaults(asset.tokenDefaults)
  };
}

function normalizeTokenPresentationDefaults(defaults: TokenPresentationDefaults): TokenPresentationDefaults {
  const sizePreset = defaults.sizePreset ?? DEFAULT_TOKEN_SIZE_PRESET;
  return {
    sizePreset,
    customSizeCells:
      defaults.customSizeCells && Number.isFinite(defaults.customSizeCells.width) && Number.isFinite(defaults.customSizeCells.height)
        ? {
            width: Math.min(10, Math.max(0.25, defaults.customSizeCells.width)),
            height: Math.min(10, Math.max(0.25, defaults.customSizeCells.height))
          }
        : undefined,
    mask: defaults.mask === "none" || defaults.mask === "square" || defaults.mask === "circle" ? defaults.mask : DEFAULT_TOKEN_MASK,
    borderColor: normalizeColor(defaults.borderColor, DEFAULT_TOKEN_BORDER_COLOR),
    borderStyle: normalizeTokenBorderStyle(defaults.borderStyle),
    borderWidth: Number.isFinite(defaults.borderWidth) ? Math.min(64, Math.max(1, defaults.borderWidth ?? DEFAULT_TOKEN_BORDER_WIDTH)) : DEFAULT_TOKEN_BORDER_WIDTH,
    borderWidthPreset: defaults.borderWidthPreset ?? DEFAULT_TOKEN_BORDER_WIDTH_PRESET,
    glowColor: normalizeColor(defaults.glowColor, DEFAULT_TOKEN_GLOW_COLOR),
    footprintVisible: defaults.footprintVisible ?? DEFAULT_TOKEN_FOOTPRINT_VISIBLE
  };
}

function normalizeColor(color: unknown, fallback = DEFAULT_SCENE_FOLDER_COLOR): string {
  return typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

export function projectSceneForPlayer(campaign: Campaign, scene: Scene, options: PlayerSceneProjectionOptions = {}): PlayerSceneProjection {
  const normalizedCampaign = normalizeCampaign(campaign);
  const normalizedScene = normalizeScene(scene);
  const playerLayerIds = new Set(normalizedScene.layers.filter((layer) => layer.visibleInPlayer).map((layer) => layer.id));
  const usedAssetIds = new Set<string>();
  if (normalizedScene.mapAssetId && playerLayerIds.has("map")) {
    usedAssetIds.add(normalizedScene.mapAssetId);
  }
  for (const token of normalizedScene.tokens) {
    if (token.visibleInPlayer && token.assetId) {
      usedAssetIds.add(token.assetId);
    }
  }
  for (const overlay of normalizedScene.overlays) {
    if (overlay.visibleInPlayer && playerLayerIds.has(overlay.layerId)) {
      usedAssetIds.add(overlay.assetId);
    }
  }
  for (const entry of normalizedScene.turnOrder.entries) {
    if (entry.visibleInPlayer && entry.assetId) {
      usedAssetIds.add(entry.assetId);
    }
  }
  for (const player of normalizedCampaign.players) {
    if (player.assetId) {
      usedAssetIds.add(player.assetId);
    }
  }

  return {
    campaignName: normalizedCampaign.name,
    playerDisplay: normalizedCampaign.playerDisplay,
    players: normalizedCampaign.players,
    showPlayerSeatIndicators: options.showPlayerSeatIndicators ?? false,
    scene: {
      ...normalizedScene,
      fog: {
        ...normalizedScene.fog,
        shapes: normalizedScene.fog.shapes.filter((shape) => shape.visibleInPlayer ?? shape.visible ?? true)
      },
      // Projection is the Player View trust boundary: strip GM-only layers/content before sending across IPC.
      layers: normalizedScene.layers.filter((layer) => layer.visibleInPlayer),
      tokens: normalizedScene.tokens.filter((token) => token.visibleInPlayer),
      walls: [],
      drawings: normalizedScene.drawings.filter((drawing) => drawing.visibleInPlayer && playerLayerIds.has("drawing")),
      overlays: normalizedScene.overlays.filter((overlay) => overlay.visibleInPlayer && playerLayerIds.has(overlay.layerId)),
      notes: ""
    },
    assets: normalizedCampaign.assets.filter((asset) => usedAssetIds.has(asset.id))
  };
}
