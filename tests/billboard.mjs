// Billboard from start to finish: enquiry, create campaign, feed, lifecycle, report, phone and opening from disk.
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { launchBrowser, reporter, ROOT, SHOTS, startServer, walk } from "./lib.mjs";

const { server, url: SITE } = startServer();
const B = SITE + "prototypes/billboard/";
const { check, finish } = reporter();

const browser = await launchBrowser();
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await desk.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.location().url)) errors.push(m.text()); });
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const count = (sel) => page.locator(sel).count();

// All prototypes page and the ad-free app
const hub = await desk.newPage();
hub.on("pageerror", (e) => errors.push("hub: " + e.message));
hub.on("response", (r) => { if (r.status() >= 400) errors.push(r.status() + " " + r.url()); });
await hub.goto(SITE);
check("hub: lists Billboard", (await hub.locator('a[href="prototypes/billboard/index.html"]').count()) === 1);
await hub.screenshot({ path: `${SHOTS}/0-hub.png` });
await hub.click('a[href="prototypes/billboard/index.html"]');
check("hub: opens Billboard at its own link", hub.url() === B + "index.html" && (await hub.locator(".step").count()) >= 5, hub.url());
await hub.click(".back-link");
check("billboard: links back to all prototypes", (await hub.locator('a[href="prototypes/billboard/index.html"]').count()) === 1);
await hub.click('a[href="app/index.html"]');
check("app: index lists screens", (await hub.locator(".item").count()) === 2);
await hub.click('a[href="discover.html"]');
await hub.waitForTimeout(150);
check("app: discover has no ads", (await hub.locator(".ad, .sponsored").count()) === 0);
check("app: discover has no prototype bar", (await hub.locator(".proto-bar").count()) === 0);
check("app: feed renders", (await hub.locator(".feed .card").count()) > 3);
await hub.click(".tabbar button:nth-child(2)");
check("app: unbuilt tabs say so", await hub.locator(".toast").isVisible());
await hub.screenshot({ path: `${SHOTS}/0-app-discover.png` });
await hub.click('.feed a.card >> nth=1');
await hub.waitForURL(/watch\.html/);
check("app: video page has no billboard note", (await hub.locator(".note").count()) === 0);
check("app: video page renders", (await hub.locator("#title").innerText()).length > 3);
await hub.close();

