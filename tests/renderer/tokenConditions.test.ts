import { describe, expect, it } from "vitest";
import type { Token } from "../../src/shared/localvtt";
import { getTokenConditionsVisibleInPlayer, setTokenCondition, setTokenConditionsPlayerVisibility } from "../../src/renderer/lib/tokens";

function token(overrides: Partial<Token> = {}): Token {
  return {
    id: "token-1",
    name: "Token",
    position: { x: 0, y: 0 },
    size: { width: 50, height: 50 },
    visibleInPlayer: true,
    ...overrides
  };
}

describe("token condition helpers", () => {
  it("treats tokens without conditions as Player View visible", () => {
    expect(getTokenConditionsVisibleInPlayer(token())).toBe(true);
    expect(getTokenConditionsVisibleInPlayer(token({ conditions: [] }))).toBe(true);
  });

  it("requires all token conditions to be Player View visible", () => {
    expect(
      getTokenConditionsVisibleInPlayer(
        token({
          conditions: [
            { id: "bloodied", visibleInPlayer: true },
            { id: "marked", visibleInPlayer: false }
          ]
        })
      )
    ).toBe(false);
  });

  it("adds new conditions with the current Player View visibility", () => {
    const [updated] = setTokenCondition([token()], "token-1", "bloodied", true, false);

    expect(updated.conditions).toEqual([{ id: "bloodied", visibleInPlayer: false }]);
  });

  it("does not duplicate an existing condition", () => {
    const original = token({ conditions: [{ id: "bloodied", visibleInPlayer: true }] });
    const [updated] = setTokenCondition([original], "token-1", "bloodied", true, false);

    expect(updated).toBe(original);
  });

  it("removes conditions by id", () => {
    const [updated] = setTokenCondition(
      [
        token({
          conditions: [
            { id: "bloodied", visibleInPlayer: true },
            { id: "marked", visibleInPlayer: true }
          ]
        })
      ],
      "token-1",
      "bloodied",
      false,
      true
    );

    expect(updated.conditions).toEqual([{ id: "marked", visibleInPlayer: true }]);
  });

  it("updates Player View visibility for each condition on the target token only", () => {
    const other = token({ id: "token-2", conditions: [{ id: "bloodied", visibleInPlayer: true }] });
    const [updated, unchanged] = setTokenConditionsPlayerVisibility(
      [token({ conditions: [{ id: "bloodied", visibleInPlayer: true }] }), other],
      "token-1",
      false
    );

    expect(updated.conditions).toEqual([{ id: "bloodied", visibleInPlayer: false }]);
    expect(unchanged).toBe(other);
  });
});
