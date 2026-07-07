import { describe, expect, it } from "vitest";
import {
  formatD10StyleFaceLabel,
  getDieColor,
  getDieFaceLabels,
  getDieFaceTextColor,
  getFaceHighlightColor,
  getFaceLabelFontSize,
  getPolyhedralFaceLabelSize,
  shouldUnderlineFaceLabel
} from "../../src/renderer/lib/dice";

describe("dice face style helpers", () => {
  it("returns die face labels for common die families", () => {
    expect(getDieFaceLabels("d10")).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]);
    expect(getDieFaceLabels("d00")).toEqual(["00", "10", "20", "30", "40", "50", "60", "70", "80", "90"]);
    expect(getDieFaceLabels("d4")).toEqual(["1", "2", "3", "4"]);
    expect(getDieFaceLabels("d20")).toHaveLength(20);
  });

  it("formats d10-style labels for ones and percentile dice", () => {
    expect(formatD10StyleFaceLabel("d10", 0)).toBe("0");
    expect(formatD10StyleFaceLabel("d10", 7)).toBe("7");
    expect(formatD10StyleFaceLabel("d00", 0)).toBe("00");
    expect(formatD10StyleFaceLabel("d00", 7)).toBe("70");
  });

  it("selects face label sizes and font sizes", () => {
    expect(getPolyhedralFaceLabelSize("d10")).toBe(0.76);
    expect(getPolyhedralFaceLabelSize("d8")).toBe(1);
    expect(getPolyhedralFaceLabelSize("d12")).toBe(0.86);
    expect(getPolyhedralFaceLabelSize("d20")).toBe(0.84);
    expect(getFaceLabelFontSize("1")).toBe(170);
    expect(getFaceLabelFontSize("10")).toBe(148);
    expect(getFaceLabelFontSize("100")).toBe(132);
    expect(getFaceLabelFontSize("10000")).toBe(118);
  });

  it("underlines ambiguous six/nine labels only on dice that need it", () => {
    expect(shouldUnderlineFaceLabel("d10", "6")).toBe(true);
    expect(shouldUnderlineFaceLabel("d12", "9")).toBe(true);
    expect(shouldUnderlineFaceLabel("d20", "9")).toBe(true);
    expect(shouldUnderlineFaceLabel("d8", "6")).toBe(false);
    expect(shouldUnderlineFaceLabel("d10", "10")).toBe(false);
  });

  it("returns stable face and highlight colors", () => {
    expect(getDieColor("coin")).toBe(0xf97316);
    expect(getDieColor("d00")).toBe(0x101010);
    expect(getDieFaceTextColor("d20")).toBe("#10131a");
    expect(getDieFaceTextColor("d6")).toBe("#f8fafc");
    expect(getFaceHighlightColor("coin")).toBe(0xffd08a);
    expect(getFaceHighlightColor("d20")).toBe(0xf6d365);
    expect(getFaceHighlightColor("d6")).toBe(0xffffff);
  });
});