// Questions page
const qp = await desk.newPage();
qp.on("pageerror", (e) => errors.push("questions: " + e.message));
const answerRequests = [];
qp.on("request", (r) => { if (r.url().startsWith("http") && !r.url().startsWith(SITE) && !/fonts\.(googleapis|gstatic)\.com/.test(r.url())) answerRequests.push(r.url()); if (r.method() !== "GET") answerRequests.push(r.method() + " " + r.url()); });
await qp.goto(B + "questions.html");
check("questions: starts on the first of 13", (await qp.locator(".ask-card__count").innerText()).startsWith("Question 1 of 13") && (await qp.locator(".ask-dot").count()) === 13);
check("questions: shows answers to tap, plus something else", (await qp.locator(".ask-option").count()) === 4 && (await qp.locator(".ask-option").last().innerText()).includes("Something else"));
check("questions: marks what the prototype does now", (await qp.locator(".ask-option__now").count()) === 1);
await qp.screenshot({ path: `${SHOTS}/billboard-questions.png` });
await qp.evaluate(() => { window.__card = document.querySelector(".ask-card"); });
await qp.locator(".ask-option").nth(1).click();
check("questions: tapping marks the answer without redrawing the screen", await qp.evaluate(() => window.__card === document.querySelector(".ask-card") && window.__card.getAnimations().length === 0 && getComputedStyle(window.__card).opacity === "1"));
await qp.waitForFunction(() => document.querySelector(".ask-card__count").textContent.startsWith("Question 2"));
const entry = await qp.evaluate(() => document.querySelector(".ask-card").getAnimations().flatMap((a) => a.effect.getKeyframes().flatMap((k) => Object.keys(k))));
check("questions: the next question only fades, with no sliding", !entry.includes("transform"), [...new Set(entry)].join(","));
check("questions: tapping an answer moves on", true);
check("questions: progress updates", (await qp.locator("#ask-count").innerText()) === "1/13");
check("questions: header count stays in step", (await qp.locator(".proto-bar__count").innerText()) === "1/13", await qp.locator(".proto-bar__count").innerText());
await qp.keyboard.press("2");
await qp.waitForFunction(() => document.querySelector(".ask-card__count").textContent.startsWith("Question 3"));
check("questions: number keys answer", (await qp.locator("#ask-count").innerText()) === "2/13");
await qp.locator(".ask-option").last().click();
check("questions: something else opens a box and waits", await qp.evaluate(() => document.activeElement.id === "ask-note"));
await qp.locator("#ask-note").fill("Send them to a shared inbox.");
await qp.keyboard.press("Tab");
await qp.locator('.ask-nav [data-go="3"]').click();
await qp.locator("[data-note]").click();
await qp.locator("#ask-note").fill("Check with sales.");
await qp.locator(".ask-option").first().click();
await qp.waitForTimeout(500);
check("questions: adding a note keeps you on the question", (await qp.locator(".ask-card__count").innerText()).startsWith("Question 4"));
await qp.locator('.ask-nav .btn-next, .ask-nav [data-go="4"]').click();
await qp.reload();
check("questions: answers survive a reload, opening at the next one", (await qp.locator(".ask-card__count").innerText()).startsWith("Question 5") && (await qp.locator("#ask-count").innerText()) === "4/13");
await qp.locator(".ask-dot").nth(1).click();
check("questions: progress bar jumps to a question and shows the answer", (await qp.locator(".ask-option.is-selected").count()) === 1);
await qp.locator(".ask-progress__review").click();
check("questions: review lists every question", (await qp.locator(".ask-row").count()) === 13);
check("questions: review flags the unanswered", (await qp.locator(".ask-row__answer.is-empty").count()) === 9);
await qp.fill("#answer-name", "Sam Reviewer");
const [answerFile] = await Promise.all([qp.waitForEvent("download"), qp.click("#answer-export")]);
const answerText = await readFile(await answerFile.path(), "utf8");
check("questions: exported file is named for the person", /^billboard-answers-sam-reviewer-\d{4}-\d\d-\d\d\.md$/.test(answerFile.suggestedFilename()), answerFile.suggestedFilename());
check("questions: export has name, answers, notes and gaps", ["Answered by: Sam Reviewer", "**Answer:** Admin can take it down from the panel", "**Answer:** Send them to a shared inbox.", "**Note:** Check with sales.", "**Answer:** No answer", "## Q13."].every((s) => answerText.includes(s)));
check("questions: answering and exporting sends nothing", answerRequests.length === 0, answerRequests.join(" | "));
await qp.locator(".ask-row").nth(4).click();
await qp.screenshot({ path: `${SHOTS}/billboard-questions-answer.png` });
await qp.goBack().catch(() => {});
await qp.close();

// Prototype bar
const barPage = await desk.newPage();
await barPage.goto(B + "admin/campaigns.html");
check("bar: shows the steps with the current one marked", (await barPage.locator('.proto-bar__nav a[aria-current="page"]').innerText()).includes("Campaigns"));
check("bar: demo time is out of the way until opened", !(await barPage.locator("#demo-now").isVisible()));
await barPage.click(".proto-bar__toggle");
check("bar: demo time opens", await barPage.locator("#demo-now").isVisible());
await barPage.click('[data-shift="7"]');
check("bar: moving time updates the page", (await barPage.locator(".proto-bar__when").innerText()).startsWith("10 Nov"), await barPage.locator(".proto-bar__when").innerText());
await barPage.click("[data-reset]");
await barPage.keyboard.press("Escape");
check("bar: escape closes demo time", !(await barPage.locator("#demo-now").isVisible()));
check("bar: stays one row on desktop", (await barPage.locator(".proto-bar").evaluate((e) => e.offsetHeight)) <= 60);
await barPage.setViewportSize({ width: 800, height: 700 });
check("bar: compact on tablets", await barPage.locator(".proto-bar__select").isVisible() && !(await barPage.locator(".proto-bar__nav").isVisible()));
await barPage.goto(B + "app/watch.html?id=v2");
await barPage.setViewportSize({ width: 1440, height: 900 });
check("bar: video screen counts as the Discover step", (await barPage.locator('.proto-bar__nav a[aria-current="page"]').innerText()).includes("Discover"));
await barPage.close();

