import { describe, expect, it } from "vitest";
import { calculateVirtualGridWindow } from "../../src/renderer/lib/virtualGrid";

describe("virtual grid helpers", () => {
  it("calculates visible item indexes with row overscan", () => {
    const window = calculateVirtualGridWindow({
      gap: 8,
      gridOffsetTop: 120,
      gridWidth: 476,
      itemCount: 100,
      minColumnWidth: 108,
      rowHeight: 158,
      scrollTop: 450,
      viewportHeight: 300,
      overscanRows: 1
    });

    expect(window.columnCount).toBe(4);
    expect(window.startRow).toBe(0);
    expect(window.endRow).toBe(5);
    expect(window.startIndex).toBe(0);
    expect(window.endIndex).toBe(20);
    expect(window.topPadding).toBe(0);
    expect(window.bottomPadding).toBe((25 - 5) * 166);
  });

  it("keeps indexes bounded near the end of the grid", () => {
    const window = calculateVirtualGridWindow({
      gap: 8,
      gridOffsetTop: 0,
      gridWidth: 476,
      itemCount: 19,
      minColumnWidth: 108,
      rowHeight: 158,
      scrollTop: 900,
      viewportHeight: 300,
      overscanRows: 1
    });

    expect(window.columnCount).toBe(4);
    expect(window.rowCount).toBe(5);
    expect(window.endIndex).toBe(19);
    expect(window.bottomPadding).toBe(0);
  });

  it("keeps a visible row when scroll position is beyond a filtered result set", () => {
    const window = calculateVirtualGridWindow({
      gap: 8,
      gridOffsetTop: 0,
      gridWidth: 476,
      itemCount: 3,
      minColumnWidth: 108,
      rowHeight: 158,
      scrollTop: 1200,
      viewportHeight: 300,
      overscanRows: 1
    });

    expect(window.startIndex).toBe(0);
    expect(window.endIndex).toBe(3);
    expect(window.topPadding).toBe(0);
    expect(window.bottomPadding).toBe(0);
  });

  it("returns an empty window without measurable layout", () => {
    expect(
      calculateVirtualGridWindow({
        gap: 8,
        gridOffsetTop: 0,
        gridWidth: 0,
        itemCount: 10,
        minColumnWidth: 108,
        rowHeight: 158,
        scrollTop: 0,
        viewportHeight: 300
      })
    ).toMatchObject({ startIndex: 0, endIndex: 0, rowCount: 0 });
  });
});
