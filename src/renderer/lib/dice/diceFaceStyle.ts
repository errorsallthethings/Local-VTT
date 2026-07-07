import type { DiceVisualRoll } from "./dice";

export function getDieFaceLabels(die: DiceVisualRoll["die"]): string[] {
  if (die === "d00") {
    return ["00", "10", "20", "30", "40", "50", "60", "70", "80", "90"];
  }
  if (die === "d10") {
    return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  }
  const sides = die === "d4" ? 4 : die === "d8" ? 8 : die === "d12" ? 12 : 20;
  return Array.from({ length: sides }, (_, index) => String(index + 1));
}

export function getPolyhedralFaceLabelSize(die: DiceVisualRoll["die"]): number {
  if (die === "d10" || die === "d00") {
    return 0.76;
  }
  if (die === "d8") {
    return 1.0;
  }
  if (die === "d12") {
    return 0.86;
  }
  return 0.84;
}

export function formatD10StyleFaceLabel(die: "d10" | "d00", value: number): string {
  if (die === "d10") {
    return value === 0 ? "0" : String(value);
  }
  return value === 0 ? "00" : String(value * 10);
}

export function shouldUnderlineFaceLabel(die: DiceVisualRoll["die"], label: string): boolean {
  return (die === "d10" || die === "d12" || die === "d20") && (label === "6" || label === "9");
}

export function getFaceHighlightColor(die: DiceVisualRoll["die"]): number {
  if (die === "coin") {
    return 0xffd08a;
  }
  if (die === "d20") {
    return 0xf6d365;
  }
  return 0xffffff;
}

export function getFaceLabelFontSize(label: string): number {
  if (label.length > 4) {
    return 118;
  }
  if (label.length > 2) {
    return 132;
  }
  if (label.length > 1) {
    return 148;
  }
  return 170;
}

export function getDieColor(die: DiceVisualRoll["die"]): number {
  const colors = {
    coin: 0xf97316,
    d2: 0xd7dde8,
    d4: 0xf2d35c,
    d6: 0xdc2626,
    d8: 0x2f9d68,
    d10: 0x3b1f5f,
    d00: 0x101010,
    d12: 0x8fc9ff,
    d20: 0xf4f1e8
  } satisfies Record<DiceVisualRoll["die"], number>;
  return colors[die];
}

export function getDieFaceTextColor(die: DiceVisualRoll["die"]): string {
  if (die === "d4" || die === "d12" || die === "d20") {
    return "#10131a";
  }
  return "#f8fafc";
}
