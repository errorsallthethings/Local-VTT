import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..", "..");
const distIndex = resolve(root, "dist", "index.html");
const electronMain = resolve(root, "dist-electron", "electron", "main.js");
const ensureElectronScript = resolve(root, "scripts", "ensure-electron.mjs");

if (!existsSync(distIndex) || !existsSync(electronMain)) {
  console.error("Electron smoke test requires a production build. Run npm run build first.");
  process.exit(1);
}

const ensureElectron = spawnSync(process.execPath, [ensureElectronScript], {
  cwd: root,
  stdio: "inherit"
});
if (ensureElectron.status !== 0) {
  console.error("Electron smoke test could not prepare the Electron binary.");
  process.exit(1);
}

const { default: electronPath } = await import("electron");

const child = spawn(electronPath, [root], {
  cwd: root,
  env: {
    ...process.env,
    LOCALVTT_SMOKE_TEST: "1",
    ELECTRON_ENABLE_LOGGING: "1"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let output = "";

const timeout = setTimeout(() => {
  child.kill();
  console.error("Electron smoke test timed out.");
  process.exit(1);
}, 30000);

child.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  output += text;
  process.stdout.write(text);
});

child.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  output += text;
  process.stderr.write(text);
});

child.on("error", (error) => {
  clearTimeout(timeout);
  console.error("Electron smoke test failed to launch.", error);
  process.exit(1);
});

child.on("exit", (code) => {
  clearTimeout(timeout);
  const match = output.match(/LOCALVTT_SMOKE_RESULT (.+)/);
  if (code !== 0) {
    console.error(`Electron smoke test exited with code ${code ?? "unknown"}.`);
    process.exit(1);
  }
  if (!match) {
    console.error("Electron smoke test did not emit a result.");
    process.exit(1);
  }

  let result;
  try {
    result = JSON.parse(match[1]);
  } catch (error) {
    console.error("Electron smoke test emitted an invalid JSON result.", error);
    process.exit(1);
  }

  if (result.hash !== "#/gm") {
    console.error(`Expected GM route hash #/gm, received ${result.hash}.`);
    process.exit(1);
  }
  if (!result.hasPreloadBridge || !result.hasCreateCampaign) {
    console.error("Preload bridge was not available in the GM window.");
    process.exit(1);
  }
  if (!result.hasPlayerBridge || !result.playerOpenResult?.ok) {
    console.error("Player View IPC bridge did not open successfully.");
    process.exit(1);
  }
  if (!result.playerIdleDelivered || result.lastPlayerState?.type !== "idle") {
    console.error("Player View idle-state IPC did not round trip through the main process.");
    process.exit(1);
  }
  if (!Number.isInteger(result.displayCount) || result.displayCount < 1) {
    console.error(`Expected at least one display from Electron screen API, received ${result.displayCount}.`);
    process.exit(1);
  }

  console.log("Electron smoke test passed.");
});
