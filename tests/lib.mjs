// Shared test helpers: a local web server, a browser and simple pass/fail reporting.
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url)).replace(/\\/g, "/").replace(/\/$/, "");
export const SHOTS = fileURLToPath(new URL("output", import.meta.url)).replace(/\\/g, "/");
mkdirSync(SHOTS, { recursive: true });

const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".svg": "image/svg+xml" };
const SKIP = new Set([".git", "node_modules", "tests", ".knowledge", "figma-exports", "output"]);

// Open a page straight from disk, as someone double-clicking it would.
export const fileUrl = (path) => "file:///" + ROOT + "/" + path;

export function walk(dir = ROOT) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (SKIP.has(e.name)) return [];
    const path = join(dir, e.name).replace(/\\/g, "/");
    return e.isDirectory() ? walk(path) : [path];
  });
}

export function startServer() {
  const server = createServer((req, res) => {
    try {
      const path = decodeURIComponent(req.url.split("?")[0]);
      const file = join(ROOT, path.endsWith("/") ? path + "index.html" : path);
      const data = readFileSync(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end();
    }
  }).listen(0);
  return { server, url: `http://localhost:${server.address().port}/` };
}

export async function launchBrowser() {
  for (const channel of ["msedge", "chrome"]) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      // Try the next installed browser.
    }
  }
  throw new Error("The tests need Microsoft Edge or Google Chrome installed.");
}

export function reporter() {
  const results = [];
  return {
    check(name, ok, detail = "") {
      results.push(Boolean(ok));
      console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
    },
    finish() {
      const passed = results.filter(Boolean).length;
      console.log(`\n${passed}/${results.length} passed`);
      if (passed !== results.length) process.exitCode = 1;
    },
  };
}
