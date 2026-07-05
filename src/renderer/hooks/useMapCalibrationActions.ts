import type { Campaign, DisplayCalibration, GridType, Scene } from "../../shared/localvtt";
import type { MapCalibrationBox } from "../canvas/map";
import type { DisplayInfo } from "../components/settings/PlayerDisplayScalePanel";
import type { WizardMapFitMode } from "../components/settings/TableDisplaySetupWizard";
import { loadImageDimensions } from "../lib/assets";
import {
  applyMapCalibrationDraft,
  buildMapFitPresetScene,
  buildTableDisplayGridUpdate,
  buildWizardMapFitScene,
  type MapCalibrationDraft,
  type MapFitPresetMode
} from "../lib/map";
import { getPlayerViewOpenOptions, getPlayerViewOpenWarning, sendSceneToPlayer } from "../lib/player-view";

interface UseMapCalibrationActionsOptions {
  activeScene: Scene | null;
  campaign: Campaign | null;
  displays: DisplayInfo[];
  mapAssetPath: string | null;
  mapCalibrationBox: MapCalibrationBox | null;
  playerSceneId: string | null;
  playerViewSyncOptions: { showPlayerSeatIndicators: boolean };
  run: (task: () => Promise<void>) => Promise<unknown>;
  updateScene: (nextScene: Scene, syncCampaign?: Campaign | null, syncScene?: Scene) => void;
  updateWorkspaceCampaignDraft: (nextCampaign: Campaign, syncSceneToPlayer: Scene | null) => void;
  applyPlayerViewModeState: (mode: "scene", sceneId?: string | null, syncToPlayer?: boolean) => void;
  clearActiveCanvasTools: () => void;
  setError: (message: string | null) => void;
  setMapCalibrationAssistantOpen: (open: boolean) => void;
  setMapCalibrationBox: (box: MapCalibrationBox | null) => void;
  setMapCalibrationBoxPicking: (picking: boolean) => void;
}

export function useMapCalibrationActions({
  activeScene,
  campaign,
  displays,
  mapAssetPath,
  mapCalibrationBox,
  playerSceneId,
  playerViewSyncOptions,
  run,
  updateScene,
  updateWorkspaceCampaignDraft,
  applyPlayerViewModeState,
  clearActiveCanvasTools,
  setError,
  setMapCalibrationAssistantOpen,
  setMapCalibrationBox,
  setMapCalibrationBoxPicking
}: UseMapCalibrationActionsOptions) {
  const buildMapCalibratedScene = async (draft: MapCalibrationDraft) => {
    if (!activeScene) {
      return null;
    }
    if (mapCalibrationBox) {
      return applyMapCalibrationDraft(activeScene, draft, { calibrationBox: mapCalibrationBox });
    }
    if (draft.alignGridToMap && mapAssetPath) {
      const dimensions = await loadImageDimensions(window.localVtt.toAssetUrl(mapAssetPath));
      return applyMapCalibrationDraft(activeScene, draft, { imageDimensions: dimensions });
    }
    return applyMapCalibrationDraft(activeScene, draft);
  };

  const getPlayerTargetDimensions = () => (campaign ? getPlayerViewTargetDimensions(campaign.playerDisplay, displays) : { width: 1920, height: 1080 });

  return {
    applyMapCalibration: (draft: MapCalibrationDraft) =>
      run(async () => {
        const nextScene = await buildMapCalibratedScene(draft);
        if (!nextScene) {
          return;
        }
        updateScene(nextScene);
        setMapCalibrationBox(null);
        setMapCalibrationAssistantOpen(false);
      }),
    fitMapToGridFromWizard: (columns: number, rows: number, fitMode: WizardMapFitMode) =>
      run(async () => {
        if (!campaign || !activeScene || !mapAssetPath) {
          return;
        }
        const dimensions = await loadImageDimensions(window.localVtt.toAssetUrl(mapAssetPath));
        const nextScene = buildWizardMapFitScene(activeScene, columns, rows, fitMode, dimensions, getPlayerTargetDimensions());
        updateScene(nextScene);
        const openResult = await window.localVtt.openPlayerView(getPlayerViewOpenOptions(campaign.playerDisplay));
        await sendSceneToPlayer(window.localVtt, campaign, nextScene, playerViewSyncOptions);
        applyPlayerViewModeState("scene", nextScene.id);
        const warning = getPlayerViewOpenWarning(openResult, campaign.playerDisplay);
        if (warning) {
          setError(warning);
        }
      }),
    applyMapFitPreset: (fitMode: MapFitPresetMode, gridPatch: Partial<Scene["grid"]> = {}) =>
      run(async () => {
        if (!campaign || !activeScene || !mapAssetPath) {
          return;
        }
        const dimensions = await loadImageDimensions(window.localVtt.toAssetUrl(mapAssetPath));
        const nextScene = buildMapFitPresetScene(activeScene, fitMode, dimensions, getPlayerTargetDimensions(), gridPatch);
        updateScene(nextScene);
        if (playerSceneId === activeScene.id) {
          await sendSceneToPlayer(window.localVtt, campaign, nextScene, playerViewSyncOptions);
        }
      }),
    updateSceneGridFromWizard: (gridType: GridType, sizePx: number, nextDisplay: DisplayCalibration) => {
      if (!campaign || !activeScene) {
        return;
      }
      const update = buildTableDisplayGridUpdate(campaign, activeScene, gridType, sizePx, nextDisplay);
      updateWorkspaceCampaignDraft(update.campaign, null);
      updateScene(update.scene, update.campaign, update.scene);
    },
    startMapCalibrationBoxCapture: () => {
      setMapCalibrationBox(null);
      setMapCalibrationBoxPicking(true);
      setMapCalibrationAssistantOpen(false);
      clearActiveCanvasTools();
    },
    captureMapCalibrationBox: (box: MapCalibrationBox) => {
      setMapCalibrationBox(box);
      setMapCalibrationBoxPicking(false);
      setMapCalibrationAssistantOpen(true);
    },
    cancelMapCalibrationBoxCapture: () => {
      setMapCalibrationBoxPicking(false);
      setMapCalibrationAssistantOpen(true);
    }
  };
}

function getPlayerViewTargetDimensions(display: DisplayCalibration, displays: DisplayInfo[]): { width: number; height: number } {
  const selectedDisplay = displays.find((candidate) => candidate.id === display.selectedDisplayId);
  const width = selectedDisplay?.bounds.width ?? display.screenResolutionWidth;
  const height = selectedDisplay?.bounds.height ?? display.screenResolutionHeight;
  return {
    width: Math.max(1, width || 1920),
    height: Math.max(1, height || 1080)
  };
}
