import { Dice5, Eye, EyeOff, GripVertical, ListPlus, MoreVertical, Pause, Play, Plus, Settings2, SkipBack, SkipForward, Trash2, UserRoundPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Asset, CampaignPlayer, Scene, TurnOrderEntry, TurnOrderSettings } from "../../../shared/localvtt";
import { useFloatingMenuPosition } from "../../hooks/useFloatingMenuPosition";
import { TOKEN_LIBRARY_ASSET_DRAG_TYPE } from "../../lib/tokens";
import {
  addTurnOrderEntry,
  addPlayersToTurnOrder,
  advanceTurnOrder,
  createManualTurnOrderEntry,
  createTurnOrderEntryFromAsset,
  removeTurnOrderEntry,
  reorderTurnOrderEntry,
  rollInitiativeForNonPlayers,
  rollInitiativeForEntry,
  sortTurnOrderByInitiative,
  startTurnOrder,
  stopTurnOrder,
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
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ entryId: string; placement: "before" | "after" } | null>(null);
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

  const addManualEntry = () => {
    if (!scene) {
      return;
    }
    updateScene(addTurnOrderEntry(scene, createManualTurnOrderEntry(crypto.randomUUID(), "New Entry")));
  };

  const addAssetEntry = (asset: Asset) => {
    if (!scene) {
      return;
    }
    updateScene(addTurnOrderEntry(scene, createTurnOrderEntryFromAsset(crypto.randomUUID(), asset)));
  };

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
          <div className="turn-order-settings-group">
            <div className="turn-order-settings-label">Tracker Style</div>
            <div className="turn-order-display-controls">
              <label>
                <span>Placement</span>
                <select
                  value={turnOrder.playerViewEdge}
                  onChange={(event) => updateTurnOrder({ playerViewEdge: event.target.value as typeof turnOrder.playerViewEdge })}
                >
                  <option value="top">Top</option>
                  <option value="right">Right</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                </select>
              </label>
              <label>
                <span>Facing</span>
                <select
                  value={turnOrder.playerViewFacing}
                  onChange={(event) => updateTurnOrder({ playerViewFacing: event.target.value as typeof turnOrder.playerViewFacing })}
                >
                  <option value="inward">Inward</option>
                  <option value="outward">Outward</option>
                </select>
              </label>
              <label>
                <span>Tracker Size</span>
                <select
                  value={turnOrder.playerViewSize}
                  onChange={(event) => updateTurnOrder({ playerViewSize: event.target.value as typeof turnOrder.playerViewSize })}
                >
                  <option value="xs">Extra Small</option>
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                  <option value="xl">Extra Large</option>
                </select>
              </label>
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
                <span>Player Turn Size</span>
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
            </div>
          </div>
          <div className="turn-order-settings-group">
            <div className="turn-order-settings-label">Initiative</div>
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
          </div>
        </div>
      )}

      <div className="turn-order-heading">
        <div>
          <strong>Turn Order List</strong>
          <span>{turnOrder ? `${turnOrder.entries.length} entries` : "Select a scene"}</span>
        </div>
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
          {settingsControlVisible && (
            <button disabled={!scene || !turnOrder} title="Turn order display settings" aria-expanded={settingsOpen} onClick={() => setSettingsOpen((open) => !open)}>
              <Settings2 size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="turn-order-actions">
          <button disabled={!scene} title="Add manual entry" aria-label="Add manual entry" onClick={addManualEntry}>
            <Plus size={14} aria-hidden="true" />
          </button>
          <button
            disabled={!scene || campaignPlayers.length === 0 || playersToAddCount === 0}
            title={campaignPlayers.length === 0 ? "Add campaign players first" : playersToAddCount === 0 ? "All campaign players are already in turn order" : "Add campaign players"}
            aria-label="Add campaign players"
            onClick={() => scene && updateScene(addPlayersToTurnOrder(scene, campaignPlayers))}
          >
            <UserRoundPlus size={14} aria-hidden="true" />
          </button>
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
              onRoll={() => updateScene(rollInitiativeForEntry(scene, entry.id))}
              onRemove={() => updateScene(removeTurnOrderEntry(scene, entry.id))}
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

function TurnOrderRow({
  entry,
  index,
  active,
  player,
  asset,
  onUpdate,
  onRoll,
  onRemove,
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
  onRoll: () => void;
  onRemove: () => void;
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
          className={player ? "turn-order-type-badge turn-order-type-player" : "turn-order-type-badge turn-order-type-entry"}
          title={player ? "Player" : "Entity"}
          aria-label={player ? "Player entry" : "Entity entry"}
        >
          {player ? "P" : "E"}
        </span>
      </div>
      <input
        className="turn-order-initiative"
        type="number"
        value={entry.initiative}
        aria-label="Initiative"
        onChange={(event) => onUpdate({ initiative: Number(event.target.value) || 0 })}
      />
      <div className="turn-order-row-actions">
        <button title="Roll initiative" onClick={onRoll}>
          <Dice5 size={14} aria-hidden="true" />
        </button>
        <button title={entry.visibleInPlayer ? "Hide from Player View" : "Show in Player View"} onClick={() => onUpdate({ visibleInPlayer: !entry.visibleInPlayer })}>
          {entry.visibleInPlayer ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
        </button>
        <button className="turn-order-delete" title="Delete entry" onClick={onRemove}>
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="turn-order-row-menu-wrap">
        <button
          ref={menuButtonRef}
          className="icon-button turn-order-row-menu-button"
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
              onRoll={() => {
                onRoll();
                setMenuOpen(false);
              }}
              onToggleVisibility={() => {
                onUpdate({ visibleInPlayer: !entry.visibleInPlayer });
                setMenuOpen(false);
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
  onRoll,
  onToggleVisibility,
  onRemove
}: {
  anchor: HTMLElement | null;
  entry: TurnOrderEntry;
  onRoll: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
}) {
  const { menuRef, position } = useFloatingMenuPosition({
    open: Boolean(anchor),
    anchor,
    fallbackWidth: 170,
    fallbackHeight: 116
  });

  return (
    <div
      ref={menuRef}
      className="turn-order-row-menu token-library-menu token-library-menu-portal"
      style={{ top: position.top, left: position.left }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <button onClick={onRoll}>
        <Dice5 size={14} aria-hidden="true" />
        <span>Roll Initiative</span>
      </button>
      <button onClick={onToggleVisibility}>
        {entry.visibleInPlayer ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
        <span>{entry.visibleInPlayer ? "Hide from Player View" : "Show in Player View"}</span>
      </button>
      <button className="danger-menu-item" onClick={onRemove}>
        <Trash2 size={14} aria-hidden="true" />
        <span>Delete</span>
      </button>
    </div>
  );
}
