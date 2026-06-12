import { useEffect, useRef, useState } from "react";
import { CircleHelp, Dices, EllipsisVertical, Eye, Maximize2, Minimize2, MonitorOff, MonitorUp, Pause, Plus, Settings2, Trash2, X } from "lucide-react";
import type { Asset, Campaign, LiveTableEvent, Scene } from "../../../shared/localvtt";
import {
  DICE_TYPES,
  formatDieLabel,
  formatDiceRollBreakdown,
  formatDiceRollBreakdownTooltip,
  formatDiceRollSummary,
  getDiceRollTone,
  rollDiceExpression,
  type DiceType
} from "../../lib/dice";
import { getActiveWeatherEffects } from "../../lib/weatherCatalog";

type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;
type CustomDicePreset = {
  id: string;
  label: string;
  formula: string;
};

const CUSTOM_DICE_PRESETS_STORAGE_KEY = "localvtt.customDicePresets";

interface WorkspaceTopbarProps {
  campaign: Campaign | null;
  activeScene: Scene | null;
  mapAsset: Asset | null;
  playerMenuOpen: boolean;
  playerDisplayMode: "scene" | "hold" | "blackout";
  onSendToPlayer: () => void;
  onTogglePlayerMenu: () => void;
  onShowPlayerHold: () => void;
  onShowPlayerBlackout: () => void;
  onOpenPlayerDisplayScale: () => void;
  onOpenPlayerViewDisplay: () => void;
  onSetPlayerFullscreen: (fullscreen: boolean) => void;
  onClosePlayerView: () => void;
  gmDiceOverlayEnabled: boolean;
  playerDiceOverlayEnabled: boolean;
  diceHistory: DiceRollEvent[];
  onToggleGmDiceOverlay: () => void;
  onTogglePlayerDiceOverlay: () => void;
  onRollDie: (die: DiceType) => void;
  onRollExpression: (expression: string, rollLabel?: string) => string | null;
  onClearDiceRolls: () => void;
}

