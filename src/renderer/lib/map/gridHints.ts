export interface MapGridDimensionHint {
  columns: number;
  rows: number;
  source: string;
}

const GRID_DIMENSION_PATTERNS = [
  /(?:^|[\s._()[\]-])(?<columns>\d{1,3})\s*[xX]\s*(?<rows>\d{1,3})(?:$|[\s._()[\]-])/,
  /(?:^|[\s._()[\]-])(?<columns>\d{1,3})\s*(?:by|cols?|columns?)\s*(?<rows>\d{1,3})(?:\s*(?:rows?)?)?(?:$|[\s._()[\]-])/i
];

const COMMON_RESOLUTIONS = new Set(["640x480", "800x600", "1024x768", "1280x720", "1600x900", "1920x1080", "2560x1440", "3840x2160"]);

export function getMapGridDimensionHint(fileName: string | undefined | null): MapGridDimensionHint | null {
  if (!fileName) {
    return null;
  }

  const normalized = fileName.trim();
  for (const pattern of GRID_DIMENSION_PATTERNS) {
    const match = pattern.exec(normalized);
    const columns = Number(match?.groups?.columns);
    const rows = Number(match?.groups?.rows);
    if (isPlausibleGridDimension(columns, rows)) {
      return { columns, rows, source: match?.[0]?.trim() ?? `${columns}x${rows}` };
    }
  }

  return null;
}

function isPlausibleGridDimension(columns: number, rows: number): boolean {
  if (!Number.isInteger(columns) || !Number.isInteger(rows)) {
    return false;
  }
  if (columns < 2 || rows < 2 || columns > 300 || rows > 300) {
    return false;
  }
  return !COMMON_RESOLUTIONS.has(`${columns}x${rows}`);
}
