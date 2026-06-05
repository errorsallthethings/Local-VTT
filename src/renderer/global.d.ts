import type { LocalVttApi } from "../../electron/preload";

declare global {
  interface Window {
    localVtt: LocalVttApi;
  }
}

export {};
