interface EffectFallbackBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function fillFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number, alphaScale: number, fillStyle: string) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, layerOpacity)) * alphaScale;
  ctx.fillStyle = fillStyle;
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  ctx.restore();
}

export function drawWaterFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.18, "rgb(0, 145, 190)");
}

export function drawAcidFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.36, "rgb(132, 204, 22)");
}

export function drawPoisonFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.32, "rgb(101, 163, 13)");
}

export function drawColdFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.3, "rgb(191, 219, 254)");
}

export function drawDarknessFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.5, "rgb(2, 6, 23)");
}

export function drawLavaFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.42, "rgb(216, 67, 21)");
}

export function drawFireFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.36, "rgb(249, 115, 22)");
}

export function drawLightningFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.34, "rgb(96, 165, 250)");
}

export function drawArcaneFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.3, "rgb(192, 132, 252)");
}

export function drawChaosFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.34, "rgb(244, 114, 182)");
}

export function drawVoidFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.36, "rgb(76, 29, 149)");
}

export function drawNatureFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.36, "rgb(22, 101, 52)");
}

export function drawRadiantFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.32, "rgb(253, 230, 138)");
}

export function drawForceFieldFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.3, "rgb(103, 232, 249)");
}

export function drawShockwaveFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, layerOpacity)) * 0.28;
  ctx.strokeStyle = "rgb(147, 197, 253)";
  ctx.lineWidth = Math.max(2, Math.min(bounds.width, bounds.height) * 0.035);
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const maxRadius = Math.min(bounds.width, bounds.height) * 0.46;
  for (let index = 1; index <= 3; index += 1) {
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, maxRadius * (index / 3), maxRadius * (index / 3), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawDistortionFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.2, "rgb(103, 232, 249)");
}

export function drawSmokeFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.24, "rgb(140, 152, 165)");
}

export function drawFogFallback(ctx: CanvasRenderingContext2D, bounds: EffectFallbackBounds, layerOpacity: number) {
  fillFallback(ctx, bounds, layerOpacity, 0.18, "rgb(190, 204, 216)");
}
