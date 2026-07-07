import type { Token, TokenConditionId } from "../../../shared/localvtt";

export function getTokenConditionsVisibleInPlayer(token: Token): boolean {
  const conditions = token.conditions ?? [];
  return conditions.length === 0 || conditions.every((condition) => condition.visibleInPlayer);
}

export function setTokenCondition(tokens: readonly Token[], tokenId: string, conditionId: TokenConditionId, enabled: boolean, visibleInPlayer: boolean): Token[] {
  return tokens.map((token) => {
    if (token.id !== tokenId) {
      return token;
    }
    const conditions = token.conditions ?? [];
    if (!enabled) {
      return { ...token, conditions: conditions.filter((condition) => condition.id !== conditionId) };
    }
    if (conditions.some((condition) => condition.id === conditionId)) {
      return token;
    }
    return { ...token, conditions: [...conditions, { id: conditionId, visibleInPlayer }] };
  });
}

export function setTokenConditionsPlayerVisibility(tokens: readonly Token[], tokenId: string, visibleInPlayer: boolean): Token[] {
  return tokens.map((token) => {
    if (token.id !== tokenId) {
      return token;
    }
    return {
      ...token,
      conditions: (token.conditions ?? []).map((condition) => ({ ...condition, visibleInPlayer }))
    };
  });
}
