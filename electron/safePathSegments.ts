import path from "node:path";

export function assertSafePathSegment(value: string, errorMessage: string): void {
  if (
    value.trim() === "" ||
    value === "." ||
    value === ".." ||
    path.isAbsolute(value) ||
    value.includes("/") ||
    value.includes("\\")
  ) {
    throw new Error(errorMessage);
  }
}
