// Checks every page in the repo automatically, so new screens are covered without new tests.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { launchBrowser, reporter, ROOT, startServer, walk } from "./lib.mjs";

const { check, finish } = reporter();
const files = walk();
const pages = files.filter((f) => f.endsWith(".html"));
const rel = (f) => f.replace(ROOT + "/", "");

// Links: every local link is a real file, so pages work when opened from disk.
const broken = [];
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  for (const [, url] of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    if (/^(https?:|data:|mailto:)/.test(url) || url.includes("${")) continue;
    const target = join(dirname(page), url.split("?")[0]);
    if (!existsSync(target) || statSync(target).isDirectory()) broken.push(`${url} in ${rel(page)}`);
  }
}
check("links: every local link is a real file", broken.length === 0, broken.slice(0, 6).join(" | "));

// Icons: Lucide only.
const source = files.filter((f) => /\.(html|js|css)$/.test(f) && !f.includes("/vendor/"));
const handDrawn = source.filter((f) => /<svg class="icon"|[←→↗]/.test(readFileSync(f, "utf8")));
check("icons: no hand-drawn icons or text arrows", handDrawn.length === 0, handDrawn.map(rel).join(" | "));

// Scripts: classic only, because ES modules break when a page is opened from disk.
const modules = pages.filter((f) => /<script[^>]*type="module"/.test(readFileSync(f, "utf8")));
check("scripts: no ES modules", modules.length === 0, modules.map(rel).join(" | "));

// Publishing: this repo may be public, so internal knowledge must never be tracked.
let tracked = [];
try {
  tracked = execSync("git ls-files --cached --others --exclude-standard", { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
} catch {
  // Not a Git checkout.
}
check("publishing: private knowledge isn't tracked", !tracked.some((f) => /^(\.knowledge|figma-exports)\//.test(f)));
const internal = tracked.filter((f) => !f.startsWith("tests/") && !f.includes("/vendor/") && /\.(html|js|css|md|json)$/.test(f))
  .filter((f) => /atlassian\.net|figma\.com\/design/i.test(readFileSync(join(ROOT, f), "utf8")));
check("publishing: no links to internal tools", internal.length === 0, internal.join(" | "));

// Colours: new work should use palette tokens. This warns rather than fails.
const allowed = /^(assets\/css\/|prototypes\/billboard\/|design-system\/|prototypes\/_template\/css\/)/;
const newHex = source.filter((f) => !allowed.test(rel(f))).filter((f) => /#[0-9a-f]{6}\b/i.test(readFileSync(f, "utf8")));
if (newHex.length) console.log(`WARN  hex colours outside the palette: ${newHex.map(rel).join(" | ")}`);

// Pages: load each one in a real browser, on desktop and at phone size.
const { server, url } = startServer();
const browser = await launchBrowser();
const sizes = [["desktop", { width: 1440, height: 900 }], ["phone", { width: 390, height: 844 }]];
for (const [label, viewport] of sizes) {
  const context = await browser.newContext({ viewport });
  const problems = [];
  for (const page of pages) {
    const name = rel(page);
    const tab = await context.newPage();
    tab.on("pageerror", (e) => problems.push(`${name}: ${e.message}`));
    tab.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(url)) problems.push(`${name}: ${r.status()} ${r.url().replace(url, "")}`); });
    await tab.goto(url + name, { waitUntil: "load" });
    await tab.waitForTimeout(60);
    if (await tab.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(`${name}: scrolls sideways`);
    if (await tab.locator("i[data-lucide]").count()) problems.push(`${name}: icon didn't render, check the name and that Lucide is loaded`);
    if (!(await tab.locator('meta[name="robots"][content="noindex"]').count())) problems.push(`${name}: missing the noindex tag`);
    if (name.startsWith("prototypes/") && !(await tab.locator(".proto-bar").count())) problems.push(`${name}: missing the prototype bar`);
    await tab.close();
  }
  check(`pages (${label}): ${pages.length} load with no errors or sideways scrolling`, problems.length === 0, problems.slice(0, 8).join(" | "));
  await context.close();
}

// Dropdowns: tests can't see the browser's pop-up list, so check its colours directly.
const context = await browser.newContext();
const tab = await context.newPage();
await tab.goto(url + "design-system/index.html");
const option = await tab.locator("select.input option").first().evaluate((o) => {
  const s = getComputedStyle(o);
  return [s.color, s.backgroundColor];
});
check("dropdowns: options are readable", option[0] !== option[1] && option[1] !== "rgb(255, 255, 255)", option.join(" on "));

// A video that no longer exists shows the not-found state, not a different video.
await tab.goto(url + "app/watch.html?id=gone");
check("video page: unknown video shows not found", (await tab.locator(".empty-state").count()) === 1);

await browser.close();
server.close();
finish();
