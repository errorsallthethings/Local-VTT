import { describe, expect, it } from "vitest";
import {
  createAssetProtocolErrorResponse,
  LOCALVTT_ASSET_MISSING_MESSAGE,
  LOCALVTT_ASSET_NOT_REGISTERED_MESSAGE
} from "../../electron/assetProtocol";

describe("asset protocol responses", () => {
  it("formats blocked asset responses as text", async () => {
    const response = createAssetProtocolErrorResponse(LOCALVTT_ASSET_NOT_REGISTERED_MESSAGE, 403);

    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    await expect(response.text()).resolves.toBe(LOCALVTT_ASSET_NOT_REGISTERED_MESSAGE);
  });

  it("formats missing asset responses as text", async () => {
    const response = createAssetProtocolErrorResponse(LOCALVTT_ASSET_MISSING_MESSAGE, 404);

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe(LOCALVTT_ASSET_MISSING_MESSAGE);
  });
});
