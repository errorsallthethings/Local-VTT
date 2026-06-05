import React from "react";
import { createRoot } from "react-dom/client";
import { GmApp } from "./views/GmApp";
import { PlayerApp } from "./views/PlayerApp";
import "./styles.css";

const route = window.location.hash.replace("#/", "") || "gm";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{route === "player" ? <PlayerApp /> : <GmApp />}</React.StrictMode>
);
