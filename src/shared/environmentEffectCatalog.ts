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

export function isEnvironmentEffectType(value: unknown): value is EnvironmentEffectType {
  return typeof value === "string" && ENVIRONMENT_EFFECT_TYPE_SET.has(value);
}

export function formatEnvironmentEffectName(effect: EnvironmentEffectType): string {
  return effect === "acid"
    ? "Acid"
    : effect === "cold"
      ? "Cold"
      : effect === "darkness"
        ? "Darkness"
        : effect === "poison"
          ? "Poison Cloud"
          : effect === "water"
            ? "Water"
            : effect === "lava"
              ? "Lava"
              : effect === "fire"
                ? "Fire"
                : effect === "electric"
                  ? "Electric"
                  : effect === "arcane"
                    ? "Arcane"
                    : effect === "distortion"
                      ? "Distortion"
                      : effect === "chaos"
                        ? "Chaos Field"
                        : effect === "void"
                          ? "Void Tendrils"
                          : effect === "nature"
                            ? "Nature Growth"
                            : effect === "radiant"
                              ? "Radiant"
                              : effect === "field"
                                ? "Force Field"
                                : effect === "shockwave"
                                  ? "Shockwave"
                                  : effect === "fog"
                                    ? "Mist"
                                    : "Smoke";
}
