import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, CircleHelp, EllipsisVertical, Eye, GripVertical, Map, Maximize2, MessageSquare, Minimize2, MonitorOff, MonitorUp, Pause, Plus, RotateCcw, Settings2, Trash2, X } from "lucide-react";
import { DEFAULT_DICE_SETTINGS, type Asset, type Campaign, type DiceDisplayMode, type DicePanelEdge, type DicePanelFacing, type DiceSceneRollTarget, type DiceSceneSize, type DiceSceneThrowDirection, type LiveTableEvent, type Scene, type TableMessageLayout, type TableMessagePlacement, type TableMessageStyle } from "../../../shared/localvtt";
import type { PlayerDisplayMode } from "../../lib/player-view";
import {
  addCustomDicePreset,
  DICE_DISPLAY_OPTIONS,
  DICE_PANEL_EDGE_OPTIONS,
  DICE_PANEL_FACING_OPTIONS,
  DICE_SCENE_SIZE_OPTIONS,
  DICE_SCENE_THROW_DIRECTION_OPTIONS,
  DICE_TYPES,
  DEFAULT_DICE_PANEL_EDGE,
  DEFAULT_DICE_PANEL_FACING,
  DEFAULT_DICE_PANEL_POSITION,
  formatDieLabel,
  formatDiceFeedBreakdown,
  formatDiceFeedBreakdownTooltip,
  formatDiceFeedLabel,
  formatDiceRollSummary,
  getCustomDicePresetFormClosedState,
  getCustomDicePresetFormOpenState,
  getCustomDicePresetSaveResult,
  getDicePanelDragPosition,
  getDicePanelDragStart,
  getDicePanelPresentation,
  getDicePanelPositionInViewport,
  getDiceFeedTone,
  getDicePlacementAvailable,
  getDicePlacementFacingAvailable,
  getDicePlacementHelp,
  getDiceDisplayModeChangePlan,
  getDiceDisplaySelectValueForView,
  getDicePanelAdvancedChangePlan,
  isPendingRecentDiceRoll,
  loadCustomDicePresets,
  removeCustomDicePreset,
  rollDiceExpression,
  saveCustomDicePresets,
  type CustomDicePreset,
  type DicePanelDragState,
  type DicePanelPosition,
  type DiceType
} from "../../lib/dice";
import { getActiveWeatherEffects } from "../../lib/effects";
import { type ModalSize, useResizableModal } from "../../hooks/useResizableModal";

type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;
const TABLE_MESSAGE_DURATIONS = [
  { label: "5 seconds", value: 5_000 },
  { label: "10 seconds", value: 10_000 },
  { label: "30 seconds", value: 30_000 },
  { label: "1 minute", value: 60_000 },
  { label: "5 minutes", value: 300_000 }
];
const TABLE_MESSAGE_PLACEMENTS: Array<{ label: string; value: TableMessagePlacement }> = [
  { label: "Top", value: "top" },
  { label: "Center", value: "center" },
  { label: "Bottom", value: "bottom" }
];
const TABLE_MESSAGE_LAYOUTS: Array<{ label: string; value: TableMessageLayout }> = [
  { label: "Screen", value: "screen" },
  { label: "Table edges", value: "table-edges" }
];
const TABLE_MESSAGE_STYLES: Array<{ label: string; value: TableMessageStyle }> = [
  { label: "Notice", value: "notice" },
  { label: "Dramatic", value: "dramatic" },
  { label: "Danger", value: "danger" },
  { label: "Success", value: "success" }
];

