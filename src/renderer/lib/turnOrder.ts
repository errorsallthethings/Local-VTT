import type { Asset, Scene, Token, TurnOrderEntry, TurnOrderSettings } from "../../shared/localvtt";

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

export function addTurnOrderEntry(scene: Scene, entry: TurnOrderEntry, updatedAt = new Date().toISOString()): Scene {
  return patchTurnOrder(scene, { entries: [...scene.turnOrder.entries, entry], currentEntryId: scene.turnOrder.currentEntryId ?? entry.id }, updatedAt);
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

export function removeTurnOrderEntry(scene: Scene, entryId: string, updatedAt = new Date().toISOString()): Scene {
  const entries = scene.turnOrder.entries.filter((entry) => entry.id !== entryId);
  const currentEntryId = scene.turnOrder.currentEntryId === entryId ? entries[0]?.id : scene.turnOrder.currentEntryId;
  return patchTurnOrder(scene, { entries, currentEntryId, active: entries.length > 0 && scene.turnOrder.active }, updatedAt);
}

export function sortTurnOrderByInitiative(scene: Scene, updatedAt = new Date().toISOString()): Scene {
  const entries = [...scene.turnOrder.entries].sort((a, b) => b.initiative - a.initiative || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return patchTurnOrder(scene, { entries, currentEntryId: scene.turnOrder.currentEntryId ?? entries[0]?.id }, updatedAt);
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

export function startTurnOrder(scene: Scene, updatedAt = new Date().toISOString()): Scene {
  if (scene.turnOrder.entries.length === 0) {
    return patchTurnOrder(scene, { active: false, currentEntryId: undefined }, updatedAt);
  }
  return patchTurnOrder(
    scene,
    {
      active: true,
      currentEntryId: scene.turnOrder.currentEntryId ?? scene.turnOrder.entries[0].id,
      playerViewVisible: true
    },
    updatedAt
  );
}

export function stopTurnOrder(scene: Scene, updatedAt = new Date().toISOString()): Scene {
  return patchTurnOrder(scene, { active: false, playerViewVisible: false }, updatedAt);
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

function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "") || fileName;
}
