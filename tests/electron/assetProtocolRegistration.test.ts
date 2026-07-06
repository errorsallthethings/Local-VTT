import { describe, expect, it, vi } from "vitest";
import { LOCALVTT_ASSET_MISSING_MESSAGE } from "../../electron/assetProtocol";
import { registerLocalAssetProtocol } from "../../electron/assetProtocolRegistration";

type ProtocolHandler = (request: Request) => Promise<Response>;

function createProtocolHarness() {
  let handler: ProtocolHandler | null = null;
  const protocol = {
    handle: vi.fn((_scheme: string, registeredHandler: ProtocolHandler) => {
      handler = registeredHandler;
    })
  };

  return {
    protocol,
    request: (url: string) => {
      if (!handler) {
        throw new Error("Protocol handler was not registered.");
      }
      return handler(new Request(url));
    }
  };
}

describe("asset protocol registration", () => {
  it("registers the localvtt protocol handler", () => {
    const harness = createProtocolHarness();

    registerLocalAssetProtocol({
      fetchFile: vi.fn(),
      isInsideOpenedCampaign: () => true,
      isKnownAssetPath: () => true,
      isTemporaryExternalAssetPath: () => false,
      protocol: harness.protocol,
      statFile: vi.fn()
    });

    expect(harness.protocol.handle).toHaveBeenCalledWith("localvtt", expect.any(Function));
  });

  it("fetches registered asset files through file URLs and decorates the response", async () => {
    const harness = createProtocolHarness();
    const fetchFile = vi.fn().mockResolvedValue(new Response("asset bytes", { headers: { "content-type": "image/png" } }));

    registerLocalAssetProtocol({
      fetchFile,
      isInsideOpenedCampaign: () => true,
      isKnownAssetPath: () => true,
      isTemporaryExternalAssetPath: () => false,
      protocol: harness.protocol,
      statFile: vi.fn().mockResolvedValue({ isFile: () => true })
    });

    const response = await harness.request("localvtt://asset/C%3A%5CCampaign%5Cassets%5Cmaps%5Cmap.png");

    expect(fetchFile).toHaveBeenCalledWith(expect.stringMatching(/^file:\/\/\/C:/));
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    await expect(response.text()).resolves.toBe("asset bytes");
  });

  it("returns protocol resolution errors before touching the filesystem", async () => {
    const harness = createProtocolHarness();
    const statFile = vi.fn();

    registerLocalAssetProtocol({
      fetchFile: vi.fn(),
      isInsideOpenedCampaign: () => false,
      isKnownAssetPath: () => false,
      isTemporaryExternalAssetPath: () => false,
      protocol: harness.protocol,
      statFile
    });

    const response = await harness.request("localvtt://asset/C%3A%5COutside%5Cmap.png");

    expect(response.status).toBe(403);
    expect(statFile).not.toHaveBeenCalled();
  });

  it("maps missing files to a missing asset response", async () => {
    const harness = createProtocolHarness();

    registerLocalAssetProtocol({
      fetchFile: vi.fn(),
      isInsideOpenedCampaign: () => true,
      isKnownAssetPath: () => true,
      isTemporaryExternalAssetPath: () => false,
      protocol: harness.protocol,
      statFile: vi.fn().mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }))
    });

    const response = await harness.request("localvtt://asset/C%3A%5CCampaign%5Cassets%5Cmaps%5Cmissing.png");

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe(LOCALVTT_ASSET_MISSING_MESSAGE);
  });

  it("rethrows unexpected stat failures", async () => {
    const harness = createProtocolHarness();
    const caught = Object.assign(new Error("denied"), { code: "EACCES" });

    registerLocalAssetProtocol({
      fetchFile: vi.fn(),
      isInsideOpenedCampaign: () => true,
      isKnownAssetPath: () => true,
      isTemporaryExternalAssetPath: () => false,
      protocol: harness.protocol,
      statFile: vi.fn().mockRejectedValue(caught)
    });

    await expect(harness.request("localvtt://asset/C%3A%5CCampaign%5Cassets%5Cmaps%5Cdenied.png")).rejects.toBe(caught);
  });
});
