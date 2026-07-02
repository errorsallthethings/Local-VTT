import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type { DiceDisplayMode, LiveTableEvent } from "../../../shared/localvtt";
import {
  DICE_FACE_HIGHLIGHT_DURATION_MS,
  DICE_SCENE_MAX_ROLL_MS,
  DICE_SCENE_MIN_ROLL_MS,
  DICE_SCENE_RESULT_TIMEOUT_MS,
  createDieGeometry,
  getDiceDisplayMode,
  getDiceEventDuration,
  getDicePanelPlacement,
  getDicePoolLayout,
  getDiceRevealDelay,
  getDiceSceneSize,
  getDiceSettleDuration,
  getDieColor,
  getDieFaceTextColor,
  getDieFaceLabelPlacements,
  getDisplayedRollTone,
  getPanelDiceLanding,
  getDisplayedRollLabel,
  getDisplayedRollSummary,
  getPublishedSceneResolvedLabel,
  getCoinCenterPush,
  getFaceHighlightColor,
  getFaceLabelQuaternion,
  getFaceLabelFontSize,
  getGeometryTriangles,
  getD4VertexLabels,
  getPhysicsColliderScale,
  getResolvedDisplayedLabel,
  getResolvedDisplayedSummary,
  getRollModifier,
  getRollingSummary,
  getUpdatedSceneDieSettleState,
  getVectorSpeed,
  getResolvedDiceRollResult,
  getResolvedEventDice,
  getSceneDiceLaunchParameters,
  getSceneDiceLanding,
  getSceneInitialRotation,
  getSceneRollBounds,
  getSceneThrowVelocity,
  getScaledGeometryPoints,
  getShuffledRollLabel,
  getStaticRollResult,
  isSceneDieResting as isSceneDieRestingByMotion,
  shouldNudgeCoinOffEdge,
  getVisualDice,
  getVisualResultFaceLabel,
  shouldUnderlineResultLabel,
  type DicePanelPlacement,
  type FaceLabelPlacement,
  type SceneRollBounds,
  type DiceVisualRoll,
  type ResolvedDiceResult
} from "../../lib/dice";
import { logRendererWarning } from "../../lib/rendererDiagnostics";

type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;
type DiceVisual = DiceVisualRoll;
const RAPIER_READY = RAPIER.init();
let sharedDiceRenderer: THREE.WebGLRenderer | null = null;

function acquireDiceRenderer(mount: HTMLDivElement): THREE.WebGLRenderer {
  if (!sharedDiceRenderer || sharedDiceRenderer.getContext().isContextLost()) {
    sharedDiceRenderer?.dispose();
    sharedDiceRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    sharedDiceRenderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  sharedDiceRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  sharedDiceRenderer.setSize(mount.clientWidth, mount.clientHeight);
  mount.appendChild(sharedDiceRenderer.domElement);
  return sharedDiceRenderer;
}

function releaseDiceRenderer(renderer: THREE.WebGLRenderer) {
  renderer.renderLists.dispose();
  renderer.clear(true, true, true);
  renderer.domElement.remove();
}

export function DiceRollOverlay({ events, mode, onDiceRollResolved }: { events: DiceRollEvent[]; mode: "gm" | "player"; onDiceRollResolved?: (event: DiceRollEvent) => void }) {
  const activeEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((event) => getDiceDisplayMode(event, mode) !== "hidden" && now - event.createdAt <= getDiceEventDuration(event, mode)).slice(0, 1);
  }, [events, mode]);
  if (activeEvents.length === 0) {
    return null;
  }
  const overlayDisplayMode = activeEvents.some((event) => getDiceDisplayMode(event, mode) === "scene") ? "scene" : "panel";
  const compactEvent = activeEvents.find((event) => getDiceDisplayMode(event, mode) !== "scene");
  const panelPlacement = compactEvent ? getDicePanelPlacement(compactEvent, mode) : null;

  return (
    <div className={getDiceRollOverlayClassName(overlayDisplayMode, panelPlacement)} style={panelPlacement ? getDicePanelOverlayStyle(panelPlacement) : undefined} aria-live="polite">
      {activeEvents.map((event) => (
        <DiceRollCard key={event.id} event={event} mode={mode} onDiceRollResolved={onDiceRollResolved} />
      ))}
    </div>
  );
}

