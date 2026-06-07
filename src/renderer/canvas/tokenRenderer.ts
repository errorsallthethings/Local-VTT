import {
  DEFAULT_TOKEN_BORDER_COLOR,
  DEFAULT_TOKEN_BORDER_STYLE,
  DEFAULT_TOKEN_BORDER_WIDTH,
  DEFAULT_TOKEN_MASK,
  type Point,
  type Scene,
  type Token
} from "../../shared/localvtt";
import { getRulerPathHighlightCells } from "./measurement";
import { drawDashedMovementPath, drawPathMarker, hasMeaningfulPath, MOVEMENT_PATH_COLORS } from "./movementPath";
import {
  getTokenGridFootprint,
  getTokenHexFootprintCenters,
  getVisibleTokens
} from "./tokenGeometry";

export type TokenDragPreview = {
  tokenId: string;
  startPosition: Point;
  currentPosition: Point;
  snappedPosition: Point;
  waypoints: Point[];
};

export type TokenPositionOverrides = Map<string, Point>;

export function drawTokens(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  loadedImages: Map<string, HTMLImageElement>,
  mode: "gm" | "player",
  selectedTokenId: string | null,
  tokenDragPreview: TokenDragPreview | null,
  tokenPositionOverrides: TokenPositionOverrides | null = null
) {
  for (const token of getVisibleTokens(scene, mode)) {
    if (!token.assetId) {
      continue;
    }
    const overridePosition = tokenPositionOverrides?.get(token.id);
    const renderToken =
      mode === "gm" && tokenDragPreview?.tokenId === token.id
        ? { ...token, position: tokenDragPreview.currentPosition }
        : overridePosition
          ? { ...token, position: overridePosition }
          : token;
    const shouldClipToFog = mode === "player" && scene.fog.mode !== "revealed";
    ctx.save();
    if (shouldClipToFog && !clipToPlayerRevealShapes(ctx, scene)) {
      ctx.restore();
      continue;
    }
    if (renderToken.footprintVisible) {
      drawTokenFootprint(ctx, scene, renderToken, mode);
    }
    const image = loadedImages.get(token.assetId);
    if (!image) {
      drawTokenPlaceholder(ctx, renderToken, selectedTokenId === token.id);
      ctx.restore();
      continue;
    }
    drawToken(ctx, renderToken, image, selectedTokenId === token.id && mode === "gm");
    ctx.restore();
  }
}

function clipToPlayerRevealShapes(ctx: CanvasRenderingContext2D, scene: Scene): boolean {
  // Player tokens are clipped to reveal shapes so partial fog can show only the visible part of token art.
  const revealShapes = scene.fog.shapes.filter((shape) => {
    const isVisible = shape.visibleInPlayer ?? shape.visible ?? true;
    return isVisible && shape.operation === "reveal";
  });
  if (revealShapes.length === 0) {
    return false;
  }

  ctx.beginPath();
  for (const shape of revealShapes) {
    traceFogShapePath(ctx, shape);
  }
  ctx.clip();
  return true;
}

function traceFogShapePath(ctx: CanvasRenderingContext2D, shape: Scene["fog"]["shapes"][number]) {
  if (shape.kind === "rectangle" && shape.points.length >= 2) {
    const [a, b] = shape.points;
    ctx.rect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    return;
  }
  if (shape.kind === "polygon" && shape.points.length >= 3) {
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    for (const point of shape.points.slice(1)) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    return;
  }
  if (shape.kind === "brush" && shape.points.length >= 1) {
    const radius = Math.max(1, shape.radius ?? 24);
    for (const point of shape.points) {
      ctx.moveTo(point.x + radius, point.y);
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    }
    return;
  }
  if (shape.kind === "circle" && shape.points[0] && shape.radius) {
    ctx.moveTo(shape.points[0].x + shape.radius, shape.points[0].y);
    ctx.arc(shape.points[0].x, shape.points[0].y, shape.radius, 0, Math.PI * 2);
  }
}

export function drawTokenDragHighlights(ctx: CanvasRenderingContext2D, scene: Scene, preview: TokenDragPreview, zoom = 1) {
  const token = scene.tokens.find((candidate) => candidate.id === preview.tokenId);
  if (!token) {
    return;
  }
  drawTokenMovementGridHighlights(ctx, scene, token, preview);
  drawTokenMovementPath(ctx, token, preview, zoom);
  if (scene.grid.type !== "gridless" && scene.grid.sizePx > 0) {
    drawTokenFootprintHighlight(ctx, scene, token, preview.startPosition, "#f6d365", 0.12);
    drawTokenFootprintHighlight(ctx, scene, token, preview.snappedPosition, "#7aa2f7", 0.16);
  }
}

