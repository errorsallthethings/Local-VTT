export type AssetKind = "map" | "token" | "overlay" | "effect" | "handout";
export type AssetMediaType = "image" | "video";
export type GridType = "square" | "hex" | "gridless";
export type MeasurementUnit = "feet" | "meters" | "miles";
export type WallType = "wall" | "door" | "window" | "terrain";
export type DrawingKind = "freehand" | "line" | "rectangle" | "circle" | "cone" | "text" | "ping" | "laser";
export type TokenSizePreset = "tiny" | "medium" | "large" | "huge" | "gargantuan" | "custom";
export type TokenMask = "none" | "circle" | "square";
export type TokenBorderStyle = "none" | "solid" | "embossed" | "inner-shadow" | "glow";
export type TokenBorderWidthPreset = "thin" | "medium" | "thick" | "custom";

export interface Asset {
  id: string;
  name: string;
  kind: AssetKind;
  mediaType: AssetMediaType;
  relativePath: string;
  thumbnailRelativePath?: string;
  originalFileName: string;
  createdAt: string;
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
  tokens: Token[];
  tokenMovementPath?: TokenMovementPath;
  walls: Wall[];
  lights: LightSource[];
  drawings: DrawingElement[];
  overlays: SceneOverlay[];
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
}

export interface CampaignSceneFolder {
  id: string;
  name: string;
  createdAt: string;
  color: string;
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
  scene: Scene;
  assets: Asset[];
}

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

export const DEFAULT_TOKEN_BORDER_COLOR = "#7aa2f7";
export const DEFAULT_TOKEN_BORDER_STYLE: TokenBorderStyle = "none";
export const DEFAULT_TOKEN_BORDER_WIDTH = 5;
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

export const DEFAULT_LAYERS: Layer[] = [
  { id: "gm", name: "GM Layer", kind: "gm", order: 90, visibleInGm: true, visibleInPlayer: false, locked: false, opacity: 1 },
  { id: "fog", name: "Fog of War Layer", kind: "fog", order: 80, visibleInGm: true, visibleInPlayer: true, locked: false, opacity: 1 },
  { id: "grid", name: "Grid Layer", kind: "grid", order: 70, visibleInGm: true, visibleInPlayer: true, locked: false, opacity: 1 },
  { id: "weather", name: "Weather/Effects Layer", kind: "weather", order: 60, visibleInGm: true, visibleInPlayer: true, locked: false, opacity: 1 },
  { id: "token", name: "Token Layer", kind: "token", order: 50, visibleInGm: true, visibleInPlayer: false, locked: false, opacity: 1 },
  { id: "foreground", name: "Foreground Layer", kind: "foreground", order: 40, visibleInGm: true, visibleInPlayer: true, locked: false, opacity: 1 },
  { id: "object", name: "Object Layer", kind: "object", order: 30, visibleInGm: true, visibleInPlayer: true, locked: false, opacity: 1 },
  { id: "lighting", name: "Lighting/Wall Layer", kind: "lighting", order: 20, visibleInGm: true, visibleInPlayer: true, locked: false, opacity: 1 },
  { id: "map", name: "Map Layer", kind: "map", order: 10, visibleInGm: true, visibleInPlayer: true, locked: true, opacity: 1 }
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
    tokens: [],
    walls: [],
    lights: [],
    drawings: [],
    overlays: [],
    videoPlayback: { ...DEFAULT_VIDEO_PLAYBACK },
    notes: "",
    playerView: {
      backgroundColor: "#000000",
      fitMode: "contain"
    }
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
    isValidSceneShape(value.scene)
  );
}