function DiceRollCard({ event, mode, onDiceRollResolved }: { event: DiceRollEvent; mode: "gm" | "player"; onDiceRollResolved?: (event: DiceRollEvent) => void }) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onDiceRollResolvedRef = useRef(onDiceRollResolved);
  const displayMode = getDiceDisplayMode(event, mode);
  const show3d = displayMode === "panel" || displayMode === "scene";
  const sceneRoll = displayMode === "scene";
  const sceneResult = displayMode === "scene-result";
  const panelPlacement = displayMode === "panel" || displayMode === "results" || sceneResult ? getDicePanelPlacement(event, mode) : null;
  const revealDelay = getDiceRevealDelay(event, mode);
  const [resultVisible, setResultVisible] = useState(revealDelay === 0);
  const [shuffleTick, setShuffleTick] = useState(0);
  const [resolvedPhysicsResult, setResolvedPhysicsResult] = useState<ResolvedDiceResult | null>(null);
  const [sceneResultFailed, setSceneResultFailed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const tone = getDisplayedRollTone(event, displayMode, resultVisible, resolvedPhysicsResult);
  const visualCount = getVisualDice(event).length;

  useEffect(() => {
    onDiceRollResolvedRef.current = onDiceRollResolved;
  }, [onDiceRollResolved]);

  useEffect(() => {
    setDismissed(false);
  }, [event.id]);

  useEffect(() => {
    if (displayMode === "scene") {
      setResultVisible(false);
      setResolvedPhysicsResult(null);
      return;
    }
    if (sceneResult && !event.sceneResolvedLabel) {
      setResultVisible(false);
      return;
    }
    if (revealDelay === 0) {
      setResultVisible(true);
      return;
    }
    setResultVisible(false);
    setResolvedPhysicsResult(null);
    const reveal = window.setTimeout(() => setResultVisible(true), revealDelay);
    return () => window.clearTimeout(reveal);
  }, [displayMode, event.id, event.sceneResolvedLabel, revealDelay, sceneResult]);

  useEffect(() => {
    if (!sceneResult || event.sceneResolvedLabel) {
      setSceneResultFailed(false);
      return;
    }
    setSceneResultFailed(false);
    const timeout = window.setTimeout(() => setSceneResultFailed(true), DICE_SCENE_RESULT_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [event.id, event.sceneResolvedLabel, sceneResult]);

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

    const renderer = acquireDiceRenderer(mount);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / Math.max(1, mount.clientHeight), 0.1, 100);
    camera.position.set(0, sceneRoll ? 0.15 : 0, sceneRoll ? 10.5 : 8.2);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x7aa2f7, 1.4);
    rimLight.position.set(-4, -2, 3);
    scene.add(rimLight);

    const visuals = getVisualDice(event);
    const layout = getDicePoolLayout(visuals.length, sceneRoll ? "scene" : "panel", getDiceSceneSize(event, mode));
    const visibleBounds = getVisibleWorldBounds(mount, camera);
    const sceneBounds = sceneRoll ? getSceneRollBounds(visibleBounds) : null;
    let physicsWorld: RAPIER.World | null = null;
    let physicsReady = !sceneRoll;
    let physicsAccumulator = 0;
    let resolvedPhysics = false;
    let disposed = false;
    const dice = visuals.map((visual, index) => {
      const die = createDieMesh(visual);
      const landing = sceneRoll ? getSceneDiceLanding(index, layout, visual, visibleBounds) : getPanelDiceLanding(index, layout);
      die.position.set(landing.startX, landing.startY, 0);
      die.scale.setScalar(layout.scale);
      die.rotation.set(seedRange(visual.seed, 0, Math.PI), seedRange(visual.seed, 1, Math.PI), seedRange(visual.seed, 2, Math.PI));
      scene.add(die);
      return {
        die,
        visual,
        baseX: landing.baseX,
        baseY: landing.baseY,
        startX: landing.startX,
        startY: landing.startY,
        x: landing.startX,
        y: landing.startY,
        vx: sceneRoll ? getSceneThrowVelocity(landing.startX, landing.baseX, visual.seed, index, visual) : 0,
        vy: sceneRoll ? getSceneThrowVelocity(landing.startY, landing.baseY, visual.seed, index + 8, visual) : 0,
        radius: layout.scale * 0.94,
        body: null as RAPIER.RigidBody | null,
        baseScale: die.scale.x,
        startQuaternion: die.quaternion.clone(),
        finalQuaternion: new THREE.Quaternion().setFromEuler(getSettledRotation(visual)),
        stableLabel: null as string | null,
        stableStartedAt: 0,
        coinEdgeNudgeCount: 0,
        coinEdgeLastNudgedAt: 0,
        highlight: null as THREE.Object3D | null,
        highlightStartedAt: 0
      };
    });
    if (sceneRoll && sceneBounds) {
      void RAPIER_READY.then(() => {
        if (disposed) {
          return;
        }
        physicsWorld = createScenePhysicsWorld(sceneBounds);
        const world = physicsWorld;
        dice.forEach((entry, index) => {
          entry.body = createSceneDiceBody(world, entry.startX, entry.startY, entry.vx, entry.vy, entry.radius, entry.visual, index);
        });
        physicsReady = true;
      });
    }

    const start = performance.now();
    const sceneSettleDuration = getDiceSettleDuration(event);
    let previousFrame = start;
    let frame = 0;
    let appliedResolvedVisualState = false;
    const animate = (now: number) => {
      const elapsed = now - start;
      const tumbleProgress = Math.min(1, elapsed / 2800);
      const settleProgress = easeOutCubic(tumbleProgress);
      const delta = Math.min(0.034, Math.max(0.001, (now - previousFrame) / 1000));
      previousFrame = now;
      if (sceneRoll && sceneBounds) {
        if (!physicsReady || !physicsWorld) {
          renderer.render(scene, camera);
          frame = window.requestAnimationFrame(animate);
          return;
        }
        physicsAccumulator = stepScenePhysicsWorld(physicsWorld, physicsAccumulator + delta);
        dice.forEach(syncSceneDiceFromPhysics);
        dice.forEach((entry, index) => nudgeCoinOffEdge(entry, index, now, sceneBounds));
        const settledResult = elapsed >= DICE_SCENE_MIN_ROLL_MS ? getSettledSceneRollResult(event, dice, now) : null;
        if (settledResult && !resolvedPhysics) {
          resolvedPhysics = true;
          applyResolvedDiceVisualState(dice, settledResult);
          dice.forEach((entry, index) => startDieFaceHighlight(entry, settledResult.dice[index]?.label, now));
          setResolvedPhysicsResult(settledResult);
          setResultVisible(true);
          publishSceneRollResult(event, mode, settledResult, onDiceRollResolvedRef.current);
        }
        if (!resolvedPhysics && elapsed >= Math.max(sceneSettleDuration, DICE_SCENE_MAX_ROLL_MS)) {
          const settledDice = dice.every((entry) => isSceneDieResting(entry));
          if (!settledDice) {
            frame = window.requestAnimationFrame(animate);
            renderer.render(scene, camera);
            return;
          }
          resolvedPhysics = true;
          const resolvedResult = getPhysicsRollResult(event, dice);
          applyResolvedDiceVisualState(dice, resolvedResult);
          dice.forEach((entry, index) => startDieFaceHighlight(entry, resolvedResult.dice[index]?.label, now));
          setResolvedPhysicsResult(resolvedResult);
          setResultVisible(true);
          publishSceneRollResult(event, mode, resolvedResult, onDiceRollResolvedRef.current);
        }
      } else {
        dice.forEach(({ die, visual, baseX, baseY, startX, startY, baseScale, startQuaternion, finalQuaternion }, index) => {
          const offsetElapsed = Math.max(0, elapsed - index * 120);
          const throwProgress = easeOutCubic(Math.min(1, offsetElapsed / 2300));
          const spinTurns = 6 + Math.floor(seedRange(visual.seed, 7, 4));
          const tumbleRotation = new THREE.Euler(
            Math.PI * 2 * spinTurns * (1 - settleProgress),
            Math.PI * 2 * (spinTurns + 1) * (1 - settleProgress),
            Math.PI * 2 * (spinTurns - 1) * (1 - settleProgress)
          );
          die.quaternion.copy(startQuaternion).slerp(finalQuaternion, settleProgress).multiply(new THREE.Quaternion().setFromEuler(tumbleRotation));
          const bounce = Math.abs(Math.sin(offsetElapsed / 125)) * 0.42 * (1 - settleProgress) * baseScale;
          const x = startX + (baseX - startX) * throwProgress;
          const y = startY + (baseY - startY) * throwProgress + bounce - 0.08 * settleProgress;
          die.position.set(x, y, 0);
          const arrivalPulse = Math.sin(Math.min(1, offsetElapsed / 480) * Math.PI) * 0.1 + Math.sin(Math.min(1, Math.max(0, offsetElapsed - 2700) / 360) * Math.PI) * 0.08;
          die.scale.setScalar(baseScale * (1 + arrivalPulse));
          if (!appliedResolvedVisualState && elapsed >= revealDelay - 120) {
            appliedResolvedVisualState = true;
            applyResolvedDiceVisualState(dice, getStaticRollResult(event));
          }
          if (elapsed >= revealDelay - 120) {
            startDieFaceHighlight(dice[index], getVisualResultFaceLabel(visual), now);
          }
        });
      }
      dice.forEach((entry) => updateDieFaceHighlight(entry, now));
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
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      physicsWorld?.free();
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
      releaseDiceRenderer(renderer);
    };
  }, [event, mode, revealDelay, sceneRoll, show3d]);

  if (dismissed) {
    return null;
  }

  const resultContent = getDiceResultContent(event, resultVisible, resolvedPhysicsResult, shuffleTick, sceneResult, sceneResultFailed);
  const resultClassName = resultVisible ? "dice-roll-result" : "dice-roll-result dice-roll-result-rolling";
  const showSceneResultRing = mode === "player" && displayMode === "scene" && resultVisible;
  const showPanelResultRing = displayMode === "panel" && resultVisible;

  return (
    <div className={`${getDiceRollCardClassName(displayMode, tone, visualCount, panelPlacement)}${sceneResultFailed ? " dice-roll-card-warning" : ""}${showSceneResultRing ? " dice-roll-card-result-ring-active" : ""}${showPanelResultRing ? " dice-roll-card-panel-ring-active" : ""}`}>
      {show3d && <div ref={mountRef} className="dice-roll-canvas" aria-hidden="true" />}
      {(resultVisible || displayMode === "results" || sceneResult) && !showSceneResultRing && !showPanelResultRing && (
        <div className={resultClassName}>
          <span>{resultContent.summary}</span>
          <strong>{resultContent.label}</strong>
          {sceneResultFailed && (
            <button type="button" className="dice-roll-result-dismiss" onClick={() => setDismissed(true)}>
              Dismiss
            </button>
          )}
        </div>
      )}
      {showSceneResultRing && <DiceResultRing resultContent={resultContent} showCore />}
      {showPanelResultRing && <DiceResultRing resultContent={resultContent} compact />}
    </div>
  );
}

