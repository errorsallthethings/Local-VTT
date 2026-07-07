export const ENVIRONMENT_EFFECT_TYPES = [
  "acid",
  "cold",
  "darkness",
  "poison",
  "water",
  "lava",
  "smoke",
  "fog",
  "fire",
  "electric",
  "arcane",
  "radiant",
  "field",
  "shockwave",
  "distortion",
  "chaos",
  "void",
  "nature"
] as const;

export type EnvironmentEffectType = (typeof ENVIRONMENT_EFFECT_TYPES)[number];

const ENVIRONMENT_EFFECT_TYPE_SET = new Set<string>(ENVIRONMENT_EFFECT_TYPES);

const ENVIRONMENT_EFFECT_NAMES: Record<EnvironmentEffectType, string> = {
  acid: "Acid",
  cold: "Cold",
  darkness: "Darkness",
  poison: "Poison Cloud",
  water: "Water",
  lava: "Lava",
  smoke: "Smoke",
  fog: "Mist",
  fire: "Fire",
  electric: "Electric",
  arcane: "Arcane",
  radiant: "Radiant",
  field: "Force Field",
  shockwave: "Shockwave",
  distortion: "Distortion",
  chaos: "Chaos Field",
  void: "Void Tendrils",
  nature: "Nature Growth"
};

export function isEnvironmentEffectType(value: unknown): value is EnvironmentEffectType {
  return typeof value === "string" && ENVIRONMENT_EFFECT_TYPE_SET.has(value);
}

export function formatEnvironmentEffectName(effect: EnvironmentEffectType): string {
  return ENVIRONMENT_EFFECT_NAMES[effect];
}
