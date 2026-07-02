import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..", "..");
const distIndex = resolve(root, "dist", "index.html");
const electronMain = resolve(root, "dist-electron", "electron", "main.js");
const ensureElectronScript = resolve(root, "scripts", "ensure-electron.mjs");

if (!existsSync(distIndex) || !existsSync(electronMain)) {
  console.error("Electron visual smoke test requires a production build. Run npm run build first.");
  process.exit(1);
}

const ensureElectron = spawnSync(process.execPath, [ensureElectronScript], {
  cwd: root,
  stdio: "inherit"
});
if (ensureElectron.status !== 0) {
  console.error("Electron visual smoke test could not prepare the Electron binary.");
  process.exit(1);
}

const { default: electronPath } = await import("electron");

const child = spawn(electronPath, ["--disable-gpu", root], {
  cwd: root,
  env: {
    ...process.env,
    LOCALVTT_SMOKE_TEST: "1",
    LOCALVTT_VISUAL_SMOKE_TEST: "1",
    ELECTRON_ENABLE_LOGGING: "1"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let output = "";

const timeout = setTimeout(() => {
  child.kill();
  console.error("Electron visual smoke test timed out.");
  process.exit(1);
}, 60000);

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
  console.error("Electron visual smoke test failed to launch.", error);
  process.exit(1);
});

child.on("exit", (code) => {
  clearTimeout(timeout);
  const match = output.match(/LOCALVTT_SMOKE_RESULT (.+)/);
  if (code !== 0) {
    console.error(`Electron visual smoke test exited with code ${code ?? "unknown"}.`);
    process.exit(1);
  }
  if (!match) {
    console.error("Electron visual smoke test did not emit a result.");
    process.exit(1);
  }

  let result;
  try {
    result = JSON.parse(match[1]);
  } catch (error) {
    console.error("Electron visual smoke test emitted an invalid JSON result.", error);
    process.exit(1);
  }

  if (result.hash !== "#/gm") {
    console.error(`Expected GM route hash #/gm, received ${result.hash}.`);
    process.exit(1);
  }
  if (!result.hasPreloadBridge || !result.hasPlayerBridge) {
    console.error("Preload bridge was not available during visual smoke testing.");
    process.exit(1);
  }
  if (!result.visualSmoke?.playerDelivered || !result.visualSmoke?.testPatternDelivered) {
    console.error("Visual smoke test did not deliver the scene and test pattern to Player View.");
    process.exit(1);
  }
  if (!result.visualSmoke.sceneMetrics?.ok || !result.visualSmoke.testPatternMetrics?.ok) {
    console.error("Visual smoke metrics did not pass.", result.visualSmoke.sceneMetrics, result.visualSmoke.testPatternMetrics);
    process.exit(1);
  }
  if (!result.visualSmoke.overlayMetrics?.ok) {
    console.error("Visual smoke overlay metrics did not pass.", result.visualSmoke.overlayMetrics);
    process.exit(1);
  }
  for (const screenshotPath of Object.values(result.visualSmoke.screenshots ?? {})) {
    if (typeof screenshotPath !== "string" || !existsSync(screenshotPath)) {
      console.error(`Visual smoke screenshot was not written: ${screenshotPath}`);
      process.exit(1);
    }
  }

  console.log("Electron visual smoke test passed.");
});
