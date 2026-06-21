import { getDrawingHelpLines, getFogHelpLines, getTableHelpLines, getTemplateHelpLines, getWeatherHelpLines } from "../../../lib/tools";

export type ToolHelpTopic = "drawing" | "templates" | "fog" | "effects" | "table";

export function ToolHelpCard({ topic }: { topic: ToolHelpTopic }) {
  if (topic === "drawing") {
    return (
      <div className="tools-help-card" role="dialog" aria-label="Drawing tools help">
        <strong>Drawing Tools</strong>
        <ul>
          {getDrawingHelpLines().map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>
    );
  }

  if (topic === "templates") {
    return (
      <div className="tools-help-card" role="dialog" aria-label="Template tools help">
        <strong>Template Tools</strong>
        <ul>
          {getTemplateHelpLines().map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>
    );
  }

  if (topic === "fog") {
    return (
      <div className="tools-help-card" role="dialog" aria-label="Fog of War tools help">
        <strong>Fog Of War Tools</strong>
        <ul>
          {getFogHelpLines().map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>
    );
  }

  if (topic === "effects") {
    return (
      <div className="tools-help-card" role="dialog" aria-label="Effects tools help">
        <strong>Effects Tools</strong>
        <ul>
          {getWeatherHelpLines().map((line) => <li key={line}>{line}</li>)}
        </ul>
      </div>
    );
  }

  return (
    <div className="tools-help-card" role="dialog" aria-label="Table tools help">
      <strong>Table Tools</strong>
      <ul>
        {getTableHelpLines().map((line) => <li key={line}>{line}</li>)}
      </ul>
    </div>
  );
}
