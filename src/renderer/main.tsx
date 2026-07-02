import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { installDevLocalVtt } from "./devLocalVtt";
import { getRendererRoute } from "./router";
import "./styles.css";

const GmApp = lazy(() => import("./views/GmApp").then((module) => ({ default: module.GmApp })));
const PlayerApp = lazy(() => import("./views/PlayerApp").then((module) => ({ default: module.PlayerApp })));

installDevLocalVtt();

window.addEventListener("error", (event) => {
  console.error("LOCALVTT_WINDOW_ERROR", event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("LOCALVTT_UNHANDLED_REJECTION", event.reason);
});

const route = getRendererRoute(window.location.hash);

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <Suspense fallback={null}>{route === "player" ? <PlayerApp /> : <GmApp />}</Suspense>
    </AppErrorBoundary>
  </React.StrictMode>
);