function drawTokenMovementPath(ctx: CanvasRenderingContext2D, token: Token, preview: TokenDragPreview, zoom: number) {
  const startCenter = getTokenCenter(token, preview.startPosition);
  const currentCenter = getTokenCenter(token, preview.currentPosition);
  const targetCenter = getTokenCenter(token, preview.snappedPosition);
  const pathPoints = [startCenter, ...preview.waypoints.map((waypoint) => getTokenCenter(token, waypoint)), targetCenter];
  if (!hasMeaningfulPath(pathPoints)) {
    return;
  }

  const scale = 1 / Math.max(0.1, zoom);
  ctx.save();
  drawDashedMovementPath(ctx, pathPoints, scale);
  drawPathMarker(ctx, startCenter, MOVEMENT_PATH_COLORS.start, scale);
  for (const waypoint of pathPoints.slice(1, -1)) {
    drawPathMarker(ctx, waypoint, MOVEMENT_PATH_COLORS.waypoint, scale * 0.82, "small");
  }
  drawPathMarker(ctx, targetCenter, MOVEMENT_PATH_COLORS.target, scale);
  if (Math.hypot(currentCenter.x - targetCenter.x, currentCenter.y - targetCenter.y) > 3) {
    drawPathMarker(ctx, currentCenter, MOVEMENT_PATH_COLORS.waypoint, scale * 0.82, "small");
  }
  ctx.restore();
}

function drawTokenMovementGridHighlights(ctx: CanvasRenderingContext2D, scene: Scene, token: Token, preview: TokenDragPreview) {
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return;
  }

  const cells = getRulerPathHighlightCells(
    {
      start: getTokenCenter(token, preview.startPosition),
      waypoints: preview.waypoints.map((waypoint) => getTokenCenter(token, waypoint)),
      current: getTokenCenter(token, preview.snappedPosition)
    },
    scene.grid
  );

  if (cells.length === 0) {
    return;
  }

  ctx.save();
  ctx.fillStyle = "rgb(246 211 101 / 0.14)";
  ctx.strokeStyle = "rgb(255 255 255 / 0.36)";
  ctx.lineWidth = Math.max(1, scene.grid.lineThickness);
  for (const cell of cells) {
    if (scene.grid.type === "hex") {
      traceTokenPathHexCell(ctx, cell, Math.max(8, scene.grid.sizePx / 2));
      ctx.fill();
      ctx.stroke();
    } else {
      const size = scene.grid.sizePx;
      ctx.fillRect(cell.x - size / 2, cell.y - size / 2, size, size);
      ctx.strokeRect(cell.x - size / 2, cell.y - size / 2, size, size);
    }
  }
  ctx.restore();
}

