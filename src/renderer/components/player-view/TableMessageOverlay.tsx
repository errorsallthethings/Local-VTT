import type { LiveTableEvent } from "../../../shared/localvtt";

type TableMessageEvent = Extract<LiveTableEvent, { type: "message" }>;

export function TableMessageOverlay({ events, mode }: { events: TableMessageEvent[]; mode: "gm" | "player" }) {
  if (events.length === 0) {
    return null;
  }
  const event = events[0];
  if (event.layout === "table-edges") {
    const edges = ["bottom", "top", "left", "right"];
    return (
      <div className={`table-message-table-overlay table-message-table-overlay-${mode}`} aria-live="polite">
        {edges.map((edge) => (
          <div key={edge} className={`table-message-table-slot table-message-table-slot-${edge}`}>
            <div className={`table-message-card table-message-card-${event.style}`}>
              <span>{event.text}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`table-message-overlay table-message-overlay-${event.placement} table-message-overlay-${mode}`} aria-live="polite">
      <div className={`table-message-card table-message-card-${event.style}`}>
        <span>{event.text}</span>
      </div>
    </div>
  );
}
