import { ChevronDown, ChevronRight, Dice5, Eye, EyeOff, GripVertical, Hourglass, ListPlus, MoreVertical, Pause, Play, Plus, RotateCcw, Settings2, SkipBack, SkipForward, Trash2, UserRoundPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import type { Asset, CampaignPlayer, Scene, Token, TurnOrderEntry, TurnOrderSettings, TurnOrderTrackerPlacement } from "../../../shared/localvtt";
import { useFloatingMenuPosition } from "../../hooks/useFloatingMenuPosition";
import { TOKEN_LIBRARY_ASSET_DRAG_TYPE } from "../../lib/tokens";
import {
  addTurnOrderEntry,
  addPlayersToTurnOrder,
  advanceTurnOrder,
  createCountTrackerTurnOrderEntry,
  createManualTurnOrderEntry,
  createTurnOrderGroupFromEntry,
  createTurnOrderEntryFromAsset,
  linkTurnOrderEntryToToken,
  removeTurnOrderEntry,
  resetTurnOrder,
  reorderTurnOrderEntry,
  rollInitiativeForNonPlayers,
  rollInitiativeForEntry,
  sortTurnOrderByInitiative,
  startTurnOrder,
  stopTurnOrder,
  ungroupTurnOrderEntry,
  updateTurnOrderEntry
} from "../../lib/turn-order";

interface TurnOrderPanelProps {
  scene: Scene | null;
  campaignPlayers: CampaignPlayer[];
  tokenAssets: Map<string, Asset>;
  canStartTurnOrder: boolean;
  onChangeScene: (scene: Scene) => void;
  settingsOpen?: boolean;
  onSettingsOpenChange?: (open: boolean) => void;
  settingsControlVisible?: boolean;
}

export function TurnOrderPanel({
  scene,
  campaignPlayers,
  tokenAssets,
  canStartTurnOrder,
  onChangeScene,
  settingsOpen: controlledSettingsOpen,
  onSettingsOpenChange,
  settingsControlVisible = true
}: TurnOrderPanelProps) {
  const [localSettingsOpen, setLocalSettingsOpen] = useState(false);
  const [trackerDisplayOpen, setTrackerDisplayOpen] = useState(false);
  const [globalTrackerOpen, setGlobalTrackerOpen] = useState(false);
  const [playerTurnIndicatorsOpen, setPlayerTurnIndicatorsOpen] = useState(false);
  const [initiativeOpen, setInitiativeOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ entryId: string; placement: "before" | "after" } | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const turnOrder = scene?.turnOrder;
  const currentEntryId = turnOrder?.currentEntryId;
  const playersToAddCount = scene ? campaignPlayers.filter((player) => !scene.turnOrder.entries.some((entry) => entry.playerId === player.id)).length : 0;
  const settingsOpen = controlledSettingsOpen ?? localSettingsOpen;
  const setSettingsOpen = (open: boolean | ((current: boolean) => boolean)) => {
    const nextOpen = typeof open === "function" ? open(settingsOpen) : open;
    if (onSettingsOpenChange) {
      onSettingsOpenChange(nextOpen);
    } else {
      setLocalSettingsOpen(nextOpen);
    }
  };

  const updateScene = (nextScene: Scene) => onChangeScene(nextScene);
  const updateTurnOrder = (patch: Partial<TurnOrderSettings>) => {
    if (!scene || !turnOrder) {
      return;
    }
    updateScene({ ...scene, turnOrder: { ...turnOrder, ...patch }, updatedAt: new Date().toISOString() });
  };
  const updateTrackerDisplay = (edge: TurnOrderTrackerPlacement, patch: Partial<TurnOrderSettings["playerViewTrackers"][TurnOrderTrackerPlacement]>) => {
    if (!turnOrder) {
      return;
    }
    const currentTracker = turnOrder.playerViewTrackers[edge];
    updateTurnOrder({
      playerViewEdge: edge,
      playerViewFacing: patch.facing ?? currentTracker.facing,
      playerViewSize: patch.size ?? currentTracker.size,
      playerViewTrackers: {
        ...turnOrder.playerViewTrackers,
        [edge]: {
          ...currentTracker,
          ...patch
        }
      }
    });
  };
  const updateRound = (value: number) => updateTurnOrder({ round: clampRound(value) });

  const addManualEntry = () => {
    if (!scene) {
      return;
    }
    updateScene(addTurnOrderEntry(scene, createManualTurnOrderEntry(crypto.randomUUID(), "New Entry")));
  };

  const addCountTrackerEntry = () => {
    if (!scene) {
      return;
    }
    updateScene(addTurnOrderEntry(scene, createCountTrackerTurnOrderEntry(crypto.randomUUID(), "Count Tracker", 1)));
  };

  const addAssetEntry = (asset: Asset) => {
    if (!scene) {
      return;
    }
    updateScene(addTurnOrderEntry(scene, createTurnOrderEntryFromAsset(crypto.randomUUID(), asset)));
  };

  useEffect(() => {
    if (!addMenuOpen) {
      return;
    }
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (addButtonRef.current?.contains(event.target as Node)) {
        return;
      }
      setAddMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAddMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [addMenuOpen]);

  const moveDraggedEntry = (targetEntryId: string, placement: "before" | "after") => {
    if (!scene || !draggedEntryId || draggedEntryId === targetEntryId) {
      return;
    }
    const targetIndex = scene.turnOrder.entries.findIndex((entry) => entry.id === targetEntryId);
    const sourceIndex = scene.turnOrder.entries.findIndex((entry) => entry.id === draggedEntryId);
    if (targetIndex < 0 || sourceIndex < 0) {
      return;
    }
    const adjustedTargetIndex = targetIndex - (sourceIndex < targetIndex ? 1 : 0) + (placement === "after" ? 1 : 0);
    updateScene(reorderTurnOrderEntry(scene, draggedEntryId, adjustedTargetIndex));
  };

  return (
    <section
      className="turn-order-panel"
      onDragOver={(event) => {
        if (!scene || !event.dataTransfer.types.includes(TOKEN_LIBRARY_ASSET_DRAG_TYPE)) {
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event) => {
        if (!scene) {
          return;
        }
        const assetId = event.dataTransfer.getData(TOKEN_LIBRARY_ASSET_DRAG_TYPE);
        const asset = tokenAssets.get(assetId);
        if (!asset) {
          return;
        }
        event.preventDefault();
        addAssetEntry(asset);
      }}
    >
      {scene && turnOrder && settingsOpen && (
        <div className="turn-order-settings-panel" aria-label="Player View turn order display settings">
          <TurnOrderSettingsSection title="Tracker Display" open={trackerDisplayOpen} onToggle={() => setTrackerDisplayOpen((open) => !open)}>
            <div className="turn-order-tracker-display-grid">
              <span>Placement</span>
              <span>Display</span>
              <span>Facing</span>
              <span>Size</span>
              {TRACKER_DISPLAY_EDGES.map((edge) => {
                const tracker = turnOrder.playerViewTrackers[edge];
                return (
                  <div key={edge} className="turn-order-tracker-display-row">
                    <span className="turn-order-tracker-placement-name">{TRACKER_EDGE_LABELS[edge]}</span>
                    <label className="fog-operation-switch turn-order-tracker-enable-control" title={`${tracker.enabled ? "Hide" : "Show"} ${TRACKER_EDGE_LABELS[edge]} tracker`}>
                      <span>Show</span>
                      <input type="checkbox" checked={!tracker.enabled} aria-label={`${tracker.enabled ? "Hide" : "Show"} ${TRACKER_EDGE_LABELS[edge]} tracker`} onChange={(event) => updateTrackerDisplay(edge, { enabled: !event.target.checked })} />
                      <span>Hide</span>
                    </label>
                    <select aria-label={`${TRACKER_EDGE_LABELS[edge]} facing`} value={tracker.facing} disabled={!tracker.enabled} onChange={(event) => updateTrackerDisplay(edge, { facing: event.target.value as typeof tracker.facing })}>
                      <option value="inward">Inward</option>
                      <option value="outward">Outward</option>
                    </select>
                    <select aria-label={`${TRACKER_EDGE_LABELS[edge]} size`} value={tracker.size} disabled={!tracker.enabled} onChange={(event) => updateTrackerDisplay(edge, { size: event.target.value as typeof tracker.size })}>
                      <option value="xs">Extra Small</option>
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                      <option value="xl">Extra Large</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </TurnOrderSettingsSection>
          <TurnOrderSettingsSection title="Global Turn Tracker" open={globalTrackerOpen} onToggle={() => setGlobalTrackerOpen((open) => !open)}>
            <div className="turn-order-display-controls turn-order-display-controls-compact">
              <label>
                <span>Visible Entries</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  step={1}
                  value={turnOrder.playerViewMaxEntries}
                  onChange={(event) => updateTurnOrder({ playerViewMaxEntries: Math.max(1, Math.min(30, Math.floor(Number(event.target.value) || 9))) })}
                />
              </label>
              <label>
                <span>Thumbnail Mask</span>
                <select
                  value={turnOrder.trackerAvatarMask}
                  onChange={(event) => updateTurnOrder({ trackerAvatarMask: event.target.value as typeof turnOrder.trackerAvatarMask })}
                >
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                  <option value="hex">Hex</option>
                </select>
              </label>
            </div>
          </TurnOrderSettingsSection>
          <TurnOrderSettingsSection title="Player Turn Indicators" open={playerTurnIndicatorsOpen} onToggle={() => setPlayerTurnIndicatorsOpen((open) => !open)}>
            <div className="turn-order-display-controls turn-order-display-controls-compact">
              <label>
                <span>Size</span>
                <select
                  value={turnOrder.playerTurnStatusSize}
                  onChange={(event) => updateTurnOrder({ playerTurnStatusSize: event.target.value as typeof turnOrder.playerTurnStatusSize })}
                >
                  <option value="xs">Extra Small</option>
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                  <option value="xl">Extra Large</option>
                </select>
              </label>
              <label>
                <span>Thumbnail Mask</span>
                <select
                  value={turnOrder.playerTurnAvatarMask}
                  onChange={(event) => updateTurnOrder({ playerTurnAvatarMask: event.target.value as typeof turnOrder.playerTurnAvatarMask })}
                >
                  <option value="circle">Circle</option>
                  <option value="square">Square</option>
                  <option value="hex">Hex</option>
                </select>
              </label>
            </div>
          </TurnOrderSettingsSection>
          <TurnOrderSettingsSection title="Initiative" open={initiativeOpen} onToggle={() => setInitiativeOpen((open) => !open)}>
            <label className="turn-order-setting-row">
              <span>Initiative Dice</span>
              <div className="turn-order-dice-controls">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={turnOrder.initiativeDiceCount}
                  aria-label="Initiative dice count"
                  onChange={(event) => updateTurnOrder({ initiativeDiceCount: Number(event.target.value) || 1 })}
                />
                <span>d</span>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={turnOrder.initiativeDiceSides}
                  aria-label="Initiative dice sides"
                  onChange={(event) => updateTurnOrder({ initiativeDiceSides: Number(event.target.value) || 20 })}
                />
              </div>
            </label>
          </TurnOrderSettingsSection>
        </div>
      )}

      <div className="turn-order-heading">
        <div>
          <strong>Turn Order List</strong>
          <span>{turnOrder ? `${turnOrder.entries.length} entries` : "Select a scene"}</span>
        </div>
        {turnOrder && (
          <label className="turn-order-round-control" title="Turn order round">
            <span>Round</span>
            <input type="number" min={1} max={999} step={1} value={turnOrder.round} aria-label="Turn order round" onChange={(event) => updateRound(Number(event.target.value))} />
          </label>
        )}
      </div>

      <div className="turn-order-toolbar">
        <div className="turn-order-controls">
          <button
            disabled={!scene || !turnOrder || turnOrder.entries.length === 0 || (!turnOrder.active && !canStartTurnOrder)}
            title={turnOrder?.active ? "Stop turn order" : canStartTurnOrder ? "Start turn order" : "Send this scene to Player View before starting turn order"}
            onClick={() => scene && updateScene(turnOrder?.active ? stopTurnOrder(scene) : startTurnOrder(scene))}
          >
            {turnOrder?.active ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
          </button>
          <button disabled={!scene || !turnOrder?.active || turnOrder.entries.length === 0} title="Previous turn" onClick={() => scene && updateScene(advanceTurnOrder(scene, "previous"))}>
            <SkipBack size={14} aria-hidden="true" />
          </button>
          <button disabled={!scene || !turnOrder?.active || turnOrder.entries.length === 0} title="Next turn" onClick={() => scene && updateScene(advanceTurnOrder(scene, "next"))}>
            <SkipForward size={14} aria-hidden="true" />
          </button>
          <button disabled={!scene || !turnOrder || turnOrder.entries.length === 0} title="Reset turn order" aria-label="Reset turn order" onClick={() => scene && updateScene(resetTurnOrder(scene))}>
            <RotateCcw size={14} aria-hidden="true" />
          </button>
          {settingsControlVisible && (
            <button disabled={!scene || !turnOrder} title="Turn order display settings" aria-expanded={settingsOpen} onClick={() => setSettingsOpen((open) => !open)}>
              <Settings2 size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="turn-order-actions">
          <button
            ref={addButtonRef}
            disabled={!scene}
            title="Add turn order entry"
            aria-label="Add turn order entry"
            aria-expanded={addMenuOpen}
            onClick={(event) => {
              event.stopPropagation();
              setAddMenuOpen((open) => !open);
            }}
          >
            <Plus size={14} aria-hidden="true" />
          </button>
          {addMenuOpen &&
            createPortal(
              <FloatingTurnOrderAddMenu
                anchor={addButtonRef.current}
                canAddPlayers={Boolean(scene) && campaignPlayers.length > 0 && playersToAddCount > 0}
                addPlayersTitle={campaignPlayers.length === 0 ? "Add campaign players first" : playersToAddCount === 0 ? "All campaign players are already in turn order" : "Add all campaign players"}
                onAddManual={() => {
                  addManualEntry();
                  setAddMenuOpen(false);
                }}
                onAddPlayers={() => {
                  if (scene) {
                    updateScene(addPlayersToTurnOrder(scene, campaignPlayers));
                  }
                  setAddMenuOpen(false);
                }}
                onAddCountTracker={() => {
                  addCountTrackerEntry();
                  setAddMenuOpen(false);
                }}
              />,
              document.body
            )}
          <button disabled={!scene || !turnOrder || turnOrder.entries.length === 0} title="Roll initiative for non-player entries" aria-label="Roll initiative for non-player entries" onClick={() => scene && updateScene(rollInitiativeForNonPlayers(scene))}>
            <Dice5 size={14} aria-hidden="true" />
          </button>
          <button disabled={!scene || !turnOrder || turnOrder.entries.length === 0} title="Sort by initiative" aria-label="Sort by initiative" onClick={() => scene && updateScene(sortTurnOrderByInitiative(scene))}>
            <ListPlus size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {!scene ? (
        <div className="turn-order-empty">Select a scene to build a turn order.</div>
      ) : turnOrder && turnOrder.entries.length > 0 ? (
        <div className="turn-order-list">
          {turnOrder.entries.map((entry, index) => (
            <TurnOrderRow
              key={entry.id}
              entry={entry}
              index={index}
              active={turnOrder.active && entry.id === currentEntryId}
              player={entry.playerId ? campaignPlayers.find((candidate) => candidate.id === entry.playerId) : undefined}
              asset={entry.assetId ? tokenAssets.get(entry.assetId) : undefined}
              onUpdate={(patch) => updateScene(updateTurnOrderEntry(scene, entry.id, patch))}
              onLinkToken={(tokenId) => updateScene(linkTurnOrderEntryToToken(scene, entry.id, tokenId))}
              onCreateGroup={() => updateScene(createTurnOrderGroupFromEntry(scene, entry.id))}
              onUngroup={() => updateScene(ungroupTurnOrderEntry(scene, entry.id))}
              onRoll={() => updateScene(rollInitiativeForEntry(scene, entry.id))}
              onRemove={() => updateScene(removeTurnOrderEntry(scene, entry.id))}
              sceneTokens={scene.tokens}
              dragged={draggedEntryId === entry.id}
              dropPlacement={dropTarget?.entryId === entry.id ? dropTarget.placement : null}
              onDragStart={() => setDraggedEntryId(entry.id)}
              onDragOver={(placement) => setDropTarget({ entryId: entry.id, placement })}
              onDrop={(placement) => moveDraggedEntry(entry.id, placement)}
              onDragEnd={() => {
                setDraggedEntryId(null);
                setDropTarget(null);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="turn-order-empty">Add an entry, or drag a library token here.</div>
      )}
    </section>
  );
}

function TurnOrderSettingsSection({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="turn-order-settings-group">
      <button type="button" className="turn-order-settings-section-toggle" aria-expanded={open} onClick={onToggle}>
        {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
        <span>{title}</span>
      </button>
      {open && <div className="turn-order-settings-section-body">{children}</div>}
    </div>
  );
}

const TRACKER_DISPLAY_EDGES: TurnOrderTrackerPlacement[] = ["left", "top", "right", "bottom"];
const TRACKER_EDGE_LABELS: Record<TurnOrderTrackerPlacement, string> = {
  left: "Left",
  top: "Top",
  right: "Right",
  bottom: "Bottom"
};

function FloatingTurnOrderAddMenu({
  anchor,
  canAddPlayers,
  addPlayersTitle,
  onAddManual,
  onAddPlayers,
  onAddCountTracker
}: {
  anchor: HTMLElement | null;
  canAddPlayers: boolean;
  addPlayersTitle: string;
  onAddManual: () => void;
  onAddPlayers: () => void;
  onAddCountTracker: () => void;
}) {
  const { menuRef, position } = useFloatingMenuPosition({
    open: Boolean(anchor),
    anchor,
    fallbackWidth: 190,
    fallbackHeight: 132
  });

  return (
    <div
      ref={menuRef}
      className="turn-order-add-menu token-settings-menu token-settings-menu-portal canvas-context-menu"
      style={{ top: position.top, left: position.left }}
      role="menu"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="canvas-context-menu-title">Add Turn Order</div>
      <div className="control-divider" />
      <button className="token-menu-action" role="menuitem" onClick={onAddManual}>
        <Plus size={14} aria-hidden="true" />
        <span>Add Manual Entry</span>
      </button>
      <button className="token-menu-action" role="menuitem" disabled={!canAddPlayers} title={addPlayersTitle} onClick={onAddPlayers}>
        <UserRoundPlus size={14} aria-hidden="true" />
        <span>Add All Campaign Players</span>
      </button>
      <button className="token-menu-action" role="menuitem" onClick={onAddCountTracker}>
        <Hourglass size={14} aria-hidden="true" />
        <span>Add Count Tracker</span>
      </button>
    </div>
  );
}

function clampRound(value: number): number {
  return Math.max(1, Math.min(999, Math.floor(Number.isFinite(value) ? value : 1)));
}

function TurnOrderRow({
  entry,
  index,
  active,
  player,
  asset,
  onUpdate,
  onLinkToken,
  onCreateGroup,
  onUngroup,
  onRoll,
  onRemove,
  sceneTokens,
  dragged,
  dropPlacement,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: {
  entry: TurnOrderEntry;
  index: number;
  active: boolean;
  player?: CampaignPlayer;
  asset?: Asset;
  onUpdate: (patch: Partial<TurnOrderEntry>) => void;
  onLinkToken: (tokenId: string | null) => void;
  onCreateGroup: () => void;
  onUngroup: () => void;
  onRoll: () => void;
  onRemove: () => void;
  sceneTokens: Token[];
  dragged: boolean;
  dropPlacement: "before" | "after" | null;
  onDragStart: () => void;
  onDragOver: (placement: "before" | "after") => void;
  onDrop: (placement: "before" | "after") => void;
  onDragEnd: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const previewPath = asset?.thumbnailAbsolutePath ?? asset?.absolutePath;
  const className = [
    active ? "turn-order-row turn-order-row-active" : "turn-order-row",
    entry.type === "count-tracker" ? "turn-order-row-count-tracker" : "",
    entry.type === "turn-group" ? "turn-order-row-group" : "",
    entry.countdown !== undefined ? "turn-order-row-countdown" : "",
    entry.countdown === 0 ? "turn-order-row-expired" : "",
    dragged ? "turn-order-row-dragging" : "",
    dropPlacement ? `turn-order-row-drop-${dropPlacement}` : ""
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (menuButtonRef.current?.contains(event.target as Node)) {
        return;
      }
      setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <article
      className={className}
      onDragOver={(event) => {
        event.preventDefault();
        const bounds = event.currentTarget.getBoundingClientRect();
        onDragOver(event.clientY < bounds.top + bounds.height / 2 ? "before" : "after");
      }}
      onDrop={(event) => {
        event.preventDefault();
        const bounds = event.currentTarget.getBoundingClientRect();
        onDrop(event.clientY < bounds.top + bounds.height / 2 ? "before" : "after");
        onDragEnd();
      }}
    >
      <span
        className="turn-order-drag-handle"
        draggable
        title="Drag to reorder"
        aria-label={`Drag ${entry.name} to reorder`}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", entry.id);
          onDragStart();
        }}
        onDragEnd={onDragEnd}
      >
        <GripVertical size={14} aria-hidden="true" />
      </span>
      <span className="turn-order-rank">{index + 1}</span>
      <span className="turn-order-avatar">{previewPath ? <img src={window.localVtt.toAssetUrl(previewPath)} alt="" draggable={false} /> : entry.name.slice(0, 1).toUpperCase()}</span>
      <div className="turn-order-name-cell">
        <input className="turn-order-name" value={entry.name} aria-label="Entry name" onChange={(event) => onUpdate({ name: event.target.value })} />
        <span
          className={entry.type === "count-tracker" ? "turn-order-type-badge turn-order-type-count" : entry.type === "turn-group" ? "turn-order-type-badge turn-order-type-group" : player ? "turn-order-type-badge turn-order-type-player" : "turn-order-type-badge turn-order-type-entry"}
          title={entry.type === "count-tracker" ? "Count Tracker" : entry.type === "turn-group" ? "Turn Group" : player ? "Player" : "Entity"}
          aria-label={entry.type === "count-tracker" ? "Count tracker entry" : entry.type === "turn-group" ? "Turn group entry" : player ? "Player entry" : "Entity entry"}
        >
          {entry.type === "count-tracker" ? "C" : entry.type === "turn-group" ? "G" : player ? "P" : "E"}
        </span>
        {entry.type === "turn-group" && (
          <span className="turn-order-group-count-badge" title={`${entry.tokenIds?.length ?? 0} grouped scene tokens`}>
            x{entry.tokenIds?.length ?? 0}
          </span>
        )}
        {entry.countdown !== undefined && (
          <span className={entry.countdown === 0 ? "turn-order-countdown-badge turn-order-countdown-expired" : "turn-order-countdown-badge"} title={entry.countdown === 0 ? "Countdown expired" : `${entry.countdown} rounds remaining`}>
            <Hourglass size={11} aria-hidden="true" />
            {entry.countdown}
          </span>
        )}
      </div>
      <input
        className="turn-order-initiative"
        type="number"
        value={entry.initiative}
        aria-label="Initiative"
        onChange={(event) => onUpdate({ initiative: Number(event.target.value) || 0 })}
      />
      <div className="turn-order-row-actions">
        <button title={entry.visibleInPlayer ? "Hide from Player View" : "Show in Player View"} onClick={() => onUpdate({ visibleInPlayer: !entry.visibleInPlayer })}>
          {entry.visibleInPlayer ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
        </button>
      </div>
      <div className="turn-order-row-menu-wrap">
        <button
          ref={menuButtonRef}
          className="turn-order-row-menu-button"
          title="Entry actions"
          aria-label={`Open ${entry.name} entry actions`}
          aria-expanded={menuOpen}
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((open) => !open);
          }}
        >
          <MoreVertical size={14} aria-hidden="true" />
        </button>
        {menuOpen &&
          createPortal(
            <FloatingTurnOrderRowMenu
              anchor={menuButtonRef.current}
              entry={entry}
              sceneTokens={sceneTokens}
              linkedTokenId={entry.tokenId}
              onRoll={() => {
                onRoll();
                setMenuOpen(false);
              }}
              onLinkToken={(tokenId) => {
                onLinkToken(tokenId);
              }}
              onCreateGroup={() => {
                onCreateGroup();
                setMenuOpen(false);
              }}
              onUngroup={() => {
                onUngroup();
                setMenuOpen(false);
              }}
              onUpdateGroupTokenIds={(tokenIds) => {
                onUpdate({ tokenIds });
              }}
              onToggleVisibility={() => {
                onUpdate({ visibleInPlayer: !entry.visibleInPlayer });
              }}
              onToggleCountdown={() => {
                onUpdate({ countdown: entry.countdown === undefined ? 1 : undefined });
              }}
              onUpdateCountdown={(countdown) => {
                onUpdate({ countdown });
              }}
              onUpdateTrackerColor={(trackerColor) => {
                onUpdate({ trackerColor });
              }}
              onRemove={() => {
                onRemove();
                setMenuOpen(false);
              }}
            />,
            document.body
          )}
      </div>
    </article>
  );
}

function FloatingTurnOrderRowMenu({
  anchor,
  entry,
  sceneTokens,
  linkedTokenId,
  onRoll,
  onLinkToken,
  onCreateGroup,
  onUngroup,
  onUpdateGroupTokenIds,
  onToggleVisibility,
  onToggleCountdown,
  onUpdateCountdown,
  onUpdateTrackerColor,
  onRemove
}: {
  anchor: HTMLElement | null;
  entry: TurnOrderEntry;
  sceneTokens: Token[];
  linkedTokenId?: string;
  onRoll: () => void;
  onLinkToken: (tokenId: string | null) => void;
  onCreateGroup: () => void;
  onUngroup: () => void;
  onUpdateGroupTokenIds: (tokenIds: string[]) => void;
  onToggleVisibility: () => void;
  onToggleCountdown: () => void;
  onUpdateCountdown: (countdown: number) => void;
  onUpdateTrackerColor: (trackerColor: string) => void;
  onRemove: () => void;
}) {
  const { menuRef, position } = useFloatingMenuPosition({
    open: Boolean(anchor),
    anchor,
    fallbackWidth: 170,
    fallbackHeight: entry.type === "turn-group" ? 330 : entry.type === "count-tracker" ? 254 : entry.countdown !== undefined ? 224 : 202
  });
  const selectedGroupTokenIds = new Set(entry.tokenIds ?? []);
  const toggleGroupToken = (tokenId: string, selected: boolean) => {
    const nextTokenIds = new Set(selectedGroupTokenIds);
    if (selected) {
      nextTokenIds.add(tokenId);
    } else {
      nextTokenIds.delete(tokenId);
    }
    onUpdateGroupTokenIds([...nextTokenIds]);
  };

  return (
    <div
      ref={menuRef}
      className="turn-order-row-menu token-settings-menu token-settings-menu-portal canvas-context-menu"
      style={{ top: position.top, left: position.left }}
      role="menu"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="canvas-context-menu-title" title={entry.name}>{entry.name}</div>
      <div className="control-divider" />
      <div className="settings-grid">
        <label className="setting-row">
          <span>Player View</span>
          <label className="fog-operation-switch" title={`${entry.visibleInPlayer ? "Hide" : "Show"} ${entry.name} on Player View`}>
            <span>Show</span>
            <input
              aria-label={`${entry.visibleInPlayer ? "Hide" : "Show"} ${entry.name} on Player View`}
              type="checkbox"
              checked={!entry.visibleInPlayer}
              onChange={onToggleVisibility}
            />
            <span>Hide</span>
          </label>
        </label>
        <label className="setting-row">
          <span>Scene Token</span>
          <select
            value={linkedTokenId ?? ""}
            disabled={sceneTokens.length === 0 || entry.type === "turn-group"}
            aria-label={`Scene token link for ${entry.name}`}
            onChange={(event) => onLinkToken(event.target.value || null)}
          >
            <option value="">Not linked</option>
            {sceneTokens.map((token) => (
              <option key={token.id} value={token.id}>
                {token.name || "Token"}
              </option>
            ))}
          </select>
        </label>
        {entry.type === "turn-group" && (
          <div className="turn-order-group-token-picker">
            <span>Group Tokens</span>
            <div className="turn-order-group-token-list">
              {sceneTokens.length === 0 ? (
                <span className="turn-order-group-token-empty">No scene tokens available.</span>
              ) : (
                sceneTokens.map((token) => (
                  <label key={token.id} className="turn-order-group-token-option">
                    <input type="checkbox" checked={selectedGroupTokenIds.has(token.id)} onChange={(event) => toggleGroupToken(token.id, event.target.checked)} />
                    <span>{token.name || "Token"}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
        <label className="setting-row">
          <span>Countdown</span>
          <label className="fog-operation-switch turn-order-countdown-switch" title={`${entry.countdown === undefined ? "Enable" : "Disable"} countdown for ${entry.name}`}>
            <span>Off</span>
            <input
              aria-label={`${entry.countdown === undefined ? "Enable" : "Disable"} countdown for ${entry.name}`}
              type="checkbox"
              checked={entry.countdown !== undefined}
              onChange={onToggleCountdown}
            />
            <span>On</span>
          </label>
        </label>
        {entry.type === "count-tracker" && (
          <label className="setting-row">
            <span>Card Color</span>
            <input
              type="color"
              value={entry.trackerColor ?? "#f5d98a"}
              aria-label={`Card color for ${entry.name}`}
              onChange={(event) => onUpdateTrackerColor(event.target.value)}
            />
          </label>
        )}
        {entry.countdown !== undefined && (
          <label className="setting-row">
            <span>Rounds Left</span>
            <input
              type="number"
              min={0}
              max={999}
              step={1}
              value={entry.countdown}
              aria-label={`Rounds left for ${entry.name}`}
              onChange={(event) => onUpdateCountdown(clampCountdown(Number(event.target.value)))}
            />
          </label>
        )}
      </div>
      <div className="control-divider" />
      {entry.type !== "count-tracker" && entry.type !== "turn-group" && (
        <button className="token-menu-action" role="menuitem" onClick={onCreateGroup}>
          <ListPlus size={14} aria-hidden="true" />
          <span>Create Group</span>
        </button>
      )}
      {entry.type === "turn-group" && (
        <button className="token-menu-action" role="menuitem" onClick={onUngroup}>
          <ListPlus size={14} aria-hidden="true" />
          <span>Ungroup</span>
        </button>
      )}
      {entry.type !== "count-tracker" && (
        <button className="token-menu-action" role="menuitem" onClick={onRoll}>
          <Dice5 size={14} aria-hidden="true" />
          <span>Roll Initiative</span>
        </button>
      )}
      <button className="token-menu-action token-menu-delete" role="menuitem" onClick={onRemove}>
        <Trash2 size={14} aria-hidden="true" />
        <span>Delete</span>
      </button>
    </div>
  );
}

function clampCountdown(value: number): number {
  return Math.max(0, Math.min(999, Math.floor(Number.isFinite(value) ? value : 1)));
}
