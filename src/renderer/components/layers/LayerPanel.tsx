import { useEffect, useState, type MouseEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Box,
  CloudFog,
  CloudSun,
  Crown,
  Grid3X3,
  Import,
  Image,
  Layers,
  Lightbulb,
  MoreVertical,
  Eye,
  EyeOff,
  GripVertical,
  Paintbrush,
  Settings,
  Shield,
  Sparkles,
  Square,
  Trash2,
  Triangle,
  User,
  UsersRound
} from "lucide-react";
import type { Asset, FogSettings, GridSettings, GridType, Layer, MapTransform, Point, Scene } from "../../../shared/localvtt";
import {
  DEFAULT_TOKEN_BORDER_COLOR,
  DEFAULT_TOKEN_BORDER_STYLE,
  DEFAULT_TOKEN_BORDER_WIDTH,
  DEFAULT_TOKEN_BORDER_WIDTH_PRESET,
  DEFAULT_TOKEN_FOOTPRINT_VISIBLE,
  DEFAULT_TOKEN_GLOW_COLOR,
  DEFAULT_TOKEN_MASK,
  DEFAULT_TOKEN_SIZE_PRESET,
  type Token,
  type TokenBorderStyle,
  type TokenBorderWidthPreset,
  type TokenMask,
  type TokenSizePreset
} from "../../../shared/localvtt";
import { ColorSettingRow } from "../controls/ColorPickerField";
import { DebouncedNumberInput } from "../controls/DebouncedNumberInput";

