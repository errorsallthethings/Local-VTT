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
  selectedTokenId,
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
  onSelectToken,
  onRenameFogShape,
  onRenameToken,
  onOpenFogColor,
  onOpenGridColor,
  onOpenTokenColor
}: {
  activeScene: Scene | null;
  mapAsset: Asset | null;
  tokenAssets: Map<string, Asset>;
  selectedFogShapeId: string | null;
  selectedTokenId: string | null;
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
  onSelectToken: (tokenId: string | null) => void;
  onRenameFogShape: (shapeId: string, fallbackName: string) => void;
  onRenameToken: (tokenId: string, fallbackName: string) => void;
  onOpenFogColor: () => void;
  onOpenGridColor: () => void;
  onOpenTokenColor: (tokenId: string, value: string, kind: "border" | "glow") => void;
}) {
  return (
    <aside className="inspector" onPointerDown={onClearActiveFogTool}>
      <button
        className="icon-button panel-collapse-button inspector-collapse-button"
        aria-label={workspaceLayout.rightCollapsed ? "Expand right inspector" : "Collapse right inspector"}
        title={workspaceLayout.rightCollapsed ? "Expand right inspector" : "Collapse right inspector"}
        onClick={() => onToggleWorkspacePanel("right")}
      >
        {workspaceLayout.rightCollapsed ? <PanelRightOpen size={16} aria-hidden="true" /> : <PanelRightClose size={16} aria-hidden="true" />}
      </button>
      {workspaceLayout.rightCollapsed && <div className="panel-spine-label">Layers</div>}
      {!workspaceLayout.rightCollapsed && (
        <div className="panel-region-content">
          {activeScene ? (
            <>
              <div className="section-heading">
                <h2>Layers</h2>
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
              </div>
              <LayerPanel
                scene={activeScene}
                mapAsset={mapAsset}
                tokenAssets={tokenAssets}
                selectedFogShapeId={selectedFogShapeId}
                selectedTokenId={selectedTokenId}
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
                onSelectToken={onSelectToken}
                onRenameFogShape={onRenameFogShape}
                onRenameToken={onRenameToken}
                onOpenFogColor={onOpenFogColor}
                onOpenGridColor={onOpenGridColor}
                onOpenTokenColor={onOpenTokenColor}
              />

              <div className="section-heading">
                <h2>Phase Placeholders</h2>
              </div>
              <section className="panel">
                <p>Fog, tokens, walls, lights, drawings, measurements, and animated overlays are typed in the scene model and ready for later renderer tools.</p>
              </section>
            </>
          ) : (
            <section className="panel">
              <h2>Ready</h2>
              <p>Create a campaign, add a scene, import a map, then send it to Player View.</p>
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
