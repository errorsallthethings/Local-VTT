import type { Dispatch, SetStateAction } from "react";
import { Copy, ListPlus, Settings2, Trash2 } from "lucide-react";
import {
  DEFAULT_TOKEN_FOOTPRINT_VISIBLE,
  TOKEN_CONDITION_IDS,
  TOKEN_CONDITION_LABELS,
  type Scene
} from "../../../shared/localvtt";
import type { DrawingContextMenu, EnvironmentEffectContextMenu, MaskContextMenu, TokenContextMenu } from "../../canvas/scene";
import type { SceneCanvasContextMenuProps } from "./useSceneCanvasContextMenus";
import {
  duplicateEnvironmentEffect,
  duplicateSceneDrawing,
  duplicateSceneFogShape,
  duplicateSceneToken,
  duplicateSceneWeatherMask,
  patchSceneEnvironmentEffect,
  patchSceneToken,
  removeEnvironmentEffect,
  removeSceneDrawing,
  removeSceneFogShape,
  removeSceneToken,
  removeSceneWeatherMask,
  setDrawingGmVisibility,
  setDrawingPlayerVisibility,
  setDrawingTemplateFootprintVisibility,
  setFogShapeGmVisibility,
  setFogShapePlayerVisibility,
  setWeatherMaskPlayerVisibility,
  setWeatherMaskVisibility
} from "../../lib/scene";
import { getTokenConditionsVisibleInPlayer, setTokenCondition, setTokenConditionsPlayerVisibility } from "../../lib/tokens";
import { TokenSettings } from "../layers";

type SceneChangeHandler = (scene: Scene) => void;

interface SceneCanvasContextMenusProps extends SceneCanvasContextMenuProps {
  scene: Scene | null;
  onSceneChange?: SceneChangeHandler;
  onSelectToken?: (tokenId: string | null) => void;
  onSelectDrawing?: (drawingId: string | null) => void;
  onSelectFogShape?: (shapeId: string | null) => void;
  onSelectWeatherMask?: (maskId: string | null) => void;
  onSelectEnvironmentEffect?: (effectId: string | null) => void;
  onEditEnvironmentEffect?: (effectId: string) => void;
  onAddTokenToTurnOrder?: (tokenId: string) => void;
  onOpenTokenColor?: (tokenId: string, value: string, kind: "border" | "glow") => void;
}

export function SceneCanvasContextMenus({
  scene,
  tokenContextMenu,
  setTokenContextMenu,
  maskContextMenu,
  setMaskContextMenu,
  drawingContextMenu,
  setDrawingContextMenu,
  environmentEffectContextMenu,
  setEnvironmentEffectContextMenu,
  onSceneChange,
  onSelectToken,
  onSelectDrawing,
  onSelectFogShape,
  onSelectWeatherMask,
  onSelectEnvironmentEffect,
  onEditEnvironmentEffect,
  onAddTokenToTurnOrder,
  onOpenTokenColor
}: SceneCanvasContextMenusProps) {
  return (
    <>
      <TokenCanvasContextMenu
        scene={scene}
        menu={tokenContextMenu}
        setMenu={setTokenContextMenu}
        onSceneChange={onSceneChange}
        onSelectToken={onSelectToken}
        onAddTokenToTurnOrder={onAddTokenToTurnOrder}
        onOpenTokenColor={onOpenTokenColor}
      />
      <MaskCanvasContextMenu
        scene={scene}
        menu={maskContextMenu}
        setMenu={setMaskContextMenu}
        onSceneChange={onSceneChange}
        onSelectFogShape={onSelectFogShape}
        onSelectWeatherMask={onSelectWeatherMask}
      />
      <DrawingCanvasContextMenu
        scene={scene}
        menu={drawingContextMenu}
        setMenu={setDrawingContextMenu}
        onSceneChange={onSceneChange}
        onSelectDrawing={onSelectDrawing}
      />
      <EnvironmentEffectCanvasContextMenu
        scene={scene}
        menu={environmentEffectContextMenu}
        setMenu={setEnvironmentEffectContextMenu}
        onSceneChange={onSceneChange}
        onSelectEnvironmentEffect={onSelectEnvironmentEffect}
        onEditEnvironmentEffect={onEditEnvironmentEffect}
      />
    </>
  );
}