function DiceResultRing({ resultContent, compact = false, showCore = false }: { resultContent: { summary: string; label: string }; compact?: boolean; showCore?: boolean }) {
  const underline = shouldUnderlineResultLabel(resultContent.label);
  return (
    <div className={compact ? "dice-roll-result-ring dice-roll-result-ring-panel" : "dice-roll-result-ring"} aria-label={`${resultContent.summary}: ${resultContent.label}`}>
      <div className="dice-roll-result-ring-orbit" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index} className={underline ? "dice-roll-result-underline" : undefined} style={{ "--dice-ring-angle": `${index * 45}deg` } as CSSProperties}>
            {resultContent.label}
          </span>
        ))}
      </div>
      {showCore && (
        <div className={resultContent.label.length > 3 ? "dice-roll-result-ring-core dice-roll-result-ring-core-long" : "dice-roll-result-ring-core"}>
          <span>{resultContent.summary}</span>
          <strong className={underline ? "dice-roll-result-underline" : undefined}>{resultContent.label}</strong>
        </div>
      )}
    </div>
  );
}

function getDiceResultContent(
  event: DiceRollEvent,
  resultVisible: boolean,
  resolvedPhysicsResult: ResolvedDiceResult | null,
  shuffleTick: number,
  sceneResult: boolean,
  sceneResultFailed: boolean
): { summary: string; label: string } {
  if (sceneResult && !event.sceneResolvedLabel) {
    return sceneResultFailed
      ? { summary: "Player View did not return a scene roll result.", label: "No result" }
      : { summary: "Waiting for Player View", label: "Rolling" };
  }
  if (!resultVisible) {
    return {
      summary: getRollingSummary(event),
      label: getShuffledRollLabel(event, shuffleTick)
    };
  }
  return {
    summary: resolvedPhysicsResult ? getResolvedDisplayedSummary(event, resolvedPhysicsResult) : getDisplayedRollSummary(event),
    label: resolvedPhysicsResult ? getResolvedDisplayedLabel(event, resolvedPhysicsResult) : getDisplayedRollLabel(event)
  };
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

function getDiceRollCardClassName(displayMode: DiceDisplayMode, tone: string, visualCount: number, panelPlacement: DicePanelPlacement | null): string {
  const poolClass = visualCount > 8 ? "dice-roll-card-pool-lg" : visualCount > 4 ? "dice-roll-card-pool-md" : "";
  const displayClass = displayMode === "results" || displayMode === "scene-result" ? "dice-roll-card dice-roll-card-result-only" : displayMode === "scene" ? "dice-roll-card dice-roll-card-scene" : "dice-roll-card";
  return [
    displayClass,
    displayMode === "panel" ? "dice-roll-card-panel-3d" : "",
    displayMode === "scene-result" ? "dice-roll-card-scene-result" : "",
    `dice-roll-tone-${tone}`,
    displayMode === "scene" ? "" : poolClass,
    panelPlacement?.advanced ? `dice-roll-card-panel-${panelPlacement.edge}` : "",
    panelPlacement?.advanced ? `dice-roll-card-panel-facing-${panelPlacement.facing}` : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function getVisibleWorldBounds(mount: HTMLElement, camera: THREE.PerspectiveCamera): { width: number; height: number } {
  const aspect = mount.clientWidth / Math.max(1, mount.clientHeight);
  const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.position.z;
  return { width: height * aspect, height };
}

function createScenePhysicsWorld(bounds: SceneRollBounds): RAPIER.World {
  const world = new RAPIER.World({ x: 0, y: 0, z: -28 });
  world.integrationParameters.numSolverIterations = 12;
  const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, -0.82));
  world.createCollider(RAPIER.ColliderDesc.cuboid(Math.max(0.1, (bounds.maxX - bounds.minX) / 2), Math.max(0.1, (bounds.maxY - bounds.minY) / 2), 0.08).setFriction(1.18).setRestitution(0.2), floorBody);
  const ceilingBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, 0, 4.2));
  world.createCollider(RAPIER.ColliderDesc.cuboid(Math.max(0.1, (bounds.maxX - bounds.minX) / 2), Math.max(0.1, (bounds.maxY - bounds.minY) / 2), 0.12).setFriction(0.7).setRestitution(0.16), ceilingBody);
  const wallHeight = 6.5;
  const wallThickness = 0.2;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const halfWidth = (bounds.maxX - bounds.minX) / 2;
  const halfHeight = (bounds.maxY - bounds.minY) / 2;
  const wallColliders = [
    { x: bounds.minX - wallThickness, y: centerY, sx: wallThickness, sy: halfHeight + wallThickness },
    { x: bounds.maxX + wallThickness, y: centerY, sx: wallThickness, sy: halfHeight + wallThickness },
    { x: centerX, y: bounds.minY - wallThickness, sx: halfWidth + wallThickness, sy: wallThickness },
    { x: centerX, y: bounds.maxY + wallThickness, sx: halfWidth + wallThickness, sy: wallThickness }
  ];
  wallColliders.forEach((wall) => {
    const wallBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(wall.x, wall.y, 0));
    world.createCollider(RAPIER.ColliderDesc.cuboid(wall.sx, wall.sy, wallHeight).setFriction(0.9).setRestitution(0.34), wallBody);
  });
  return world;
}

