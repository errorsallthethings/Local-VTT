import { type PointerEvent as ReactPointerEvent } from "react";
import { GripVertical, Lock, PanelRightClose, PanelRightOpen, Unlock } from "lucide-react";
import type { Asset, FogSettings, GridSettings, MapTransform, Scene } from "../../shared/localvtt";
import { LayerPanel } from "../components/layers/LayerPanel";
import type { WorkspaceLayout } from "../lib/workspaceLayout";

export function GmInspector({
  activeScene,
  mapAsset,
  tokenAssets,
  selectedFogShapeId,
  selectedWeatherMaskId,
  selectedEnvironmentEffectId,
  selectedDrawingId,
  selectedTokenId,
  selectedFogShapeIds,
  selectedWeatherMaskIds,
  selectedDrawingIds,
  selectedTokenIds,
  workspaceLayout,
  onClearActiveFogTool,
  onToggleWorkspacePanel,
  onResetPanelWidth,
  onStartPanelResize,
  onSetLayerOrderLocked,
  onChangeScene,
  onUpdateGrid,
  onUpdateFog,
  onUpdateMapTransform,
  onFitGridToMapDimensions,
  onMoveLayer,
  onImportMap,
  onImportToken,
  onDeleteMap,
  onSelectFogShape,
  onSelectWeatherMask,
  onSelectEnvironmentEffect,
  onEditEnvironmentEffect,
  onSelectDrawing,
  onSelectToken,
  onRenameFogShape,
  onRenameEnvironmentEffect,
  onRenameToken,
  onOpenFogColor,
  onOpenGridColor,
  onOpenTokenColor
}: {
  activeScene: Scene | null;
  mapAsset: Asset | null;
  tokenAssets: Map<string, Asset>;
  selectedFogShapeId: string | null;
  selectedWeatherMaskId: string | null;
  selectedEnvironmentEffectId: string | null;
  selectedDrawingId: string | null;
  selectedTokenId: string | null;
  selectedFogShapeIds: string[];
  selectedWeatherMaskIds: string[];
  selectedDrawingIds: string[];
  selectedTokenIds: string[];
  workspaceLayout: WorkspaceLayout;
  onClearActiveFogTool: () => void;
  onToggleWorkspacePanel: (side: "right") => void;
  onResetPanelWidth: (side: "right") => void;
  onStartPanelResize: (side: "right", event: ReactPointerEvent<HTMLButtonElement>) => void;
  onSetLayerOrderLocked: (locked: boolean) => void;
  onChangeScene: (scene: Scene) => void;
  onUpdateGrid: (patch: Partial<GridSettings>) => void;
  onUpdateFog: (patch: Partial<FogSettings>) => void;
  onUpdateMapTransform: (patch: Partial<MapTransform>) => void;
  onFitGridToMapDimensions: () => void;
  onMoveLayer: (layerId: string, direction: "up" | "down") => void;
  onImportMap: () => void;
  onImportToken: () => void;
  onDeleteMap: (asset: Asset) => void;
  onSelectFogShape: (shapeId: string | null) => void;
  onSelectWeatherMask: (maskId: string | null) => void;
  onSelectEnvironmentEffect: (effectId: string | null) => void;
  onEditEnvironmentEffect: (effectId: string) => void;
  onSelectDrawing: (drawingId: string | null) => void;
  onSelectToken: (tokenId: string | null) => void;
  onRenameFogShape: (shapeId: string, fallbackName: string) => void;
  onRenameEnvironmentEffect: (effectId: string, fallbackName: string) => void;
  onRenameToken: (tokenId: string, fallbackName: string) => void;
  onOpenFogColor: () => void;
  onOpenGridColor: () => void;
  onOpenTokenColor: (tokenId: string, value: string, kind: "border" | "glow") => void;
}) {
  return (
    <aside
      className={`inspector ${workspaceLayout.rightCollapsed ? "panel-collapsed-click-target" : ""}`}
      onClick={() => {
        if (workspaceLayout.rightCollapsed) {
          onToggleWorkspacePanel("right");
        }
      }}
      onPointerDown={onClearActiveFogTool}
    >
      <button
        className="icon-button panel-collapse-button inspector-collapse-button"
        aria-label={workspaceLayout.rightCollapsed ? "Expand right inspector" : "Collapse right inspector"}
        title={workspaceLayout.rightCollapsed ? "Expand right inspector" : "Collapse right inspector"}
        onClick={(event) => {
          event.stopPropagation();
          onToggleWorkspacePanel("right");
        }}
      >
        {workspaceLayout.rightCollapsed ? <PanelRightOpen size={16} aria-hidden="true" /> : <PanelRightClose size={16} aria-hidden="true" />}
      </button>
      {workspaceLayout.rightCollapsed && <div className="panel-spine-label">Scene Layers</div>}
      {!workspaceLayout.rightCollapsed && (
        <div className="panel-region-content">
          <div className="section-heading">
            <h2>Scene Layers</h2>
            {activeScene && (
              <div className="section-actions">
                  <button
                    className="icon-button"
                    aria-label={activeScene.layerOrderLocked ? "Unlock layer order" : "Lock layer order"}
                    title={activeScene.layerOrderLocked ? "Unlock layer order" : "Lock layer order"}
                    onClick={() => onSetLayerOrderLocked(!activeScene.layerOrderLocked)}
                  >
                    {activeScene.layerOrderLocked ? <Lock size={15} aria-hidden="true" /> : <Unlock size={15} aria-hidden="true" />}
                  </button>
              </div>
            )}
          </div>
          {activeScene ? (
            <>
              <LayerPanel
                scene={activeScene}
                mapAsset={mapAsset}
                tokenAssets={tokenAssets}
                selectedFogShapeId={selectedFogShapeId}
                selectedWeatherMaskId={selectedWeatherMaskId}
                selectedEnvironmentEffectId={selectedEnvironmentEffectId}
                selectedDrawingId={selectedDrawingId}
                selectedTokenId={selectedTokenId}
                selectedFogShapeIds={selectedFogShapeIds}
                selectedWeatherMaskIds={selectedWeatherMaskIds}
                selectedDrawingIds={selectedDrawingIds}
                selectedTokenIds={selectedTokenIds}
                onChange={onChangeScene}
                onUpdateGrid={onUpdateGrid}
                onUpdateFog={onUpdateFog}
                onUpdateMapTransform={onUpdateMapTransform}
                onFitGridToMapDimensions={onFitGridToMapDimensions}
                onMoveLayer={onMoveLayer}
                onImportMap={onImportMap}
                onImportToken={onImportToken}
                onDeleteMap={onDeleteMap}
                onSelectFogShape={onSelectFogShape}
                onSelectWeatherMask={onSelectWeatherMask}
                onSelectEnvironmentEffect={onSelectEnvironmentEffect}
                onEditEnvironmentEffect={onEditEnvironmentEffect}
                onSelectDrawing={onSelectDrawing}
                onSelectToken={onSelectToken}
                onRenameFogShape={onRenameFogShape}
                onRenameEnvironmentEffect={onRenameEnvironmentEffect}
                onRenameToken={onRenameToken}
                onOpenFogColor={onOpenFogColor}
                onOpenGridColor={onOpenGridColor}
                onOpenTokenColor={onOpenTokenColor}
              />
            </>
          ) : (
            <section className="panel">
              <div className="layer-empty-state">
                <strong>No Scene Selected</strong>
                <span>Scene layers will appear once a campaign is open and a scene is selected.</span>
              </div>
            </section>
          )}
        </div>
      )}
      {!workspaceLayout.rightCollapsed && (
        <button
          className="panel-resize-handle panel-resize-handle-right"
          aria-label="Resize right inspector"
          title="Drag to resize. Double-click to reset."
          onDoubleClick={() => onResetPanelWidth("right")}
          onPointerDown={(event) => onStartPanelResize("right", event)}
        >
          <GripVertical size={14} aria-hidden="true" />
        </button>
      )}
    </aside>
  );
}
