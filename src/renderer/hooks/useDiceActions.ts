import { useEffect, useRef } from "react";
import type { Campaign, DiceSettings, LiveTableEvent } from "../../shared/localvtt";
import {
  applyDiceSettingsPatch,
  buildLiveTableDiceClearEvent,
  buildLiveTableDiceRollEvent,
  rollDiceEvent,
  rollDiceExpression,
  saveDiceSettingsPreference,
  type DiceType
} from "../lib/dice";

interface UseDiceActionsOptions {
  campaign: Campaign | null;
  diceSettings: DiceSettings;
  emitLiveTableEvent: (event: LiveTableEvent) => void;
  setDiceSettingsPreference: (settings: DiceSettings) => void;
  setError: (message: string | null) => void;
  updateCampaignDraft: (nextCampaign: Campaign) => void;
  createId?: () => string;
  getNowMs?: () => number;
  getNowIso?: () => string;
}

export function useDiceActions({
  campaign,
  diceSettings,
  emitLiveTableEvent,
  setDiceSettingsPreference,
  setError,
  updateCampaignDraft,
  createId = () => crypto.randomUUID(),
  getNowMs = () => Date.now(),
  getNowIso = () => new Date().toISOString()
}: UseDiceActionsOptions) {
  const diceSettingsDraftRef = useRef<DiceSettings>(diceSettings);

  useEffect(() => {
    diceSettingsDraftRef.current = diceSettings;
  }, [diceSettings]);

  const updateDiceSettings = (patch: Partial<DiceSettings>) => {
    const result = applyDiceSettingsPatch(diceSettingsDraftRef.current, patch, campaign, getNowIso());
    diceSettingsDraftRef.current = result.settings;
    if (result.kind === "preference") {
      setDiceSettingsPreference(result.settings);
      saveDiceSettingsPreference(result.settings);
      return;
    }
    updateCampaignDraft(result.campaign);
  };

  const rollTableDie = (die: DiceType) => {
    const roll = rollDiceEvent(die);
    setError(null);
    emitLiveTableEvent(buildLiveTableDiceRollEvent(roll, diceSettings, createId(), getNowMs()));
  };

  const rollTableExpression = (expression: string, rollLabel?: string) => {
    try {
      const roll = rollDiceExpression(expression);
      setError(null);
      emitLiveTableEvent(buildLiveTableDiceRollEvent(roll, diceSettings, createId(), getNowMs(), rollLabel));
      return null;
    } catch (caught) {
      return caught instanceof Error ? caught.message : "Could not roll that dice expression.";
    }
  };

  const clearDiceRolls = () => {
    setError(null);
    emitLiveTableEvent(buildLiveTableDiceClearEvent(createId(), getNowMs()));
  };

  return {
    updateDiceSettings,
    rollTableDie,
    rollTableExpression,
    clearDiceRolls
  };
}
