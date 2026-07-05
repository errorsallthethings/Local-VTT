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
  onWeatherMaskToolChange: (tool: WeatherMaskTool) => void;
  onEnvironmentEffectToolChange: (tool: EnvironmentEffectTool) => void;
  onUndoWeatherMask: () => void;
  onUndoEnvironmentEffect: () => void;
  onEnvironmentEffectTypeChange: (effect: EnvironmentEffectType) => void;
  onEnvironmentEffectFeatherChange: (feather: number) => void;
  onEnvironmentEffectPresetValueChange: (presetValue: string) => void;
  onEnvironmentEffectPresetApply: (presetValue: string) => void;
  onEnvironmentEffectTuningReset: () => void;
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
  acidEffectTuning,
  coldEffectTuning,
  darknessEffectTuning,
  poisonEffectTuning,
  waterEffectTuning,
  lavaEffectTuning,
  fireEffectTuning,
  lightningEffectTuning,
  arcaneEffectTuning,
  chaosEffectTuning,
  voidEffectTuning,
  natureEffectTuning,
  distortionEffectTuning,
  radiantEffectTuning,
  forceFieldEffectTuning,
  shockwaveEffectTuning,
  smokeEffectTuning,
  fogEffectTuning,
  onWeatherMaskToolChange,
  onEnvironmentEffectToolChange,
  onUndoWeatherMask,
  onUndoEnvironmentEffect,
  onEnvironmentEffectTypeChange,
  onEnvironmentEffectFeatherChange,
  onEnvironmentEffectPresetValueChange,
  onEnvironmentEffectPresetApply,
  onEnvironmentEffectTuningReset,
  onAcidEffectTuningChange,
  onColdEffectTuningChange,
  onDarknessEffectTuningChange,
  onPoisonEffectTuningChange,
  onWaterEffectTuningChange,
  onLavaEffectTuningChange,
  onFireEffectTuningChange,
  onLightningEffectTuningChange,
  onArcaneEffectTuningChange,
  onChaosEffectTuningChange,
  onVoidEffectTuningChange,
  onNatureEffectTuningChange,
  onDistortionEffectTuningChange,
  onRadiantEffectTuningChange,
  onForceFieldEffectTuningChange,
  onShockwaveEffectTuningChange,
  onSmokeEffectTuningChange,
  onFogEffectTuningChange,
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
        acidEffectTuning={acidEffectTuning}
        coldEffectTuning={coldEffectTuning}
        darknessEffectTuning={darknessEffectTuning}
        poisonEffectTuning={poisonEffectTuning}
        waterEffectTuning={waterEffectTuning}
        lavaEffectTuning={lavaEffectTuning}
        fireEffectTuning={fireEffectTuning}
        lightningEffectTuning={lightningEffectTuning}
        arcaneEffectTuning={arcaneEffectTuning}
        chaosEffectTuning={chaosEffectTuning}
        voidEffectTuning={voidEffectTuning}
        natureEffectTuning={natureEffectTuning}
        distortionEffectTuning={distortionEffectTuning}
        radiantEffectTuning={radiantEffectTuning}
        forceFieldEffectTuning={forceFieldEffectTuning}
        shockwaveEffectTuning={shockwaveEffectTuning}
        smokeEffectTuning={smokeEffectTuning}
        fogEffectTuning={fogEffectTuning}
        onReset={onEnvironmentEffectTuningReset}
        onAcidEffectTuningChange={onAcidEffectTuningChange}
        onColdEffectTuningChange={onColdEffectTuningChange}
        onDarknessEffectTuningChange={onDarknessEffectTuningChange}
        onPoisonEffectTuningChange={onPoisonEffectTuningChange}
        onWaterEffectTuningChange={onWaterEffectTuningChange}
        onLavaEffectTuningChange={onLavaEffectTuningChange}
        onFireEffectTuningChange={onFireEffectTuningChange}
        onLightningEffectTuningChange={onLightningEffectTuningChange}
        onArcaneEffectTuningChange={onArcaneEffectTuningChange}
        onChaosEffectTuningChange={onChaosEffectTuningChange}
        onVoidEffectTuningChange={onVoidEffectTuningChange}
        onNatureEffectTuningChange={onNatureEffectTuningChange}
        onDistortionEffectTuningChange={onDistortionEffectTuningChange}
        onRadiantEffectTuningChange={onRadiantEffectTuningChange}
        onForceFieldEffectTuningChange={onForceFieldEffectTuningChange}
        onShockwaveEffectTuningChange={onShockwaveEffectTuningChange}
        onSmokeEffectTuningChange={onSmokeEffectTuningChange}
        onFogEffectTuningChange={onFogEffectTuningChange}
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
  onReset: () => void;
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

function EnvironmentEffectTuning(props: EnvironmentEffectTuningProps) {
  return (
    <>
      {props.environmentEffectType === "acid" && <TuningSection><AcidEffectTuningPanel tuning={props.acidEffectTuning} onChange={props.onAcidEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "cold" && <TuningSection><ColdEffectTuningPanel tuning={props.coldEffectTuning} onChange={props.onColdEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "darkness" && <TuningSection><DarknessEffectTuningPanel tuning={props.darknessEffectTuning} onChange={props.onDarknessEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "poison" && <TuningSection><PoisonEffectTuningPanel tuning={props.poisonEffectTuning} onChange={props.onPoisonEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "water" && <TuningSection><WaterEffectTuningPanel tuning={props.waterEffectTuning} onChange={props.onWaterEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "lava" && <TuningSection><LavaEffectTuningPanel tuning={props.lavaEffectTuning} onChange={props.onLavaEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "fire" && <TuningSection><FireEffectTuningPanel tuning={props.fireEffectTuning} onChange={props.onFireEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "electric" && <TuningSection><LightningEffectTuningPanel tuning={props.lightningEffectTuning} onChange={props.onLightningEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "arcane" && <TuningSection><ArcaneEffectTuningPanel tuning={props.arcaneEffectTuning} onChange={props.onArcaneEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "chaos" && <TuningSection><ChaosEffectTuningPanel tuning={props.chaosEffectTuning} onChange={props.onChaosEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "void" && <TuningSection><VoidEffectTuningPanel tuning={props.voidEffectTuning} onChange={props.onVoidEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "nature" && <TuningSection><NatureEffectTuningPanel tuning={props.natureEffectTuning} onChange={props.onNatureEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "distortion" && <TuningSection><DistortionEffectTuningPanel tuning={props.distortionEffectTuning} onChange={props.onDistortionEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "radiant" && <TuningSection><RadiantEffectTuningPanel tuning={props.radiantEffectTuning} onChange={props.onRadiantEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "field" && <TuningSection><ForceFieldEffectTuningPanel tuning={props.forceFieldEffectTuning} onChange={props.onForceFieldEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "shockwave" && <TuningSection><ShockwaveEffectTuningPanel tuning={props.shockwaveEffectTuning} onChange={props.onShockwaveEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "smoke" && <TuningSection><SmokeEffectTuningPanel tuning={props.smokeEffectTuning} onChange={props.onSmokeEffectTuningChange} onReset={props.onReset} /></TuningSection>}
      {props.environmentEffectType === "fog" && <TuningSection><FogEffectTuningPanel tuning={props.fogEffectTuning} onChange={props.onFogEffectTuningChange} onReset={props.onReset} /></TuningSection>}
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
