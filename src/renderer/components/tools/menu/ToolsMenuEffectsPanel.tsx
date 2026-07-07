import type { ReactNode } from "react";
import { Circle, Pentagon, Square, Undo2, type LucideIcon } from "lucide-react";
import type { EnvironmentEffectType } from "../../../../shared/localvtt";
import type {
  AcidEffectTuning,
  ArcaneEffectTuning,
  ChaosEffectTuning,
  ColdEffectTuning,
  DarknessEffectTuning,
  DistortionEffectTuning,
  FireEffectTuning,
  FogEffectTuning,
  ForceFieldEffectTuning,
  LavaEffectTuning,
  LightningEffectTuning,
  NatureEffectTuning,
  PoisonEffectTuning,
  RadiantEffectTuning,
  ShockwaveEffectTuning,
  SmokeEffectTuning,
  VoidEffectTuning,
  WaterEffectTuning
} from "../../../canvas/effects";
import { AcidEffectTuningPanel, ArcaneEffectTuningPanel, ChaosEffectTuningPanel, ColdEffectTuningPanel, DarknessEffectTuningPanel, DistortionEffectTuningPanel, FireEffectTuningPanel, FogEffectTuningPanel, ForceFieldEffectTuningPanel, LavaEffectTuningPanel, LightningEffectTuningPanel, NatureEffectTuningPanel, PoisonEffectTuningPanel, RadiantEffectTuningPanel, ShockwaveEffectTuningPanel, SmokeEffectTuningPanel, VoidEffectTuningPanel, WaterEffectTuningPanel } from "../effects/EnvironmentEffectTuningPanels";
import { ToolHelpCard, type ToolHelpTopic } from "../settings/ToolHelpCard";
import {
  ENVIRONMENT_EFFECT_FEATHER_OPTIONS,
  ENVIRONMENT_EFFECT_OPTIONS,
  formatEnvironmentEffectOptionLabel,
  getEnvironmentEffectFeatherSelectValue,
  getEnvironmentEffectPresetOptions
} from "../../../lib/effects";
import { HelpButton, ToolButton } from "./ToolsMenuPrimitives";
import type { EnvironmentEffectTool, WeatherMaskTool } from "./toolMenuState";

export interface WeatherMaskButtonDefinition {
  tool: WeatherMaskTool;
  label: string;
  icon: LucideIcon;
}

export interface EnvironmentEffectToolButtonDefinition {
  tool: EnvironmentEffectTool;
  label: string;
  icon: LucideIcon;
}

export const WEATHER_MASK_BUTTONS: WeatherMaskButtonDefinition[] = [
  { tool: "rectangle", label: "Rectangle Weather Mask", icon: Square },
  { tool: "circle", label: "Circle Weather Mask", icon: Circle },
  { tool: "polygon", label: "Polygon Weather Mask", icon: Pentagon }
];

export const ENVIRONMENT_EFFECT_TOOL_BUTTONS: EnvironmentEffectToolButtonDefinition[] = [
  { tool: "circle", label: "Radius Animated Effect", icon: Circle },
  { tool: "rectangle", label: "Rectangle Animated Effect", icon: Square },
  { tool: "polygon", label: "Polygon Animated Effect", icon: Pentagon }
];

export function getNextEffectsHelpTopic(currentTopic: ToolHelpTopic | null): ToolHelpTopic | null {
  return currentTopic === "effects" ? null : "effects";
}

export interface EnvironmentEffectTuningState {
  acidEffectTuning: AcidEffectTuning;
  coldEffectTuning: ColdEffectTuning;
  darknessEffectTuning: DarknessEffectTuning;
  poisonEffectTuning: PoisonEffectTuning;
  waterEffectTuning: WaterEffectTuning;
  lavaEffectTuning: LavaEffectTuning;
  fireEffectTuning: FireEffectTuning;
  lightningEffectTuning: LightningEffectTuning;
  arcaneEffectTuning: ArcaneEffectTuning;
  chaosEffectTuning: ChaosEffectTuning;
  voidEffectTuning: VoidEffectTuning;
  natureEffectTuning: NatureEffectTuning;
  distortionEffectTuning: DistortionEffectTuning;
  radiantEffectTuning: RadiantEffectTuning;
  forceFieldEffectTuning: ForceFieldEffectTuning;
  shockwaveEffectTuning: ShockwaveEffectTuning;
  smokeEffectTuning: SmokeEffectTuning;
  fogEffectTuning: FogEffectTuning;
}

