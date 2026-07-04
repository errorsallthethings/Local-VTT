import type { DropPlacement } from "../../../lib/ui";
import { reorderByDropTarget } from "../../../lib/ui";

export type LayerItemVisibilityView = "GM" | "Player";
export type LayerItemRowVariant = "weather-mask" | "token";

export interface LayerItemRowPresentationOptions {
  visible: boolean;
  selected: boolean;
  dragging?: boolean;
  dropPlacement?: DropPlacement | null;
  variant?: LayerItemRowVariant;
  menuOpen?: boolean;
}

export function getLayerItemRowClassName({
  visible,
  selected,
  dragging = false,
  dropPlacement = null,
  variant,
  menuOpen = false
}: LayerItemRowPresentationOptions): string {
  return [
    "fog-shape-row",
    variant === "weather-mask" ? "weather-mask-row" : "",
    variant === "token" ? "token-shape-row" : "",
    visible ? "" : "fog-shape-row-muted",
    selected ? "fog-shape-row-selected" : "",
    menuOpen ? "token-shape-row-menu-open" : "",
    dragging ? "fog-shape-row-dragging" : "",
    dropPlacement ? `fog-shape-row-drop-${dropPlacement}` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

export function getLayerItemActionButtonClassName(active: boolean, danger = false): string {
  return ["icon-button", "fog-shape-action-button", active ? "fog-shape-action-active" : "", danger ? "danger" : ""]
    .filter(Boolean)
    .join(" ");
}

export function getLayerItemVisibilityLabel(label: string, view: LayerItemVisibilityView, visible: boolean): string {
  return visible ? `Hide ${label} in ${view} View` : `Show ${label} in ${view} View`;
}

export function getLayerItemVisibilityTitle(view: LayerItemVisibilityView, visible: boolean): string {
  return visible ? `Hide in ${view} View` : `Show in ${view} View`;
}

export function getLayerItemToggleLabel(label: string, enabled: boolean): string {
  return enabled ? `Disable ${label}` : `Enable ${label}`;
}

export function getLayerItemToggleTitle(noun: string, enabled: boolean): string {
  return enabled ? `Disable ${noun}` : `Enable ${noun}`;
}

export function getLayerItemHighlightLabel(label: string, selected: boolean): string {
  return selected ? `Hide ${label} highlight` : `Highlight ${label}`;
}

export function getLayerItemHighlightTitle(noun: string, selected: boolean): string {
  return selected ? `Hide ${noun} highlight` : `Highlight ${noun}`;
}

export function patchLayerItemById<T extends { id: string }>(items: readonly T[], itemId: string, patch: Partial<T>): T[] {
  return items.map((item) => (item.id === itemId ? { ...item, ...patch } : item));
}

export function removeLayerItemById<T extends { id: string }>(items: readonly T[], itemId: string): T[] {
  return items.filter((item) => item.id !== itemId);
}

export function getReorderedLayerItems<T extends { id: string }>(
  items: readonly T[],
  sourceItemId: string,
  targetItemId: string,
  placement: DropPlacement
): T[] {
  if (sourceItemId === targetItemId) {
    return [...items];
  }
  return reorderByDropTarget(items, (item) => item.id, sourceItemId, targetItemId, placement);
}

export function getReorderedTokenLayerItems<T extends { id: string; order?: number }>(
  tokens: readonly T[],
  sourceTokenId: string,
  targetTokenId: string,
  placement: DropPlacement
): T[] {
  return getReorderedLayerItems(tokens, sourceTokenId, targetTokenId, placement).map((token, index) => ({ ...token, order: index }));
}