// Overview
await page.goto(B + "index.html");
await page.screenshot({ path: `${SHOTS}/1-overview.png` });

// Enquiry
await page.goto(B + "web/advertise.html");
const opt = await page.locator("#type option").first().evaluate((o) => { const s = getComputedStyle(o); return [s.color, s.backgroundColor]; });
check("enquiry: dropdown options are readable", opt[0] === "rgb(255, 255, 255)" && opt[1] === "rgb(26, 26, 26)", opt.join(" on "));
await page.click('button[type=submit]');
check("enquiry: empty submit shows errors", (await count(".field--invalid")) === 6);
check("enquiry: message is optional", (await page.locator("#message").evaluate((e) => !e.closest(".field--invalid"))));
await page.screenshot({ path: `${SHOTS}/2-enquiry-errors.png`, fullPage: true });
await page.fill("#company", "Test Co");
check("enquiry: error clears once fixed", !(await page.locator("#f-company").evaluate((e) => e.classList.contains("field--invalid"))));
check("enquiry: eyebrow is orange", (await page.locator(".eyebrow").evaluate((e) => getComputedStyle(e).color)) === "rgb(255, 92, 0)");
await page.fill("#contact", "A Person"); await page.fill("#email", "a@example.com");
await page.fill("#phone", "+61 400 000 000"); await page.selectOption("#type", { index: 1 }); await page.fill("#from", "2026-12-01");
let netPosts = 0; page.on("request", (r) => { if (r.method() !== "GET") netPosts++; });
await page.click('button[type=submit]');
check("enquiry: success state", await page.locator(".success").isVisible());
check("enquiry: sends nothing", netPosts === 0);

// Feed: prime time at default demo time
await page.goto(B + "app/discover.html");
await page.evaluate(() => { US.reset(); });
await page.reload();
const adNames = () => page.locator(".feed .ad .ad__name").allTextContents();
let names = await adNames();
check("feed: prime time billboard first", names[0] === "Kestrel Audio", names.slice(0, 3).join(", "));
check("feed: prime banner second", names[1] === "Tallow & Thread");
check("feed: first element is billboard", await page.locator(".feed > *").first().evaluate((e) => e.classList.contains("ad--billboard")));
await page.screenshot({ path: `${SHOTS}/3-discover-prime.png` });

await page.click("#jump-normal");
names = await adNames();
check("feed: normal time billboard at 11:00", names[0] === "Volt & Ember", names[0]);
await page.click("#jump-prime");