export function normalizeScene(scene: Scene): Scene {
  const layerById = new Map((scene.layers ?? []).map((layer) => [layer.id, layer]));
  const normalizedLayers = DEFAULT_LAYERS.map((defaultLayer) => ({
    ...defaultLayer,
    ...(layerById.get(defaultLayer.id) ?? {})
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
    tokens: normalizeTokens(scene.tokens),
    videoPlayback: { ...DEFAULT_VIDEO_PLAYBACK, ...(scene.videoPlayback ?? {}) }
  };
}

function isValidSceneShape(value: unknown): value is Scene {
  return isRecord(value) && isNonEmptyString(value.id) && isNonEmptyString(value.name) && Array.isArray(value.layers);
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

function normalizeTokens(tokens?: Token[]): Token[] {
  return (tokens ?? []).map((token, index) => ({
    ...token,
    sizePreset: token.sizePreset ?? DEFAULT_TOKEN_SIZE_PRESET,
    mask: token.mask ?? DEFAULT_TOKEN_MASK,
    borderColor: normalizeColor(token.borderColor, DEFAULT_TOKEN_BORDER_COLOR),
    borderStyle: normalizeTokenBorderStyle(token.borderStyle),
    borderWidth: Number.isFinite(token.borderWidth) ? Math.min(16, Math.max(1, token.borderWidth ?? DEFAULT_TOKEN_BORDER_WIDTH)) : DEFAULT_TOKEN_BORDER_WIDTH,
    borderWidthPreset: token.borderWidthPreset ?? DEFAULT_TOKEN_BORDER_WIDTH_PRESET,
    glowColor: normalizeColor(token.glowColor, normalizeColor(token.borderColor, DEFAULT_TOKEN_GLOW_COLOR)),
    footprintVisible: token.footprintVisible ?? DEFAULT_TOKEN_FOOTPRINT_VISIBLE,
    order: token.order ?? (tokens?.length ?? 0) - index,
    hidden: token.hidden ?? false,
    visibleInGm: token.visibleInGm ?? !(token.hidden ?? false),
    visibleInPlayer: token.hidden ? false : (token.visibleInPlayer ?? false)
  }));
}

function normalizeTokenBorderStyle(style: unknown): TokenBorderStyle {
  return style === "solid" || style === "embossed" || style === "inner-shadow" || style === "glow" ? style : DEFAULT_TOKEN_BORDER_STYLE;
}

export function normalizeCampaign(campaign: Campaign): Campaign {
  const sceneFolders = (campaign.sceneFolders ?? []).map((folder) => ({
    ...folder,
    color: normalizeColor(folder.color)
  }));
  const folderIds = new Set(sceneFolders.map((folder) => folder.id));
  const collapsedFolderIds = (campaign.sceneLibrary?.collapsedFolderIds ?? []).filter((folderId) => folderIds.has(folderId));

  return {
    ...campaign,
    defaultGrid: { ...DEFAULT_GRID, ...(campaign.defaultGrid ?? {}), measurement: { ...DEFAULT_MEASUREMENT, ...(campaign.defaultGrid?.measurement ?? {}) } },
    defaultMeasurement: { ...DEFAULT_MEASUREMENT, ...(campaign.defaultMeasurement ?? {}) },
    defaultCalibration: { ...DEFAULT_CALIBRATION, ...(campaign.defaultCalibration ?? {}) },
    playerDisplay: { ...DEFAULT_CALIBRATION, ...(campaign.playerDisplay ?? campaign.defaultCalibration ?? {}) },
    sceneLibrary: { collapsedFolderIds },
    sceneFolders,
    scenes: campaign.scenes ?? [],
    assets: campaign.assets ?? []
  };
}

function normalizeColor(color: unknown, fallback = DEFAULT_SCENE_FOLDER_COLOR): string {
  return typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
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

  return {
    campaignName: normalizedCampaign.name,
    playerDisplay: normalizedCampaign.playerDisplay,
    scene: {
      ...normalizedScene,
      fog: {
        ...normalizedScene.fog,
        shapes: normalizedScene.fog.shapes.filter((shape) => shape.visibleInPlayer ?? shape.visible ?? true)
      },
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
