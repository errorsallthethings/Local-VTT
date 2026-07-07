export type RendererDiagnosticDetail =
  | string
  | number
  | boolean
  | null
  | {
      name: string;
      message: string;
      stack?: string;
    };

export function logRendererError(label: string, ...details: unknown[]): void {
  console.error(label, ...details.map(formatRendererDiagnosticDetail));
}

export function logRendererWarning(label: string, ...details: unknown[]): void {
  console.warn(label, ...details.map(formatRendererDiagnosticDetail));
}

export function formatRendererDiagnosticDetail(detail: unknown): RendererDiagnosticDetail {
  if (detail instanceof Error) {
    return {
      name: detail.name,
      message: detail.message,
      ...(detail.stack ? { stack: detail.stack } : {})
    };
  }

  if (detail === null || typeof detail === "string" || typeof detail === "number" || typeof detail === "boolean") {
    return detail;
  }

  if (detail === undefined) {
    return "undefined";
  }

  if (typeof detail === "bigint" || typeof detail === "symbol" || typeof detail === "function") {
    return String(detail);
  }

  return stringifyDiagnosticObject(detail);
}

function stringifyDiagnosticObject(detail: object): string {
  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(detail, (_key, value: unknown) => {
      if (typeof value === "bigint" || typeof value === "symbol" || typeof value === "function") {
        return String(value);
      }

      if (value && typeof value === "object") {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }

      return value;
    });
  } catch {
    return Object.prototype.toString.call(detail);
  }
}
