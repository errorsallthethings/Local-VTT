import path from "node:path";

export function isInsidePath(rootPath: string, candidatePath: string): boolean {
  const relative = path.relative(path.resolve(rootPath), path.resolve(candidatePath));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function assertInsidePath(rootPath: string, candidatePath: string, errorMessage = "Path is outside the selected campaign folder."): void {
  if (!isInsidePath(rootPath, candidatePath)) {
    throw new Error(errorMessage);
  }
}
