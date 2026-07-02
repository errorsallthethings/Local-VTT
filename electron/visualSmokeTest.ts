import { app, BrowserWindow } from "electron";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  type Asset,
  type Campaign,
  createDefaultCampaign,
  createDefaultScene,
  projectSceneForPlayer,
  type LiveTableEvent,
  type PlayerSceneProjection,
  type Scene
} from "../src/shared/localvtt.js";

interface SmokeVisualFixture {
  campaign: Campaign;
  scene: Scene;
  projection: PlayerSceneProjection;
  liveEvents: LiveTableEvent[];
}

export interface VisualSmokeTestOptions {
  getPlayerWindow: () => BrowserWindow | null;
  registerAssetPaths: (campaign: Campaign) => void;
}

export async function runVisualSmokeTest(win: BrowserWindow, options: VisualSmokeTestOptions): Promise<Record<string, unknown>> {
  const fixture = await createSmokeVisualFixture(options);
  const outputDir = path.join(app.getPath("temp"), "local-vtt-visual-smoke", "screenshots");
  await mkdir(outputDir, { recursive: true });

  const playerOpenResult = await win.webContents.executeJavaScript(`window.localVtt.openPlayerView({ fullscreen: false })`);
  const playerDelivered = await win.webContents.executeJavaScript(`window.localVtt.sendSceneToPlayer(${JSON.stringify(fixture.projection)})`);
  const playerWindow = await waitForPlayerWindow(options);
  await waitForVisualSmokeCanvas(playerWindow);
  for (const event of fixture.liveEvents) {
    await win.webContents.executeJavaScript(`window.localVtt.sendLiveTableEvent(${JSON.stringify(event)})`);
  }
  await waitForTimeout(250);
  const sceneMetrics = await getSceneCanvasMetrics(playerWindow);
  if (!sceneMetrics.ok) {
    throw new Error(sceneMetrics.reason);
  }
  const overlayMetrics = await getPlayerOverlayMetrics(playerWindow);
  if (!overlayMetrics.ok) {
    throw new Error(overlayMetrics.reason);
  }
  const sceneScreenshotPath = path.join(outputDir, "player-scene.png");
  await captureWindowPng(playerWindow, sceneScreenshotPath);

  const testPatternDelivered = await win.webContents.executeJavaScript(`window.localVtt.showPlayerTestPattern({
    type: "idle",
    variant: "test-pattern",
    title: "Visual Smoke Test Pattern",
    message: "Square grid test pattern",
    testPattern: {
      gridMode: "square",
      cellSizePx: 80,
      displayLabel: "Visual Smoke Display",
      nativeResolution: { width: 1280, height: 720 }
    }
  })`);
  await waitForPlayerSelector(playerWindow, ".player-test-pattern");
  const testPatternMetrics = await getTestPatternMetrics(playerWindow);
  if (!testPatternMetrics.ok) {
    throw new Error(testPatternMetrics.reason);
  }
  const testPatternScreenshotPath = path.join(outputDir, "player-test-pattern.png");
  await captureWindowPng(playerWindow, testPatternScreenshotPath);

  return {
    playerOpenResult,
    playerDelivered,
    testPatternDelivered,
    sceneMetrics,
    overlayMetrics,
    testPatternMetrics,
    screenshots: {
      scene: sceneScreenshotPath,
      testPattern: testPatternScreenshotPath
    },
    covered: [
      "static map",
      "square grid",
      "grid coordinates",
      "fog reveal",
      "weather",
      "environment effect",
      "drawings",
      "template drawing",
      "token",
      "turn order overlay",
      "Player View basics",
      "test pattern"
    ]
  };
}

