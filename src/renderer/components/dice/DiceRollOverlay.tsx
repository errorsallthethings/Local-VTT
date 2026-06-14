import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type { DiceDisplayMode, DicePanelEdge, DicePanelFacing, DiceSceneSize, LiveTableEvent } from "../../../shared/localvtt";
import { DICE_EVENT_DURATION_MS, formatDiceRollSummary, formatDieLabel, getDiceRollTone, getDiceVisualTotal, getDieSides, getPercentileTotal, type DiceRollTone } from "../../lib/dice";

type DiceRollEvent = Extract<LiveTableEvent, { type: "dice" }>;
type DiceVisual = NonNullable<DiceRollEvent["dice"]>[number];
const DICE_SETTLE_DURATION_MS = 2800;
const COIN_SCENE_SETTLE_DURATION_MS = 3400;
const DICE_RESULTS_SHUFFLE_DURATION_MS = 900;
const DICE_SCENE_EVENT_DURATION_MS = 12000;
const DICE_SCENE_RESULT_TIMEOUT_MS = 11000;
const DICE_SCENE_MIN_ROLL_MS = 900;
const DICE_SCENE_STABLE_MS = 420;
const DICE_SCENE_MAX_ROLL_MS = 10000;
const DICE_FACE_HIGHLIGHT_DURATION_MS = 1800;
const RAPIER_READY = RAPIER.init();