export function LayerPanel({
  scene,
  mapAsset,
  tokenAssets,
  selectedFogShapeId,
  selectedTokenId,
  onChange,
  onUpdateGrid,
  onUpdateFog,
  onUpdateMapTransform,
  onFitGridToMapDimensions,
  onMoveLayer,
  onImportMap,
  onImportToken,
  onDeleteMap,
  onSelectFogShape,
  onSelectToken,
  onRenameFogShape,
  onRenameToken,
  onOpenFogColor,
  onOpenGridColor,
  onOpenTokenColor
}: {
  scene: Scene;
  mapAsset: Asset | null;
  tokenAssets: Map<string, Asset>;
  selectedFogShapeId: string | null;
  selectedTokenId: string | null;
  onChange: (scene: Scene) => void;
  onUpdateGrid: (patch: Partial<GridSettings>) => void;
  onUpdateFog: (patch: Partial<FogSettings>) => void;
  onUpdateMapTransform: (patch: Partial<MapTransform>) => void;
  onFitGridToMapDimensions: () => void;
  onMoveLayer: (layerId: string, direction: "up" | "down") => void;
  onImportMap: () => void;
  onImportToken: () => void;
  onDeleteMap: (asset: Asset) => void;
  onSelectFogShape: (shapeId: string | null) => void;
  onSelectToken: (tokenId: string | null) => void;
  onRenameFogShape: (shapeId: string, fallbackName: string) => void;
  onRenameToken: (tokenId: string, fallbackName: string) => void;
  onOpenFogColor: () => void;
  onOpenGridColor: () => void;
  onOpenTokenColor: (tokenId: string, value: string, kind: "border" | "glow") => void;
}) {
  const sortedLayers = [...scene.layers].sort((a, b) => b.order - a.order);
  const visualGridEnabled = scene.grid.type !== "gridless";
  const canFitGridToMap = mapAsset?.mediaType === "image";
  const fitModeHelp = getFitModeHelp(scene.mapTransform.fitMode);
  const [expandedLayerIds, setExpandedLayerIds] = useState<Set<string>>(() => new Set());
  const [settingsLayerIds, setSettingsLayerIds] = useState<Set<string>>(() => new Set());
  const [draggedFogShapeId, setDraggedFogShapeId] = useState<string | null>(null);

  useEffect(() => {
    if (scene.mapAssetId) {
      return;
    }
    setExpandedLayerIds((ids) => {
      if (ids.has("map")) {
        return ids;
      }
      return new Set([...ids, "map"]);
    });
  }, [scene.id, scene.mapAssetId]);

  useEffect(() => {
    if (scene.fog.shapes.length === 0) {
      return;
    }
    setExpandedLayerIds((ids) => {
      if (ids.has("fog")) {
        return ids;
      }
      return new Set([...ids, "fog"]);
    });
  }, [scene.fog.shapes.length]);

  useEffect(() => {
    if (scene.tokens.length === 0) {
      return;
    }
    setExpandedLayerIds((ids) => {
      if (ids.has("token")) {
        return ids;
      }
      return new Set([...ids, "token"]);
    });
  }, [scene.tokens.length]);

  const updateLayer = (layerId: string, patch: Partial<Layer>) => {
    const nextGrid =
      layerId === "grid"
        ? {
            ...scene.grid,
            showOnGm: patch.visibleInGm ?? scene.grid.showOnGm,
            showOnPlayer: patch.visibleInPlayer ?? scene.grid.showOnPlayer
          }
        : scene.grid;
    const nextTokens =
      layerId === "token" && (typeof patch.visibleInGm === "boolean" || typeof patch.visibleInPlayer === "boolean")
        ? scene.tokens.map((token) => ({
            ...token,
            visibleInGm: patch.visibleInGm ?? token.visibleInGm,
            visibleInPlayer: patch.visibleInPlayer ?? token.visibleInPlayer
          }))
        : scene.tokens;
    onChange({
      ...scene,
      grid: nextGrid,
      layers: scene.layers.map((layer) => (layer.id === layerId ? { ...layer, ...patch } : layer)),
      tokens: nextTokens,
      updatedAt: new Date().toISOString()
    });
  };

  const toggleLayerExpanded = (layerId: string) => {
    setExpandedLayerIds((ids) => {
      const nextIds = new Set(ids);
      if (nextIds.has(layerId)) {
        nextIds.delete(layerId);
      } else {
        nextIds.add(layerId);
      }
      return nextIds;
    });
  };

  const toggleLayerSettings = (layerId: string) => {
    setSettingsLayerIds((ids) => {
      const nextIds = new Set(ids);
      if (nextIds.has(layerId)) {
        nextIds.delete(layerId);
      } else {
        nextIds.clear();
        nextIds.add(layerId);
      }
      return nextIds;
    });
  };

  const moveFogShape = (sourceShapeId: string, targetShapeId: string) => {
    if (sourceShapeId === targetShapeId) {
      return;
    }
    const sourceIndex = scene.fog.shapes.findIndex((shape) => shape.id === sourceShapeId);
    const targetIndex = scene.fog.shapes.findIndex((shape) => shape.id === targetShapeId);
    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }
    const shapes = [...scene.fog.shapes];
    const [sourceShape] = shapes.splice(sourceIndex, 1);
    shapes.splice(targetIndex, 0, sourceShape);
    onUpdateFog({ shapes });
  };

  const updateTokens = (tokens: Token[]) => {
    onChange({ ...scene, tokens, updatedAt: new Date().toISOString() });
  };

  const updateToken = (tokenId: string, patch: Partial<Token>) => {
    updateTokens(
      scene.tokens.map((token) => {
        if (token.id !== tokenId) {
          return token;
        }
        const nextToken = { ...token, ...patch };
        return patch.size ? { ...nextToken, position: getSnappedTokenPosition(nextToken.position, nextToken, scene) } : nextToken;
      })
    );
  };

  const onLayerRowClick = (event: MouseEvent<HTMLDivElement>, layerId: string, isExpandable: boolean) => {
    if (!isExpandable || (event.target as HTMLElement).closest("button,input,select,label,a")) {
      return;
    }
    toggleLayerExpanded(layerId);
  };

  const updateFogStartMode = (mode: FogSettings["mode"]) => {
    const opacity = mode === "revealed" ? 0 : mode === "partial" ? 0.5 : 1;
    onUpdateFog({
      mode,
      gmOpacity: mode === "revealed" ? 0 : 0.5,
      playerOpacity: opacity,
      opacity,
      shapes: []
    });
  };

  return (
    <section className="panel">
      <div className="layer-list">
        {sortedLayers.map((layer, index) => {
          const hasLayerSettings =
            (layer.id === "map" && Boolean(mapAsset)) ||
            layer.id === "grid" ||
            layer.id === "fog";
          const hasLayerContents =
            (layer.id === "map" && !mapAsset) ||
            (layer.id === "fog" && scene.fog.shapes.length > 0) ||
            layer.id === "token";
          const isExpanded = hasLayerContents && expandedLayerIds.has(layer.id);
          const areSettingsExpanded = settingsLayerIds.has(layer.id);
          const isPlaceholderLayer = !hasLayerSettings && !hasLayerContents;
          return (
            <div
              className={[
                "layer-row",
                hasLayerContents ? "expandable-layer-row" : "",
                isPlaceholderLayer ? "placeholder-layer-row" : ""
              ]
                .filter(Boolean)
                .join(" ")}
              key={layer.id}
              onClick={(event) => onLayerRowClick(event, layer.id, hasLayerContents)}
            >
              <span className="layer-kind-icon" title={layer.name} aria-hidden="true">
                {getLayerIcon(layer)}
              </span>
              <span className="layer-name" title={layer.name}>
                {layer.name}
              </span>
              <button
                className={layer.visibleInGm ? "icon-button layer-visibility-button layer-visibility-active" : "icon-button layer-visibility-button"}
                aria-label={layer.visibleInGm ? `Hide ${layer.name} in GM View` : `Show ${layer.name} in GM View`}
                aria-pressed={layer.visibleInGm}
                title={layer.visibleInGm ? "Hide in GM View" : "Show in GM View"}
                onClick={() => updateLayer(layer.id, { visibleInGm: !layer.visibleInGm })}
              >
                <Crown size={14} aria-hidden="true" />
              </button>
              <button
                className={layer.visibleInPlayer ? "icon-button layer-visibility-button layer-visibility-active" : "icon-button layer-visibility-button"}
                aria-label={layer.visibleInPlayer ? `Hide ${layer.name} in Player View` : `Show ${layer.name} in Player View`}
                aria-pressed={layer.visibleInPlayer}
                title={layer.visibleInPlayer ? "Hide in Player View" : "Show in Player View"}
                onClick={() => updateLayer(layer.id, { visibleInPlayer: !layer.visibleInPlayer })}
              >
                <User size={14} aria-hidden="true" />
              </button>
              <button
                className={areSettingsExpanded ? "icon-button layer-settings-button layer-settings-active" : "icon-button layer-settings-button"}
                aria-label={hasLayerSettings ? (areSettingsExpanded ? `Hide ${layer.name} settings` : `Show ${layer.name} settings`) : `${layer.name} settings unavailable`}
                title={hasLayerSettings ? (areSettingsExpanded ? "Hide layer settings" : "Show layer settings") : "No layer settings yet"}
                disabled={!hasLayerSettings}
                onClick={() => toggleLayerSettings(layer.id)}
              >
                <Settings size={15} aria-hidden="true" />
              </button>
              {!scene.layerOrderLocked && (
                <div className="layer-order-controls">
                  <button
                    className="icon-button"
                    aria-label={`Move ${layer.name} up`}
                    title="Move up"
                    disabled={index === 0}
                    onClick={() => onMoveLayer(layer.id, "up")}
                  >
                    <ArrowUp size={14} aria-hidden="true" />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Move ${layer.name} down`}
                    title="Move down"
                    disabled={index === sortedLayers.length - 1}
                    onClick={() => onMoveLayer(layer.id, "down")}
                  >
                    <ArrowDown size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
              {layer.id === "fog" && areSettingsExpanded && (
                <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
                  <label className="stacked-control">
                    Mode
                    <select value={scene.fog.mode} onChange={(event) => updateFogStartMode(event.target.value as FogSettings["mode"])}>
                      <option value="revealed">Fully revealed</option>
                      <option value="hidden">Fully hidden</option>
                      <option value="partial">Partially revealed</option>
                    </select>
                  </label>
                  <div className="settings-grid">
                    <label className="setting-row">
                      <span>GM opacity</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={scene.fog.gmOpacity}
                        onChange={(event) => onUpdateFog({ gmOpacity: Number(event.target.value) })}
                      />
                    </label>
                    <label className="setting-row">
                      <span>Player opacity</span>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={scene.fog.playerOpacity}
                        onChange={(event) => onUpdateFog({ playerOpacity: Number(event.target.value), opacity: Number(event.target.value) })}
                      />
                    </label>
                    <ColorSettingRow label="Color" value={scene.fog.color} onOpen={onOpenFogColor} />
                  </div>
                  <div className="setting-row fog-new-shape-row">
                    <span>New Shapes</span>
                    <div className="fog-new-shape-control">
                      <label className="fog-operation-switch fog-new-shape-switch" title="Player View default for newly drawn fog shapes">
                        <span>Reveal</span>
                        <input
                          aria-label="Player View default for new fog shapes"
                          type="checkbox"
                          checked={!scene.fog.newShapesVisibleInPlayer}
                          onChange={(event) => onUpdateFog({ newShapesVisibleInPlayer: !event.target.checked })}
                        />
                        <span>Hidden</span>
                      </label>
                      <small>Sets the Player View default for newly drawn fog shapes.</small>
                    </div>
                  </div>
                  <div className="inline-help">Fog drawing tools are available from the floating Tools Menu in the GM canvas.</div>
                </div>
              )}
              {layer.id === "fog" && isExpanded && (
                <FogShapeList
                  scene={scene}
                  selectedFogShapeId={selectedFogShapeId}
                  draggedFogShapeId={draggedFogShapeId}
                  onDraggedFogShapeIdChange={setDraggedFogShapeId}
                  onMoveFogShape={moveFogShape}
                  onSelectFogShape={onSelectFogShape}
                  onRenameFogShape={onRenameFogShape}
                  onUpdateFog={onUpdateFog}
                />
              )}
              {layer.id === "token" && isExpanded && (
                <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
                  <button className="import-map-next-step" onClick={onImportToken}>
                    <Import size={16} aria-hidden="true" />
                    Import Token
                  </button>
                </div>
              )}
              {layer.id === "token" && isExpanded && (
                <TokenList
                  scene={scene}
                  tokenAssets={tokenAssets}
                  selectedTokenId={selectedTokenId}
                  onSelectToken={onSelectToken}
                  onRenameToken={onRenameToken}
                  onUpdateToken={updateToken}
                  onUpdateTokens={updateTokens}
                  onOpenTokenColor={onOpenTokenColor}
                />
              )}
              {layer.id === "grid" && areSettingsExpanded && (
                <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
                  <label className="stacked-control">
                    Mode
                    <select value={scene.grid.type} onChange={(event) => onUpdateGrid({ type: event.target.value as GridType })}>
                      <option value="gridless">Gridless</option>
                      <option value="square">Square</option>
                      <option value="hex">Hex</option>
                    </select>
                  </label>
                  <div className="control-divider" />
                  {visualGridEnabled && (
                    <>
                      <div className="settings-grid">
                        <label className="setting-row">
                          <span>Cell size</span>
                          <DebouncedNumberInput
                            value={scene.grid.sizePx}
                            min={8}
                            max={1000}
                            delayMs={450}
                            onCommit={(value) => onUpdateGrid({ sizePx: value })}
                          />
                        </label>
                        <label className="setting-row">
                          <span>Opacity</span>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={scene.grid.opacity}
                            onChange={(event) => onUpdateGrid({ opacity: Number(event.target.value) })}
                          />
                        </label>
                        <div className="setting-row">
                          <span>Offset</span>
                          <div className="xy-inputs">
                            <label>
                              X
                              <input type="number" value={scene.grid.offsetX} onChange={(event) => onUpdateGrid({ offsetX: Number(event.target.value) })} />
                            </label>
                            <label>
                              Y
                              <input type="number" value={scene.grid.offsetY} onChange={(event) => onUpdateGrid({ offsetY: Number(event.target.value) })} />
                            </label>
                          </div>
                        </div>
                        <label className="setting-row">
                          <span>Thickness</span>
                          <input
                            type="number"
                            min={0.5}
                            max={10}
                            step={0.5}
                            value={scene.grid.lineThickness}
                            onChange={(event) => onUpdateGrid({ lineThickness: Number(event.target.value) })}
                          />
                        </label>
                        <ColorSettingRow label="Color" value={scene.grid.color} onOpen={onOpenGridColor} />
                      </div>
                      <div className="control-divider" />
                      <div className="settings-grid">
                        <div className="setting-row">
                          <span>Map grid</span>
                          <div className="xy-inputs">
                            <label>
                              W
                              <input
                                type="number"
                                min={1}
                                value={scene.grid.mapGridColumns}
                                onChange={(event) => onUpdateGrid({ mapGridColumns: Number(event.target.value) })}
                              />
                            </label>
                            <label>
                              H
                              <input
                                type="number"
                                min={1}
                                value={scene.grid.mapGridRows}
                                onChange={(event) => onUpdateGrid({ mapGridRows: Number(event.target.value) })}
                              />
                            </label>
                          </div>
                        </div>
                        <button disabled={!canFitGridToMap} onClick={onFitGridToMapDimensions}>
                          Fit grid to map dimensions
                        </button>
                        {!canFitGridToMap && <div className="inline-help">Grid fitting currently supports static image maps.</div>}
                      </div>
                    </>
                  )}
                </div>
              )}
              {layer.id === "map" && !mapAsset && (isExpanded || areSettingsExpanded) && (
                <div className="layer-detail-controls map-layer-controls" onClick={(event) => event.stopPropagation()}>
                  <button className="import-map-next-step" onClick={onImportMap}>
                    <Import size={16} aria-hidden="true" />
                    Import Map
                  </button>
                </div>
              )}
              {layer.id === "map" && areSettingsExpanded && (
                <div className="layer-detail-controls map-layer-controls" onClick={(event) => event.stopPropagation()}>
                  {mapAsset ? (
                    <>
                      <div className="map-asset-summary">
                        <span title={mapAsset.name}>{mapAsset.name}</span>
                        <small>{mapAsset.mediaType}</small>
                      </div>
                      <button className="icon-button danger" aria-label="Delete map asset" title="Delete map asset" onClick={() => onDeleteMap(mapAsset)}>
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                      <label className="stacked-control">
                        Fit mode
                        <select value={scene.mapTransform.fitMode} onChange={(event) => onUpdateMapTransform({ fitMode: event.target.value as MapTransform["fitMode"] })}>
                          <option value="manual">Manual</option>
                          <option value="contain">Fit contain</option>
                          <option value="cover">Fit cover</option>
                          <option value="actual-size">Actual size</option>
                        </select>
                      </label>
                      <div className="inline-help">{fitModeHelp}</div>
                      <div className="control-divider" />
                      <div className="settings-grid">
                        <div className="setting-row">
                          <span>Position</span>
                          <div className="xy-inputs">
                            <label>
                              X
                              <input
                                type="number"
                                value={scene.mapTransform.x}
                                disabled={scene.mapTransform.fitMode !== "manual"}
                                onChange={(event) => onUpdateMapTransform({ x: Number(event.target.value), fitMode: "manual" })}
                              />
                            </label>
                            <label>
                              Y
                              <input
                                type="number"
                                value={scene.mapTransform.y}
                                disabled={scene.mapTransform.fitMode !== "manual"}
                                onChange={(event) => onUpdateMapTransform({ y: Number(event.target.value), fitMode: "manual" })}
                              />
                            </label>
                          </div>
                        </div>
                        <label className="setting-row">
                          <span>Scale</span>
                          <input
                            type="number"
                            min={0.01}
                            step={0.05}
                            value={scene.mapTransform.scale}
                            disabled={scene.mapTransform.fitMode !== "manual"}
                            onChange={(event) => onUpdateMapTransform({ scale: Number(event.target.value), fitMode: "manual" })}
                          />
                        </label>
                        <label className="setting-row">
                          <span>Rotation</span>
                          <input
                            type="number"
                            step={1}
                            value={scene.mapTransform.rotation}
                            onChange={(event) => onUpdateMapTransform({ rotation: Number(event.target.value) })}
                          />
                        </label>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatFogShapeLabel(operation: "reveal" | "hide", kind: "brush" | "rectangle" | "polygon" | "circle", index: number): string {
  const operationLabel = operation === "reveal" ? "Reveal" : "Hide";
  const kindLabel = kind[0].toUpperCase() + kind.slice(1);
  return `${operationLabel} ${kindLabel} ${index + 1}`;
}

function FogShapeList({
  scene,
  selectedFogShapeId,
  draggedFogShapeId,
  onDraggedFogShapeIdChange,
  onMoveFogShape,
  onSelectFogShape,
  onRenameFogShape,
  onUpdateFog
}: {
  scene: Scene;
  selectedFogShapeId: string | null;
  draggedFogShapeId: string | null;
  onDraggedFogShapeIdChange: (shapeId: string | null) => void;
  onMoveFogShape: (sourceShapeId: string, targetShapeId: string) => void;
  onSelectFogShape: (shapeId: string | null) => void;
  onRenameFogShape: (shapeId: string, fallbackName: string) => void;
  onUpdateFog: (patch: Partial<FogSettings>) => void;
}) {
  return (
    <div className="layer-detail-controls fog-shape-list" onClick={(event) => event.stopPropagation()}>
      <div className="fog-shape-list-header">
        <span>Fog shapes</span>
        <small>{scene.fog.shapes.length}</small>
      </div>
      {scene.fog.shapes.length > 0 ? (
        <>
          <div className="fog-shape-column-header" aria-hidden="true">
            <span />
            <span />
            <span />
            <span title="GM View">
              <Crown size={13} />
            </span>
            <span title="Player View">
              <User size={13} />
            </span>
            <span />
          </div>
          {scene.fog.shapes.map((shape, shapeIndex) => {
            const isVisibleInGm = shape.visibleInGm ?? shape.visible ?? true;
            const isVisibleInPlayer = shape.visibleInPlayer ?? shape.visible ?? true;
            const fallbackName = formatFogShapeLabel(shape.operation, shape.kind, shapeIndex);
            const label = shape.name?.trim() || fallbackName;
            const isSelected = selectedFogShapeId === shape.id;
            const gmVisibilityButtonClass = [
              "icon-button",
              "fog-shape-action-button",
              isVisibleInGm ? "fog-shape-action-active" : ""
            ]
              .filter(Boolean)
              .join(" ");
            const playerVisibilityButtonClass = [
              "icon-button",
              "fog-shape-action-button",
              isVisibleInPlayer ? "fog-shape-action-active" : ""
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div
                className={[
                  "fog-shape-row",
                  "fog-layer-shape-row",
                  isVisibleInGm || isVisibleInPlayer ? "" : "fog-shape-row-muted",
                  isSelected ? "fog-shape-row-selected" : "",
                  draggedFogShapeId === shape.id ? "fog-shape-row-dragging" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={shape.id}
                draggable
                onClick={() => onSelectFogShape(shape.id)}
                onDragStart={(event) => {
                  onDraggedFogShapeIdChange(shape.id);
                  event.dataTransfer.setData("application/x-localvtt-fog-shape-id", shape.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(event) => {
                  if (!event.dataTransfer.types.includes("application/x-localvtt-fog-shape-id")) {
                    return;
                  }
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourceShapeId = event.dataTransfer.getData("application/x-localvtt-fog-shape-id");
                  if (sourceShapeId) {
                    onMoveFogShape(sourceShapeId, shape.id);
                  }
                  onDraggedFogShapeIdChange(null);
                }}
                onDragEnd={() => onDraggedFogShapeIdChange(null)}
              >
                <GripVertical className="fog-shape-drag-handle" size={14} aria-hidden="true" />
                <span className="fog-shape-kind-icon" title={`${shape.kind} shape`} aria-hidden="true">
                  {getFogShapeIcon(shape.kind)}
                </span>
                <span className="fog-shape-name" title={label} onDoubleClick={() => onRenameFogShape(shape.id, label)}>
                  {label}
                </span>
                <button
                  className={gmVisibilityButtonClass}
                  aria-label={isVisibleInGm ? `Hide ${label} in GM View` : `Show ${label} in GM View`}
                  title={isVisibleInGm ? "Hide in GM View" : "Show in GM View"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateFog({
                      shapes: scene.fog.shapes.map((candidate) =>
                        candidate.id === shape.id
                          ? { ...candidate, visibleInGm: !isVisibleInGm, visible: (!isVisibleInGm || isVisibleInPlayer) }
                          : candidate
                      )
                    });
                  }}
                >
                  {isVisibleInGm ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
                </button>
                <button
                  className={playerVisibilityButtonClass}
                  aria-label={isVisibleInPlayer ? `Hide ${label} in Player View` : `Show ${label} in Player View`}
                  title={isVisibleInPlayer ? "Hide in Player View" : "Show in Player View"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateFog({
                      shapes: scene.fog.shapes.map((candidate) =>
                        candidate.id === shape.id
                          ? { ...candidate, visibleInPlayer: !isVisibleInPlayer, visible: (isVisibleInGm || !isVisibleInPlayer) }
                          : candidate
                      )
                    });
                  }}
                >
                  {isVisibleInPlayer ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
                </button>
                <button
                  className="icon-button fog-shape-action-button danger"
                  aria-label={`Delete ${label}`}
                  title="Delete fog shape"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateFog({ shapes: scene.fog.shapes.filter((candidate) => candidate.id !== shape.id) });
                    if (selectedFogShapeId === shape.id) {
                      onSelectFogShape(null);
                    }
                  }}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </>
      ) : (
        <div className="inline-help">Draw fog reveal or hide shapes from the floating Tools Menu.</div>
      )}
    </div>
  );
}

function TokenSettings({
  token,
  gridSize,
  gridType,
  onUpdateToken,
  onOpenTokenColor
}: {
  token: Token;
  gridSize: number;
  gridType: GridType;
  onUpdateToken: (patch: Partial<Token>) => void;
  onOpenTokenColor: (tokenId: string, value: string, kind: "border" | "glow") => void;
}) {
  const sizePreset = token.sizePreset ?? DEFAULT_TOKEN_SIZE_PRESET;
  const borderColor = token.borderColor ?? DEFAULT_TOKEN_BORDER_COLOR;
  const borderWidth = token.borderWidth ?? DEFAULT_TOKEN_BORDER_WIDTH;
  const borderWidthPreset = token.borderWidthPreset ?? getBorderWidthPreset(borderWidth);
  const borderStyle = token.borderStyle ?? DEFAULT_TOKEN_BORDER_STYLE;
  const glowColor = token.glowColor ?? DEFAULT_TOKEN_GLOW_COLOR;
  const customWidthCells = Math.round((token.size.width / Math.max(1, gridSize)) * 100) / 100;
  const customHeightCells = Math.round((token.size.height / Math.max(1, gridSize)) * 100) / 100;
  const customSizeDisabled = gridType === "hex";

  const updateSizePreset = (preset: TokenSizePreset) => {
    if (preset === "custom") {
      onUpdateToken({ sizePreset: "custom" });
      return;
    }
    onUpdateToken({
      sizePreset: preset,
      size: getTokenSizeForPreset(preset, gridSize, gridType)
    });
  };

  const updateCustomSize = (axis: "width" | "height", cells: number) => {
    const clampedCells = Math.min(10, Math.max(0.25, cells));
    onUpdateToken({
      sizePreset: "custom",
      size: {
        width: axis === "width" ? Math.max(1, gridSize) * clampedCells : token.size.width,
        height: axis === "height" ? Math.max(1, gridSize) * clampedCells : token.size.height
      }
    });
  };

  return (
    <>
      <div className="settings-grid">
        <label className="setting-row">
          <span>Size</span>
          <select value={sizePreset} onChange={(event) => updateSizePreset(event.target.value as TokenSizePreset)}>
            <option value="tiny">Tiny/Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="huge">Huge</option>
            <option value="gargantuan">Gargantuan</option>
            <option value="custom" disabled={customSizeDisabled}>Custom</option>
          </select>
        </label>
        {sizePreset === "custom" && !customSizeDisabled && (
          <div className="setting-row">
            <span>Cells</span>
            <div className="xy-inputs">
              <label>
                W
                <input type="number" min={0.25} max={10} step={0.25} value={customWidthCells} onChange={(event) => updateCustomSize("width", Number(event.target.value))} />
              </label>
              <label>
                H
                <input type="number" min={0.25} max={10} step={0.25} value={customHeightCells} onChange={(event) => updateCustomSize("height", Number(event.target.value))} />
              </label>
            </div>
          </div>
        )}
        <label className="setting-row">
          <span>Mask</span>
          <select value={token.mask ?? DEFAULT_TOKEN_MASK} onChange={(event) => onUpdateToken({ mask: event.target.value as TokenMask })}>
            <option value="circle">Circle</option>
            <option value="square">Square</option>
            <option value="none">None</option>
          </select>
        </label>
        <label className="setting-row">
          <span>Border</span>
          <select
            value={borderStyle}
            onChange={(event) => onUpdateToken({ borderStyle: event.target.value as TokenBorderStyle })}
          >
            <option value="none">None</option>
            <option value="solid">Solid</option>
            <option value="embossed">Embossed</option>
            <option value="inner-shadow">Inner Shadow</option>
            <option value="glow">Glow</option>
          </select>
        </label>
        <ColorSettingRow label="Border Color" value={borderColor} onOpen={() => onOpenTokenColor(token.id, borderColor, "border")} />
        {borderStyle === "glow" && <ColorSettingRow label="Glow Color" value={glowColor} onOpen={() => onOpenTokenColor(token.id, glowColor, "glow")} />}
        <label className="setting-row">
          <span>Border Width</span>
          <select
            value={borderWidthPreset}
            onChange={(event) => {
              const preset = event.target.value as TokenBorderWidthPreset;
              onUpdateToken({
                borderWidthPreset: preset,
                borderWidth: getBorderWidthForPreset(preset, borderWidth)
              });
            }}
          >
            <option value="thin">Thin</option>
            <option value="medium">Medium</option>
            <option value="thick">Thick</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        {borderWidthPreset === "custom" && (
          <label className="setting-row">
            <span>Pixels</span>
            <input
              type="number"
              min={1}
              max={16}
              step={1}
              value={borderWidth}
              onChange={(event) => onUpdateToken({ borderWidth: Math.min(16, Math.max(1, Number(event.target.value))) })}
            />
          </label>
        )}
        <label className="setting-row">
          <span>Footprint</span>
          <label className="fog-operation-switch token-footprint-switch" title="Show token footprint highlight">
            <span>Show</span>
            <input
              aria-label="Show token footprint highlight"
              type="checkbox"
              checked={!(token.footprintVisible ?? DEFAULT_TOKEN_FOOTPRINT_VISIBLE)}
              onChange={(event) => onUpdateToken({ footprintVisible: !event.target.checked })}
            />
            <span>Hide</span>
          </label>
        </label>
      </div>
    </>
  );
}

function TokenList({
  scene,
  tokenAssets,
  selectedTokenId,
  onSelectToken,
  onRenameToken,
  onUpdateToken,
  onUpdateTokens,
  onOpenTokenColor
}: {
  scene: Scene;
  tokenAssets: Map<string, Asset>;
  selectedTokenId: string | null;
  onSelectToken: (tokenId: string | null) => void;
  onRenameToken: (tokenId: string, fallbackName: string) => void;
  onUpdateToken: (tokenId: string, patch: Partial<Token>) => void;
  onUpdateTokens: (tokens: Token[]) => void;
  onOpenTokenColor: (tokenId: string, value: string, kind: "border" | "glow") => void;
}) {
  const [draggedTokenId, setDraggedTokenId] = useState<string | null>(null);
  const [openTokenMenuId, setOpenTokenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!openTokenMenuId) {
      return;
    }
    const closeTokenMenu = (event: globalThis.MouseEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest(".token-menu-wrap")) {
        return;
      }
      setOpenTokenMenuId(null);
    };
    window.addEventListener("mousedown", closeTokenMenu);
    return () => window.removeEventListener("mousedown", closeTokenMenu);
  }, [openTokenMenuId]);

  const moveToken = (sourceTokenId: string, targetTokenId: string) => {
    if (sourceTokenId === targetTokenId) {
      return;
    }
    const sourceIndex = scene.tokens.findIndex((token) => token.id === sourceTokenId);
    const targetIndex = scene.tokens.findIndex((token) => token.id === targetTokenId);
    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }
    const tokens = [...scene.tokens];
    const [sourceToken] = tokens.splice(sourceIndex, 1);
    tokens.splice(targetIndex, 0, sourceToken);
    onUpdateTokens(tokens.map((token, index) => ({ ...token, order: index })));
  };

  return (
    <div className="layer-detail-controls fog-shape-list token-list" onClick={(event) => event.stopPropagation()}>
      <div className="fog-shape-list-header">
        <span>Tokens</span>
        <small>{scene.tokens.length}</small>
      </div>
      {scene.tokens.length > 0 ? (
        <>
          <div className="fog-shape-column-header token-column-header" aria-hidden="true">
            <span />
            <span />
            <span />
            <span title="GM View">
              <Crown size={13} />
            </span>
            <span title="Player View">
              <User size={13} />
            </span>
            <span />
          </div>
          {scene.tokens.map((token, tokenIndex) => {
            const isVisibleInGm = token.visibleInGm ?? !token.hidden;
            const isVisibleInPlayer = token.visibleInPlayer;
            const asset = token.assetId ? tokenAssets.get(token.assetId) : null;
            const assetName = asset?.name;
            const label = token.name?.trim() || assetName || `Token ${tokenIndex + 1}`;
            const isSelected = selectedTokenId === token.id;
            const gmVisibilityButtonClass = [
              "icon-button",
              "fog-shape-action-button",
              isVisibleInGm ? "fog-shape-action-active" : ""
            ]
              .filter(Boolean)
              .join(" ");
            const playerVisibilityButtonClass = [
              "icon-button",
              "fog-shape-action-button",
              isVisibleInPlayer ? "fog-shape-action-active" : ""
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div
                className={[
                  "fog-shape-row",
                  isVisibleInGm || isVisibleInPlayer ? "" : "fog-shape-row-muted",
                  isSelected ? "fog-shape-row-selected" : "",
                  "token-shape-row",
                  draggedTokenId === token.id ? "fog-shape-row-dragging" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={token.id}
                draggable
                onClick={() => onSelectToken(token.id)}
                onDragStart={(event) => {
                  setDraggedTokenId(token.id);
                  event.dataTransfer.setData("application/x-localvtt-token-id", token.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(event) => {
                  if (!event.dataTransfer.types.includes("application/x-localvtt-token-id")) {
                    return;
                  }
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourceTokenId = event.dataTransfer.getData("application/x-localvtt-token-id");
                  if (sourceTokenId) {
                    moveToken(sourceTokenId, token.id);
                  }
                  setDraggedTokenId(null);
                }}
                onDragEnd={() => setDraggedTokenId(null)}
              >
                <GripVertical className="fog-shape-drag-handle" size={14} aria-hidden="true" />
                <TokenRowThumbnail asset={asset ?? null} label={label} />
                <span className="fog-shape-name" title={label} onDoubleClick={() => onRenameToken(token.id, label)}>
                  {label}
                </span>
                <button
                  className={gmVisibilityButtonClass}
                  aria-label={isVisibleInGm ? `Hide ${label} in GM View` : `Show ${label} in GM View`}
                  title={isVisibleInGm ? "Hide in GM View" : "Show in GM View"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateTokens(scene.tokens.map((candidate) => (candidate.id === token.id ? { ...candidate, visibleInGm: !isVisibleInGm } : candidate)));
                  }}
                >
                  {isVisibleInGm ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
                </button>
                <button
                  className={playerVisibilityButtonClass}
                  aria-label={isVisibleInPlayer ? `Hide ${label} in Player View` : `Show ${label} in Player View`}
                  title={isVisibleInPlayer ? "Hide in Player View" : "Show in Player View"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateTokens(scene.tokens.map((candidate) => (candidate.id === token.id ? { ...candidate, visibleInPlayer: !isVisibleInPlayer } : candidate)));
                  }}
                >
                  {isVisibleInPlayer ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
                </button>
                <div className="token-menu-wrap">
                  <button
                    className="icon-button fog-shape-action-button"
                    aria-label={`Open ${label} token menu`}
                    title="Token options"
                    aria-expanded={openTokenMenuId === token.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenTokenMenuId((openId) => (openId === token.id ? null : token.id));
                    }}
                  >
                    <MoreVertical size={14} aria-hidden="true" />
                  </button>
                  {openTokenMenuId === token.id && (
                    <div className="token-settings-menu" onClick={(event) => event.stopPropagation()}>
                      <TokenSettings
                        token={token}
                        gridSize={scene.grid.sizePx}
                        gridType={scene.grid.type}
                        onUpdateToken={(patch) => onUpdateToken(token.id, patch)}
                        onOpenTokenColor={onOpenTokenColor}
                      />
                      <div className="control-divider" />
                      <button
                        className="token-menu-delete"
                        onClick={() => {
                          onUpdateTokens(scene.tokens.filter((candidate) => candidate.id !== token.id));
                          if (selectedTokenId === token.id) {
                            onSelectToken(null);
                          }
                          setOpenTokenMenuId(null);
                        }}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <div className="inline-help">Import token images from the Token Layer.</div>
      )}
    </div>
  );
}

function TokenRowThumbnail({ asset, label }: { asset: Asset | null; label: string }) {
  const previewPath = asset?.thumbnailAbsolutePath ?? asset?.absolutePath;
  return (
    <span className="token-row-thumbnail" title={label} aria-hidden="true">
      {previewPath ? <img src={window.localVtt.toAssetUrl(previewPath)} alt="" draggable={false} /> : <UsersRound size={13} />}
    </span>
  );
}

function getSnappedTokenPosition(position: Point, token: Token, scene: Scene): Point {
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return position;
  }
  if (scene.grid.type === "hex") {
    const center = {
      x: position.x + token.size.width / 2,
      y: position.y + token.size.height / 2
    };
    const snappedCenter = token.sizePreset === "large" ? getNearestHexVertex(center, scene.grid) : getNearestHexCenter(center, scene.grid);
    return {
      x: snappedCenter.x - token.size.width / 2,
      y: snappedCenter.y - token.size.height / 2
    };
  }
  const isHalfCell = token.size.width <= scene.grid.sizePx * 0.75 && token.size.height <= scene.grid.sizePx * 0.75;
  if (isHalfCell) {
    const center = {
      x: position.x + token.size.width / 2,
      y: position.y + token.size.height / 2
    };
    const snappedCenter = getNearestGridCellCenter(center, scene.grid);
    return {
      x: snappedCenter.x - token.size.width / 2,
      y: snappedCenter.y - token.size.height / 2
    };
  }

  return getNearestGridPoint(position, scene.grid);
}

function getNearestHexVertex(point: Point, grid: Scene["grid"]): Point {
  const radius = Math.max(8, grid.sizePx / 2);
  const center = getNearestHexCenter(point, grid);
  let nearest = center;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let side = 0; side < 6; side += 1) {
    const angle = (Math.PI / 180) * (60 * side - 30);
    const vertex = {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    };
    const distance = (vertex.x - point.x) ** 2 + (vertex.y - point.y) ** 2;
    if (distance < nearestDistance) {
      nearest = vertex;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function getNearestGridPoint(point: Point, grid: Scene["grid"]): Point {
  const size = grid.sizePx;
  return {
    x: Math.round((point.x - grid.offsetX) / size) * size + grid.offsetX,
    y: Math.round((point.y - grid.offsetY) / size) * size + grid.offsetY
  };
}

function getNearestGridCellCenter(point: Point, grid: Scene["grid"]): Point {
  const size = grid.sizePx;
  return {
    x: Math.floor((point.x - grid.offsetX) / size) * size + grid.offsetX + size / 2,
    y: Math.floor((point.y - grid.offsetY) / size) * size + grid.offsetY + size / 2
  };
}

function getNearestHexCenter(point: Point, grid: Scene["grid"]): Point {
  const radius = Math.max(8, grid.sizePx / 2);
  const hexWidth = Math.sqrt(3) * radius;
  const rowStep = radius * 1.5;
  const approximateRow = Math.round((point.y - grid.offsetY) / rowStep);
  let nearest = { x: grid.offsetX, y: grid.offsetY };
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let row = approximateRow - 2; row <= approximateRow + 2; row += 1) {
    const rowOffset = row % 2 === 0 ? 0 : hexWidth / 2;
    const approximateColumn = Math.round((point.x - grid.offsetX - rowOffset) / hexWidth);
    for (let column = approximateColumn - 2; column <= approximateColumn + 2; column += 1) {
      const center = {
        x: grid.offsetX + column * hexWidth + rowOffset,
        y: grid.offsetY + row * rowStep
      };
      const distance = (center.x - point.x) ** 2 + (center.y - point.y) ** 2;
      if (distance < nearestDistance) {
        nearest = center;
        nearestDistance = distance;
      }
    }
  }
  return nearest;
}

function getTokenSizeForPreset(preset: TokenSizePreset, gridSize: number, gridType: GridType): Token["size"] {
  const size = Math.max(1, gridSize);
  if (gridType === "hex") {
    const cells = getTokenPresetCells(preset);
    const multiplier = preset === "tiny" ? 0.42 : Math.max(0.72, cells * 0.72);
    return {
      width: size * multiplier,
      height: size * multiplier
    };
  }
  const cells = getTokenPresetCells(preset);
  return {
    width: size * cells,
    height: size * cells
  };
}

function getBorderWidthPreset(width: number): TokenBorderWidthPreset {
  if (width === 3) {
    return "thin";
  }
  if (width === 5) {
    return "medium";
  }
  if (width === 8) {
    return "thick";
  }
  return "custom";
}

function getBorderWidthForPreset(preset: TokenBorderWidthPreset, fallback: number): number {
  switch (preset) {
    case "thin":
      return 3;
    case "medium":
      return 5;
    case "thick":
      return 8;
    case "custom":
      return fallback;
  }
}

function getTokenPresetCells(preset: TokenSizePreset): number {
  switch (preset) {
    case "tiny":
      return 0.5;
    case "large":
      return 2;
    case "huge":
      return 3;
    case "gargantuan":
      return 4;
    case "medium":
    case "custom":
      return 1;
  }
}

function getFogShapeIcon(kind: "brush" | "rectangle" | "polygon" | "circle") {
  if (kind === "brush") {
    return <Paintbrush size={13} />;
  }
  if (kind === "polygon") {
    return <Triangle size={13} />;
  }
  return <Square size={13} />;
}

function getLayerIcon(layer: Layer) {
  switch (layer.kind) {
    case "map":
      return <Image size={16} />;
    case "grid":
      return <Grid3X3 size={16} />;
    case "fog":
      return <CloudFog size={16} />;
    case "weather":
      return <CloudSun size={16} />;
    case "token":
      return <UsersRound size={16} />;
    case "foreground":
      return <Layers size={16} />;
    case "object":
      return <Box size={16} />;
    case "lighting":
      return <Lightbulb size={16} />;
    case "gm":
      return <Shield size={16} />;
    default:
      return <Sparkles size={16} />;
  }
}

function getFitModeHelp(fitMode: MapTransform["fitMode"]): string {
  switch (fitMode) {
    case "manual":
      return "Manual uses the X/Y position, scale, and rotation values directly.";
    case "contain":
      return "Fit contain scales the whole map into view without cropping.";
    case "cover":
      return "Fit cover fills the view and may crop map edges.";
    case "actual-size":
      return "Actual size draws the map at native pixel size and centers it.";
  }
}
