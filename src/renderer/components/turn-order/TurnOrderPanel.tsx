import { ArrowDown, ArrowUp, Eye, EyeOff, ListPlus, Pause, Play, Plus, SkipBack, SkipForward, Trash2 } from "lucide-react";
import type { Asset, Scene, TurnOrderEntry } from "../../../shared/localvtt";
import { TOKEN_LIBRARY_ASSET_DRAG_TYPE } from "../../lib/dragTypes";
import {
  addTurnOrderEntry,
  advanceTurnOrder,
  createManualTurnOrderEntry,
  createTurnOrderEntryFromAsset,
  moveTurnOrderEntry,
  removeTurnOrderEntry,
  sortTurnOrderByInitiative,
  startTurnOrder,
  stopTurnOrder,
  updateTurnOrderEntry
} from "../../lib/turnOrder";

interface TurnOrderPanelProps {
  scene: Scene | null;
  tokenAssets: Map<string, Asset>;
  onChangeScene: (scene: Scene) => void;
}

export function TurnOrderPanel({ scene, tokenAssets, onChangeScene }: TurnOrderPanelProps) {
  const turnOrder = scene?.turnOrder;
  const currentEntryId = turnOrder?.currentEntryId;

  const updateScene = (nextScene: Scene) => onChangeScene(nextScene);

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
      <div className="turn-order-heading">
        <div>
          <strong>Turn Order</strong>
          <span>{turnOrder ? `${turnOrder.entries.length} entries` : "Select a scene"}</span>
        </div>
        <div className="turn-order-actions">
          <button disabled={!scene} title="Add manual entry" onClick={addManualEntry}>
            <Plus size={14} aria-hidden="true" />
            <span>Add</span>
          </button>
          <button disabled={!scene || !turnOrder || turnOrder.entries.length === 0} title="Sort by initiative" onClick={() => scene && updateScene(sortTurnOrderByInitiative(scene))}>
            <ListPlus size={14} aria-hidden="true" />
            <span>Sort</span>
          </button>
        </div>
      </div>

      <div className="turn-order-controls">
        <button disabled={!scene || !turnOrder || turnOrder.entries.length === 0} onClick={() => scene && updateScene(turnOrder?.active ? stopTurnOrder(scene) : startTurnOrder(scene))}>
          {turnOrder?.active ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
          <span>{turnOrder?.active ? "Stop" : "Start"}</span>
        </button>
        <button disabled={!scene || !turnOrder?.active || turnOrder.entries.length === 0} title="Previous turn" onClick={() => scene && updateScene(advanceTurnOrder(scene, "previous"))}>
          <SkipBack size={14} aria-hidden="true" />
        </button>
        <button disabled={!scene || !turnOrder?.active || turnOrder.entries.length === 0} title="Next turn" onClick={() => scene && updateScene(advanceTurnOrder(scene, "next"))}>
          <SkipForward size={14} aria-hidden="true" />
        </button>
      </div>

      {scene && turnOrder && (
        <div className="turn-order-display-controls" aria-label="Player View turn order display settings">
          <label>
            <span>Placement</span>
            <select
              value={turnOrder.playerViewEdge}
              onChange={(event) => updateScene({ ...scene, turnOrder: { ...turnOrder, playerViewEdge: event.target.value as typeof turnOrder.playerViewEdge }, updatedAt: new Date().toISOString() })}
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
              onChange={(event) =>
                updateScene({ ...scene, turnOrder: { ...turnOrder, playerViewFacing: event.target.value as typeof turnOrder.playerViewFacing }, updatedAt: new Date().toISOString() })
              }
            >
              <option value="inward">Inward</option>
              <option value="outward">Outward</option>
            </select>
          </label>
          <label>
            <span>Size</span>
            <select
              value={turnOrder.playerViewSize}
              onChange={(event) =>
                updateScene({ ...scene, turnOrder: { ...turnOrder, playerViewSize: event.target.value as typeof turnOrder.playerViewSize }, updatedAt: new Date().toISOString() })
              }
            >
              <option value="xs">Extra Small</option>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
            </select>
          </label>
        </div>
      )}

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
              asset={entry.assetId ? tokenAssets.get(entry.assetId) : undefined}
              onUpdate={(patch) => updateScene(updateTurnOrderEntry(scene, entry.id, patch))}
              onMove={(direction) => updateScene(moveTurnOrderEntry(scene, entry.id, direction))}
              onRemove={() => updateScene(removeTurnOrderEntry(scene, entry.id))}
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
  asset,
  onUpdate,
  onMove,
  onRemove
}: {
  entry: TurnOrderEntry;
  index: number;
  active: boolean;
  asset?: Asset;
  onUpdate: (patch: Partial<TurnOrderEntry>) => void;
  onMove: (direction: "up" | "down") => void;
  onRemove: () => void;
}) {
  const previewPath = asset?.thumbnailAbsolutePath ?? asset?.absolutePath;
  return (
    <article className={active ? "turn-order-row turn-order-row-active" : "turn-order-row"}>
      <span className="turn-order-rank">{index + 1}</span>
      <span className="turn-order-avatar">{previewPath ? <img src={window.localVtt.toAssetUrl(previewPath)} alt="" draggable={false} /> : entry.name.slice(0, 1).toUpperCase()}</span>
      <input className="turn-order-name" value={entry.name} aria-label="Entry name" onChange={(event) => onUpdate({ name: event.target.value })} />
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
        <button title="Move up" onClick={() => onMove("up")}>
          <ArrowUp size={14} aria-hidden="true" />
        </button>
        <button title="Move down" onClick={() => onMove("down")}>
          <ArrowDown size={14} aria-hidden="true" />
        </button>
        <button className="turn-order-delete" title="Delete entry" onClick={onRemove}>
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
