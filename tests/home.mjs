// Home page, activity log and component library.
import { existsSync } from "node:fs";
import { fileUrl, launchBrowser, reporter, ROOT, SHOTS, startServer } from "./lib.mjs";

const { server, url } = startServer();
const { check, finish } = reporter();
const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(url)) errors.push(r.status() + " " + r.url().replace(url, "")); });

// Shared site header: one on each of the repo's own pages, with the right section marked
const HEADER_PAGES = [["index.html", ""], ["activity.html", "Activity"], ["design-system/index.html", ""], ["design-system/components.html", "Components"], ["app/index.html", "App"]];
const headerProblems = [];
for (const [path, current] of HEADER_PAGES) {
  await page.goto(url + path);
  const nav = await page.locator(".site-header__nav a").allInnerTexts();
  const marked = await page.locator('.site-header__nav a[aria-current="page"]').allInnerTexts();
  if (nav.join(",") !== "App,Components,Activity") headerProblems.push(`${path}: links ${nav.join(",")}`);
  if (marked.join(",") !== current) headerProblems.push(`${path}: marks "${marked.join(",")}"`);
  if (!(await page.locator(".site-header__ver").count())) headerProblems.push(`${path}: no version`);
  for (const a of await page.locator(".site-header a").evaluateAll((els) => els.map((e) => e.href))) {
    const res = await page.request.get(a);
    if (!res.ok()) headerProblems.push(`${path}: ${a} is ${res.status()}`);
  }
}
check("header: on every main page, with App, Components and Activity and the current one marked", headerProblems.length === 0, headerProblems.join(" | "));

// Home
await page.goto(url + "index.html");
await page.waitForTimeout(300);
const data = await page.evaluate(() => ({
  screens: US.appScreens().length,
  states: US.appScreens().reduce((n, s) => n + s.states.length, 0),
  components: window.COMPONENTS.length,
  log: window.ACTIVITY,
}));
check("home: version is the latest log entry", (await page.locator(".site-header__ver").innerText()) === "v" + data.log[0].version);
check("home: counts match the data", (await page.locator('[data-meta="screens"]').innerText()) === `${data.screens} screens, ${data.states} states` && (await page.locator('[data-meta="components"]').innerText()) === `${data.components} components`);
check("home: latest activity is one quiet line", (await page.locator("#latest a").count()) === 1 && (await page.locator("#latest").innerText()).includes(data.log[0].title));
check("home: lists the prototypes as Billboard", (await page.locator('#prototype-list a[href="prototypes/billboard/index.html"] .row__title').innerText()) === "Billboard");
check("home: links to the app, components, design system and log", (await page.locator(".rows--compact .row").evaluateAll((a) => a.map((x) => x.getAttribute("href")))).join(" ") === "app/index.html design-system/components.html design-system/index.html activity.html");
check("home: no phone preview, stats, tiles or steps", (await page.locator("iframe, .stats, .tile, .make").count()) === 0);
await page.screenshot({ path: `${SHOTS}/home-desktop.png` });

await page.keyboard.press("/");
check("home: / focuses search", await page.evaluate(() => document.activeElement.id === "find"));
await page.keyboard.type("wallet");
check("home: search finds a screen", (await page.locator('.find__result[href="app/wallet.html"]').count()) === 1);
check("home: search finds a screen's states", (await page.locator('.find__result[href="app/wallet.html?state=withdraw"]').count()) === 1);
await page.fill("#find", "AppButton");
check("home: search finds a component by its app name", (await page.locator('.find__result[href="design-system/components.html#c-button"]').count()) === 1);
await page.fill("#find", "zzzz");
check("home: search says when nothing is found", (await page.locator(".find__empty").count()) === 1);
await page.fill("#find", "analytics");
await page.keyboard.press("ArrowDown");
check("home: arrow keys move through the results", (await page.locator('.find__result[aria-selected="true"]').getAttribute("href")) === "app/analytics.html");
await page.keyboard.press("Enter");
await page.waitForURL(/analytics\.html$/);
check("home: Enter opens the result", page.url().endsWith("app/analytics.html"));

// App index: a card per screen with a lazy live preview, search and area filters
await page.goto(url + "app/index.html");
await page.waitForTimeout(600);
const cards = page.locator(".sb-card");
check("app index: a card per screen", (await cards.count()) === data.screens);
const loaded = await page.locator(".sb-card iframe[src]").count();
check("app index: previews load only near the viewport", loaded > 0 && loaded < data.screens, `${loaded} of ${data.screens} loaded`);
await page.waitForFunction(() => document.querySelector(".sb-card iframe")?.contentDocument?.querySelector(".tabbar a"));
check("app index: a preview shows the real screen", (await page.frameLocator(".sb-card iframe >> nth=0").locator(".feed .card").count()) > 0);
check("app index: cards show the number of states", (await page.locator('.sb-card a[href="discover.html"] .sb-card__meta').innerText()) === "5 states");
check("app index: cards open the screen as it starts", (await page.locator('.sb-card a[href="watch.html?id=v2"]').count()) === 1);
await page.screenshot({ path: `${SHOTS}/app-index-desktop.png` });
await page.fill("#q", "offline");
const offline = await page.locator(".sb-card:not([hidden])").count();
check("app index: search finds screens by state", offline > 1 && offline < data.screens, `${offline} shown`);
await page.fill("#q", "");
await page.click('.sb__chip[data-area="Creator studio"]');
check("app index: the area filter shows one area", (await page.locator(".sb__section:not([hidden])").count()) === 1 && (await page.locator(".sb-card:not([hidden])").count()) === 7);
await page.click('.sb__chip[data-area="All"]');
await page.fill("#q", "zzzz");
check("app index: says when nothing matches", await page.locator("#none").isVisible());

