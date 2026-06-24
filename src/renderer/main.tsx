import React from "react";
import { createRoot } from "react-dom/client";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { installDevLocalVtt } from "./devLocalVtt";
import { GmApp } from "./views/GmApp";
import { PlayerApp } from "./views/PlayerApp";
import "./styles.css";

installDevLocalVtt();

window.addEventListener("error", (event) => {
  console.error("LOCALVTT_WINDOW_ERROR", event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("LOCALVTT_UNHANDLED_REJECTION", event.reason);
});

const route = window.location.hash.replace("#/", "") || "gm";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>{route === "player" ? <PlayerApp /> : <GmApp />}</AppErrorBoundary>
  </React.StrictMode>
);
