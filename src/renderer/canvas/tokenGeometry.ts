import type { Point, Scene, Token } from "../../shared/localvtt";
import { getNearestGridPoint } from "./gridMath";

export function getVisibleTokens(scene: Scene, mode: "gm" | "player"): Token[] {
  return [...scene.tokens]
    .filter((token) => (mode === "gm" ? token.visibleInGm ?? !token.hidden : token.visibleInPlayer))
    .filter((token) => mode === "gm" || scene.fog.mode === "revealed" || isTokenRevealedByFog(token, scene))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function isTokenRevealedByFog(token: Token, scene: Scene): boolean {
  const samplePoints = getTokenRevealSamplePoints(token);
  return scene.fog.shapes.some((shape) => {
    const isVisible = shape.visibleInPlayer ?? shape.visible ?? true;
    return isVisible && shape.operation === "reveal" && samplePoints.some((point) => isPointInsideFogShape(point, shape));
  });
}

export function getTokenRevealSamplePoints(token: Token): Point[] {
  const { x, y } = token.position;
  const { width, height } = token.size;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  return [
    { x: centerX, y: centerY },
    { x, y },
    { x: x + width, y },
    { x, y: y + height },
    { x: x + width, y: y + height },
    { x: centerX, y },
    { x: centerX, y: y + height },
    { x, y: centerY },
    { x: x + width, y: centerY }
  ];
}

export function isPointInsideFogShape(point: Point, shape: Scene["fog"]["shapes"][number]): boolean {
  if (shape.kind === "rectangle" && shape.points.length >= 2) {
    const [a, b] = shape.points;
    return point.x >= Math.min(a.x, b.x) && point.x <= Math.max(a.x, b.x) && point.y >= Math.min(a.y, b.y) && point.y <= Math.max(a.y, b.y);
  }
  if (shape.kind === "polygon" && shape.points.length >= 3) {
    return isPointInPolygon(point, shape.points);
  }
  if (shape.kind === "brush" && shape.points.length >= 1) {
    const radius = shape.radius ?? 1;
    return shape.points.some((candidate, index) => {
      const next = shape.points[index + 1];
      return next ? distanceToSegment(point, candidate, next) <= radius : distanceBetween(point, candidate) <= radius;
    });
  }
  if (shape.kind === "circle" && shape.points.length >= 1) {
    const [center, edge] = shape.points;
    const radius = shape.radius ?? (edge ? distanceBetween(center, edge) : 0);
    return radius > 0 && distanceBetween(point, center) <= radius;
  }
  return false;
}

export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    const intersects = current.y > point.y !== previous.y > point.y && point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

export function distanceToSegment(point: Point, start: Point, end: Point): number {
  const lengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  if (lengthSquared === 0) {
    return distanceBetween(point, start);
  }
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / lengthSquared));
  return distanceBetween(point, {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y)
  });
}

export function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function getTokenAtPoint(tokens: Token[], point: Point): Token | null {
  const visibleTokens = [...tokens]
    .filter((token) => token.visibleInGm ?? !token.hidden)
    .sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
  return (
    visibleTokens.find((token) => {
      return (
        point.x >= token.position.x &&
        point.x <= token.position.x + token.size.width &&
        point.y >= token.position.y &&
        point.y <= token.position.y + token.size.height
      );
    }) ?? null
  );
}

export function getSnappedTokenPosition(position: Point, token: Token, scene: Scene): Point {
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return position;
  }
  if (scene.grid.type === "hex") {
    const center = {
      x: position.x + token.size.width / 2,
      y: position.y + token.size.height / 2
    };
    const snappedCenter = token.sizePreset === "large" ? getNearestHexVertex(center, scene.grid) : getNearestHexCenter(center, scene.grid);
    return {
      x: snappedCenter.x - token.size.width / 2,
      y: snappedCenter.y - token.size.height / 2
    };
  }
  const isHalfCell = token.size.width <= scene.grid.sizePx * 0.75 && token.size.height <= scene.grid.sizePx * 0.75;
  if (isHalfCell) {
    const center = {
      x: position.x + token.size.width / 2,
      y: position.y + token.size.height / 2
    };
    const snappedCenter = getNearestGridCellCenter(center, scene.grid);
    return {
      x: snappedCenter.x - token.size.width / 2,
      y: snappedCenter.y - token.size.height / 2
    };
  }

  return getNearestGridPoint(position, scene.grid) ?? position;
}

