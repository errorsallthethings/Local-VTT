import path from "node:path";

export const LOCALVTT_ASSET_NOT_REGISTERED_MESSAGE = "LocalVTT asset is not registered for an opened campaign.";
export const LOCALVTT_ASSET_MISSING_MESSAGE = "LocalVTT asset file could not be found. It may have been moved, renamed, or deleted.";
export const LOCALVTT_UNKNOWN_RESOURCE_MESSAGE = "Unknown LocalVTT resource.";

export type AssetProtocolStatResult = {
  isFile: () => boolean;
};

export type AssetProtocolRequestResolution =
  | {
      ok: true;
      filePath: string;
    }
  | {
      ok: false;
      response: Response;
    };

export function createAssetProtocolErrorResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
}

export function getAssetProtocolStatFailureResponse(caught: unknown): Response | null {
  const error = caught as NodeJS.ErrnoException;
  return error.code === "ENOENT" ? createAssetProtocolErrorResponse(LOCALVTT_ASSET_MISSING_MESSAGE, 404) : null;
}

export function getAssetProtocolStatResultFailureResponse(stats: AssetProtocolStatResult): Response | null {
  return stats.isFile() ? null : createAssetProtocolErrorResponse(LOCALVTT_ASSET_MISSING_MESSAGE, 404);
}

export function resolveAssetProtocolRequest(
  requestUrl: string,
  isInsideOpenedCampaign: (candidatePath: string) => boolean,
  isKnownAssetPath: (candidatePath: string) => boolean
): AssetProtocolRequestResolution {
  const url = new URL(requestUrl);
  if (url.hostname !== "asset") {
    return { ok: false, response: createAssetProtocolErrorResponse(LOCALVTT_UNKNOWN_RESOURCE_MESSAGE, 404) };
  }

  const filePath = path.resolve(decodeURIComponent(url.pathname.slice(1)));
  void isInsideOpenedCampaign;
  if (!isKnownAssetPath(filePath)) {
    return { ok: false, response: createAssetProtocolErrorResponse(LOCALVTT_ASSET_NOT_REGISTERED_MESSAGE, 403) };
  }

  return { ok: true, filePath };
}

export function createAssetProtocolFileResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Range");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