interface WorkspaceTopbarProps {
  campaign: Campaign | null;
  activeScene: Scene | null;
  mapAsset: Asset | null;
  playerMenuOpen: boolean;
  playerDisplayMode: PlayerDisplayMode;
  onSendToPlayer: () => void;
  onTogglePlayerMenu: () => void;
  onShowPlayerHold: () => void;
  onShowPlayerBlackout: () => void;
  onOpenTableDisplaySetup: () => void;
  onOpenPlayerDisplayScale: () => void;
  onOpenMapCalibrationAssistant: () => void;
  onSetPlayerFullscreen: (fullscreen: boolean) => void;
  onClosePlayerView: () => void;
  onSendTableMessage: (message: { text: string; durationMs: number; layout: TableMessageLayout; placement: TableMessagePlacement; style: TableMessageStyle; showInGm: boolean }) => void;
  onClearTableMessage: () => void;
  gmDiceDisplayMode: DiceDisplayMode;
  playerDiceDisplayMode: DiceDisplayMode;
  diceSceneRollEnabled: boolean;
  diceSceneRollTarget: DiceSceneRollTarget;
  gmDiceSceneSize: DiceSceneSize;
  playerDiceSceneSize: DiceSceneSize;
  diceSceneThrowDirection: DiceSceneThrowDirection;
  gmDicePanelEdge: DicePanelEdge;
  playerDicePanelEdge: DicePanelEdge;
  gmDicePanelFacing: DicePanelFacing;
  playerDicePanelFacing: DicePanelFacing;
  gmDicePanelPosition: number;
  playerDicePanelPosition: number;
  gmDicePanelAdvanced: boolean;
  playerDicePanelAdvanced: boolean;
  diceImpactVolume: number;
  diceImpactBody: number;
  diceImpactClick: number;
  diceImpactBrightness: number;
  diceImpactDecay: number;
  diceImpactPitch: number;
  diceHistory: DiceRollEvent[];
  onGmDiceDisplayModeChange: (mode: DiceDisplayMode) => void;
  onPlayerDiceDisplayModeChange: (mode: DiceDisplayMode) => void;
  onDiceSceneRollEnabledChange: (enabled: boolean) => void;
  onDiceSceneRollTargetChange: (target: DiceSceneRollTarget) => void;
  onGmDiceSceneSizeChange: (size: DiceSceneSize) => void;
  onPlayerDiceSceneSizeChange: (size: DiceSceneSize) => void;
  onDiceSceneThrowDirectionChange: (direction: DiceSceneThrowDirection) => void;
  onGmDicePanelEdgeChange: (edge: DicePanelEdge) => void;
  onPlayerDicePanelEdgeChange: (edge: DicePanelEdge) => void;
  onGmDicePanelFacingChange: (facing: DicePanelFacing) => void;
  onPlayerDicePanelFacingChange: (facing: DicePanelFacing) => void;
  onGmDicePanelPositionChange: (position: number) => void;
  onPlayerDicePanelPositionChange: (position: number) => void;
  onGmDicePanelAdvancedChange: (advanced: boolean) => void;
  onPlayerDicePanelAdvancedChange: (advanced: boolean) => void;
  onDiceImpactVolumeChange: (volume: number) => void;
  onDiceImpactBodyChange: (body: number) => void;
  onDiceImpactClickChange: (click: number) => void;
  onDiceImpactBrightnessChange: (brightness: number) => void;
  onDiceImpactDecayChange: (decay: number) => void;
  onDiceImpactPitchChange: (pitch: number) => void;
  onRollDie: (die: DiceType) => void;
  onRollExpression: (expression: string, rollLabel?: string) => string | null;
  onClearDiceRolls: () => void;
  dicePanelOpen: boolean;
  onDicePanelOpenChange: (open: boolean) => void;
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
  onOpenTableDisplaySetup,
  onOpenPlayerDisplayScale,
  onOpenMapCalibrationAssistant,
  onSetPlayerFullscreen,
  onClosePlayerView,
  onSendTableMessage,
  onClearTableMessage,
  gmDiceDisplayMode,
  playerDiceDisplayMode,
  diceSceneRollEnabled,
  diceSceneRollTarget,
  gmDiceSceneSize,
  playerDiceSceneSize,
  diceSceneThrowDirection,
  gmDicePanelEdge,
  playerDicePanelEdge,
  gmDicePanelFacing,
  playerDicePanelFacing,
  gmDicePanelPosition,
  playerDicePanelPosition,
  gmDicePanelAdvanced,
  playerDicePanelAdvanced,
  diceImpactVolume,
  diceImpactBody,
  diceImpactClick,
  diceImpactBrightness,
  diceImpactDecay,
  diceImpactPitch,
  diceHistory,
  onGmDiceDisplayModeChange,
  onPlayerDiceDisplayModeChange,
  onDiceSceneRollEnabledChange,
  onDiceSceneRollTargetChange,
  onGmDiceSceneSizeChange,
  onPlayerDiceSceneSizeChange,
  onDiceSceneThrowDirectionChange,
  onGmDicePanelEdgeChange,
  onPlayerDicePanelEdgeChange,
  onGmDicePanelFacingChange,
  onPlayerDicePanelFacingChange,
  onGmDicePanelPositionChange,
  onPlayerDicePanelPositionChange,
  onGmDicePanelAdvancedChange,
  onPlayerDicePanelAdvancedChange,
  onDiceImpactVolumeChange,
  onDiceImpactBodyChange,
  onDiceImpactClickChange,
  onDiceImpactBrightnessChange,
  onDiceImpactDecayChange,
  onDiceImpactPitchChange,
  onRollDie,
  onRollExpression,
  onClearDiceRolls,
  dicePanelOpen,
  onDicePanelOpenChange
}: WorkspaceTopbarProps) {
  const [diceExpression, setDiceExpression] = useState("1d20");
  const [diceExpressionError, setDiceExpressionError] = useState<string | null>(null);
  const [customDicePresets, setCustomDicePresets] = useState<CustomDicePreset[]>(() => loadCustomDicePresets(window.localStorage));
  const [presetFormOpen, setPresetFormOpen] = useState(false);
  const [presetLabel, setPresetLabel] = useState("");
  const [presetFormula, setPresetFormula] = useState("");
  const [presetFormError, setPresetFormError] = useState<string | null>(null);
  const [diceSettingsOpen, setDiceSettingsOpen] = useState(false);
  const [diceSoundOpen, setDiceSoundOpen] = useState(false);
  const [dicePlacementOpen, setDicePlacementOpen] = useState(false);
  const [diceFormulaHelpOpen, setDiceFormulaHelpOpen] = useState(false);
  const [diceRecentTick, setDiceRecentTick] = useState(0);
  const [dicePanelCollapsed, setDicePanelCollapsed] = useState(false);
  const [dicePanelPosition, setDicePanelPosition] = useState<DicePanelPosition | null>(null);
  const [dicePanelSize, setDicePanelSize] = useState<ModalSize | null>(null);
  const [dicePanelDragging, setDicePanelDragging] = useState(false);
  const [tableMessageDialogOpen, setTableMessageDialogOpen] = useState(false);
  const [tableMessageText, setTableMessageText] = useState("");
  const [tableMessageDurationMs, setTableMessageDurationMs] = useState(10_000);
  const [tableMessageLayout, setTableMessageLayout] = useState<TableMessageLayout>("screen");
  const [tableMessagePlacement, setTableMessagePlacement] = useState<TableMessagePlacement>("center");
  const [tableMessageStyle, setTableMessageStyle] = useState<TableMessageStyle>("notice");
  const [tableMessageShowInGm, setTableMessageShowInGm] = useState(true);
  const dicePopoverRef = useRef<HTMLDivElement | null>(null);
  const dicePanelDragRef = useRef<DicePanelDragState | null>(null);
  const previousDicePanelOpenRef = useRef(dicePanelOpen);
  const { resize: resizeDicePanel, startResize: startDicePanelResize, stopResize: stopDicePanelResize } = useResizableModal({
    elementRef: dicePopoverRef,
    position: dicePanelPosition,
    size: dicePanelSize,
    minSize: { width: 300, height: 360 },
    onPositionChange: setDicePanelPosition,
    onSizeChange: setDicePanelSize,
    margin: 8
  });
  const title = activeScene?.name ?? (campaign ? "Select or Create a Scene" : "Create or Open a Campaign");
  const subtitle = activeScene
    ? mapAsset
      ? `${mapAsset.name} (${mapAsset.mediaType})`
      : "No map imported"
    : campaign
      ? "Choose a scene from the Scenes panel or add a new scene to start building."
      : "Create a campaign, add a scene, import a map, then send it to Player View.";
  const tableMessageCanSend = tableMessageText.trim().length > 0;

  useEffect(() => {
    saveCustomDicePresets(window.localStorage, customDicePresets);
  }, [customDicePresets]);

  useEffect(() => {
    if (dicePanelOpen && !previousDicePanelOpenRef.current) {
      setDicePanelCollapsed(false);
    }
    previousDicePanelOpenRef.current = dicePanelOpen;
  }, [dicePanelOpen]);

  useEffect(() => {
    if (!diceHistory.some((roll) => isPendingRecentDiceRoll(roll))) {
      return;
    }
    const timer = window.setInterval(() => setDiceRecentTick((tick) => tick + 1), 120);
    return () => window.clearInterval(timer);
  }, [diceHistory]);

  useEffect(() => {
    if (!diceSettingsOpen) {
      setDiceSoundOpen(false);
      setDicePlacementOpen(false);
    }
  }, [diceSettingsOpen]);

  useEffect(() => {
    if (!dicePanelOpen) {
      return;
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDicePanelOpenChange(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [dicePanelOpen, onDicePanelOpenChange]);

  useEffect(() => {
    if (!dicePanelOpen) {
      return;
    }

    const clampCurrentPanelPosition = () => {
      setDicePanelPosition((position) => {
        if (!position) {
          return position;
        }
        const nextPosition = getDicePanelPositionInViewport(position.x, position.y, getCurrentViewport(), dicePopoverRef.current?.getBoundingClientRect());
        return nextPosition.x === position.x && nextPosition.y === position.y ? position : nextPosition;
      });
    };

    clampCurrentPanelPosition();
    window.addEventListener("resize", clampCurrentPanelPosition);
    return () => window.removeEventListener("resize", clampCurrentPanelPosition);
  }, [dicePanelOpen]);

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
    dicePanelDragRef.current = getDicePanelDragStart(event.pointerId, event.clientX, event.clientY, rect);
    setDicePanelPosition(getDicePanelPositionInViewport(rect.left, rect.top, getCurrentViewport(), rect));
    setDicePanelDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const openTableMessageDialog = () => {
    setTableMessageDialogOpen(true);
    if (playerMenuOpen) {
      onTogglePlayerMenu();
    }
  };

  const submitTableMessage = () => {
    const text = tableMessageText.trim();
    if (!text) {
      return;
    }
    onSendTableMessage({
      text,
      durationMs: tableMessageDurationMs,
      layout: tableMessageLayout,
      placement: tableMessagePlacement,
      style: tableMessageStyle,
      showInGm: tableMessageShowInGm
    });
    setTableMessageDialogOpen(false);
  };

  const clearTableMessage = () => {
    onClearTableMessage();
    setTableMessageDialogOpen(false);
  };

  const moveDicePanelDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dicePanelDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    setDicePanelPosition(getDicePanelDragPosition(drag, event.clientX, event.clientY, getCurrentViewport(), dicePopoverRef.current?.getBoundingClientRect()));
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
    onGmDicePanelEdgeChange(DEFAULT_DICE_PANEL_EDGE);
    onGmDicePanelFacingChange(DEFAULT_DICE_PANEL_FACING);
    onGmDicePanelPositionChange(DEFAULT_DICE_PANEL_POSITION);
  };

  const resetPlayerDicePanelPlacement = () => {
    onPlayerDicePanelEdgeChange(DEFAULT_DICE_PANEL_EDGE);
    onPlayerDicePanelFacingChange(DEFAULT_DICE_PANEL_FACING);
    onPlayerDicePanelPositionChange(DEFAULT_DICE_PANEL_POSITION);
  };

  const updateGmDicePanelAdvanced = (advanced: boolean) => {
    const plan = getDicePanelAdvancedChangePlan(advanced);
    onGmDicePanelAdvancedChange(plan.advanced);
    if (plan.resetPlacement) {
      resetGmDicePanelPlacement();
    }
  };

  const updatePlayerDicePanelAdvanced = (advanced: boolean) => {
    const plan = getDicePanelAdvancedChangePlan(advanced);
    onPlayerDicePanelAdvancedChange(plan.advanced);
    if (plan.resetPlacement) {
      resetPlayerDicePanelPlacement();
    }
  };

  const gmPlacementAvailable = getDicePlacementAvailable(gmDiceDisplayMode, diceSceneRollEnabled);
  const playerPlacementAvailable = getDicePlacementAvailable(playerDiceDisplayMode, diceSceneRollEnabled);
  const gmPlacementFacingAvailable = getDicePlacementFacingAvailable(gmDiceDisplayMode, diceSceneRollEnabled);
  const playerPlacementFacingAvailable = getDicePlacementFacingAvailable(playerDiceDisplayMode, diceSceneRollEnabled);
  const gmPlacementHelp = getDicePlacementHelp("GM", gmDiceDisplayMode, diceSceneRollEnabled);
  const playerPlacementHelp = getDicePlacementHelp("Player", playerDiceDisplayMode, diceSceneRollEnabled);
  const gmDisplaySelectValue = getDiceDisplaySelectValueForView(gmDiceDisplayMode, diceSceneRollTarget, "gm", diceSceneRollEnabled);
  const playerDisplaySelectValue = getDiceDisplaySelectValueForView(playerDiceDisplayMode, diceSceneRollTarget, "player", diceSceneRollEnabled);
  const dicePanelPresentation = getDicePanelPresentation(dicePanelPosition, dicePanelSize, dicePanelCollapsed);

  const changeGmDiceDisplayMode = (mode: DiceDisplayMode) => {
    const plan = getDiceDisplayModeChangePlan(mode, "gm", diceSceneRollEnabled);
    if (plan.sceneRollTarget) {
      onDiceSceneRollTargetChange(plan.sceneRollTarget);
    }
    if (plan.sceneRollEnabled !== null) {
      onDiceSceneRollEnabledChange(plan.sceneRollEnabled);
    }
    if (plan.displayMode) {
      onGmDiceDisplayModeChange(plan.displayMode);
    }
  };

  const changePlayerDiceDisplayMode = (mode: DiceDisplayMode) => {
    const plan = getDiceDisplayModeChangePlan(mode, "player", diceSceneRollEnabled);
    if (plan.sceneRollTarget) {
      onDiceSceneRollTargetChange(plan.sceneRollTarget);
    }
    if (plan.sceneRollEnabled !== null) {
      onDiceSceneRollEnabledChange(plan.sceneRollEnabled);
    }
    if (plan.displayMode) {
      onPlayerDiceDisplayModeChange(plan.displayMode);
    }
  };

  const rollPreset = (label: string, formula: string) => {
    setDiceExpression(formula);
    setDiceExpressionError(onRollExpression(formula, label));
  };

  const applyPresetFormState = (state: ReturnType<typeof getCustomDicePresetFormOpenState>) => {
    setPresetFormOpen(state.open);
    setPresetLabel(state.label);
    setPresetFormula(state.formula);
    setPresetFormError(state.error);
  };

  const openPresetForm = () => {
    applyPresetFormState(getCustomDicePresetFormOpenState(diceExpression));
  };

  const closePresetForm = () => {
    applyPresetFormState(getCustomDicePresetFormClosedState());
  };

  const saveCustomPreset = () => {
    const result = getCustomDicePresetSaveResult(presetLabel, presetFormula, crypto.randomUUID(), (formula) => {
      try {
        rollDiceExpression(formula, () => 0.5);
        return null;
      } catch (caught) {
        return caught instanceof Error ? caught.message : "Could not save that dice expression.";
      }
    });
    if (!result.ok) {
      setPresetFormError(result.error);
      return;
    }
    setCustomDicePresets((presets) => addCustomDicePreset(presets, result.preset));
    closePresetForm();
  };

  const deleteCustomPreset = (presetId: string) => {
    setCustomDicePresets((presets) => removeCustomDicePreset(presets, presetId));
  };

  const renderDiceSoundSlider = (label: string, value: number, defaultValue: number, onChange: (value: number) => void) => (
    <label className="dice-settings-row">
      <span>{label}</span>
      <div className="dice-volume-control">
        <input type="range" min="0" max="100" value={Math.round(value * 100)} aria-label={`Dice impact ${label.toLowerCase()}`} onChange={(event) => onChange(Number(event.target.value) / 100)} />
        <output>{Math.round(value * 100)}%</output>
        <button type="button" className="icon-button dice-position-reset" title={`Reset dice impact ${label.toLowerCase()}`} aria-label={`Reset dice impact ${label.toLowerCase()}`} onClick={() => onChange(defaultValue)}>
          <RotateCcw size={13} aria-hidden="true" />
        </button>
      </div>
    </label>
  );

  return (
    <>
    <div className="topbar">
      <div>
        <div className="topbar-title-row">
          <h2>{title}</h2>
          {activeScene && <ActiveWeatherIcons scene={activeScene} />}
        </div>
        <span>{subtitle}</span>
      </div>
      <div className="toolbar-groups">
        {dicePanelOpen && (
            <div
              ref={dicePopoverRef}
              className={dicePanelPresentation.className}
              style={dicePanelPresentation.style}
              role="dialog"
              aria-label="Dice roller"
            >
              <div
                className={dicePanelDragging ? "dice-popover-header dice-popover-header-dragging" : "dice-popover-header"}
                onPointerDown={beginDicePanelDrag}
                onPointerMove={moveDicePanelDrag}
                onPointerUp={endDicePanelDrag}
                onPointerCancel={endDicePanelDrag}
                onDoubleClick={() => setDicePanelCollapsed((collapsed) => !collapsed)}
              >
                <div className="dice-popover-title">
                  <GripVertical size={15} aria-hidden="true" />
                  <strong>Dice Bag</strong>
                </div>
                <div className="dice-popover-header-actions" onPointerDown={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
                  <button
                    className={diceSettingsOpen ? "icon-button dice-panel-icon-active" : "icon-button"}
                    aria-label="Dice rendering settings"
                    title="Dice rendering settings"
                    aria-expanded={diceSettingsOpen}
                    onClick={() => setDiceSettingsOpen((open) => !open)}
                  >
                    <Settings2 size={14} aria-hidden="true" />
                  </button>
                  <button className="icon-button" aria-label="Close dice panel" title="Close dice panel" onClick={() => onDicePanelOpenChange(false)}>
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
              {!dicePanelCollapsed && <div className="dice-panel-body" aria-label="Roll dice">
                {diceSettingsOpen && (
                  <section className="dice-panel-section" aria-label="Dice rendering settings">
                    <div className="dice-settings-panel">
                      <div className="dice-settings-group">
                        <div className="dice-settings-group-heading">Display</div>
                        <div className="dice-settings-row">
                          <span>GM Display</span>
                          <select value={gmDisplaySelectValue} aria-label="GM dice display mode" onChange={(event) => changeGmDiceDisplayMode(event.target.value as DiceDisplayMode)}>
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
                            value={playerDisplaySelectValue}
                            aria-label="Player dice display mode"
                            onChange={(event) => changePlayerDiceDisplayMode(event.target.value as DiceDisplayMode)}
                          >
                            {DICE_DISPLAY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {diceSceneRollEnabled && (
                        <div className="dice-settings-group">
                          <div className="dice-settings-group-heading">3D Scene Settings</div>
                          <div className={diceSceneRollTarget === "gm" ? "dice-settings-row" : "dice-settings-row dice-settings-row-disabled"}>
                            <span>GM Dice Size</span>
                            <select value={gmDiceSceneSize} disabled={diceSceneRollTarget !== "gm"} aria-label="GM dice size" onChange={(event) => onGmDiceSceneSizeChange(event.target.value as DiceSceneSize)}>
                              {DICE_SCENE_SIZE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className={diceSceneRollTarget === "player" ? "dice-settings-row" : "dice-settings-row dice-settings-row-disabled"}>
                            <span>Player Dice Size</span>
                            <select value={playerDiceSceneSize} disabled={diceSceneRollTarget !== "player"} aria-label="Player dice size" onChange={(event) => onPlayerDiceSceneSizeChange(event.target.value as DiceSceneSize)}>
                              {DICE_SCENE_SIZE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="dice-settings-row">
                            <span>Throw From</span>
                            <select value={diceSceneThrowDirection} aria-label="Dice scene throw direction" onChange={(event) => onDiceSceneThrowDirectionChange(event.target.value as DiceSceneThrowDirection)}>
                              {DICE_SCENE_THROW_DIRECTION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          {renderDiceSoundSlider("Volume", diceImpactVolume, DEFAULT_DICE_SETTINGS.impactVolume, onDiceImpactVolumeChange)}
                          <button type="button" className="dice-settings-group-heading dice-settings-group-toggle dice-subsection-toggle" aria-expanded={diceSoundOpen} onClick={() => setDiceSoundOpen((open) => !open)}>
                            {diceSoundOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                            <strong>Advanced Sound</strong>
                          </button>
                          {diceSoundOpen && (
                            <div className="dice-sound-settings">
                              {renderDiceSoundSlider("Body", diceImpactBody, DEFAULT_DICE_SETTINGS.impactBody, onDiceImpactBodyChange)}
                              {renderDiceSoundSlider("Click", diceImpactClick, DEFAULT_DICE_SETTINGS.impactClick, onDiceImpactClickChange)}
                              {renderDiceSoundSlider("Brightness", diceImpactBrightness, DEFAULT_DICE_SETTINGS.impactBrightness, onDiceImpactBrightnessChange)}
                              {renderDiceSoundSlider("Decay", diceImpactDecay, DEFAULT_DICE_SETTINGS.impactDecay, onDiceImpactDecayChange)}
                              {renderDiceSoundSlider("Pitch", diceImpactPitch, DEFAULT_DICE_SETTINGS.impactPitch, onDiceImpactPitchChange)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="dice-settings-group">
                        <button type="button" className="dice-settings-group-heading dice-settings-group-toggle" aria-expanded={dicePlacementOpen} onClick={() => setDicePlacementOpen((open) => !open)}>
                          {dicePlacementOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                          <strong>Advanced Placement</strong>
                        </button>
                        {dicePlacementOpen && (
                          <>
                            <div className="dice-settings-row">
                              <span>GM Display Placement</span>
                              <label className="fog-operation-switch weather-category-switch dice-placement-switch" title={gmPlacementAvailable ? "Enable GM display edge placement" : gmPlacementHelp}>
                                <span>Off</span>
                                <input type="checkbox" checked={gmDicePanelAdvanced} disabled={!gmPlacementAvailable} aria-label="GM display placement" onChange={(event) => updateGmDicePanelAdvanced(event.target.checked)} />
                                <span>On</span>
                              </label>
                            </div>
                            <div className="dice-placement-help" role="note">{gmPlacementHelp}</div>
                            {gmDicePanelAdvanced && (
                              <>
                                <div className={gmPlacementAvailable ? "dice-settings-row" : "dice-settings-row dice-settings-row-disabled"}>
                                  <span>Edge</span>
                                  <select value={gmDicePanelEdge} disabled={!gmPlacementAvailable} aria-label="GM display edge" onChange={(event) => onGmDicePanelEdgeChange(event.target.value as DicePanelEdge)}>
                                    {DICE_PANEL_EDGE_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className={gmPlacementFacingAvailable ? "dice-settings-row" : "dice-settings-row dice-settings-row-disabled"}>
                                  <span>Facing</span>
                                  <select value={gmDicePanelFacing} disabled={!gmPlacementFacingAvailable} aria-label="GM display facing" onChange={(event) => onGmDicePanelFacingChange(event.target.value as DicePanelFacing)}>
                                    {DICE_PANEL_FACING_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <label className={gmPlacementAvailable ? "dice-settings-row" : "dice-settings-row dice-settings-row-disabled"}>
                                  <span>Edge Position</span>
                                  <div className="dice-position-control">
                                    <input type="range" min="0" max="100" value={Math.round(gmDicePanelPosition * 100)} disabled={!gmPlacementAvailable} aria-label="GM display edge position" onChange={(event) => onGmDicePanelPositionChange(Number(event.target.value) / 100)} />
                                    <button type="button" className="icon-button dice-position-reset" disabled={!gmPlacementAvailable} title="Reset GM display edge position" aria-label="Reset GM display edge position" onClick={() => onGmDicePanelPositionChange(0.5)}>
                                      <RotateCcw size={13} aria-hidden="true" />
                                    </button>
                                  </div>
                                </label>
                              </>
                            )}
                            <div className="dice-settings-row">
                              <span>Player Display Placement</span>
                              <label className="fog-operation-switch weather-category-switch dice-placement-switch" title={playerPlacementAvailable ? "Enable Player display edge placement" : playerPlacementHelp}>
                                <span>Off</span>
                                <input type="checkbox" checked={playerDicePanelAdvanced} disabled={!playerPlacementAvailable} aria-label="Player display placement" onChange={(event) => updatePlayerDicePanelAdvanced(event.target.checked)} />
                                <span>On</span>
                              </label>
                            </div>
                            <div className="dice-placement-help" role="note">{playerPlacementHelp}</div>
                            {playerDicePanelAdvanced && (
                              <>
                                <div className={playerPlacementAvailable ? "dice-settings-row" : "dice-settings-row dice-settings-row-disabled"}>
                                  <span>Edge</span>
                                  <select value={playerDicePanelEdge} disabled={!playerPlacementAvailable} aria-label="Player display edge" onChange={(event) => onPlayerDicePanelEdgeChange(event.target.value as DicePanelEdge)}>
                                    {DICE_PANEL_EDGE_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className={playerPlacementFacingAvailable ? "dice-settings-row" : "dice-settings-row dice-settings-row-disabled"}>
                                  <span>Facing</span>
                                  <select value={playerDicePanelFacing} disabled={!playerPlacementFacingAvailable} aria-label="Player display facing" onChange={(event) => onPlayerDicePanelFacingChange(event.target.value as DicePanelFacing)}>
                                    {DICE_PANEL_FACING_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <label className={playerPlacementAvailable ? "dice-settings-row" : "dice-settings-row dice-settings-row-disabled"}>
                                  <span>Edge Position</span>
                                  <div className="dice-position-control">
                                    <input type="range" min="0" max="100" value={Math.round(playerDicePanelPosition * 100)} disabled={!playerPlacementAvailable} aria-label="Player display edge position" onChange={(event) => onPlayerDicePanelPositionChange(Number(event.target.value) / 100)} />
                                    <button type="button" className="icon-button dice-position-reset" disabled={!playerPlacementAvailable} title="Reset Player display edge position" aria-label="Reset Player display edge position" onClick={() => onPlayerDicePanelPositionChange(0.5)}>
                                      <RotateCcw size={13} aria-hidden="true" />
                                    </button>
                                  </div>
                                </label>
                              </>
                            )}
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
                    <strong>Quick Dice</strong>
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
                    <strong>Presets</strong>
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
                          onClick={() => deleteCustomPreset(preset.id)}
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
                        onClick={closePresetForm}
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
                      <strong>Recent</strong>
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
                          <div key={roll.id} className={`dice-roll-feed-item dice-roll-tone-${getDiceFeedTone(roll, diceRecentTick)}`}>
                            <span>{formatDiceRollSummary(roll)}</span>
                            <strong>{formatDiceFeedLabel(roll, diceRecentTick)}</strong>
                            <small title={formatDiceFeedBreakdownTooltip(roll, diceRecentTick)}>{formatDiceFeedBreakdown(roll, diceRecentTick)}</small>
                          </div>
                        ))
                      ) : (
                        <div className="dice-empty-state">No recent rolls.</div>
                      )}
                    </div>
                  </div>
                </section>
              </div>}
              {!dicePanelCollapsed && (
                <div
                  className="modal-resize-handle"
                  title="Drag to resize"
                  aria-label="Resize dice bag"
                  onPointerDown={startDicePanelResize}
                  onPointerMove={resizeDicePanel}
                  onPointerUp={stopDicePanelResize}
                  onPointerCancel={stopDicePanelResize}
                />
              )}
            </div>
        )}
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
                <div className="scene-menu toolbar-menu player-view-menu">
                  <div className="menu-section-label">Playback</div>
                  <div className="menu-section">
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
                    <button onClick={openTableMessageDialog}>
                      <MessageSquare size={14} aria-hidden="true" />
                      Message Overlay
                    </button>
                  </div>
                  <div className="menu-section-label">Window</div>
                  <div className="menu-section">
                    <button onClick={() => onSetPlayerFullscreen(true)}>
                      <Maximize2 size={14} aria-hidden="true" />
                      Fullscreen
                    </button>
                    <button onClick={() => onSetPlayerFullscreen(false)}>
                      <Minimize2 size={14} aria-hidden="true" />
                      Exit fullscreen
                    </button>
                    <button className="danger-menu-item" onClick={onClosePlayerView}>
                      <X size={14} aria-hidden="true" />
                      Close window
                    </button>
                  </div>
                  <div className="menu-section-label">Setup</div>
                  <div className="menu-section">
                    <button disabled={!activeScene} onClick={onOpenTableDisplaySetup}>
                      <Settings2 size={14} aria-hidden="true" />
                      Table Display Setup
                    </button>
                    <button disabled={!activeScene} onClick={onOpenPlayerDisplayScale}>
                      <MonitorUp size={14} aria-hidden="true" />
                      Player View Setup
                    </button>
                    <button disabled={!activeScene} onClick={onOpenMapCalibrationAssistant}>
                      <Map size={14} aria-hidden="true" />
                      Advanced Map Calibration
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    {tableMessageDialogOpen && (
      <div className="modal-backdrop" onMouseDown={() => setTableMessageDialogOpen(false)}>
        <div className="modal table-message-dialog" onMouseDown={(event) => event.stopPropagation()}>
          <h2>Table Message Overlay</h2>
          <label className="table-message-field">
            <span>Message</span>
            <textarea
              value={tableMessageText}
              maxLength={180}
              rows={4}
              autoFocus
              onChange={(event) => setTableMessageText(event.target.value)}
            />
          </label>
          <div className="table-message-grid">
            <label className="table-message-field">
              <span>Duration</span>
              <select value={tableMessageDurationMs} onChange={(event) => setTableMessageDurationMs(Number(event.target.value))}>
                {TABLE_MESSAGE_DURATIONS.map((duration) => (
                  <option key={duration.value} value={duration.value}>{duration.label}</option>
                ))}
              </select>
            </label>
            <label className="table-message-field">
              <span>Layout</span>
              <select value={tableMessageLayout} onChange={(event) => setTableMessageLayout(event.target.value as TableMessageLayout)}>
                {TABLE_MESSAGE_LAYOUTS.map((layout) => (
                  <option key={layout.value} value={layout.value}>{layout.label}</option>
                ))}
              </select>
            </label>
            <label className="table-message-field">
              <span>Placement</span>
              <select value={tableMessagePlacement} disabled={tableMessageLayout !== "screen"} onChange={(event) => setTableMessagePlacement(event.target.value as TableMessagePlacement)}>
                {TABLE_MESSAGE_PLACEMENTS.map((placement) => (
                  <option key={placement.value} value={placement.value}>{placement.label}</option>
                ))}
              </select>
            </label>
            <label className="table-message-field">
              <span>Style</span>
              <select value={tableMessageStyle} onChange={(event) => setTableMessageStyle(event.target.value as TableMessageStyle)}>
                {TABLE_MESSAGE_STYLES.map((style) => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="table-message-check">
            <input type="checkbox" checked={tableMessageShowInGm} onChange={(event) => setTableMessageShowInGm(event.target.checked)} />
            <span>Show in GM View</span>
          </label>
          <div className="button-row modal-actions">
            <button type="button" onClick={clearTableMessage}>Clear</button>
            <button type="button" onClick={() => setTableMessageDialogOpen(false)}>Cancel</button>
            <button type="button" disabled={!tableMessageCanSend} onClick={submitTableMessage}>Send</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function getCurrentViewport(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight };
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
