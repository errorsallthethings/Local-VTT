import { formatEnvironmentEffectName, isEnvironmentEffectType } from "./environmentEffectCatalog.js";
import type { EnvironmentEffectType } from "./environmentEffectCatalog.js";
import {
  normalizeAcidEffectTuning,
  normalizeArcaneEffectTuning,
  normalizeChaosEffectTuning,
  normalizeColdEffectTuning,
  normalizeDarknessEffectTuning,
  normalizeDistortionEffectTuning,
  normalizeFireEffectTuning,
  normalizeFogEffectTuning,
  normalizeForceFieldEffectTuning,
  normalizeLavaEffectTuning,
  normalizeLightningEffectTuning,
  normalizeNatureEffectTuning,
  normalizePoisonEffectTuning,
  normalizeRadiantEffectTuning,
  normalizeShockwaveEffectTuning,
  normalizeSmokeEffectTuning,
  normalizeVoidEffectTuning,
  normalizeWaterEffectTuning
} from "./environmentEffectTuning.js";
import type {
  AcidEffectTuningSettings,
  ArcaneEffectTuningSettings,
  ChaosEffectTuningSettings,
  ColdEffectTuningSettings,
  DarknessEffectTuningSettings,
  DistortionEffectTuningSettings,
  FireEffectTuningSettings,
  FogEffectTuningSettings,
  ForceFieldEffectTuningSettings,
  LavaEffectTuningSettings,
  LightningEffectTuningSettings,
  NatureEffectTuningSettings,
  PoisonEffectTuningSettings,
  RadiantEffectTuningSettings,
  ShockwaveEffectTuningSettings,
  SmokeEffectTuningSettings,
  VoidEffectTuningSettings,
  WaterEffectTuningSettings
} from "./environmentEffectTuning.js";

export type { EnvironmentEffectType } from "./environmentEffectCatalog.js";

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

export const CURRENT_CAMPAIGN_SCHEMA_VERSION = 2;
export const CURRENT_SCENE_SCHEMA_VERSION = 2;
const LEGACY_SCHEMA_VERSION = 0;

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
  visibleInPlayer?: boolean;
}

export type {
  AcidEffectTuningSettings,
  ArcaneEffectTuningSettings,
  ChaosEffectTuningSettings,
  ColdEffectTuningSettings,
  DarknessEffectTuningSettings,
  DistortionEffectTuningSettings,
  FireEffectTuningSettings,
  FogEffectTuningSettings,
  ForceFieldEffectTuningSettings,
  LavaEffectTuningSettings,
  LightningEffectTuningSettings,
  NatureEffectTuningSettings,
  PoisonEffectTuningSettings,
  RadiantEffectTuningSettings,
  ShockwaveEffectTuningSettings,
  SmokeEffectTuningSettings,
  VoidEffectTuningSettings,
  WaterEffectTuningSettings
} from "./environmentEffectTuning.js";
export {
  DEFAULT_ACID_EFFECT_TUNING_SETTINGS,
  DEFAULT_ARCANE_EFFECT_TUNING_SETTINGS,
  DEFAULT_CHAOS_EFFECT_TUNING_SETTINGS,
  DEFAULT_COLD_EFFECT_TUNING_SETTINGS,
  DEFAULT_DARKNESS_EFFECT_TUNING_SETTINGS,
  DEFAULT_DISTORTION_EFFECT_TUNING_SETTINGS,
  DEFAULT_FIRE_EFFECT_TUNING_SETTINGS,
  DEFAULT_FOG_EFFECT_TUNING_SETTINGS,
  DEFAULT_FORCE_FIELD_EFFECT_TUNING_SETTINGS,
  DEFAULT_LAVA_EFFECT_TUNING_SETTINGS,
  DEFAULT_LIGHTNING_EFFECT_TUNING_SETTINGS,
  DEFAULT_NATURE_EFFECT_TUNING_SETTINGS,
  DEFAULT_POISON_EFFECT_TUNING_SETTINGS,
  DEFAULT_RADIANT_EFFECT_TUNING_SETTINGS,
  DEFAULT_SHOCKWAVE_EFFECT_TUNING_SETTINGS,
  DEFAULT_SMOKE_EFFECT_TUNING_SETTINGS,
  DEFAULT_VOID_EFFECT_TUNING_SETTINGS,
  DEFAULT_WATER_EFFECT_TUNING_SETTINGS
} from "./environmentEffectTuning.js";

