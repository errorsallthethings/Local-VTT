import type { Asset, CampaignPlayer, Scene, Token, TurnOrderEntry, TurnOrderSettings } from "../../../shared/localvtt";

export interface TurnOrderTokenIndicator {
  label: string;
  current: boolean;
}

export function createManualTurnOrderEntry(id: string, name: string, initiative = 0): TurnOrderEntry {
  return {
    id,
    name: name.trim() || "New Entry",
    initiative,
    visibleInPlayer: true
  };
}

export function createTurnOrderEntryFromAsset(id: string, asset: Asset, initiative = 0): TurnOrderEntry {
  return {
    id,
    name: asset.name || stripFileExtension(asset.originalFileName) || "Token",
    initiative,
    visibleInPlayer: true,
    assetId: asset.id
  };
}

export function createTurnOrderEntryFromToken(id: string, token: Token, initiative = 0): TurnOrderEntry {
  return {
    id,
    name: token.name || "Token",
    initiative,
    visibleInPlayer: token.visibleInPlayer,
    tokenId: token.id,
    assetId: token.assetId
  };
}

export function createTurnOrderEntryFromPlayer(id: string, player: CampaignPlayer, initiative = 0): TurnOrderEntry {
  return {
    id,
    name: player.name || "Player",
    initiative,
    visibleInPlayer: true,
    playerId: player.id,
    assetId: player.assetId
  };
}

export function getTurnOrderTokenIndicators(scene: Scene): Map<string, TurnOrderTokenIndicator> {
  const sceneTokenIds = new Set(scene.tokens.map((token) => token.id));
  const indicators = new Map<string, TurnOrderTokenIndicator>();
  scene.turnOrder.entries.forEach((entry, index) => {
    if (!entry.tokenId || !sceneTokenIds.has(entry.tokenId) || indicators.has(entry.tokenId)) {
      return;
    }
    indicators.set(entry.tokenId, {
      label: String(index + 1),
      current: scene.turnOrder.active && entry.id === scene.turnOrder.currentEntryId
    });
  });
  return indicators;
}

export function addTurnOrderEntry(scene: Scene, entry: TurnOrderEntry, updatedAt = new Date().toISOString()): Scene {
  const entries = [...scene.turnOrder.entries, entry];
  return patchTurnOrder(scene, { entries, currentEntryId: getValidCurrentEntryId(entries, scene.turnOrder.currentEntryId) ?? entry.id }, updatedAt);
}

export function addPlayersToTurnOrder(scene: Scene, players: CampaignPlayer[], updatedAt = new Date().toISOString()): Scene {
  const existingPlayerIds = new Set(scene.turnOrder.entries.map((entry) => entry.playerId).filter(Boolean));
  const newEntries = players
    .filter((player) => !existingPlayerIds.has(player.id))
    .map((player) => createTurnOrderEntryFromPlayer(crypto.randomUUID(), player));
  if (newEntries.length === 0) {
    return scene;
  }
  return patchTurnOrder(
    scene,
    {
      entries: [...scene.turnOrder.entries, ...newEntries],
      currentEntryId: getValidCurrentEntryId([...scene.turnOrder.entries, ...newEntries], scene.turnOrder.currentEntryId) ?? newEntries[0]?.id
    },
    updatedAt
  );
}

export function updateTurnOrderEntry(scene: Scene, entryId: string, patch: Partial<TurnOrderEntry>, updatedAt = new Date().toISOString()): Scene {
  return patchTurnOrder(
    scene,
    {
      entries: scene.turnOrder.entries.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry))
    },
    updatedAt
  );
}

export function updateTurnOrderEntriesForPlayer(scene: Scene, player: CampaignPlayer, updatedAt = new Date().toISOString()): Scene {
  if (!scene.turnOrder.entries.some((entry) => entry.playerId === player.id)) {
    return scene;
  }
  return patchTurnOrder(
    scene,
    {
      entries: scene.turnOrder.entries.map((entry) =>
        entry.playerId === player.id
          ? {
              ...entry,
              name: player.name,
              assetId: player.assetId
            }
          : entry
      )
    },
    updatedAt
  );
}

export function removeTurnOrderEntry(scene: Scene, entryId: string, updatedAt = new Date().toISOString()): Scene {
  const entries = scene.turnOrder.entries.filter((entry) => entry.id !== entryId);
  const currentEntryId = getValidCurrentEntryId(entries, scene.turnOrder.currentEntryId === entryId ? undefined : scene.turnOrder.currentEntryId) ?? entries[0]?.id;
  return patchTurnOrder(
    scene,
    {
      entries,
      currentEntryId,
      active: entries.length > 0 && scene.turnOrder.active,
      playerViewVisible: entries.length > 0 && scene.turnOrder.playerViewVisible
    },
    updatedAt
  );
}

export function removeTurnOrderEntriesForPlayer(scene: Scene, playerId: string, updatedAt = new Date().toISOString()): Scene {
  const entriesToRemove = new Set(scene.turnOrder.entries.filter((entry) => entry.playerId === playerId).map((entry) => entry.id));
  if (entriesToRemove.size === 0) {
    return scene;
  }
  const entries = scene.turnOrder.entries.filter((entry) => !entriesToRemove.has(entry.id));
  const currentEntryId = getValidCurrentEntryId(entries, entriesToRemove.has(scene.turnOrder.currentEntryId ?? "") ? undefined : scene.turnOrder.currentEntryId) ?? entries[0]?.id;
  return patchTurnOrder(
    scene,
    {
      entries,
      currentEntryId,
      active: entries.length > 0 && scene.turnOrder.active,
      playerViewVisible: entries.length > 0 && scene.turnOrder.playerViewVisible
    },
    updatedAt
  );
}

