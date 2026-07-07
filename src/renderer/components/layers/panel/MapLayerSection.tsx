import { useState } from "react";
import type { Asset, GridSettings, MapTransform, Scene } from "../../../../shared/localvtt";
import { MapLayerContent } from "./MapLayerContent";
import { MapLayerSettingsPanel } from "./MapLayerSettingsPanel";

export type MapLayerSectionMode = "closed" | "contents" | "settings";

export function getMapLayerSectionMode(contentsExpanded: boolean, settingsExpanded: boolean): MapLayerSectionMode {
  if (settingsExpanded) {
    return "settings";
  }
  return contentsExpanded ? "contents" : "closed";
}

export function MapLayerSection({
  scene,
  mapAsset,
  contentsExpanded,
  settingsExpanded,
  onApplyMapFitPreset,
  onDeleteMap,
  onImportMap,
  onOpenGridColor,
  onReplaceMap,
  onUpdateGrid,
  onUpdateMapTransform
}: {
  scene: Scene;
  mapAsset: Asset | null;
  contentsExpanded: boolean;
  settingsExpanded: boolean;
  onApplyMapFitPreset: (fitMode: Exclude<MapTransform["fitMode"], "manual">, gridPatch?: Partial<GridSettings>) => void;
  onDeleteMap: (asset: Asset) => void;
  onImportMap: () => void;
  onOpenGridColor: () => void;
  onReplaceMap: (asset: Asset) => void;
  onUpdateGrid: (patch: Partial<GridSettings>) => void;
  onUpdateMapTransform: (patch: Partial<MapTransform>) => void;
}) {
  const [mapFitHelpOpen, setMapFitHelpOpen] = useState(false);
  const [mapAdvancedOpen, setMapAdvancedOpen] = useState(false);
  const mode = getMapLayerSectionMode(contentsExpanded, settingsExpanded);

  if (mode === "closed") {
    return null;
  }

  if (mode === "settings") {
    return (
      <MapLayerSettingsPanel
        scene={scene}
        mapAsset={mapAsset}
        mapFitHelpOpen={mapFitHelpOpen}
        mapAdvancedOpen={mapAdvancedOpen}
        onToggleMapFitHelp={() => setMapFitHelpOpen((open) => !open)}
        onToggleMapAdvanced={() => setMapAdvancedOpen((open) => !open)}
        onUpdateGrid={onUpdateGrid}
        onUpdateMapTransform={onUpdateMapTransform}
        onApplyMapFitPreset={onApplyMapFitPreset}
        onOpenGridColor={onOpenGridColor}
        onImportMap={onImportMap}
      />
    );
  }

  return (
    <MapLayerContent
      scene={scene}
      mapAsset={mapAsset}
      onUpdateGrid={onUpdateGrid}
      onImportMap={onImportMap}
      onReplaceMap={onReplaceMap}
      onDeleteMap={onDeleteMap}
    />
  );
}
