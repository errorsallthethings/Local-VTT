import React from "react";
import { createRoot } from "react-dom/client";
import { installDevLocalVtt } from "./devLocalVtt";
import { GmApp } from "./views/GmApp";
import { PlayerApp } from "./views/PlayerApp";
import "./styles.css";

installDevLocalVtt();

const route = window.location.hash.replace("#/", "") || "gm";

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{route === "player" ? <PlayerApp /> : <GmApp />}</React.StrictMode>
);
