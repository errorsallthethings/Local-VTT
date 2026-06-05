import { useEffect, useState } from "react";

export function DebouncedNumberInput({
  value,
  min,
  max,
  delayMs = 350,
  onCommit
}: {
  value: number;
  min?: number;
  max?: number;
  delayMs?: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const parsed = Number(draft);
      if (!Number.isFinite(parsed)) {
        return;
      }
      const clamped = Math.min(max ?? parsed, Math.max(min ?? parsed, parsed));
      if (clamped !== value) {
        onCommit(clamped);
      }
    }, delayMs);

    return () => window.clearTimeout(timeout);
  }, [delayMs, draft, max, min, onCommit, value]);

  return (
    <input
      type="number"
      min={min}
      max={max}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const parsed = Number(draft);
        if (!Number.isFinite(parsed)) {
          setDraft(String(value));
          return;
        }
        const clamped = Math.min(max ?? parsed, Math.max(min ?? parsed, parsed));
        setDraft(String(clamped));
        if (clamped !== value) {
          onCommit(clamped);
        }
      }}
    />
  );
}
