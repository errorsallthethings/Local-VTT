import { BrowserWindow, type WebContents } from "electron";

import { dataUrlToBuffer, createVideoMapThumbnail, type ThumbnailCreationResult } from "./assets.js";
import { createRendererVideoThumbnailPlan, type RendererVideoThumbnailResult } from "./rendererVideoThumbnailPlan.js";
import { createVideoThumbnailFallbackFailure } from "./thumbnailDiagnostics.js";

export async function createVideoMapThumbnailWithFallback(
  sourcePath: string,
  assetId: string,
  rendererWebContents?: WebContents
): Promise<ThumbnailCreationResult> {
  const primaryResult = await createVideoMapThumbnail(sourcePath);
  if (primaryResult.thumbnail) {
    return primaryResult;
  }

  const protocolResult = await createHiddenProtocolVideoMapThumbnail(sourcePath, assetId);
  if (protocolResult.thumbnail || !rendererWebContents || rendererWebContents.isDestroyed()) {
    return protocolResult.thumbnail
      ? protocolResult
      : { failureReason: createVideoThumbnailFallbackFailure(primaryResult.failureReason, protocolResult.failureReason) };
  }

  const fallbackResult = await createRendererVideoMapThumbnail(sourcePath, assetId, rendererWebContents);
  if (fallbackResult.thumbnail) {
    return fallbackResult;
  }

  return {
    failureReason: createVideoThumbnailFallbackFailure(
      createVideoThumbnailFallbackFailure(primaryResult.failureReason, protocolResult.failureReason),
      fallbackResult.failureReason
    )
  };
}

