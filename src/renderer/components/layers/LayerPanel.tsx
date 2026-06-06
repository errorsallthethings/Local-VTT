import { useEffect, useState, type MouseEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Box,
  CloudFog,
  CloudSun,
  Grid3X3,
  Import,
  Image,
  Layers,
  Lightbulb,
  Eye,
  EyeOff,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  UsersRound
} from "lucide-react";
import type { Asset, FogSettings, GridSettings, GridType, Layer, MapTransform, Scene } from "../../../shared/localvtt";
import { ColorSettingRow } from "../controls/ColorPickerField";
import { DebouncedNumberInput } from "../controls/DebouncedNumberInput";

export function LayerPanel({
  scene,
  mapAsset,
  selectedFogShapeId,
  onChange,
  onUpdateGrid,
  onUpdateFog,
  onUpdateMapTransform,
  onFitGridToMapDimensions,
  onMoveLayer,
  onImportMap,
  onDeleteMap,
  onSelectFogShape,
  onRenameFogShape,
  onOpenFogColor,
  onOpenGridColor
}: {
  scene: Scene;
  mapAsset: Asset | null;
  selectedFogShapeId: string | null;
  onChange: (scene: Scene) => void;
  onUpdateGrid: (patch: Partial<GridSettings>) => void;
  onUpdateFog: (patch: Partial<FogSettings>) => void;
  onUpdateMapTransform: (patch: Partial<MapTransform>) => void;
  onFitGridToMapDimensions: () => void;
  onMoveLayer: (layerId: string, direction: "up" | "down") => void;
  onImportMap: () => void;
  onDeleteMap: (asset: Asset) => void;
  onSelectFogShape: (shapeId: string | null) => void;
  onRenameFogShape: (shapeId: string, fallbackName: string) => void;
  onOpenFogColor: () => void;
  onOpenGridColor: () => void;
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

  const updateLayer = (layerId: string, patch: Partial<Layer>) => {
    const nextGrid =
      layerId === "grid"
        ? {
            ...scene.grid,
            showOnGm: patch.visibleInGm ?? scene.grid.showOnGm,
            showOnPlayer: patch.visibleInPlayer ?? scene.grid.showOnPlayer
          }
        : scene.grid;
    onChange({
      ...scene,
      grid: nextGrid,
      layers: scene.layers.map((layer) => (layer.id === layerId ? { ...layer, ...patch } : layer))
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
          const hasLayerSettings = layer.id === "map" || layer.id === "grid" || layer.id === "fog";
          const hasLayerContents = layer.id === "fog" && scene.fog.shapes.length > 0;
          const isExpanded = hasLayerContents && expandedLayerIds.has(layer.id);
          const areSettingsExpanded = settingsLayerIds.has(layer.id);
          return (
            <div
              className={hasLayerContents ? "layer-row expandable-layer-row" : "layer-row"}
              key={layer.id}
              onClick={(event) => onLayerRowClick(event, layer.id, hasLayerContents)}
            >
              <span className="layer-kind-icon" title={layer.name} aria-hidden="true">
                {getLayerIcon(layer)}
              </span>
              <span className="layer-name" title={layer.name}>
                {layer.name}
              </span>
              <label title="Visible in GM View">
                GM
                <input
                  type="checkbox"
                  checked={layer.visibleInGm}
                  onChange={(event) => updateLayer(layer.id, { visibleInGm: event.target.checked })}
                />
              </label>
              <label title="Visible in Player View">
                Player
                <input
                  type="checkbox"
                  checked={layer.visibleInPlayer}
                  onChange={(event) => updateLayer(layer.id, { visibleInPlayer: event.target.checked })}
                />
              </label>
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
                    Scene starts
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
                  <label className="setting-row checkbox-setting-row">
                    <span>Preview fog on GM View</span>
                    <input
                      type="checkbox"
                      checked={scene.fog.previewOnGm}
                      onChange={(event) => onUpdateFog({ previewOnGm: event.target.checked })}
                    />
                  </label>
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
              {layer.id === "map" && isExpanded && !mapAsset && (
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
        scene.fog.shapes.map((shape, shapeIndex) => {
          const isVisible = shape.visible ?? true;
          const fallbackName = formatFogShapeLabel(shape.operation, shape.kind, shapeIndex);
          const label = shape.name?.trim() || fallbackName;
          const isSelected = selectedFogShapeId === shape.id;
          return (
            <div
              className={[
                "fog-shape-row",
                isVisible ? "" : "fog-shape-row-muted",
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
              <span className="fog-shape-name" title={label} onDoubleClick={() => onRenameFogShape(shape.id, label)}>
                {label}
              </span>
              <button
                className="icon-button"
                aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
                title={isVisible ? "Hide fog shape" : "Show fog shape"}
                onClick={(event) => {
                  event.stopPropagation();
                  onUpdateFog({
                    shapes: scene.fog.shapes.map((candidate) => (candidate.id === shape.id ? { ...candidate, visible: !isVisible } : candidate))
                  });
                }}
              >
                {isVisible ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
              </button>
              <button
                className="icon-button danger"
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
        })
      ) : (
        <div className="inline-help">Draw fog reveal or hide shapes from the floating Tools Menu.</div>
      )}
    </div>
  );
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
