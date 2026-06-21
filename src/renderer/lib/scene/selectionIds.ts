export function getSelectedItemIds(singleSelectedId: string | null | undefined, multiSelectedIds: readonly string[] = []): Set<string> {
  return new Set(multiSelectedIds.length > 0 ? multiSelectedIds : singleSelectedId ? [singleSelectedId] : []);
}

export function getSelectedItemIdList(singleSelectedId: string | null | undefined, multiSelectedIds: readonly string[] = []): string[] {
  return multiSelectedIds.length > 0 ? [...multiSelectedIds] : singleSelectedId ? [singleSelectedId] : [];
}

export type SelectionMode = "replace" | "add" | "subtract";

export function applySelectionMode(currentIds: readonly string[], nextIds: readonly string[], mode: SelectionMode): string[] {
  if (mode === "add") {
    return [...currentIds, ...nextIds.filter((id) => !currentIds.includes(id))];
  }
  if (mode === "subtract") {
    const removedIds = new Set(nextIds);
    return currentIds.filter((id) => !removedIds.has(id));
  }
  return [...nextIds];
}

export function retainExistingSelectionIds(selectedIds: readonly string[], existingIds: Iterable<string>): string[] {
  const validIds = new Set(existingIds);
  return selectedIds.filter((id) => validIds.has(id));
}
