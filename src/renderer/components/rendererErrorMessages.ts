export interface RendererErrorMessage {
  title: string;
  body: string;
  recovery: string;
}

const DEFAULT_RENDERER_ERROR_MESSAGE: RendererErrorMessage = {
  title: "Local VTT ran into a renderer error",
  body: "The app stopped rendering, but the window is still alive. Your campaign files are stored separately from the app.",
  recovery: "Close and reopen Local VTT before continuing."
};

const LAZY_LOAD_ERROR_MESSAGE: RendererErrorMessage = {
  title: "Local VTT could not load part of the app",
  body: "A screen or feature bundle failed to load. This can happen if the app was updated, moved, or partially replaced while a window was open.",
  recovery: "Close every Local VTT window and reopen the app. If this keeps happening, reinstall this release before opening your campaign again."
};

export function getRendererErrorMessage(error: Error | null): RendererErrorMessage {
  if (isLazyLoadError(error)) {
    return LAZY_LOAD_ERROR_MESSAGE;
  }

  return DEFAULT_RENDERER_ERROR_MESSAGE;
}

export function isLazyLoadError(error: Error | null): boolean {
  if (!error) {
    return false;
  }

  const text = `${error.name} ${error.message} ${error.stack ?? ""}`.toLowerCase();
  return (
    text.includes("chunkloaderror") ||
    text.includes("loading chunk") ||
    text.includes("failed to fetch dynamically imported module") ||
    text.includes("error loading dynamically imported module") ||
    text.includes("importing a module script failed")
  );
}