function createSceneDiceBody(world: RAPIER.World, startX: number, startY: number, vx: number, vy: number, radius: number, visual: DiceVisual, index: number): RAPIER.RigidBody {
  const launch = getSceneDiceLaunchParameters(visual, index, radius);
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(startX, startY, launch.startZ)
      .setRotation(getSceneInitialRotation(visual, index))
      .setLinvel(vx, vy, launch.launchZ)
      .setAngvel(launch.angularVelocity)
      .setLinearDamping(0.32)
      .setAngularDamping(launch.angularDamping)
      .setCcdEnabled(true)
      .setAdditionalSolverIterations(10)
  );
  const collider = createDiePhysicsCollider(visual.die, radius);
  world.createCollider(collider.setDensity(2.35).setFriction(1.16).setRestitution(0.2), body);
  return body;
}

function createDiePhysicsCollider(die: DiceVisual["die"], radius: number): RAPIER.ColliderDesc {
  const geometry = createDieGeometry(die);
  const points = getScaledGeometryPoints(geometry, getPhysicsColliderScale(die, radius));
  geometry.dispose();
  return RAPIER.ColliderDesc.roundConvexHull(points, Math.max(0.018, radius * 0.035)) ?? RAPIER.ColliderDesc.ball(radius);
}

function stepScenePhysicsWorld(world: RAPIER.World, accumulator: number): number {
  const fixedStep = 1 / 120;
  let remaining = Math.min(accumulator, fixedStep * 8);
  while (remaining >= fixedStep) {
    world.timestep = fixedStep;
    world.step();
    remaining -= fixedStep;
  }
  return remaining;
}

