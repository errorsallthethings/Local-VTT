export const LOCALVTT_ASSET_NOT_REGISTERED_MESSAGE = "LocalVTT asset is not registered for an opened campaign.";
export const LOCALVTT_ASSET_MISSING_MESSAGE = "LocalVTT asset file could not be found. It may have been moved, renamed, or deleted.";

export type AssetProtocolStatResult = {
  isFile: () => boolean;
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
