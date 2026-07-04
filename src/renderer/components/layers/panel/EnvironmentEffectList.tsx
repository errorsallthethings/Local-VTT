import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Circle, Copy, Eye, EyeOff, MoreVertical, Pentagon, Settings2, Square, Trash2 } from "lucide-react";
import type { Scene } from "../../../../shared/localvtt";
import { useDismissableMenu } from "../../../hooks/useDismissableMenu";
import { useFloatingMenuPosition } from "../../../hooks/useFloatingMenuPosition";
import { formatEnvironmentEffectOptionLabel as formatEnvironmentEffectLabel } from "../../../lib/effects";
import { duplicateEnvironmentEffect } from "../../../lib/scene";
import {
  getLayerItemActionButtonClassName,
  getLayerItemRowClassName,
  getLayerItemVisibilityLabel,
  getLayerItemVisibilityTitle,
  patchLayerItemById,
  removeLayerItemById
} from "./layerItemRows";
import { formatEnvironmentShapeLabel } from "./layerPanelFormat";

export function EnvironmentEffectList({
  scene,
  selectedEnvironmentEffectId,
  onSelectEnvironmentEffect,
  onEditEnvironmentEffect,
  onRenameEnvironmentEffect,
  onUpdateEnvironment
}: {
  scene: Scene;
  selectedEnvironmentEffectId: string | null;
  onSelectEnvironmentEffect: (effectId: string | null) => void;
  onEditEnvironmentEffect: (effectId: string) => void;
  onRenameEnvironmentEffect: (effectId: string, fallbackName: string) => void;
  onUpdateEnvironment: (patch: Partial<Scene["environment"]>) => void;
}) {
  const [openEffectMenuId, setOpenEffectMenuId] = useState<string | null>(null);

  useDismissableMenu({
    enabled: Boolean(openEffectMenuId),
    menuRootClass: "environment-effect-menu-wrap",
    onDismiss: () => setOpenEffectMenuId(null)
  });

  return (
    <div className="layer-detail-controls weather-mask-list effects-layer-list" onClick={(event) => event.stopPropagation()}>
      <div className="fog-shape-list-header">
        <span>Animated Effects</span>
        <small>{scene.environment.effects.length}</small>
      </div>
      {scene.environment.effects.length > 0 ? (
        scene.environment.effects.map((effect) => {
          const label = effect.name?.trim() || `${formatEnvironmentEffectLabel(effect.effect)} Effect`;
          const effectLabel = formatEnvironmentEffectLabel(effect.effect);
          const shapeLabel = formatEnvironmentShapeLabel(effect.kind);
          const isVisibleInGm = effect.visibleInGm !== false;
          const isVisibleInPlayer = effect.visibleInPlayer !== false;
          const isSelected = selectedEnvironmentEffectId === effect.id;
          return (
            <div key={effect.id}>
              <div
                className={getLayerItemRowClassName({
                  visible: isVisibleInGm || isVisibleInPlayer,
                  selected: isSelected,
                  variant: "weather-mask"
                })}
                role="button"
                tabIndex={0}
                onClick={() => onSelectEnvironmentEffect(isSelected ? null : effect.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectEnvironmentEffect(isSelected ? null : effect.id);
                  }
                }}
              >
                <span className="fog-shape-kind-icon" title={`${effect.kind} animated effect`} aria-hidden="true">
                  {effect.kind === "circle" ? <Circle size={13} /> : effect.kind === "polygon" ? <Pentagon size={13} /> : <Square size={13} />}
                </span>
                <span className="fog-shape-name effect-row-name" title={label} onDoubleClick={() => onRenameEnvironmentEffect(effect.id, label)}>
                  <strong>{label}</strong>
                  <small>{effectLabel} - {shapeLabel}</small>
                </span>
                <button
                  className={getLayerItemActionButtonClassName(isVisibleInGm)}
                  aria-label={getLayerItemVisibilityLabel(label, "GM", isVisibleInGm)}
                  title={getLayerItemVisibilityTitle("GM", isVisibleInGm)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateEnvironment({
                      effects: patchLayerItemById(scene.environment.effects, effect.id, { visibleInGm: !isVisibleInGm })
                    });
                  }}
                >
                  {isVisibleInGm ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
                </button>
                <button
                  className={getLayerItemActionButtonClassName(isVisibleInPlayer)}
                  aria-label={getLayerItemVisibilityLabel(label, "Player", isVisibleInPlayer)}
                  title={getLayerItemVisibilityTitle("Player", isVisibleInPlayer)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateEnvironment({
                      effects: patchLayerItemById(scene.environment.effects, effect.id, { visibleInPlayer: !isVisibleInPlayer })
                    });
                  }}
                >
                  {isVisibleInPlayer ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
                </button>
                <EnvironmentEffectMenuButton
                  label={label}
                  open={openEffectMenuId === effect.id}
                  onToggle={() => setOpenEffectMenuId((openId) => (openId === effect.id ? null : effect.id))}
                  onClose={() => setOpenEffectMenuId(null)}
                  onEdit={() => {
                    onSelectEnvironmentEffect(effect.id);
                    onEditEnvironmentEffect(effect.id);
                  }}
                  onDuplicate={() => {
                    const result = duplicateEnvironmentEffect(scene, effect.id, crypto.randomUUID(), label);
                    onUpdateEnvironment({ effects: result.scene.environment.effects });
                    onSelectEnvironmentEffect(result.duplicatedEnvironmentEffectId ?? null);
                  }}
                  onDelete={() => {
                    onUpdateEnvironment({ effects: removeLayerItemById(scene.environment.effects, effect.id) });
                    if (selectedEnvironmentEffectId === effect.id) {
                      onSelectEnvironmentEffect(null);
                    }
                  }}
                />
              </div>
            </div>
          );
        })
      ) : (
        <div className="layer-empty-state">
          <strong>No Animated Effects</strong>
          <span>Draw scene-specific water, fire, fog, darkness, and other animated areas from Effects Tools.</span>
        </div>
      )}
    </div>
  );
}

