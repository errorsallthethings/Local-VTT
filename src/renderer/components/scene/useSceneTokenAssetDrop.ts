import { useCallback, type DragEvent } from "react";
import type { Asset, Campaign, Point, Scene } from "../../../shared/localvtt";
import { clientToWorldPoint, getRenderCamera, type Camera } from "../../canvas/core";
import { canAcceptTokenAssetDrop, getDroppedTokenAsset } from "./sceneTokenAssetDrop";

interface SceneTokenAssetDropOptions {
  campaign: Campaign | null;
  camera: Camera;
  mode: "gm" | "player";
  onDropTokenAsset?: (asset: Asset, point: Point) => void;
  playerDisplayScale: number;
  scene: Scene | null;
}

export function useSceneTokenAssetDrop({
  campaign,
  camera,
  mode,
  onDropTokenAsset,
  playerDisplayScale,
  scene
}: SceneTokenAssetDropOptions) {
  const canAcceptDrop = useCallback((event: DragEvent<HTMLCanvasElement>): boolean => {
    return canAcceptTokenAssetDrop({
      dataTransferTypes: event.dataTransfer.types,
      hasCampaign: Boolean(campaign),
      hasDropHandler: Boolean(onDropTokenAsset),
      hasScene: Boolean(scene),
      mode
    });
  }, [campaign, mode, onDropTokenAsset, scene]);

  const onDragOver = useCallback((event: DragEvent<HTMLCanvasElement>) => {
    if (!canAcceptDrop(event)) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, [canAcceptDrop]);

  const onDrop = useCallback((event: DragEvent<HTMLCanvasElement>) => {
    if (!canAcceptDrop(event)) {
      return;
    }
    event.preventDefault();
    const asset = getDroppedTokenAsset(campaign, event.dataTransfer);
    if (!asset) {
      return;
    }
    onDropTokenAsset?.(
      asset,
      clientToWorldPoint(event.currentTarget, event.clientX, event.clientY, getRenderCamera(camera, playerDisplayScale))
    );
  }, [camera, campaign, canAcceptDrop, onDropTokenAsset, playerDisplayScale]);

  return {
    onDragOver,
    onDrop
  };
}