function traceTokenPathHexCell(ctx: CanvasRenderingContext2D, center: Point, radius: number) {
  ctx.beginPath();
  for (let side = 0; side < 6; side += 1) {
    const angle = (Math.PI / 180) * (60 * side - 30);
    const x = center.x + radius * Math.cos(angle);
    const y = center.y + radius * Math.sin(angle);
    if (side === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function getTokenCenter(token: Token, position: Point): Point {
  return {
    x: position.x + token.size.width / 2,
    y: position.y + token.size.height / 2
  };
}

function drawTokenFootprintHighlight(ctx: CanvasRenderingContext2D, scene: Scene, token: Token, position: Point, color: string, alpha: number) {
  if (scene.grid.type === "hex") {
    drawTokenHexFootprint(ctx, scene, { ...token, position }, color, alpha, true);
    return;
  }
  const bounds = getTokenGridFootprint(scene, token, position);
  ctx.save();
  ctx.fillStyle = hexToRgbAlpha(color, alpha);
  ctx.strokeStyle = hexToRgbAlpha(color, 0.78);
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.restore();
}

function drawTokenFootprint(ctx: CanvasRenderingContext2D, scene: Scene, token: Token, mode: "gm" | "player") {
  if (scene.grid.type === "gridless" || scene.grid.sizePx <= 0) {
    return;
  }
  const color = mode === "gm" ? "#f6d365" : token.borderColor ?? DEFAULT_TOKEN_BORDER_COLOR;
  if (scene.grid.type === "hex") {
    drawTokenHexFootprint(ctx, scene, token, color, 0.14, false);
    return;
  }
  drawTokenFootprintHighlight(ctx, scene, token, token.position, color, 0.12);
}

function drawTokenHexFootprint(ctx: CanvasRenderingContext2D, scene: Scene, token: Token, color: string, alpha: number, dashed: boolean) {
  const centers = getTokenHexFootprintCenters(scene, token);
  if (centers.length === 0) {
    return;
  }
  const radius = Math.max(8, scene.grid.sizePx / 2);
  ctx.save();
  ctx.fillStyle = hexToRgbAlpha(color, alpha);
  ctx.strokeStyle = hexToRgbAlpha(color, 0.72);
  ctx.lineWidth = 2;
  if (dashed) {
    ctx.setLineDash([8, 5]);
  }
  for (const center of centers) {
    ctx.beginPath();
    tracePointyHex(ctx, center.x, center.y, radius);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function tracePointyHex(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number) {
  for (let side = 0; side < 6; side += 1) {
    const angle = (Math.PI / 180) * (60 * side - 30);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    if (side === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

function hexToRgbAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgb(${red} ${green} ${blue} / ${alpha})`;
}

function drawToken(ctx: CanvasRenderingContext2D, token: Token, image: HTMLImageElement, selected: boolean) {
  const mask = token.mask ?? DEFAULT_TOKEN_MASK;
  const borderStyle = token.borderStyle ?? DEFAULT_TOKEN_BORDER_STYLE;
  const borderColor = token.borderColor ?? DEFAULT_TOKEN_BORDER_COLOR;
  const glowColor = token.glowColor ?? borderColor;
  const borderWidth = token.borderWidth ?? DEFAULT_TOKEN_BORDER_WIDTH;
  const { x, y } = token.position;
  const { width, height } = token.size;

  ctx.save();
  applyTokenMask(ctx, x, y, width, height, mask);
  ctx.clip();
  drawCroppedImage(ctx, image, x, y, width, height);
  ctx.restore();

  drawTokenBorder(ctx, x, y, width, height, mask, borderStyle, borderColor, borderWidth, glowColor);
  if (selected) {
    drawTokenSelectionOutline(ctx, x, y, width, height, mask);
  }
}

function drawCroppedImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return;
  }
  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = width / height;
  let cropX = 0;
  let cropY = 0;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  if (sourceAspect > targetAspect) {
    cropWidth = sourceHeight * targetAspect;
    cropX = (sourceWidth - cropWidth) / 2;
  } else if (sourceAspect < targetAspect) {
    cropHeight = sourceWidth / targetAspect;
    cropY = (sourceHeight - cropHeight) / 2;
  }
  ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, x, y, width, height);
}

function drawTokenPlaceholder(ctx: CanvasRenderingContext2D, token: Token, selected: boolean) {
  const { x, y } = token.position;
  const { width, height } = token.size;
  ctx.save();
  applyTokenMask(ctx, x, y, width, height, token.mask ?? DEFAULT_TOKEN_MASK);
  ctx.fillStyle = "#202733";
  ctx.fill();
  ctx.restore();
  drawTokenBorder(
    ctx,
    x,
    y,
    width,
    height,
    token.mask ?? DEFAULT_TOKEN_MASK,
    token.borderStyle ?? DEFAULT_TOKEN_BORDER_STYLE,
    token.borderColor ?? DEFAULT_TOKEN_BORDER_COLOR,
    token.borderWidth ?? DEFAULT_TOKEN_BORDER_WIDTH,
    token.glowColor ?? token.borderColor ?? DEFAULT_TOKEN_BORDER_COLOR
  );
  if (selected) {
    drawTokenSelectionOutline(ctx, x, y, width, height, token.mask ?? DEFAULT_TOKEN_MASK);
  }
}

function applyTokenMask(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, mask: Token["mask"]) {
  ctx.beginPath();
  if (mask === "circle") {
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    return;
  }
  ctx.rect(x, y, width, height);
}

function drawTokenBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  mask: Token["mask"],
  borderStyle: Token["borderStyle"],
  borderColor: string,
  borderWidth: number,
  glowColor: string
) {
  if (borderStyle === "none") {
    return;
  }

  // Borders are clipped to the token mask so thicker styles grow inward instead of changing grid footprint size.
  const safeBorderWidth = Math.max(1, Math.min(Math.min(width, height), borderWidth));
  const inset = safeBorderWidth / 2;
  ctx.save();
  applyTokenMask(ctx, x, y, width, height, mask);
  ctx.clip();
  traceTokenInsetPath(ctx, x, y, width, height, mask, inset);
  ctx.lineWidth = safeBorderWidth;
  ctx.strokeStyle = borderColor;
  if (borderStyle === "dashed") {
    ctx.setLineDash([Math.max(10, safeBorderWidth * 1.4), Math.max(6, safeBorderWidth * 0.7)]);
  }
  if (borderStyle === "dotted") {
    ctx.setLineDash([Math.max(1, safeBorderWidth * 0.08), Math.max(14, safeBorderWidth * 1.15)]);
    ctx.lineCap = "round";
  }
  if (borderStyle === "glow") {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = Math.max(12, safeBorderWidth * 1.25);
    ctx.strokeStyle = borderColor;
    ctx.globalAlpha = 0.92;
  }
  if (borderStyle === "inner-shadow") {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = safeBorderWidth;
  }
  if (borderStyle !== "double-line") {
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.lineCap = "butt";

  if (borderStyle === "double-line") {
    ctx.globalAlpha = 1;
    const outerWidth = Math.max(2, safeBorderWidth * 0.34);
    const innerWidth = Math.max(2, safeBorderWidth * 0.26);
    traceTokenInsetPath(ctx, x, y, width, height, mask, outerWidth / 2);
    ctx.lineWidth = outerWidth;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
    traceTokenInsetPath(ctx, x, y, width, height, mask, Math.max(1, inset * 1.34));
    ctx.lineWidth = innerWidth;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
  }

  if (borderStyle === "inner-shadow") {
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    traceTokenInsetPath(ctx, x, y, width, height, mask, Math.max(1, inset * 0.55));
    ctx.strokeStyle = "rgb(255 255 255 / 0.18)";
    ctx.lineWidth = Math.max(2, safeBorderWidth * 0.18);
    ctx.stroke();
    traceTokenInsetPath(ctx, x, y, width, height, mask, Math.max(1, inset * 1.15));
    ctx.strokeStyle = "rgb(0 0 0 / 0.78)";
    ctx.lineWidth = Math.max(4, safeBorderWidth * 0.5);
    ctx.stroke();
    traceTokenInsetPath(ctx, x, y, width, height, mask, Math.max(1, inset * 1.65));
    ctx.strokeStyle = "rgb(0 0 0 / 0.34)";
    ctx.lineWidth = Math.max(3, safeBorderWidth * 0.28);
    ctx.stroke();
  }

  if (borderStyle === "embossed") {
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    traceTokenInsetPath(ctx, x, y, width, height, mask, Math.max(1, inset * 0.72));
    ctx.strokeStyle = "rgb(255 255 255 / 0.54)";
    ctx.lineWidth = Math.max(3, safeBorderWidth * 0.34);
    ctx.stroke();
    traceTokenInsetPath(ctx, x, y, width, height, mask, Math.max(1, inset * 1.18));
    ctx.strokeStyle = "rgb(0 0 0 / 0.35)";
    ctx.lineWidth = Math.max(2, safeBorderWidth * 0.22);
    ctx.stroke();
  }

  if (borderStyle === "glow") {
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.36;
    traceTokenInsetPath(ctx, x, y, width, height, mask, Math.max(1, inset * 1.25));
    ctx.lineWidth = Math.max(3, safeBorderWidth * 0.45);
    ctx.strokeStyle = glowColor;
    ctx.stroke();
  }
  ctx.restore();
}

function traceTokenInsetPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, mask: Token["mask"], inset: number) {
  const safeInset = Math.max(0, Math.min(inset, Math.min(width, height) / 2));
  ctx.beginPath();
  if (mask === "circle") {
    ctx.ellipse(
      x + width / 2,
      y + height / 2,
      Math.max(0.5, width / 2 - safeInset),
      Math.max(0.5, height / 2 - safeInset),
      0,
      0,
      Math.PI * 2
    );
    return;
  }
  ctx.rect(x + safeInset, y + safeInset, Math.max(1, width - safeInset * 2), Math.max(1, height - safeInset * 2));
}

function drawTokenSelectionOutline(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, mask: Token["mask"]) {
  const offset = 6;
  ctx.save();
  applyTokenMask(ctx, x - offset, y - offset, width + offset * 2, height + offset * 2, mask);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#f6d365";
  ctx.shadowColor = "#f6d365";
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();
}
