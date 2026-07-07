import type { Scene } from "../../shared/localvtt";
import { addSceneTokenToTurnOrder } from "../lib/turn-order";

interface UseSceneTokenTurnOrderActionsOptions {
  activeScene: Scene | null;
  updateScene: (nextScene: Scene) => void;
  selectTokens: (tokenIds: string[]) => void;
  createId?: () => string;
  getNow?: () => string;
}

export function useSceneTokenTurnOrderActions({
  activeScene,
  updateScene,
  selectTokens,
  createId = () => crypto.randomUUID(),
  getNow = () => new Date().toISOString()
}: UseSceneTokenTurnOrderActionsOptions) {
  return {
    addSceneTokenToTurnOrder: (tokenId: string) => {
      if (!activeScene) {
        return;
      }
      const result = addSceneTokenToTurnOrder(activeScene, tokenId, createId(), getNow());
      if (result.scene) {
        updateScene(result.scene);
      }
      selectTokens([result.selectedTokenId]);
    }
  };
}
