import { Circle, Minus, Paintbrush, Pentagon, Square, Triangle, Undo2, type LucideIcon } from "lucide-react";
import type { DrawingStrokeStyle, DrawingTemplateEffect } from "../../../../shared/localvtt";
import type { DrawingTool } from "../../../canvas/drawings";
import { DrawingSettings, type DrawingTemplateSize, type DrawingTemplateWidth } from "../settings/DrawingToolSettings";
import { ToolHelpCard, type ToolHelpTopic } from "../settings/ToolHelpCard";
import { HelpButton, SettingsToggle, ToolButton } from "./ToolsMenuPrimitives";

export interface DrawingToolButtonDefinition {
  tool: DrawingTool;
  label: string;
  icon: LucideIcon;
}

export const DRAWING_TOOL_BUTTONS: DrawingToolButtonDefinition[] = [
  { tool: "freehand", label: "Brush", icon: Paintbrush },
  { tool: "line", label: "Line", icon: Minus },
  { tool: "rectangle", label: "Rectangle", icon: Square },
  { tool: "circle", label: "Ellipse", icon: Circle },
  { tool: "triangle", label: "Triangle", icon: Triangle },
  { tool: "polygon", label: "Polygon", icon: Pentagon }
];

export const TEMPLATE_TOOL_BUTTONS: DrawingToolButtonDefinition[] = [
  { tool: "template-line", label: "Line Template", icon: Minus },
  { tool: "template-circle", label: "Radius Template", icon: Circle },
  { tool: "template-rectangle", label: "Cube Template", icon: Square },
  { tool: "template-cone", label: "Cone Template", icon: Triangle }
];

export function getNextToolHelpTopic(currentTopic: ToolHelpTopic | null, requestedTopic: ToolHelpTopic): ToolHelpTopic | null {
  return currentTopic === requestedTopic ? null : requestedTopic;
}

export function getDrawingPanelFillSettingsVisible(activeDrawingTool: DrawingTool | null): boolean {
  return activeDrawingTool !== "freehand" && activeDrawingTool !== "line";
}

export interface DrawingPanelSettingsState {
  activeDrawingTool: DrawingTool | null;
  drawingColor: string;
  drawingOpacity: number;
  drawingFillColor: string;
  drawingFillOpacity: number;
  drawingStrokeStyle: DrawingStrokeStyle;
  drawingStrokeWidth: number;
  drawingTemplateSize: DrawingTemplateSize;
  drawingTemplateEffect: DrawingTemplateEffect;
  drawingTemplateWidth: DrawingTemplateWidth;
  drawingThicknessCustomOpen: boolean;
  drawingOpacityCustomOpen: boolean;
}

export interface DrawingPanelSettingsChangeHandlers {
  onDrawingColorChange: (color: string) => void;
  onDrawingOpacityChange: (opacity: number) => void;
  onDrawingFillColorChange: (color: string) => void;
  onDrawingFillOpacityChange: (opacity: number) => void;
  onDrawingStrokeStyleChange: (strokeStyle: DrawingStrokeStyle) => void;
  onDrawingStrokeWidthChange: (strokeWidth: number) => void;
  onDrawingTemplateSizeChange: (size: DrawingTemplateSize) => void;
  onDrawingTemplateEffectChange: (effect: DrawingTemplateEffect) => void;
  onDrawingTemplateWidthChange: (width: DrawingTemplateWidth) => void;
  onDrawingThicknessCustomOpenChange: (open: boolean) => void;
  onDrawingOpacityCustomOpenChange: (open: boolean) => void;
}

interface DrawingToolsPanelProps {
  settings: DrawingPanelSettingsState;
  onSettingsChange: DrawingPanelSettingsChangeHandlers;
  drawingCount: number;
  drawingSettingsOpen: boolean;
  helpTopic: ToolHelpTopic | null;
  onDrawingToolChange: (tool: DrawingTool) => void;
  onUndoDrawing: () => void;
  onDrawingSettingsOpenChange: (open: boolean) => void;
  onHelpTopicChange: (topic: ToolHelpTopic | null) => void;
}

interface TemplateToolsPanelProps {
  settings: DrawingPanelSettingsState;
  onSettingsChange: DrawingPanelSettingsChangeHandlers;
  drawingCount: number;
  templateSettingsOpen: boolean;
  templatePreviewVisibleInPlayer: boolean;
  helpTopic: ToolHelpTopic | null;
  onDrawingToolChange: (tool: DrawingTool) => void;
  onUndoDrawing: () => void;
  onTemplateSettingsOpenChange: (open: boolean) => void;
  onTemplatePreviewVisibleInPlayerChange: (visible: boolean) => void;
  onHelpTopicChange: (topic: ToolHelpTopic | null) => void;
}

