import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createDieGeometry, createPentagonalTrapezohedronGeometry, getScaledGeometryPoints, type DiceType } from "../../src/renderer/lib/dice";

describe("dice geometry helpers", () => {
  it("creates buffer geometry for every physical die type", () => {
    const dice: DiceType[] = ["coin", "d2", "d4", "d6", "d8", "d10", "d00", "d12", "d20"];

    dice.forEach((die) => {
      const geometry = createDieGeometry(die);
      expect(geometry).toBeInstanceOf(THREE.BufferGeometry);
      expect(geometry.getAttribute("position").count).toBeGreaterThan(0);
      geometry.dispose();
    });
  });

  it("uses the same pentagonal trapezohedron geometry for d10 and d00", () => {
    const d10 = createDieGeometry("d10");
    const d00 = createDieGeometry("d00");
    const direct = createPentagonalTrapezohedronGeometry();

    expect(d10.getAttribute("position").count).toBe(direct.getAttribute("position").count);
    expect(d00.getAttribute("position").count).toBe(direct.getAttribute("position").count);
    expect(direct.getIndex()?.count).toBe(60);

    d10.dispose();
    d00.dispose();
    direct.dispose();
  });

  it("scales geometry points into a flat coordinate array", () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([1, 2, 3, -1, 0.5, 2], 3));

    expect([...getScaledGeometryPoints(geometry, 2)]).toEqual([2, 4, 6, -2, 1, 4]);

    geometry.dispose();
  });
});
