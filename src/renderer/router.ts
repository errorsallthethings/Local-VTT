export type RendererRoute = "gm" | "player";

export function getRendererRoute(hash: string): RendererRoute {
  return hash.replace("#/", "") === "player" ? "player" : "gm";
}
