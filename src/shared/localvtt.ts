export type AssetKind = "map" | "token" | "overlay" | "effect" | "handout";
export type AssetMediaType = "image" | "video";
export type GridType = "square" | "hex" | "gridless";
export type MeasurementUnit = "feet" | "meters" | "miles";
export type WallType = "wall" | "door" | "window" | "terrain";
export type DrawingKind = "freehand" | "line" | "rectangle" | "circle" | "cone" | "text" | "ping" | "laser";
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
    | "grid"
    | "weather"
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
  kind: DrawingKind;
  points: Point[];
  text?: string;
  color: string;
  opacity: number;
  strokeWidth: number;
  fill?: string;
  visibleInPlayer: boolean;
}

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

export interface TurnOrderSettings {
  active: boolean;
  currentEntryId?: string;
  playerViewVisible: boolean;
  playerViewEdge: "top" | "right" | "bottom" | "left";
  playerViewFacing: "inward" | "outward";
  playerViewSize: "xs" | "sm" | "md" | "lg" | "xl";
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
  tokens: Token[];
  tokenMovementPath?: TokenMovementPath;
  walls: Wall[];
  lights: LightSource[];
  drawings: DrawingElement[];
  overlays: SceneOverlay[];
  turnOrder: TurnOrderSettings;
  videoPlayback: VideoPlaybackSettings;
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
  scene: Scene;
  assets: Asset[];
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

export type LiveTableEvent =
  | {
      id: string;
      type: "ping";
      point: Point;
      createdAt: number;
    }
  | {
      id: string;
      type: "laser";
      points: LiveTablePoint[];
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
  color: "#d8dee9",
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

export const DEFAULT_TURN_ORDER: TurnOrderSettings = {
  active: false,
  playerViewVisible: false,
  playerViewEdge: "top",
  playerViewFacing: "inward",
  playerViewSize: "md",
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
  { id: "weather", name: "Weather", kind: "weather", order: 70, visibleInGm: true, visibleInPlayer: true, locked: false, opacity: 1 },
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
    tokens: [],
    walls: [],
    lights: [],
    drawings: [],
    overlays: [],
    turnOrder: { ...DEFAULT_TURN_ORDER, entries: [], seats: [] },
    videoPlayback: { ...DEFAULT_VIDEO_PLAYBACK },
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
    return isPoint(value.point);
  }
  if (value.type === "laser") {
    return Array.isArray(value.points) && value.points.every((entry) => isRecord(entry) && isPoint(entry.point) && typeof entry.createdAt === "number");
  }
  return false;
}

function isPoint(value: unknown): value is Point {
  return isRecord(value) && typeof value.x === "number" && Number.isFinite(value.x) && typeof value.y === "number" && Number.isFinite(value.y);
}

export function normalizeScene(scene: Scene): Scene {
  const layerById = new Map((scene.layers ?? []).map((layer) => [layer.id, layer]));
  // Default layer names/order are application-owned so old scene files pick up current layer labels safely.
  const normalizedLayers = DEFAULT_LAYERS.map((defaultLayer) => ({
    ...defaultLayer,
    ...(layerById.get(defaultLayer.id) ?? {}),
    name: defaultLayer.name,
    order: defaultLayer.order
  }));
  const customLayers = (scene.layers ?? []).filter((layer) => !DEFAULT_LAYERS.some((defaultLayer) => defaultLayer.id === layer.id));

  return {
    ...scene,
    grid: { ...DEFAULT_GRID, ...(scene.grid ?? {}), measurement: { ...DEFAULT_MEASUREMENT, ...(scene.grid?.measurement ?? {}) } },
    calibration: { ...DEFAULT_CALIBRATION, ...(scene.calibration ?? {}) },
    layers: [...normalizedLayers, ...customLayers],
    layerOrderLocked: scene.layerOrderLocked ?? true,
    mapTransform: { ...DEFAULT_MAP_TRANSFORM, ...(scene.mapTransform ?? {}) },
    fog: normalizeFog(scene.fog),
    weather: normalizeWeather(scene.weather),
    tokens: normalizeTokens(scene.tokens),
    tokenMovementPath: normalizeTokenMovementPath(scene.tokenMovementPath),
    walls: scene.walls ?? [],
    lights: scene.lights ?? [],
    drawings: scene.drawings ?? [],
    overlays: scene.overlays ?? [],
    turnOrder: normalizeTurnOrder(scene.turnOrder),
    videoPlayback: { ...DEFAULT_VIDEO_PLAYBACK, ...(scene.videoPlayback ?? {}) },
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
        name: typeof mask.name === "string" && mask.name.trim() ? mask.name : `Weather Mask ${index + 1}`,
        points,
        visible: mask.visible ?? true
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

export function projectSceneForPlayer(campaign: Campaign, scene: Scene): PlayerSceneProjection {
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
    if (player.visibleInPlayer && player.assetId) {
      usedAssetIds.add(player.assetId);
    }
  }

  return {
    campaignName: normalizedCampaign.name,
    playerDisplay: normalizedCampaign.playerDisplay,
    players: normalizedCampaign.players,
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
      drawings: normalizedScene.drawings.filter((drawing) => drawing.visibleInPlayer),
      overlays: normalizedScene.overlays.filter((overlay) => overlay.visibleInPlayer && playerLayerIds.has(overlay.layerId)),
      notes: ""
    },
    assets: normalizedCampaign.assets.filter((asset) => usedAssetIds.has(asset.id))
  };
}
