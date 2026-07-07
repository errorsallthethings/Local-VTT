export interface LocalStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function readLocalStorageItem(storage: Pick<LocalStorageLike, "getItem">, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocalStorageItem(storage: Pick<LocalStorageLike, "setItem">, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function parseLocalStorageJson<T>(rawValue: string | null, fallback: T): unknown | T {
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as unknown;
  } catch {
    return fallback;
  }
}

export function loadLocalStorageJson<T>(
  storage: Pick<LocalStorageLike, "getItem">,
  key: string,
  fallback: T
): unknown | T {
  return parseLocalStorageJson(readLocalStorageItem(storage, key), fallback);
}

export function saveLocalStorageJson(
  storage: Pick<LocalStorageLike, "setItem">,
  key: string,
  value: unknown
): boolean {
  try {
    return writeLocalStorageItem(storage, key, JSON.stringify(value));
  } catch {
    return false;
  }
}
