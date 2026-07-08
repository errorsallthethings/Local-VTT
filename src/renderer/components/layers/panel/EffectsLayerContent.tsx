import { useState, type ComponentProps } from "react";
import type { Scene, WeatherSettings, WeatherTuningSettings } from "../../../../shared/localvtt";
import type { ActiveWeatherCategory } from "../../../lib/effects";
import { EnvironmentEffectList } from "./EnvironmentEffectList";
import { WeatherMaskList } from "./WeatherMaskList";
import { WeatherSettingsPanel } from "./WeatherSettingsPanel";
import {
  getWeatherWithCategoryToggled,
  getWeatherWithDriftReset,
  getWeatherWithPresetPack,
  getWeatherWithSelectedEffect,
  getWeatherWithTuningPatch,
  getWeatherWithTuningReset,
  type WeatherPresetPackId,
  type WeatherTuningKey
} from "./layerPanelWeather";

export function getExpandedWeatherCategoryAfterToggle(
  expandedCategory: ActiveWeatherCategory | null,
  toggledCategory: ActiveWeatherCategory,
  enabled: boolean
): ActiveWeatherCategory | null {
  return !enabled && expandedCategory === toggledCategory ? null : expandedCategory;
}

export function EffectsLayerContent({
  scene,
  settingsExpanded,
  contentsExpanded,
  selectedEnvironmentEffectId,
  selectedWeatherMaskId,
  selectedWeatherMaskIds,
  onEditEnvironmentEffect,
  onRenameEnvironmentEffect,
  onSelectEnvironmentEffect,
  onSelectWeatherMask,
  onUpdateEnvironment,
  onUpdateWeather
}: {
  scene: Scene;
  settingsExpanded: boolean;
  contentsExpanded: boolean;
  selectedEnvironmentEffectId: string | null;
  selectedWeatherMaskId: string | null;
  selectedWeatherMaskIds: string[];
  onEditEnvironmentEffect: (effectId: string) => void;
  onRenameEnvironmentEffect: (effectId: string, fallbackName: string) => void;
  onSelectEnvironmentEffect: (effectId: string | null) => void;
  onSelectWeatherMask: (maskId: string | null) => void;
  onUpdateEnvironment: (patch: Partial<Scene["environment"]>) => void;
  onUpdateWeather: (patch: Partial<WeatherSettings>) => void;
}) {
  const [expandedWeatherCategory, setExpandedWeatherCategory] = useState<ActiveWeatherCategory | null>(null);
  const [selectedWeatherPresetPack, setSelectedWeatherPresetPack] = useState<WeatherPresetPackId | "">("");

  const clearSelectedWeatherPresetPack = () => {
    setSelectedWeatherPresetPack("");
  };

  const toggleWeatherCategory = (category: ActiveWeatherCategory, enabled: boolean) => {
    clearSelectedWeatherPresetPack();
    onUpdateWeather(getWeatherWithCategoryToggled(scene.weather, category, enabled));
    setExpandedWeatherCategory((expandedCategory) => getExpandedWeatherCategoryAfterToggle(expandedCategory, category, enabled));
  };

  const selectWeatherEffect: ComponentProps<typeof WeatherSettingsPanel>["onSelectWeatherEffect"] = (category, effect) => {
    clearSelectedWeatherPresetPack();
    onUpdateWeather(getWeatherWithSelectedEffect(scene.weather, category, effect));
  };

  const updateWeatherTuning = (category: ActiveWeatherCategory, patch: Partial<WeatherTuningSettings>) => {
    clearSelectedWeatherPresetPack();
    onUpdateWeather(getWeatherWithTuningPatch(scene.weather, category, patch));
  };

  const resetWeatherTuning = (category: ActiveWeatherCategory, key: WeatherTuningKey) => {
    clearSelectedWeatherPresetPack();
    onUpdateWeather(getWeatherWithTuningReset(scene.weather, category, key));
  };

  const resetWeatherDrift = (category: ActiveWeatherCategory) => {
    clearSelectedWeatherPresetPack();
    onUpdateWeather(getWeatherWithDriftReset(scene.weather, category));
  };

  const applyWeatherPresetPack = (presetId: WeatherPresetPackId) => {
    const weather = getWeatherWithPresetPack(scene.weather, presetId);
    setSelectedWeatherPresetPack(presetId);
    onUpdateWeather(weather);
    const expandedCategory = (["rain", "fog", "snow", "sand"] as ActiveWeatherCategory[]).find((category) => weather.effects[category].enabled) ?? null;
    setExpandedWeatherCategory(expandedCategory);
  };

  const resetWeatherPresetPack = () => {
    clearSelectedWeatherPresetPack();
  };

  return (
    <>
      {settingsExpanded && (
        <WeatherSettingsPanel
          weather={scene.weather}
          selectedWeatherPresetPack={selectedWeatherPresetPack}
          expandedWeatherCategory={expandedWeatherCategory}
          onExpandedWeatherCategoryChange={setExpandedWeatherCategory}
          onToggleWeatherCategory={toggleWeatherCategory}
          onSelectWeatherEffect={selectWeatherEffect}
          onApplyWeatherPresetPack={applyWeatherPresetPack}
          onResetWeatherPresetPack={resetWeatherPresetPack}
          onUpdateWeatherTuning={updateWeatherTuning}
          onResetWeatherTuning={resetWeatherTuning}
          onResetWeatherDrift={resetWeatherDrift}
        />
      )}
      {contentsExpanded && !settingsExpanded && (
        <>
          <EnvironmentEffectList
            scene={scene}
            selectedEnvironmentEffectId={selectedEnvironmentEffectId}
            onSelectEnvironmentEffect={onSelectEnvironmentEffect}
            onEditEnvironmentEffect={onEditEnvironmentEffect}
            onRenameEnvironmentEffect={onRenameEnvironmentEffect}
            onUpdateEnvironment={onUpdateEnvironment}
          />
          <WeatherMaskList
            scene={scene}
            selectedWeatherMaskId={selectedWeatherMaskId}
            selectedWeatherMaskIds={selectedWeatherMaskIds}
            onSelectWeatherMask={onSelectWeatherMask}
            onUpdateWeather={onUpdateWeather}
          />
        </>
      )}
    </>
  );
}
