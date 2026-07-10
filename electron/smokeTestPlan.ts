export function getSmokeTestTimeoutMs(isVisualSmokeTest: boolean): number {
  return isVisualSmokeTest ? 45000 : 15000;
}

export interface SmokeTestScriptOptions {
  includePlayerIdle?: boolean;
}

export function createSmokeTestScript(options: SmokeTestScriptOptions = {}): string {
  const includePlayerIdle = options.includePlayerIdle ?? true;
  const playerIpcSetup = includePlayerIdle
    ? `const playerOpenResult = await window.localVtt.openPlayerView({ fullscreen: false });
          const playerIdleDelivered = await window.localVtt.showPlayerIdle("Smoke Test", "Player View IPC is available.", "hold");
          const lastPlayerState = await window.localVtt.getLastPlayerState();`
    : `const playerOpenResult = null;
          const playerIdleDelivered = false;
          const lastPlayerState = null;`;

  return `(async () => {
          ${playerIpcSetup}
          const displays = await window.localVtt.getDisplays();
          return {
            hash: window.location.hash,
            hasPreloadBridge: Boolean(window.localVtt),
            hasCreateCampaign: typeof window.localVtt?.createCampaign === "function",
            hasPlayerBridge: typeof window.localVtt?.openPlayerView === "function",
            playerOpenResult,
            playerIdleDelivered,
            lastPlayerState,
            displayCount: displays.length,
            title: document.title,
            bodyText: document.body.innerText.slice(0, 500)
          };
        })()`;
}