// Activity log data
const versions = data.log.map((e) => e.version);
const num = (v) => v.split(".").reduce((n, x) => n * 1000 + Number(x), 0);
check("log: versions are unique and newest first", new Set(versions).size === versions.length && versions.every((v, i) => i === 0 || num(versions[i - 1]) > num(v)), versions.join(" "));
check("log: dates are newest first", data.log.every((e, i) => /^\d{4}-\d{2}-\d{2}$/.test(e.date) && (i === 0 || data.log[i - 1].date >= e.date)));
check("log: every entry says what was asked and made", data.log.every((e) => e.title && e.asked && e.made.length && ["prototype", "app", "components", "tooling", "fix"].includes(e.type)));
const badLinks = data.log.flatMap((e) => e.links).filter(([, href]) => !existsSync(ROOT + "/" + href));
check("log: links point to real pages", badLinks.length === 0, badLinks.map(([, h]) => h).join(" "));

await page.goto(url + "activity.html");
check("log page: shows every entry", (await page.locator(".log-entry").count()) === data.log.length);
await page.click('.log-filter[data-type="fix"]');
check("log page: filters by type", (await page.locator(".log-entry:not([hidden])").count()) === data.log.filter((e) => e.type === "fix").length);
await page.click('.log-filter[data-type="all"]');
await page.fill("#q", "review bar");
check("log page: search finds an entry", (await page.locator(".log-entry:not([hidden])").count()) >= 1 && (await page.locator(".log-entry:not([hidden])").count()) < data.log.length);
await page.goto(url + "activity.html#v0-7-1");
check("log page: version links open the entry", (await page.locator("#v0-7-1.is-target").count()) === 1);