export function WorkspaceTopbar({
  campaign,
  activeScene,
  mapAsset,
  playerMenuOpen,
  playerDisplayMode,
  onSendToPlayer,
  onTogglePlayerMenu,
  onShowPlayerHold,
  onShowPlayerBlackout,
  onOpenPlayerDisplayScale,
  onOpenPlayerViewDisplay,
  onSetPlayerFullscreen,
  onClosePlayerView,
  gmDiceOverlayEnabled,
  playerDiceOverlayEnabled,
  diceHistory,
  onToggleGmDiceOverlay,
  onTogglePlayerDiceOverlay,
  onRollDie,
  onRollExpression,
  onClearDiceRolls
}: WorkspaceTopbarProps) {
  const [diceExpression, setDiceExpression] = useState("1d20");
  const [diceExpressionError, setDiceExpressionError] = useState<string | null>(null);
  const [customDicePresets, setCustomDicePresets] = useState<CustomDicePreset[]>(() => loadCustomDicePresets());
  const [presetFormOpen, setPresetFormOpen] = useState(false);
  const [presetLabel, setPresetLabel] = useState("");
  const [presetFormula, setPresetFormula] = useState("");
  const [presetFormError, setPresetFormError] = useState<string | null>(null);
  const [dicePanelOpen, setDicePanelOpen] = useState(false);
  const [diceSettingsOpen, setDiceSettingsOpen] = useState(false);
  const [diceFormulaHelpOpen, setDiceFormulaHelpOpen] = useState(false);
  const dicePanelRef = useRef<HTMLDivElement | null>(null);
  const title = activeScene?.name ?? (campaign ? "Select or Create a Scene" : "Create or Open a Campaign");
  const subtitle = activeScene
    ? mapAsset
      ? `${mapAsset.name} (${mapAsset.mediaType})`
      : "No map imported"
    : campaign
      ? "Choose a scene from the Scenes panel or add a new scene to start building."
      : "Create a campaign, add a scene, import a map, then send it to Player View.";

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_DICE_PRESETS_STORAGE_KEY, JSON.stringify(customDicePresets));
  }, [customDicePresets]);

  useEffect(() => {
    if (!dicePanelOpen) {
      return;
    }
    const closePanel = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && dicePanelRef.current?.contains(target)) {
        return;
      }
      setDicePanelOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDicePanelOpen(false);
      }
    };
    window.addEventListener("pointerdown", closePanel);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closePanel);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [dicePanelOpen]);

  const rollPreset = (label: string, formula: string) => {
    setDiceExpression(formula);
    setDiceExpressionError(onRollExpression(formula, label));
  };

  const openPresetForm = () => {
    setPresetFormOpen(true);
    setPresetLabel("");
    setPresetFormula(diceExpression);
    setPresetFormError(null);
  };

  const saveCustomPreset = () => {
    const label = presetLabel.trim();
    const formula = presetFormula.trim();
    if (!label || !formula) {
      setPresetFormError("Label and formula are required.");
      return;
    }
    try {
      rollDiceExpression(formula, () => 0.5);
    } catch (caught) {
      setPresetFormError(caught instanceof Error ? caught.message : "Could not save that dice expression.");
      return;
    }
    const preset = { id: crypto.randomUUID(), label, formula };
    setCustomDicePresets((presets) => [preset, ...presets].slice(0, 12));
    setPresetFormOpen(false);
    setPresetLabel("");
    setPresetFormula("");
    setPresetFormError(null);
  };

  return (
    <div className="topbar">
      <div>
        <div className="topbar-title-row">
          <h2>{title}</h2>
          {activeScene && <ActiveWeatherIcons scene={activeScene} />}
        </div>
        <span>{subtitle}</span>
      </div>
      <div className="toolbar-groups">
        <div className="toolbar-block dice-toolbar-block" ref={dicePanelRef}>
          <div className="toolbar-label">Dice</div>
          <div className="toolbar-group dice-toolbar-trigger" aria-label="Dice actions">
            <button
              className={dicePanelOpen ? "dice-panel-trigger dice-panel-trigger-active" : "dice-panel-trigger"}
              aria-expanded={dicePanelOpen}
              aria-haspopup="dialog"
              onClick={() => setDicePanelOpen((open) => !open)}
            >
              <Dices size={16} aria-hidden="true" />
              Dice
              {diceHistory.length > 0 && <span>{diceHistory.length}</span>}
            </button>
          </div>
          {dicePanelOpen && (
            <div className="dice-popover" role="dialog" aria-label="Dice roller">
              <div className="dice-popover-header">
                <strong>Dice</strong>
                <div className="dice-popover-header-actions">
                  <button
                    className={diceSettingsOpen ? "icon-button dice-panel-icon-active" : "icon-button"}
                    aria-label="Dice rendering settings"
                    title="Dice rendering settings"
                    aria-expanded={diceSettingsOpen}
                    onClick={() => setDiceSettingsOpen((open) => !open)}
                  >
                    <Settings2 size={14} aria-hidden="true" />
                  </button>
                  <button className="icon-button" aria-label="Close dice panel" title="Close dice panel" onClick={() => setDicePanelOpen(false)}>
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="dice-panel-body" aria-label="Roll dice">
                {diceSettingsOpen && (
                  <section className="dice-panel-section" aria-label="Dice rendering settings">
                    <div className="dice-settings-panel">
                      <div className="dice-settings-row">
                        <span>GM Dice Panel</span>
                        <label className="fog-operation-switch weather-category-switch dice-display-switch" title="Show dice in a 3D panel on GM View">
                          <span>Off</span>
                          <input type="checkbox" checked={gmDiceOverlayEnabled} aria-label="Show dice in a 3D panel on GM View" onChange={onToggleGmDiceOverlay} />
                          <span>On</span>
                        </label>
                      </div>
                      <div className="dice-settings-row">
                        <span>Player Dice Panel</span>
                        <label className="fog-operation-switch weather-category-switch dice-display-switch" title="Show dice in a 3D panel on Player View">
                          <span>Off</span>
                          <input type="checkbox" checked={playerDiceOverlayEnabled} aria-label="Show dice in a 3D panel on Player View" onChange={onTogglePlayerDiceOverlay} />
                          <span>On</span>
                        </label>
                      </div>
                    </div>
                  </section>
                )}
                <section className="dice-panel-section" aria-label="Dice formula">
                  <form
                    className="dice-expression-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setDiceExpressionError(onRollExpression(diceExpression));
                    }}
                  >
                    <div className="dice-expression-input-wrap">
                      <input
                        value={diceExpression}
                        aria-label="Dice expression"
                        aria-invalid={Boolean(diceExpressionError)}
                        onChange={(event) => {
                          setDiceExpression(event.target.value);
                          setDiceExpressionError(null);
                        }}
                        placeholder="2d6+3"
                      />
                      <button
                        type="button"
                        className="dice-formula-help-button"
                        aria-label="Dice formula help"
                        title="Dice formula help"
                        aria-expanded={diceFormulaHelpOpen}
                        onClick={() => setDiceFormulaHelpOpen((open) => !open)}
                      >
                        <CircleHelp size={24} aria-hidden="true" />
                      </button>
                    </div>
                    <button type="submit" title="Roll expression" aria-label="Roll dice expression">
                      Roll
                    </button>
                  </form>
                  {diceFormulaHelpOpen && (
                    <div className="dice-formula-help-panel" role="note">
                      <p>
                        <strong>Examples:</strong> d20, 2d6+3, d20+d4+5, d100
                      </p>
                      <p>
                        <strong>D20:</strong> d20a or d20adv, d20d or d20dis
                      </p>
                      <p>
                        <strong>Pools:</strong> 4d6kh3, 4d6dl1, 2d20kh1, 2d20kl1
                      </p>
                    </div>
                  )}
                  {diceExpressionError && <div className="dice-expression-error">{diceExpressionError}</div>}
                </section>
                <section className="dice-panel-section" aria-label="Quick dice">
                  <div className="dice-section-heading">
                    <span>Quick Dice</span>
                  </div>
                  <div className="dice-quick-grid">
                    {DICE_TYPES.map((die) => (
                      <button
                        key={die}
                        className={`dice-quick-button dice-quick-button-${die}`}
                        title={`Roll ${formatDieLabel(die)}`}
                        aria-label={`Roll ${formatDieLabel(die)}`}
                        onClick={() => {
                          setDiceExpressionError(null);
                          onRollDie(die);
                        }}
                      >
                        <span>{formatDieLabel(die)}</span>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="dice-panel-section" aria-label="Dice roll presets">
                  <div className="dice-section-heading">
                    <span>Presets</span>
                    <button type="button" className="icon-button dice-section-icon-button" title="Add preset" aria-label="Add preset" onClick={openPresetForm}>
                      <Plus size={14} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="dice-preset-row">
                    {customDicePresets.map((preset) => (
                      <span key={preset.id} className="dice-custom-preset">
                        <button
                          type="button"
                          className="dice-preset-button dice-preset-button-custom"
                          title={`${preset.label}: ${preset.formula.toUpperCase()}`}
                          aria-label={`Roll ${preset.label}: ${preset.formula.toUpperCase()}`}
                          onClick={() => rollPreset(preset.label, preset.formula)}
                        >
                          {preset.label}
                        </button>
                        <button
                          type="button"
                          className="dice-preset-delete"
                          title={`Delete ${preset.label} preset`}
                          aria-label={`Delete ${preset.label} preset`}
                          onClick={() => setCustomDicePresets((presets) => presets.filter((candidate) => candidate.id !== preset.id))}
                        >
                          <X size={10} aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                    {customDicePresets.length === 0 && <div className="dice-empty-state">No presets.</div>}
                  </div>
                  {presetFormOpen && (
                    <form
                      className="dice-preset-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        saveCustomPreset();
                      }}
                    >
                      <input
                        value={presetLabel}
                        aria-label="Preset label"
                        placeholder="Label"
                        onChange={(event) => {
                          setPresetLabel(event.target.value);
                          setPresetFormError(null);
                        }}
                      />
                      <input
                        value={presetFormula}
                        aria-label="Preset formula"
                        placeholder="Formula"
                        onChange={(event) => {
                          setPresetFormula(event.target.value);
                          setPresetFormError(null);
                        }}
                      />
                      <button type="submit">Save</button>
                      <button
                        type="button"
                        className="dice-preset-cancel"
                        aria-label="Cancel preset"
                        title="Cancel preset"
                        onClick={() => {
                          setPresetFormOpen(false);
                          setPresetFormError(null);
                        }}
                      >
                        <X size={12} aria-hidden="true" />
                      </button>
                      {presetFormError && <div className="dice-preset-error">{presetFormError}</div>}
                    </form>
                  )}
                </section>
                <section className="dice-panel-section" aria-label="Dice roll history">
                  <div className="dice-roll-feed">
                    <div className="dice-roll-feed-heading">
                      <span>Recent</span>
                      <div className="dice-roll-feed-actions">
                        <strong>{diceHistory.length}</strong>
                        <button
                          className="icon-button dice-section-icon-button dice-clear-button"
                          title="Clear recent rolls and Player View overlay"
                          aria-label="Clear recent rolls and Player View overlay"
                          disabled={diceHistory.length === 0}
                          onClick={() => {
                            setDiceExpressionError(null);
                            onClearDiceRolls();
                          }}
                        >
                          <Trash2 size={12} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {diceHistory.length > 0 ? (
                      diceHistory.slice(0, 6).map((roll) => (
                        <div key={roll.id} className={`dice-roll-feed-item dice-roll-tone-${getDiceRollTone(roll)}`}>
                          <span>{formatDiceRollSummary(roll)}</span>
                          <strong>{roll.label}</strong>
                          <small title={formatDiceRollBreakdownTooltip(roll)}>{formatDiceFeedBreakdown(roll)}</small>
                        </div>
                      ))
                    ) : (
                      <div className="dice-empty-state">No recent rolls.</div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
        <div className="toolbar-block">
          <div className="toolbar-label">Player View</div>
          <div className="toolbar-group" aria-label="Player View actions">
            <button disabled={!activeScene} onClick={onSendToPlayer}>
              <MonitorUp size={16} aria-hidden="true" />
              Send
            </button>
            <div className="scene-menu-wrap player-view-menu-wrap">
              <button
                className="icon-button player-view-menu-button"
                disabled={!activeScene}
                aria-label="Player View actions"
                title={activeScene ? "Player View actions" : "Select a scene to use Player View actions"}
                onClick={onTogglePlayerMenu}
              >
                <EllipsisVertical size={16} aria-hidden="true" />
              </button>
              {playerMenuOpen && (
                <div className="scene-menu toolbar-menu">
                  <button disabled={!activeScene || playerDisplayMode === "scene"} onClick={onSendToPlayer}>
                    <Eye size={14} aria-hidden="true" />
                    Show Scene
                  </button>
                  <button disabled={playerDisplayMode === "hold"} onClick={onShowPlayerHold}>
                    <Pause size={14} aria-hidden="true" />
                    Hold Screen
                  </button>
                  <button disabled={playerDisplayMode === "blackout"} onClick={onShowPlayerBlackout}>
                    <MonitorOff size={14} aria-hidden="true" />
                    Blackout
                  </button>
                  <button onClick={() => onSetPlayerFullscreen(true)}>
                    <Maximize2 size={14} aria-hidden="true" />
                    Fullscreen
                  </button>
                  <button onClick={() => onSetPlayerFullscreen(false)}>
                    <Minimize2 size={14} aria-hidden="true" />
                    Exit fullscreen
                  </button>
                  <button onClick={onOpenPlayerViewDisplay}>
                    <MonitorUp size={14} aria-hidden="true" />
                    Player View Display
                  </button>
                  <button disabled={!activeScene} onClick={onOpenPlayerDisplayScale}>
                    <Settings2 size={14} aria-hidden="true" />
                    Player Display Scale
                  </button>
                  <button className="danger-menu-item" onClick={onClosePlayerView}>
                    <X size={14} aria-hidden="true" />
                    Close window
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDiceFeedBreakdown(roll: DiceRollEvent): string {
  if (!roll.dice || roll.dice.length <= 1) {
    return roll.label;
  }
  return formatDiceRollBreakdown(roll);
}

function loadCustomDicePresets(): CustomDicePreset[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CUSTOM_DICE_PRESETS_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (preset): preset is CustomDicePreset =>
          typeof preset?.id === "string" && typeof preset.label === "string" && preset.label.trim().length > 0 && typeof preset.formula === "string" && preset.formula.trim().length > 0
      )
      .slice(0, 12);
  } catch {
    return [];
  }
}

function ActiveWeatherIcons({ scene }: { scene: Scene }) {
  const activeEffects = getActiveWeatherEffects(scene.weather);

  if (activeEffects.length === 0) {
    return null;
  }

  return (
    <div className="active-weather-icons" aria-label="Active weather effects">
      {activeEffects.map((effect) => (
        <span key={effect.key} title={effect.label} aria-label={effect.label}>
          <effect.icon size={14} aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}