export interface EnvironmentEffectTuningChangeHandlers {
  onAcidEffectTuningChange: (tuning: AcidEffectTuning) => void;
  onColdEffectTuningChange: (tuning: ColdEffectTuning) => void;
  onDarknessEffectTuningChange: (tuning: DarknessEffectTuning) => void;
  onPoisonEffectTuningChange: (tuning: PoisonEffectTuning) => void;
  onWaterEffectTuningChange: (tuning: WaterEffectTuning) => void;
  onLavaEffectTuningChange: (tuning: LavaEffectTuning) => void;
  onFireEffectTuningChange: (tuning: FireEffectTuning) => void;
  onLightningEffectTuningChange: (tuning: LightningEffectTuning) => void;
  onArcaneEffectTuningChange: (tuning: ArcaneEffectTuning) => void;
  onChaosEffectTuningChange: (tuning: ChaosEffectTuning) => void;
  onVoidEffectTuningChange: (tuning: VoidEffectTuning) => void;
  onNatureEffectTuningChange: (tuning: NatureEffectTuning) => void;
  onDistortionEffectTuningChange: (tuning: DistortionEffectTuning) => void;
  onRadiantEffectTuningChange: (tuning: RadiantEffectTuning) => void;
  onForceFieldEffectTuningChange: (tuning: ForceFieldEffectTuning) => void;
  onShockwaveEffectTuningChange: (tuning: ShockwaveEffectTuning) => void;
  onSmokeEffectTuningChange: (tuning: SmokeEffectTuning) => void;
  onFogEffectTuningChange: (tuning: FogEffectTuning) => void;
}

interface EnvironmentEffectsPanelProps {
  activeWeatherMaskTool: WeatherMaskTool | null;
  activeEnvironmentEffectTool: EnvironmentEffectTool | null;
  environmentEffectType: EnvironmentEffectType;
  environmentEffectFeather: number;
  environmentEffectPresetValue: string;
  weatherToolsEnabled: boolean;
  weatherMaskCount: number;
  environmentEffectCount: number;
  helpTopic: ToolHelpTopic | null;
  tuning: EnvironmentEffectTuningState;
  onWeatherMaskToolChange: (tool: WeatherMaskTool) => void;
  onEnvironmentEffectToolChange: (tool: EnvironmentEffectTool) => void;
  onUndoWeatherMask: () => void;
  onUndoEnvironmentEffect: () => void;
  onEnvironmentEffectTypeChange: (effect: EnvironmentEffectType) => void;
  onEnvironmentEffectFeatherChange: (feather: number) => void;
  onEnvironmentEffectPresetValueChange: (presetValue: string) => void;
  onEnvironmentEffectPresetApply: (presetValue: string) => void;
  onEnvironmentEffectTuningReset: () => void;
  onTuningChange: EnvironmentEffectTuningChangeHandlers;
  onHelpTopicChange: (topic: ToolHelpTopic | null) => void;
}