// Component library
await page.goto(url + "design-system/components.html");
await page.waitForTimeout(800);
const comps = await page.evaluate(() => window.COMPONENTS.map((c) => ({ id: c.id, name: c.name, group: c.group, html: c.html, rn: c.rn || "", rnKind: c.rnKind, screens: c.screens || [], css: c.css || [], text: c.text })));
const noRN = comps.filter((c) => !c.rn.trim() || !["usage", "pattern"].includes(c.rnKind)).map((c) => c.id);
check("components: every one has React Native code", noRN.length === 0, noRN.join(", "));
const leaks = comps.filter((c) => /https?:|apiKey|client_?id|process\.env|@env|dispatch\(|useAppSelector/i.test(c.rn)).map((c) => c.id);
check("components: React Native code has no addresses, keys or app logic", leaks.length === 0, leaks.join(", "));
const ids = comps.map((c) => c.id);
check("components: ids are unique", new Set(ids).size === ids.length, ids.filter((x, i) => ids.indexOf(x) !== i).join(", "));
check("components: every one has a name, group, text and markup", comps.every((c) => c.name && c.group && c.text && c.html.trim()));
const missingFiles = comps.flatMap((c) => [...c.css, ...c.screens.map((s) => "app/" + s.split("?")[0])]).filter((f) => !existsSync(ROOT + "/" + f));
check("components: styles and screens they name exist", missingFiles.length === 0, [...new Set(missingFiles)].join(" "));
check("components: every one has a section, preview and code", (await page.locator(".comp").count()) === comps.length && (await page.locator(".comp iframe").count()) === comps.length && (await page.locator(".comp [data-code=html] pre").count()) === comps.length);
check("components: sidebar lists every one", (await page.locator(".cl-side__link").count()) === comps.length);

// Load every preview and check it draws something without errors
const frameErrors = [];
const empty = [];
for (const c of comps) {
  const sec = page.locator("#c-" + c.id);
  await sec.scrollIntoViewIfNeeded();
  const frame = page.frameLocator(`#c-${c.id} iframe`);
  await frame.locator(".cd-phone").waitFor({ timeout: 5000 }).catch(() => {});
  const h = await sec.locator("iframe").evaluate((f) => f.getBoundingClientRect().height);
  const unrendered = await frame.locator("i[data-lucide]").count().catch(() => 0);
  if (h < 48) empty.push(`${c.id} (${Math.round(h)}px)`);
  if (unrendered) frameErrors.push(`${c.id}: icon didn't render`);
}
check("components: every preview draws and sizes itself", empty.length === 0, empty.join(", "));
check("components: every preview's icons render", frameErrors.length === 0, frameErrors.join(" | "));

check("components: React Native is the first tab", (await page.locator('#c-button .comp__tab[aria-selected="true"]').getAttribute("data-tab")) === "rn");
await page.locator("#c-button .copy").click();
let copied = await page.evaluate(() => navigator.clipboard.readText());
check("components: Copy copies the React Native code", copied.startsWith("import") && copied.includes("AppButton") && !copied.includes("&lt;"), copied.slice(0, 60));
await page.click('[data-lang="html"]');
check("components: the HTML switch changes every component", (await page.locator('.comp__tab[data-tab="html"][aria-selected="true"]').count()) === comps.length);
await page.locator("#c-button .copy").click();
copied = await page.evaluate(() => navigator.clipboard.readText());
check("components: Copy copies the HTML on the HTML tab", copied.startsWith('<button class="btn btn--primary') && !copied.includes("&lt;"), copied.slice(0, 60));
await page.reload();
await page.waitForTimeout(600);
check("components: the choice is remembered", (await page.locator('#c-button .comp__tab[aria-selected="true"]').getAttribute("data-tab")) === "html");
await page.click('[data-lang="rn"]');
await page.fill("#search", "AppConfirmModal");
check("components: search by app name", (await page.locator(".comp:not([hidden])").count()) === 1 && (await page.locator("#c-dialog:not([hidden])").count()) === 1);
await page.fill("#search", "");
await page.click('.cl-group[data-g="Overlays"]');
check("components: group filter", (await page.locator(".comp:not([hidden])").count()) === comps.filter((c) => c.group === "Overlays").length);
await page.click('.cl-group[data-g="All"]');
await page.screenshot({ path: `${SHOTS}/components-desktop.png` });

check("no errors on the home, log and component pages", errors.length === 0, errors.slice(0, 6).join(" | "));

// Phone size and opened from disk
const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
const pp = await phone.newPage();
for (const path of ["index.html", "activity.html", "design-system/components.html", "design-system/index.html", "app/index.html", "app/watch.html?id=v2&state=comments"]) {
  await pp.goto(url + path);
  await pp.waitForTimeout(500);
  check(`phone: ${path} has no sideways scroll`, !(await pp.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)));
  await pp.screenshot({ path: `${SHOTS}/home-phone-${path.replace(/[/.?&=]/g, "-")}.png`, fullPage: path === "index.html" || path === "activity.html" });
}
const viewerBar = await pp.evaluate(() => ({ bar: !!document.querySelector(".vw-bar") && getComputedStyle(document.querySelector(".vw-bar")).display !== "none", rail: getComputedStyle(document.querySelector(".vw-rail")).display }));
check("phone: the viewer is a compact bar with a screen and state picker", viewerBar.bar && viewerBar.rail === "none" && (await pp.locator(".vw-select--state option").count()) > 1);
const small = await (await browser.newContext({ viewport: { width: 320, height: 640 } })).newPage();
const narrow = [];
for (const path of ["index.html", "app/index.html", "design-system/components.html"]) {
  await small.goto(url + path);
  if (await small.evaluate(() => { const h = document.querySelector(".site-header__inner"); return h.scrollWidth > h.clientWidth || document.documentElement.scrollWidth > innerWidth + 1; })) narrow.push(path);
}
check("320px: the header fits without sideways scroll", narrow.length === 0, narrow.join(" | "));
const fp = await (await browser.newContext()).newPage();
const fileErrors = [];
fp.on("pageerror", (e) => fileErrors.push(e.message));
await fp.goto(fileUrl("design-system/components.html"));
await fp.waitForTimeout(1200);
const fileH = await fp.locator("#c-button iframe").evaluate((f) => f.getBoundingClientRect().height);
check("file://: component previews work from disk", fileH > 100 && (await fp.frameLocator("#c-button iframe").locator("button.btn").count()) > 0, `${Math.round(fileH)}px`);
await fp.goto(fileUrl("index.html"));
await fp.waitForTimeout(800);
check("file://: home works from disk", fileErrors.length === 0 && (await fp.locator('[data-meta="screens"]').innerText()).startsWith(`${data.screens} screens`) && (await fp.locator(".site-header__ver").count()) === 1, fileErrors.join(" | "));
await fp.goto(fileUrl("app/watch.html") + "?id=v2&state=comments");
await fp.waitForTimeout(1000);
check("file://: the screen viewer works from disk", fileErrors.length === 0 && (await fp.locator('.vw-state[aria-current="true"]').innerText()) === "Comments" && (await fp.locator(".vw-header .site-header__nav a").count()) === 3, fileErrors.join(" | "));
await fp.goto(fileUrl("app/index.html"));
await fp.waitForTimeout(1200);
check("file://: the app index previews work from disk", fileErrors.length === 0 && (await fp.frameLocator(".sb-card iframe >> nth=0").locator(".tabbar a").count()) === 5, fileErrors.join(" | "));

await browser.close();
server.close();
finish();
