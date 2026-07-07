import { Crown, Grid3X3, Image, Import, RotateCcw, Trash2, User } from "lucide-react";
import type { Asset, GridSettings, Scene } from "../../../../shared/localvtt";
import { getAssetThumbnailPreviewMessage } from "../../../lib/assets";
import { getGridTypeLabel, formatLayerPanelNumber } from "./layerPanelFormat";

export function MapLayerContent({
  scene,
  mapAsset,
  onUpdateGrid,
  onImportMap,
  onReplaceMap,
  onDeleteMap
}: {
  scene: Scene;
  mapAsset: Asset | null;
  onUpdateGrid: (patch: Partial<GridSettings>) => void;
  onImportMap: () => void;
  onReplaceMap: (asset: Asset) => void;
  onDeleteMap: (asset: Asset) => void;
}) {
  return (
    <div className="layer-detail-controls map-layer-controls" onClick={(event) => event.stopPropagation()}>
      <GridSubLayerRow scene={scene} onUpdateGrid={onUpdateGrid} />
      {mapAsset ? (
        <>
          <div className="map-asset-header">
            <span>Map</span>
            <small>1</small>
          </div>
          <div className="map-asset-row">
            <span className="map-asset-thumbnail" title={getAssetThumbnailPreviewMessage(mapAsset) ?? mapAsset.name} aria-hidden="true">
              {mapAsset.thumbnailAbsolutePath ? (
                <img src={window.localVtt.toAssetUrl(mapAsset.thumbnailAbsolutePath)} alt="" draggable={false} />
              ) : (
                <Image size={14} />
              )}
            </span>
            <div className="map-asset-summary">
              <span title={mapAsset.name}>{mapAsset.name}</span>
              <small>{mapAsset.mediaType}</small>
            </div>
            <div className="map-asset-actions" aria-label="Map asset actions">
              <button className="icon-button" aria-label="Replace map asset" title="Replace map asset" onClick={() => onReplaceMap(mapAsset)}>
                <RotateCcw size={15} aria-hidden="true" />
              </button>
              <button className="icon-button danger" aria-label="Delete map asset" title="Delete map asset" onClick={() => onDeleteMap(mapAsset)}>
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="layer-empty-state">
            <strong>Map Asset</strong>
            <span>Import a map asset here, or open settings to configure the grid before adding a map.</span>
          </div>
          <button className="import-map-next-step" onClick={onImportMap}>
            <Import size={16} aria-hidden="true" />
            Import Map
          </button>
        </>
      )}
    </div>
  );
}

function GridSubLayerRow({
  scene,
  onUpdateGrid
}: {
  scene: Scene;
  onUpdateGrid: (patch: Partial<GridSettings>) => void;
}) {
  return (
    <div className="map-sub-layer-row">
      <span className="map-sub-layer-icon" aria-hidden="true">
        <Grid3X3 size={14} />
      </span>
      <div className="map-sub-layer-summary">
        <strong>Grid</strong>
        <small>
          {scene.grid.type === "gridless"
            ? "Gridless"
            : `${getGridTypeLabel(scene.grid.type)} - ${scene.grid.mapGridColumns} x ${scene.grid.mapGridRows} at ${formatLayerPanelNumber(scene.grid.sizePx)}px`}
        </small>
      </div>
      <div className="grid-visibility-controls" aria-label="Grid visibility">
        <button
          type="button"
          className={scene.grid.showOnGm ? "icon-button layer-visibility-button layer-visibility-active" : "icon-button layer-visibility-button"}
          aria-label={scene.grid.showOnGm ? "Hide grid on GM View" : "Show grid on GM View"}
          aria-pressed={scene.grid.showOnGm}
          title={scene.grid.showOnGm ? "Hide grid on GM View" : "Show grid on GM View"}
          onClick={() => onUpdateGrid({ showOnGm: !scene.grid.showOnGm })}
        >
          <Crown size={14} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={scene.grid.showOnPlayer ? "icon-button layer-visibility-button layer-visibility-active" : "icon-button layer-visibility-button"}
          aria-label={scene.grid.showOnPlayer ? "Hide grid on Player View" : "Show grid on Player View"}
          aria-pressed={scene.grid.showOnPlayer}
          title={scene.grid.showOnPlayer ? "Hide grid on Player View" : "Show grid on Player View"}
          onClick={() => onUpdateGrid({ showOnPlayer: !scene.grid.showOnPlayer })}
        >
          <User size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
