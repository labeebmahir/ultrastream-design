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

// Favicon: every page links the real icon. The links check above confirms the file exists.
const noIcon = pages.filter((f) => !readFileSync(f, "utf8").includes('assets/img/favicon.png"'));
check("favicon: every page has one", noIcon.length === 0, noIcon.map(rel).join(" | "));

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
const sizes = [["desktop", { width: 1440, height: 900 }], ["laptop", { width: 1024, height: 768 }], ["tablet", { width: 768, height: 1024 }], ["phone", { width: 390, height: 844 }], ["small phone", { width: 320, height: 640 }]];
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

// Font: the app uses the system font, like the live app.
await (async () => {
  const c = await browser.newContext();
  const p = await c.newPage();
  await p.goto(url + "app/discover.html", { waitUntil: "networkidle" });
  const family = await p.evaluate(() => getComputedStyle(document.body).fontFamily);
  check("type: the app uses the system font", family.includes("-apple-system") && !family.includes("Geist"), family);
  await c.close();
})();

// Rebuilt app screens: the screen viewer links back to the list and lists every screen, and stays off prototypes and frames.
const appPages = pages.filter((f) => rel(f).startsWith("app/") && rel(f).split("/").length === 2 && !rel(f).endsWith("index.html"));
const appFiles = appPages.map((f) => f.split("/").pop());
const VIEWER = ".vw-header, .vw-bar, .vw-rail, .vw-panel";
await (async () => {
  const c = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await c.newPage();
  const data = await (async () => { await p.goto(url + "app/index.html"); return p.evaluate(() => ({ screens: US.appScreens().map((s) => s.file), states: Object.keys(US.APP_STATES) })); })();
  const notListed = appFiles.filter((f) => !data.screens.includes(f));
  const noFile = data.screens.filter((f) => !appFiles.includes(f));
  check("app: US.APP_SCREENS lists every screen in app/, and only those", notListed.length === 0 && noFile.length === 0, [...notListed, ...noFile].join(", "));
  const noStates = data.screens.filter((f) => !data.states.includes(f));
  const strayStates = data.states.filter((f) => !data.screens.includes(f));
  check("app: US.APP_STATES has an entry for every screen, and only those", noStates.length === 0 && strayStates.length === 0, [...noStates, ...strayStates].join(", "));

  const missing = [];
  for (const f of appPages) {
    await p.goto(url + rel(f));
    if (!(await p.locator('.vw-bar a[href="index.html"]').count())) missing.push(rel(f));
  }
  check(`app: all ${appPages.length} screens link back to the list`, missing.length === 0, missing.join(" | "));
  const listed = await p.locator(".vw-select--screen option").evaluateAll((o) => o.map((x) => x.value.replace("./", "").split("?")[0]));
  const unlisted = appFiles.filter((f) => !listed.includes(f));
  check("app: the screen picker lists every screen", unlisted.length === 0 && listed.length === appFiles.length, unlisted.join(", ") || `${listed.length} listed`);

  await p.goto(url + "prototypes/billboard/app/discover.html");
  check("app: prototypes don't get the screen viewer", (await p.locator(VIEWER).count()) === 0 && !(await p.evaluate(() => document.documentElement.classList.contains("has-viewer"))));
  await p.goto(url + "app/index.html");
  await p.locator(".sb-card iframe").first().scrollIntoViewIfNeeded();
  await p.waitForFunction(() => document.querySelector(".sb-card iframe")?.contentDocument?.querySelector(".stage"));
  check("app: previews in frames don't get the screen viewer", (await p.frameLocator(".sb-card iframe >> nth=0").locator(VIEWER).count()) === 0);
  await c.close();
})();

// Screen viewer on desktop: screens on the left, states and previous and next on the right, arrow keys
await (async () => {
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto(url + "app/watch.html?id=v2&state=comments");
  const states = await p.evaluate(() => US.APP_STATES["watch.html"].length);
  check("viewer: the left rail lists every screen and marks this one", (await p.locator(".vw-rail__link").count()) === appFiles.length && (await p.locator('.vw-rail__link[aria-current="page"]').innerText()) === "Video");
  check("viewer: the right panel shows the screen and marks its state", (await p.locator(".vw-panel__name").innerText()) === "Video" && (await p.locator(".vw-state").count()) === states && (await p.locator('.vw-state[aria-current="true"]').innerText()) === "Comments");
  const box = await p.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    return { phone: r(".phone"), rail: r(".vw-rail"), panel: r(".vw-panel"), header: r(".vw-header") };
  });
  check("viewer: the phone sits clear of the header and both side panels", box.phone.left >= box.rail.right && box.phone.right <= box.panel.left && box.phone.top >= box.header.bottom && box.phone.bottom <= 900, JSON.stringify(box.phone));
  check("viewer: the compact bar is hidden on desktop", !(await p.locator(".vw-bar").isVisible()));
  await p.click('.vw-state:text-is("No comments")');
  await p.waitForURL(/state=comments-empty/);
  check("viewer: a state chip opens that state and keeps the video", /id=v2/.test(p.url()) && /state=comments-empty/.test(p.url()));
  await p.evaluate(() => document.activeElement?.blur());
  await p.keyboard.press("ArrowRight");
  await p.waitForURL(/live\.html/);
  check("viewer: the right arrow key goes to the next screen", p.url().includes("app/live.html"));
  await p.keyboard.press("ArrowLeft");
  await p.waitForURL(/watch\.html/);
  check("viewer: the left arrow key goes to the previous screen, opened as the list does", /watch\.html\?id=v2$/.test(p.url()));
  await p.goto(url + "app/watch.html?id=v2&state=comments");
  await p.locator(".phone input, .phone textarea").first().focus();
  await p.keyboard.press("ArrowRight");
  await p.waitForTimeout(300);
  check("viewer: arrow keys don't change screen while typing", p.url().includes("watch.html"));
  await c.close();
})();

// Every listed state opens without errors, and the viewer marks it as the current one
await (async () => {
  const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto(url + "app/index.html");
  const links = await p.evaluate(() => US.appScreens().flatMap((s) => s.states.map(([value, label]) => ({ href: US.appStateHref(s, value), label }))));
  const problems = [];
  let current = "";
  p.on("pageerror", (e) => problems.push(`${current}: ${e.message}`));
  p.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(url)) problems.push(`${current}: ${r.status()} ${r.url().replace(url, "")}`); });
  for (const { href, label } of links) {
    current = href;
    await p.goto(url + "app/" + href, { waitUntil: "load" });
    await p.waitForTimeout(80);
    const marked = await p.locator('.vw-state[aria-current="true"]').innerText().catch(() => "");
    if (links.filter((l) => l.href.split("?")[0] === href.split("?")[0]).length > 1 && marked !== label) problems.push(`${href}: marked "${marked}", not "${label}"`);
    if (await p.locator("i[data-lucide]").count()) problems.push(`${href}: icon didn't render`);
  }
  check(`states: all ${links.length} listed states load without errors and are marked`, problems.length === 0, problems.slice(0, 8).join(" | "));
  await c.close();
})();

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
