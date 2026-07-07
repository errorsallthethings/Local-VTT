import { Circle, LineSquiggle, Paintbrush, Pentagon, Ruler, Square, Target, Trash2, Undo2, type LucideIcon } from "lucide-react";
import { FogBrushSettings } from "../settings/FogBrushSettings";
import { TableToolSettings } from "../settings/TableToolSettings";
import { ToolHelpCard, type ToolHelpTopic } from "../settings/ToolHelpCard";
import { HelpButton, SettingsToggle, ToolButton } from "./ToolsMenuPrimitives";
import type { CanvasTool, FogOperation, FogToolShape } from "./toolMenuState";

export interface TableToolButtonDefinition {
  tool: CanvasTool;
  label: string;
  icon: LucideIcon;
}

export interface FogToolButtonDefinition {
  shape: FogToolShape;
  label: string;
  icon: LucideIcon;
}

export const TABLE_TOOL_BUTTONS: TableToolButtonDefinition[] = [
  { tool: "ruler", label: "Ruler", icon: Ruler },
  { tool: "ping", label: "Sonar", icon: Target },
  { tool: "laser", label: "Laser Pointer", icon: LineSquiggle }
];

export const FOG_TOOL_BUTTONS: FogToolButtonDefinition[] = [
  { shape: "brush", label: "Brush Mask", icon: Paintbrush },
  { shape: "rectangle", label: "Rectangle Mask", icon: Square },
  { shape: "circle", label: "Circle Mask", icon: Circle },
  { shape: "polygon", label: "Polygon Mask", icon: Pentagon }
];

export function getNextUtilityHelpTopic(currentTopic: ToolHelpTopic | null, requestedTopic: ToolHelpTopic): ToolHelpTopic | null {
  return currentTopic === requestedTopic ? null : requestedTopic;
}

export function getHiddenFromPlayerToggleValue(visibleInPlayer: boolean): boolean {
  return !visibleInPlayer;
}

export interface TableToolsPanelState {
  activeCanvasTool: CanvasTool | null;
  tableSettingsOpen: boolean;
  tableToolsVisibleInPlayer: boolean;
  rulerLinger: boolean;
  pingSize: number;
  pingColor: string;
  laserThickness: number;
  laserColor: string;
  pingSizeCustomOpen: boolean;
  laserThicknessCustomOpen: boolean;
  helpTopic: ToolHelpTopic | null;
}

export interface TableToolsPanelActions {
  onTableToolChange: (tool: CanvasTool) => void;
  onTableSettingsOpenChange: (open: boolean) => void;
  onTableToolsVisibleInPlayerChange: (visible: boolean) => void;
  onRulerLingerChange: (linger: boolean) => void;
  onPingSizeChange: (pingSize: number) => void;
  onPingColorChange: (color: string) => void;
  onLaserThicknessChange: (thickness: number) => void;
  onLaserColorChange: (color: string) => void;
  onPingSizeCustomOpenChange: (open: boolean) => void;
  onLaserThicknessCustomOpenChange: (open: boolean) => void;
  onHelpTopicChange: (topic: ToolHelpTopic | null) => void;
}

interface TableToolsPanelProps {
  state: TableToolsPanelState;
  actions: TableToolsPanelActions;
}

export interface FogToolsPanelState {
  activeFogShape: FogToolShape | null;
  fogOperation: FogOperation;
  fogShapeCount: number;
  maskSettingsOpen: boolean;
  brushSize: number;
  fogBrushCustomOpen: boolean;
  helpTopic: ToolHelpTopic | null;
}

export interface FogToolsPanelActions {
  onFogToolShapeChange: (shape: FogToolShape) => void;
  onFogToolOperationChange: (operation: FogOperation) => void;
  onUndoFogShape: () => void;
  onRequestClearFog: () => void;
  onMaskSettingsOpenChange: (open: boolean) => void;
  onBrushSizeChange: (brushSize: number) => void;
  onFogBrushCustomOpenChange: (open: boolean) => void;
  onHelpTopicChange: (topic: ToolHelpTopic | null) => void;
}

interface FogToolsPanelProps {
  state: FogToolsPanelState;
  actions: FogToolsPanelActions;
}