export function EnvironmentEffectsPanel({
  activeWeatherMaskTool,
  activeEnvironmentEffectTool,
  environmentEffectType,
  environmentEffectFeather,
  environmentEffectPresetValue,
  weatherToolsEnabled,
  weatherMaskCount,
  environmentEffectCount,
  helpTopic,
  tuning,
  onWeatherMaskToolChange,
  onEnvironmentEffectToolChange,
  onUndoWeatherMask,
  onUndoEnvironmentEffect,
  onEnvironmentEffectTypeChange,
  onEnvironmentEffectFeatherChange,
  onEnvironmentEffectPresetValueChange,
  onEnvironmentEffectPresetApply,
  onEnvironmentEffectTuningReset,
  onTuningChange,
  onHelpTopicChange
}: EnvironmentEffectsPanelProps) {
  return (
    <div className="tools-panel-section">
      <HelpButton active={helpTopic === "effects"} label="Effects Tools Help" onClick={() => onHelpTopicChange(getNextEffectsHelpTopic(helpTopic))} />
      <div className="tools-section-label">Weather Masks</div>
      {!weatherToolsEnabled && <span className="tools-section-note">Enable scene weather to use weather masks.</span>}
      <div className="tools-button-row">
        {WEATHER_MASK_BUTTONS.map((button) => {
          const Icon = button.icon;
          return (
            <ToolButton key={button.tool} active={activeWeatherMaskTool === button.tool} label={button.label} disabled={!weatherToolsEnabled} onClick={() => onWeatherMaskToolChange(button.tool)}>
              <Icon size={17} aria-hidden="true" />
            </ToolButton>
          );
        })}
        <span className="tools-vertical-divider" aria-hidden="true" />
        <ToolButton label="Undo Last Weather Mask" disabled={!weatherToolsEnabled || weatherMaskCount === 0} onClick={onUndoWeatherMask}>
          <Undo2 size={17} aria-hidden="true" />
        </ToolButton>
      </div>
      <div className="tools-section-divider" />
      <div className="tools-section-label">Animated Effects</div>
      <div className="tools-button-row">
        {ENVIRONMENT_EFFECT_TOOL_BUTTONS.map((button) => {
          const Icon = button.icon;
          return (
            <ToolButton key={button.tool} active={activeEnvironmentEffectTool === button.tool} label={button.label} onClick={() => onEnvironmentEffectToolChange(button.tool)}>
              <Icon size={17} aria-hidden="true" />
            </ToolButton>
          );
        })}
        <span className="tools-vertical-divider" aria-hidden="true" />
        <ToolButton label="Undo Last Animated Effect" disabled={environmentEffectCount === 0} onClick={onUndoEnvironmentEffect}>
          <Undo2 size={17} aria-hidden="true" />
        </ToolButton>
      </div>
      <EnvironmentEffectSettings
        environmentEffectType={environmentEffectType}
        environmentEffectFeather={environmentEffectFeather}
        environmentEffectPresetValue={environmentEffectPresetValue}
        onEnvironmentEffectTypeChange={onEnvironmentEffectTypeChange}
        onEnvironmentEffectFeatherChange={onEnvironmentEffectFeatherChange}
        onEnvironmentEffectPresetValueChange={onEnvironmentEffectPresetValueChange}
        onEnvironmentEffectPresetApply={onEnvironmentEffectPresetApply}
      />
      <EnvironmentEffectTuning
        environmentEffectType={environmentEffectType}
        tuning={tuning}
        onReset={onEnvironmentEffectTuningReset}
        onTuningChange={onTuningChange}
      />
      {helpTopic === "effects" && <ToolHelpCard topic="effects" />}
    </div>
  );
}

