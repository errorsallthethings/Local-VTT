import { BrowserWindow, nativeImage } from "electron";
import { pathToFileURL } from "node:url";

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

export async function createSquareImageThumbnail(sourcePath: string): Promise<Buffer | undefined> {
  const win = new BrowserWindow({
    show: false,
    width: 512,
    height: 512,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: false
    }
  });

  try {
    await win.loadURL("data:text/html,<html><body></body></html>");
    const sourceUrl = pathToFileURL(sourcePath).toString();
    const dataUrl = await win.webContents.executeJavaScript(
      `
        new Promise((resolve) => {
          const image = new Image();
          image.onload = () => {
            const sourceWidth = image.naturalWidth || image.width;
            const sourceHeight = image.naturalHeight || image.height;
            if (!sourceWidth || !sourceHeight) {
              resolve(null);
              return;
            }
            const cropSize = Math.min(sourceWidth, sourceHeight);
            const sourceX = Math.max(0, Math.floor((sourceWidth - cropSize) / 2));
            const sourceY = Math.max(0, Math.floor((sourceHeight - cropSize) / 2));
            const outputSize = Math.min(512, cropSize);
            const canvas = document.createElement("canvas");
            canvas.width = outputSize;
            canvas.height = outputSize;
            const context = canvas.getContext("2d");
            if (!context) {
              resolve(null);
              return;
            }
            context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, outputSize, outputSize);
            resolve(canvas.toDataURL("image/jpeg", 0.86));
          };
          image.onerror = () => resolve(null);
          image.src = ${JSON.stringify(sourceUrl)};
        })
      `,
      true
    );
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/jpeg;base64,")) {
      return undefined;
    }
    return Buffer.from(dataUrl.split(",")[1], "base64");
  } finally {
    if (!win.isDestroyed()) {
      win.destroy();
    }
  }
}

export async function createVideoMapThumbnail(sourcePath: string): Promise<Buffer | undefined> {
  const win = new BrowserWindow({
    show: false,
    width: 220,
    height: 140,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: false
    }
  });

  try {
    await win.loadURL("data:text/html,<html><body></body></html>");
    const dataUrl = (await win.webContents.executeJavaScript(
      `
        new Promise((resolve) => {
          const video = document.createElement("video");
          const finish = (value) => {
            clearTimeout(timeoutId);
            video.remove();
            resolve(value);
          };
          const capture = () => {
            if (!video.videoWidth || !video.videoHeight) {
              finish(null);
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
              finish(null);
              return;
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            finish(canvas.toDataURL("image/jpeg", 0.78));
          };
          const timeoutId = setTimeout(() => finish(null), 5000);
          video.muted = true;
          video.preload = "metadata";
          video.playsInline = true;
          video.addEventListener("error", () => finish(null), { once: true });
          video.addEventListener("loadedmetadata", () => {
            const seekTime = Number.isFinite(video.duration) && video.duration > 0.1 ? 0.05 : 0;
            if (seekTime === 0) {
              video.addEventListener("loadeddata", capture, { once: true });
            } else {
              video.addEventListener("seeked", capture, { once: true });
              video.currentTime = seekTime;
            }
          }, { once: true });
          video.src = ${JSON.stringify(pathToFileURL(sourcePath).toString())};
          video.load();
        })
      `
    )) as string | null;
    return dataUrlToBuffer(dataUrl);
  } catch {
    return undefined;
  } finally {
    if (!win.isDestroyed()) {
      win.destroy();
    }
  }
}

function dataUrlToBuffer(dataUrl: string | null): Buffer | undefined {
  const match = /^data:image\/jpeg;base64,(.+)$/i.exec(dataUrl ?? "");
  return match ? Buffer.from(match[1], "base64") : undefined;
}