function TokenCanvasContextMenu({
  scene,
  menu,
  setMenu,
  onSceneChange,
  onSelectToken,
  onAddTokenToTurnOrder,
  onOpenTokenColor
}: {
  scene: Scene | null;
  menu: TokenContextMenu | null;
  setMenu: Dispatch<SetStateAction<TokenContextMenu | null>>;
  onSceneChange?: SceneChangeHandler;
  onSelectToken?: (tokenId: string | null) => void;
  onAddTokenToTurnOrder?: (tokenId: string) => void;
  onOpenTokenColor?: (tokenId: string, value: string, kind: "border" | "glow") => void;
}) {
  if (!scene || !menu) {
    return null;
  }

  const token = scene.tokens.find((candidate) => candidate.id === menu.tokenId);
  if (!token) {
    return null;
  }

  const tokenConditionsVisibleInPlayer = getTokenConditionsVisibleInPlayer(token);
  const tokenHasConditions = (token.conditions ?? []).length > 0;

  return (
    <div className="token-settings-menu token-context-menu canvas-context-menu" style={{ left: menu.x, top: menu.y }} role="menu" onPointerDown={(event) => event.stopPropagation()}>
      <div className="canvas-context-menu-title" title={menu.tokenName}>{menu.tokenName}</div>
      <div className="control-divider" />
      <div className="token-menu-editor-grid">
        <div className="token-menu-token-settings">
          <div className="settings-grid">
            <label className="setting-row">
              <span>GM View</span>
              <label className="fog-operation-switch" title={`${menu.visibleInGm ? "Hide" : "Show"} ${menu.tokenName} in GM View`}>
                <span>Show</span>
                <input
                  aria-label={`${menu.visibleInGm ? "Hide" : "Show"} ${menu.tokenName} in GM View`}
                  type="checkbox"
                  checked={!menu.visibleInGm}
                  onChange={(event) => {
                    if (!onSceneChange) {
                      setMenu(null);
                      return;
                    }
                    const visibleInGm = !event.target.checked;
                    onSceneChange(patchSceneToken(scene, token.id, { visibleInGm }));
                    setMenu((current) => (current ? { ...current, visibleInGm } : current));
                  }}
                />
                <span>Hide</span>
              </label>
            </label>
            <label className="setting-row">
              <span>Player View</span>
              <label className="fog-operation-switch" title={`${menu.visibleInPlayer ? "Hide" : "Show"} ${menu.tokenName} on Player View`}>
                <span>Show</span>
                <input
                  aria-label={`${menu.visibleInPlayer ? "Hide" : "Show"} ${menu.tokenName} on Player View`}
                  type="checkbox"
                  checked={!menu.visibleInPlayer}
                  onChange={(event) => {
                    if (!onSceneChange) {
                      setMenu(null);
                      return;
                    }
                    const visibleInPlayer = !event.target.checked;
                    onSceneChange(patchSceneToken(scene, token.id, { visibleInPlayer }));
                    setMenu((current) => (current ? { ...current, visibleInPlayer } : current));
                  }}
                />
                <span>Hide</span>
              </label>
            </label>
            <label className="setting-row">
              <span>Footprint</span>
              <label className="fog-operation-switch" title={`${token.footprintVisible ?? DEFAULT_TOKEN_FOOTPRINT_VISIBLE ? "Hide" : "Show"} ${menu.tokenName} footprint`}>
                <span>Show</span>
                <input
                  aria-label={`${token.footprintVisible ?? DEFAULT_TOKEN_FOOTPRINT_VISIBLE ? "Hide" : "Show"} ${menu.tokenName} footprint`}
                  type="checkbox"
                  checked={!(token.footprintVisible ?? DEFAULT_TOKEN_FOOTPRINT_VISIBLE)}
                  onChange={(event) => {
                    if (!onSceneChange) {
                      setMenu(null);
                      return;
                    }
                    onSceneChange(patchSceneToken(scene, token.id, { footprintVisible: !event.target.checked }));
                  }}
                />
                <span>Hide</span>
              </label>
            </label>
          </div>
          <div className="control-divider" />
          <TokenSettings
            token={token}
            gridSize={scene.grid.sizePx}
            gridType={scene.grid.type}
            showFootprint={false}
            onUpdateToken={(patch) => onSceneChange?.(patchSceneToken(scene, token.id, patch))}
            onOpenTokenColor={(tokenId, value, kind) => {
              onOpenTokenColor?.(tokenId, value, kind);
              setMenu(null);
            }}
          />
        </div>
        <div className="token-menu-condition-settings">
          <div className="canvas-context-menu-title">Conditions</div>
          <div className="settings-grid token-condition-visibility-grid">
            <label className="setting-row">
              <span>Player View</span>
              <label className="fog-operation-switch" title={`${tokenConditionsVisibleInPlayer ? "Hide" : "Show"} token conditions on Player View`}>
                <span>Show</span>
                <input
                  aria-label={`${tokenConditionsVisibleInPlayer ? "Hide" : "Show"} token conditions on Player View`}
                  type="checkbox"
                  checked={!tokenConditionsVisibleInPlayer}
                  disabled={!tokenHasConditions}
                  onChange={(event) => {
                    if (!onSceneChange) {
                      return;
                    }
                    onSceneChange({
                      ...scene,
                      tokens: setTokenConditionsPlayerVisibility(scene.tokens, token.id, !event.target.checked),
                      updatedAt: new Date().toISOString()
                    });
                  }}
                />
                <span>Hide</span>
              </label>
            </label>
          </div>
          <div className="token-condition-list">
            {TOKEN_CONDITION_IDS.map((conditionId) => {
              const enabled = (token.conditions ?? []).some((candidate) => candidate.id === conditionId);
              return (
                <label className="token-condition-check" key={conditionId}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) => {
                      if (!onSceneChange) {
                        return;
                      }
                      onSceneChange({
                        ...scene,
                        tokens: setTokenCondition(scene.tokens, token.id, conditionId, event.target.checked, tokenConditionsVisibleInPlayer),
                        updatedAt: new Date().toISOString()
                      });
                    }}
                  />
                  <span>{TOKEN_CONDITION_LABELS[conditionId]}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
      <div className="control-divider" />
      <button type="button" className="token-menu-action" role="menuitem" title={`Add ${menu.tokenName} to Turn Order`} aria-label={`Add ${menu.tokenName} to Turn Order`} onClick={() => {
        onAddTokenToTurnOrder?.(menu.tokenId);
        setMenu(null);
      }}>
        <ListPlus size={14} aria-hidden="true" />
        <span>Add to Turn Order</span>
      </button>
      <button type="button" className="token-menu-action" role="menuitem" title={`Duplicate ${menu.tokenName}`} aria-label={`Duplicate ${menu.tokenName}`} onClick={() => {
        if (!onSceneChange) {
          setMenu(null);
          return;
        }
        const result = duplicateSceneToken(scene, token.id, crypto.randomUUID());
        if (!result.duplicatedTokenId) {
          setMenu(null);
          return;
        }
        onSceneChange(result.scene);
        onSelectToken?.(result.duplicatedTokenId);
        setMenu(null);
      }}>
        <Copy size={14} aria-hidden="true" />
        <span>Duplicate</span>
      </button>
      <button type="button" className="token-menu-action token-menu-delete" role="menuitem" title={`Delete ${menu.tokenName}`} aria-label={`Delete ${menu.tokenName}`} onClick={() => {
        if (!onSceneChange) {
          setMenu(null);
          return;
        }
        onSceneChange(removeSceneToken(scene, token.id));
        onSelectToken?.(null);
        setMenu(null);
      }}>
        <Trash2 size={14} aria-hidden="true" />
        <span>Delete</span>
      </button>
    </div>
  );
}

function MaskCanvasContextMenu({
  scene,
  menu,
  setMenu,
  onSceneChange,
  onSelectFogShape,
  onSelectWeatherMask
}: {
  scene: Scene | null;
  menu: MaskContextMenu | null;
  setMenu: Dispatch<SetStateAction<MaskContextMenu | null>>;
  onSceneChange?: SceneChangeHandler;
  onSelectFogShape?: (shapeId: string | null) => void;
  onSelectWeatherMask?: (maskId: string | null) => void;
}) {
  if (!menu) {
    return null;
  }

  return (
    <div className="token-settings-menu canvas-context-menu" style={{ left: menu.x, top: menu.y }} role="menu" onPointerDown={(event) => event.stopPropagation()}>
      <div className="canvas-context-menu-title" title={menu.label}>{menu.label}</div>
      <div className="control-divider" />
      <div className="settings-grid">
        {menu.kind === "fog" ? (
          <>
            <VisibilitySwitch
              label="GM View"
              title={`${menu.visibleInGm ? "Hide" : "Show"} ${menu.label} in GM View`}
              ariaLabel={`${menu.visibleInGm ? "Hide" : "Show"} ${menu.label} in GM View`}
              checked={!menu.visibleInGm}
              onChange={(hidden) => {
                if (!scene || !onSceneChange || menu.kind !== "fog") {
                  setMenu(null);
                  return;
                }
                const visibleInGm = !hidden;
                onSceneChange(setFogShapeGmVisibility(scene, menu.shapeId, visibleInGm));
                setMenu((current) => (current?.kind === "fog" ? { ...current, visibleInGm } : current));
              }}
            />
            <VisibilitySwitch
              label="Player View"
              title={`${menu.visibleInPlayer ? "Hide" : "Show"} ${menu.label} on Player View`}
              ariaLabel={`${menu.visibleInPlayer ? "Hide" : "Show"} ${menu.label} on Player View`}
              checked={!menu.visibleInPlayer}
              onChange={(hidden) => {
                if (!scene || !onSceneChange || menu.kind !== "fog") {
                  setMenu(null);
                  return;
                }
                const visibleInPlayer = !hidden;
                onSceneChange(setFogShapePlayerVisibility(scene, menu.shapeId, visibleInPlayer));
                setMenu((current) => (current?.kind === "fog" ? { ...current, visibleInPlayer } : current));
              }}
            />
          </>
        ) : (
          <>
            <VisibilitySwitch
              label="Mask Enabled"
              onText="On"
              offText="Off"
              title={`${menu.visible ? "Disable" : "Enable"} ${menu.label}`}
              ariaLabel={`${menu.visible ? "Disable" : "Enable"} ${menu.label}`}
              checked={!menu.visible}
              onChange={(disabled) => {
                if (!scene || !onSceneChange || menu.kind !== "effects") {
                  setMenu(null);
                  return;
                }
                const visible = !disabled;
                onSceneChange(setWeatherMaskVisibility(scene, menu.maskId, visible));
                setMenu((current) => (current?.kind === "effects" ? { ...current, visible } : current));
              }}
            />
            <VisibilitySwitch
              label="Player View"
              title={`${menu.visibleInPlayer ? "Hide" : "Show"} ${menu.label} on Player View`}
              ariaLabel={`${menu.visibleInPlayer ? "Hide" : "Show"} ${menu.label} on Player View`}
              checked={!menu.visibleInPlayer}
              onChange={(hidden) => {
                if (!scene || !onSceneChange || menu.kind !== "effects") {
                  setMenu(null);
                  return;
                }
                const visibleInPlayer = !hidden;
                onSceneChange(setWeatherMaskPlayerVisibility(scene, menu.maskId, visibleInPlayer));
                setMenu((current) => (current?.kind === "effects" ? { ...current, visibleInPlayer } : current));
              }}
            />
          </>
        )}
      </div>
      <MenuDividerActions
        duplicateLabel={`Duplicate ${menu.label}`}
        deleteLabel={`Delete ${menu.label}`}
        onDuplicate={() => {
          if (!scene || !onSceneChange) {
            setMenu(null);
            return;
          }
          if (menu.kind === "fog") {
            const result = duplicateSceneFogShape(scene, menu.shapeId, crypto.randomUUID(), menu.label);
            onSceneChange(result.scene);
            onSelectFogShape?.(result.duplicatedFogShapeId ?? null);
          } else {
            const result = duplicateSceneWeatherMask(scene, menu.maskId, crypto.randomUUID(), menu.label);
            onSceneChange(result.scene);
            onSelectWeatherMask?.(result.duplicatedWeatherMaskId ?? null);
          }
          setMenu(null);
        }}
        onDelete={() => {
          if (!scene || !onSceneChange) {
            setMenu(null);
            return;
          }
          if (menu.kind === "fog") {
            onSceneChange(removeSceneFogShape(scene, menu.shapeId));
            onSelectFogShape?.(null);
          } else {
            onSceneChange(removeSceneWeatherMask(scene, menu.maskId));
            onSelectWeatherMask?.(null);
          }
          setMenu(null);
        }}
      />
    </div>
  );
}

function DrawingCanvasContextMenu({
  scene,
  menu,
  setMenu,
  onSceneChange,
  onSelectDrawing
}: {
  scene: Scene | null;
  menu: DrawingContextMenu | null;
  setMenu: Dispatch<SetStateAction<DrawingContextMenu | null>>;
  onSceneChange?: SceneChangeHandler;
  onSelectDrawing?: (drawingId: string | null) => void;
}) {
  if (!menu) {
    return null;
  }

  return (
    <div className="token-settings-menu canvas-context-menu" style={{ left: menu.x, top: menu.y }} role="menu" onPointerDown={(event) => event.stopPropagation()}>
      <div className="canvas-context-menu-title" title={menu.label}>{menu.label}</div>
      <div className="control-divider" />
      <div className="settings-grid">
        {menu.isTemplate && (
          <VisibilitySwitch
            label="Footprint"
            title={`${menu.templateFootprintVisible ? "Hide" : "Show"} ${menu.label} grid footprint`}
            ariaLabel={`${menu.templateFootprintVisible ? "Hide" : "Show"} ${menu.label} grid footprint`}
            checked={!menu.templateFootprintVisible}
            onChange={(hidden) => {
              if (!scene || !onSceneChange) {
                setMenu(null);
                return;
              }
              const templateFootprintVisible = !hidden;
              onSceneChange(setDrawingTemplateFootprintVisibility(scene, menu.drawingId, templateFootprintVisible));
              setMenu((current) => (current ? { ...current, templateFootprintVisible } : current));
            }}
          />
        )}
        <VisibilitySwitch
          label="GM View"
          title={`${menu.visibleInGm ? "Hide" : "Show"} ${menu.label} in GM View`}
          ariaLabel={`${menu.visibleInGm ? "Hide" : "Show"} ${menu.label} in GM View`}
          checked={!menu.visibleInGm}
          onChange={(hidden) => {
            if (!scene || !onSceneChange) {
              setMenu(null);
              return;
            }
            const visibleInGm = !hidden;
            onSceneChange(setDrawingGmVisibility(scene, menu.drawingId, visibleInGm));
            setMenu((current) => (current ? { ...current, visibleInGm } : current));
          }}
        />
        <VisibilitySwitch
          label="Player View"
          title={`${menu.visibleInPlayer ? "Hide" : "Show"} ${menu.label} on Player View`}
          ariaLabel={`${menu.visibleInPlayer ? "Hide" : "Show"} ${menu.label} on Player View`}
          checked={!menu.visibleInPlayer}
          onChange={(hidden) => {
            if (!scene || !onSceneChange) {
              setMenu(null);
              return;
            }
            const visibleInPlayer = !hidden;
            onSceneChange(setDrawingPlayerVisibility(scene, menu.drawingId, visibleInPlayer));
            setMenu((current) => (current ? { ...current, visibleInPlayer } : current));
          }}
        />
      </div>
      <MenuDividerActions
        duplicateLabel={`Duplicate ${menu.label}`}
        deleteLabel={`Delete ${menu.label}`}
        onDuplicate={() => {
          if (!scene || !onSceneChange) {
            setMenu(null);
            return;
          }
          const result = duplicateSceneDrawing(scene, menu.drawingId, crypto.randomUUID(), menu.label);
          if (!result.duplicatedDrawingId) {
            setMenu(null);
            return;
          }
          onSceneChange(result.scene);
          onSelectDrawing?.(result.duplicatedDrawingId);
          setMenu(null);
        }}
        onDelete={() => {
          if (!scene || !onSceneChange) {
            setMenu(null);
            return;
          }
          onSceneChange(removeSceneDrawing(scene, menu.drawingId));
          onSelectDrawing?.(null);
          setMenu(null);
        }}
      />
    </div>
  );
}

function EnvironmentEffectCanvasContextMenu({
  scene,
  menu,
  setMenu,
  onSceneChange,
  onSelectEnvironmentEffect,
  onEditEnvironmentEffect
}: {
  scene: Scene | null;
  menu: EnvironmentEffectContextMenu | null;
  setMenu: Dispatch<SetStateAction<EnvironmentEffectContextMenu | null>>;
  onSceneChange?: SceneChangeHandler;
  onSelectEnvironmentEffect?: (effectId: string | null) => void;
  onEditEnvironmentEffect?: (effectId: string) => void;
}) {
  if (!menu) {
    return null;
  }

  return (
    <div className="token-settings-menu canvas-context-menu" style={{ left: menu.x, top: menu.y }} role="menu" onPointerDown={(event) => event.stopPropagation()}>
      <div className="canvas-context-menu-title" title={menu.label}>{menu.label}</div>
      <div className="control-divider" />
      <div className="settings-grid">
        <VisibilitySwitch
          label="GM View"
          title={`${menu.visibleInGm ? "Hide" : "Show"} ${menu.label} in GM View`}
          ariaLabel={`${menu.visibleInGm ? "Hide" : "Show"} ${menu.label} in GM View`}
          checked={!menu.visibleInGm}
          onChange={(hidden) => {
            if (!scene || !onSceneChange) {
              setMenu(null);
              return;
            }
            const visibleInGm = !hidden;
            onSceneChange(patchSceneEnvironmentEffect(scene, menu.effectId, (effect) => ({ ...effect, visibleInGm })));
            setMenu((current) => (current ? { ...current, visibleInGm } : current));
          }}
        />
        <VisibilitySwitch
          label="Player View"
          title={`${menu.visibleInPlayer ? "Hide" : "Show"} ${menu.label} on Player View`}
          ariaLabel={`${menu.visibleInPlayer ? "Hide" : "Show"} ${menu.label} on Player View`}
          checked={!menu.visibleInPlayer}
          onChange={(hidden) => {
            if (!scene || !onSceneChange) {
              setMenu(null);
              return;
            }
            const visibleInPlayer = !hidden;
            onSceneChange(patchSceneEnvironmentEffect(scene, menu.effectId, (effect) => ({ ...effect, visibleInPlayer })));
            setMenu((current) => (current ? { ...current, visibleInPlayer } : current));
          }}
        />
      </div>
      <div className="control-divider" />
      <button type="button" role="menuitem" className="token-menu-action" title={`Edit ${menu.label}`} aria-label={`Edit ${menu.label}`} onClick={() => {
        onSelectEnvironmentEffect?.(menu.effectId);
        onEditEnvironmentEffect?.(menu.effectId);
        setMenu(null);
      }}>
        <Settings2 size={14} aria-hidden="true" />
        <span>Edit Effect</span>
      </button>
      <button type="button" role="menuitem" className="token-menu-action" title={`Duplicate ${menu.label}`} aria-label={`Duplicate ${menu.label}`} onClick={() => {
        if (!scene || !onSceneChange) {
          setMenu(null);
          return;
        }
        const result = duplicateEnvironmentEffect(scene, menu.effectId, crypto.randomUUID(), menu.label);
        onSceneChange(result.scene);
        onSelectEnvironmentEffect?.(result.duplicatedEnvironmentEffectId ?? null);
        setMenu(null);
      }}>
        <Copy size={14} aria-hidden="true" />
        <span>Duplicate</span>
      </button>
      <button type="button" role="menuitem" className="token-menu-action token-menu-delete" title={`Delete ${menu.label}`} aria-label={`Delete ${menu.label}`} onClick={() => {
        if (!scene || !onSceneChange) {
          return;
        }
        onSceneChange(removeEnvironmentEffect(scene, menu.effectId));
        onSelectEnvironmentEffect?.(null);
        setMenu(null);
      }}>
        <Trash2 size={14} aria-hidden="true" />
        <span>Delete</span>
      </button>
    </div>
  );
}

function VisibilitySwitch({
  label,
  title,
  ariaLabel,
  checked,
  onChange,
  onText = "Show",
  offText = "Hide"
}: {
  label: string;
  title: string;
  ariaLabel: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  onText?: string;
  offText?: string;
}) {
  return (
    <label className="setting-row">
      <span>{label}</span>
      <label className="fog-operation-switch" title={title}>
        <span>{onText}</span>
        <input aria-label={ariaLabel} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span>{offText}</span>
      </label>
    </label>
  );
}

function MenuDividerActions({
  duplicateLabel,
  deleteLabel,
  onDuplicate,
  onDelete
}: {
  duplicateLabel: string;
  deleteLabel: string;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="control-divider" />
      <button type="button" role="menuitem" className="token-menu-action" title={duplicateLabel} aria-label={duplicateLabel} onClick={onDuplicate}>
        <Copy size={14} aria-hidden="true" />
        <span>Duplicate</span>
      </button>
      <button type="button" role="menuitem" className="token-menu-action token-menu-delete" title={deleteLabel} aria-label={deleteLabel} onClick={onDelete}>
        <Trash2 size={14} aria-hidden="true" />
        <span>Delete</span>
      </button>
    </>
  );
}
