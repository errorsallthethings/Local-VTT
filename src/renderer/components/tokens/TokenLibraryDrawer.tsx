import {
  GripHorizontal,
  GripVertical,
  Grid2X2,
  Grid3X3,
  List,
  MoreVertical,
  PackageOpen,
  PanelBottomClose,
  PanelBottomOpen,
  Pencil,
  Plus,
  Search,
  Settings2,
  Square,
  Trash2,
  Upload
} from "lucide-react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Asset } from "../../../shared/localvtt";
import { useDismissableMenu } from "../../hooks/useDismissableMenu";
import { TOKEN_LIBRARY_ASSET_DRAG_TYPE } from "../../lib/dragTypes";

type TokenLibrarySort = "name-asc" | "newest" | "oldest";
type TokenLibraryView = "list" | "small" | "medium" | "large";

interface TokenLibraryDrawerProps {
  assets: Asset[];
  expanded: boolean;
  activeSceneName?: string;
  onToggleExpanded: () => void;
  onStartResize: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onResetHeight: () => void;
  onImportToken: () => void;
  onAddToken: (asset: Asset) => void;
  onRenameToken: (asset: Asset) => void;
  onDeleteToken: (asset: Asset) => void;
}

export function TokenLibraryDrawer({
  assets,
  expanded,
  activeSceneName,
  onToggleExpanded,
  onStartResize,
  onResetHeight,
  onImportToken,
  onAddToken,
  onRenameToken,
  onDeleteToken
}: TokenLibraryDrawerProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TokenLibrarySort>("name-asc");
  const [view, setView] = useState<TokenLibraryView>("list");
  const [openTokenMenuId, setOpenTokenMenuId] = useState<string | null>(null);
  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...assets]
      .filter((asset) => !normalizedQuery || `${asset.name} ${asset.originalFileName}`.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => sortTokenAssets(a, b, sort));
  }, [assets, query, sort]);
  useDismissableMenu({
    enabled: Boolean(openTokenMenuId),
    menuRootClass: "token-library-menu-wrap",
    onDismiss: () => setOpenTokenMenuId(null)
  });

  return (
    <section className={`token-library-drawer token-library-view-${view} ${expanded ? "token-library-expanded" : ""}`}>
      {expanded && (
        <button
          className="token-library-resize-handle"
          aria-label="Resize token library"
          title="Drag to resize. Double-click to reset."
          onPointerDown={onStartResize}
          onDoubleClick={onResetHeight}
        />
      )}
      <div className="token-library-header">
        <button
          className="icon-button token-library-toggle"
          aria-label={expanded ? "Collapse token library" : "Expand token library"}
          title={expanded ? "Collapse token library" : "Expand token library"}
          onClick={onToggleExpanded}
        >
          {expanded ? <PanelBottomClose size={16} aria-hidden="true" /> : <PanelBottomOpen size={16} aria-hidden="true" />}
        </button>
        <div className="token-library-title">
          <strong>Token Library</strong>
          <span>{assets.length === 1 ? "1 token" : `${assets.length} tokens`}</span>
        </div>
        {expanded && (
          <div className="token-library-tools">
            <button className="token-library-import" onClick={onImportToken}>
              <Upload size={14} aria-hidden="true" />
              <span>Import Token</span>
            </button>
            <label className="token-library-sort">
              <span>Sort</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as TokenLibrarySort)}>
                <option value="name-asc">Name A-Z</option>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </label>
            <div className="token-library-view-toggle" aria-label="Token library display size">
              <ViewButton view="list" currentView={view} label="List view" onSelect={setView}>
                <List size={14} aria-hidden="true" />
              </ViewButton>
              <ViewButton view="small" currentView={view} label="Small tokens" onSelect={setView}>
                <Grid3X3 size={14} aria-hidden="true" />
              </ViewButton>
              <ViewButton view="medium" currentView={view} label="Medium tokens" onSelect={setView}>
                <Grid2X2 size={14} aria-hidden="true" />
              </ViewButton>
              <ViewButton view="large" currentView={view} label="Large tokens" onSelect={setView}>
                <Square size={14} aria-hidden="true" />
              </ViewButton>
            </div>
            <label className="token-library-search">
              <Search size={14} aria-hidden="true" />
              <input value={query} placeholder="Search tokens" onChange={(event) => setQuery(event.target.value)} />
            </label>
          </div>
        )}
      </div>

      {expanded && (
        <div className="token-library-content">
          {filteredAssets.length > 0 ? (
            <div className="token-library-grid">
              {filteredAssets.map((asset) => (
                <TokenLibraryItem
                  key={asset.id}
                  asset={asset}
                  activeSceneName={activeSceneName}
                  menuOpen={openTokenMenuId === asset.id}
                  onToggleMenu={() => setOpenTokenMenuId((openId) => (openId === asset.id ? null : asset.id))}
                  onAddToken={onAddToken}
                  onRenameToken={(renamedAsset) => {
                    setOpenTokenMenuId(null);
                    onRenameToken(renamedAsset);
                  }}
                  onDeleteToken={(deletedAsset) => {
                    setOpenTokenMenuId(null);
                    onDeleteToken(deletedAsset);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="token-library-empty">
              <PackageOpen size={18} aria-hidden="true" />
              <span>{assets.length === 0 ? "Import a token to start building this campaign library." : "No tokens match your search."}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ViewButton({
  view,
  currentView,
  label,
  children,
  onSelect
}: {
  view: TokenLibraryView;
  currentView: TokenLibraryView;
  label: string;
  children: ReactNode;
  onSelect: (view: TokenLibraryView) => void;
}) {
  const selected = view === currentView;
  return (
    <button className={selected ? "token-library-view-button selected" : "token-library-view-button"} aria-label={label} title={label} aria-pressed={selected} onClick={() => onSelect(view)}>
      {children}
    </button>
  );
}

function TokenLibraryItem({
  asset,
  activeSceneName,
  menuOpen,
  onToggleMenu,
  onAddToken,
  onRenameToken,
  onDeleteToken
}: {
  asset: Asset;
  activeSceneName?: string;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onAddToken: (asset: Asset) => void;
  onRenameToken: (asset: Asset) => void;
  onDeleteToken: (asset: Asset) => void;
}) {
  const previewPath = asset.thumbnailAbsolutePath ?? asset.absolutePath;
  const label = asset.name || asset.originalFileName || "Token";
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  return (
    <article
      className="token-library-item"
      title={label}
      draggable={Boolean(activeSceneName)}
      onDragStart={(event) => {
        event.dataTransfer.setData(TOKEN_LIBRARY_ASSET_DRAG_TYPE, asset.id);
        event.dataTransfer.setData("text/plain", asset.id);
        event.dataTransfer.effectAllowed = "copy";
      }}
    >
      <span className="token-library-drag-indicator token-library-drag-indicator-vertical" aria-hidden="true">
        <GripVertical size={14} />
      </span>
      <span className="token-library-drag-indicator token-library-drag-indicator-horizontal" aria-hidden="true">
        <GripHorizontal size={14} />
      </span>
      <div className="token-library-thumb">
        {previewPath ? <img src={window.localVtt.toAssetUrl(previewPath)} alt="" loading="lazy" draggable={false} /> : <PackageOpen size={18} aria-hidden="true" />}
      </div>
      <div className="token-library-item-meta">
        <strong>{label}</strong>
        <span>{asset.originalFileName}</span>
      </div>
      <div className="token-library-actions">
        <button
          className="icon-button token-library-add"
          aria-label={`Add ${label} to ${activeSceneName ?? "scene"}`}
          title="Add to scene"
          disabled={!activeSceneName}
          onClick={() => onAddToken(asset)}
        >
          <Plus size={15} aria-hidden="true" />
        </button>
        <div className="token-library-menu-wrap">
          <button
            ref={menuButtonRef}
            className="icon-button token-library-menu-button"
            aria-label={`Open ${label} token options`}
            title="Token options"
            aria-expanded={menuOpen}
            onClick={onToggleMenu}
          >
            <MoreVertical size={15} aria-hidden="true" />
          </button>
          {menuOpen &&
            createPortal(
              <TokenLibraryMenu
                anchor={menuButtonRef.current}
                asset={asset}
                onRenameToken={onRenameToken}
                onDeleteToken={onDeleteToken}
              />,
              document.body
            )}
        </div>
      </div>
    </article>
  );
}

function TokenLibraryMenu({
  anchor,
  asset,
  onRenameToken,
  onDeleteToken
}: {
  anchor: HTMLElement | null;
  asset: Asset;
  onRenameToken: (asset: Asset) => void;
  onDeleteToken: (asset: Asset) => void;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!anchor) {
      return;
    }
    const updatePosition = () => {
      const anchorRect = anchor.getBoundingClientRect();
      const menuRect = menuRef.current?.getBoundingClientRect();
      const menuWidth = menuRect?.width ?? 158;
      const menuHeight = menuRect?.height ?? 118;
      const gap = 6;
      const top =
        anchorRect.bottom + gap + menuHeight <= window.innerHeight
          ? anchorRect.bottom + gap
          : Math.max(gap, anchorRect.top - menuHeight - gap);
      const left = Math.min(window.innerWidth - menuWidth - gap, Math.max(gap, anchorRect.right - menuWidth));
      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchor]);

  return (
    <div ref={menuRef} className="token-library-menu token-library-menu-portal token-library-menu-wrap" style={{ top: position.top, left: position.left }} onClick={(event) => event.stopPropagation()}>
      <button onClick={() => onRenameToken(asset)}>
        <Pencil size={14} aria-hidden="true" />
        <span>Rename</span>
      </button>
      <button disabled>
        <Settings2 size={14} aria-hidden="true" />
        <span>Set Defaults</span>
      </button>
      <button className="danger-menu-item" onClick={() => onDeleteToken(asset)}>
        <Trash2 size={14} aria-hidden="true" />
        <span>Delete</span>
      </button>
    </div>
  );
}

function sortTokenAssets(a: Asset, b: Asset, sort: TokenLibrarySort): number {
  if (sort === "newest" || sort === "oldest") {
    const direction = sort === "newest" ? -1 : 1;
    const dateDelta = (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * direction;
    if (dateDelta !== 0) {
      return dateDelta;
    }
  }
  return getAssetLabel(a).localeCompare(getAssetLabel(b), undefined, { sensitivity: "base" });
}

function getAssetLabel(asset: Asset): string {
  return asset.name || asset.originalFileName || "Token";
}