type ResolvedDiceResult = {
  label: string;
  summary: string;
  result: number;
  dice: Array<{ label: string; value: number }>;
};

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

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

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
    const sceneBounds = sceneRoll ? getSceneRollBounds(mount, camera, layout.scale) : null;
    let physicsWorld: RAPIER.World | null = null;
    let physicsReady = !sceneRoll;
    let physicsAccumulator = 0;
    let resolvedPhysics = false;
    let disposed = false;
    const dice = visuals.map((visual, index) => {
      const die = createDieMesh(visual);
      const landing = sceneRoll ? getSceneDiceLanding(index, layout, visual, mount, camera) : getPanelDiceLanding(index, layout);
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
        vx: sceneRoll ? getSceneThrowVelocity(landing.startX, landing.baseX, visual.seed, index) : 0,
        vy: sceneRoll ? getSceneThrowVelocity(landing.startY, landing.baseY, visual.seed, index + 8) : 0,
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
        const settledResult = elapsed >= DICE_SCENE_MIN_ROLL_MS ? getSettledSceneRollResult(dice, now) : null;
        if (settledResult && !resolvedPhysics) {
          resolvedPhysics = true;
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
          const resolvedResult = getPhysicsRollResult(dice);
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
          if (!resolvedPhysics && elapsed >= revealDelay - 120) {
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
      renderer.dispose();
      renderer.domElement.remove();
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

function getDiceDisplayMode(event: DiceRollEvent, mode: "gm" | "player"): DiceDisplayMode {
  const displayMode = mode === "gm" ? event.gmDiceDisplay : event.playerDiceDisplay;
  if (displayMode) {
    return displayMode;
  }
  const presentation = mode === "gm" ? event.gmPresentation : event.playerPresentation;
  return (presentation ?? event.presentation) === "3d" ? "panel" : "results";
}

function getDiceRevealDelay(event: DiceRollEvent, mode: "gm" | "player"): number {
  const displayMode = getDiceDisplayMode(event, mode);
  if (displayMode === "scene-result") {
    return event.sceneResolvedLabel ? 0 : getDiceSettleDuration(event);
  }
  if (displayMode !== "results") {
    return getDiceSettleDuration(event);
  }
  const pairedDisplayMode = getDiceDisplayMode(event, mode === "gm" ? "player" : "gm");
  return pairedDisplayMode === "panel" || pairedDisplayMode === "scene" ? getDiceSettleDuration(event) : DICE_RESULTS_SHUFFLE_DURATION_MS;
}

function shouldUnderlineResultLabel(label: string): boolean {
  return label === "6" || label === "9";
}

function getDiceSettleDuration(event: DiceRollEvent): number {
  return getVisualDice(event).some((die) => die.die === "coin") ? COIN_SCENE_SETTLE_DURATION_MS : DICE_SETTLE_DURATION_MS;
}

function getDiceEventDuration(event: DiceRollEvent, mode: "gm" | "player"): number {
  const displayMode = getDiceDisplayMode(event, mode);
  return displayMode === "scene" || displayMode === "scene-result" ? DICE_SCENE_EVENT_DURATION_MS : DICE_EVENT_DURATION_MS;
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

function getDisplayedRollSummary(event: DiceRollEvent): string {
  return event.sceneResolvedSummary ?? getRollSummary(event);
}

function getDisplayedRollLabel(event: DiceRollEvent): string {
  return event.sceneResolvedLabel ?? event.label;
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

function getResolvedDisplayedSummary(event: DiceRollEvent, resolvedPhysicsResult: ResolvedDiceResult): string {
  const modifier = getRollModifier(event);
  if (modifier === 0) {
    return resolvedPhysicsResult.summary;
  }
  const modifierLabel = modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;
  return `${resolvedPhysicsResult.summary} ${resolvedPhysicsResult.label} ${modifierLabel}`;
}

function getResolvedDisplayedLabel(event: DiceRollEvent, resolvedPhysicsResult: ResolvedDiceResult): string {
  const modifier = getRollModifier(event);
  if (modifier === 0) {
    return resolvedPhysicsResult.label;
  }
  return String(resolvedPhysicsResult.result + modifier);
}

function getDisplayedRollTone(event: DiceRollEvent, displayMode: DiceDisplayMode, resultVisible: boolean, resolvedPhysicsResult: ResolvedDiceResult | null): DiceRollTone {
  if (!resultVisible) {
    return "normal";
  }
  if (displayMode !== "scene" && displayMode !== "scene-result") {
    return getDiceRollTone(event);
  }
  const label = resolvedPhysicsResult?.label ?? event.sceneResolvedLabel;
  const dice = getVisualDice(event);
  if (dice.some((die) => die.die === "coin")) {
    return "normal";
  }
  if (event.die === "d00" && label) {
    return Number(label) === 100 ? "max" : "normal";
  }
  if (!label || dice.length !== 1) {
    return "normal";
  }
  const die = dice[0]?.die;
  if (die === "d20") {
    if (label === "20") {
      return "critical";
    }
    if (label === "1") {
      return "fumble";
    }
  }
  return "normal";
}

function getRollModifier(event: DiceRollEvent): number {
  const dice = getVisualDice(event);
  if (dice.length === 0) {
    return 0;
  }
  return event.result - getDiceVisualTotal(dice);
}

function getRollingSummary(event: DiceRollEvent): string {
  const prefix = event.rollLabel ? `${event.rollLabel}: ` : "";
  if (event.formula) {
    return `${prefix}${event.formula}`;
  }
  const dice = getVisualDice(event);
  if (event.die === "d00" && hasPercentileDice(dice)) {
    return `${prefix}${formatDieLabel(event.die)}`;
  }
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
  if (event.die === "d00" && hasPercentileDice(dice)) {
    const tens = Math.floor(seedRange(event.seed + tick, 31, 10)) * 10;
    const ones = Math.floor(seedRange(event.seed + tick, 32, 10));
    return String(getPercentileTotal(tens === 0 ? "00" : String(tens), String(ones)));
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

type DicePoolLayout = {
  count: number;
  columns: number;
  rows: number;
  scale: number;
  xSpacing: number;
  ySpacing: number;
};

type DiceLanding = {
  baseX: number;
  baseY: number;
  startX: number;
  startY: number;
};

type SceneRollBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
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
    return { count, columns: count, rows: 1, scale: 0.72, xSpacing: 2.28, ySpacing: 1.1 };
  }
  if (count <= 3) {
    return { count, columns: count, rows: 1, scale: 0.56, xSpacing: 1.72, ySpacing: 1.05 };
  }
  if (count <= 4) {
    return { count, columns: 2, rows: 2, scale: 0.54, xSpacing: 1.62, ySpacing: 1.56 };
  }
  if (count <= 8) {
    return { count, columns: Math.ceil(count / 2), rows: 2, scale: 0.43, xSpacing: 1.34, ySpacing: 1.24 };
  }
  return { count, columns: 4, rows: Math.ceil(count / 4), scale: 0.32, xSpacing: 1.16, ySpacing: 1.08 };
}

function getPanelDiceLanding(index: number, layout: DicePoolLayout): DiceLanding {
  const position = getDicePoolPosition(index, layout);
  return {
    baseX: position.x,
    baseY: position.y,
    startX: position.x,
    startY: position.y
  };
}

function getSceneDiceLanding(index: number, layout: DicePoolLayout, visual: DiceVisual, mount: HTMLElement, camera: THREE.PerspectiveCamera): DiceLanding {
  const arranged = getDicePoolPosition(index, layout);
  const bounds = getVisibleWorldBounds(mount, camera);
  const margin = Math.max(0.62, layout.scale * 1.85);
  const landingWidth = Math.max(margin * 2, bounds.width - margin * 2);
  const landingHeight = Math.max(margin * 2, bounds.height - margin * 2);
  const startMaxX = Math.max(margin, bounds.width / 2 - margin * 1.15);
  const startMaxY = Math.max(margin, bounds.height / 2 - margin * 1.15);
  const jitterX = (seedRange(visual.seed, 20, 1) - 0.5) * Math.min(bounds.width * 0.22, 2.2);
  const jitterY = (seedRange(visual.seed, 21, 1) - 0.5) * Math.min(bounds.height * 0.2, 1.5);
  const baseX = clampNumber(arranged.x + jitterX, -landingWidth / 2 + margin, landingWidth / 2 - margin);
  const baseY = clampNumber(arranged.y + jitterY, -landingHeight / 2 + margin, landingHeight / 2 - margin);
  const edge = Math.floor(seedRange(visual.seed, 22, 4));
  const sideOffset = seedRange(visual.seed, 23, 1) - 0.5;
  if (edge === 0) {
    return { baseX, baseY, startX: sideOffset * startMaxX * 2, startY: startMaxY };
  }
  if (edge === 1) {
    return { baseX, baseY, startX: startMaxX, startY: sideOffset * startMaxY * 2 };
  }
  if (edge === 2) {
    return { baseX, baseY, startX: sideOffset * startMaxX * 2, startY: -startMaxY };
  }
  return { baseX, baseY, startX: -startMaxX, startY: sideOffset * startMaxY * 2 };
}

function getSceneRollBounds(mount: HTMLElement, camera: THREE.PerspectiveCamera, _scale: number): SceneRollBounds {
  const bounds = getVisibleWorldBounds(mount, camera);
  return {
    minX: -bounds.width / 2,
    maxX: bounds.width / 2,
    minY: -bounds.height / 2,
    maxY: bounds.height / 2
  };
}

function getVisibleWorldBounds(mount: HTMLElement, camera: THREE.PerspectiveCamera): { width: number; height: number } {
  const aspect = mount.clientWidth / Math.max(1, mount.clientHeight);
  const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.position.z;
  return { width: height * aspect, height };
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
  const coinLike = visual.die === "coin" || visual.die === "d2";
  const launchZ = coinLike ? 7.4 + seedRange(visual.seed, 50 + index, 2.8) : 6.6 + seedRange(visual.seed, 50 + index, 3.2);
  const angularVelocity = coinLike
    ? {
        x: (seedRange(visual.seed, 60 + index, 2) - 1) * 8 + 38,
        y: (seedRange(visual.seed, 70 + index, 2) - 1) * 2.5,
        z: (seedRange(visual.seed, 80 + index, 2) - 1) * 6
      }
    : {
        x: (seedRange(visual.seed, 60 + index, 2) - 1) * 20 + 30,
        y: (seedRange(visual.seed, 70 + index, 2) - 1) * 18 + 22,
        z: (seedRange(visual.seed, 80 + index, 2) - 1) * 20 + 26
      };
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(startX, startY, 1.02 + radius * (coinLike ? 1.3 : 0.78))
      .setRotation(getSceneInitialRotation(visual, index))
      .setLinvel(vx, vy, launchZ)
      .setAngvel(angularVelocity)
      .setLinearDamping(0.32)
      .setAngularDamping(coinLike ? 0.28 : 0.3)
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

function getPhysicsColliderScale(die: DiceVisual["die"], radius: number): number {
  const baseRadius = die === "d6" ? 0.95 : die === "coin" || die === "d2" ? 1.28 : die === "d4" ? 1.45 : die === "d8" ? 1.55 : die === "d10" || die === "d00" ? 1.32 : 1.48;
  return (radius / baseRadius) * 1.18;
}

function getScaledGeometryPoints(geometry: THREE.BufferGeometry, scale: number): Float32Array {
  const position = geometry.getAttribute("position");
  const points = new Float32Array(position.count * 3);
  const vertex = new THREE.Vector3();
  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position, index).multiplyScalar(scale);
    points[index * 3] = vertex.x;
    points[index * 3 + 1] = vertex.y;
    points[index * 3 + 2] = vertex.z;
  }
  return points;
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
  return allSettled ? getPhysicsRollResult(dice) : null;
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
  if (!isSceneDieResting(entry)) {
    entry.stableLabel = null;
    entry.stableStartedAt = 0;
    return false;
  }
  const label = getPhysicsVisualResult(entry.visual, entry.die.quaternion).label;
  if (entry.stableLabel !== label) {
    entry.stableLabel = label;
    entry.stableStartedAt = now;
    return false;
  }
  return now - entry.stableStartedAt >= DICE_SCENE_STABLE_MS;
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
  const linearSpeed = Math.hypot(velocity.x, velocity.y, velocity.z);
  const angularSpeed = Math.hypot(angularVelocity.x, angularVelocity.y, angularVelocity.z);
  if (linearSpeed > 0.18 || angularSpeed > 0.32) {
    return false;
  }
  if (entry.visual.die === "coin") {
    return Math.abs(getCoinFaceNormal(entry.die).z) >= 0.62;
  }
  return true;
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
  if (Math.abs(faceNormal.z) > 0.38) {
    return;
  }
  const velocity = entry.body.linvel();
  const angularVelocity = entry.body.angvel();
  const linearSpeed = Math.hypot(velocity.x, velocity.y, velocity.z);
  const angularSpeed = Math.hypot(angularVelocity.x, angularVelocity.y, angularVelocity.z);
  const translation = entry.body.translation();
  if (translation.z > 0.92 || Math.abs(velocity.z) > 0.12 || linearSpeed > 0.45 || angularSpeed > 0.85) {
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

function getCoinCenterPush(entry: { x: number; y: number }, bounds: SceneRollBounds, linearSpeed: number, angularSpeed: number): RAPIER.Vector | null {
  if (linearSpeed > 0.2 || angularSpeed > 0.45) {
    return null;
  }
  const wallMargin = 0.7;
  const push = { x: 0, y: 0, z: 0.004 };
  if (entry.x < bounds.minX + wallMargin) {
    push.x = 0.005;
  } else if (entry.x > bounds.maxX - wallMargin) {
    push.x = -0.005;
  }
  if (entry.y < bounds.minY + wallMargin) {
    push.y = 0.005;
  } else if (entry.y > bounds.maxY - wallMargin) {
    push.y = -0.005;
  }
  return push.x === 0 && push.y === 0 ? null : push;
}

function getSceneThrowVelocity(start: number, end: number, seed: number, offset: number): number {
  const travelTime = 0.28 + seedRange(seed, offset + 32, 0.16);
  const push = (seedRange(seed, offset + 42, 2) - 1) * 9.4;
  return (end - start) / travelTime + push;
}

function getSceneInitialRotation(visual: DiceVisual, index: number): RAPIER.Rotation {
  const euler = new THREE.Euler(seedRange(visual.seed, 90 + index, Math.PI * 2), seedRange(visual.seed, 100 + index, Math.PI * 2), seedRange(visual.seed, 110 + index, Math.PI * 2));
  const quaternion = new THREE.Quaternion().setFromEuler(euler);
  return { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
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
  underline?: boolean;
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
  return labels.map(({ label, position, normal, size, up, underline }) => makeFaceLabelMesh(label, position, normal, size ?? 0.56, textColor, opacity, up, event.die, underline));
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

function getFaceHighlightColor(die: DiceVisual["die"]): number {
  if (die === "coin") {
    return 0xffd08a;
  }
  if (die === "d20") {
    return 0xf6d365;
  }
  return 0xffffff;
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
  if (event.die === "d00" && event.result === 100) {
    return "00";
  }
  return event.label;
}

function getPhysicsRollResult(
  dice: Array<{
    visual: DiceVisual;
    die: THREE.Group;
  }>
): ResolvedDiceResult {
  const resolvedDice = dice.map(({ visual, die }) => getPhysicsVisualResult(visual, die.quaternion));
  if (resolvedDice.length === 1 && dice[0]?.visual.die === "coin") {
    return {
      label: resolvedDice[0]?.label ?? "Heads",
      summary: formatDieLabel("coin"),
      result: resolvedDice[0]?.value ?? 1,
      dice: resolvedDice
    };
  }
  const percentileDice = hasResolvedPercentileDice(dice, resolvedDice);
  const total = percentileDice
    ? getPercentileTotal(resolvedDice[0]?.label ?? "00", resolvedDice[1]?.label ?? "0")
    : resolvedDice.reduce((sum, result, index) => (dice[index]?.visual.kept === false ? sum : sum + result.value), 0);
  const summary = percentileDice
    ? formatDieLabel("d00")
    : resolvedDice.length <= 1
      ? formatDieLabel(dice[0]?.visual.die ?? "d20")
      : resolvedDice.map((result, index) => `${formatDieLabel(dice[index]?.visual.die ?? "d20")} ${result.label}`).join(" + ");
  return {
    label: String(total),
    summary,
    result: total,
    dice: resolvedDice
  };
}

function publishSceneRollResult(event: DiceRollEvent, mode: "gm" | "player", resolvedResult: ResolvedDiceResult, onDiceRollResolved?: (event: DiceRollEvent) => void): void {
  if (event.sceneResolvedLabel) {
    return;
  }
  const modifier = getRollModifier(event);
  const sceneResolvedResult = resolvedResult.result + modifier;
  const sceneResolvedLabel = String(sceneResolvedResult);
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
    void window.localVtt.sendLiveTableEvent(resolvedEvent);
  }
}

function getResolvedEventDice(event: DiceRollEvent, resolvedResult: ResolvedDiceResult): DiceVisual[] {
  const dice = getVisualDice(event);
  return dice.map((visual, index) => {
    const resolvedDie = resolvedResult.dice[index];
    if (!resolvedDie) {
      return visual;
    }
    return {
      ...visual,
      label: resolvedDie.label,
      result: resolvedDie.value
    };
  });
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

function hasPercentileDice(dice: DiceVisual[]): boolean {
  return dice.length === 2 && dice[0]?.die === "d00" && dice[1]?.die === "d10";
}

function hasResolvedPercentileDice(
  dice: Array<{
    visual: DiceVisual;
    die: THREE.Group;
  }>,
  resolvedDice: Array<{ label: string; value: number }>
): boolean {
  return dice.length === 2 && resolvedDice.length === 2 && dice[0]?.visual.die === "d00" && dice[1]?.visual.die === "d10";
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
        up: die === "d8" ? getPoleFaceLabelUp(lowPlacement.position) : undefined,
        underline: shouldUnderlineFaceLabel(die, String(lowValue))
      },
      {
        ...highPlacement,
        label: String(highValue),
        size: getPolyhedralFaceLabelSize(die),
        up: die === "d8" ? getPoleFaceLabelUp(highPlacement.position) : undefined,
        underline: shouldUnderlineFaceLabel(die, String(highValue))
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
        up: getPoleFaceLabelUp(oddPlacement.position),
        underline: shouldUnderlineFaceLabel(die, formatD10StyleFaceLabel(die, oddValue))
      },
      {
        ...evenPlacement,
        label: formatD10StyleFaceLabel(die, evenValue),
        size: getPolyhedralFaceLabelSize(die),
        up: getPoleFaceLabelUp(evenPlacement.position),
        underline: shouldUnderlineFaceLabel(die, formatD10StyleFaceLabel(die, evenValue))
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

function shouldUnderlineFaceLabel(die: DiceVisual["die"], label: string): boolean {
  return (die === "d10" || die === "d12" || die === "d20") && (label === "6" || label === "9");
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
      const underlineWidth = Math.max(44, metrics.width * 0.88);
      const underlineY = 132 + getFaceLabelFontSize(label) * 0.36;
      context.lineCap = "round";
      context.lineWidth = 12;
      context.strokeStyle = color === "#f8fafc" ? "rgba(4, 8, 14, 0.5)" : "rgba(255, 255, 255, 0.24)";
      context.beginPath();
      context.moveTo(canvas.width / 2 - underlineWidth / 2, underlineY);
      context.lineTo(canvas.width / 2 + underlineWidth / 2, underlineY);
      context.stroke();
      context.lineWidth = 7;
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
