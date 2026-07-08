import { Check, Crown, Grid3X3, Image, Import, Pencil, Plus, RotateCcw, Trash2, User } from "lucide-react";
import type { Asset, GridSettings, Scene } from "../../../../shared/localvtt";
import { getAssetThumbnailPreviewMessage } from "../../../lib/assets";
import { getGridTypeLabel, formatLayerPanelNumber } from "./layerPanelFormat";

export function MapLayerContent({
  scene,
  assetsById,
  mapAsset,
  onUpdateGrid,
  onImportMap,
  onAddMapVariant,
  onRenameMapVariant,
  onReplaceMap,
  onSwitchMapVariant,
  onDeleteMap
}: {
  scene: Scene;
  assetsById: Map<string, Asset>;
  mapAsset: Asset | null;
  onUpdateGrid: (patch: Partial<GridSettings>) => void;
  onImportMap: () => void;
  onAddMapVariant: (asset: Asset) => void;
  onRenameMapVariant: (variantId: string, fallbackName: string) => void;
  onReplaceMap: (asset: Asset) => void;
  onSwitchMapVariant: (variantId: string) => void;
  onDeleteMap: (asset: Asset) => void;
}) {
  const variants = scene.mapVariants
    .map((variant) => ({ variant, asset: assetsById.get(variant.assetId) ?? null }))
    .filter((entry) => entry.asset);
  const displayVariants = variants.length > 0 ? variants : mapAsset ? [{ variant: { id: "primary-map", name: "Primary Map", assetId: mapAsset.id, createdAt: mapAsset.createdAt }, asset: mapAsset }] : [];

  return (
    <div className="layer-detail-controls map-layer-controls" onClick={(event) => event.stopPropagation()}>
      <GridSubLayerRow scene={scene} onUpdateGrid={onUpdateGrid} />
      {mapAsset ? (
        <>
          <div className="map-asset-header">
            <span>Map Variants</span>
            <small>{displayVariants.length}</small>
          </div>
          {displayVariants.map(({ variant, asset }) => {
            const resolvedAsset = asset ?? mapAsset;
            const active = variant.assetId === scene.mapAssetId;
            return (
              <div className={active ? "map-asset-row map-asset-row-active" : "map-asset-row"} key={variant.id}>
                <span className="map-asset-thumbnail" title={getAssetThumbnailPreviewMessage(resolvedAsset) ?? resolvedAsset.name} aria-hidden="true">
                  {resolvedAsset.thumbnailAbsolutePath ? (
                    <img src={window.localVtt.toAssetUrl(resolvedAsset.thumbnailAbsolutePath)} alt="" draggable={false} />
                  ) : (
                    <Image size={14} />
                  )}
                </span>
                <div className="map-asset-summary">
                  <span title={variant.name}>{variant.name}</span>
                  <small>{active ? `Active ${resolvedAsset.mediaType}` : resolvedAsset.mediaType}</small>
                </div>
                <div className="map-asset-actions" aria-label={`${variant.name} actions`}>
                  <button className="icon-button" aria-label={`Switch to ${variant.name}`} title="Set active variant" disabled={active} onClick={() => onSwitchMapVariant(variant.id)}>
                    <Check size={15} aria-hidden="true" />
                  </button>
                  <button className="icon-button" aria-label={`Rename ${variant.name}`} title="Rename variant" onClick={() => onRenameMapVariant(variant.id, variant.name)}>
                    <Pencil size={15} aria-hidden="true" />
                  </button>
                  <button className="icon-button" aria-label={`Replace ${variant.name}`} title="Replace map asset" onClick={() => onReplaceMap(resolvedAsset)}>
                    <RotateCcw size={15} aria-hidden="true" />
                  </button>
                  <button className="icon-button danger" aria-label={`Delete ${variant.name}`} title="Delete map asset" onClick={() => onDeleteMap(resolvedAsset)}>
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
          <button className="import-map-next-step" onClick={() => onAddMapVariant(mapAsset)}>
            <Plus size={16} aria-hidden="true" />
            Add Variant
          </button>
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