export function TableToolsPanel({ state, actions }: TableToolsPanelProps) {
  const {
    activeCanvasTool,
    tableSettingsOpen,
    tableToolsVisibleInPlayer,
    rulerLinger,
    pingSize,
    pingColor,
    laserThickness,
    laserColor,
    pingSizeCustomOpen,
    laserThicknessCustomOpen,
    helpTopic
  } = state;
  const {
    onTableToolChange,
    onTableSettingsOpenChange,
    onTableToolsVisibleInPlayerChange,
    onRulerLingerChange,
    onPingSizeChange,
    onPingColorChange,
    onLaserThicknessChange,
    onLaserColorChange,
    onPingSizeCustomOpenChange,
    onLaserThicknessCustomOpenChange,
    onHelpTopicChange
  } = actions;

  return (
    <div className="tools-panel-section">
      <HelpButton active={helpTopic === "table"} label="Table tools help" onClick={() => onHelpTopicChange(getNextUtilityHelpTopic(helpTopic, "table"))} />
      <div className="tools-button-row">
        {TABLE_TOOL_BUTTONS.map((button) => {
          const Icon = button.icon;
          return (
            <ToolButton key={button.tool} active={activeCanvasTool === button.tool} label={button.label} onClick={() => onTableToolChange(button.tool)}>
              <Icon size={17} aria-hidden="true" />
            </ToolButton>
          );
        })}
      </div>
      <div className="tools-section-divider" />
      <SettingsToggle open={tableSettingsOpen} label="Settings" onToggle={() => onTableSettingsOpenChange(!tableSettingsOpen)} />
      {tableSettingsOpen && (
        <>
          <div className="tools-section-label">Visibility</div>
          <div className="tools-operation-stack">
            <label className="fog-operation-switch tools-operation-switch" title="Show or hide table tool output">
              <span>Show</span>
              <input
                type="checkbox"
                checked={getHiddenFromPlayerToggleValue(tableToolsVisibleInPlayer)}
                onChange={(event) => onTableToolsVisibleInPlayerChange(!event.target.checked)}
              />
              <span>Hide</span>
            </label>
          </div>
          {activeCanvasTool === "ruler" && (
            <>
              <div className="tools-section-label">Ruler Release</div>
              <div className="tools-operation-stack">
                <label className="fog-operation-switch tools-operation-switch" title="Keep or clear the ruler after releasing the mouse">
                  <span>Linger</span>
                  <input type="checkbox" checked={!rulerLinger} onChange={(event) => onRulerLingerChange(!event.target.checked)} />
                  <span>No Linger</span>
                </label>
              </div>
            </>
          )}
        </>
      )}
      {tableSettingsOpen && (
        <TableToolSettings
          activeCanvasTool={activeCanvasTool}
          pingSize={pingSize}
          pingColor={pingColor}
          laserThickness={laserThickness}
          laserColor={laserColor}
          pingSizeCustomOpen={pingSizeCustomOpen}
          laserThicknessCustomOpen={laserThicknessCustomOpen}
          onPingSizeChange={onPingSizeChange}
          onPingColorChange={onPingColorChange}
          onLaserThicknessChange={onLaserThicknessChange}
          onLaserColorChange={onLaserColorChange}
          onPingSizeCustomOpenChange={onPingSizeCustomOpenChange}
          onLaserThicknessCustomOpenChange={onLaserThicknessCustomOpenChange}
        />
      )}
      {helpTopic === "table" && <ToolHelpCard topic="table" />}
    </div>
  );
}

export function FogToolsPanel({ state, actions }: FogToolsPanelProps) {
  const {
    activeFogShape,
    fogOperation,
    fogShapeCount,
    maskSettingsOpen,
    brushSize,
    fogBrushCustomOpen,
    helpTopic
  } = state;
  const {
    onFogToolShapeChange,
    onFogToolOperationChange,
    onUndoFogShape,
    onRequestClearFog,
    onMaskSettingsOpenChange,
    onBrushSizeChange,
    onFogBrushCustomOpenChange,
    onHelpTopicChange
  } = actions;

  return (
    <div className="tools-panel-section">
      <HelpButton active={helpTopic === "fog"} label="Fog Of War Tools Help" onClick={() => onHelpTopicChange(getNextUtilityHelpTopic(helpTopic, "fog"))} />
      <div className="tools-section-label">Fog Of War Masks</div>
      <div className="tools-button-row">
        {FOG_TOOL_BUTTONS.map((button) => {
          const Icon = button.icon;
          return (
            <ToolButton key={button.shape} active={activeFogShape === button.shape} label={button.label} onClick={() => onFogToolShapeChange(button.shape)}>
              <Icon size={17} aria-hidden="true" />
            </ToolButton>
          );
        })}
        <span className="tools-vertical-divider" aria-hidden="true" />
        <ToolButton label="Undo Last Fog Mask" disabled={fogShapeCount === 0} onClick={onUndoFogShape}>
          <Undo2 size={17} aria-hidden="true" />
        </ToolButton>
        <ToolButton variant="danger" label="Clear Fog Masks" disabled={fogShapeCount === 0} onClick={onRequestClearFog}>
          <Trash2 size={17} aria-hidden="true" />
        </ToolButton>
      </div>
      <div className="tools-operation-stack">
        <SettingsToggle open={maskSettingsOpen} label="Settings" onToggle={() => onMaskSettingsOpenChange(!maskSettingsOpen)} />
        {maskSettingsOpen && (
          <>
            <div className="tools-section-label">Visibility</div>
            <label className="fog-operation-switch tools-operation-switch" title="Reveal or hide fog">
              <span>Reveal</span>
              <input type="checkbox" checked={fogOperation === "hide"} onChange={(event) => onFogToolOperationChange(event.target.checked ? "hide" : "reveal")} />
              <span>Hide</span>
            </label>
          </>
        )}
      </div>
      {maskSettingsOpen && activeFogShape === "brush" && (
        <FogBrushSettings
          brushSize={brushSize}
          customOpen={fogBrushCustomOpen}
          onBrushSizeChange={onBrushSizeChange}
          onCustomOpenChange={onFogBrushCustomOpenChange}
        />
      )}
      {helpTopic === "fog" && <ToolHelpCard topic="fog" />}
    </div>
  );
}
