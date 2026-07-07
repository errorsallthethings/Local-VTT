import type { LocalVttApi } from "../shared/localVttApi";

declare global {
  interface Window {
    localVtt: LocalVttApi;
  }
}

export {};