export interface EnvironmentEffectMask {
  id: string;
  name?: string;
  kind: "rectangle" | "polygon" | "circle";
  effect: EnvironmentEffectType;
  points: Point[];
  radius?: number;
  feather?: number;
  acidTuning?: AcidEffectTuningSettings;
  coldTuning?: ColdEffectTuningSettings;
  darknessTuning?: DarknessEffectTuningSettings;
  poisonTuning?: PoisonEffectTuningSettings;
  waterTuning?: WaterEffectTuningSettings;
  lavaTuning?: LavaEffectTuningSettings;
  fireTuning?: FireEffectTuningSettings;
  lightningTuning?: LightningEffectTuningSettings;
  arcaneTuning?: ArcaneEffectTuningSettings;
  radiantTuning?: RadiantEffectTuningSettings;
  fieldTuning?: ForceFieldEffectTuningSettings;
  shockwaveTuning?: ShockwaveEffectTuningSettings;
  distortionTuning?: DistortionEffectTuningSettings;
  chaosTuning?: ChaosEffectTuningSettings;
  voidTuning?: VoidEffectTuningSettings;
  natureTuning?: NatureEffectTuningSettings;
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

export const TOKEN_CONDITION_IDS = [
  "blinded",
  "charmed",
  "deafened",
  "exhaustion",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious"
] as const;

export type TokenConditionId = (typeof TOKEN_CONDITION_IDS)[number];

export interface TokenCondition {
  id: TokenConditionId;
  visibleInPlayer: boolean;
}

export const TOKEN_CONDITION_LABELS: Record<TokenConditionId, string> = {
  blinded: "Blinded",
  charmed: "Charmed",
  deafened: "Deafened",
  exhaustion: "Exhaustion",
  frightened: "Frightened",
  grappled: "Grappled",
  incapacitated: "Incapacitated",
  invisible: "Invisible",
  paralyzed: "Paralyzed",
  petrified: "Petrified",
  poisoned: "Poisoned",
  prone: "Prone",
  restrained: "Restrained",
  stunned: "Stunned",
  unconscious: "Unconscious"
};

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
  conditions?: TokenCondition[];
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
  type?: "count-tracker" | "turn-group";
  countdown?: number;
  trackerColor?: string;
  playerId?: string;
  tokenId?: string;
  tokenIds?: string[];
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
export type TurnOrderAvatarMask = "circle" | "square" | "hex";

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
  round: number;
  playerViewVisible: boolean;
  playerViewEdge: "top" | "right" | "bottom" | "left";
  playerViewFacing: "inward" | "outward";
  playerViewSize: "xs" | "sm" | "md" | "lg" | "xl";
  playerViewTrackers: Record<TurnOrderTrackerPlacement, TurnOrderTrackerDisplaySettings>;
  playerViewMaxEntries: number;
  trackerAvatarMask: TurnOrderAvatarMask;
  playerTurnStatusSize: "xs" | "sm" | "md" | "lg" | "xl";
  playerTurnAvatarMask: TurnOrderAvatarMask;
  initiativeDiceCount: number;
  initiativeDiceSides: number;
  entries: TurnOrderEntry[];
  seats: PlayerSeatIndicator[];
}

export type TurnOrderTrackerPlacement = "top" | "right" | "bottom" | "left";
export type TurnOrderTrackerFacing = "inward" | "outward";
export type TurnOrderTrackerSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface TurnOrderTrackerDisplaySettings {
  enabled: boolean;
  facing: TurnOrderTrackerFacing;
  size: TurnOrderTrackerSize;
}

