import type { Asset, CampaignPlayer, Scene } from "../../shared/localvtt";
import { TurnOrderModal } from "../components/turn-order/TurnOrderModal";
import { TurnOrderPanel } from "../components/turn-order/TurnOrderPanel";

export function GmTurnOrderDock({
  campaignPlayers,
  canStartTurnOrder,
  onChangeScene,
  onClose,
  scene,
  state,
  tokenAssets
}: {
  campaignPlayers: CampaignPlayer[];
  canStartTurnOrder: boolean;
  onChangeScene: (scene: Scene) => void;
  onClose: () => void;
  scene: Scene | null;
  state: {
    turnOrderModalCollapsed: boolean;
    turnOrderModalPosition: { x: number; y: number } | null;
    turnOrderModalSize: { width: number; height: number } | null;
    turnOrderSettingsOpen: boolean;
    setTurnOrderModalCollapsed: (collapsed: boolean | ((collapsed: boolean) => boolean)) => void;
    setTurnOrderModalPosition: (position: { x: number; y: number }) => void;
    setTurnOrderModalSize: (size: { width: number; height: number }) => void;
    setTurnOrderSettingsOpen: (open: boolean | ((open: boolean) => boolean)) => void;
  };
  tokenAssets: Map<string, Asset>;
}) {
  return (
    <TurnOrderModal
      position={state.turnOrderModalPosition}
      size={state.turnOrderModalSize}
      settingsOpen={state.turnOrderSettingsOpen}
      settingsDisabled={!scene}
      collapsed={state.turnOrderModalCollapsed}
      onToggleSettings={() => state.setTurnOrderSettingsOpen((open) => !open)}
      onToggleCollapsed={() => state.setTurnOrderModalCollapsed((collapsed) => !collapsed)}
      onPositionChange={state.setTurnOrderModalPosition}
      onSizeChange={state.setTurnOrderModalSize}
      onClose={onClose}
    >
      <TurnOrderPanel
        scene={scene}
        campaignPlayers={campaignPlayers}
        tokenAssets={tokenAssets}
        canStartTurnOrder={canStartTurnOrder}
        onChangeScene={onChangeScene}
        settingsOpen={state.turnOrderSettingsOpen}
        onSettingsOpenChange={state.setTurnOrderSettingsOpen}
        settingsControlVisible={false}
      />
    </TurnOrderModal>
  );
}