async function createHiddenProtocolVideoMapThumbnail(sourcePath: string, assetId: string): Promise<ThumbnailCreationResult> {
  const thumbnailPlan = createRendererVideoThumbnailPlan(sourcePath, assetId);
  const win = new BrowserWindow({
    show: false,
    width: thumbnailPlan.maxWidth,
    height: thumbnailPlan.maxHeight,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  try {
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            html,
            body {
              width: 100%;
              height: 100%;
              margin: 0;
              overflow: hidden;
              background: #101318;
            }
          </style>
        </head>
        <body></body>
      </html>
    `;
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const result = (await win.webContents.executeJavaScript(
      `
        new Promise((resolve) => {
          const video = document.querySelector("video") ?? document.createElement("video");
          const finish = (value) => {
            clearTimeout(timeoutId);
            resolve(value);
          };
          const prepareVideo = () => {
            document.documentElement.style.cssText = "margin:0;width:100%;height:100%;background:#101318;overflow:hidden;";
            document.body.style.cssText = "margin:0;width:100%;height:100%;background:#101318;overflow:hidden;";
            video.style.cssText = "width:100%;height:100%;object-fit:contain;display:block;background:#101318;";
          };
          const captureWhenReady = () => {
            if (!video.videoWidth || !video.videoHeight || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
              return false;
            }
            prepareVideo();
            requestAnimationFrame(() => {
              requestAnimationFrame(() => finish({ ready: true }));
            });
            return true;
          };
          const timeoutId = setTimeout(() => finish({ failureReason: "Hidden protocol video metadata timed out." }), ${thumbnailPlan.timeoutMs});
          video.muted = true;
          video.preload = "auto";
          video.playsInline = true;
          video.addEventListener("error", () => finish({ failureReason: "Hidden protocol video could not be decoded." }), { once: true });
          video.addEventListener("loadeddata", captureWhenReady, { once: true });
          video.addEventListener("canplay", captureWhenReady, { once: true });
          video.addEventListener("seeked", captureWhenReady, { once: true });
          video.addEventListener("loadedmetadata", () => {
            const seekTime = Number.isFinite(video.duration) && video.duration > 0.1 ? 0.05 : 0;
            if (seekTime > 0) {
              video.currentTime = seekTime;
            } else {
              captureWhenReady();
            }
          }, { once: true });
          if (!document.body.contains(video)) {
            document.body.append(video);
            video.src = ${JSON.stringify(thumbnailPlan.thumbnailAssetUrl)};
            video.load();
          } else {
            prepareVideo();
            captureWhenReady();
          }
        })
      `,
      true
    )) as { ready?: boolean; failureReason?: string } | null;
    if (!result?.ready) {
      return { failureReason: result?.failureReason ?? "Hidden protocol video frame could not be prepared." };
    }
    const image = await win.webContents.capturePage({ x: 0, y: 0, width: thumbnailPlan.maxWidth, height: thumbnailPlan.maxHeight });
    const thumbnail = image.isEmpty() ? undefined : image.toJPEG(78);
    if (!thumbnail) {
      return { failureReason: "Hidden protocol video frame could not be captured." };
    }
    return { thumbnail };
  } catch {
    return { failureReason: "Hidden protocol video thumbnail capture failed." };
  } finally {
    if (!win.isDestroyed()) {
      win.destroy();
    }
  }
}

async function createRendererVideoMapThumbnail(sourcePath: string, assetId: string, rendererWebContents: WebContents): Promise<ThumbnailCreationResult> {
  const thumbnailPlan = createRendererVideoThumbnailPlan(sourcePath, assetId);
  try {
    const result = (await rendererWebContents.executeJavaScript(
      `
        new Promise((resolve) => {
          let createdVideo = null;
          let readinessIntervalId = null;
          let completed = false;
          const describeVideos = () => {
            const videos = Array.from(document.querySelectorAll("video"));
            const descriptions = videos.map((candidate, index) => {
              const source = candidate.currentSrc || candidate.src || "";
              return [
                "#" + index,
                "assetId=" + (candidate.dataset.mapAssetId || "none"),
                "ready=" + candidate.readyState,
                "size=" + candidate.videoWidth + "x" + candidate.videoHeight,
                "paused=" + candidate.paused,
                "srcMatches=" + String(source.startsWith(${JSON.stringify(thumbnailPlan.baseAssetUrl)}))
              ].join(" ");
            });
            return descriptions.length > 0 ? descriptions.join("; ") : "no video elements mounted";
          };
          const finish = (value) => {
            if (completed) {
              return;
            }
            completed = true;
            clearTimeout(timeoutId);
            if (readinessIntervalId !== null) {
              clearInterval(readinessIntervalId);
            }
            if (createdVideo) {
              createdVideo.removeAttribute("src");
              createdVideo.load();
              createdVideo.remove();
            }
            resolve(value);
          };
          const capture = (sourceVideo) => {
            if (!sourceVideo.videoWidth || !sourceVideo.videoHeight) {
              finish({ failureReason: "Renderer video frame was not available." });
              return;
            }
            const scale = Math.min(${thumbnailPlan.maxWidth} / sourceVideo.videoWidth, ${thumbnailPlan.maxHeight} / sourceVideo.videoHeight, 1);
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(sourceVideo.videoWidth * scale));
            canvas.height = Math.max(1, Math.round(sourceVideo.videoHeight * scale));
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              finish({ failureReason: "Renderer video frame could not be drawn." });
              return;
            }
            try {
              ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
              finish({ dataUrl: canvas.toDataURL("image/jpeg", 0.78) });
            } catch {
              finish({ failureReason: "Renderer video frame could not be converted to a thumbnail." });
            }
          };
          const timeoutId = setTimeout(() => {
            finish({ failureReason: "Renderer video metadata timed out. Mounted videos: " + describeVideos() });
          }, ${thumbnailPlan.timeoutMs});
          const matchesAsset = (candidate) => {
            const currentSource = candidate.currentSrc || candidate.src || "";
            return candidate.dataset.mapAssetId === ${JSON.stringify(assetId)}
              || currentSource.startsWith(${JSON.stringify(thumbnailPlan.baseAssetUrl)});
          };
          const readySceneVideo = Array.from(document.querySelectorAll("video")).find((candidate) =>
            matchesAsset(candidate) &&
            candidate.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            candidate.videoWidth > 0 &&
            candidate.videoHeight > 0
          );
          if (readySceneVideo) {
            capture(readySceneVideo);
            return;
          }
          const captureReadyVideo = (candidate) => {
            if (
              candidate.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
              candidate.videoWidth > 0 &&
              candidate.videoHeight > 0
            ) {
              capture(candidate);
              return true;
            }
            return false;
          };
          const video = document.createElement("video");
          createdVideo = video;
          video.muted = true;
          video.preload = "auto";
          video.playsInline = true;
          video.style.cssText = "position:absolute;left:-10000px;top:-10000px;width:1px;height:1px;opacity:0;pointer-events:none;";
          video.addEventListener("error", () => finish({ failureReason: "Renderer could not decode the video map." }), { once: true });
          video.addEventListener("loadedmetadata", () => {
            const seekTime = Number.isFinite(video.duration) && video.duration > 0.1 ? 0.05 : 0;
            if (seekTime === 0) {
              if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                capture(video);
              } else {
                video.addEventListener("loadeddata", () => capture(video), { once: true });
              }
            } else {
              video.addEventListener("seeked", () => capture(video), { once: true });
              video.currentTime = seekTime;
            }
          }, { once: true });
          document.body.append(video);
          video.src = ${JSON.stringify(thumbnailPlan.thumbnailAssetUrl)};
          video.load();
          readinessIntervalId = setInterval(() => {
            captureReadyVideo(video);
          }, 100);
        })
      `,
      true
    )) as RendererVideoThumbnailResult | null;
    const thumbnail = dataUrlToBuffer(result?.dataUrl ?? null);
    if (!thumbnail) {
      return { failureReason: result?.failureReason ?? "Renderer video frame could not be captured." };
    }
    return { thumbnail };
  } catch {
    return { failureReason: "Renderer video thumbnail capture failed." };
  }
}