export interface Scene {
  schemaVersion: number;
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
  schemaVersion: number;
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

export type MetadataBackupKind = "campaign" | "scene";

export interface MetadataBackupRef {
  kind: MetadataBackupKind;
  fileName: string;
  sceneId?: string;
}

export interface MetadataBackupEntry extends MetadataBackupRef {
  id: string;
  timestamp: string | null;
  label: string;
  sizeBytes: number;
}

export interface MetadataBackupPreview extends MetadataBackupEntry {
  summary: string;
  json: string;
}

export interface MetadataBackupRestoreResult {
  campaignSummary: CampaignSummary;
  scene?: Scene;
  restored: MetadataBackupEntry;
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
  round: 1,
  playerViewVisible: false,
  playerViewEdge: "top",
  playerViewFacing: "inward",
  playerViewSize: "md",
  playerViewTrackers: {
    top: { enabled: true, facing: "inward", size: "md" },
    right: { enabled: false, facing: "inward", size: "md" },
    bottom: { enabled: false, facing: "inward", size: "md" },
    left: { enabled: false, facing: "inward", size: "md" }
  },
  playerViewMaxEntries: 9,
  trackerAvatarMask: "circle",
  playerTurnStatusSize: "md",
  playerTurnAvatarMask: "circle",
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
    schemaVersion: CURRENT_CAMPAIGN_SCHEMA_VERSION,
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
    schemaVersion: CURRENT_SCENE_SCHEMA_VERSION,
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
  if (!isSupportedSchemaVersion(value.schemaVersion, CURRENT_CAMPAIGN_SCHEMA_VERSION)) {
    throw new Error(`Unsupported campaign schema version. This app supports campaign schema version ${CURRENT_CAMPAIGN_SCHEMA_VERSION}.`);
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
  if (!isSupportedSchemaVersion(value.schemaVersion, CURRENT_SCENE_SCHEMA_VERSION)) {
    throw new Error(`Unsupported scene schema version. This app supports scene schema version ${CURRENT_SCENE_SCHEMA_VERSION}.`);
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
      isOptionalFiniteNumber(value.size) &&
      isOptionalString(value.color) &&
      isOptionalBoolean(value.visibleInPlayer)
    );
  }
  if (value.type === "laser") {
    return (
      Array.isArray(value.points) &&
      value.points.every((entry) => isRecord(entry) && isPoint(entry.point) && typeof entry.createdAt === "number") &&
      isOptionalFiniteNumber(value.thickness) &&
      isOptionalString(value.color) &&
      isOptionalBoolean(value.visibleInPlayer)
    );
  }
  if (value.type === "ruler") {
    return (
      Array.isArray(value.points) &&
      value.points.length >= 2 &&
      value.points.every(isPoint) &&
      typeof value.primary === "string" &&
      isOptionalString(value.secondary) &&
      isOptionalBoolean(value.visibleInPlayer) &&
      isOptionalFiniteNumber(value.expiresAt)
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
      isOptionalString(value.formula) &&
      isOptionalString(value.rollLabel) &&
      typeof value.seed === "number" &&
      Number.isFinite(value.seed) &&
      isOptionalString(value.sceneResolvedLabel) &&
      isOptionalString(value.sceneResolvedSummary) &&
      (value.sceneResolvedResult === undefined || (typeof value.sceneResolvedResult === "number" && Number.isInteger(value.sceneResolvedResult))) &&
      (value.gmDiceDisplay === undefined || isDiceDisplayMode(value.gmDiceDisplay)) &&
      (value.playerDiceDisplay === undefined || isDiceDisplayMode(value.playerDiceDisplay)) &&
      (value.gmDiceSceneSize === undefined || isDiceSceneSize(value.gmDiceSceneSize)) &&
      (value.playerDiceSceneSize === undefined || isDiceSceneSize(value.playerDiceSceneSize)) &&
      (value.gmDicePanelEdge === undefined || isDicePanelEdge(value.gmDicePanelEdge)) &&
      (value.playerDicePanelEdge === undefined || isDicePanelEdge(value.playerDicePanelEdge)) &&
      (value.gmDicePanelFacing === undefined || isDicePanelFacing(value.gmDicePanelFacing)) &&
      (value.playerDicePanelFacing === undefined || isDicePanelFacing(value.playerDicePanelFacing)) &&
      (value.gmDicePanelPosition === undefined || isUnitNumber(value.gmDicePanelPosition)) &&
      (value.playerDicePanelPosition === undefined || isUnitNumber(value.playerDicePanelPosition)) &&
      isOptionalBoolean(value.gmDicePanelAdvanced) &&
      isOptionalBoolean(value.playerDicePanelAdvanced) &&
      (value.gmPresentation === undefined || value.gmPresentation === "3d" || value.gmPresentation === "result") &&
      (value.playerPresentation === undefined || value.playerPresentation === "3d" || value.playerPresentation === "result") &&
      (value.presentation === undefined || value.presentation === "3d" || value.presentation === "result") &&
      (value.dice === undefined ||
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
              isOptionalBoolean(die.kept)
          )))
    );
  }
  if (value.type === "dice-clear") {
    return true;
  }
  return false;
}

