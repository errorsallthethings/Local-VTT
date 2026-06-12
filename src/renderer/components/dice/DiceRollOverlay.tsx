import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { LiveTableEvent } from "../../../shared/localvtt";
import { DICE_EVENT_DURATION_MS, DICE_HISTORY_DURATION_MS, formatDiceRollSummary, getDiceRollTone } from "../../lib/dice";

type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;
type DiceVisual = NonNullable<DiceRollEvent["dice"]>[number];

export function DiceRollOverlay({ events, mode }: { events: DiceRollEvent[]; mode: "gm" | "player" }) {
  const activeEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((event) => now - event.createdAt <= DICE_EVENT_DURATION_MS).slice(0, 1);
  }, [events]);
  const historyEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((event) => now - event.createdAt <= DICE_HISTORY_DURATION_MS).slice(0, 6);
  }, [events]);

  if (activeEvents.length === 0 && historyEvents.length === 0) {
    return null;
  }

  return (
    <div className="dice-roll-overlay" aria-live="polite">
      {activeEvents.map((event) => (
        <DiceRollCard key={event.id} event={event} mode={mode} />
      ))}
      {historyEvents.length > 0 && (
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
  const show3d = getDiceDisplayMode(event, mode) === "panel";
  const tone = getDiceRollTone(event);
  const visualCount = getVisualDice(event).length;

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
    camera.position.set(0, 0.25, 6);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x7aa2f7, 1.4);
    rimLight.position.set(-4, -2, 3);
    scene.add(rimLight);

    const visuals = getVisualDice(event);
    const layout = getDicePoolLayout(visuals.length);
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
        startRotation: die.rotation.clone(),
        finalRotation: getSettledRotation(visual)
      };
    });

    const start = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const tumbleProgress = Math.min(1, elapsed / 2800);
      const settleProgress = easeOutCubic(tumbleProgress);
      dice.forEach(({ die, visual, baseX, baseY, baseScale, startRotation, finalRotation }, index) => {
        const offsetElapsed = Math.max(0, elapsed - index * 120);
        const spinTurns = 6 + Math.floor(seedRange(visual.seed, 7, 4));
        die.rotation.x = startRotation.x + (finalRotation.x - startRotation.x) * settleProgress + Math.PI * 2 * spinTurns * (1 - settleProgress);
        die.rotation.y = startRotation.y + (finalRotation.y - startRotation.y) * settleProgress + Math.PI * 2 * (spinTurns + 1) * (1 - settleProgress);
        die.rotation.z = startRotation.z + (finalRotation.z - startRotation.z) * settleProgress + Math.PI * 2 * (spinTurns - 1) * (1 - settleProgress);
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
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => material.dispose());
          }
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [event, show3d]);

  return (
    <div className={getDiceRollCardClassName(show3d, tone, visualCount)}>
      {show3d && <div ref={mountRef} className="dice-roll-canvas" aria-hidden="true" />}
      <div className="dice-roll-result">
        <span>{getRollSummary(event)}</span>
        <strong>{event.label}</strong>
      </div>
    </div>
  );
}

function getDiceDisplayMode(event: DiceRollEvent, mode: "gm" | "player"): "results" | "panel" | "scene" {
  const displayMode = mode === "gm" ? event.gmDiceDisplay : event.playerDiceDisplay;
  if (displayMode) {
    return displayMode;
  }
  const presentation = mode === "gm" ? event.gmPresentation : event.playerPresentation;
  return (presentation ?? event.presentation) === "3d" ? "panel" : "results";
}

function getVisualDice(event: DiceRollEvent): DiceVisual[] {
  return event.dice ?? [{ die: event.die, result: event.result, label: event.label, seed: event.seed }];
}

function getRollSummary(event: DiceRollEvent): string {
  return formatDiceRollSummary(event);
}

function getDiceRollCardClassName(show3d: boolean, tone: string, visualCount: number): string {
  const poolClass = visualCount > 8 ? "dice-roll-card-pool-lg" : visualCount > 4 ? "dice-roll-card-pool-md" : "";
  return [show3d ? "dice-roll-card" : "dice-roll-card dice-roll-card-result-only", `dice-roll-tone-${tone}`, poolClass].filter(Boolean).join(" ");
}

type DicePoolLayout = {
  count: number;
  columns: number;
  rows: number;
  scale: number;
  xSpacing: number;
  ySpacing: number;
};

function getDicePoolLayout(count: number): DicePoolLayout {
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
  const material = new THREE.MeshStandardMaterial({
    color: getDieColor(event.die),
    roughness: 0.48,
    metalness: 0.1,
    flatShading: true,
    transparent: event.kept === false,
    opacity: event.kept === false ? 0.42 : 1
  });
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: event.kept === false ? 0.16 : 0.36 });
  const geometry = createDieGeometry(event.die);
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
  group.add(edges);

  const label = makeLabelSprite(event.kept === false ? `(${event.label})` : event.label);
  label.position.set(0, -1.75, 0.1);
  group.add(label);
  return group;
}

function getSettledRotation(event: DiceVisual): THREE.Euler {
  const base = (event.result % 8) * (Math.PI / 4);
  const tilt = event.die === "coin" || event.die === "d2" ? Math.PI / 2 : Math.PI * 0.12;
  return new THREE.Euler(tilt + seedRange(event.seed, 3, 0.12), base + seedRange(event.seed, 4, 0.18), seedRange(event.seed, 5, 0.16), "XYZ");
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

function createPentagonalTrapezohedronGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const faces: number[] = [];
  const capHeight = 1.45;
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

function makeLabelSprite(label: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "rgba(8, 12, 18, 0.76)";
    roundRect(context, 20, 22, 216, 84, 18);
    context.fill();
    context.strokeStyle = "rgba(255, 255, 255, 0.28)";
    context.lineWidth = 3;
    roundRect(context, 20, 22, 216, 84, 18);
    context.stroke();
    context.fillStyle = "#f8fafc";
    context.font = "900 54px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, 128, 65);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(1.9, 0.95, 1);
  return sprite;
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
}

function getDieColor(die: DiceVisual["die"]): number {
  const colors = {
    coin: 0xec4899,
    d2: 0xd7dde8,
    d4: 0xf2d35c,
    d6: 0xe8752a,
    d8: 0x2f9d68,
    d10: 0x3b1f5f,
    d00: 0x101010,
    d12: 0x8fc9ff,
    d20: 0xf4f1e8
  } satisfies Record<DiceVisual["die"], number>;
  return colors[die];
}

function seedRange(seed: number, offset: number, max: number): number {
  const value = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
  return (value - Math.floor(value)) * max;
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}