function syncSceneDiceFromPhysics(entry: {
  body: RAPIER.RigidBody | null;
  die: THREE.Group;
  x: number;
  y: number;
  vx: number;
  vy: number;
}): void {
  if (!entry.body) {
    return;
  }
  const translation = entry.body.translation();
  const rotation = entry.body.rotation();
  const velocity = entry.body.linvel();
  entry.x = translation.x;
  entry.y = translation.y;
  entry.vx = velocity.x;
  entry.vy = velocity.y;
  entry.die.position.set(translation.x, translation.y, translation.z);
  entry.die.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
}

function getSettledSceneRollResult(
  event: DiceRollEvent,
  dice: Array<{
    body: RAPIER.RigidBody | null;
    die: THREE.Group;
    visual: DiceVisual;
    stableLabel: string | null;
    stableStartedAt: number;
  }>,
  now: number
): ResolvedDiceResult | null {
  const allSettled = dice.every((entry) => updateSceneDieSettleState(entry, now));
  return allSettled ? getPhysicsRollResult(event, dice) : null;
}

function updateSceneDieSettleState(
  entry: {
    body: RAPIER.RigidBody | null;
    die: THREE.Group;
    visual: DiceVisual;
    stableLabel: string | null;
    stableStartedAt: number;
  },
  now: number
): boolean {
  const label = getPhysicsVisualResult(entry.visual, entry.die.quaternion).label;
  const update = getUpdatedSceneDieSettleState({
    label,
    now,
    resting: isSceneDieResting(entry),
    stableLabel: entry.stableLabel,
    stableStartedAt: entry.stableStartedAt
  });
  entry.stableLabel = update.stableLabel;
  entry.stableStartedAt = update.stableStartedAt;
  return update.settled;
}

