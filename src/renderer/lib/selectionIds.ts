export function getSelectedItemIds(singleSelectedId: string | null | undefined, multiSelectedIds: readonly string[] = []): Set<string> {
  return new Set(multiSelectedIds.length > 0 ? multiSelectedIds : singleSelectedId ? [singleSelectedId] : []);
}
