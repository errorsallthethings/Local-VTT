import { CloudFog, Dices, Lightbulb, ListOrdered, MousePointer2, Palette, Shapes, Sparkles, Table2, Type, type LucideIcon } from "lucide-react";
import { getToolCategoryButtonClassName } from "./toolMenuState";
import { getToolCategoryLabel, type ToolCategory } from "./toolCategoryLabels";

export type ToolCategoryEntry =
  | { kind: "category"; id: ToolCategory; label: string; icon: LucideIcon; hasPanelTools: boolean }
  | { kind: "divider"; id: string };

export const TOOL_CATEGORY_RAIL_ENTRIES: ToolCategoryEntry[] = [
  { kind: "category", id: "fog", label: getToolCategoryLabel("fog"), icon: CloudFog, hasPanelTools: true },
  { kind: "category", id: "effects", label: getToolCategoryLabel("effects"), icon: Sparkles, hasPanelTools: true },
  { kind: "category", id: "drawing", label: getToolCategoryLabel("drawing"), icon: Palette, hasPanelTools: true },
  { kind: "category", id: "text", label: getToolCategoryLabel("text"), icon: Type, hasPanelTools: false },
  { kind: "category", id: "templates", label: getToolCategoryLabel("templates"), icon: Shapes, hasPanelTools: true },
  { kind: "category", id: "lighting", label: getToolCategoryLabel("lighting"), icon: Lightbulb, hasPanelTools: false },
  { kind: "divider", id: "tools-primary-secondary-divider" },
  { kind: "category", id: "dice", label: getToolCategoryLabel("dice"), icon: Dices, hasPanelTools: false },
  { kind: "category", id: "turn-order", label: getToolCategoryLabel("turn-order"), icon: ListOrdered, hasPanelTools: false },
  { kind: "category", id: "table", label: getToolCategoryLabel("table"), icon: Table2, hasPanelTools: true }
];

interface ToolsMenuCategoryRailProps {
  activeCategory: ToolCategory | null;
  toolsExpanded: boolean;
  isCategoryActive: (category: ToolCategory) => boolean;
  onCategoryOpen: (category: ToolCategory) => void;
  onMouseCategoryToggle: () => void;
  onToolsExpandedChange: (expanded: boolean) => void;
}

export function ToolsMenuCategoryRail({
  activeCategory,
  toolsExpanded,
  isCategoryActive,
  onCategoryOpen,
  onMouseCategoryToggle,
  onToolsExpandedChange
}: ToolsMenuCategoryRailProps) {
  return (
    <div className="tools-menu-stack" aria-label="Tool Categories">
      <button
        className={getToolCategoryButtonClassName(activeCategory === "mouse")}
        aria-label="Mouse Behavior"
        title="Mouse Behavior"
        type="button"
        onClick={onMouseCategoryToggle}
      >
        <MousePointer2 size={18} aria-hidden="true" />
        <span className="tools-category-more" aria-hidden="true" />
      </button>
      <button
        className="tools-menu-title-button"
        type="button"
        aria-expanded={toolsExpanded}
        title={toolsExpanded ? "Collapse tools" : "Expand tools"}
        onClick={() => onToolsExpandedChange(!toolsExpanded)}
      >
        Tools
      </button>
      {toolsExpanded &&
        TOOL_CATEGORY_RAIL_ENTRIES.map((category) => {
          if (category.kind === "divider") {
            return <span key={category.id} className="tools-menu-divider" aria-hidden="true" />;
          }
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              className={getToolCategoryButtonClassName(isCategoryActive(category.id))}
              aria-label={category.label}
              title={category.label}
              type="button"
              onClick={() => onCategoryOpen(category.id)}
            >
              <Icon size={18} aria-hidden="true" />
              {category.hasPanelTools && <span className="tools-category-more" aria-hidden="true" />}
            </button>
          );
        })}
    </div>
  );
}
