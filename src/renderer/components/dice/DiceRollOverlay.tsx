import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import type { DiceDisplayMode, DicePanelEdge, DicePanelFacing, DiceSceneSize, LiveTableEvent } from "../../../shared/localvtt";
import { DICE_EVENT_DURATION_MS, DICE_HISTORY_DURATION_MS, formatDiceRollSummary, formatDieLabel, getDiceRollTone, getDieSides } from "../../lib/dice";

type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;
type DiceVisual = NonNullable<DiceRollEvent["dice"]>[number];
const DICE_SETTLE_DURATION_MS = 2800;

export function DiceRollOverlay({ events, mode }: { events: DiceRollEvent[]; mode: "gm" | "player" }) {
  const activeEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((event) => now - event.createdAt <= DICE_EVENT_DURATION_MS).slice(0, 1);
  }, [events]);
  const historyEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((event) => getDiceDisplayMode(event, mode) !== "panel" && now - event.createdAt <= DICE_HISTORY_DURATION_MS && now - event.createdAt >= getDiceRevealDelay(event, mode))
      .slice(0, 6);
  }, [events, mode]);
  const activePanelVisible = activeEvents.some((event) => getDiceDisplayMode(event, mode) === "panel");

  if (activeEvents.length === 0 && historyEvents.length === 0) {
    return null;
  }
  const overlayDisplayMode = activeEvents.some((event) => getDiceDisplayMode(event, mode) === "scene") ? "scene" : "panel";
  const compactEvent = activeEvents.find((event) => getDiceDisplayMode(event, mode) !== "scene");
  const panelPlacement = compactEvent ? getDicePanelPlacement(compactEvent, mode) : null;

  return (
    <div className={getDiceRollOverlayClassName(overlayDisplayMode, panelPlacement)} style={panelPlacement ? getDicePanelOverlayStyle(panelPlacement) : undefined} aria-live="polite">
      {activeEvents.map((event) => (
        <DiceRollCard key={event.id} event={event} mode={mode} />
      ))}
      {!activePanelVisible && historyEvents.length > 0 && (
        <div className="dice-roll-history" aria-label="Recent dice rolls">
          {historyEvents.map((event) => (
            <div key={event.id} className={`dice-roll-history-item dice-roll-tone-${getDiceRollTone(event)}`}>
              <span>{getRollSummary(event)}</span>
              <strong>{event.label}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiceRollCard({ event, mode }: { event: DiceRollEvent; mode: "gm" | "player" }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const displayMode = getDiceDisplayMode(event, mode);
  const show3d = displayMode !== "results";
  const sceneRoll = displayMode === "scene";
  const panelPlacement = displayMode === "panel" || displayMode === "results" ? getDicePanelPlacement(event, mode) : null;
  const revealDelay = getDiceRevealDelay(event, mode);
  const [resultVisible, setResultVisible] = useState(revealDelay === 0);
  const [shuffleTick, setShuffleTick] = useState(0);
  const tone = resultVisible ? getDiceRollTone(event) : "normal";
  const visualCount = getVisualDice(event).length;

  useEffect(() => {
    if (revealDelay === 0) {
      setResultVisible(true);
      return;
    }
    setResultVisible(false);
    const reveal = window.setTimeout(() => setResultVisible(true), revealDelay);
    return () => window.clearTimeout(reveal);
  }, [event.id, revealDelay]);

  useEffect(() => {
    if (displayMode !== "results" || resultVisible) {
      return;
    }
    setShuffleTick(0);
    const shuffle = window.setInterval(() => setShuffleTick((tick) => tick + 1), 72);
    return () => window.clearInterval(shuffle);
  }, [displayMode, event.id, resultVisible]);

  useEffect(() => {
    if (!show3d) {
      return;
    }
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 100);
    camera.position.set(0, sceneRoll ? 0.15 : 0.25, sceneRoll ? 10.5 : 6);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x7aa2f7, 1.4);
    rimLight.position.set(-4, -2, 3);
    scene.add(rimLight);

    const visuals = getVisualDice(event);
    const layout = getDicePoolLayout(visuals.length, sceneRoll ? "scene" : "panel", getDiceSceneSize(event, mode));
    const dice = visuals.map((visual, index) => {
      const die = createDieMesh(visual);
      const position = getDicePoolPosition(index, layout);
      die.position.set(position.x, position.y, 0);
      die.scale.setScalar(layout.scale);
      die.rotation.set(seedRange(visual.seed, 0, Math.PI), seedRange(visual.seed, 1, Math.PI), seedRange(visual.seed, 2, Math.PI));
      scene.add(die);
      return {
        die,
        visual,
        baseX: die.position.x,
        baseY: die.position.y,
        baseScale: die.scale.x,
        startQuaternion: die.quaternion.clone(),
        finalQuaternion: new THREE.Quaternion().setFromEuler(getSettledRotation(visual))
      };
    });

    const start = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const tumbleProgress = Math.min(1, elapsed / 2800);
      const settleProgress = easeOutCubic(tumbleProgress);
      dice.forEach(({ die, visual, baseX, baseY, baseScale, startQuaternion, finalQuaternion }, index) => {
        const offsetElapsed = Math.max(0, elapsed - index * 120);
        const spinTurns = 6 + Math.floor(seedRange(visual.seed, 7, 4));
        const tumbleRotation = new THREE.Euler(
          Math.PI * 2 * spinTurns * (1 - settleProgress),
          Math.PI * 2 * (spinTurns + 1) * (1 - settleProgress),
          Math.PI * 2 * (spinTurns - 1) * (1 - settleProgress)
        );
        die.quaternion.copy(startQuaternion).slerp(finalQuaternion, settleProgress).multiply(new THREE.Quaternion().setFromEuler(tumbleRotation));
        const bounce = Math.abs(Math.sin(offsetElapsed / 125)) * 0.42 * (1 - settleProgress) * baseScale;
        die.position.set(baseX, baseY + bounce - 0.08 * settleProgress, 0);
        const arrivalPulse = Math.sin(Math.min(1, offsetElapsed / 480) * Math.PI) * 0.1 + Math.sin(Math.min(1, Math.max(0, offsetElapsed - 2700) / 360) * Math.PI) * 0.08;
        die.scale.setScalar(baseScale * (1 + arrivalPulse));
      });
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver(() => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(mount);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      dice.forEach(({ die }) => {
        scene.remove(die);
        die.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
            object.geometry.dispose();
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach(disposeMaterial);
          }
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [event, mode, sceneRoll, show3d]);

  return (
    <div className={getDiceRollCardClassName(displayMode, tone, visualCount, panelPlacement)}>
      {show3d && <div ref={mountRef} className="dice-roll-canvas" aria-hidden="true" />}
      {(resultVisible || displayMode === "results") && (
        <div className={resultVisible ? "dice-roll-result" : "dice-roll-result dice-roll-result-rolling"}>
          <span>{resultVisible ? getRollSummary(event) : getRollingSummary(event)}</span>
          <strong>{resultVisible ? event.label : getShuffledRollLabel(event, shuffleTick)}</strong>
        </div>
      )}
    </div>
  );
}

function getDiceDisplayMode(event: DiceRollEvent, mode: "gm" | "player"): DiceDisplayMode {
  const displayMode = mode === "gm" ? event.gmDiceDisplay : event.playerDiceDisplay;
  if (displayMode) {
    return displayMode;
  }
  const presentation = mode === "gm" ? event.gmPresentation : event.playerPresentation;
  return (presentation ?? event.presentation) === "3d" ? "panel" : "results";
}

function getDiceRevealDelay(event: DiceRollEvent, mode: "gm" | "player"): number {
  if (getDiceDisplayMode(event, mode) !== "results") {
    return DICE_SETTLE_DURATION_MS;
  }
  return getDiceDisplayMode(event, mode === "gm" ? "player" : "gm") === "results" ? 0 : DICE_SETTLE_DURATION_MS;
}

function getDiceSceneSize(event: DiceRollEvent, mode: "gm" | "player"): DiceSceneSize {
  return (mode === "gm" ? event.gmDiceSceneSize : event.playerDiceSceneSize) ?? "md";
}

type DicePanelPlacement = {
  advanced: boolean;
  edge: DicePanelEdge;
  facing: DicePanelFacing;
  position: number;
};

function getDicePanelPlacement(event: DiceRollEvent, mode: "gm" | "player"): DicePanelPlacement {
  return {
    advanced: (mode === "gm" ? event.gmDicePanelAdvanced : event.playerDicePanelAdvanced) ?? false,
    edge: (mode === "gm" ? event.gmDicePanelEdge : event.playerDicePanelEdge) ?? "top",
    facing: (mode === "gm" ? event.gmDicePanelFacing : event.playerDicePanelFacing) ?? "inward",
    position: clampUnitNumber((mode === "gm" ? event.gmDicePanelPosition : event.playerDicePanelPosition) ?? 0.5)
  };
}

function getVisualDice(event: DiceRollEvent): DiceVisual[] {
  return event.dice ?? [{ die: event.die, result: event.result, label: event.label, seed: event.seed }];
}

function getRollSummary(event: DiceRollEvent): string {
  return formatDiceRollSummary(event);
}

function getRollingSummary(event: DiceRollEvent): string {
  const prefix = event.rollLabel ? `${event.rollLabel}: ` : "";
  if (event.formula) {
    return `${prefix}${event.formula}`;
  }
  const dice = getVisualDice(event);
  if (dice.length <= 1) {
    return `${prefix}${formatDieLabel(event.die)}`;
  }
  return `${prefix}${dice.map((die) => formatDieLabel(die.die)).join(" + ")}`;
}

function getShuffledRollLabel(event: DiceRollEvent, tick: number): string {
  const dice = getVisualDice(event);
  if (event.die === "coin" && dice.length === 1) {
    return seedRange(event.seed + tick, 30, 1) < 0.5 ? "Heads" : "Tails";
  }
  const total = dice.reduce((sum, die, index) => {
    if (die.kept === false) {
      return sum;
    }
    return sum + getShuffledDieValue(die.die, die.seed, tick, index);
  }, 0);
  return String(total);
}

function getShuffledDieValue(die: DiceVisual["die"], seed: number, tick: number, index: number): number {
  if (die === "coin") {
    return seedRange(seed + tick, index + 31, 1) < 0.5 ? 1 : 2;
  }
  if (die === "d00") {
    return Math.floor(seedRange(seed + tick, index + 31, 10)) * 10;
  }
  return Math.floor(seedRange(seed + tick, index + 31, getDieSides(die))) + 1;
}

function getDiceRollOverlayClassName(displayMode: "panel" | "scene", placement: DicePanelPlacement | null): string {
  if (displayMode === "scene") {
    return "dice-roll-overlay dice-roll-overlay-scene";
  }
  if (!placement) {
    return "dice-roll-overlay";
  }
  return ["dice-roll-overlay", placement.advanced ? `dice-roll-overlay-panel dice-roll-overlay-panel-${placement.edge}` : "dice-roll-overlay-panel dice-roll-overlay-panel-center"].filter(Boolean).join(" ");
}

function getDicePanelOverlayStyle(placement: DicePanelPlacement): CSSProperties {
  if (!placement.advanced) {
    return {};
  }
  const position = `${placement.position * 100}%`;
  if (placement.edge === "top" || placement.edge === "bottom") {
    return { left: position, [placement.edge]: "18px" };
  }
  return { top: position, [placement.edge]: "18px" };
}

function clampUnitNumber(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function getDiceRollCardClassName(displayMode: DiceDisplayMode, tone: string, visualCount: number, panelPlacement: DicePanelPlacement | null): string {
  const poolClass = visualCount > 8 ? "dice-roll-card-pool-lg" : visualCount > 4 ? "dice-roll-card-pool-md" : "";
  const displayClass = displayMode === "results" ? "dice-roll-card dice-roll-card-result-only" : displayMode === "scene" ? "dice-roll-card dice-roll-card-scene" : "dice-roll-card";
  return [
    displayClass,
    `dice-roll-tone-${tone}`,
    displayMode === "scene" ? "" : poolClass,
    panelPlacement?.advanced ? `dice-roll-card-panel-${panelPlacement.edge}` : "",
    panelPlacement?.advanced ? `dice-roll-card-panel-facing-${panelPlacement.facing}` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

type DicePoolLayout = {
  count: number;
  columns: number;
  rows: number;
  scale: number;
  xSpacing: number;
  ySpacing: number;
};

function getDicePoolLayout(count: number, displayMode: "panel" | "scene", sceneSize: DiceSceneSize = "md"): DicePoolLayout {
  if (displayMode === "scene") {
    const sizeScale = getSceneDiceSizeScale(sceneSize);
    if (count <= 1) {
      return scaleDicePoolLayout({ count, columns: 1, rows: 1, scale: 0.5, xSpacing: 1.2, ySpacing: 1.02 }, sizeScale);
    }
    if (count <= 2) {
      return scaleDicePoolLayout({ count, columns: count, rows: 1, scale: 0.44, xSpacing: 1.0, ySpacing: 1.2 }, sizeScale);
    }
    if (count <= 4) {
      return scaleDicePoolLayout({ count, columns: count, rows: 1, scale: 0.36, xSpacing: 0.72, ySpacing: 1.2 }, sizeScale);
    }
    if (count <= 8) {
      return scaleDicePoolLayout({ count, columns: Math.ceil(count / 2), rows: 2, scale: 0.28, xSpacing: 0.54, ySpacing: 0.58 }, sizeScale);
    }
    return scaleDicePoolLayout({ count, columns: 4, rows: Math.ceil(count / 4), scale: 0.22, xSpacing: 0.42, ySpacing: 0.46 }, sizeScale);
  }
  if (count <= 1) {
    return { count, columns: 1, rows: 1, scale: 1, xSpacing: 1.2, ySpacing: 1.02 };
  }
  if (count <= 2) {
    return { count, columns: count, rows: 1, scale: 0.82, xSpacing: 1.4, ySpacing: 1 };
  }
  if (count <= 4) {
    return { count, columns: count, rows: 1, scale: 0.66, xSpacing: 0.98, ySpacing: 0.92 };
  }
  if (count <= 8) {
    return { count, columns: Math.ceil(count / 2), rows: 2, scale: 0.52, xSpacing: 0.78, ySpacing: 0.88 };
  }
  return { count, columns: 4, rows: Math.ceil(count / 4), scale: 0.42, xSpacing: 0.66, ySpacing: 0.72 };
}

function getSceneDiceSizeScale(size: DiceSceneSize): number {
  const scales = {
    xs: 0.55,
    sm: 0.75,
    md: 1,
    lg: 1.35,
    xl: 1.75
  } satisfies Record<DiceSceneSize, number>;
  return scales[size];
}

function scaleDicePoolLayout(layout: DicePoolLayout, scale: number): DicePoolLayout {
  return {
    ...layout,
    scale: layout.scale * scale,
    xSpacing: layout.xSpacing * scale,
    ySpacing: layout.ySpacing * scale
  };
}

function getDicePoolPosition(index: number, layout: DicePoolLayout): { x: number; y: number } {
  const row = Math.floor(index / layout.columns);
  const column = index % layout.columns;
  const columnsInRow = row === layout.rows - 1 ? Math.max(1, indexCountInLastRow(layout, row)) : layout.columns;
  const centeredColumn = column - (columnsInRow - 1) / 2;
  const centeredRow = row - (layout.rows - 1) / 2;
  return {
    x: centeredColumn * layout.xSpacing,
    y: -centeredRow * layout.ySpacing + (layout.rows > 1 ? 0.24 : 0)
  };
}

function indexCountInLastRow(layout: DicePoolLayout, row: number): number {
  if (layout.rows === 1 || row !== layout.rows - 1) {
    return layout.columns;
  }
  const remainder = layout.count % layout.columns;
  return remainder === 0 ? layout.columns : remainder;
}

function createDieMesh(event: DiceVisual): THREE.Group {
  const group = new THREE.Group();
  const geometry = createDieGeometry(event.die);
  const material = new THREE.MeshStandardMaterial({
    color: getDieColor(event.die),
    roughness: 0.48,
    metalness: 0.1,
    flatShading: true,
    side: THREE.DoubleSide,
    transparent: event.kept === false,
    opacity: event.kept === false ? 0.42 : 1
  });
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: event.kept === false ? 0.16 : 0.36 });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
  group.add(edges);
  createDieFaceLabels(event, geometry).forEach((faceLabel) => group.add(faceLabel));
  return group;
}

function getSettledRotation(event: DiceVisual): THREE.Euler {
  const geometry = createDieGeometry(event.die);
  const resultVector = getResultFacingVector(event, geometry);
  geometry.dispose();
  if (!resultVector) {
    const base = (event.result % 8) * (Math.PI / 4);
    const tilt = event.die === "coin" || event.die === "d2" ? Math.PI / 2 : Math.PI * 0.12;
    return new THREE.Euler(tilt + seedRange(event.seed, 3, 0.12), base + seedRange(event.seed, 4, 0.18), seedRange(event.seed, 5, 0.16), "XYZ");
  }
  const target = new THREE.Vector3(0, 0, 1);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(resultVector.normalize(), target);
  const twist = new THREE.Quaternion().setFromAxisAngle(target, seedRange(event.seed, 6, Math.PI * 2));
  quaternion.premultiply(twist);
  return new THREE.Euler().setFromQuaternion(quaternion, "XYZ");
}

function createDieGeometry(die: DiceVisual["die"]): THREE.BufferGeometry {
  if (die === "coin" || die === "d2") {
    return new THREE.CylinderGeometry(1.28, 1.28, 0.32, 48, 1);
  }
  if (die === "d4") {
    return new THREE.TetrahedronGeometry(1.45, 0);
  }
  if (die === "d6") {
    return new THREE.BoxGeometry(1.9, 1.9, 1.9);
  }
  if (die === "d8") {
    return new THREE.OctahedronGeometry(1.55, 0);
  }
  if (die === "d10" || die === "d00") {
    return createPentagonalTrapezohedronGeometry();
  }
  if (die === "d12") {
    return new THREE.DodecahedronGeometry(1.48, 0);
  }
  return new THREE.IcosahedronGeometry(1.48, 0);
}

type FaceLabelPlacement = {
  label: string;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  size?: number;
  up?: THREE.Vector3;
};

type GeometryTriangle = {
  normal: THREE.Vector3;
  center: THREE.Vector3;
  vertices: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
};

const D10_POLE_HEIGHT = 1.32;

function createDieFaceLabels(event: DiceVisual, geometry: THREE.BufferGeometry): THREE.Mesh[] {
  const labels = getDieFaceLabelPlacements(event.die, geometry);
  const textColor = getDieFaceTextColor(event.die);
  const opacity = event.kept === false ? 0.38 : 0.92;
  return labels.map(({ label, position, normal, size, up }) => makeFaceLabelMesh(label, position, normal, size ?? 0.56, textColor, opacity, up, event.die));
}

function getResultFacingVector(event: DiceVisual, geometry: THREE.BufferGeometry): THREE.Vector3 | null {
  const resultLabel = getVisualResultFaceLabel(event);
  const matchingFaces = getDieFaceLabelPlacements(event.die, geometry).filter((placement) => placement.label === resultLabel);
  if (matchingFaces.length === 0) {
    return null;
  }
  if (event.die === "d4") {
    return matchingFaces.reduce((sum, placement) => sum.add(placement.position), new THREE.Vector3()).normalize();
  }
  return matchingFaces[0].normal.clone().normalize();
}

function getVisualResultFaceLabel(event: DiceVisual): string {
  if (event.die === "d10" && event.result === 10) {
    return "0";
  }
  if (event.die === "d00" && event.result === 0) {
    return "00";
  }
  return event.label;
}

function getDieFaceLabelPlacements(die: DiceVisual["die"], geometry: THREE.BufferGeometry): FaceLabelPlacement[] {
  if (die === "coin") {
    return [
      { label: "Heads", position: new THREE.Vector3(0, 0.175, 0), normal: new THREE.Vector3(0, 1, 0), size: 1.5 },
      { label: "Tails", position: new THREE.Vector3(0, -0.175, 0), normal: new THREE.Vector3(0, -1, 0), size: 1.5 }
    ];
  }
  if (die === "d2") {
    return [
      { label: "1", position: new THREE.Vector3(0, 0.175, 0), normal: new THREE.Vector3(0, 1, 0), size: 1.22 },
      { label: "2", position: new THREE.Vector3(0, -0.175, 0), normal: new THREE.Vector3(0, -1, 0), size: 1.22 }
    ];
  }
  if (die === "d4") {
    return getD4TopReadLabelPlacements(geometry);
  }
  if (die === "d6") {
    return [
      { label: "1", position: new THREE.Vector3(0, 0, 0.956), normal: new THREE.Vector3(0, 0, 1), size: 1.18 },
      { label: "2", position: new THREE.Vector3(0.956, 0, 0), normal: new THREE.Vector3(1, 0, 0), size: 1.18 },
      { label: "3", position: new THREE.Vector3(0, 0.956, 0), normal: new THREE.Vector3(0, 1, 0), size: 1.18 },
      { label: "4", position: new THREE.Vector3(0, -0.956, 0), normal: new THREE.Vector3(0, -1, 0), size: 1.18 },
      { label: "5", position: new THREE.Vector3(-0.956, 0, 0), normal: new THREE.Vector3(-1, 0, 0), size: 1.18 },
      { label: "6", position: new THREE.Vector3(0, 0, -0.956), normal: new THREE.Vector3(0, 0, -1), size: 1.18 }
    ];
  }
  const labels = getDieFaceLabels(die);
  const placements = getGeometryFacePlacements(geometry).slice(0, labels.length);
  if (die === "d10" || die === "d00") {
    return getD10StyleFacePlacements(die, placements);
  }
  return getOppositeSumFacePlacements(die, placements);
}

function getDieFaceLabels(die: DiceVisual["die"]): string[] {
  if (die === "d00") {
    return ["00", "10", "20", "30", "40", "50", "60", "70", "80", "90"];
  }
  if (die === "d10") {
    return ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  }
  const sides = die === "d4" ? 4 : die === "d8" ? 8 : die === "d12" ? 12 : 20;
  return Array.from({ length: sides }, (_, index) => String(index + 1));
}

function getPolyhedralFaceLabelSize(die: DiceVisual["die"]): number {
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

function getOppositeSumFacePlacements(die: DiceVisual["die"], placements: Array<Omit<FaceLabelPlacement, "label" | "size">>): FaceLabelPlacement[] {
  const oppositeSum = die === "d8" ? 9 : die === "d12" ? 13 : die === "d20" ? 21 : 0;
  const pairs = getOppositeFacePairs(placements);
  return pairs.flatMap(([first, second], index) => {
    const lowValue = index + 1;
    const highValue = oppositeSum - lowValue;
    const [lowPlacement, highPlacement] = first.position.y >= second.position.y ? [first, second] : [second, first];
    return [
      {
        ...lowPlacement,
        label: String(lowValue),
        size: getPolyhedralFaceLabelSize(die),
        up: die === "d8" ? getPoleFaceLabelUp(lowPlacement.position) : undefined
      },
      {
        ...highPlacement,
        label: String(highValue),
        size: getPolyhedralFaceLabelSize(die),
        up: die === "d8" ? getPoleFaceLabelUp(highPlacement.position) : undefined
      }
    ];
  });
}

function getD10StyleFacePlacements(die: "d10" | "d00", placements: Array<Omit<FaceLabelPlacement, "label" | "size">>): FaceLabelPlacement[] {
  const pairs = getOppositeFacePairs(placements);
  const oddValues = [1, 3, 5, 7, 9];
  return pairs.flatMap(([first, second], index) => {
    const oddValue = oddValues[index] ?? 9;
    const evenValue = 9 - oddValue;
    const [oddPlacement, evenPlacement] = first.position.y >= second.position.y ? [first, second] : [second, first];
    return [
      {
        ...oddPlacement,
        label: formatD10StyleFaceLabel(die, oddValue),
        size: getPolyhedralFaceLabelSize(die),
        up: getPoleFaceLabelUp(oddPlacement.position)
      },
      {
        ...evenPlacement,
        label: formatD10StyleFaceLabel(die, evenValue),
        size: getPolyhedralFaceLabelSize(die),
        up: getPoleFaceLabelUp(evenPlacement.position)
      }
    ];
  });
}

function formatD10StyleFaceLabel(die: "d10" | "d00", value: number): string {
  if (die === "d10") {
    return value === 0 ? "0" : String(value);
  }
  return value === 0 ? "00" : String(value * 10);
}

function getOppositeFacePairs(placements: Array<Omit<FaceLabelPlacement, "label" | "size">>): Array<[Omit<FaceLabelPlacement, "label" | "size">, Omit<FaceLabelPlacement, "label" | "size">]> {
  const available = [...placements].sort(compareFacePlacements);
  const pairs: Array<[Omit<FaceLabelPlacement, "label" | "size">, Omit<FaceLabelPlacement, "label" | "size">]> = [];
  while (available.length > 1) {
    const first = available.shift();
    if (!first) {
      break;
    }
    let oppositeIndex = 0;
    let oppositeDot = Number.POSITIVE_INFINITY;
    available.forEach((candidate, index) => {
      const dot = first.normal.dot(candidate.normal);
      if (dot < oppositeDot) {
        oppositeDot = dot;
        oppositeIndex = index;
      }
    });
    const [second] = available.splice(oppositeIndex, 1);
    pairs.push([first, second]);
  }
  return pairs.sort(([firstA, secondA], [firstB, secondB]) => compareFacePlacements(getPairSortPlacement(firstA, secondA), getPairSortPlacement(firstB, secondB)));
}

function getPairSortPlacement(first: Omit<FaceLabelPlacement, "label" | "size">, second: Omit<FaceLabelPlacement, "label" | "size">): Omit<FaceLabelPlacement, "label" | "size"> {
  return first.position.y >= second.position.y ? first : second;
}

function compareFacePlacements(first: Omit<FaceLabelPlacement, "label" | "size">, second: Omit<FaceLabelPlacement, "label" | "size">): number {
  return second.position.y - first.position.y || second.position.z - first.position.z || second.position.x - first.position.x;
}

function getD4TopReadLabelPlacements(geometry: THREE.BufferGeometry): FaceLabelPlacement[] {
  const triangles = getGeometryTriangles(geometry);
  const vertexLabels = getD4VertexLabels(triangles.flatMap((triangle) => triangle.vertices));
  return triangles.flatMap((triangle) =>
    triangle.vertices.map((vertex) => ({
      label: vertexLabels.get(getVertexKey(vertex)) ?? "1",
      position: vertex.clone().lerp(triangle.center, 0.36).add(triangle.normal.clone().multiplyScalar(0.02)),
      normal: triangle.normal.clone(),
      size: 0.57,
      up: vertex.clone().sub(triangle.center).normalize()
    }))
  );
}

function getPoleFaceLabelUp(position: THREE.Vector3): THREE.Vector3 {
  const pole = new THREE.Vector3(0, position.y >= 0 ? D10_POLE_HEIGHT : -D10_POLE_HEIGHT, 0);
  return pole.sub(position).normalize();
}

function getD4VertexLabels(vertices: THREE.Vector3[]): Map<string, string> {
  const uniqueVertices = new Map<string, THREE.Vector3>();
  vertices.forEach((vertex) => uniqueVertices.set(getVertexKey(vertex), vertex.clone()));
  return new Map(
    [...uniqueVertices.entries()]
      .sort(([, a], [, b]) => b.y - a.y || b.z - a.z || b.x - a.x)
      .map(([key], index) => [key, String(index + 1)])
  );
}

function getVertexKey(vertex: THREE.Vector3): string {
  return `${vertex.x.toFixed(4)},${vertex.y.toFixed(4)},${vertex.z.toFixed(4)}`;
}

function getGeometryFacePlacements(geometry: THREE.BufferGeometry): Array<Omit<FaceLabelPlacement, "label" | "size">> {
  const triangles = getGeometryTriangles(geometry);
  const clusters: Array<{ normal: THREE.Vector3; center: THREE.Vector3; count: number }> = [];
  triangles.forEach(({ normal, center }) => {
    const cluster = clusters.find((candidate) => candidate.normal.dot(normal) > 0.996);
    if (cluster) {
      cluster.normal.add(normal).normalize();
      cluster.center.add(center);
      cluster.count += 1;
      return;
    }
    clusters.push({ normal: normal.clone(), center: center.clone(), count: 1 });
  });
  return clusters
    .map((cluster) => {
      const center = cluster.center.multiplyScalar(1 / cluster.count);
      const normal = cluster.normal.normalize();
      return {
        normal,
        position: center.add(normal.clone().multiplyScalar(0.018))
      };
    })
    .sort((a, b) => b.position.y - a.position.y || b.position.z - a.position.z || b.position.x - a.position.x);
}

function getGeometryTriangles(geometry: THREE.BufferGeometry): GeometryTriangle[] {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const triangles: GeometryTriangle[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const edgeA = new THREE.Vector3();
  const edgeB = new THREE.Vector3();
  const readVertex = (vertexIndex: number, target: THREE.Vector3) => target.fromBufferAttribute(position, vertexIndex);
  const triangleCount = index ? index.count / 3 : position.count / 3;
  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
    const vertexA = index ? index.getX(triangleIndex * 3) : triangleIndex * 3;
    const vertexB = index ? index.getX(triangleIndex * 3 + 1) : triangleIndex * 3 + 1;
    const vertexC = index ? index.getX(triangleIndex * 3 + 2) : triangleIndex * 3 + 2;
    readVertex(vertexA, a);
    readVertex(vertexB, b);
    readVertex(vertexC, c);
    const normal = edgeA.subVectors(b, a).cross(edgeB.subVectors(c, a)).normalize();
    const center = new THREE.Vector3().addVectors(a, b).add(c).multiplyScalar(1 / 3);
    if (normal.dot(center) < 0) {
      normal.multiplyScalar(-1);
    }
    if (normal.lengthSq() > 0) {
      triangles.push({ normal: normal.clone(), center, vertices: [a.clone(), b.clone(), c.clone()] });
    }
  }
  return triangles;
}

function makeFaceLabelMesh(label: string, position: THREE.Vector3, normal: THREE.Vector3, size: number, color: string, opacity: number, up?: THREE.Vector3, die?: DiceVisual["die"]): THREE.Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = die === "coin" ? 384 : 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.font = `${label.length > 2 ? 800 : 950} ${getFaceLabelFontSize(label)}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = label.length > 2 ? 9 : 11;
    context.strokeStyle = color === "#f8fafc" ? "rgba(4, 8, 14, 0.42)" : "rgba(255, 255, 255, 0.2)";
    context.strokeText(label, canvas.width / 2, 132);
    context.fillText(label, canvas.width / 2, 132);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.FrontSide
  });
  const aspect = canvas.width / canvas.height;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size * aspect, size), material);
  mesh.position.copy(position);
  mesh.quaternion.copy(getFaceLabelQuaternion(normal, up));
  mesh.renderOrder = 2;
  return mesh;
}

function getFaceLabelQuaternion(normal: THREE.Vector3, up?: THREE.Vector3): THREE.Quaternion {
  const faceNormal = normal.clone().normalize();
  if (!up) {
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), faceNormal);
  }
  const labelUp = up.clone().projectOnPlane(faceNormal).normalize();
  if (labelUp.lengthSq() === 0) {
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), faceNormal);
  }
  const labelRight = labelUp.clone().cross(faceNormal).normalize();
  const matrix = new THREE.Matrix4().makeBasis(labelRight, labelUp, faceNormal);
  return new THREE.Quaternion().setFromRotationMatrix(matrix);
}

function getFaceLabelFontSize(label: string): number {
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

function createPentagonalTrapezohedronGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const faces: number[] = [];
  const capHeight = D10_POLE_HEIGHT;
  const ringRadius = 1.08;
  const ringHeight = (capHeight * (1 - Math.cos(Math.PI / 5))) / (1 + Math.cos(Math.PI / 5));
  const top = new THREE.Vector3(0, capHeight, 0);
  const bottom = new THREE.Vector3(0, -capHeight, 0);
  const upper: THREE.Vector3[] = [];
  const lower: THREE.Vector3[] = [];
  for (let index = 0; index < 5; index += 1) {
    const upperAngle = (index / 5) * Math.PI * 2;
    const lowerAngle = upperAngle + Math.PI / 5;
    upper.push(new THREE.Vector3(Math.cos(upperAngle) * ringRadius, ringHeight, Math.sin(upperAngle) * ringRadius));
    lower.push(new THREE.Vector3(Math.cos(lowerAngle) * ringRadius, -ringHeight, Math.sin(lowerAngle) * ringRadius));
  }
  const points = [top, bottom, ...upper, ...lower];
  for (const point of points) {
    vertices.push(point.x, point.y, point.z);
  }
  for (let index = 0; index < 5; index += 1) {
    const next = (index + 1) % 5;
    const upperA = 2 + index;
    const upperB = 2 + next;
    const lowerA = 7 + index;
    const lowerPrev = 7 + ((index + 4) % 5);
    faces.push(0, upperA, lowerA, 0, lowerA, upperB, 1, lowerA, upperA, 1, upperA, lowerPrev);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  return geometry;
}

function getDieColor(die: DiceVisual["die"]): number {
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
  } satisfies Record<DiceVisual["die"], number>;
  return colors[die];
}

function getDieFaceTextColor(die: DiceVisual["die"]): string {
  if (die === "d4" || die === "d12" || die === "d20") {
    return "#10131a";
  }
  return "#f8fafc";
}

function disposeMaterial(material: THREE.Material) {
  const textureMaterial = material as THREE.Material & { map?: THREE.Texture | null };
  textureMaterial.map?.dispose();
  material.dispose();
}

function seedRange(seed: number, offset: number, max: number): number {
  const value = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
  return (value - Math.floor(value)) * max;
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}
