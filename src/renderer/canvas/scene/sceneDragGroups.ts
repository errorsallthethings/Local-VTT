export type SceneItemDragGroup = {
  itemIds: string[];
  draggingSelectedGroup: boolean;
  shouldSelectHitItem: boolean;
};

export function getSceneItemDragGroup(hitItemId: string, selectedItemIds: readonly string[], mouseBehavior: string): SceneItemDragGroup {
  const draggingSelectedGroup = mouseBehavior === "grabber" && selectedItemIds.length > 1 && selectedItemIds.includes(hitItemId);
  return {
    itemIds: draggingSelectedGroup ? [...selectedItemIds] : [hitItemId],
    draggingSelectedGroup,
    shouldSelectHitItem: !draggingSelectedGroup
  };
}