// Standard banner cadence, measured across a long scroll
await page.evaluate(async () => { const f = document.getElementById("feed"); for (let i = 0; i < 25; i++) { f.scrollTop = f.scrollHeight; await new Promise((r) => setTimeout(r, 60)); } });
const cadence = await page.evaluate(() => {
  const kids = [...document.getElementById("feed").children];
  const gaps = []; let n = 0;
  for (const k of kids) { if (k.classList.contains("card")) n++; else if (k.classList.contains("short-row")) n += 2; else if (k.classList.contains("ad--standard")) { gaps.push(n); n = 0; } }
  return gaps;
});
check("feed: standard banner about every 15 and repeating", cadence.length >= 3 && cadence.every((g) => g >= 14 && g <= 16), cadence.join(","));
check("design: five tabs in order", (await page.locator(".tabbar button").allInnerTexts()).join() === "Discover,My Feed,Create,Shorts,Profile");
check("design: shorts sit two across", (await count(".short-row")) > 0 && (await page.locator(".short-row").first().locator(".card").count()) === 2);
check("design: primary button uses the gradient", /linear-gradient/.test(await page.evaluate(() => { const b = document.createElement("button"); b.className = "btn btn--primary"; document.body.append(b); const v = getComputedStyle(b).backgroundImage; b.remove(); return v; })));
const lucideIn = (sel) => page.locator(sel + " svg.lucide").evaluateAll((els) => els.map((e) => e.getAttribute("data-lucide")).join());
check("icons: tabs use Lucide", (await lucideIn(".tabbar")) === "compass,user-round-search,circle-plus,video,circle-user-round", await lucideIn(".tabbar"));
check("icons: header uses Lucide", (await lucideIn(".topbar")) === "bell-dot,search", await lucideIn(".topbar"));
check("icons: ads rendered later get Lucide icons", (await page.locator(".ad__cta svg.lucide-arrow-up-right").count()) === (await page.locator(".feed .ad").count()));
check("icons: live badge uses Lucide", (await page.locator(".thumb-pill svg.lucide-radio").count()) > 0 && (await page.locator(".thumb-pill svg.lucide-eye").count()) > 0);
check("icons: none left unrendered", (await page.locator("i[data-lucide]").count()) === 0);
const tok = await page.evaluate(() => { const b = document.createElement("button"); b.className = "btn btn--primary"; document.body.append(b); const bg = getComputedStyle(b).backgroundImage; b.remove(); const c = getComputedStyle(document.documentElement); return { bg, gold: c.getPropertyValue("--brand-gold-6").trim(), active: getComputedStyle(document.querySelector('.tabbar button[aria-current]')).color }; });
check("colours: button gradient is red-6 to orange-dark-6", tok.bg.includes("rgb(216, 10, 0)") && tok.bg.includes("rgb(225, 89, 0)"), tok.bg);
check("colours: active tab is orange-6", tok.active === "rgb(255, 127, 0)", tok.active);
check("colours: palette tokens load", tok.gold === "#f4b545", tok.gold);
check("design: logo icon loads", await page.locator(".topbar__logo").evaluate((i) => i.complete && i.naturalWidth > 0));
const unlabelled = await page.evaluate(() => [...document.querySelectorAll(".feed .ad")].filter((a) => !/Sponsored/.test(a.textContent)).length);
check("rule: every ad labelled Sponsored", unlabelled === 0);
await page.click("#jump-banner").catch(() => {});
await page.evaluate(() => { const f = document.getElementById("feed"); const b = f.querySelector(".ad--standard"); f.scrollTop = b.offsetTop - 300; });
await page.waitForTimeout(150);
await page.screenshot({ path: `${SHOTS}/4-discover-standard.png` });

// Category filter keeps ads
await page.click('.chip[data-cat="Food"]');
check("feed: ads stay on a filtered view", (await count(".feed .ad--billboard")) === 1);
await page.click('.chip[data-cat="Food"]');
check("feed: tapping a category again clears it", (await page.locator('.chip[aria-pressed="true"]').count()) === 0);

// No ads on video or live
await page.goto(B + "app/watch.html?id=v0");
check("rule: no ads on video", (await count(".ad")) === 0);
check("icons: video actions use Lucide", (await page.locator(".actions-row svg.lucide").evaluateAll((els) => els.map((e) => e.getAttribute("data-lucide")).join())) === "thumbs-up,thumbs-down,message-circle,hand-coins,share,flag");
check("icons: back arrow uses Lucide", (await count(".topbar svg.lucide-arrow-left")) === 1);
await page.goto(B + "app/watch.html?live=1");
check("rule: no ads on live", (await count(".ad")) === 0);

// Campaign list
await page.goto(B + "admin/campaigns.html");
const groupText = await page.locator(".group__title").allTextContents();
check("list: three groups in order", /Scheduled/.test(groupText[0]) && /Live/.test(groupText[1]) && /Ended/.test(groupText[2]), groupText.join(" | "));
const body = await page.locator(".main").innerText();
check("rule: no stop or cancel action on the list", !(await page.getByRole("button", { name: /stop|cancel|pause/i }).count()) && !(await page.getByRole("link", { name: /stop|cancel|pause/i }).count()));
await page.screenshot({ path: `${SHOTS}/5-campaigns.png`, fullPage: true });

