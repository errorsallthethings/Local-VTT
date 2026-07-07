import { Import } from "lucide-react";
import type { Asset, Scene, Token } from "../../../../shared/localvtt";
import { TokenList } from "../lists/TokenList";

export function TokenLayerContent({
  scene,
  tokenAssets,
  selectedTokenId,
  selectedTokenIds,
  onImportToken,
  onSelectToken,
  onRenameToken,
  onUpdateToken,
  onUpdateTokens,
  onOpenTokenColor
}: {
  scene: Scene;
  tokenAssets: Map<string, Asset>;
  selectedTokenId: string | null;
  selectedTokenIds: string[];
  onImportToken: () => void;
  onSelectToken: (tokenId: string | null) => void;
  onRenameToken: (tokenId: string, fallbackName: string) => void;
  onUpdateToken: (tokenId: string, patch: Partial<Token>) => void;
  onUpdateTokens: (tokens: Token[]) => void;
  onOpenTokenColor: (tokenId: string, value: string, kind: "border" | "glow") => void;
}) {
  return (
    <>
      <div className="layer-detail-controls" onClick={(event) => event.stopPropagation()}>
        <button className={scene.tokens.length === 0 ? "import-map-next-step" : "token-import-button"} onClick={onImportToken}>
          <Import size={16} aria-hidden="true" />
          Import Token
        </button>
      </div>
      <TokenList
        scene={scene}
        tokenAssets={tokenAssets}
        selectedTokenId={selectedTokenId}
        selectedTokenIds={selectedTokenIds}
        onSelectToken={onSelectToken}
        onRenameToken={onRenameToken}
        onUpdateToken={onUpdateToken}
        onUpdateTokens={onUpdateTokens}
        onOpenTokenColor={onOpenTokenColor}
      />
    </>
  );
}
