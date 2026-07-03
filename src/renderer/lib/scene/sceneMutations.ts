import type { Scene } from "../../../shared/localvtt";

export function renameFogShape(scene: Scene, shapeId: string, name: string, updatedAt = new Date().toISOString()): Scene | null {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return null;
  }

  return {
    ...scene,
    fog: {
      ...scene.fog,
      shapes: scene.fog.shapes.map((shape) => (shape.id === shapeId ? { ...shape, name: trimmedName } : shape))
    },
    updatedAt
  };
}

export function renameEnvironmentEffect(scene: Scene, effectId: string, name: string, updatedAt = new Date().toISOString()): Scene | null {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return null;
  }

  return {
    ...scene,
    environment: {
      ...scene.environment,
      effects: scene.environment.effects.map((effect) => (effect.id === effectId ? { ...effect, name: trimmedName } : effect))
    },
    updatedAt
  };
}

export function renameSceneToken(scene: Scene, tokenId: string, name: string, updatedAt = new Date().toISOString()): Scene | null {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return null;
  }

  return {
    ...scene,
    tokens: scene.tokens.map((token) => (token.id === tokenId ? { ...token, name: trimmedName } : token)),
    updatedAt
  };
}

export function setSceneTokenColor(
  scene: Scene,
  tokenId: string,
  value: string,
  kind: "border" | "glow",
  updatedAt = new Date().toISOString()
): Scene {
  return {
    ...scene,
    tokens: scene.tokens.map((token) =>
      token.id === tokenId ? (kind === "glow" ? { ...token, glowColor: value } : { ...token, borderColor: value }) : token
    ),
    updatedAt
  };
}