async function createSmokeVisualFixture(options: VisualSmokeTestOptions): Promise<SmokeVisualFixture> {
  const fixtureRoot = path.join(app.getPath("temp"), "local-vtt-visual-smoke");
  await mkdir(fixtureRoot, { recursive: true });
  const mapPath = path.join(fixtureRoot, "visual-smoke-map.svg");
  const tokenPath = path.join(fixtureRoot, "visual-smoke-token.svg");
  const now = new Date().toISOString();
  const mapAsset: Asset = {
    id: "visual-smoke-map",
    name: "Visual Smoke Static Map",
    kind: "map",
    mediaType: "image",
    relativePath: "assets/maps/visual-smoke-map.svg",
    thumbnailRelativePath: "assets/maps/visual-smoke-map.svg",
    originalFileName: "visual-smoke-map.svg",
    createdAt: now,
    absolutePath: mapPath,
    thumbnailAbsolutePath: mapPath
  };
  const tokenAsset: Asset = {
    id: "visual-smoke-token",
    name: "Visual Smoke Token",
    kind: "token",
    mediaType: "image",
    relativePath: "assets/tokens/visual-smoke-token.svg",
    thumbnailRelativePath: "assets/tokens/visual-smoke-token.svg",
    originalFileName: "visual-smoke-token.svg",
    createdAt: now,
    absolutePath: tokenPath,
    thumbnailAbsolutePath: tokenPath
  };

  await writeFile(
    mapPath,
    `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      <rect width="1280" height="720" fill="#18202b"/>
      <rect x="0" y="0" width="1280" height="720" fill="none" stroke="#f5c542" stroke-width="10"/>
      <path d="M0 360H1280M640 0V720" stroke="#7aa2f7" stroke-width="6"/>
      <rect x="120" y="120" width="280" height="180" rx="18" fill="#9ece6a"/>
      <circle cx="930" cy="270" r="120" fill="#f7768e"/>
      <path d="M760 540l120-160 120 160z" fill="#bb9af7"/>
      <text x="48" y="92" fill="#dfe6ef" font-family="Arial, sans-serif" font-size="52" font-weight="700">Visual Smoke Map</text>
    </svg>`
  );
  await writeFile(
    tokenPath,
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <circle cx="128" cy="128" r="116" fill="#ff9e64"/>
      <circle cx="128" cy="128" r="82" fill="#151922"/>
      <text x="128" y="150" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="72" font-weight="700">T</text>
    </svg>`
  );

  const campaign = createDefaultCampaign("Visual Smoke Campaign");
  const scene = createDefaultScene("Visual Smoke Scene");
  scene.mapAssetId = mapAsset.id;
  scene.grid = {
    ...scene.grid,
    type: "square",
    sizePx: 80,
    offsetX: 0,
    offsetY: 0,
    mapGridColumns: 16,
    mapGridRows: 9,
    color: "#ffffff",
    opacity: 0.55,
    lineThickness: 1,
    showCoordinates: true,
    coordinatePlacement: "edge",
    coordinateXFormat: "alpha",
    coordinateYFormat: "numeric",
    coordinateColor: "#f5c542",
    coordinatePlayerFontSize: 16,
    showOnPlayer: true
  };
  scene.mapTransform = { x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, fitMode: "manual" };
  scene.fog = {
    ...scene.fog,
    mode: "partial",
    gmOpacity: 0.25,
    playerOpacity: 0.36,
    shapes: [
      {
        id: "visual-smoke-fog-reveal",
        name: "Reveal Area",
        operation: "reveal",
        kind: "rectangle",
        points: [
          { x: 80, y: 80 },
          { x: 1160, y: 640 }
        ],
        visibleInPlayer: true
      }
    ]
  };
  scene.weather = {
    ...scene.weather,
    enabled: true,
    effect: "rain",
    effects: {
      ...scene.weather.effects,
      rain: {
        ...scene.weather.effects.rain,
        enabled: true,
        pattern: "rain",
        settings: { ...scene.weather.effects.rain.settings, intensity: 0.35, opacity: 0.42 }
      }
    }
  };
  scene.environment = {
    effects: [
      {
        id: "visual-smoke-effect",
        name: "Smoke Effect",
        kind: "circle",
        effect: "smoke",
        points: [{ x: 920, y: 470 }],
        radius: 120,
        visibleInPlayer: true
      }
    ]
  };
  scene.tokens = [
    {
      id: "visual-smoke-token-1",
      name: "Smoke Token",
      assetId: tokenAsset.id,
      position: { x: 480, y: 320 },
      size: { width: 1, height: 1 },
      sizePreset: "medium",
      mask: "circle",
      borderColor: "#7aa2f7",
      borderStyle: "solid",
      borderWidth: 8,
      borderWidthPreset: "thin",
      footprintVisible: true,
      hidden: false,
      visibleInPlayer: true,
      conditions: [{ id: "poisoned", visibleInPlayer: true }]
    }
  ];
  scene.drawings = [
    {
      id: "visual-smoke-drawing",
      name: "Smoke Drawing",
      kind: "rectangle",
      points: [
        { x: 160, y: 430 },
        { x: 420, y: 610 }
      ],
      color: "#f6d365",
      opacity: 1,
      strokeWidth: 6,
      fillColor: "#f6d365",
      fillOpacity: 0.16,
      visibleInPlayer: true
    },
    {
      id: "visual-smoke-template",
      name: "Smoke Template",
      kind: "circle",
      points: [{ x: 720, y: 220 }],
      color: "#7dcfff",
      opacity: 1,
      strokeWidth: 4,
      fillColor: "#7dcfff",
      fillOpacity: 0.18,
      templateEffect: "plain",
      templateWidth: 4,
      templateFootprintVisible: true,
      measurementLabelVisible: true,
      visibleInPlayer: true
    }
  ];
  scene.turnOrder = {
    ...scene.turnOrder,
    active: true,
    playerViewVisible: true,
    entries: [
      {
        id: "visual-smoke-turn",
        name: "Smoke Token",
        initiative: 18,
        visibleInPlayer: true,
        tokenId: "visual-smoke-token-1",
        assetId: tokenAsset.id
      }
    ],
    currentEntryId: "visual-smoke-turn"
  };

  campaign.assets = [mapAsset, tokenAsset];
  campaign.scenes = [{ id: scene.id, name: scene.name, file: `${scene.id}.scene.json`, mapAssetId: scene.mapAssetId, weather: scene.weather }];
  campaign.players = [
    {
      id: "visual-smoke-player",
      name: "Player",
      color: "#7aa2f7",
      defaultSeatEdge: "bottom",
      defaultSeatPosition: 0.5,
      visibleInPlayer: true
    }
  ];

  options.registerAssetPaths(campaign);
  const projection = projectSceneForPlayer(campaign, scene, { showPlayerSeatIndicators: true });
  const liveEvents: LiveTableEvent[] = [
    { id: "visual-smoke-ping", type: "ping", point: { x: 640, y: 360 }, size: 1.4, color: "#ffd84d", visibleInPlayer: true, createdAt: Date.now() },
    {
      id: "visual-smoke-dice",
      type: "dice",
      die: "d20",
      result: 17,
      label: "17",
      formula: "1d20",
      seed: 58,
      playerDiceDisplay: "panel",
      playerPresentation: "result",
      createdAt: Date.now()
    }
  ];
  return { campaign, scene, projection, liveEvents };
}

async function waitForPlayerWindow(options: VisualSmokeTestOptions): Promise<BrowserWindow> {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const playerWindow = options.getPlayerWindow();
    if (playerWindow && !playerWindow.isDestroyed()) {
      if (!playerWindow.webContents.isLoading()) {
        return playerWindow;
      }
      await onceWebContentsLoaded(playerWindow);
      return playerWindow;
    }
    await waitForTimeout(50);
  }
  throw new Error("Timed out waiting for Player View window.");
}

function onceWebContentsLoaded(win: BrowserWindow): Promise<void> {
  if (!win.webContents.isLoading()) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for webContents load."));
    }, 10000);
    const cleanup = () => {
      clearTimeout(timeout);
      win.webContents.off("did-finish-load", onLoad);
      win.webContents.off("did-fail-load", onFail);
    };
    const onLoad = () => {
      cleanup();
      resolve();
    };
    const onFail = (_event: unknown, errorCode: number, errorDescription: string) => {
      cleanup();
      reject(new Error(`Window failed to load: ${errorCode} ${errorDescription}`));
    };
    win.webContents.once("did-finish-load", onLoad);
    win.webContents.once("did-fail-load", onFail);
  });
}

async function waitForVisualSmokeCanvas(win: BrowserWindow): Promise<void> {
  const result = await win.webContents.executeJavaScript(`new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      const canvas = document.querySelector(".player-scene-layer-current .scene-canvas");
      if (canvas && canvas.width > 1 && canvas.height > 1) {
        resolve(true);
        return;
      }
      if (Date.now() - startedAt > 10000) {
        reject(new Error("Timed out waiting for Player View scene canvas."));
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  })`);
  if (result !== true) {
    throw new Error("Player View scene canvas was not ready.");
  }
}

async function waitForPlayerSelector(win: BrowserWindow, selector: string): Promise<void> {
  const result = await win.webContents.executeJavaScript(`new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      if (document.querySelector(${JSON.stringify(selector)})) {
        resolve(true);
        return;
      }
      if (Date.now() - startedAt > 10000) {
        reject(new Error("Timed out waiting for selector ${selector}."));
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  })`);
  if (result !== true) {
    throw new Error(`Player View selector ${selector} was not ready.`);
  }
}

async function getSceneCanvasMetrics(win: BrowserWindow): Promise<{ ok: boolean; reason: string; width: number; height: number; sampledPixels: number; distinctColors: number; nonTransparentPixels: number }> {
  return win.webContents.executeJavaScript(`(() => {
    const canvas = document.querySelector(".player-scene-layer-current .scene-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      return { ok: false, reason: "Scene canvas was not found.", width: 0, height: 0, sampledPixels: 0, distinctColors: 0, nonTransparentPixels: 0 };
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return { ok: false, reason: "Scene canvas 2D context was not available.", width: canvas.width, height: canvas.height, sampledPixels: 0, distinctColors: 0, nonTransparentPixels: 0 };
    }
    const width = canvas.width;
    const height = canvas.height;
    const stepX = Math.max(1, Math.floor(width / 32));
    const stepY = Math.max(1, Math.floor(height / 18));
    const colors = new Set();
    let sampledPixels = 0;
    let nonTransparentPixels = 0;
    for (let y = 0; y < height; y += stepY) {
      for (let x = 0; x < width; x += stepX) {
        const pixel = context.getImageData(x, y, 1, 1).data;
        sampledPixels += 1;
        if (pixel[3] > 0) {
          nonTransparentPixels += 1;
        }
        colors.add([pixel[0], pixel[1], pixel[2], pixel[3]].join(","));
      }
    }
    const distinctColors = colors.size;
    const ok = width >= 640 && height >= 360 && nonTransparentPixels > sampledPixels * 0.7 && distinctColors >= 8;
    return { ok, reason: ok ? "" : "Scene canvas did not render enough nonblank visual detail.", width, height, sampledPixels, distinctColors, nonTransparentPixels };
  })()`);
}

async function getTestPatternMetrics(win: BrowserWindow): Promise<{ ok: boolean; reason: string; hasGridCanvas: boolean; hasTitle: boolean; hasCorners: boolean }> {
  return win.webContents.executeJavaScript(`(() => {
    const canvas = document.querySelector(".player-test-pattern-grid-canvas");
    const hasGridCanvas = canvas instanceof HTMLCanvasElement && canvas.width > 1 && canvas.height > 1;
    const hasTitle = document.body.innerText.includes("Visual Smoke Test Pattern");
    const hasCorners = document.querySelectorAll(".player-test-pattern-corner").length === 4;
    const ok = hasGridCanvas && hasTitle && hasCorners;
    return { ok, reason: ok ? "" : "Player test pattern did not render expected grid/title/corners.", hasGridCanvas, hasTitle, hasCorners };
  })()`);
}

async function getPlayerOverlayMetrics(win: BrowserWindow): Promise<{ ok: boolean; reason: string; hasDiceOverlay: boolean; hasTurnOrderBar: boolean; hasPlayerSeat: boolean }> {
  return win.webContents.executeJavaScript(`(() => {
    const hasDiceOverlay = Boolean(document.querySelector(".dice-roll-overlay .dice-roll-card"));
    const turnOrderBar = document.querySelector(".turn-order-player-bar");
    const hasTurnOrderBar = Boolean(turnOrderBar && turnOrderBar.textContent?.includes("18"));
    const hasPlayerSeat = Boolean(document.querySelector(".player-seat-indicator"));
    const ok = hasDiceOverlay && hasTurnOrderBar && hasPlayerSeat;
    return {
      ok,
      reason: ok ? "" : "Player View overlays did not render expected dice, turn order, and seat indicators.",
      hasDiceOverlay,
      hasTurnOrderBar,
      hasPlayerSeat
    };
  })()`);
}

async function captureWindowPng(win: BrowserWindow, outputPath: string): Promise<void> {
  const image = await win.webContents.capturePage();
  await writeFile(outputPath, image.toPNG());
}

function waitForTimeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
