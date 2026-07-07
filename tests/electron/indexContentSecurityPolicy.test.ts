import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function getIndexContentSecurityPolicy(): string {
  const indexHtml = readFileSync(path.resolve("index.html"), "utf8");
  const match = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(indexHtml);
  return match?.[1] ?? "";
}

describe("index.html Content Security Policy", () => {
  it("defines a renderer CSP without eval while allowing local assets and dev HMR", () => {
    const csp = getIndexContentSecurityPolicy();

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'wasm-unsafe-eval'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("img-src 'self' data: blob: localvtt:");
    expect(csp).toContain("media-src 'self' data: blob: localvtt:");
    expect(csp).toContain("connect-src 'self' http://127.0.0.1:5173 ws://127.0.0.1:5173 localvtt:");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("form-action 'none'");
  });
});