export function sortTurnOrderByInitiative(scene: Scene, updatedAt = new Date().toISOString()): Scene {
  const entries = [...scene.turnOrder.entries].sort((a, b) => b.initiative - a.initiative || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return patchTurnOrder(scene, { entries, currentEntryId: scene.turnOrder.active ? (getValidCurrentEntryId(entries, scene.turnOrder.currentEntryId) ?? entries[0]?.id) : entries[0]?.id }, updatedAt);
}

export function rollInitiativeForNonPlayers(scene: Scene, random = Math.random, updatedAt = new Date().toISOString()): Scene {
  const diceCount = Math.max(1, Math.min(20, Math.round(scene.turnOrder.initiativeDiceCount || 1)));
  const diceSides = Math.max(2, Math.min(100, Math.round(scene.turnOrder.initiativeDiceSides || 20)));
  return patchTurnOrder(
    scene,
    {
      entries: scene.turnOrder.entries.map((entry) =>
        entry.playerId
          ? entry
          : {
              ...entry,
              initiative: rollDice(diceCount, diceSides, random)
            }
      )
    },
    updatedAt
  );
}

export function rollInitiativeForEntry(scene: Scene, entryId: string, random = Math.random, updatedAt = new Date().toISOString()): Scene {
  const diceCount = Math.max(1, Math.min(20, Math.round(scene.turnOrder.initiativeDiceCount || 1)));
  const diceSides = Math.max(2, Math.min(100, Math.round(scene.turnOrder.initiativeDiceSides || 20)));
  return updateTurnOrderEntry(scene, entryId, { initiative: rollDice(diceCount, diceSides, random) }, updatedAt);
}

export function moveTurnOrderEntry(scene: Scene, entryId: string, direction: "up" | "down", updatedAt = new Date().toISOString()): Scene {
  const index = scene.turnOrder.entries.findIndex((entry) => entry.id === entryId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= scene.turnOrder.entries.length) {
    return scene;
  }
  const entries = [...scene.turnOrder.entries];
  const [entry] = entries.splice(index, 1);
  entries.splice(targetIndex, 0, entry);
  return patchTurnOrder(scene, { entries }, updatedAt);
}

export function reorderTurnOrderEntry(scene: Scene, entryId: string, targetIndex: number, updatedAt = new Date().toISOString()): Scene {
  const currentIndex = scene.turnOrder.entries.findIndex((entry) => entry.id === entryId);
  if (currentIndex < 0) {
    return scene;
  }
  const entries = [...scene.turnOrder.entries];
  const [entry] = entries.splice(currentIndex, 1);
  const clampedIndex = Math.max(0, Math.min(entries.length, targetIndex));
  entries.splice(clampedIndex, 0, entry);
  return patchTurnOrder(scene, { entries }, updatedAt);
}

export function startTurnOrder(scene: Scene, updatedAt = new Date().toISOString()): Scene {
  if (scene.turnOrder.entries.length === 0) {
    return patchTurnOrder(scene, { active: false, currentEntryId: undefined }, updatedAt);
  }
  return patchTurnOrder(
    scene,
    {
      active: true,
      currentEntryId: getValidCurrentEntryId(scene.turnOrder.entries, scene.turnOrder.currentEntryId) ?? scene.turnOrder.entries[0].id,
      playerViewVisible: true
    },
    updatedAt
  );
}

export function stopTurnOrder(scene: Scene, updatedAt = new Date().toISOString()): Scene {
  return patchTurnOrder(scene, { active: false, playerViewVisible: false }, updatedAt);
}

export function stopActiveTurnOrder(scene: Scene, updatedAt = new Date().toISOString()): Scene {
  if (!scene.turnOrder.active && !scene.turnOrder.playerViewVisible) {
    return scene;
  }
  return stopTurnOrder(scene, updatedAt);
}

export function advanceTurnOrder(scene: Scene, direction: "next" | "previous", updatedAt = new Date().toISOString()): Scene {
  const entries = scene.turnOrder.entries;
  if (entries.length === 0) {
    return patchTurnOrder(scene, { active: false, currentEntryId: undefined }, updatedAt);
  }
  const currentIndex = Math.max(0, entries.findIndex((entry) => entry.id === scene.turnOrder.currentEntryId));
  const delta = direction === "next" ? 1 : -1;
  const nextIndex = (currentIndex + delta + entries.length) % entries.length;
  return patchTurnOrder(scene, { active: true, currentEntryId: entries[nextIndex].id }, updatedAt);
}

export function patchTurnOrder(scene: Scene, patch: Partial<TurnOrderSettings>, updatedAt = new Date().toISOString()): Scene {
  return {
    ...scene,
    turnOrder: {
      ...scene.turnOrder,
      ...patch
    },
    updatedAt
  };
}

function getValidCurrentEntryId(entries: TurnOrderEntry[], currentEntryId?: string): string | undefined {
  return currentEntryId && entries.some((entry) => entry.id === currentEntryId) ? currentEntryId : undefined;
}

function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "") || fileName;
}

function rollDice(count: number, sides: number, random: () => number): number {
  let total = 0;
  for (let index = 0; index < count; index += 1) {
    total += Math.floor(random() * sides) + 1;
  }
  return total;
}
