import { describe, expect, it } from "vitest";
import {
  createAssetProtocolErrorResponse,
  createAssetProtocolFileResponse,
  getAssetProtocolStatFailureResponse,
  getAssetProtocolStatResultFailureResponse,
  LOCALVTT_ASSET_MISSING_MESSAGE,
  LOCALVTT_ASSET_NOT_REGISTERED_MESSAGE,
  LOCALVTT_UNKNOWN_RESOURCE_MESSAGE,
  resolveAssetProtocolRequest
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

  it("maps missing stat errors to missing asset responses", async () => {
    const response = getAssetProtocolStatFailureResponse(Object.assign(new Error("missing"), { code: "ENOENT" }));

    expect(response?.status).toBe(404);
    await expect(response?.text()).resolves.toBe(LOCALVTT_ASSET_MISSING_MESSAGE);
    expect(getAssetProtocolStatFailureResponse(Object.assign(new Error("denied"), { code: "EACCES" }))).toBeNull();
  });

  it("maps directories and other non-files to missing asset responses", async () => {
    expect(getAssetProtocolStatResultFailureResponse({ isFile: () => true })).toBeNull();

    const response = getAssetProtocolStatResultFailureResponse({ isFile: () => false });

    expect(response?.status).toBe(404);
    await expect(response?.text()).resolves.toBe(LOCALVTT_ASSET_MISSING_MESSAGE);
  });

  it("decorates fetched file responses for renderer asset access", async () => {
    const response = createAssetProtocolFileResponse(
      new Response("map-bytes", {
        status: 206,
        statusText: "Partial Content",
        headers: {
          "content-type": "image/png",
          "content-range": "bytes 0-8/9"
        }
      })
    );

    expect(response.status).toBe(206);
    expect(response.statusText).toBe("Partial Content");
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("content-range")).toBe("bytes 0-8/9");
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, HEAD, OPTIONS");
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Range");
    expect(response.headers.get("Cross-Origin-Resource-Policy")).toBe("cross-origin");
    await expect(response.text()).resolves.toBe("map-bytes");
  });

  it("rejects unknown localvtt resources", async () => {
    const resolution = resolveAssetProtocolRequest("localvtt://other/C%3A%2FCampaign%2Fmap.png", () => true, () => true);

    expect(resolution.ok).toBe(false);
    if (!resolution.ok) {
      expect(resolution.response.status).toBe(404);
      await expect(resolution.response.text()).resolves.toBe(LOCALVTT_UNKNOWN_RESOURCE_MESSAGE);
    }
  });

  it("rejects unknown asset paths", async () => {
    for (const resolution of [
      resolveAssetProtocolRequest("localvtt://asset/C%3A%2FCampaign%2Fmap.png", () => true, () => false)
    ]) {
      expect(resolution.ok).toBe(false);
      if (!resolution.ok) {
        expect(resolution.response.status).toBe(403);
        await expect(resolution.response.text()).resolves.toBe(LOCALVTT_ASSET_NOT_REGISTERED_MESSAGE);
      }
    }
  });

  it("resolves registered asset request file paths", () => {
    const resolution = resolveAssetProtocolRequest("localvtt://asset/C%3A%2FCampaign%2Fassets%2Fmaps%2Fdungeon.png", () => false, () => true);

    expect(resolution).toMatchObject({
      ok: true,
      filePath: expect.stringContaining("Campaign")
    });
  });
});
