import { useCallback, useState } from "react";
import type { DrawingStrokeStyle, EnvironmentEffectMask, EnvironmentEffectType, Point, Scene } from "../../../../shared/localvtt";
import type { EnvironmentPolygonDraft } from "../../../canvas/effects";
import { getFogOperationForTool, type FogPolygonDraft, type FogTool } from "../../../canvas/fog";
import type { WeatherPolygonDraft } from "../../../canvas/weather";
import { usePolygonDraftKeyboard } from "../../../hooks/usePolygonDraftKeyboard";
import { useSyncedRef } from "../../../hooks/useSyncedRef";
import {
  getSceneAfterDrawingPolygonDraftCommit,
  getSceneAfterEnvironmentPolygonDraftCommit,
  getSceneAfterFogPolygonDraftCommit,
  getSceneAfterWeatherPolygonDraftCommit
} from "../state/scenePolygonDraftCommitScenes";
import {
  appendScenePolygonDraftPoint,
  appendScopedScenePolygonDraftPoint,
  clearScenePolygonDraft,
  removeLastScenePolygonDraftPoint
} from "../state/scenePolygonDraftState";

export type DrawingPolygonDraft = {
  points: Point[];
  current?: Point;
};

export interface ScenePolygonDraftDrawingStyle {
  color: string;
  fillColor: string;
  fillOpacity: number;
  opacity: number;
  strokeStyle: DrawingStrokeStyle;
  strokeWidth: number;
}

interface UseScenePolygonDraftsOptions {
  drawingStyle: ScenePolygonDraftDrawingStyle;
  environmentEffectFeather: number;
  environmentEffectTuning: Partial<EnvironmentEffectMask>;
  environmentEffectType: EnvironmentEffectType;
  onSceneChange?: (scene: Scene, syncScene?: Scene) => void;
  scene: Scene | null;
}

