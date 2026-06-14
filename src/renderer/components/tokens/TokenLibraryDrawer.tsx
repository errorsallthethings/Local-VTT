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
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Asset } from "../../../shared/localvtt";
import { useDismissableMenu } from "../../hooks/useDismissableMenu";
import { useFloatingMenuPosition } from "../../hooks/useFloatingMenuPosition";
import { TOKEN_LIBRARY_ASSET_DRAG_TYPE } from "../../lib/dragTypes";

type TokenLibrarySort = "name-asc" | "newest" | "oldest";
type TokenLibraryView = "list" | "small" | "medium" | "large";

interface TokenLibraryDrawerProps {
  assets: Asset[];
  expanded: boolean;
  campaignOpen: boolean;
  activeSceneName?: string;
  onToggleExpanded: () => void;
  onStartResize: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onResetHeight: () => void;
  onImportToken: () => void;
  onAddToken: (asset: Asset) => void;
  selectedTokenAssetId?: string;
  onSetTokenDefaults: (asset: Asset) => void;
  onRenameToken: (asset: Asset) => void;
  onDeleteToken: (asset: Asset) => void;
  sidePanel?: ReactNode;
}

export function TokenLibraryDrawer({
  assets,
  expanded,
  campaignOpen,
  activeSceneName,
  onToggleExpanded,
  onStartResize,
  onResetHeight,
  onImportToken,
  onAddToken,
  selectedTokenAssetId,
  onSetTokenDefaults,
  onRenameToken,
  onDeleteToken,
  sidePanel
}: TokenLibraryDrawerProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TokenLibrarySort>("name-asc");
  const [view, setView] = useState<TokenLibraryView>("list");
  const [openTokenMenuId, setOpenTokenMenuId] = useState<string | null>(null);
  const [splitPercent, setSplitPercent] = useState(62);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...assets]
      .filter((asset) => !normalizedQuery || `${asset.name} ${asset.originalFileName}`.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => sortTokenAssets(a, b, sort));
  }, [assets, query, sort]);
  const selectedTokenAsset = selectedTokenAssetId ? (assets.find((asset) => asset.id === selectedTokenAssetId) ?? null) : null;
  useDismissableMenu({
    enabled: Boolean(openTokenMenuId),
    menuRootClass: "token-library-menu-wrap",
    onDismiss: () => setOpenTokenMenuId(null)
  });

  const startSplitResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const content = contentRef.current;
    if (!content) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const bounds = content.getBoundingClientRect();
    const updateSplit = (clientX: number) => {
      const nextPercent = ((clientX - bounds.left) / bounds.width) * 100;
      setSplitPercent(Math.min(76, Math.max(38, nextPercent)));
    };
    updateSplit(event.clientX);
    const onPointerMove = (moveEvent: PointerEvent) => updateSplit(moveEvent.clientX);
    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  };

  return (
    <section
      className={`token-library-drawer token-library-view-${view} ${
        expanded ? "token-library-expanded" : "token-library-collapsed-click-target"
      }`}
      onClick={() => {
        if (!expanded) {
          onToggleExpanded();
        }
      }}
    >
      {expanded && (
        <button
          className="token-library-resize-handle"
          aria-label="Resize token library"
          title="Drag to resize. Double-click to reset."
          onPointerDown={onStartResize}
          onDoubleClick={onResetHeight}
        >
          <GripHorizontal size={15} aria-hidden="true" />
        </button>
      )}
      <button
        className="icon-button token-library-toggle"
        aria-label={expanded ? "Collapse token library" : "Expand token library"}
        title={expanded ? "Collapse token library" : "Expand token library"}
        onClick={(event) => {
          event.stopPropagation();
          onToggleExpanded();
        }}
      >
        {expanded ? <PanelBottomClose size={16} aria-hidden="true" /> : <PanelBottomOpen size={16} aria-hidden="true" />}
      </button>
      <div className="token-library-header">
        <div className="token-library-title">
          <strong>Scene Tools</strong>
        </div>
      </div>

      {expanded && (
        <div
          ref={contentRef}
          className={sidePanel ? "token-library-content token-library-content-split" : "token-library-content"}
          style={sidePanel ? ({ "--scene-tools-token-width": `${splitPercent}%` } as CSSProperties) : undefined}
        >
          <div className="token-library-main-panel">
            <div className="token-library-panel-heading">
              <div className="token-library-title">
                <strong>Token Library</strong>
                <span>{assets.length === 1 ? "1 token" : `${assets.length} tokens`}</span>
              </div>
              <div className="token-library-tools">
                <button
                  className="token-library-import"
                  disabled={!campaignOpen}
                  title={campaignOpen ? "Import Token" : "Create or open a campaign before importing tokens"}
                  onClick={onImportToken}
                >
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
            </div>
            {selectedTokenAsset && (
              <section className="token-library-section">
                <TokenLibrarySectionLabel label="Selected Token" />
                <div className="token-library-selected-token">
                  <TokenLibraryItem
                    asset={selectedTokenAsset}
                    activeSceneName={activeSceneName}
                    selected
                    draggable={false}
                    menuOpen={openTokenMenuId === `selected:${selectedTokenAsset.id}`}
                    onToggleMenu={() => setOpenTokenMenuId((openId) => (openId === `selected:${selectedTokenAsset.id}` ? null : `selected:${selectedTokenAsset.id}`))}
                    onAddToken={onAddToken}
                    onSetTokenDefaults={(defaultAsset) => {
                      setOpenTokenMenuId(null);
                      onSetTokenDefaults(defaultAsset);
                    }}
                    onRenameToken={(renamedAsset) => {
                      setOpenTokenMenuId(null);
                      onRenameToken(renamedAsset);
                    }}
                    onDeleteToken={(deletedAsset) => {
                      setOpenTokenMenuId(null);
                      onDeleteToken(deletedAsset);
                    }}
                  />
                </div>
              </section>
            )}
            <section className="token-library-section token-library-list-section">
              <TokenLibrarySectionLabel label="Token List" />
              {filteredAssets.length > 0 ? (
                <div className="token-library-grid">
                  {filteredAssets.map((asset) => (
                    <TokenLibraryItem
                      key={asset.id}
                      asset={asset}
                      activeSceneName={activeSceneName}
                      selected={selectedTokenAssetId === asset.id}
                      menuOpen={openTokenMenuId === asset.id}
                      onToggleMenu={() => setOpenTokenMenuId((openId) => (openId === asset.id ? null : asset.id))}
                      onAddToken={onAddToken}
                      onSetTokenDefaults={(defaultAsset) => {
                        setOpenTokenMenuId(null);
                        onSetTokenDefaults(defaultAsset);
                      }}
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
                  <span>
                    {!campaignOpen
                      ? "Create or open a campaign before importing tokens."
                      : assets.length === 0
                        ? "Import a token to start building this campaign library."
                        : "No tokens match your search."}
                  </span>
                </div>
              )}
            </section>
          </div>
          {sidePanel && (
            <>
              <button className="scene-tools-split-handle" aria-label="Resize scene tools panels" title="Drag to resize panels" onPointerDown={startSplitResize}>
                <GripVertical size={14} aria-hidden="true" />
              </button>
              <div className="token-library-side-panel">{sidePanel}</div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

function TokenLibrarySectionLabel({ label }: { label: string }) {
  return (
    <div className="token-library-section-label">
      <span>{label}</span>
      <i aria-hidden="true" />
    </div>
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
  selected = false,
  draggable = true,
  menuOpen,
  onToggleMenu,
  onAddToken,
  onSetTokenDefaults,
  onRenameToken,
  onDeleteToken
}: {
  asset: Asset;
  activeSceneName?: string;
  selected?: boolean;
  draggable?: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onAddToken: (asset: Asset) => void;
  onSetTokenDefaults: (asset: Asset) => void;
  onRenameToken: (asset: Asset) => void;
  onDeleteToken: (asset: Asset) => void;
}) {
  const previewPath = asset.thumbnailAbsolutePath ?? asset.absolutePath;
  const label = asset.name || asset.originalFileName || "Token";
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  return (
    <article
      className={selected ? "token-library-item token-library-item-selected" : "token-library-item"}
      title={label}
      draggable={draggable}
      onDragStart={(event) => {
        if (!draggable) {
          return;
        }
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
                onSetTokenDefaults={onSetTokenDefaults}
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
  onSetTokenDefaults,
  onRenameToken,
  onDeleteToken
}: {
  anchor: HTMLElement | null;
  asset: Asset;
  onSetTokenDefaults: (asset: Asset) => void;
  onRenameToken: (asset: Asset) => void;
  onDeleteToken: (asset: Asset) => void;
}) {
  const { menuRef, position } = useFloatingMenuPosition({
    open: Boolean(anchor),
    anchor,
    fallbackWidth: 158,
    fallbackHeight: 118
  });

  return (
    <div ref={menuRef} className="token-library-menu token-library-menu-portal token-library-menu-wrap" style={{ top: position.top, left: position.left }} onClick={(event) => event.stopPropagation()}>
      <button onClick={() => onRenameToken(asset)}>
        <Pencil size={14} aria-hidden="true" />
        <span>Rename</span>
      </button>
      <button title="Set presentation defaults for future scene tokens" onClick={() => onSetTokenDefaults(asset)}>
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