function isSceneDieResting(entry: {
  body: RAPIER.RigidBody | null;
  die: THREE.Group;
  visual: DiceVisual;
}): boolean {
  if (!entry.body) {
    return false;
  }
  const velocity = entry.body.linvel();
  const angularVelocity = entry.body.angvel();
  return isSceneDieRestingByMotion({
    angularSpeed: getVectorSpeed(angularVelocity),
    coinFaceNormalZ: entry.visual.die === "coin" ? getCoinFaceNormal(entry.die).z : undefined,
    die: entry.visual.die,
    linearSpeed: getVectorSpeed(velocity)
  });
}

function getCoinFaceNormal(die: THREE.Group): THREE.Vector3 {
  return new THREE.Vector3(0, 1, 0).applyQuaternion(die.quaternion);
}

function nudgeCoinOffEdge(
  entry: {
    body: RAPIER.RigidBody | null;
    die: THREE.Group;
    visual: DiceVisual;
    x: number;
    y: number;
    coinEdgeNudgeCount: number;
    coinEdgeLastNudgedAt: number;
  },
  index: number,
  now: number,
  bounds: SceneRollBounds
): void {
  if (!entry.body || entry.visual.die !== "coin" || entry.coinEdgeNudgeCount >= 8 || now - entry.coinEdgeLastNudgedAt < 650) {
    return;
  }
  const faceNormal = getCoinFaceNormal(entry.die);
  const velocity = entry.body.linvel();
  const angularVelocity = entry.body.angvel();
  const linearSpeed = getVectorSpeed(velocity);
  const angularSpeed = getVectorSpeed(angularVelocity);
  const translation = entry.body.translation();
  if (
    !shouldNudgeCoinOffEdge({
      angularSpeed,
      coinEdgeNudgeCount: entry.coinEdgeNudgeCount,
      die: entry.visual.die,
      faceNormalZ: faceNormal.z,
      linearSpeed,
      msSinceLastNudge: now - entry.coinEdgeLastNudgedAt,
      translationZ: translation.z,
      velocityZ: velocity.z
    })
  ) {
    return;
  }
  const directionSeed = seedRange(entry.visual.seed, 130 + index + entry.coinEdgeNudgeCount * 11, 1) < 0.5 ? -1 : 1;
  const targetNormal = new THREE.Vector3(0, 0, directionSeed);
  const torqueAxis = faceNormal.clone().cross(targetNormal);
  if (torqueAxis.lengthSq() < 0.0001) {
    return;
  }
  torqueAxis.normalize().multiplyScalar(0.024);
  entry.body.applyTorqueImpulse({ x: torqueAxis.x, y: torqueAxis.y, z: torqueAxis.z }, true);
  const centerPush = getCoinCenterPush(entry, bounds, linearSpeed, angularSpeed);
  if (centerPush) {
    entry.body.applyImpulse(centerPush, true);
  }
  entry.coinEdgeNudgeCount += 1;
  entry.coinEdgeLastNudgedAt = now;
}

function createDieMesh(event: DiceVisual): THREE.Group {
  const group = new THREE.Group();
  const geometry = createDieGeometry(event.die);
  const material = new THREE.MeshStandardMaterial({
    color: getDieColor(event.die),
    roughness: 0.48,
    metalness: 0.1,
    flatShading: true,
    side: THREE.DoubleSide
  });
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.36 });
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

