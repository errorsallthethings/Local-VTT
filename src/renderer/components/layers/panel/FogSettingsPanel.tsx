import { CircleHelp } from "lucide-react";
import type { FogSettings } from "../../../../shared/localvtt";
import { ColorSettingRow } from "../../controls/ColorPickerField";
import { getFogStartModePatch } from "./layerPanelFog";

export function FogSettingsPanel({
  fog,
  isNewShapeHelpOpen,
  onToggleNewShapeHelp,
  onUpdateFog,
  onOpenFogColor
}: {
  fog: FogSettings;
  isNewShapeHelpOpen: boolean;
  onToggleNewShapeHelp: () => void;
  onUpdateFog: (patch: Partial<FogSettings>) => void;
  onOpenFogColor: () => void;
}) {
  return (
    <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
      <label className="stacked-control">
        Mode
        <select value={fog.mode} onChange={(event) => onUpdateFog(getFogStartModePatch(event.target.value as FogSettings["mode"]))}>
          <option value="revealed">Fully revealed</option>
          <option value="hidden">Fully hidden</option>
          <option value="partial">Partially revealed</option>
        </select>
      </label>
      <div className="settings-grid">
        <label className="setting-row">
          <span>GM opacity</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={fog.gmOpacity}
            onChange={(event) => onUpdateFog({ gmOpacity: Number(event.target.value) })}
          />
        </label>
        <label className="setting-row">
          <span>Player opacity</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={fog.playerOpacity}
            onChange={(event) => onUpdateFog({ playerOpacity: Number(event.target.value), opacity: Number(event.target.value) })}
          />
        </label>
        <ColorSettingRow label="Color" value={fog.color} onOpen={onOpenFogColor} />
      </div>
      <div className="setting-row fog-new-shape-row">
        <span className="fog-default-label">
          New Shapes
          <button
            type="button"
            className="icon-button measurement-help-button"
            aria-label="New Shapes Help"
            title="New Shapes Help"
            onClick={onToggleNewShapeHelp}
          >
            <CircleHelp size={15} aria-hidden="true" />
          </button>
        </span>
        <div className="fog-new-shape-control">
          <label className="fog-operation-switch fog-new-shape-switch" title="Player View default for newly drawn fog shapes">
            <span>Reveal</span>
            <input
              aria-label="Player View default for new fog shapes"
              type="checkbox"
              checked={!fog.newShapesVisibleInPlayer}
              onChange={(event) => onUpdateFog({ newShapesVisibleInPlayer: !event.target.checked })}
            />
            <span>Hidden</span>
          </label>
        </div>
      </div>
      {isNewShapeHelpOpen && (
        <div className="settings-help-panel layer-settings-help-panel" role="note">
          <p>Sets the Player View default for newly drawn fog shapes.</p>
        </div>
      )}
      <div className="inline-help">Fog drawing tools are available from the floating Tools Menu in the GM canvas.</div>
    </div>
  );
}
