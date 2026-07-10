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
  assetsById,
  mapAsset,
  contentsExpanded,
  settingsExpanded,
  onApplyMapFitPreset,
  onAddMapVariant,
  onDeleteMap,
  onImportMap,
  onOpenGridColor,
  onRenameMapVariant,
  onReplaceMap,
  onSwitchMapVariant,
  onUpdateGrid,
  onUpdateMapTransform
}: {
  scene: Scene;
  assetsById: Map<string, Asset>;
  mapAsset: Asset | null;
  contentsExpanded: boolean;
  settingsExpanded: boolean;
  onApplyMapFitPreset: (fitMode: Exclude<MapTransform["fitMode"], "manual">, gridPatch?: Partial<GridSettings>) => void;
  onAddMapVariant: (asset: Asset) => void;
  onDeleteMap: (asset: Asset) => void;
  onImportMap: () => void;
  onOpenGridColor: () => void;
  onRenameMapVariant: (variantId: string, fallbackName: string) => void;
  onReplaceMap: (asset: Asset) => void;
  onSwitchMapVariant: (variantId: string) => void;
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
      assetsById={assetsById}
      mapAsset={mapAsset}
      onUpdateGrid={onUpdateGrid}
      onImportMap={onImportMap}
      onAddMapVariant={onAddMapVariant}
      onRenameMapVariant={onRenameMapVariant}
      onReplaceMap={onReplaceMap}
      onSwitchMapVariant={onSwitchMapVariant}
      onDeleteMap={onDeleteMap}
    />
  );
}