function isOptionalBoolean(value: unknown): boolean {
  return value === undefined || typeof value === "boolean";
}

function isOptionalFiniteNumber(value: unknown): boolean {
  return value === undefined || (typeof value === "number" && Number.isFinite(value));
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
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

function migrateSceneToCurrent(scene: Scene): Scene {
  const schemaVersion = normalizeSchemaVersion(scene.schemaVersion, CURRENT_SCENE_SCHEMA_VERSION);
  if (schemaVersion === LEGACY_SCHEMA_VERSION) {
    return {
      ...scene,
      schemaVersion: CURRENT_SCENE_SCHEMA_VERSION
    };
  }
  return {
    ...scene,
    schemaVersion: CURRENT_SCENE_SCHEMA_VERSION
  };
}

function isUnitNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isPoint(value: unknown): value is Point {
  return isRecord(value) && typeof value.x === "number" && Number.isFinite(value.x) && typeof value.y === "number" && Number.isFinite(value.y);
}

export function normalizeScene(scene: Scene): Scene {
  const migratedScene = migrateSceneToCurrent(scene);
  const migratedLayers = (migratedScene.layers ?? []).map(normalizeLayerIdentity);
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
    ...migratedScene,
    schemaVersion: CURRENT_SCENE_SCHEMA_VERSION,
    grid: { ...DEFAULT_GRID, ...(migratedScene.grid ?? {}), measurement: { ...DEFAULT_MEASUREMENT, ...(migratedScene.grid?.measurement ?? {}) } },
    calibration: { ...DEFAULT_CALIBRATION, ...(migratedScene.calibration ?? {}) },
    layers: [...normalizedLayers, ...customLayers],
    layerOrderLocked: migratedScene.layerOrderLocked ?? true,
    mapTransform: { ...DEFAULT_MAP_TRANSFORM, ...(migratedScene.mapTransform ?? {}) },
    fog: normalizeFog(migratedScene.fog),
    weather: normalizeWeather(migratedScene.weather),
    environment: normalizeEnvironment(migratedScene.environment),
    tokens: normalizeTokens(migratedScene.tokens),
    tokenMovementPath: normalizeTokenMovementPath(migratedScene.tokenMovementPath),
    walls: migratedScene.walls ?? [],
    lights: migratedScene.lights ?? [],
    drawings: normalizeDrawings(migratedScene.drawings),
    overlays: normalizeSceneOverlays(migratedScene.overlays),
    turnOrder: normalizeTurnOrder(migratedScene.turnOrder),
    videoPlayback: { ...DEFAULT_VIDEO_PLAYBACK, ...(migratedScene.videoPlayback ?? {}) },
    tableTools: normalizeTableTools(migratedScene.tableTools),
    notes: migratedScene.notes ?? "",
    playerView: { ...DEFAULT_PLAYER_VIEW, ...(migratedScene.playerView ?? {}) }
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
        visible: mask.visible ?? true,
        visibleInPlayer: mask.visibleInPlayer ?? true
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
      const effectType = isEnvironmentEffectType(rawEffectType) ? rawEffectType : "water";
      return {
        ...effect,
        id,
        name: typeof effect.name === "string" && effect.name.trim() ? effect.name : `${formatEnvironmentEffectName(effectType)} Effect ${index + 1}`,
        effect: effectType,
        points,
        feather: clampNumber(effect.feather, 0, 1, 0),
        acidTuning: effectType === "acid" ? normalizeAcidEffectTuning(effect.acidTuning) : undefined,
        coldTuning: effectType === "cold" ? normalizeColdEffectTuning(effect.coldTuning) : undefined,
        darknessTuning: effectType === "darkness" ? normalizeDarknessEffectTuning(effect.darknessTuning) : undefined,
        poisonTuning: effectType === "poison" ? normalizePoisonEffectTuning(effect.poisonTuning) : undefined,
        waterTuning: effectType === "water" ? normalizeWaterEffectTuning(effect.waterTuning) : undefined,
        lavaTuning: effectType === "lava" ? normalizeLavaEffectTuning(effect.lavaTuning) : undefined,
        fireTuning: effectType === "fire" ? normalizeFireEffectTuning(effect.fireTuning) : undefined,
        lightningTuning: effectType === "electric" ? normalizeLightningEffectTuning(effect.lightningTuning) : undefined,
        arcaneTuning: effectType === "arcane" ? normalizeArcaneEffectTuning(effect.arcaneTuning) : undefined,
        radiantTuning: effectType === "radiant" ? normalizeRadiantEffectTuning(effect.radiantTuning) : undefined,
        fieldTuning: effectType === "field" ? normalizeForceFieldEffectTuning(effect.fieldTuning) : undefined,
        shockwaveTuning: effectType === "shockwave" ? normalizeShockwaveEffectTuning(effect.shockwaveTuning) : undefined,
        distortionTuning: effectType === "distortion" ? normalizeDistortionEffectTuning(effect.distortionTuning) : undefined,
        chaosTuning: effectType === "chaos" ? normalizeChaosEffectTuning(effect.chaosTuning) : undefined,
        voidTuning: effectType === "void" ? normalizeVoidEffectTuning(effect.voidTuning) : undefined,
        natureTuning: effectType === "nature" ? normalizeNatureEffectTuning(effect.natureTuning) : undefined,
        smokeTuning: effectType === "smoke" ? normalizeSmokeEffectTuning(effect.smokeTuning) : undefined,
        fogTuning: effectType === "fog" ? normalizeFogEffectTuning(effect.fogTuning) : undefined,
        visibleInGm: effect.visibleInGm ?? true,
        visibleInPlayer: effect.visibleInPlayer ?? true
      };
    });
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

