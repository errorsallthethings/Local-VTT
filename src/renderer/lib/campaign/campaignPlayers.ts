import { DEFAULT_TOKEN_BORDER_COLOR, PLAYER_INDICATOR_THEMES, type Campaign, type CampaignPlayer, type Scene } from "../../../shared/localvtt";
import { removeTurnOrderEntriesForPlayer, updateTurnOrderEntriesForPlayer } from "../turn-order";

export const MAX_CAMPAIGN_PLAYERS = 7;

export type CampaignPlayerMutation = {
  campaign: Campaign;
  scene: Scene | null;
};

export function addCampaignPlayerToCampaign(campaign: Campaign, playerId: string, updatedAt: string): Campaign | null {
  if (campaign.players.length >= MAX_CAMPAIGN_PLAYERS) {
    return null;
  }

  return {
    ...campaign,
    players: [
      ...campaign.players,
      {
        id: playerId,
        name: `Player ${campaign.players.length + 1}`,
        color: DEFAULT_TOKEN_BORDER_COLOR,
        indicatorTheme: PLAYER_INDICATOR_THEMES[0],
        defaultSeatEdge: "bottom",
        defaultSeatPosition: 0.5,
        visibleInPlayer: true
      }
    ],
    updatedAt
  };
}

export function updateCampaignPlayerInCampaign(
  campaign: Campaign,
  activeScene: Scene | null,
  playerId: string,
  patch: Partial<CampaignPlayer>,
  updatedAt: string
): CampaignPlayerMutation {
  const players = campaign.players.map((player) => (player.id === playerId ? { ...player, ...patch } : player));
  const updatedPlayer = players.find((player) => player.id === playerId);
  const nextCampaign = { ...campaign, players, updatedAt };
  return {
    campaign: nextCampaign,
    scene:
      activeScene && updatedPlayer && activeScene.turnOrder.entries.some((entry) => entry.playerId === playerId)
        ? updateTurnOrderEntriesForPlayer(activeScene, updatedPlayer, updatedAt)
        : null
  };
}

export function deleteCampaignPlayerFromCampaign(campaign: Campaign, activeScene: Scene | null, playerId: string, updatedAt: string): CampaignPlayerMutation {
  const nextCampaign = {
    ...campaign,
    players: campaign.players.filter((player) => player.id !== playerId),
    updatedAt
  };
  return {
    campaign: nextCampaign,
    scene:
      activeScene && activeScene.turnOrder.entries.some((entry) => entry.playerId === playerId)
        ? removeTurnOrderEntriesForPlayer(activeScene, playerId, updatedAt)
        : null
  };
}
