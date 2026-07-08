import type {
  Asset,
  FogSettings,
  GridSettings,
  Layer,
  MapTransform,
  Scene,
  WeatherSettings
} from "../../../../shared/localvtt";
import type { Token } from "../../../../shared/localvtt";
import { DrawingLayerContent } from "./DrawingLayerContent";
import { EffectsLayerContent } from "./EffectsLayerContent";
import { FogLayerContent } from "./FogLayerContent";
import { MapLayerSection } from "./MapLayerSection";
import { TokenLayerContent } from "./TokenLayerContent";
import { isEffectsLayerId } from "./layerPanelFormat";

export function LayerPanelLayerContent({
  areSettingsExpanded,
  assetsById,
  isExpanded,
  layer,
  mapAsset,
  reservedLayerGuidance,
  scene,
  selectedDrawingId,
  selectedDrawingIds,
  selectedEnvironmentEffectId,
  selectedFogShapeId,
  selectedFogShapeIds,
  selectedTokenId,
  selectedTokenIds,
  selectedWeatherMaskId,
  selectedWeatherMaskIds,
  tokenAssets,
  onApplyMapFitPreset,
  onAddMapVariant,
  onDeleteMap,
  onEditEnvironmentEffect,
  onImportMap,
  onImportToken,
  onOpenFogColor,
  onOpenGridColor,
  onOpenTokenColor,
  onRenameEnvironmentEffect,
  onRenameFogShape,
  onRenameMapVariant,
  onRenameToken,
  onReplaceMap,
  onSelectDrawing,
  onSelectEnvironmentEffect,
  onSelectFogShape,
  onSwitchMapVariant,
  onSelectToken,
  onSelectWeatherMask,
  onUpdateDrawings,
  onUpdateEnvironment,
  onUpdateFog,
  onUpdateGrid,
  onUpdateMapTransform,
  onUpdateToken,
  onUpdateTokens,
  onUpdateWeather
}: {
  areSettingsExpanded: boolean;
  assetsById: Map<string, Asset>;
  isExpanded: boolean;
  layer: Layer;
  mapAsset: Asset | null;
  reservedLayerGuidance: string | null;
  scene: Scene;
  selectedDrawingId: string | null;
  selectedDrawingIds: string[];
  selectedEnvironmentEffectId: string | null;
  selectedFogShapeId: string | null;
  selectedFogShapeIds: string[];
  selectedTokenId: string | null;
  selectedTokenIds: string[];
  selectedWeatherMaskId: string | null;
  selectedWeatherMaskIds: string[];
  tokenAssets: Map<string, Asset>;
  onApplyMapFitPreset: (fitMode: Exclude<MapTransform["fitMode"], "manual">, gridPatch?: Partial<GridSettings>) => void;
  onAddMapVariant: (asset: Asset) => void;
  onDeleteMap: (asset: Asset) => void;
  onEditEnvironmentEffect: (effectId: string) => void;
  onImportMap: () => void;
  onImportToken: () => void;
  onOpenFogColor: () => void;
  onOpenGridColor: () => void;
  onOpenTokenColor: (tokenId: string, value: string, kind: "border" | "glow") => void;
  onRenameEnvironmentEffect: (effectId: string, fallbackName: string) => void;
  onRenameFogShape: (shapeId: string, fallbackName: string) => void;
  onRenameMapVariant: (variantId: string, fallbackName: string) => void;
  onRenameToken: (tokenId: string, fallbackName: string) => void;
  onReplaceMap: (asset: Asset) => void;
  onSelectDrawing: (drawingId: string | null) => void;
  onSelectEnvironmentEffect: (effectId: string | null) => void;
  onSelectFogShape: (shapeId: string | null) => void;
  onSwitchMapVariant: (variantId: string) => void;
  onSelectToken: (tokenId: string | null) => void;
  onSelectWeatherMask: (maskId: string | null) => void;
  onUpdateDrawings: (drawings: Scene["drawings"]) => void;
  onUpdateEnvironment: (patch: Partial<Scene["environment"]>) => void;
  onUpdateFog: (patch: Partial<FogSettings>) => void;
  onUpdateGrid: (patch: Partial<GridSettings>) => void;
  onUpdateMapTransform: (patch: Partial<MapTransform>) => void;
  onUpdateToken: (tokenId: string, patch: Partial<Token>) => void;
  onUpdateTokens: (tokens: Token[]) => void;
  onUpdateWeather: (patch: Partial<WeatherSettings>) => void;
}) {
  return (
    <>
      {reservedLayerGuidance && isExpanded && (
        <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
          <div className="layer-empty-state">
            <strong>{layer.name}</strong>
            <span>{reservedLayerGuidance}</span>
          </div>
        </div>
      )}
      {layer.id === "fog" && (
        <FogLayerContent
          scene={scene}
          settingsExpanded={areSettingsExpanded}
          contentsExpanded={isExpanded}
          selectedFogShapeId={selectedFogShapeId}
          selectedFogShapeIds={selectedFogShapeIds}
          onOpenFogColor={onOpenFogColor}
          onSelectFogShape={onSelectFogShape}
          onRenameFogShape={onRenameFogShape}
          onUpdateFog={onUpdateFog}
        />
      )}
      {layer.id === "drawing" && isExpanded && (
        <DrawingLayerContent
          drawings={scene.drawings}
          selectedDrawingId={selectedDrawingId}
          selectedDrawingIds={selectedDrawingIds}
          onSelectDrawing={onSelectDrawing}
          onUpdateDrawings={onUpdateDrawings}
        />
      )}
      {isEffectsLayerId(layer.id) && (
        <EffectsLayerContent
          scene={scene}
          settingsExpanded={areSettingsExpanded}
          contentsExpanded={isExpanded}
          selectedEnvironmentEffectId={selectedEnvironmentEffectId}
          selectedWeatherMaskId={selectedWeatherMaskId}
          selectedWeatherMaskIds={selectedWeatherMaskIds}
          onEditEnvironmentEffect={onEditEnvironmentEffect}
          onRenameEnvironmentEffect={onRenameEnvironmentEffect}
          onSelectEnvironmentEffect={onSelectEnvironmentEffect}
          onSelectWeatherMask={onSelectWeatherMask}
          onUpdateEnvironment={onUpdateEnvironment}
          onUpdateWeather={onUpdateWeather}
        />
      )}
      {layer.id === "token" && isExpanded && (
        <TokenLayerContent
          scene={scene}
          tokenAssets={tokenAssets}
          selectedTokenId={selectedTokenId}
          selectedTokenIds={selectedTokenIds}
          onImportToken={onImportToken}
          onSelectToken={onSelectToken}
          onRenameToken={onRenameToken}
          onUpdateToken={onUpdateToken}
          onUpdateTokens={onUpdateTokens}
          onOpenTokenColor={onOpenTokenColor}
        />
      )}
      {layer.id === "map" && (
        <MapLayerSection
          scene={scene}
          assetsById={assetsById}
          mapAsset={mapAsset}
          contentsExpanded={isExpanded}
          settingsExpanded={areSettingsExpanded}
          onUpdateGrid={onUpdateGrid}
          onUpdateMapTransform={onUpdateMapTransform}
          onApplyMapFitPreset={onApplyMapFitPreset}
          onAddMapVariant={onAddMapVariant}
          onOpenGridColor={onOpenGridColor}
          onImportMap={onImportMap}
          onRenameMapVariant={onRenameMapVariant}
          onReplaceMap={onReplaceMap}
          onSwitchMapVariant={onSwitchMapVariant}
          onDeleteMap={onDeleteMap}
        />
      )}
    </>
  );
}