function isSupportedSchemaVersion(value: unknown, currentVersion: number): boolean {
  if (value === undefined) {
    return true;
  }
  return typeof value === "number" && Number.isInteger(value) && value >= LEGACY_SCHEMA_VERSION && value <= currentVersion;
}

function normalizeSchemaVersion(value: unknown, currentVersion: number): number {
  return isSupportedSchemaVersion(value, currentVersion) && typeof value === "number" ? value : LEGACY_SCHEMA_VERSION;
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

function normalizeTokenConditions(conditions?: TokenCondition[]): TokenCondition[] {
  const seen = new Set<TokenConditionId>();
  return (conditions ?? []).flatMap((condition) => {
    if (!condition || !TOKEN_CONDITION_IDS.includes(condition.id) || seen.has(condition.id)) {
      return [];
    }
    seen.add(condition.id);
    return [{
      id: condition.id,
      visibleInPlayer: condition.visibleInPlayer ?? true
    }];
  });
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
    visibleInPlayer: token.hidden ? false : (token.visibleInPlayer ?? false),
    conditions: normalizeTokenConditions(token.conditions)
  }));
}

function normalizeTurnOrder(turnOrder?: Partial<TurnOrderSettings>): TurnOrderSettings {
  const entryIds = new Set<string>();
  const entries = (turnOrder?.entries ?? []).map((entry, index) => {
    const id = getUniqueTurnOrderId(entry.id, index, entryIds);
    const type: TurnOrderEntry["type"] = entry.type === "count-tracker" || entry.type === "turn-group" ? entry.type : undefined;
    const tokenIds = Array.from(new Set((entry.tokenIds ?? []).filter((tokenId): tokenId is string => typeof tokenId === "string" && tokenId.trim().length > 0)));
    return {
      ...entry,
      id,
      name: typeof entry.name === "string" && entry.name.trim() ? entry.name : `Entry ${index + 1}`,
      initiative: clampNumber(entry.initiative, -99, 99, 0),
      type,
      countdown: type === "count-tracker" || entry.countdown !== undefined ? clampNumber(entry.countdown, 0, 999, 1) : undefined,
      trackerColor: type === "count-tracker" ? normalizeColor(entry.trackerColor, "#f5d98a") : undefined,
      tokenIds: type === "turn-group" ? tokenIds : undefined,
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
  const playerViewEdge = normalizeTurnOrderTrackerPlacement(turnOrder?.playerViewEdge);
  const playerViewFacing = normalizeTurnOrderTrackerFacing(turnOrder?.playerViewFacing);
  const playerViewSize = normalizeTurnOrderTrackerSize(turnOrder?.playerViewSize);
  return {
    ...DEFAULT_TURN_ORDER,
    ...(turnOrder ?? {}),
    active: turnOrder?.active ?? false,
    currentEntryId,
    round: clampNumber(turnOrder?.round, 1, 999, DEFAULT_TURN_ORDER.round),
    playerViewVisible: turnOrder?.playerViewVisible ?? false,
    playerViewEdge,
    playerViewFacing,
    playerViewSize,
    playerViewTrackers: normalizeTurnOrderTrackers(turnOrder?.playerViewTrackers, playerViewEdge, playerViewFacing, playerViewSize),
    playerViewMaxEntries: clampNumber(turnOrder?.playerViewMaxEntries, 1, 30, DEFAULT_TURN_ORDER.playerViewMaxEntries),
    trackerAvatarMask: normalizeTurnOrderAvatarMask(turnOrder?.trackerAvatarMask),
    playerTurnStatusSize: normalizeTurnOrderTrackerSize(turnOrder?.playerTurnStatusSize),
    playerTurnAvatarMask: normalizeTurnOrderAvatarMask(turnOrder?.playerTurnAvatarMask),
    initiativeDiceCount: clampNumber(turnOrder?.initiativeDiceCount, 1, 20, DEFAULT_TURN_ORDER.initiativeDiceCount),
    initiativeDiceSides: clampNumber(turnOrder?.initiativeDiceSides, 2, 100, DEFAULT_TURN_ORDER.initiativeDiceSides),
    entries,
    seats
  };
}

const TURN_ORDER_TRACKER_PLACEMENTS: TurnOrderTrackerPlacement[] = ["top", "right", "bottom", "left"];

function normalizeTurnOrderTrackers(
  trackers: unknown,
  legacyEdge: TurnOrderTrackerPlacement,
  legacyFacing: TurnOrderTrackerFacing,
  legacySize: TurnOrderTrackerSize
): Record<TurnOrderTrackerPlacement, TurnOrderTrackerDisplaySettings> {
  const source = isRecord(trackers) ? trackers : null;
  return TURN_ORDER_TRACKER_PLACEMENTS.reduce(
    (nextTrackers, edge) => {
      const tracker = source && isRecord(source[edge]) ? source[edge] : null;
      nextTrackers[edge] = {
        enabled: tracker ? tracker.enabled === true : edge === legacyEdge,
        facing: normalizeTurnOrderTrackerFacing(tracker?.facing ?? (edge === legacyEdge ? legacyFacing : DEFAULT_TURN_ORDER.playerViewFacing)),
        size: normalizeTurnOrderTrackerSize(tracker?.size ?? (edge === legacyEdge ? legacySize : DEFAULT_TURN_ORDER.playerViewSize))
      };
      return nextTrackers;
    },
    {} as Record<TurnOrderTrackerPlacement, TurnOrderTrackerDisplaySettings>
  );
}

function normalizeTurnOrderTrackerPlacement(edge: unknown): TurnOrderTrackerPlacement {
  return edge === "top" || edge === "right" || edge === "bottom" || edge === "left" ? edge : DEFAULT_TURN_ORDER.playerViewEdge;
}

function normalizeTurnOrderTrackerFacing(facing: unknown): TurnOrderTrackerFacing {
  return facing === "outward" ? "outward" : DEFAULT_TURN_ORDER.playerViewFacing;
}

function normalizeTurnOrderTrackerSize(size: unknown): TurnOrderTrackerSize {
  return size === "xs" || size === "sm" || size === "lg" || size === "xl" ? size : DEFAULT_TURN_ORDER.playerViewSize;
}

function normalizeTurnOrderAvatarMask(mask: unknown): TurnOrderAvatarMask {
  return mask === "square" || mask === "hex" ? mask : "circle";
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

function migrateCampaignToCurrent(campaign: Campaign): Campaign {
  const schemaVersion = normalizeSchemaVersion(campaign.schemaVersion, CURRENT_CAMPAIGN_SCHEMA_VERSION);
  if (schemaVersion === LEGACY_SCHEMA_VERSION) {
    return {
      ...campaign,
      schemaVersion: CURRENT_CAMPAIGN_SCHEMA_VERSION
    };
  }
  return {
    ...campaign,
    schemaVersion: CURRENT_CAMPAIGN_SCHEMA_VERSION
  };
}

export function normalizeCampaign(campaign: Campaign): Campaign {
  const migratedCampaign = migrateCampaignToCurrent(campaign);
  const sceneFolders = (migratedCampaign.sceneFolders ?? []).map((folder) => ({
    ...folder,
    color: normalizeColor(folder.color)
  }));
  const folderIds = new Set(sceneFolders.map((folder) => folder.id));
  // Drop collapsed folder ids that no longer exist so deleted folders do not linger in UI state.
  const collapsedFolderIds = (migratedCampaign.sceneLibrary?.collapsedFolderIds ?? []).filter((folderId) => folderIds.has(folderId));

  return {
    ...migratedCampaign,
    schemaVersion: CURRENT_CAMPAIGN_SCHEMA_VERSION,
    defaultGrid: { ...DEFAULT_GRID, ...(migratedCampaign.defaultGrid ?? {}), measurement: { ...DEFAULT_MEASUREMENT, ...(migratedCampaign.defaultGrid?.measurement ?? {}) } },
    defaultMeasurement: { ...DEFAULT_MEASUREMENT, ...(migratedCampaign.defaultMeasurement ?? {}) },
    defaultCalibration: { ...DEFAULT_CALIBRATION, ...(migratedCampaign.defaultCalibration ?? {}) },
    playerDisplay: { ...DEFAULT_CALIBRATION, ...(migratedCampaign.playerDisplay ?? migratedCampaign.defaultCalibration ?? {}) },
    diceSettings: normalizeDiceSettings(migratedCampaign.diceSettings),
    sceneLibrary: { collapsedFolderIds },
    sceneFolders,
    scenes: (migratedCampaign.scenes ?? []).map((scene) => {
      const { folderId, ...sceneWithoutFolder } = scene;
      return {
        ...sceneWithoutFolder,
        ...(folderId && folderIds.has(folderId) ? { folderId } : {}),
        weather: scene.weather ? normalizeWeather(scene.weather) : undefined
      };
    }),
    players: (migratedCampaign.players ?? []).map((player, index) => ({
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
    assets: (migratedCampaign.assets ?? []).map(normalizeAsset)
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
      weather: {
        ...normalizedScene.weather,
        masks: normalizedScene.weather.masks.filter((mask) => mask.visibleInPlayer ?? mask.visible ?? true)
      },
      environment: {
        effects: normalizedScene.environment.effects.filter((effect) => effect.visibleInPlayer !== false && playerLayerIds.has("effects"))
      },
      // Projection is the Player View trust boundary: strip GM-only layers/content before sending across IPC.
      layers: normalizedScene.layers.filter((layer) => layer.visibleInPlayer),
      tokens: normalizedScene.tokens
        .filter((token) => token.visibleInPlayer)
        .map((token) => ({
          ...token,
          conditions: (token.conditions ?? []).filter((condition) => condition.visibleInPlayer)
        })),
      walls: [],
      lights: [],
      drawings: normalizedScene.drawings.filter((drawing) => drawing.visibleInPlayer && playerLayerIds.has("drawing")),
      overlays: normalizedScene.overlays.filter((overlay) => overlay.visibleInPlayer && playerLayerIds.has(overlay.layerId)),
      notes: ""
    },
    assets: normalizedCampaign.assets.filter((asset) => usedAssetIds.has(asset.id))
  };
}
