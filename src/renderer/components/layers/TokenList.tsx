import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Crown, Eye, EyeOff, GripVertical, MoreVertical, Trash2, User, UsersRound } from "lucide-react";
import type { Asset, Scene, Token } from "../../../shared/localvtt";
import { useDismissableMenu } from "../../hooks/useDismissableMenu";
import { useFloatingMenuPosition } from "../../hooks/useFloatingMenuPosition";
import { duplicateToken } from "../../lib/tokenDefaults";
import { reorderByDropTarget, type DropPlacement } from "../../lib/reorder";
import { TokenSettings } from "./TokenSettings";

type TokenDropTarget = { tokenId: string; placement: DropPlacement } | null;

export function TokenList({
  scene,
  tokenAssets,
  selectedTokenId,
  selectedTokenIds = [],
  onSelectToken,
  onRenameToken,
  onUpdateToken,
  onUpdateTokens,
  onOpenTokenColor
}: {
  scene: Scene;
  tokenAssets: Map<string, Asset>;
  selectedTokenId: string | null;
  selectedTokenIds?: string[];
  onSelectToken: (tokenId: string | null) => void;
  onRenameToken: (tokenId: string, fallbackName: string) => void;
  onUpdateToken: (tokenId: string, patch: Partial<Token>) => void;
  onUpdateTokens: (tokens: Token[]) => void;
  onOpenTokenColor: (tokenId: string, value: string, kind: "border" | "glow") => void;
}) {
  const [draggedTokenId, setDraggedTokenId] = useState<string | null>(null);
  const [tokenDropTarget, setTokenDropTarget] = useState<TokenDropTarget>(null);
  const [openTokenMenuId, setOpenTokenMenuId] = useState<string | null>(null);
  const selectedIds = new Set(selectedTokenIds.length > 0 ? selectedTokenIds : selectedTokenId ? [selectedTokenId] : []);

  useDismissableMenu({
    enabled: Boolean(openTokenMenuId),
    menuRootClass: "token-menu-wrap",
    onDismiss: () => setOpenTokenMenuId(null)
  });

  const moveToken = (sourceTokenId: string, targetTokenId: string, placement: DropPlacement) => {
    if (sourceTokenId === targetTokenId) {
      return;
    }
    const tokens = reorderByDropTarget(scene.tokens, (token) => token.id, sourceTokenId, targetTokenId, placement);
    onUpdateTokens(tokens.map((token, index) => ({ ...token, order: index })));
  };

  return (
    <div className="layer-detail-controls fog-shape-list token-list" onClick={(event) => event.stopPropagation()}>
      <div className="fog-shape-list-header">
        <span>Tokens</span>
      </div>
      {scene.tokens.length > 0 ? (
        <>
          <div className="fog-shape-column-header token-column-header" aria-hidden="true">
            <span />
            <span />
            <span />
            <span title="GM View">
              <Crown size={13} />
            </span>
            <span title="Player View">
              <User size={13} />
            </span>
            <span />
          </div>
          {scene.tokens.map((token, tokenIndex) => {
            const isVisibleInGm = token.visibleInGm ?? !token.hidden;
            const isVisibleInPlayer = token.visibleInPlayer;
            const asset = token.assetId ? tokenAssets.get(token.assetId) : null;
            const assetName = asset?.name;
            const label = token.name?.trim() || assetName || `Token ${tokenIndex + 1}`;
            const isSelected = selectedIds.has(token.id);
            const dropPlacement = tokenDropTarget?.tokenId === token.id && draggedTokenId !== token.id ? tokenDropTarget.placement : null;
            const gmVisibilityButtonClass = [
              "icon-button",
              "fog-shape-action-button",
              isVisibleInGm ? "fog-shape-action-active" : ""
            ]
              .filter(Boolean)
              .join(" ");
            const playerVisibilityButtonClass = [
              "icon-button",
              "fog-shape-action-button",
              isVisibleInPlayer ? "fog-shape-action-active" : ""
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div
                className={[
                  "fog-shape-row",
                  isVisibleInGm || isVisibleInPlayer ? "" : "fog-shape-row-muted",
                  isSelected ? "fog-shape-row-selected" : "",
                  "token-shape-row",
                  openTokenMenuId === token.id ? "token-shape-row-menu-open" : "",
                  draggedTokenId === token.id ? "fog-shape-row-dragging" : "",
                  dropPlacement ? `fog-shape-row-drop-${dropPlacement}` : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={token.id}
                draggable
                onClick={() => onSelectToken(token.id)}
                onDragStart={(event) => {
                  setDraggedTokenId(token.id);
                  event.dataTransfer.setData("application/x-localvtt-token-id", token.id);
                  event.dataTransfer.setData("text/plain", token.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(event) => {
                  if (!draggedTokenId && !event.dataTransfer.types.includes("application/x-localvtt-token-id")) {
                    return;
                  }
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (draggedTokenId !== token.id) {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setTokenDropTarget({
                      tokenId: token.id,
                      placement: event.clientY > rect.top + rect.height / 2 ? "after" : "before"
                    });
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourceTokenId = event.dataTransfer.getData("application/x-localvtt-token-id") || event.dataTransfer.getData("text/plain") || draggedTokenId;
                  const placement = tokenDropTarget?.tokenId === token.id ? tokenDropTarget.placement : "before";
                  if (sourceTokenId) {
                    moveToken(sourceTokenId, token.id, placement);
                  }
                  setDraggedTokenId(null);
                  setTokenDropTarget(null);
                }}
                onDragEnd={() => {
                  if (draggedTokenId && tokenDropTarget) {
                    moveToken(draggedTokenId, tokenDropTarget.tokenId, tokenDropTarget.placement);
                  }
                  setDraggedTokenId(null);
                  setTokenDropTarget(null);
                }}
              >
                <GripVertical className="fog-shape-drag-handle" size={14} aria-hidden="true" />
                <TokenRowThumbnail asset={asset ?? null} label={label} />
                <span className="fog-shape-name" title={label} onDoubleClick={() => onRenameToken(token.id, label)}>
                  {label}
                </span>
                <button
                  className={gmVisibilityButtonClass}
                  aria-label={isVisibleInGm ? `Hide ${label} in GM View` : `Show ${label} in GM View`}
                  title={isVisibleInGm ? "Hide in GM View" : "Show in GM View"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateTokens(scene.tokens.map((candidate) => (candidate.id === token.id ? { ...candidate, visibleInGm: !isVisibleInGm } : candidate)));
                  }}
                >
                  {isVisibleInGm ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
                </button>
                <button
                  className={playerVisibilityButtonClass}
                  aria-label={isVisibleInPlayer ? `Hide ${label} in Player View` : `Show ${label} in Player View`}
                  title={isVisibleInPlayer ? "Hide in Player View" : "Show in Player View"}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateTokens(scene.tokens.map((candidate) => (candidate.id === token.id ? { ...candidate, visibleInPlayer: !isVisibleInPlayer } : candidate)));
                  }}
                >
                  {isVisibleInPlayer ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
                </button>
                <TokenMenuButton
                  token={token}
                  label={label}
                  scene={scene}
                  selectedTokenId={selectedTokenId}
                  open={openTokenMenuId === token.id}
                  onToggle={() => setOpenTokenMenuId((openId) => (openId === token.id ? null : token.id))}
                  onClose={() => setOpenTokenMenuId(null)}
                  onSelectToken={onSelectToken}
                  onUpdateToken={onUpdateToken}
                  onUpdateTokens={onUpdateTokens}
                  onOpenTokenColor={onOpenTokenColor}
                />
              </div>
            );
          })}
        </>
      ) : (
        <div className="layer-empty-state">
          <strong>No tokens</strong>
          <span>Import token images to create token sub-layers.</span>
        </div>
      )}
    </div>
  );
}

function TokenMenuButton({
  token,
  label,
  scene,
  selectedTokenId,
  open,
  onToggle,
  onClose,
  onSelectToken,
  onUpdateToken,
  onUpdateTokens,
  onOpenTokenColor
}: {
  token: Token;
  label: string;
  scene: Scene;
  selectedTokenId: string | null;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelectToken: (tokenId: string | null) => void;
  onUpdateToken: (tokenId: string, patch: Partial<Token>) => void;
  onUpdateTokens: (tokens: Token[]) => void;
  onOpenTokenColor: (tokenId: string, value: string, kind: "border" | "glow") => void;
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className="token-menu-wrap">
      <button
        ref={buttonRef}
        className="icon-button fog-shape-action-button"
        aria-label={`Open ${label} token menu`}
        title="Token options"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        <MoreVertical size={14} aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <FloatingTokenSettingsMenu
            anchor={buttonRef.current}
            token={token}
            scene={scene}
            selectedTokenId={selectedTokenId}
            onClose={onClose}
            onSelectToken={onSelectToken}
            onUpdateToken={onUpdateToken}
            onUpdateTokens={onUpdateTokens}
            onOpenTokenColor={onOpenTokenColor}
          />,
          document.body
        )}
    </div>
  );
}

function FloatingTokenSettingsMenu({
  anchor,
  token,
  scene,
  selectedTokenId,
  onClose,
  onSelectToken,
  onUpdateToken,
  onUpdateTokens,
  onOpenTokenColor
}: {
  anchor: HTMLElement | null;
  token: Token;
  scene: Scene;
  selectedTokenId: string | null;
  onClose: () => void;
  onSelectToken: (tokenId: string | null) => void;
  onUpdateToken: (tokenId: string, patch: Partial<Token>) => void;
  onUpdateTokens: (tokens: Token[]) => void;
  onOpenTokenColor: (tokenId: string, value: string, kind: "border" | "glow") => void;
}) {
  const { menuRef, position } = useFloatingMenuPosition({
    open: Boolean(anchor),
    anchor,
    fallbackWidth: 248,
    fallbackHeight: 420
  });

  return (
    <div ref={menuRef} className="token-settings-menu token-settings-menu-portal token-menu-wrap" style={{ top: position.top, left: position.left }} onClick={(event) => event.stopPropagation()}>
      <TokenSettings
        token={token}
        gridSize={scene.grid.sizePx}
        gridType={scene.grid.type}
        onUpdateToken={(patch) => onUpdateToken(token.id, patch)}
        onOpenTokenColor={onOpenTokenColor}
      />
      <div className="control-divider" />
      <button
        className="token-menu-action"
        onClick={() => {
          const duplicateTokenId = crypto.randomUUID();
          onUpdateTokens(duplicateToken(scene.tokens, token.id, duplicateTokenId));
          onSelectToken(duplicateTokenId);
          onClose();
        }}
      >
        <Copy size={14} aria-hidden="true" />
        Duplicate
      </button>
      <button
        className="token-menu-action token-menu-delete"
        onClick={() => {
          onUpdateTokens(scene.tokens.filter((candidate) => candidate.id !== token.id));
          if (selectedTokenId === token.id) {
            onSelectToken(null);
          }
          onClose();
        }}
      >
        <Trash2 size={14} aria-hidden="true" />
        Delete
      </button>
    </div>
  );
}

function TokenRowThumbnail({ asset, label }: { asset: Asset | null; label: string }) {
  const previewPath = asset?.thumbnailAbsolutePath ?? asset?.absolutePath;
  return (
    <span className="token-row-thumbnail" title={label} aria-hidden="true">
      {previewPath ? <img src={window.localVtt.toAssetUrl(previewPath)} alt="" draggable={false} /> : <UsersRound size={13} />}
    </span>
  );
}
