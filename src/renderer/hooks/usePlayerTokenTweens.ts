import { useEffect, useRef, useState } from "react";
import type { Scene } from "../../shared/localvtt";
import { getPointAlongPath } from "../canvas/tokens";
import { getTokenMovementTweens } from "../canvas/tokens";
import type { TokenPositionOverrides } from "../canvas/tokens";

export function usePlayerTokenTweens(scene: Scene | null, mode: "gm" | "player") {
  const previousSceneRef = useRef<Scene | null>(null);
  const tokenTweenPositionsRef = useRef<TokenPositionOverrides | null>(null);
  const [tokenTweenPositions, setTokenTweenPositions] = useState<TokenPositionOverrides | null>(null);

  useEffect(() => {
    const previousScene = previousSceneRef.current;
    previousSceneRef.current = scene;

    if (mode !== "player" || !previousScene || !scene || previousScene.id !== scene.id) {
      tokenTweenPositionsRef.current = null;
      setTokenTweenPositions(null);
      return;
    }

    const tweens = getTokenMovementTweens(previousScene.tokens, scene.tokens, scene);
    if (tweens.length === 0) {
      tokenTweenPositionsRef.current = null;
      setTokenTweenPositions(null);
      return;
    }

    let animationFrame = 0;
    let cancelled = false;
    const durationMs = Math.max(...tweens.map((tween) => tween.durationMs));
    const startedAt = performance.now();

    const animate = (timestamp: number) => {
      if (cancelled) {
        return;
      }
      const tweenPositions = new Map(
        tweens.map((tween) => {
          const progress = Math.min(1, (timestamp - startedAt) / tween.durationMs);
          return [tween.id, getPointAlongPath(tween.points, tween.distance * progress)];
        })
      );
      tokenTweenPositionsRef.current = tweenPositions;
      setTokenTweenPositions(tweenPositions);

      if (timestamp - startedAt < durationMs) {
        animationFrame = window.requestAnimationFrame(animate);
      } else {
        tokenTweenPositionsRef.current = null;
        setTokenTweenPositions(null);
      }
    };

    const initialTweenPositions = new Map(tweens.map((tween) => [tween.id, tween.points[0]]));
    tokenTweenPositionsRef.current = initialTweenPositions;
    setTokenTweenPositions(initialTweenPositions);
    animationFrame = window.requestAnimationFrame(animate);
    return () => {
      cancelled = true;
      tokenTweenPositionsRef.current = null;
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [mode, scene]);

  return { tokenTweenPositions, tokenTweenPositionsRef };
}