function createDieFaceLabels(event: DiceVisual, geometry: THREE.BufferGeometry): THREE.Mesh[] {
  const labels = getDieFaceLabelPlacements(event.die, geometry);
  const textColor = getDieFaceTextColor(event.die);
  return labels.map(({ label, position, normal, size, up, underline }) => makeFaceLabelMesh(label, position, normal, size ?? 0.56, textColor, 0.92, up, event.die, underline));
}

function startDieFaceHighlight(
  entry: {
    die: THREE.Group;
    visual: DiceVisual;
    highlight: THREE.Object3D | null;
    highlightStartedAt: number;
  },
  label: string | undefined,
  now: number
): void {
  if (entry.highlight || !label) {
    return;
  }
  const highlight = createDieFaceHighlight(entry.visual.die, label);
  if (!highlight) {
    return;
  }
  entry.highlight = highlight;
  entry.highlightStartedAt = now;
  entry.die.add(highlight);
}

function updateDieFaceHighlight(
  entry: {
    highlight: THREE.Object3D | null;
    highlightStartedAt: number;
  },
  now: number
): void {
  if (!entry.highlight) {
    return;
  }
  const progress = Math.min(1, Math.max(0, (now - entry.highlightStartedAt) / DICE_FACE_HIGHLIGHT_DURATION_MS));
  const pulse = Math.sin(progress * Math.PI * 5) * (1 - progress);
  const opacity = 0.18 + Math.max(0, pulse) * 0.32;
  const scale = 1 + Math.max(0, pulse) * 0.16;
  entry.highlight.scale.setScalar(scale);
  entry.highlight.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if ("opacity" in material) {
          material.opacity = opacity;
        }
      });
    }
  });
  if (progress >= 1) {
    entry.highlight.visible = false;
  }
}

function createDieFaceHighlight(die: DiceVisual["die"], label: string): THREE.Object3D | null {
  const geometry = createDieGeometry(die);
  const matchingPlacements = getDieFaceLabelPlacements(die, geometry).filter((placement) => placement.label === label);
  geometry.dispose();
  if (matchingPlacements.length === 0) {
    return null;
  }
  const group = new THREE.Group();
  const placements = die === "d4" ? matchingPlacements : [matchingPlacements[0]];
  placements.forEach((placement) => {
    group.add(createFaceHighlightMesh(placement, die));
  });
  return group;
}