export function DrawingToolsPanel({
  settings,
  onSettingsChange,
  drawingCount,
  drawingSettingsOpen,
  helpTopic,
  onDrawingToolChange,
  onUndoDrawing,
  onDrawingSettingsOpenChange,
  onHelpTopicChange
}: DrawingToolsPanelProps) {
  return (
    <div className="tools-panel-section">
      <HelpButton active={helpTopic === "drawing"} label="Drawing tools help" onClick={() => onHelpTopicChange(getNextToolHelpTopic(helpTopic, "drawing"))} />
      <DrawingToolButtonRow
        buttons={DRAWING_TOOL_BUTTONS}
        activeDrawingTool={settings.activeDrawingTool}
        drawingCount={drawingCount}
        undoLabel="Undo Last Drawing"
        onDrawingToolChange={onDrawingToolChange}
        onUndoDrawing={onUndoDrawing}
      />
      <div className="tools-section-divider" />
      <SettingsToggle open={drawingSettingsOpen} label="Settings" onToggle={() => onDrawingSettingsOpenChange(!drawingSettingsOpen)} />
      {drawingSettingsOpen && (
        <DrawingSettings
          {...settings}
          {...onSettingsChange}
          showFillSettings={getDrawingPanelFillSettingsVisible(settings.activeDrawingTool)}
          templateToolActive={false}
        />
      )}
      {helpTopic === "drawing" && <ToolHelpCard topic="drawing" />}
    </div>
  );
}

export function TemplateToolsPanel({
  settings,
  onSettingsChange,
  drawingCount,
  templateSettingsOpen,
  templatePreviewVisibleInPlayer,
  helpTopic,
  onDrawingToolChange,
  onUndoDrawing,
  onTemplateSettingsOpenChange,
  onTemplatePreviewVisibleInPlayerChange,
  onHelpTopicChange
}: TemplateToolsPanelProps) {
  return (
    <div className="tools-panel-section">
      <HelpButton active={helpTopic === "templates"} label="Template tools help" onClick={() => onHelpTopicChange(getNextToolHelpTopic(helpTopic, "templates"))} />
      <DrawingToolButtonRow
        buttons={TEMPLATE_TOOL_BUTTONS}
        activeDrawingTool={settings.activeDrawingTool}
        drawingCount={drawingCount}
        undoLabel="Undo Last Drawing"
        onDrawingToolChange={onDrawingToolChange}
        onUndoDrawing={onUndoDrawing}
      />
      <div className="tools-section-divider" />
      <SettingsToggle open={templateSettingsOpen} label="Settings" onToggle={() => onTemplateSettingsOpenChange(!templateSettingsOpen)} />
      {templateSettingsOpen && (
        <DrawingSettings
          {...settings}
          {...onSettingsChange}
          templatePreviewVisibleInPlayer={templatePreviewVisibleInPlayer}
          showFillSettings={false}
          templateToolActive
          onTemplatePreviewVisibleInPlayerChange={onTemplatePreviewVisibleInPlayerChange}
        />
      )}
      {helpTopic === "templates" && <ToolHelpCard topic="templates" />}
    </div>
  );
}

function DrawingToolButtonRow({
  buttons,
  activeDrawingTool,
  drawingCount,
  undoLabel,
  onDrawingToolChange,
  onUndoDrawing
}: {
  buttons: DrawingToolButtonDefinition[];
  activeDrawingTool: DrawingTool | null;
  drawingCount: number;
  undoLabel: string;
  onDrawingToolChange: (tool: DrawingTool) => void;
  onUndoDrawing: () => void;
}) {
  return (
    <div className="tools-button-row">
      {buttons.map((button) => {
        const Icon = button.icon;
        return (
          <ToolButton key={button.tool} active={activeDrawingTool === button.tool} label={button.label} onClick={() => onDrawingToolChange(button.tool)}>
            <Icon size={17} aria-hidden="true" />
          </ToolButton>
        );
      })}
      <span className="tools-vertical-divider" aria-hidden="true" />
      <ToolButton label={undoLabel} disabled={drawingCount === 0} onClick={onUndoDrawing}>
        <Undo2 size={17} aria-hidden="true" />
      </ToolButton>
    </div>
  );
}