function EnvironmentEffectMenuButton({
  label,
  open,
  onToggle,
  onClose,
  onEdit,
  onDuplicate,
  onDelete
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className="environment-effect-menu-wrap">
      <button
        ref={buttonRef}
        className="icon-button fog-shape-action-button"
        aria-label={`Open ${label} effect menu`}
        title="Animated effect options"
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
          <FloatingEnvironmentEffectMenu
            anchor={buttonRef.current}
            label={label}
            onClose={onClose}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />,
          document.body
        )}
    </div>
  );
}

function FloatingEnvironmentEffectMenu({
  anchor,
  label,
  onClose,
  onEdit,
  onDuplicate,
  onDelete
}: {
  anchor: HTMLElement | null;
  label: string;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { menuRef, position } = useFloatingMenuPosition({
    open: Boolean(anchor),
    anchor,
    fallbackWidth: 196,
    fallbackHeight: 168
  });

  return (
    <div
      ref={menuRef}
      className="token-settings-menu token-settings-menu-portal environment-effect-menu-wrap"
      style={{ top: position.top, left: position.left }}
      role="menu"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="canvas-context-menu-title" title={label}>{label}</div>
      <div className="control-divider" />
      <button
        className="token-menu-action"
        role="menuitem"
        title={`Edit ${label}`}
        onClick={() => {
          onEdit();
          onClose();
        }}
      >
        <Settings2 size={14} aria-hidden="true" />
        Edit Animated Effect
      </button>
      <button
        className="token-menu-action"
        role="menuitem"
        title={`Duplicate ${label}`}
        onClick={() => {
          onDuplicate();
          onClose();
        }}
      >
        <Copy size={14} aria-hidden="true" />
        Duplicate
      </button>
      <button
        className="token-menu-action token-menu-delete"
        role="menuitem"
        title={`Delete ${label}`}
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        <Trash2 size={14} aria-hidden="true" />
        Delete Animated Effect
      </button>
    </div>
  );
}
