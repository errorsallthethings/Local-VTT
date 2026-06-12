import { useEffect, useRef, useState } from "react";
import { CircleHelp, Dices, EllipsisVertical, Eye, Maximize2, Minimize2, MonitorOff, MonitorUp, Pause, Plus, RotateCcw, Settings2, Trash2, X } from "lucide-react";
import type { Asset, Campaign, DiceDisplayMode, DicePanelEdge, DicePanelFacing, DiceSceneRollTarget, DiceSceneSize, LiveTableEvent, Scene } from "../../../shared/localvtt";
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

type DicePanelPosition = {
  x: number;
  y: number;
};

type DicePanelDrag = {
  pointerId: number;
  offsetX: number;
  offsetY: number;
};

const CUSTOM_DICE_PRESETS_STORAGE_KEY = "localvtt.customDicePresets";
const DICE_DISPLAY_OPTIONS = [
  { value: "results", label: "Results only" },
  { value: "panel", label: "3D panel" }
] as const satisfies Array<{ value: DiceDisplayMode; label: string }>;
const PLAYER_DICE_DISPLAY_OPTIONS = [
  ...DICE_DISPLAY_OPTIONS,
  { value: "hidden", label: "Hidden" }
] as const satisfies Array<{ value: DiceDisplayMode; label: string }>;
const DICE_SCENE_ROLL_TARGET_OPTIONS = [
  { value: "gm", label: "GM View" },
  { value: "player", label: "Player View" }
] as const satisfies Array<{ value: DiceSceneRollTarget; label: string }>;
const DICE_SCENE_SIZE_OPTIONS = [
  { value: "xs", label: "Extra small" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra large" }
] as const satisfies Array<{ value: DiceSceneSize; label: string }>;
const DICE_PANEL_EDGE_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "right", label: "Right" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" }
] as const satisfies Array<{ value: DicePanelEdge; label: string }>;
const DICE_PANEL_FACING_OPTIONS = [
  { value: "inward", label: "Inward" },
  { value: "outward", label: "Outward" }
] as const satisfies Array<{ value: DicePanelFacing; label: string }>;

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
  gmDiceDisplayMode: DiceDisplayMode;
  playerDiceDisplayMode: DiceDisplayMode;
  diceSceneRollEnabled: boolean;
  diceSceneRollTarget: DiceSceneRollTarget;
  gmDiceSceneSize: DiceSceneSize;
  playerDiceSceneSize: DiceSceneSize;
  gmDicePanelEdge: DicePanelEdge;
  playerDicePanelEdge: DicePanelEdge;
  gmDicePanelFacing: DicePanelFacing;
  playerDicePanelFacing: DicePanelFacing;
  gmDicePanelPosition: number;
  playerDicePanelPosition: number;
  gmDicePanelAdvanced: boolean;
  playerDicePanelAdvanced: boolean;
  diceHistory: DiceRollEvent[];
  onGmDiceDisplayModeChange: (mode: DiceDisplayMode) => void;
  onPlayerDiceDisplayModeChange: (mode: DiceDisplayMode) => void;
  onDiceSceneRollEnabledChange: (enabled: boolean) => void;
  onDiceSceneRollTargetChange: (target: DiceSceneRollTarget) => void;
  onGmDiceSceneSizeChange: (size: DiceSceneSize) => void;
  onPlayerDiceSceneSizeChange: (size: DiceSceneSize) => void;
  onGmDicePanelEdgeChange: (edge: DicePanelEdge) => void;
  onPlayerDicePanelEdgeChange: (edge: DicePanelEdge) => void;
  onGmDicePanelFacingChange: (facing: DicePanelFacing) => void;
  onPlayerDicePanelFacingChange: (facing: DicePanelFacing) => void;
  onGmDicePanelPositionChange: (position: number) => void;
  onPlayerDicePanelPositionChange: (position: number) => void;
  onGmDicePanelAdvancedChange: (advanced: boolean) => void;
  onPlayerDicePanelAdvancedChange: (advanced: boolean) => void;
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
  gmDiceDisplayMode,
  playerDiceDisplayMode,
  diceSceneRollEnabled,
  diceSceneRollTarget,
  gmDiceSceneSize,
  playerDiceSceneSize,
  gmDicePanelEdge,
  playerDicePanelEdge,
  gmDicePanelFacing,
  playerDicePanelFacing,
  gmDicePanelPosition,
  playerDicePanelPosition,
  gmDicePanelAdvanced,
  playerDicePanelAdvanced,
  diceHistory,
  onGmDiceDisplayModeChange,
  onPlayerDiceDisplayModeChange,
  onDiceSceneRollEnabledChange,
  onDiceSceneRollTargetChange,
  onGmDiceSceneSizeChange,
  onPlayerDiceSceneSizeChange,
  onGmDicePanelEdgeChange,
  onPlayerDicePanelEdgeChange,
  onGmDicePanelFacingChange,
  onPlayerDicePanelFacingChange,
  onGmDicePanelPositionChange,
  onPlayerDicePanelPositionChange,
  onGmDicePanelAdvancedChange,
  onPlayerDicePanelAdvancedChange,
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
  const [dicePanelPosition, setDicePanelPosition] = useState<DicePanelPosition | null>(null);
  const [dicePanelDragging, setDicePanelDragging] = useState(false);
  const dicePanelRef = useRef<HTMLDivElement | null>(null);
  const dicePopoverRef = useRef<HTMLDivElement | null>(null);
  const dicePanelDragRef = useRef<DicePanelDrag | null>(null);
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

  useEffect(() => {
    if (!dicePanelOpen || !dicePanelPosition) {
      return;
    }
    setDicePanelPosition((position) => {
      if (!position) {
        return position;
      }
      const nextPosition = clampDicePanelPosition(position.x, position.y, dicePopoverRef.current?.getBoundingClientRect());
      return nextPosition.x === position.x && nextPosition.y === position.y ? position : nextPosition;
    });
  }, [dicePanelOpen, dicePanelPosition]);

  const beginDicePanelDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest("button")) {
      return;
    }
    const popover = dicePopoverRef.current;
    if (!popover) {
      return;
    }
    const rect = popover.getBoundingClientRect();
    dicePanelDragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
    setDicePanelPosition(clampDicePanelPosition(rect.left, rect.top, rect));
    setDicePanelDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const moveDicePanelDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dicePanelDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    setDicePanelPosition(clampDicePanelPosition(event.clientX - drag.offsetX, event.clientY - drag.offsetY, dicePopoverRef.current?.getBoundingClientRect()));
  };

  const endDicePanelDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dicePanelDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    dicePanelDragRef.current = null;
    setDicePanelDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const resetGmDicePanelPlacement = () => {
    onGmDicePanelEdgeChange("top");
    onGmDicePanelFacingChange("inward");
    onGmDicePanelPositionChange(0.5);
  };

  const resetPlayerDicePanelPlacement = () => {
    onPlayerDicePanelEdgeChange("top");
    onPlayerDicePanelFacingChange("inward");
    onPlayerDicePanelPositionChange(0.5);
  };

  const updateGmDicePanelAdvanced = (advanced: boolean) => {
    onGmDicePanelAdvancedChange(advanced);
    if (!advanced) {
      resetGmDicePanelPlacement();
    }
  };

  const updatePlayerDicePanelAdvanced = (advanced: boolean) => {
    onPlayerDicePanelAdvancedChange(advanced);
    if (!advanced) {
      resetPlayerDicePanelPlacement();
    }
  };

  const diceDisplaySummary = getDiceDisplaySummary({
    gmDiceDisplayMode,
    playerDiceDisplayMode,
    diceSceneRollEnabled,
    diceSceneRollTarget
  });

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
            </button>
          </div>
          {dicePanelOpen && (
            <div
              ref={dicePopoverRef}
              className={dicePanelPosition ? "dice-popover dice-popover-dragged" : "dice-popover"}
              style={dicePanelPosition ? { left: dicePanelPosition.x, top: dicePanelPosition.y } : undefined}
              role="dialog"
              aria-label="Dice roller"
            >
              <div
                className={dicePanelDragging ? "dice-popover-header dice-popover-header-dragging" : "dice-popover-header"}
                onPointerDown={beginDicePanelDrag}
                onPointerMove={moveDicePanelDrag}
                onPointerUp={endDicePanelDrag}
                onPointerCancel={endDicePanelDrag}
              >
                <div className="dice-popover-title">
                  <strong>Dice</strong>
                  <div className="dice-display-summary" aria-label={`Dice display settings: GM ${diceDisplaySummary.gm}, Player ${diceDisplaySummary.player}`}>
                    <span title={`GM Display: ${diceDisplaySummary.gm}`}>GM: {diceDisplaySummary.gm}</span>
                    <span title={`Player Display: ${diceDisplaySummary.player}`}>Player: {diceDisplaySummary.player}</span>
                  </div>
                </div>
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
                      <div className="dice-settings-group">
                        <div className="dice-settings-group-heading">Display</div>
                        <div className="dice-settings-row">
                          <span>Scene Roll</span>
                          <label className="fog-operation-switch weather-category-switch dice-placement-switch" title="Roll dice directly on one scene view">
                            <span>Off</span>
                            <input type="checkbox" checked={diceSceneRollEnabled} aria-label="Scene roll" onChange={(event) => onDiceSceneRollEnabledChange(event.target.checked)} />
                            <span>On</span>
                          </label>
                        </div>
                        {diceSceneRollEnabled && (
                          <div className="dice-settings-row">
                            <span>Roll Scene On</span>
                            <select value={diceSceneRollTarget} aria-label="Scene roll target view" onChange={(event) => onDiceSceneRollTargetChange(event.target.value as DiceSceneRollTarget)}>
                              {DICE_SCENE_ROLL_TARGET_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="dice-settings-row">
                          <span>GM Display</span>
                          <select value={gmDiceDisplayMode === "panel" ? "panel" : "results"} aria-label="GM dice display mode" disabled={diceSceneRollEnabled} onChange={(event) => onGmDiceDisplayModeChange(event.target.value as DiceDisplayMode)}>
                            {DICE_DISPLAY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="dice-settings-row">
                          <span>Player Display</span>
                          <select
                            value={playerDiceDisplayMode === "panel" || playerDiceDisplayMode === "hidden" ? playerDiceDisplayMode : "results"}
                            aria-label="Player dice display mode"
                            disabled={diceSceneRollEnabled}
                            onChange={(event) => onPlayerDiceDisplayModeChange(event.target.value as DiceDisplayMode)}
                          >
                            {PLAYER_DICE_DISPLAY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {diceSceneRollEnabled && (
                        <div className="dice-settings-group">
                          <div className="dice-settings-group-heading">Scene Roll</div>
                          <div className="dice-settings-row">
                            <span>GM Scene Dice Size</span>
                            <select value={gmDiceSceneSize} aria-label="GM scene dice size" onChange={(event) => onGmDiceSceneSizeChange(event.target.value as DiceSceneSize)}>
                              {DICE_SCENE_SIZE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="dice-settings-row">
                            <span>Player Scene Dice Size</span>
                            <select value={playerDiceSceneSize} aria-label="Player scene dice size" onChange={(event) => onPlayerDiceSceneSizeChange(event.target.value as DiceSceneSize)}>
                              {DICE_SCENE_SIZE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="dice-settings-group">
                        <div className="dice-settings-group-heading">Placement</div>
                        <div className="dice-settings-row">
                          <span>GM Placement</span>
                          <label className="fog-operation-switch weather-category-switch dice-placement-switch" title="Enable GM Results and 3D panel edge placement">
                            <span>Off</span>
                            <input type="checkbox" checked={gmDicePanelAdvanced} aria-label="GM dice panel placement" onChange={(event) => updateGmDicePanelAdvanced(event.target.checked)} />
                            <span>On</span>
                          </label>
                        </div>
                        {gmDicePanelAdvanced && (
                          <>
                            <div className="dice-settings-row">
                              <span>GM Panel Edge</span>
                              <select value={gmDicePanelEdge} aria-label="GM dice panel edge" onChange={(event) => onGmDicePanelEdgeChange(event.target.value as DicePanelEdge)}>
                                {DICE_PANEL_EDGE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="dice-settings-row">
                              <span>GM Panel Facing</span>
                              <select value={gmDicePanelFacing} aria-label="GM dice panel facing" onChange={(event) => onGmDicePanelFacingChange(event.target.value as DicePanelFacing)}>
                                {DICE_PANEL_FACING_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <label className="dice-settings-row">
                              <span>GM Panel Position</span>
                              <div className="dice-position-control">
                                <input type="range" min="0" max="100" value={Math.round(gmDicePanelPosition * 100)} aria-label="GM dice panel position" onChange={(event) => onGmDicePanelPositionChange(Number(event.target.value) / 100)} />
                                <button type="button" className="icon-button dice-position-reset" title="Reset GM panel position" aria-label="Reset GM panel position" onClick={() => onGmDicePanelPositionChange(0.5)}>
                                  <RotateCcw size={13} aria-hidden="true" />
                                </button>
                              </div>
                            </label>
                          </>
                        )}
                        <div className="dice-settings-row">
                          <span>Player Placement</span>
                          <label className="fog-operation-switch weather-category-switch dice-placement-switch" title="Enable Player Results and 3D panel edge placement">
                            <span>Off</span>
                            <input type="checkbox" checked={playerDicePanelAdvanced} aria-label="Player dice panel placement" onChange={(event) => updatePlayerDicePanelAdvanced(event.target.checked)} />
                            <span>On</span>
                          </label>
                        </div>
                        {playerDicePanelAdvanced && (
                          <>
                            <div className="dice-settings-row">
                              <span>Player Panel Edge</span>
                              <select value={playerDicePanelEdge} aria-label="Player dice panel edge" onChange={(event) => onPlayerDicePanelEdgeChange(event.target.value as DicePanelEdge)}>
                                {DICE_PANEL_EDGE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="dice-settings-row">
                              <span>Player Panel Facing</span>
                              <select value={playerDicePanelFacing} aria-label="Player dice panel facing" onChange={(event) => onPlayerDicePanelFacingChange(event.target.value as DicePanelFacing)}>
                                {DICE_PANEL_FACING_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <label className="dice-settings-row">
                              <span>Player Panel Position</span>
                              <div className="dice-position-control">
                                <input type="range" min="0" max="100" value={Math.round(playerDicePanelPosition * 100)} aria-label="Player dice panel position" onChange={(event) => onPlayerDicePanelPositionChange(Number(event.target.value) / 100)} />
                                <button type="button" className="icon-button dice-position-reset" title="Reset Player panel position" aria-label="Reset Player panel position" onClick={() => onPlayerDicePanelPositionChange(0.5)}>
                                  <RotateCcw size={13} aria-hidden="true" />
                                </button>
                              </div>
                            </label>
                          </>
                        )}
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
                        <strong>Examples:</strong> d20, 2d6+3, d20+d4+5, d%
                      </p>
                      <p>
                        <strong>Percentile:</strong> d% or d100
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
                    <div className="dice-roll-feed-list">
                      {diceHistory.length > 0 ? (
                        diceHistory.map((roll) => (
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

function clampDicePanelPosition(x: number, y: number, rect?: DOMRect | null): DicePanelPosition {
  const margin = 8;
  const width = rect?.width ?? 300;
  const height = rect?.height ?? 520;
  const maxX = Math.max(margin, window.innerWidth - width - margin);
  const maxY = Math.max(margin, window.innerHeight - height - margin);
  return {
    x: Math.min(Math.max(margin, x), maxX),
    y: Math.min(Math.max(margin, y), maxY)
  };
}

function getDiceDisplaySummary({
  gmDiceDisplayMode,
  playerDiceDisplayMode,
  diceSceneRollEnabled,
  diceSceneRollTarget
}: {
  gmDiceDisplayMode: DiceDisplayMode;
  playerDiceDisplayMode: DiceDisplayMode;
  diceSceneRollEnabled: boolean;
  diceSceneRollTarget: DiceSceneRollTarget;
}): { gm: string; player: string } {
  if (diceSceneRollEnabled) {
    return diceSceneRollTarget === "player" ? { gm: "Results", player: "Scene" } : { gm: "Scene", player: "Hidden" };
  }
  return {
    gm: getDiceDisplayLabel(gmDiceDisplayMode),
    player: getDiceDisplayLabel(playerDiceDisplayMode)
  };
}

function getDiceDisplayLabel(mode: DiceDisplayMode): string {
  if (mode === "panel") {
    return "3D Panel";
  }
  if (mode === "hidden") {
    return "Hidden";
  }
  if (mode === "scene" || mode === "scene-result") {
    return "Scene";
  }
  return "Results";
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