function EnvironmentEffectSettings({
  environmentEffectType,
  environmentEffectFeather,
  environmentEffectPresetValue,
  onEnvironmentEffectTypeChange,
  onEnvironmentEffectFeatherChange,
  onEnvironmentEffectPresetValueChange,
  onEnvironmentEffectPresetApply
}: {
  environmentEffectType: EnvironmentEffectType;
  environmentEffectFeather: number;
  environmentEffectPresetValue: string;
  onEnvironmentEffectTypeChange: (effect: EnvironmentEffectType) => void;
  onEnvironmentEffectFeatherChange: (feather: number) => void;
  onEnvironmentEffectPresetValueChange: (presetValue: string) => void;
  onEnvironmentEffectPresetApply: (presetValue: string) => void;
}) {
  return (
    <>
      <div className="tools-section-divider" />
      <div className="tools-section-label">Settings</div>
      <div className="tools-effect-select-row">
        <div className="tools-strip-select-field">
          <strong>Effect</strong>
          <div>
            <select
              aria-label="Animated effect type"
              title="Animated effect type"
              value={environmentEffectType}
              onChange={(event) => onEnvironmentEffectTypeChange(event.target.value as EnvironmentEffectType)}
            >
              {ENVIRONMENT_EFFECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="tools-strip-select-field">
          <strong>Preset</strong>
          <div>
            <select
              aria-label={`${formatEnvironmentEffectOptionLabel(environmentEffectType)} effect preset`}
              title={`${formatEnvironmentEffectOptionLabel(environmentEffectType)} effect preset`}
              value={environmentEffectPresetValue}
              onChange={(event) => {
                const nextPreset = event.target.value;
                onEnvironmentEffectPresetValueChange(nextPreset);
                onEnvironmentEffectPresetApply(nextPreset);
              }}
            >
              {getEnvironmentEffectPresetOptions(environmentEffectType).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="tools-effect-select-row tools-effect-select-row-single">
        <div className="tools-strip-select-field">
          <strong>Feather</strong>
          <div>
            <select
              aria-label="Animated effect feather"
              title="Animated effect feather"
              value={getEnvironmentEffectFeatherSelectValue(environmentEffectFeather)}
              onChange={(event) => onEnvironmentEffectFeatherChange(Number(event.target.value))}
            >
              {ENVIRONMENT_EFFECT_FEATHER_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}

interface EnvironmentEffectTuningProps {
  environmentEffectType: EnvironmentEffectType;
  tuning: EnvironmentEffectTuningState;
  onReset: () => void;
  onTuningChange: EnvironmentEffectTuningChangeHandlers;
}

function EnvironmentEffectTuning(props: EnvironmentEffectTuningProps) {
  const { environmentEffectType, tuning, onReset, onTuningChange } = props;

  return (
    <>
      {environmentEffectType === "acid" && <TuningSection><AcidEffectTuningPanel tuning={tuning.acidEffectTuning} onChange={onTuningChange.onAcidEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "cold" && <TuningSection><ColdEffectTuningPanel tuning={tuning.coldEffectTuning} onChange={onTuningChange.onColdEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "darkness" && <TuningSection><DarknessEffectTuningPanel tuning={tuning.darknessEffectTuning} onChange={onTuningChange.onDarknessEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "poison" && <TuningSection><PoisonEffectTuningPanel tuning={tuning.poisonEffectTuning} onChange={onTuningChange.onPoisonEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "water" && <TuningSection><WaterEffectTuningPanel tuning={tuning.waterEffectTuning} onChange={onTuningChange.onWaterEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "lava" && <TuningSection><LavaEffectTuningPanel tuning={tuning.lavaEffectTuning} onChange={onTuningChange.onLavaEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "fire" && <TuningSection><FireEffectTuningPanel tuning={tuning.fireEffectTuning} onChange={onTuningChange.onFireEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "electric" && <TuningSection><LightningEffectTuningPanel tuning={tuning.lightningEffectTuning} onChange={onTuningChange.onLightningEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "arcane" && <TuningSection><ArcaneEffectTuningPanel tuning={tuning.arcaneEffectTuning} onChange={onTuningChange.onArcaneEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "chaos" && <TuningSection><ChaosEffectTuningPanel tuning={tuning.chaosEffectTuning} onChange={onTuningChange.onChaosEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "void" && <TuningSection><VoidEffectTuningPanel tuning={tuning.voidEffectTuning} onChange={onTuningChange.onVoidEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "nature" && <TuningSection><NatureEffectTuningPanel tuning={tuning.natureEffectTuning} onChange={onTuningChange.onNatureEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "distortion" && <TuningSection><DistortionEffectTuningPanel tuning={tuning.distortionEffectTuning} onChange={onTuningChange.onDistortionEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "radiant" && <TuningSection><RadiantEffectTuningPanel tuning={tuning.radiantEffectTuning} onChange={onTuningChange.onRadiantEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "field" && <TuningSection><ForceFieldEffectTuningPanel tuning={tuning.forceFieldEffectTuning} onChange={onTuningChange.onForceFieldEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "shockwave" && <TuningSection><ShockwaveEffectTuningPanel tuning={tuning.shockwaveEffectTuning} onChange={onTuningChange.onShockwaveEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "smoke" && <TuningSection><SmokeEffectTuningPanel tuning={tuning.smokeEffectTuning} onChange={onTuningChange.onSmokeEffectTuningChange} onReset={onReset} /></TuningSection>}
      {environmentEffectType === "fog" && <TuningSection><FogEffectTuningPanel tuning={tuning.fogEffectTuning} onChange={onTuningChange.onFogEffectTuningChange} onReset={onReset} /></TuningSection>}
    </>
  );
}

function TuningSection({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="tools-section-divider" />
      {children}
    </>
  );
}
