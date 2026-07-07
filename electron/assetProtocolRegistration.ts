import { stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import {
  createAssetProtocolFileResponse,
  getAssetProtocolStatFailureResponse,
  getAssetProtocolStatResultFailureResponse,
  resolveAssetProtocolRequest
} from "./assetProtocol.js";

export interface AssetProtocolRegistrar {
  handle(scheme: string, handler: (request: Request) => Promise<Response>): void;
}

export interface RegisterLocalAssetProtocolOptions {
  fetchFile: (url: string) => Promise<Response>;
  isInsideOpenedCampaign: (candidatePath: string) => boolean;
  isKnownAssetPath: (candidatePath: string) => boolean;
  isTemporaryExternalAssetPath: (candidatePath: string) => boolean;
  protocol: AssetProtocolRegistrar;
  statFile?: typeof stat;
}

export function registerLocalAssetProtocol({
  fetchFile,
  isInsideOpenedCampaign,
  isKnownAssetPath,
  isTemporaryExternalAssetPath,
  protocol,
  statFile = stat
}: RegisterLocalAssetProtocolOptions): void {
  protocol.handle("localvtt", async (request) => {
    const resolvedRequest = resolveAssetProtocolRequest(request.url, isInsideOpenedCampaign, isKnownAssetPath, isTemporaryExternalAssetPath);
    if (!resolvedRequest.ok) {
      return resolvedRequest.response;
    }

    const filePath = resolvedRequest.filePath;
    try {
      const stats = await statFile(filePath);
      const failureResponse = getAssetProtocolStatResultFailureResponse(stats);
      if (failureResponse) {
        return failureResponse;
      }
    } catch (caught) {
      const failureResponse = getAssetProtocolStatFailureResponse(caught);
      if (failureResponse) {
        return failureResponse;
      }
      throw caught;
    }

    return createAssetProtocolFileResponse(await fetchFile(pathToFileURL(filePath).toString()));
  });
}