export function useScenePolygonDrafts({
  drawingStyle,
  environmentEffectFeather,
  environmentEffectTuning,
  environmentEffectType,
  onSceneChange,
  scene
}: UseScenePolygonDraftsOptions) {
  const [fogPolygonDraft, setFogPolygonDraft] = useState<FogPolygonDraft | null>(null);
  const [drawingPolygonDraft, setDrawingPolygonDraft] = useState<DrawingPolygonDraft | null>(null);
  const [weatherPolygonDraft, setWeatherPolygonDraft] = useState<WeatherPolygonDraft | null>(null);
  const [environmentPolygonDraft, setEnvironmentPolygonDraft] = useState<EnvironmentPolygonDraft | null>(null);
  const fogPolygonDraftRef = useSyncedRef<FogPolygonDraft | null>(fogPolygonDraft);
  const drawingPolygonDraftRef = useSyncedRef<DrawingPolygonDraft | null>(drawingPolygonDraft);
  const weatherPolygonDraftRef = useSyncedRef<WeatherPolygonDraft | null>(weatherPolygonDraft);
  const environmentPolygonDraftRef = useSyncedRef<EnvironmentPolygonDraft | null>(environmentPolygonDraft);

  const clearFogPolygonDraft = useCallback(() => {
    clearScenePolygonDraft({ ref: fogPolygonDraftRef, setDraft: setFogPolygonDraft });
  }, [fogPolygonDraftRef]);

  const clearDrawingPolygonDraft = useCallback(() => {
    clearScenePolygonDraft({ ref: drawingPolygonDraftRef, setDraft: setDrawingPolygonDraft });
  }, [drawingPolygonDraftRef]);

  const clearWeatherPolygonDraft = useCallback(() => {
    clearScenePolygonDraft({ ref: weatherPolygonDraftRef, setDraft: setWeatherPolygonDraft });
  }, [weatherPolygonDraftRef]);

  const clearEnvironmentPolygonDraft = useCallback(() => {
    clearScenePolygonDraft({ ref: environmentPolygonDraftRef, setDraft: setEnvironmentPolygonDraft });
  }, [environmentPolygonDraftRef]);

  const appendFogPolygonDraftPoint = useCallback((tool: FogTool, point: Point) => {
    appendScopedScenePolygonDraftPoint(
      { ref: fogPolygonDraftRef, setDraft: setFogPolygonDraft },
      point,
      "operation",
      getFogOperationForTool(tool)
    );
  }, [fogPolygonDraftRef]);

  const appendDrawingPolygonDraftPoint = useCallback((point: Point) => {
    appendScenePolygonDraftPoint({ ref: drawingPolygonDraftRef, setDraft: setDrawingPolygonDraft }, point);
  }, [drawingPolygonDraftRef]);

  const appendWeatherPolygonDraftPoint = useCallback((point: Point) => {
    appendScenePolygonDraftPoint({ ref: weatherPolygonDraftRef, setDraft: setWeatherPolygonDraft }, point);
  }, [weatherPolygonDraftRef]);

  const appendEnvironmentPolygonDraftPoint = useCallback((point: Point) => {
    appendScenePolygonDraftPoint({ ref: environmentPolygonDraftRef, setDraft: setEnvironmentPolygonDraft }, point);
  }, [environmentPolygonDraftRef]);

  const removeLastFogPolygonDraftPoint = useCallback(() => {
    removeLastScenePolygonDraftPoint({ ref: fogPolygonDraftRef, setDraft: setFogPolygonDraft });
  }, [fogPolygonDraftRef]);

  const removeLastDrawingPolygonDraftPoint = useCallback(() => {
    removeLastScenePolygonDraftPoint({ ref: drawingPolygonDraftRef, setDraft: setDrawingPolygonDraft });
  }, [drawingPolygonDraftRef]);

  const removeLastWeatherPolygonDraftPoint = useCallback(() => {
    removeLastScenePolygonDraftPoint({ ref: weatherPolygonDraftRef, setDraft: setWeatherPolygonDraft });
  }, [weatherPolygonDraftRef]);

  const removeLastEnvironmentPolygonDraftPoint = useCallback(() => {
    removeLastScenePolygonDraftPoint({ ref: environmentPolygonDraftRef, setDraft: setEnvironmentPolygonDraft });
  }, [environmentPolygonDraftRef]);

  const commitFogPolygonDraft = useCallback(() => {
    const draft = fogPolygonDraftRef.current;
    if (!scene || !onSceneChange || !draft) {
      return;
    }
    const nextScene = getSceneAfterFogPolygonDraftCommit(scene, draft, crypto.randomUUID());
    if (!nextScene) {
      return;
    }
    clearFogPolygonDraft();
    onSceneChange(nextScene);
  }, [clearFogPolygonDraft, fogPolygonDraftRef, onSceneChange, scene]);

  const commitDrawingPolygonDraft = useCallback(() => {
    const draft = drawingPolygonDraftRef.current;
    if (!scene || !onSceneChange || !draft) {
      return;
    }
    const nextScene = getSceneAfterDrawingPolygonDraftCommit(scene, draft, crypto.randomUUID(), drawingStyle);
    if (!nextScene) {
      return;
    }
    clearDrawingPolygonDraft();
    onSceneChange(nextScene);
  }, [clearDrawingPolygonDraft, drawingPolygonDraftRef, drawingStyle, onSceneChange, scene]);

  const commitWeatherPolygonDraft = useCallback(() => {
    const draft = weatherPolygonDraftRef.current;
    if (!scene || !onSceneChange || !draft) {
      return;
    }
    const nextScene = getSceneAfterWeatherPolygonDraftCommit(scene, draft, crypto.randomUUID());
    if (!nextScene) {
      return;
    }
    clearWeatherPolygonDraft();
    onSceneChange(nextScene);
  }, [clearWeatherPolygonDraft, onSceneChange, scene, weatherPolygonDraftRef]);

  const commitEnvironmentPolygonDraft = useCallback(() => {
    const draft = environmentPolygonDraftRef.current;
    if (!scene || !onSceneChange || !draft) {
      return;
    }
    const nextScene = getSceneAfterEnvironmentPolygonDraftCommit(
      scene,
      draft,
      crypto.randomUUID(),
      environmentEffectType,
      environmentEffectFeather,
      environmentEffectTuning
    );
    if (!nextScene) {
      return;
    }
    clearEnvironmentPolygonDraft();
    onSceneChange(nextScene);
  }, [
    clearEnvironmentPolygonDraft,
    environmentEffectFeather,
    environmentEffectTuning,
    environmentEffectType,
    environmentPolygonDraftRef,
    onSceneChange,
    scene
  ]);

  usePolygonDraftKeyboard({
    active: Boolean(fogPolygonDraft),
    onCancel: clearFogPolygonDraft,
    onCommit: commitFogPolygonDraft
  });

  usePolygonDraftKeyboard({
    active: Boolean(drawingPolygonDraft),
    onCancel: clearDrawingPolygonDraft,
    onCommit: commitDrawingPolygonDraft
  });

  usePolygonDraftKeyboard({
    active: Boolean(weatherPolygonDraft),
    onCancel: clearWeatherPolygonDraft,
    onCommit: commitWeatherPolygonDraft
  });

  usePolygonDraftKeyboard({
    active: Boolean(environmentPolygonDraft),
    onCancel: clearEnvironmentPolygonDraft,
    onCommit: commitEnvironmentPolygonDraft
  });

  return {
    appendDrawingPolygonDraftPoint,
    appendEnvironmentPolygonDraftPoint,
    appendFogPolygonDraftPoint,
    appendWeatherPolygonDraftPoint,
    clearDrawingPolygonDraft,
    clearEnvironmentPolygonDraft,
    clearFogPolygonDraft,
    clearWeatherPolygonDraft,
    commitDrawingPolygonDraft,
    commitEnvironmentPolygonDraft,
    commitFogPolygonDraft,
    commitWeatherPolygonDraft,
    drawingPolygonDraft,
    drawingPolygonDraftRef,
    environmentPolygonDraft,
    environmentPolygonDraftRef,
    fogPolygonDraft,
    fogPolygonDraftRef,
    removeLastDrawingPolygonDraftPoint,
    removeLastEnvironmentPolygonDraftPoint,
    removeLastFogPolygonDraftPoint,
    removeLastWeatherPolygonDraftPoint,
    setDrawingPolygonDraft,
    setEnvironmentPolygonDraft,
    setFogPolygonDraft,
    setWeatherPolygonDraft,
    weatherPolygonDraft,
    weatherPolygonDraftRef
  };
}
