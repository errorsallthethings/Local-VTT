import { PackageOpen, PanelBottomClose, PanelBottomOpen, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Asset } from "../../../shared/localvtt";
import { TOKEN_LIBRARY_ASSET_DRAG_TYPE } from "../../lib/dragTypes";

interface TokenLibraryDrawerProps {
  assets: Asset[];
  expanded: boolean;
  activeSceneName?: string;
  onToggleExpanded: () => void;
  onAddToken: (asset: Asset) => void;
}

export function TokenLibraryDrawer({ assets, expanded, activeSceneName, onToggleExpanded, onAddToken }: TokenLibraryDrawerProps) {
  const [query, setQuery] = useState("");
  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sortedAssets = [...assets].sort((a, b) => a.name.localeCompare(b.name));
    if (!normalizedQuery) {
      return sortedAssets;
    }
    return sortedAssets.filter((asset) => `${asset.name} ${asset.originalFileName}`.toLowerCase().includes(normalizedQuery));
  }, [assets, query]);

  return (
    <section className={`token-library-drawer ${expanded ? "token-library-expanded" : ""}`}>
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
          <label className="token-library-search">
            <Search size={14} aria-hidden="true" />
            <input value={query} placeholder="Search tokens" onChange={(event) => setQuery(event.target.value)} />
          </label>
        )}
      </div>

      {expanded && (
        <div className="token-library-content">
          {filteredAssets.length > 0 ? (
            <div className="token-library-grid">
              {filteredAssets.map((asset) => (
                <TokenLibraryItem key={asset.id} asset={asset} activeSceneName={activeSceneName} onAddToken={onAddToken} />
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

function TokenLibraryItem({ asset, activeSceneName, onAddToken }: { asset: Asset; activeSceneName?: string; onAddToken: (asset: Asset) => void }) {
  const previewPath = asset.thumbnailAbsolutePath ?? asset.absolutePath;
  const label = asset.name || asset.originalFileName || "Token";
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
      <div className="token-library-thumb">
        {previewPath ? <img src={window.localVtt.toAssetUrl(previewPath)} alt="" loading="lazy" draggable={false} /> : <PackageOpen size={18} aria-hidden="true" />}
      </div>
      <div className="token-library-item-meta">
        <strong>{label}</strong>
        <span>{asset.originalFileName}</span>
      </div>
      <button
        className="icon-button token-library-add"
        aria-label={`Add ${label} to ${activeSceneName ?? "scene"}`}
        title="Add to scene"
        disabled={!activeSceneName}
        onClick={() => onAddToken(asset)}
      >
        <Plus size={15} aria-hidden="true" />
      </button>
    </article>
  );
}
