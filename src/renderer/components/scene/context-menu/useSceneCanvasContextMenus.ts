import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type {
  DrawingContextMenu,
  EnvironmentEffectContextMenu,
  MaskContextMenu,
  TokenContextMenu
} from "../../../canvas/scene";
import { useDismissableMenu } from "../../../hooks/useDismissableMenu";
import type { SceneContextMenuOpening } from "./sceneContextMenuOpening";

export interface SceneCanvasContextMenuState {
  drawingContextMenu: DrawingContextMenu | null;
  environmentEffectContextMenu: EnvironmentEffectContextMenu | null;
  maskContextMenu: MaskContextMenu | null;
  tokenContextMenu: TokenContextMenu | null;
}

export interface SceneCanvasContextMenuSelectionHandlers {
  onSelectDrawing?: (drawingId: string | null) => void;
  onSelectEnvironmentEffect?: (effectId: string | null) => void;
  onSelectFogShape?: (shapeId: string | null) => void;
  onSelectToken?: (tokenId: string | null) => void;
  onSelectWeatherMask?: (maskId: string | null) => void;
}

export interface SceneCanvasContextMenuProps extends SceneCanvasContextMenuState {
  setDrawingContextMenu: Dispatch<SetStateAction<DrawingContextMenu | null>>;
  setEnvironmentEffectContextMenu: Dispatch<SetStateAction<EnvironmentEffectContextMenu | null>>;
  setMaskContextMenu: Dispatch<SetStateAction<MaskContextMenu | null>>;
  setTokenContextMenu: Dispatch<SetStateAction<TokenContextMenu | null>>;
}

export const EMPTY_SCENE_CANVAS_CONTEXT_MENU_STATE: SceneCanvasContextMenuState = {
  drawingContextMenu: null,
  environmentEffectContextMenu: null,
  maskContextMenu: null,
  tokenContextMenu: null
};

export function hasSceneCanvasContextMenu(state: SceneCanvasContextMenuState): boolean {
  return Boolean(state.tokenContextMenu || state.maskContextMenu || state.drawingContextMenu || state.environmentEffectContextMenu);
}

export function getSceneCanvasContextMenuStateForOpening(opening: SceneContextMenuOpening): SceneCanvasContextMenuState {
  return {
    drawingContextMenu: opening.drawingContextMenu,
    environmentEffectContextMenu: opening.environmentEffectContextMenu,
    maskContextMenu: opening.maskContextMenu,
    tokenContextMenu: opening.tokenContextMenu
  };
}

export function applySceneCanvasContextMenuSelection(
  opening: SceneContextMenuOpening,
  handlers: SceneCanvasContextMenuSelectionHandlers
): void {
  const { selection } = opening;
  if ("tokenId" in selection) {
    handlers.onSelectToken?.(selection.tokenId ?? null);
  }
  if ("drawingId" in selection) {
    handlers.onSelectDrawing?.(selection.drawingId ?? null);
  }
  if ("fogShapeId" in selection) {
    handlers.onSelectFogShape?.(selection.fogShapeId ?? null);
  }
  if ("weatherMaskId" in selection) {
    handlers.onSelectWeatherMask?.(selection.weatherMaskId ?? null);
  }
  if ("environmentEffectId" in selection) {
    handlers.onSelectEnvironmentEffect?.(selection.environmentEffectId ?? null);
  }
}

export function useSceneCanvasContextMenus(handlers: SceneCanvasContextMenuSelectionHandlers) {
  const [tokenContextMenu, setTokenContextMenu] = useState<TokenContextMenu | null>(null);
  const [maskContextMenu, setMaskContextMenu] = useState<MaskContextMenu | null>(null);
  const [drawingContextMenu, setDrawingContextMenu] = useState<DrawingContextMenu | null>(null);
  const [environmentEffectContextMenu, setEnvironmentEffectContextMenu] = useState<EnvironmentEffectContextMenu | null>(null);

  const state = useMemo<SceneCanvasContextMenuState>(() => ({
    drawingContextMenu,
    environmentEffectContextMenu,
    maskContextMenu,
    tokenContextMenu
  }), [drawingContextMenu, environmentEffectContextMenu, maskContextMenu, tokenContextMenu]);

  const dismissCanvasContextMenus = useCallback(() => {
    setTokenContextMenu(null);
    setMaskContextMenu(null);
    setDrawingContextMenu(null);
    setEnvironmentEffectContextMenu(null);
  }, []);

  useDismissableMenu({
    enabled: hasSceneCanvasContextMenu(state),
    menuRootClass: "canvas-context-menu",
    onDismiss: dismissCanvasContextMenus
  });

  const applySceneContextMenuOpening = useCallback((opening: SceneContextMenuOpening) => {
    applySceneCanvasContextMenuSelection(opening, handlers);
    const nextState = getSceneCanvasContextMenuStateForOpening(opening);
    setTokenContextMenu(nextState.tokenContextMenu);
    setMaskContextMenu(nextState.maskContextMenu);
    setDrawingContextMenu(nextState.drawingContextMenu);
    setEnvironmentEffectContextMenu(nextState.environmentEffectContextMenu);
  }, [handlers]);

  return {
    applySceneContextMenuOpening,
    contextMenuProps: {
      drawingContextMenu,
      environmentEffectContextMenu,
      maskContextMenu,
      setDrawingContextMenu,
      setEnvironmentEffectContextMenu,
      setMaskContextMenu,
      setTokenContextMenu,
      tokenContextMenu
    } satisfies SceneCanvasContextMenuProps,
    dismissCanvasContextMenus,
    hasOpenContextMenu: hasSceneCanvasContextMenu(state)
  };
}
