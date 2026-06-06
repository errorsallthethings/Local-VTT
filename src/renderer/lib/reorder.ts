export type DropPlacement = "before" | "after";

export function reorderByDropTarget<T>(
  items: readonly T[],
  getId: (item: T) => string,
  sourceId: string,
  targetId: string,
  placement: DropPlacement
): T[] {
  if (sourceId === targetId) {
    return [...items];
  }

  const sourceItem = items.find((item) => getId(item) === sourceId);
  if (!sourceItem) {
    return [...items];
  }

  const nextItems = items.filter((item) => getId(item) !== sourceId);
  const targetIndex = nextItems.findIndex((item) => getId(item) === targetId);
  if (targetIndex < 0) {
    return [...items];
  }

  nextItems.splice(placement === "after" ? targetIndex + 1 : targetIndex, 0, sourceItem);
  return nextItems;
}
