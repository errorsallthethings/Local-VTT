import { BrowserWindow, nativeImage } from "electron";
import { pathToFileURL } from "node:url";
import type { SquareCropRect } from "../src/shared/localvtt.js";

export interface ThumbnailCreationResult {
  thumbnail?: Buffer;
  failureReason?: string;
}

export function createImageMapThumbnail(sourcePath: string): Buffer | undefined {
  const image = nativeImage.createFromPath(sourcePath);
  const sourceSize = image.getSize();
  if (image.isEmpty() || sourceSize.width <= 0 || sourceSize.height <= 0) {
    return undefined;
  }

  const maxWidth = 180;
  const maxHeight = 112;
  const scale = Math.min(maxWidth / sourceSize.width, maxHeight / sourceSize.height, 1);
  const thumbnail = image.resize({
    width: Math.max(1, Math.round(sourceSize.width * scale)),
    height: Math.max(1, Math.round(sourceSize.height * scale)),
    quality: "best"
  });
  return thumbnail.toJPEG(78);
}

export async function createSquareImageThumbnail(sourcePath: string, crop?: SquareCropRect): Promise<Buffer | undefined> {
  const image = nativeImage.createFromPath(sourcePath);
  const sourceSize = image.getSize();
  if (image.isEmpty() || sourceSize.width <= 0 || sourceSize.height <= 0) {
    return undefined;
  }

  const defaultCropSize = Math.min(sourceSize.width, sourceSize.height);
  const requestedCrop = crop ?? null;
  const requestedSize = requestedCrop?.size;
  const requestedX = requestedCrop?.x;
  const requestedY = requestedCrop?.y;
  const cropSize = Math.max(
    1,
    Math.round(
      Math.min(
        sourceSize.width,
        sourceSize.height,
        typeof requestedSize === "number" && Number.isFinite(requestedSize) ? requestedSize : defaultCropSize
      )
    )
  );
  const sourceX = Math.round(
    Math.max(0, Math.min(sourceSize.width - cropSize, typeof requestedX === "number" && Number.isFinite(requestedX) ? requestedX : (sourceSize.width - cropSize) / 2))
  );
  const sourceY = Math.round(
    Math.max(0, Math.min(sourceSize.height - cropSize, typeof requestedY === "number" && Number.isFinite(requestedY) ? requestedY : (sourceSize.height - cropSize) / 2))
  );
  const thumbnail = image.crop({ x: sourceX, y: sourceY, width: cropSize, height: cropSize }).resize({
    width: 512,
    height: 512,
    quality: "best"
  });

  return thumbnail.toJPEG(86);
}

export async function createVideoMapThumbnail(sourcePath: string): Promise<ThumbnailCreationResult> {
  const win = new BrowserWindow({
    show: false,
    width: 220,
    height: 140,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  try {
    const sourceUrl = pathToFileURL(sourcePath).toString();
    await win.loadURL(sourceUrl);
    const result = (await win.webContents.executeJavaScript(
      `
        new Promise((resolve) => {
          const video = document.querySelector("video") ?? document.createElement("video");
          const finish = (value) => {
            clearTimeout(timeoutId);
            if (!document.body.contains(video)) {
              video.remove();
            }
            resolve(value);
          };
          const capture = () => {
            if (!video.videoWidth || !video.videoHeight) {
              finish({ failureReason: "No video frame was available." });
              return;
            }
            const maxWidth = 180;
            const maxHeight = 112;
            const scale = Math.min(maxWidth / video.videoWidth, maxHeight / video.videoHeight, 1);
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
            canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              finish({ failureReason: "Video frame could not be drawn." });
              return;
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            finish({ dataUrl: canvas.toDataURL("image/jpeg", 0.78) });
          };
          const timeoutId = setTimeout(() => finish({ failureReason: "Video metadata timed out." }), 5000);
          video.muted = true;
          video.preload = "metadata";
          video.playsInline = true;
          video.addEventListener("error", () => finish({ failureReason: "Video could not be decoded by Electron." }), { once: true });
          video.addEventListener("loadedmetadata", () => {
            const seekTime = Number.isFinite(video.duration) && video.duration > 0.1 ? 0.05 : 0;
            if (seekTime === 0) {
              video.addEventListener("loadeddata", capture, { once: true });
            } else {
              video.addEventListener("seeked", capture, { once: true });
              video.currentTime = seekTime;
            }
          }, { once: true });
          if (!document.body.contains(video)) {
            video.src = ${JSON.stringify(sourceUrl)};
            video.load();
          } else if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            video.dispatchEvent(new Event("loadedmetadata"));
          }
        })
      `
    )) as { dataUrl?: string; failureReason?: string } | null;
    const thumbnail = dataUrlToBuffer(result?.dataUrl ?? null);
    if (!thumbnail) {
      return { failureReason: result?.failureReason ?? "Video frame could not be converted to a thumbnail." };
    }
    return { thumbnail };
  } catch {
    return { failureReason: "Video could not be decoded by Electron." };
  } finally {
    if (!win.isDestroyed()) {
      win.destroy();
    }
  }
}

export function dataUrlToBuffer(dataUrl: string | null): Buffer | undefined {
  const match = /^data:image\/jpeg;base64,(.+)$/i.exec(dataUrl ?? "");
  return match ? Buffer.from(match[1], "base64") : undefined;
}
