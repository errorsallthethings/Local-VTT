import { ChevronDown, ChevronRight, CircleHelp, Import } from "lucide-react";
import type { Asset, GridSettings, MapTransform, Scene } from "../../../../shared/localvtt";
import { MapAdvancedSettingsSection } from "./MapAdvancedSettingsSection";
import { MapGridSettingsSection } from "./MapGridSettingsSection";
import {
  applyMapFitAction,
  getMapFitHelpText,
  getMapFitModeAction,
  type MapFitAction
} from "./layerPanelMap";

export function MapLayerSettingsPanel({
  scene,
  mapAsset,
  mapFitHelpOpen,
  mapAdvancedOpen,
  onToggleMapFitHelp,
  onToggleMapAdvanced,
  onUpdateGrid,
  onUpdateMapTransform,
  onApplyMapFitPreset,
  onOpenGridColor,
  onImportMap
}: {
  scene: Scene;
  mapAsset: Asset | null;
  mapFitHelpOpen: boolean;
  mapAdvancedOpen: boolean;
  onToggleMapFitHelp: () => void;
  onToggleMapAdvanced: () => void;
  onUpdateGrid: (patch: Partial<GridSettings>) => void;
  onUpdateMapTransform: (patch: Partial<MapTransform>) => void;
  onApplyMapFitPreset: (fitMode: Exclude<MapTransform["fitMode"], "manual">, gridPatch?: Partial<GridSettings>) => void;
  onOpenGridColor: () => void;
  onImportMap: () => void;
}) {
  const dispatchMapFitAction = (action: MapFitAction) => {
    applyMapFitAction(action, { onApplyMapFitPreset, onUpdateGrid, onUpdateMapTransform });
  };

  const renderMapFitControl = () => (
    <div className="setting-row map-fit-mode-row">
      <span className="fog-default-label">
        Fit Preset
        <button
          type="button"
          className="icon-button measurement-help-button"
          aria-label="Map Fit Help"
          title="Map Fit Help"
          onClick={onToggleMapFitHelp}
        >
          <CircleHelp size={15} aria-hidden="true" />
        </button>
      </span>
      <select
        value={scene.mapTransform.fitMode}
        onChange={(event) => {
          dispatchMapFitAction(getMapFitModeAction(event.target.value as MapTransform["fitMode"]));
        }}
      >
        <option value="manual">Manual</option>
        <option value="contain">Fit Whole Map</option>
        <option value="cover">Stretch to Grid</option>
        <option value="actual-size">Image Size</option>
      </select>
    </div>
  );

  return (
    <div className="layer-detail-controls map-layer-controls" onClick={(event) => event.stopPropagation()}>
      <MapGridSettingsSection
        scene={scene}
        mapAsset={mapAsset}
        onApplyMapFitPreset={onApplyMapFitPreset}
        onUpdateGrid={onUpdateGrid}
        onUpdateMapTransform={onUpdateMapTransform}
      />
      <div className="control-divider" />
      <div className="map-settings-section-heading">
        <strong>Map</strong>
        <small>{mapAsset ? "Controls the current map asset and fit preset." : "Import a map asset to enable map fitting and transforms."}</small>
      </div>
      {mapAsset ? (
        <>
          {renderMapFitControl()}
          {mapFitHelpOpen && (
            <div className="settings-help-panel layer-settings-help-panel" role="note">
              {getMapFitHelpText().map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
          )}
        </>
      ) : (
        <button className="import-map-next-step" onClick={onImportMap}>
          <Import size={16} aria-hidden="true" />
          Import Map
        </button>
      )}
      <div className="map-advanced-panel">
        <button type="button" className="map-advanced-toggle" aria-expanded={mapAdvancedOpen} onClick={onToggleMapAdvanced}>
          {mapAdvancedOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
          <strong>Advanced Settings</strong>
        </button>
        {mapAdvancedOpen && (
          <div className="map-advanced-body">
            <MapAdvancedSettingsSection
              scene={scene}
              mapAsset={mapAsset}
              onUpdateGrid={onUpdateGrid}
              onUpdateMapTransform={onUpdateMapTransform}
              onOpenGridColor={onOpenGridColor}
            />
          </div>
        )}
      </div>
    </div>
  );
}
