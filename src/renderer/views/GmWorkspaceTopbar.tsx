import type {
  Asset,
  Campaign,
  DiceSettings,
  LiveTableEvent,
  Scene,
} from "../../shared/localvtt";
import { WorkspaceTopbar } from "../components/workspace/WorkspaceTopbar";
import type { DiceType } from "../lib/dice";
import type { PlayerDisplayMode } from "../lib/player-view";

type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;

interface GmWorkspaceTopbarProps {
  campaign: Campaign | null;
  activeScene: Scene | null;
  mapAsset: Asset | null;
  playerMenuOpen: boolean;
  playerDisplayMode: PlayerDisplayMode;
  diceSettings: DiceSettings;
  diceHistory: DiceRollEvent[];
  dicePanelOpen: boolean;
  onSendToPlayer: () => void;
  onTogglePlayerMenu: () => void;
  onShowPlayerHold: () => void;
  onShowPlayerBlackout: () => void;
  onOpenTableDisplaySetup: () => void;
  onOpenPlayerDisplayScale: () => void;
  onOpenMapCalibrationAssistant: () => void;
  onSetPlayerFullscreen: (fullscreen: boolean) => void;
  onClosePlayerView: () => void;
  onUpdateDiceSettings: (patch: Partial<DiceSettings>) => void;
  onRollDie: (die: DiceType) => void;
  onRollExpression: (expression: string, rollLabel?: string) => string | null;
  onClearDiceRolls: () => void;
  onDicePanelOpenChange: (open: boolean) => void;
}

export function GmWorkspaceTopbar({
  campaign,
  activeScene,
  mapAsset,
  playerMenuOpen,
  playerDisplayMode,
  diceSettings,
  diceHistory,
  dicePanelOpen,
  onSendToPlayer,
  onTogglePlayerMenu,
  onShowPlayerHold,
  onShowPlayerBlackout,
  onOpenTableDisplaySetup,
  onOpenPlayerDisplayScale,
  onOpenMapCalibrationAssistant,
  onSetPlayerFullscreen,
  onClosePlayerView,
  onUpdateDiceSettings,
  onRollDie,
  onRollExpression,
  onClearDiceRolls,
  onDicePanelOpenChange,
}: GmWorkspaceTopbarProps) {
  return (
    <WorkspaceTopbar
      campaign={campaign}
      activeScene={activeScene}
      mapAsset={mapAsset}
      playerMenuOpen={playerMenuOpen}
      playerDisplayMode={playerDisplayMode}
      onSendToPlayer={onSendToPlayer}
      onTogglePlayerMenu={onTogglePlayerMenu}
      onShowPlayerHold={onShowPlayerHold}
      onShowPlayerBlackout={onShowPlayerBlackout}
      onOpenTableDisplaySetup={onOpenTableDisplaySetup}
      onOpenPlayerDisplayScale={onOpenPlayerDisplayScale}
      onOpenMapCalibrationAssistant={onOpenMapCalibrationAssistant}
      onSetPlayerFullscreen={onSetPlayerFullscreen}
      onClosePlayerView={onClosePlayerView}
      gmDiceDisplayMode={diceSettings.gmDisplayMode}
      playerDiceDisplayMode={diceSettings.playerDisplayMode}
      diceSceneRollEnabled={diceSettings.sceneRollEnabled}
      diceSceneRollTarget={diceSettings.sceneRollTarget}
      gmDiceSceneSize={diceSettings.gmSceneSize}
      playerDiceSceneSize={diceSettings.playerSceneSize}
      gmDicePanelEdge={diceSettings.gmPanelEdge}
      playerDicePanelEdge={diceSettings.playerPanelEdge}
      gmDicePanelFacing={diceSettings.gmPanelFacing}
      playerDicePanelFacing={diceSettings.playerPanelFacing}
      gmDicePanelPosition={diceSettings.gmPanelPosition}
      playerDicePanelPosition={diceSettings.playerPanelPosition}
      gmDicePanelAdvanced={diceSettings.gmPanelAdvanced}
      playerDicePanelAdvanced={diceSettings.playerPanelAdvanced}
      diceHistory={diceHistory}
      onGmDiceDisplayModeChange={(gmDisplayMode) => onUpdateDiceSettings({ gmDisplayMode })}
      onPlayerDiceDisplayModeChange={(playerDisplayMode) => onUpdateDiceSettings({ playerDisplayMode })}
      onDiceSceneRollEnabledChange={(sceneRollEnabled) => onUpdateDiceSettings({ sceneRollEnabled })}
      onDiceSceneRollTargetChange={(sceneRollTarget) => onUpdateDiceSettings({ sceneRollTarget })}
      onGmDiceSceneSizeChange={(gmSceneSize) => onUpdateDiceSettings({ gmSceneSize })}
      onPlayerDiceSceneSizeChange={(playerSceneSize) => onUpdateDiceSettings({ playerSceneSize })}
      onGmDicePanelEdgeChange={(gmPanelEdge) => onUpdateDiceSettings({ gmPanelEdge })}
      onPlayerDicePanelEdgeChange={(playerPanelEdge) => onUpdateDiceSettings({ playerPanelEdge })}
      onGmDicePanelFacingChange={(gmPanelFacing) => onUpdateDiceSettings({ gmPanelFacing })}
      onPlayerDicePanelFacingChange={(playerPanelFacing) => onUpdateDiceSettings({ playerPanelFacing })}
      onGmDicePanelPositionChange={(gmPanelPosition) => onUpdateDiceSettings({ gmPanelPosition })}
      onPlayerDicePanelPositionChange={(playerPanelPosition) => onUpdateDiceSettings({ playerPanelPosition })}
      onGmDicePanelAdvancedChange={(gmPanelAdvanced) => onUpdateDiceSettings({ gmPanelAdvanced })}
      onPlayerDicePanelAdvancedChange={(playerPanelAdvanced) => onUpdateDiceSettings({ playerPanelAdvanced })}
      onRollDie={onRollDie}
      onRollExpression={onRollExpression}
      onClearDiceRolls={onClearDiceRolls}
      dicePanelOpen={dicePanelOpen}
      onDicePanelOpenChange={onDicePanelOpenChange}
    />
  );
}