// Create campaign
await page.goto(B + "admin/campaign-new.html");
await page.click('button[type=submit]');
check("create: validation stops empty form", (await count(".field--invalid")) === 5, String(await count(".field--invalid")));
await page.fill("#advertiser", "Prototype <Test> Brand");
await page.click('input[name=type][value="prime-banner"]', { force: true });
await page.click('input[name=days][value="7"]', { force: true });
await page.click("#sample");
await page.fill("#url", "example.com/test");
await page.locator("#url").blur();
check("create: adds https:// to a pasted link", (await page.inputValue("#url")) === "https://example.com/test");
await page.fill("#start", "2026-11-04");
await page.check("#confirm");
await page.waitForTimeout(100);
check("create: errors clear once fixed", (await count(".field--invalid")) === 0, String(await count(".field--invalid")));
check("create: overlap note shown", await page.locator("#overlap").isVisible());
await page.screenshot({ path: `${SHOTS}/6-create.png`, fullPage: true });
await page.click('button[type=submit]');
await page.waitForURL(/campaigns\.html\?new=/);
const sched = await page.locator(".group").nth(0).innerText();
check("lifecycle: new campaign is scheduled", sched.includes("Prototype <Test> Brand"));
check("security: name is escaped", (await count("test")) === 0);
const newId = new URL(page.url()).searchParams.get("new");

// Move the clock
await page.evaluate((days) => US.shiftNow(days), 1);
await page.waitForTimeout(50);
check("lifecycle: goes live on start date", (await page.locator(".group").nth(1).innerText()).includes("Prototype <Test> Brand"));
await page.goto(B + `admin/report.html?id=${newId}`);
check("report: unavailable before the end", (await page.locator("#download").count()) === 0);
await page.goto(B + "app/discover.html");
await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("us-billboard-demo-v1")); });
let seenInFeed = false;
for (let i = 0; i < 3 && !seenInFeed; i++) { await page.reload(); seenInFeed = (await adNames()).includes("Prototype <Test> Brand"); }
check("lifecycle: shows in Discover while live (rotating)", seenInFeed);
await page.evaluate((days) => US.shiftNow(days), 7);
await page.goto(B + "admin/campaigns.html");
check("lifecycle: ended after the package", (await page.locator(".group").nth(2).innerText()).includes("Prototype <Test> Brand"));

// Report and PDF
await page.goto(B + `admin/report.html?id=${newId}`);
await page.screenshot({ path: `${SHOTS}/7-report.png`, fullPage: true });
const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#download")]);
const pdfPath = `${SHOTS}/report.pdf`;
await dl.saveAs(pdfPath);
const pdf = await readFile(pdfPath);
check("report: PDF downloads", pdf.subarray(0, 4).toString() === "%PDF", `${dl.suggestedFilename()} ${pdf.length} bytes`);
const text = await page.locator(".sheet").innerText();
check("report: has all fields", ["Campaign period", "Package", "Package cost", "Impressions", "Clicks", "Click-through rate"].every((f) => text.includes(f)));
await page.goto("about:blank");

