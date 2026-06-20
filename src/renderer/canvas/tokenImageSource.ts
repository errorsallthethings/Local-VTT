export type TokenImageSource = {
  id: string;
  path: string;
};

export function parseTokenImageSourceKey(key: string): TokenImageSource[] {
  try {
    const parsed = JSON.parse(key);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (source): source is TokenImageSource =>
        typeof source?.id === "string" && source.id.length > 0 && typeof source?.path === "string" && source.path.length > 0
    );
  } catch {
    return [];
  }
}