function createFaceHighlightMesh(placement: FaceLabelPlacement, die: DiceVisual["die"]): THREE.Mesh {
  const radius = die === "d4" ? 0.34 : die === "coin" || die === "d2" ? 0.94 : Math.max(0.34, (placement.size ?? 0.56) * 0.62);
  const geometry = new THREE.CircleGeometry(radius, 40);
  const material = new THREE.MeshBasicMaterial({
    color: getFaceHighlightColor(die),
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(placement.position).add(placement.normal.clone().normalize().multiplyScalar(0.026));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), placement.normal.clone().normalize());
  return mesh;
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

function getPhysicsRollResult(
  event: DiceRollEvent,
  dice: Array<{
    visual: DiceVisual;
    die: THREE.Group;
  }>
): ResolvedDiceResult {
  const resolvedDice = dice.map(({ visual, die }) => getPhysicsVisualResult(visual, die.quaternion));
  return getResolvedDiceRollResult(
    event,
    dice.map(({ visual }) => visual),
    resolvedDice
  );
}

function publishSceneRollResult(event: DiceRollEvent, mode: "gm" | "player", resolvedResult: ResolvedDiceResult, onDiceRollResolved?: (event: DiceRollEvent) => void): void {
  if (event.sceneResolvedLabel) {
    return;
  }
  const modifier = getRollModifier(event);
  const sceneResolvedResult = resolvedResult.result + modifier;
  const sceneResolvedLabel = getPublishedSceneResolvedLabel(event, resolvedResult, sceneResolvedResult);
  const sceneResolvedSummary = modifier === 0 ? resolvedResult.summary : getResolvedDisplayedSummary(event, resolvedResult);
  const resolvedDice = getResolvedEventDice(event, resolvedResult);
  const resolvedEvent = {
    ...event,
    label: sceneResolvedLabel,
    result: sceneResolvedResult,
    dice: resolvedDice,
    sceneResolvedLabel,
    sceneResolvedSummary,
    sceneResolvedResult
  };
  if (mode === "gm") {
    onDiceRollResolved?.(resolvedEvent);
    return;
  }
  if (getDiceDisplayMode(event, "gm") === "scene-result") {
    void window.localVtt.sendLiveTableEvent(resolvedEvent).catch((caught) => {
      logRendererWarning("LOCALVTT_LIVE_TABLE_EVENT_SEND_FAILED", caught);
    });
  }
}

function getPhysicsVisualResult(visual: DiceVisual, quaternion: THREE.Quaternion): { label: string; value: number } {
  if (visual.die === "d4") {
    const label = getPhysicsD4TopLabel(quaternion);
    return { label, value: Number(label) };
  }
  const geometry = createDieGeometry(visual.die);
  const placements = getDieFaceLabelPlacements(visual.die, geometry);
  geometry.dispose();
  const placement = placements.reduce((best, candidate) => {
    const normal = candidate.normal.clone().applyQuaternion(quaternion);
    const bestNormal = best.normal.clone().applyQuaternion(quaternion);
    return normal.z > bestNormal.z ? candidate : best;
  }, placements[0]);
  const label = placement?.label ?? visual.label;
  if (visual.die === "coin") {
    return { label, value: label === "Tails" ? 2 : 1 };
  }
  if (visual.die === "d10") {
    return { label, value: label === "0" ? 10 : Number(label) };
  }
  if (visual.die === "d00") {
    return { label, value: label === "00" ? 100 : Number(label) };
  }
  return { label, value: Number(label) };
}

function applyResolvedDiceVisualState(
  dice: Array<{
    die: THREE.Group;
  }>,
  resolvedResult: ResolvedDiceResult
): void {
  dice.forEach((entry, index) => {
    const kept = resolvedResult.dice[index]?.kept !== false;
    entry.die.traverse((object) => {
      if (object instanceof THREE.LineSegments) {
        setObjectMaterialOpacity(object, kept ? 0.36 : 0.16);
        return;
      }
      if (!(object instanceof THREE.Mesh)) {
        return;
      }
      const opacity = object.material instanceof THREE.MeshStandardMaterial ? (kept ? 1 : 0.42) : kept ? 0.92 : 0.38;
      setObjectMaterialOpacity(object, opacity);
    });
  });
}

function setObjectMaterialOpacity(object: THREE.Mesh | THREE.LineSegments, opacity: number): void {
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  materials.forEach((material) => {
    material.transparent = opacity < 1;
    material.opacity = opacity;
    material.needsUpdate = true;
  });
}

function getPhysicsD4TopLabel(quaternion: THREE.Quaternion): string {
  const geometry = createDieGeometry("d4");
  const triangles = getGeometryTriangles(geometry);
  geometry.dispose();
  const vertexLabels = getD4VertexLabels(triangles.flatMap((triangle) => triangle.vertices));
  const topVertex = [...vertexLabels.keys()]
    .map((key) => {
      const [x, y, z] = key.split(",").map(Number);
      return { key, vertex: new THREE.Vector3(x, y, z).applyQuaternion(quaternion) };
    })
    .sort((first, second) => second.vertex.z - first.vertex.z)[0];
  return topVertex ? (vertexLabels.get(topVertex.key) ?? "1") : "1";
}

function makeFaceLabelMesh(
  label: string,
  position: THREE.Vector3,
  normal: THREE.Vector3,
  size: number,
  color: string,
  opacity: number,
  up?: THREE.Vector3,
  die?: DiceVisual["die"],
  underline = false
): THREE.Mesh {
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
    if (underline) {
      const metrics = context.measureText(label);
      const fontSize = getFaceLabelFontSize(label);
      const underlineWidth = Math.max(fontSize * 0.34, Math.min(metrics.width * 0.62, fontSize * 0.52));
      const underlineY = 132 + fontSize * 0.36;
      context.lineCap = "round";
      context.lineWidth = Math.max(7, fontSize * 0.055);
      context.strokeStyle = color === "#f8fafc" ? "rgba(4, 8, 14, 0.5)" : "rgba(255, 255, 255, 0.24)";
      context.beginPath();
      context.moveTo(canvas.width / 2 - underlineWidth / 2, underlineY);
      context.lineTo(canvas.width / 2 + underlineWidth / 2, underlineY);
      context.stroke();
      context.lineWidth = Math.max(4, fontSize * 0.034);
      context.strokeStyle = color;
      context.beginPath();
      context.moveTo(canvas.width / 2 - underlineWidth / 2, underlineY);
      context.lineTo(canvas.width / 2 + underlineWidth / 2, underlineY);
      context.stroke();
    }
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
