export interface VirtualGridWindowInput {
  gap: number;
  gridOffsetTop: number;
  gridWidth: number;
  itemCount: number;
  minColumnWidth: number;
  overscanRows?: number;
  rowHeight: number;
  scrollTop: number;
  viewportHeight: number;
}

export interface VirtualGridWindow {
  bottomPadding: number;
  columnCount: number;
  endIndex: number;
  endRow: number;
  rowCount: number;
  startIndex: number;
  startRow: number;
  topPadding: number;
}

export function calculateVirtualGridWindow({
  gap,
  gridOffsetTop,
  gridWidth,
  itemCount,
  minColumnWidth,
  overscanRows = 2,
  rowHeight,
  scrollTop,
  viewportHeight
}: VirtualGridWindowInput): VirtualGridWindow {
  if (itemCount <= 0 || gridWidth <= 0 || rowHeight <= 0 || minColumnWidth <= 0) {
    return emptyVirtualGridWindow();
  }

  const columnCount = Math.max(1, Math.floor((gridWidth + gap) / (minColumnWidth + gap)));
  const rowCount = Math.ceil(itemCount / columnCount);
  const rowStride = rowHeight + gap;
  const visibleTop = Math.max(0, scrollTop - gridOffsetTop);
  const visibleBottom = Math.max(visibleTop, visibleTop + Math.max(0, viewportHeight));
  const startRow = Math.min(Math.max(0, rowCount - 1), Math.max(0, Math.floor(visibleTop / rowStride) - overscanRows));
  const endRow = Math.min(rowCount, Math.max(startRow + 1, Math.ceil(visibleBottom / rowStride) + overscanRows));

  return {
    bottomPadding: Math.max(0, (rowCount - endRow) * rowStride),
    columnCount,
    endIndex: Math.min(itemCount, endRow * columnCount),
    endRow,
    rowCount,
    startIndex: Math.min(itemCount, startRow * columnCount),
    startRow,
    topPadding: startRow * rowStride
  };
}

function emptyVirtualGridWindow(): VirtualGridWindow {
  return {
    bottomPadding: 0,
    columnCount: 1,
    endIndex: 0,
    endRow: 0,
    rowCount: 0,
    startIndex: 0,
    startRow: 0,
    topPadding: 0
  };
}
