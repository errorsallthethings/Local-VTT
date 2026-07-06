import { useState } from "react";
import type { Scene } from "../../../../shared/localvtt";
import { useDismissableMenu } from "../../../hooks/useDismissableMenu";
import { EnvironmentEffectListRow } from "./EnvironmentEffectListRow";

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
        scene.environment.effects.map((effect) => (
          <EnvironmentEffectListRow
            key={effect.id}
            effect={effect}
            isMenuOpen={openEffectMenuId === effect.id}
            isSelected={selectedEnvironmentEffectId === effect.id}
            scene={scene}
            selectedEnvironmentEffectId={selectedEnvironmentEffectId}
            onCloseMenu={() => setOpenEffectMenuId(null)}
            onEditEnvironmentEffect={onEditEnvironmentEffect}
            onRenameEnvironmentEffect={onRenameEnvironmentEffect}
            onSelectEnvironmentEffect={onSelectEnvironmentEffect}
            onToggleMenu={() => setOpenEffectMenuId((openId) => (openId === effect.id ? null : effect.id))}
            onUpdateEnvironment={onUpdateEnvironment}
          />
        ))
      ) : (
        <div className="layer-empty-state">
          <strong>No Animated Effects</strong>
          <span>Draw scene-specific water, fire, fog, darkness, and other animated areas from Effects Tools.</span>
        </div>
      )}
    </div>
  );
}