export function getNearestHexVertex(point: Point, grid: Scene["grid"]): Point {
  const radius = Math.max(8, grid.sizePx / 2);
  const center = getNearestHexCenter(point, grid);
  let nearest = center;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let side = 0; side < 6; side += 1) {
    const angle = (Math.PI / 180) * (60 * side - 30);
    const vertex = {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    };
    const distance = (vertex.x - point.x) ** 2 + (vertex.y - point.y) ** 2;
    if (distance < nearestDistance) {
      nearest = vertex;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function getNearestHexCenter(point: Point, grid: Scene["grid"]): Point {
  const radius = Math.max(8, grid.sizePx / 2);
  const hexWidth = Math.sqrt(3) * radius;
  const rowStep = radius * 1.5;
  const approximateRow = Math.round((point.y - grid.offsetY) / rowStep);
  let nearest = { x: grid.offsetX, y: grid.offsetY };
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let row = approximateRow - 2; row <= approximateRow + 2; row += 1) {
    const rowOffset = row % 2 === 0 ? 0 : hexWidth / 2;
    const approximateColumn = Math.round((point.x - grid.offsetX - rowOffset) / hexWidth);
    for (let column = approximateColumn - 2; column <= approximateColumn + 2; column += 1) {
      const center = {
        x: grid.offsetX + column * hexWidth + rowOffset,
        y: grid.offsetY + row * rowStep
      };
      const distance = (center.x - point.x) ** 2 + (center.y - point.y) ** 2;
      if (distance < nearestDistance) {
        nearest = center;
        nearestDistance = distance;
      }
    }
  }
  return nearest;
}

export function getNearestGridCellCenter(point: Point, grid: Scene["grid"]): Point {
  const size = grid.sizePx;
  return {
    x: Math.floor((point.x - grid.offsetX) / size) * size + grid.offsetX + size / 2,
    y: Math.floor((point.y - grid.offsetY) / size) * size + grid.offsetY + size / 2
  };
}

export function getTokenHexFootprintCenters(scene: Scene, token: Token): Point[] {
  if (scene.grid.type !== "hex") {
    return [];
  }
  const anchor =
    token.sizePreset === "large"
      ? getNearestHexVertex(
          {
            x: token.position.x + token.size.width / 2,
            y: token.position.y + token.size.height / 2
          },
          scene.grid
        )
      : getNearestHexCenter(
          {
            x: token.position.x + token.size.width / 2,
            y: token.position.y + token.size.height / 2
          },
          scene.grid
        );
  if (token.sizePreset === "large") {
    return getNearestHexCenters(anchor, scene.grid, 3);
  }
  const footprintRadius = getTokenHexFootprintRadius(token);
  const centerCoord = getNearestHexCoordinate(anchor, scene.grid);
  const coords = [];
  for (let q = -footprintRadius; q <= footprintRadius; q += 1) {
    const r1 = Math.max(-footprintRadius, -q - footprintRadius);
    const r2 = Math.min(footprintRadius, -q + footprintRadius);
    for (let r = r1; r <= r2; r += 1) {
      coords.push({ q: centerCoord.q + q, r: centerCoord.r + r });
    }
  }
  return coords.map((coord) => hexAxialToPoint(coord, scene.grid));
}

export function getNearestHexCenters(point: Point, grid: Scene["grid"], count: number): Point[] {
  const centerCoord = getNearestHexCoordinate(point, grid);
  const candidates = [];
  for (let q = -2; q <= 2; q += 1) {
    for (let r = -2; r <= 2; r += 1) {
      const coord = { q: centerCoord.q + q, r: centerCoord.r + r };
      const center = hexAxialToPoint(coord, grid);
      candidates.push({ center, distance: (center.x - point.x) ** 2 + (center.y - point.y) ** 2 });
    }
  }
  return candidates.sort((a, b) => a.distance - b.distance).slice(0, count).map((candidate) => candidate.center);
}

export function getTokenHexFootprintRadius(token: Token): number {
  switch (token.sizePreset) {
    case "huge":
      return 1;
    case "gargantuan":
      return 2;
    case "tiny":
    case "medium":
    case "custom":
    default:
      return 0;
  }
}

export function getNearestHexCoordinate(point: Point, grid: Scene["grid"]): { q: number; r: number } {
  const radius = Math.max(8, grid.sizePx / 2);
  const x = point.x - grid.offsetX;
  const y = point.y - grid.offsetY;
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / radius;
  const r = ((2 / 3) * y) / radius;
  return roundAxial(q, r);
}

export function hexAxialToPoint(coord: { q: number; r: number }, grid: Scene["grid"]): Point {
  const radius = Math.max(8, grid.sizePx / 2);
  return {
    x: grid.offsetX + radius * Math.sqrt(3) * (coord.q + coord.r / 2),
    y: grid.offsetY + radius * 1.5 * coord.r
  };
}

export function roundAxial(q: number, r: number): { q: number; r: number } {
  const x = q;
  const z = r;
  const y = -x - z;
  let rx = Math.round(x);
  const ry = Math.round(y);
  let rz = Math.round(z);
  const xDiff = Math.abs(rx - x);
  const yDiff = Math.abs(ry - y);
  const zDiff = Math.abs(rz - z);
  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff <= zDiff) {
    rz = -rx - ry;
  }
  return { q: rx, r: rz };
}

export function getTokenGridFootprint(scene: Scene, token: Token, position: Point): { x: number; y: number; width: number; height: number } {
  const size = scene.grid.sizePx;
  const isHalfCell = token.size.width <= size * 0.75 && token.size.height <= size * 0.75;
  if (isHalfCell) {
    const center = {
      x: position.x + token.size.width / 2,
      y: position.y + token.size.height / 2
    };
    return {
      x: Math.floor((center.x - scene.grid.offsetX) / size) * size + scene.grid.offsetX,
      y: Math.floor((center.y - scene.grid.offsetY) / size) * size + scene.grid.offsetY,
      width: size,
      height: size
    };
  }

  return {
    x: position.x,
    y: position.y,
    width: token.size.width,
    height: token.size.height
  };
}
