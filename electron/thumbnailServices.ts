import type { WebContents } from "electron";
import { mapMediaType } from "./assetImportValidation.js";
import type { MapThumbnailResult } from "./mapThumbnailRepair.js";

export interface ThumbnailServices {
  createMapThumbnail: (campaignPath: string, sourcePath: string, assetId: string, rendererWebContents?: WebContents) => Promise<MapThumbnailResult>;
  createTokenThumbnail: (campaignPath: string, sourcePath: string, assetId: string) => Promise<MapThumbnailResult>;
}

export interface CreateThumbnailServicesOptions {
  createImageMapThumbnail: (sourcePath: string) => Buffer | null | undefined;
  createSquareImageThumbnail: (sourcePath: string) => Promise<Buffer | null | undefined>;
  createVideoMapThumbnailWithFallback: (sourcePath: string, assetId: string, rendererWebContents?: WebContents) => Promise<{ thumbnail?: Buffer | null; failureReason?: string }>;
  writeAssetThumbnail: (campaignPath: string, assetId: string, thumbnail: Buffer) => Promise<string>;
}

export function createThumbnailServices({
  createImageMapThumbnail,
  createSquareImageThumbnail,
  createVideoMapThumbnailWithFallback,
  writeAssetThumbnail
}: CreateThumbnailServicesOptions): ThumbnailServices {
  const createMapThumbnail: ThumbnailServices["createMapThumbnail"] = async (campaignPath, sourcePath, assetId, rendererWebContents) => {
    const mediaType = mapMediaType(sourcePath);
    const thumbnailResult = mediaType === "video"
      ? await createVideoMapThumbnailWithFallback(sourcePath, assetId, rendererWebContents)
      : { thumbnail: createImageMapThumbnail(sourcePath) };
    const thumbnail = thumbnailResult.thumbnail;
    if (!thumbnail) {
      return { failureReason: thumbnailResult.failureReason ?? "Image file could not be decoded by Electron." };
    }

    return { thumbnailRelativePath: await writeAssetThumbnail(campaignPath, assetId, thumbnail) };
  };

  const createTokenThumbnail: ThumbnailServices["createTokenThumbnail"] = async (campaignPath, sourcePath, assetId) => {
    const thumbnail = await createSquareImageThumbnail(sourcePath);
    if (!thumbnail) {
      return { failureReason: "Image file could not be decoded by Electron." };
    }
    return { thumbnailRelativePath: await writeAssetThumbnail(campaignPath, assetId, thumbnail) };
  };

  return {
    createMapThumbnail,
    createTokenThumbnail
  };
}
