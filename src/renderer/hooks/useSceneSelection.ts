import { useEffect, useMemo, useState } from "react";
import type { Scene } from "../../shared/localvtt";
import type { SelectorSelectionCounts } from "../components/tools";
import { applySelectionMode, retainExistingSelectionIds, type SelectionMode } from "../lib/scene";

export function useSceneSelection(activeScene: Scene | null) {
  const [selectedFogShapeId, setSelectedFogShapeId] = useState<string | null>(null);
  const [selectedWeatherMaskId, setSelectedWeatherMaskId] = useState<string | null>(null);
  const [selectedEnvironmentEffectId, setSelectedEnvironmentEffectId] = useState<string | null>(null);
  const [environmentEffectEditorId, setEnvironmentEffectEditorId] = useState<string | null>(null);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [selectedFogShapeIds, setSelectedFogShapeIds] = useState<string[]>([]);
  const [selectedWeatherMaskIds, setSelectedWeatherMaskIds] = useState<string[]>([]);
  const [selectedDrawingIds, setSelectedDrawingIds] = useState<string[]>([]);
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);

  const selectorSelectionCounts = useMemo<SelectorSelectionCounts>(() => {
    const selectedDrawingIdSet = new Set(selectedDrawingIds);
    const selectedDrawings = activeScene?.drawings.filter((drawing) => selectedDrawingIdSet.has(drawing.id)) ?? [];
    return {
      tokens: selectedTokenIds.length,
      templates: selectedDrawings.filter((drawing) => drawing.measurementLabelVisible).length,
      drawings: selectedDrawings.filter((drawing) => !drawing.measurementLabelVisible).length,
      fogMasks: selectedFogShapeIds.length,
      weatherMasks: selectedWeatherMaskIds.length
    };
  }, [activeScene?.drawings, selectedDrawingIds, selectedFogShapeIds.length, selectedTokenIds.length, selectedWeatherMaskIds.length]);

  const environmentEffectEditorEffect = useMemo(
    () => activeScene?.environment.effects.find((effect) => effect.id === environmentEffectEditorId) ?? null,
    [activeScene?.environment.effects, environmentEffectEditorId]
  );

  const selectTokens = (ids: string[]) => {
    setSelectedTokenIds(ids);
    setSelectedTokenId(ids[0] ?? null);
  };

  const selectDrawings = (ids: string[]) => {
    setSelectedDrawingIds(ids);
    setSelectedDrawingId(ids[0] ?? null);
  };

  const selectFogShapes = (ids: string[]) => {
    setSelectedFogShapeIds(ids);
    setSelectedFogShapeId(ids[0] ?? null);
  };

  const selectWeatherMasks = (ids: string[]) => {
    setSelectedWeatherMaskIds(ids);
    setSelectedWeatherMaskId(ids[0] ?? null);
  };

  const selectEnvironmentEffect = (id: string | null) => {
    setSelectedEnvironmentEffectId(id);
    if (id) {
      selectTokens([]);
      selectDrawings([]);
      selectFogShapes([]);
      selectWeatherMasks([]);
    }
  };

  const selectSceneItems = ({
    tokenIds = [],
    drawingIds = [],
    fogShapeIds = [],
    weatherMaskIds = [],
    mode = "replace"
  }: {
    tokenIds?: string[];
    drawingIds?: string[];
    fogShapeIds?: string[];
    weatherMaskIds?: string[];
    mode?: SelectionMode;
  }) => {
    selectTokens(applySelectionMode(selectedTokenIds, tokenIds, mode));
    selectDrawings(applySelectionMode(selectedDrawingIds, drawingIds, mode));
    selectFogShapes(applySelectionMode(selectedFogShapeIds, fogShapeIds, mode));
    selectWeatherMasks(applySelectionMode(selectedWeatherMaskIds, weatherMaskIds, mode));
    setSelectedEnvironmentEffectId(null);
  };

  const clearSceneSelection = () => {
    selectTokens([]);
    selectDrawings([]);
    selectFogShapes([]);
    selectWeatherMasks([]);
    setSelectedEnvironmentEffectId(null);
  };

  useEffect(() => {
    setSelectedTokenIds([]);
    setSelectedTokenId(null);
    setSelectedDrawingIds([]);
    setSelectedDrawingId(null);
    setSelectedFogShapeIds([]);
    setSelectedFogShapeId(null);
    setSelectedWeatherMaskIds([]);
    setSelectedWeatherMaskId(null);
    setSelectedEnvironmentEffectId(null);
    setEnvironmentEffectEditorId(null);
  }, [activeScene?.id]);

  useEffect(() => {
    if (!activeScene) {
      setSelectedTokenIds((ids) => (ids.length === 0 ? ids : []));
      setSelectedTokenId(null);
      setSelectedDrawingIds((ids) => (ids.length === 0 ? ids : []));
      setSelectedDrawingId(null);
      setSelectedFogShapeIds((ids) => (ids.length === 0 ? ids : []));
      setSelectedFogShapeId(null);
      setSelectedWeatherMaskIds((ids) => (ids.length === 0 ? ids : []));
      setSelectedWeatherMaskId(null);
      setSelectedEnvironmentEffectId(null);
      setEnvironmentEffectEditorId(null);
      return;
    }
    const nextTokenIds = retainExistingSelectionIds(selectedTokenIds, activeScene.tokens.map((token) => token.id));
    const nextDrawingIds = retainExistingSelectionIds(selectedDrawingIds, activeScene.drawings.map((drawing) => drawing.id));
    const nextFogShapeIds = retainExistingSelectionIds(selectedFogShapeIds, activeScene.fog.shapes.map((shape) => shape.id));
    const nextWeatherMaskIds = retainExistingSelectionIds(selectedWeatherMaskIds, activeScene.weather.masks.map((mask) => mask.id));
    if (
      nextTokenIds.length !== selectedTokenIds.length ||
      nextDrawingIds.length !== selectedDrawingIds.length ||
      nextFogShapeIds.length !== selectedFogShapeIds.length ||
      nextWeatherMaskIds.length !== selectedWeatherMaskIds.length
    ) {
      setSelectedTokenIds(nextTokenIds);
      setSelectedTokenId(nextTokenIds[0] ?? null);
      setSelectedDrawingIds(nextDrawingIds);
      setSelectedDrawingId(nextDrawingIds[0] ?? null);
      setSelectedFogShapeIds(nextFogShapeIds);
      setSelectedFogShapeId(nextFogShapeIds[0] ?? null);
      setSelectedWeatherMaskIds(nextWeatherMaskIds);
      setSelectedWeatherMaskId(nextWeatherMaskIds[0] ?? null);
    }
  }, [activeScene, selectedDrawingIds, selectedFogShapeIds, selectedTokenIds, selectedWeatherMaskIds]);

  useEffect(() => {
    if (!selectedEnvironmentEffectId || activeScene?.environment.effects.some((effect) => effect.id === selectedEnvironmentEffectId)) {
      return;
    }
    setSelectedEnvironmentEffectId(null);
  }, [activeScene?.environment.effects, selectedEnvironmentEffectId]);

  useEffect(() => {
    if (!environmentEffectEditorId || activeScene?.environment.effects.some((effect) => effect.id === environmentEffectEditorId)) {
      return;
    }
    setEnvironmentEffectEditorId(null);
  }, [activeScene?.environment.effects, environmentEffectEditorId]);

  useEffect(() => {
    if (!selectedFogShapeId || activeScene?.fog.shapes.some((shape) => shape.id === selectedFogShapeId)) {
      return;
    }
    setSelectedFogShapeId(null);
  }, [activeScene?.fog.shapes, selectedFogShapeId]);

  useEffect(() => {
    setSelectedFogShapeIds((ids) => retainExistingSelectionIds(ids, activeScene?.fog.shapes.map((shape) => shape.id) ?? []));
  }, [activeScene?.fog.shapes]);

  useEffect(() => {
    if (!selectedWeatherMaskId || activeScene?.weather.masks.some((mask) => mask.id === selectedWeatherMaskId)) {
      return;
    }
    setSelectedWeatherMaskId(null);
  }, [activeScene?.weather.masks, selectedWeatherMaskId]);

  useEffect(() => {
    setSelectedWeatherMaskIds((ids) => retainExistingSelectionIds(ids, activeScene?.weather.masks.map((mask) => mask.id) ?? []));
  }, [activeScene?.weather.masks]);

  useEffect(() => {
    if (!selectedDrawingId || activeScene?.drawings.some((drawing) => drawing.id === selectedDrawingId)) {
      return;
    }
    setSelectedDrawingId(null);
  }, [activeScene?.drawings, selectedDrawingId]);

  useEffect(() => {
    setSelectedDrawingIds((ids) => retainExistingSelectionIds(ids, activeScene?.drawings.map((drawing) => drawing.id) ?? []));
  }, [activeScene?.drawings]);

  useEffect(() => {
    if (!selectedFogShapeId) {
      return;
    }
    const clearFogShapeSelection = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.closest(".fog-layer-shape-row") || target.closest(".scene-canvas-frame"))) {
        return;
      }
      setSelectedFogShapeId(null);
      setSelectedFogShapeIds([]);
    };
    window.addEventListener("mousedown", clearFogShapeSelection);
    return () => window.removeEventListener("mousedown", clearFogShapeSelection);
  }, [selectedFogShapeId]);

  useEffect(() => {
    if (!selectedTokenId || activeScene?.tokens.some((token) => token.id === selectedTokenId)) {
      return;
    }
    setSelectedTokenId(null);
  }, [activeScene?.tokens, selectedTokenId]);

  useEffect(() => {
    setSelectedTokenIds((ids) => retainExistingSelectionIds(ids, activeScene?.tokens.map((token) => token.id) ?? []));
  }, [activeScene?.tokens]);

  return {
    selectedFogShapeId,
    selectedWeatherMaskId,
    selectedEnvironmentEffectId,
    environmentEffectEditorId,
    setEnvironmentEffectEditorId,
    environmentEffectEditorEffect,
    selectedDrawingId,
    selectedTokenId,
    selectedFogShapeIds,
    selectedWeatherMaskIds,
    selectedDrawingIds,
    selectedTokenIds,
    selectorSelectionCounts,
    selectTokens,
    selectDrawings,
    selectFogShapes,
    selectWeatherMasks,
    selectEnvironmentEffect,
    selectSceneItems,
    clearSceneSelection
  };
}
