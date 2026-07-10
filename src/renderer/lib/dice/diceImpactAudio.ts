import { DEFAULT_DICE_SETTINGS } from "../../../shared/localvtt";
import type { SceneRollBounds } from "./dicePoolLayout";
import type { Vector3Like } from "./diceScenePhysics";

export const DICE_IMPACT_AUDIO_COOLDOWN_MS = 95;

export interface SceneDiceImpactInput {
  bounds: SceneRollBounds;
  currentVelocity: Vector3Like;
  lastImpactAt: number;
  now: number;
  previousVelocity: Vector3Like;
  radius: number;
  translation: Vector3Like;
}

export interface SceneDiceImpact {
  strength: number;
  surface: "floor" | "wall";
}

export interface DiceImpactAudioPlayer {
  context: AudioContext | null;
}

export interface DiceImpactSoundOptions {
  body: number;
  brightness: number;
  click: number;
  decay: number;
  pitch: number;
  volume: number;
}

export function getSceneDiceImpact(input: SceneDiceImpactInput): SceneDiceImpact | null {
  if (input.now - input.lastImpactAt < DICE_IMPACT_AUDIO_COOLDOWN_MS) {
    return null;
  }

  const floorImpact = getFloorImpactStrength(input);
  const wallImpact = getWallImpactStrength(input);
  if (floorImpact <= 0 && wallImpact <= 0) {
    return null;
  }

  if (floorImpact >= wallImpact) {
    return { strength: floorImpact, surface: "floor" };
  }
  return { strength: wallImpact, surface: "wall" };
}

export function createDiceImpactAudioPlayer(): DiceImpactAudioPlayer {
  return { context: null };
}

export function disposeDiceImpactAudioPlayer(player: DiceImpactAudioPlayer): void {
  if (!player.context || player.context.state === "closed") {
    return;
  }
  void player.context.close().catch(() => undefined);
  player.context = null;
}

export function playDiceImpactSound(player: DiceImpactAudioPlayer, impact: SceneDiceImpact, seed: number, options: Partial<DiceImpactSoundOptions> = {}): void {
  const AudioContextConstructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const sound = normalizeDiceImpactSoundOptions(options);
  if (!AudioContextConstructor || sound.volume <= 0) {
    return;
  }
  player.context ??= new AudioContextConstructor();
  const context = player.context;
  if (context.state === "suspended") {
    void context.resume().catch(() => undefined);
  }

  const now = context.currentTime;
  const strength = Math.max(0, Math.min(1, impact.strength));
  const volume = (0.22 + strength * 0.68) * sound.volume;
  const duration = 0.035 + sound.decay * 0.12 + strength * (0.035 + sound.decay * 0.055);
  const pitch = (impact.surface === "floor" ? 85 : 115) + sound.pitch * 115 + seedRange(seed, 17, 18 + sound.pitch * 80);
  const brightnessFrequency = 360 + sound.brightness * 1800 + seedRange(seed, 31, 180 + sound.brightness * 420);

  const noise = context.createBufferSource();
  noise.buffer = createImpactNoiseBuffer(context, duration, seed);
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = brightnessFrequency;
  filter.Q.value = 0.75 + sound.brightness * 2.1;
  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(volume * (0.22 + sound.brightness * 0.78), now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  noise.connect(filter).connect(noiseGain).connect(context.destination);
  noise.start(now);
  noise.stop(now + duration);

  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(pitch, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(65, pitch * 0.62), now + duration);
  const toneGain = context.createGain();
  toneGain.gain.setValueAtTime(volume * (0.08 + sound.body * 0.82), now);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(toneGain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);

  const knock = context.createOscillator();
  knock.type = "triangle";
  knock.frequency.setValueAtTime(pitch * (1.2 + sound.click * 1.65), now);
  knock.frequency.exponentialRampToValueAtTime(Math.max(90, pitch * 1.05), now + 0.025 + sound.decay * 0.05);
  const knockGain = context.createGain();
  knockGain.gain.setValueAtTime(volume * sound.click * 0.58, now);
  knockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025 + sound.decay * 0.05);
  knock.connect(knockGain).connect(context.destination);
  knock.start(now);
  knock.stop(now + 0.03 + sound.decay * 0.055);
}

function normalizeDiceImpactSoundOptions(options: Partial<DiceImpactSoundOptions>): DiceImpactSoundOptions {
  return {
    body: clampUnit(options.body, DEFAULT_DICE_SETTINGS.impactBody),
    brightness: clampUnit(options.brightness, DEFAULT_DICE_SETTINGS.impactBrightness),
    click: clampUnit(options.click, DEFAULT_DICE_SETTINGS.impactClick),
    decay: clampUnit(options.decay, DEFAULT_DICE_SETTINGS.impactDecay),
    pitch: clampUnit(options.pitch, DEFAULT_DICE_SETTINGS.impactPitch),
    volume: clampUnit(options.volume, DEFAULT_DICE_SETTINGS.impactVolume)
  };
}

function clampUnit(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

function getFloorImpactStrength(input: SceneDiceImpactInput): number {
  const verticalChange = input.currentVelocity.z - input.previousVelocity.z;
  const nearFloor = input.translation.z <= input.radius * 1.36;
  if (!nearFloor || input.previousVelocity.z > -0.75 || verticalChange < 1.7) {
    return 0;
  }
  return Math.max(0, Math.min(1, (verticalChange - 1.7) / 8));
}

function getWallImpactStrength(input: SceneDiceImpactInput): number {
  const margin = input.radius * 1.18;
  const xStrength = Math.max(
    getAxisWallImpactStrength(input.translation.x <= input.bounds.minX + margin, input.previousVelocity.x, input.currentVelocity.x, -1),
    getAxisWallImpactStrength(input.translation.x >= input.bounds.maxX - margin, input.previousVelocity.x, input.currentVelocity.x, 1)
  );
  const yStrength = Math.max(
    getAxisWallImpactStrength(input.translation.y <= input.bounds.minY + margin, input.previousVelocity.y, input.currentVelocity.y, -1),
    getAxisWallImpactStrength(input.translation.y >= input.bounds.maxY - margin, input.previousVelocity.y, input.currentVelocity.y, 1)
  );
  return Math.max(xStrength, yStrength);
}

function getAxisWallImpactStrength(nearWall: boolean, previousVelocity: number, currentVelocity: number, outwardDirection: -1 | 1): number {
  if (!nearWall || previousVelocity * outwardDirection < 0.75) {
    return 0;
  }
  const axisChange = previousVelocity * outwardDirection - currentVelocity * outwardDirection;
  if (axisChange < 1.6) {
    return 0;
  }
  return Math.max(0, Math.min(1, (axisChange - 1.6) / 9));
}

function createImpactNoiseBuffer(context: AudioContext, duration: number, seed: number): AudioBuffer {
  const length = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    const decay = 1 - index / length;
    data[index] = (seedRange(seed, 200 + index, 2) - 1) * decay * decay;
  }
  return buffer;
}

function seedRange(seed: number, offset: number, max: number): number {
  const value = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
  return (value - Math.floor(value)) * max;
}