// Phone
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const p2 = await phone.newPage();
p2.on("pageerror", (e) => errors.push("phone: " + e.message));
await p2.goto(B + "app/discover.html");
await p2.waitForTimeout(200);
check("phone: discover has no sideways scroll", !(await overflow(p2)));
const barH = await p2.locator(".proto-bar").evaluate((e) => e.offsetHeight);
const tabVisible = await p2.locator(".tabbar").evaluate((e) => e.getBoundingClientRect().bottom <= innerHeight + 1);
check("phone: tab bar is on screen", tabVisible, `bar height ${barH}`);
await p2.screenshot({ path: `${SHOTS}/8-phone-discover.png` });
await p2.goto(B + "web/advertise.html");
check("phone: enquiry has no sideways scroll", !(await overflow(p2)));
await p2.goto(B + "admin/campaigns.html");
check("phone: campaigns has no sideways scroll", !(await overflow(p2)));
await p2.goto(B + "index.html");
check("phone: overview has no sideways scroll", !(await overflow(p2)));
await p2.screenshot({ path: `${SHOTS}/9-phone-overview.png` });
const barHeight = await p2.locator(".proto-bar").evaluate((e) => e.offsetHeight);
check("phone: prototype bar stays short", barHeight <= 52, barHeight + "px");
await p2.selectOption(".proto-bar__select", { label: "4. Campaigns" });
await p2.waitForURL(/campaigns\.html/);
check("phone: every screen is reachable from the bar", (await p2.locator(".group").count()) === 3);
check("phone: campaign metrics are visible without scrolling sideways", await p2.locator(".table-wrap").first().evaluate((e) => e.scrollWidth <= e.clientWidth));
check("phone: live campaigns show their numbers", await p2.locator('.group >> nth=1 >> td[data-label="Impressions"]').first().isVisible());
check("phone: scheduled campaigns don't show empty numbers", (await p2.locator(".group >> nth=0 >> td.cell-empty:visible").count()) === 0);
await p2.click(".proto-bar__toggle");
check("phone: demo time opens", await p2.locator("#demo-now").isVisible());
check("phone: reset is reachable", await p2.locator(".proto-bar [data-reset]").isVisible());
await p2.click(".proto-bar__toggle");
await p2.waitForTimeout(100);
const closedHeight = await p2.locator(".proto-bar").evaluate((e) => e.offsetHeight);
check("phone: bar shrinks again after closing demo time", closedHeight <= 52, closedHeight + "px");
await p2.goto(B + "web/advertise.html");
check("phone: fields won't trigger iPhone zoom", (await p2.locator("#company").evaluate((e) => getComputedStyle(e).fontSize)) === "16px");
await p2.click('a[data-ad-type="Prime Banner"]');
check("phone: tapping an ad type picks it in the form", (await p2.locator("#type").inputValue()) === "Prime Banner");
await p2.goto(B + "questions.html");
check("phone: questions fit without sideways scroll", !(await overflow(p2)));
await p2.screenshot({ path: `${SHOTS}/billboard-phone-questions.png` });
await p2.goto(B + "app/watch.html?id=v1");
await p2.screenshot({ path: `${SHOTS}/10-phone-watch.png` });
await p2.setViewportSize({ width: 320, height: 640 });
check("phone: all video actions show at 320px", await p2.locator(".actions-row .pill-btn").last().evaluate((e) => e.getBoundingClientRect().right <= innerWidth));
await p2.setViewportSize({ width: 390, height: 844 });
check("phone: watch has no sideways scroll", !(await overflow(p2)));
check("phone: all six video actions fit at 390px", await p2.locator(".actions-row").evaluate((e) => e.scrollWidth <= e.clientWidth), await p2.locator(".actions-row").evaluate((e) => e.scrollWidth + " of " + e.clientWidth));
await desk.close(); await phone.close();

// Opened straight from disk, no server
const fileCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const p3 = await fileCtx.newPage();
const fileErrors = [];
p3.on("pageerror", (e) => fileErrors.push(e.message));
await p3.goto("file:///" + ROOT + "/index.html");
await p3.click('a[href="app/index.html"]');
await p3.click('a[href="discover.html"]');
await p3.waitForTimeout(150);
check("file://: rebuilt app opens from the list page", (await p3.locator(".feed .card").count()) > 3);
check("file://: Lucide icons render from disk", (await p3.locator(".tabbar svg.lucide").count()) === 5);
await p3.goto("file:///" + ROOT + "/index.html");
await p3.click('a[href="prototypes/billboard/index.html"]');
check("file://: Billboard opens from the list page", (await p3.locator(".step").count()) >= 5);
await p3.click('a[href="admin/campaign-new.html"]');
await p3.fill("#advertiser", "Disk Test Brand");
await p3.click("#sample");
await p3.fill("#url", "https://example.com/disk");
await p3.fill("#start", "2026-11-04");
await p3.check("#confirm");
await p3.click('button[type=submit]');
await p3.waitForURL(/campaigns\.html\?new=/);
check("file://: created campaign saves across pages", (await p3.locator(".group").first().innerText()).includes("Disk Test Brand"));
await p3.click('.proto-bar__nav a:has-text("Discover")');
await p3.waitForTimeout(150);
check("file://: Billboard feed renders", (await p3.locator(".feed .ad").count()) >= 2);
check("file://: no JS errors", fileErrors.length === 0, fileErrors.join(" | "));
await p3.goto("file:///" + ROOT + "/prototypes/billboard/index.html");
await p3.click('.proto-bar__nav a:has-text("Campaigns")');
await p3.waitForLoadState("load");
check("file://: nav works and campaigns render", (await p3.locator(".group").count()) === 3);
await p3.goto("file:///" + ROOT + "/prototypes/billboard/admin/report.html?id=c7");
check("file://: report loads the PDF library", await p3.evaluate(() => !!window.jspdf));
await fileCtx.close();

check("no console or page errors", errors.length === 0, errors.slice(0, 5).join(" | "));
await browser.close();
server.close();
finish();
