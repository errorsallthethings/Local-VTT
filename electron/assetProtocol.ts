export const LOCALVTT_ASSET_NOT_REGISTERED_MESSAGE = "LocalVTT asset is not registered for an opened campaign.";
export const LOCALVTT_ASSET_MISSING_MESSAGE = "LocalVTT asset file could not be found. It may have been moved, renamed, or deleted.";

export function createAssetProtocolErrorResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
