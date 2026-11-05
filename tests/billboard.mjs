// Billboard from start to finish: enquiry, create campaign with its payment record, airtime priced by the minute,
// prime time and overlap rules with the availability timeline, campaign list and View, feed by UTC window,
// pause and resume, lifecycle, report with airtime and CPM, phone and opening from disk.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { launchBrowser, reporter, ROOT, SHOTS, startServer } from "./lib.mjs";

const { server, url: SITE } = startServer();
const B = SITE + "prototypes/billboard/";
const { check, finish } = reporter();

const PACKAGES = ["Billboard", "Billboard Prime Time", "Featured Banner", "Standard Banner"];
const OLD_NAMES = /Prime Billboard|Prime Banner|Normal Time/;
const SEED_IDS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10"];

const browser = await launchBrowser();
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await desk.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.location().url)) errors.push(m.text()); });
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const count = (sel) => page.locator(sel).count();
const noApproval = (text) => !/approv|sign-off|signoff|Changes needed|Marketing, Dev/i.test(text);

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
await hub.locator('a[href="app/index.html"]').first().click();
await hub.locator('a[href="discover.html"]').first().click();
await hub.waitForTimeout(150);
check("app: discover has no ads", (await hub.locator(".ad, .sponsored").count()) === 0);
check("app: discover has no prototype bar", (await hub.locator(".proto-bar").count()) === 0);
check("app: feed renders", (await hub.locator(".feed .card").count()) > 3);
check("app: tabs link to the other main screens", (await hub.locator(".tabbar a").evaluateAll((a) => a.map((x) => x.getAttribute("href")).join())) === "discover.html,my-feed.html,create.html,shorts.html,profile.html");
check("app: suggested creators appear in the feed", (await hub.locator(".people-strip .person-card").count()) === 5);
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
await qp.evaluate(() => localStorage.setItem("us-answers-billboard-v4", JSON.stringify({ name: "", answers: { 0: { choice: "Old answer" }, 1: { choice: "Old answer" } } })));
await qp.reload();
check("questions: starts on the first of 22", (await qp.locator(".ask-card__count").innerText()).startsWith("Question 1 of 22") && (await qp.locator(".ask-dot").count()) === 22);
check("questions: answers to the earlier list aren't carried over", (await qp.locator("#ask-count").innerText()) === "0/22" && (await qp.locator(".proto-bar__count").innerText()) === "0/22");
const qSource = await readFile(join(ROOT, "prototypes/billboard/questions.html"), "utf8");
const qList = JSON.parse(qSource.slice(qSource.indexOf("questions: [") + 11, qSource.lastIndexOf("],") + 1));
check("questions: every one has two to four answers and a valid current answer", qList.every((q) => q.options.length >= 2 && q.options.length <= 4 && (q.current === null || (Number.isInteger(q.current) && q.current < q.options.length))), qList.filter((q) => q.options.length < 2 || q.options.length > 4).map((q) => q.title).join(", "));
const qTitles = qList.map((q) => q.title);
check("questions: answered ones are gone", !["Added to Create campaign", "Ad type names", "Who signs off"].some((t) => qTitles.includes(t)), qTitles.join(" | "));
check("questions: open ones are still there", ["Taking down a live ad", "Choosing countries", "Payment", "Enquiry owner and reply time", "End early and swap creative", "Make-good", "Rate card or media kit", "Empty slots"].every((t) => qTitles.includes(t)), qTitles.join(" | "));
const qByTitle = Object.fromEntries(qList.map((q) => [q.title, q]));
check("questions: ask for the exact prime time window and the time zone for bookings", /4-hour window/.test(qByTitle["Prime time window"]?.ask) && qByTitle["Prime time window"].options[0] === "13:00–17:00 UTC" && /campaign dates and daily windows/.test(qByTitle["Time zone for bookings"]?.ask) && qByTitle["Time zone for bookings"].options[qByTitle["Time zone for bookings"].current] === "UTC");
check("questions: no per-viewer time zones, rotation or day packages", !/viewer's own time|device time|rotat|\b(7|14|30)[ -]days?\b|package|Prime Time time zone/i.test(JSON.stringify(qList)), JSON.stringify(qList).match(/.{0,30}(viewer's own|device time|rotat|package|\b(7|14|30)[ -]day).{0,30}/i)?.[0] || "");
const cpmQ = qByTitle["Price per minute or per thousand views"];
check("questions: asks about CPM, marking per minute with CPM on the report as what the prototype does", cpmQ?.ask === "Brands usually compare ad prices per thousand views (CPM). Should we quote per minute of airtime only, also show the equivalent CPM, or sell per thousand views instead?" && /per minute.*CPM/i.test(cpmQ.options[cpmQ.current]), JSON.stringify(cpmQ));
check("questions: ask the minimum booking length and how windows are chosen", qByTitle["Minimum booking length"]?.options.join() === "15 minutes,30 minutes,1 hour" && qByTitle["Minimum booking length"].current === 0 && qByTitle["Choosing a window"]?.options[qByTitle["Choosing a window"].current] === "15-minute steps");
check("questions: ask how a window across prime time is handled", qByTitle["Windows that cross prime time"]?.current === 0 && /blocked/.test(qByTitle["Windows that cross prime time"].options[0]));
check("questions: nothing asks about approval or sign-off", noApproval(qSource));
check("questions: use the new package names", !OLD_NAMES.test(qSource) && /Featured Banner/.test(qSource) && /Billboard Prime Time/.test(qSource));
check("questions: taking down an ad asks about pausing", /pausing enough/i.test(qList[0].ask) && !/can't be stopped/.test(qSource));
check("questions: shows answers to tap, plus something else", (await qp.locator(".ask-option").count()) === 4 && (await qp.locator(".ask-option").last().innerText()).includes("Something else"));
check("questions: marks what the prototype does now", (await qp.locator(".ask-option__now").count()) === 1);
await qp.screenshot({ path: `${SHOTS}/billboard-questions.png` });
await qp.evaluate(() => { window.__card = document.querySelector(".ask-card"); });
await qp.locator(".ask-option").nth(1).click();
check("questions: tapping marks the answer without redrawing the screen", await qp.evaluate(() => window.__card === document.querySelector(".ask-card") && window.__card.getAnimations().length === 0 && getComputedStyle(window.__card).opacity === "1"));
await qp.waitForFunction(() => document.querySelector(".ask-card__count").textContent.startsWith("Question 2"));
const entry = await qp.evaluate(() => document.querySelector(".ask-card").getAnimations().flatMap((a) => a.effect.getKeyframes().flatMap((k) => Object.keys(k))));
check("questions: the next question only fades, with no sliding", !entry.includes("transform"), [...new Set(entry)].join(","));
check("questions: progress updates", (await qp.locator("#ask-count").innerText()) === "1/22");
check("questions: header count stays in step", (await qp.locator(".proto-bar__count").innerText()) === "1/22", await qp.locator(".proto-bar__count").innerText());
await qp.keyboard.press("2");
await qp.waitForFunction(() => document.querySelector(".ask-card__count").textContent.startsWith("Question 3"));
check("questions: number keys answer", (await qp.locator("#ask-count").innerText()) === "2/22");
await qp.locator(".ask-option").last().click();
check("questions: something else opens a box and waits", await qp.evaluate(() => document.activeElement.id === "ask-note"));
await qp.locator("#ask-note").fill("Paused days plus a free week.");
await qp.keyboard.press("Tab");
await qp.locator('.ask-nav [data-go="3"]').click();
await qp.locator("[data-note]").click();
await qp.locator("#ask-note").fill("Check with finance.");
await qp.locator(".ask-option").first().click();
await qp.waitForTimeout(500);
check("questions: adding a note keeps you on the question", (await qp.locator(".ask-card__count").innerText()).startsWith("Question 4"));
await qp.locator('.ask-nav .btn-next, .ask-nav [data-go="4"]').click();
await qp.reload();
check("questions: answers survive a reload, opening at the next one", (await qp.locator(".ask-card__count").innerText()).startsWith("Question 5") && (await qp.locator("#ask-count").innerText()) === "4/22");
await qp.locator(".ask-dot").nth(1).click();
check("questions: progress bar jumps to a question and shows the answer", (await qp.locator(".ask-option.is-selected").count()) === 1);
await qp.locator(".ask-progress__review").click();
check("questions: review lists every question", (await qp.locator(".ask-row").count()) === 22);
check("questions: review flags the unanswered", (await qp.locator(".ask-row__answer.is-empty").count()) === 18);
await qp.fill("#answer-name", "Sam Reviewer");
const [answerFile] = await Promise.all([qp.waitForEvent("download"), qp.click("#answer-export")]);
const answerText = await readFile(await answerFile.path(), "utf8");
check("questions: exported file is named for the person", /^billboard-answers-sam-reviewer-\d{4}-\d\d-\d\d\.md$/.test(answerFile.suggestedFilename()), answerFile.suggestedFilename());
check("questions: export has name, answers, notes and gaps", ["Answered by: Sam Reviewer", "**Answer:** Admin also needs a remove action", "**Answer:** Paused days plus a free week.", "**Note:** Check with finance.", "**Answer:** No answer", "**In the prototype now:** Pausing is enough", "## Q22."].every((s) => answerText.includes(s)));
check("questions: answering and exporting sends nothing", answerRequests.length === 0, answerRequests.join(" | "));
await qp.locator(".ask-row").nth(4).click();
await qp.screenshot({ path: `${SHOTS}/billboard-questions-answer.png` });
await qp.goBack().catch(() => {});
await qp.close();

// Prototype bar
const barPage = await desk.newPage();
await barPage.goto(B + "admin/campaigns.html");
check("bar: shows the steps with the current one marked", (await barPage.locator('.proto-bar__nav a[aria-current="page"]').innerText()).includes("Campaigns"));
const barSteps = (await barPage.locator(".proto-bar__nav a").allTextContents()).map((t) => t.replace(/\d+\/\d+|\d/g, "").trim()).join(",");
check("bar: steps in order, with no approve step", barSteps === "Enquiry,Create,Discover,Campaigns,Report,Questions", barSteps);
check("bar: names the prototype Billboard", (await barPage.locator(".proto-bar__name").innerText()) === "Billboard");
check("bar: demo time is out of the way until opened", !(await barPage.locator("#demo-now").isVisible()));
await barPage.click(".proto-bar__toggle");
check("bar: demo time opens", await barPage.locator("#demo-now").isVisible());
await barPage.click('[data-shift="7"]');
check("bar: moving time updates the page", (await barPage.locator(".proto-bar__when").innerText()).startsWith("10 Nov"), await barPage.locator(".proto-bar__when").innerText());
check("bar: demo time is in UTC", (await barPage.locator(".proto-bar__when").innerText()) === "10 Nov, 14:00 UTC" && (await barPage.locator('label[for="demo-now"]').innerText()).includes("UTC"), await barPage.locator(".proto-bar__when").innerText());
await barPage.click("[data-reset]");
await barPage.keyboard.press("Escape");
check("bar: escape closes demo time", !(await barPage.locator("#demo-now").isVisible()));
check("bar: stays one row on desktop", (await barPage.locator(".proto-bar").evaluate((e) => e.offsetHeight)) <= 60);
await barPage.setViewportSize({ width: 800, height: 700 });
check("bar: compact on tablets", await barPage.locator(".proto-bar__select").isVisible() && !(await barPage.locator(".proto-bar__nav").isVisible()));
await barPage.goto(B + "app/watch.html?id=v2");
await barPage.setViewportSize({ width: 1440, height: 900 });
check("bar: video screen counts as the Discover step", (await barPage.locator('.proto-bar__nav a[aria-current="page"]').innerText()).includes("Discover"));
await barPage.goto(B + "admin/campaign.html?id=c1");
check("bar: a campaign's View page counts as the Campaigns step", (await barPage.locator('.proto-bar__nav a[aria-current="page"]').innerText()).includes("Campaigns"));
await barPage.close();

// Overview
await page.goto(B + "index.html");
const overviewText = await page.locator("main").innerText();
check("overview: called Billboard", (await page.locator("h1").innerText()) === "Billboard" && (await page.title()).startsWith("Billboard"));
check("overview: no approval step or wording", noApproval(overviewText) && (await count(".step")) === 6, String(await count(".step")));
check("overview: steps follow the bar", (await page.locator(".step .item__title").allInnerTexts()).join(" | ") === "Advertiser enquiry page | Admin: Create campaign | The four ad slots in Discover | Admin: Campaign list and View | End-of-campaign report | Questions to decide");
check("overview: uses the slot names", !OLD_NAMES.test(overviewText) && PACKAGES.every((n) => overviewText.includes(n)));
check("overview: question count matches", overviewText.includes("22 to answer"));
check("overview: describes airtime by the minute, one advertiser per slot, and the report's CPM", /sold by the minute/.test(overviewText) && /one advertiser per slot/.test(overviewText) && /cost per 1,000 impressions/.test(overviewText) && /13:00–17:00 UTC/.test(overviewText));
const stateLinks = await page.locator("main ul a").evaluateAll((a) => a.map((x) => x.getAttribute("href")));
check("overview: each state links to the overlap and prime time errors and Discover by time", ["admin/campaign-new.html?state=overlap", "admin/campaign-new.html?state=prime", "app/discover.html?state=normal", "app/discover.html?state=prime", "app/discover.html?state=empty", "admin/report.html?id=c7"].every((h) => stateLinks.includes(h)), stateLinks.join(" "));
await page.screenshot({ path: `${SHOTS}/1-overview.png`, fullPage: true });

// Enquiry
await page.goto(B + "web/advertise.html");
const enquiryText = await page.locator("body").innerText();
check("enquiry: shows the four packages by their names, as chips", (await page.locator("#chips [data-pkg]").allInnerTexts()).join() === PACKAGES.join() && (await page.locator('#chips [aria-pressed]').count()) === 4);
check("enquiry: the old package list and phone preview are gone", (await count(".type, [data-ad-type], .adp-tab, .adp-phone, .how")) === 0);
check("enquiry: form offers the same packages", (await page.locator("#type option").allInnerTexts()).slice(1).join() === [...PACKAGES, "Not sure yet"].join());
check("enquiry: no old names", !OLD_NAMES.test(enquiryText));
check("enquiry: no prices on the public page", !/A\$|\$\s?\d|\d+\s?(AUD|USD)\b|per (day|week|minute)/i.test(enquiryText), enquiryText.match(/.{0,20}\$.{0,20}/)?.[0] || "");
check("enquiry: explains airtime in plain words, with no day packages", (await page.locator(".lede").innerText()).includes("Book the hours of the day you want, on the days you want.") && !/package|\b(7|14|30)[ -]days?\b/i.test(enquiryText), enquiryText.match(/.{0,30}(package|\b(7|14|30)[ -]day).{0,30}/i)?.[0] || "");
check("enquiry: an optional preferred time of day, offering prime time", (await page.locator("#time option").allInnerTexts()).includes("Prime time") && /optional/.test(await page.locator("label:has(#time) .field__label").innerText()));
check("enquiry: no note about when prices are sent", !/Prices are sent|after you enquire/i.test(enquiryText) && (await count(".price-line")) === 0);
check("enquiry: pricing comes up once, as the quote sales replies with", (enquiryText.match(/\b(quote|prices?|pricing)\b/gi) || []).length === 1 && /quote/.test(await page.locator(".lede").innerText()), (enquiryText.match(/.{0,30}\b(quote|prices?|pricing)\b.{0,30}/gi) || []).join(" | "));
check("enquiry: no approval wording", noApproval(enquiryText) && !/We check/.test(enquiryText));
check("enquiry: says nothing entered is sent or saved", /nothing you enter is sent or saved/i.test(enquiryText));
check("enquiry: keeps the website's fonts", /Space Grotesk/.test(await page.locator("h1").evaluate((e) => getComputedStyle(e).fontFamily)) && /Inter/.test(await page.locator("body").evaluate((e) => getComputedStyle(e).fontFamily)));
await page.screenshot({ path: `${SHOTS}/2-enquiry.png` });

// Enquiry on one screen: headline, ad slot chips, the feed drawing and the whole form, with nothing to scroll
const enquiryParts = ["h1", ".lede", "#chips", "#feed-sketch .sp", "#caption", "#form", "#form [type=submit]"];
const fitsOneScreen = (p) => p.evaluate((parts) => {
  const top = document.querySelector(".proto-bar").getBoundingClientRect().bottom;
  const out = parts.filter((s) => { const el = document.querySelector(s); if (!el) return true; const r = el.getBoundingClientRect(); return !(r.width > 0 && r.top >= top - 1 && r.bottom <= innerHeight + 1); });
  return { scrolls: document.documentElement.scrollHeight > innerHeight + 1, out };
}, enquiryParts);
for (const [w, h] of [[1440, 900], [1280, 800], [1024, 768]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.reload();
  const fit = await fitsOneScreen(page);
  // Billboard Prime Time has the longest line under the drawing, with its placeholder hours.
  await page.click('#chips [data-pkg="billboard-prime"]');
  const fitPrime = await fitsOneScreen(page);
  check(`enquiry: headline, packages, feed drawing and the whole form fit on one screen at ${w}×${h}`, !fit.scrolls && !fit.out.length && !fitPrime.scrolls && !fitPrime.out.length, JSON.stringify([fit, fitPrime]));
  if (w === 1024) await page.waitForTimeout(350).then(() => page.screenshot({ path: `${SHOTS}/2-enquiry-1024-billboard-prime.png` }));
}
await page.setViewportSize({ width: 1440, height: 900 });
await page.reload();

// Enquiry: the feed drawing. Grey blocks in the app's order, with only the chosen slot in colour.
const sketchState = () => page.evaluate(() => ({ type: document.getElementById("type").value, on: document.querySelector("#feed-sketch .sp").dataset.on, chip: document.querySelector('#chips [aria-pressed="true"]')?.dataset.pkg || null, caption: document.getElementById("caption").textContent }));
const SEED_BRANDS = new RegExp(["Kestrel", "Volt", "Tallow", "Orbit", "Fable", "Marlowe", "Juniper", "Harbour", "Saltmarsh", "Copperline", "Your brand", "Sponsored"].join("|"));
const sketch = await page.evaluate(() => { const sp = document.querySelector("#feed-sketch .sp"); return { hidden: sp.getAttribute("aria-hidden"), pictures: sp.querySelectorAll("img, svg:not(.lucide), .avatar, .card, .ad").length, text: sp.textContent, order: [...sp.querySelectorAll(".sp__feed > *")].map((el) => el.dataset.slot || el.className.replace("sp__", "")) }; });
check("drawing: a simple schematic, with no thumbnails, brands or avatars, hidden from screen readers", sketch.pictures === 0 && !SEED_BRANDS.test(sketch.text) && sketch.hidden === "true", JSON.stringify(sketch).slice(0, 200));
const order = sketch.order;
check("drawing: slots sit where the app puts them: top, Featured directly below, Standard after about 15 items, repeating", order[0] === "top" && order[1] === "featured" && order.indexOf("standard") > 2 && order[order.indexOf("standard") - 1] === "gap" && order.lastIndexOf("standard") > order.indexOf("standard") + 1 && /about 15 items/.test(sketch.text), order.join(","));
let es = await sketchState();
check("drawing: opens on Billboard in the chips, the drawing and the form", es.type === "Billboard" && es.on === "billboard" && es.chip === "billboard" && /first thing/.test(es.caption), JSON.stringify(es));
await page.click('#chips [data-pkg="featured"]');
await page.waitForTimeout(350); // let the colour finish fading
es = await sketchState();
const slotLook = await page.evaluate(() => [...document.querySelectorAll("#feed-sketch .sp__slot")].map((s) => getComputedStyle(s).backgroundColor));
check("drawing: a chip colours its slot, labels it and sets the form", es.type === "Featured Banner" && es.on === "featured" && es.chip === "featured" && (await page.locator('#feed-sketch .sp__slot--featured [data-for="featured"]').isVisible()) && /below the Billboard/.test(es.caption), JSON.stringify(es));
check("drawing: only the chosen slot is in colour", slotLook[1] !== slotLook[0] && slotLook[0] === slotLook[2] && slotLook[0] === slotLook[3], slotLook.join(" | "));
await page.screenshot({ path: `${SHOTS}/2-enquiry-featured.png` });
await page.selectOption("#type", "Standard Banner");
es = await sketchState();
check("drawing: the form's package moves the chips and the drawing", es.on === "standard" && es.chip === "standard" && (await page.locator("#feed-sketch .sp__slot--again .sp__again").isVisible()) && /every 15 items/.test(es.caption), JSON.stringify(es));
await page.waitForTimeout(350);
await page.screenshot({ path: `${SHOTS}/2-enquiry-standard.png` });
await page.click('#chips [data-pkg="billboard-prime"]');
check("drawing: Billboard Prime Time takes the top slot, its tag showing the UTC prime time window, with placeholder hours", (await sketchState()).on === "billboard-prime" && (await page.locator('#feed-sketch [data-for="billboard-prime"] .sp__tag').innerText()).includes("Prime time 13:00–17:00 UTC") && /13:00–17:00 UTC/.test(await page.locator("#caption").innerText()) && (await page.locator("#caption .tag--placeholder").innerText()) === "Placeholder hours");
await page.waitForTimeout(350);
await page.screenshot({ path: `${SHOTS}/2-enquiry-billboard-prime.png` });
await page.selectOption("#type", "Not sure yet");
es = await sketchState();
check("drawing: Not sure yet clears the chips and the drawing", es.on === "" && es.chip === null && /Choose an ad slot/.test(es.caption), JSON.stringify(es));
await page.reload();
const opt = await page.locator("#type option").first().evaluate((o) => { const s = getComputedStyle(o); return [s.color, s.backgroundColor]; });
check("enquiry: dropdown options are readable", opt[0] === "rgb(255, 255, 255)" && opt[1] === "rgb(25, 25, 25)", opt.join(" on "));
await page.selectOption("#type", "");
await page.click('button[type=submit]');
check("enquiry: empty submit shows every error and focuses the first", (await count(".field--invalid")) === 6 && (await page.evaluate(() => document.activeElement.id)) === "company");
check("enquiry: message is optional", (await page.locator("#message").evaluate((e) => !e.closest(".field--invalid"))));
await page.screenshot({ path: `${SHOTS}/2-enquiry-errors.png` });
await page.fill("#company", "Test Co");
check("enquiry: error clears once fixed", !(await page.locator("#f-company").evaluate((e) => e.classList.contains("field--invalid"))));
await page.click('#chips [data-pkg="featured"]');
check("enquiry: choosing a package with a chip clears its error", !(await page.locator("#f-type").evaluate((e) => e.classList.contains("field--invalid"))));
await page.fill("#email", "not-an-email"); await page.fill("#phone", "12"); await page.fill("#from", "2020-01-01");
check("enquiry: a bad email, phone and past start date stay flagged", (await count("#f-email.field--invalid, #f-phone.field--invalid, #f-dates.field--invalid")) === 3);
check("enquiry: eyebrow is orange", (await page.locator(".eyebrow").evaluate((e) => getComputedStyle(e).color)) === "rgb(255, 92, 0)");
await page.fill("#contact", "A Person"); await page.fill("#email", "a@example.com");
await page.fill("#phone", "+61 400 000 000"); await page.selectOption("#type", { index: 1 }); await page.fill("#from", "2026-12-01");
let netPosts = 0; page.on("request", (r) => { if (r.method() !== "GET") netPosts++; });
await page.click('button[type=submit]');
check("enquiry: success state", await page.locator(".success").isVisible() && (await page.locator(".success").innerText()).includes("a@example.com") && (await page.locator(".success").innerText()).includes("Test Co"));
check("enquiry: sends nothing", netPosts === 0);

// Feed: prime time at default demo time
await page.goto(B + "app/discover.html");
await page.evaluate(() => { US.reset(); });
await page.reload();
const adNames = () => page.locator(".feed .ad .ad__name").allTextContents();
let names = await adNames();
check("feed: Billboard Prime Time first at 14:00 UTC, in prime time", names[0] === "Kestrel Audio" && /14:00 UTC.*is in prime time/.test(await page.locator("#review-time").innerText()), names.slice(0, 3).join(", "));
check("feed: Featured Banner second", names[1] === "Tallow & Thread" && (await page.locator(".feed > *").nth(1).evaluate((e) => e.classList.contains("ad--featured"))));
check("feed: first element is billboard", await page.locator(".feed > *").first().evaluate((e) => e.classList.contains("ad--billboard")));
check("feed: review panel uses the new names", /Billboard Prime Time/.test(await page.locator("#review-slots").innerText()) && /Featured Banner/.test(await page.locator("#review-slots").innerText()) && !OLD_NAMES.test(await page.locator(".review").innerText()));
check("feed: review rules don't mention approval", noApproval(await page.locator(".review").innerText()));
await page.screenshot({ path: `${SHOTS}/3-discover-prime.png` });

check("feed: review panel gives each slot's UTC window and prime time in UTC", (await page.locator("#review-slots").innerText()).includes("Kestrel Audio · Billboard Prime Time · 13:00–17:00 UTC") && /13:00–17:00 UTC/.test(await page.locator("#prime-hours").innerText()));
check("feed: one campaign per slot, so every Standard Banner is the same advertiser", (await page.locator(".feed .ad--standard .ad__name").allTextContents()).every((n) => n === "Orbit Gear") && (await count(".feed .ad--billboard")) === 1 && (await count(".feed .ad--featured")) === 1);

await page.click("#jump-normal");
names = await adNames();
check("feed: Billboard at 10:00 UTC, outside prime time", names[0] === "Volt & Ember", names[0]);
check("feed: review panel names the Billboard outside prime time", (await page.locator("#review-slots").innerText()).includes("Volt & Ember · Billboard · 08:00–12:00 UTC"));
await page.evaluate(() => US.setNow("2026-11-03T12:30"));
names = await adNames();
check("feed: between two booked windows the top slot is empty and collapses, so the Featured Banner is first", names[0] === "Tallow & Thread" && (await page.locator(".feed > *").first().evaluate((e) => e.classList.contains("ad--featured"))), names.join(", "));
await page.click("#jump-empty");
check("feed: with nothing on air every slot collapses", (await count(".feed .ad")) === 0 && (await page.locator("#review-slots").innerText()).includes("Nothing on air"));
await page.screenshot({ path: `${SHOTS}/3-discover-empty.png` });
await page.goto(B + "app/discover.html?state=normal");
check("feed: ?state=normal sets 10:00 UTC", (await adNames())[0] === "Volt & Ember");
await page.goto(B + "app/discover.html?state=prime");
check("feed: ?state=prime sets 14:00 UTC", (await adNames())[0] === "Kestrel Audio");
// Prime time is one moment for every viewer: a device in another time zone sees the same ads.
for (const timezoneId of ["America/New_York", "Asia/Tokyo"]) {
  const tzCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId });
  const tz = await tzCtx.newPage();
  await tz.goto(B + "app/discover.html?state=prime");
  const top = await tz.locator(".feed .ad .ad__name").first().textContent();
  const local = await tz.locator("#review-time").innerText();
  check(`feed: prime time follows UTC on a device in ${timezoneId}, with the local time shown`, top === "Kestrel Audio" && /14:00 UTC \(\d\d:\d\d your time/.test(local), `${top} | ${local}`);
  await tzCtx.close();
}

// Standard banner cadence, measured across a long scroll
await page.evaluate(async () => { const f = document.getElementById("feed"); for (let i = 0; i < 25; i++) { f.scrollTop = f.scrollHeight; await new Promise((r) => setTimeout(r, 60)); } });
const cadence = await page.evaluate(() => {
  const kids = [...document.getElementById("feed").children];
  const gaps = []; let n = 0;
  for (const k of kids) { if (k.classList.contains("card")) n++; else if (k.classList.contains("short-row")) n += 2; else if (k.classList.contains("ad--standard")) { gaps.push(n); n = 0; } }
  return gaps;
});
check("feed: standard banner about every 15 and repeating", cadence.length >= 3 && cadence.every((g) => g >= 14 && g <= 16), cadence.join(","));
const standardNames = await page.locator(".feed .ad--standard .ad__name").allTextContents();
check("feed: no rotation: the repeating Standard Banner is always the one advertiser on air", standardNames.length >= 3 && standardNames.every((n) => n === "Orbit Gear"), standardNames.join(", "));
check("design: five tabs in order", (await page.locator(".tabbar button").allInnerTexts()).join() === "Discover,My Feed,Create,Shorts,Profile");
check("design: shorts sit two across", (await count(".short-row")) > 0 && (await page.locator(".short-row").first().locator(".card").count()) === 2);
check("design: primary button uses the gradient", /linear-gradient/.test(await page.evaluate(() => { const b = document.createElement("button"); b.className = "btn btn--primary"; document.body.append(b); const v = getComputedStyle(b).backgroundImage; b.remove(); return v; })));
const lucideIn = (sel) => page.locator(sel + " svg.lucide").evaluateAll((els) => els.map((e) => e.getAttribute("data-lucide")).join());
check("icons: tabs use Lucide", (await lucideIn(".tabbar")) === "compass,user-round-search,circle-plus,video,circle-user-round", await lucideIn(".tabbar"));
check("icons: header uses Lucide", (await lucideIn(".topbar")) === "bell-dot,search", await lucideIn(".topbar"));
check("icons: ads rendered later get Lucide icons", (await page.locator(".ad__cta svg.lucide-arrow-up-right").count()) === (await page.locator(".feed .ad").count()));
check("icons: live badge uses Lucide", (await page.locator(".live-badge svg.lucide-radio").count()) > 0 && (await page.locator(".views-badge svg.lucide-eye").count()) > 0);
check("icons: none left unrendered", (await page.locator("i[data-lucide]").count()) === 0);
const tok = await page.evaluate(() => { const b = document.createElement("button"); b.className = "btn btn--primary"; document.body.append(b); const bg = getComputedStyle(b).backgroundImage; b.remove(); const c = getComputedStyle(document.documentElement); return { bg, gold: c.getPropertyValue("--brand-gold-6").trim(), active: getComputedStyle(document.querySelector('.tabbar button[aria-current]')).color }; });
check("colours: button gradient is red-6 to orange-6, as in the app", tok.bg.includes("rgb(216, 10, 0)") && tok.bg.includes("rgb(255, 127, 0)"), tok.bg);
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
check("feed: tapping a category again returns to All", (await page.locator('.chip[aria-pressed="true"]').innerText()) === "All");

// No ads on video or live
await page.goto(B + "app/watch.html?id=v0");
check("rule: no ads on video", (await count(".ad")) === 0);
check("icons: video actions use Lucide", (await page.locator(".actions-row svg.lucide").evaluateAll((els) => els.map((e) => e.getAttribute("data-lucide")).join())) === "thumbs-up,thumbs-down,message-circle,hand-coins,share");
check("icons: back arrow uses Lucide", (await count(".player__back svg.lucide-chevron-left")) === 1);
await page.goto(B + "app/watch.html?live=1");
check("rule: no ads on live", (await count(".ad")) === 0);

// Campaign list
await page.goto(B + "admin/campaigns.html");
const listText = await page.locator("main").innerText();
const groupText = await page.locator(".group__title").allTextContents();
check("list: three groups in order, with no approval group", groupText.length === 3 && /Scheduled/.test(groupText[0]) && /Live/.test(groupText[1]) && /Ended/.test(groupText[2]), groupText.join(" | "));
check("list: no approval wording", noApproval(listText));
check("list: old approval samples are now scheduled", (await page.locator("#group-scheduled").innerText()).includes("Saltmarsh Coffee") && (await page.locator("#group-scheduled").innerText()).includes("Copperline Bikes"));
check("list: uses the slot names", !OLD_NAMES.test(listText) && ["Billboard Prime Time", "Featured Banner", "Standard Banner"].every((n) => listText.includes(n)));
check("list: each campaign shows its slot and daily UTC window, with costs in US dollars and no day packages", (await page.locator("tbody tr .cell-sub").first().innerText()).match(/· \d\d:\d\d–\d\d:\d\d UTC daily$/) && (await page.locator('td[data-label="Cost"]').allInnerTexts()).every((t) => /^US\$[\d,]+$/.test(t)) && !/A\$|package|· (7|14|30) days/i.test(listText), listText.match(/.{0,30}(A\$|package|· (7|14|30) days).{0,30}/i)?.[0] || "");
check("list: booked value is the sum of minutes × days × rate", await page.evaluate(() => {
  const sum = US.campaigns().reduce((s, c) => s + US.minutesPerDay(c) * US.days(c) * US.AD_TYPES[c.type].rate, 0);
  return document.querySelector(".tile:last-child .tile__value").textContent === US.fmtMoney(sum);
}));
const rows = await page.locator("tbody tr").count();
check("list: every campaign has a View action", rows === SEED_IDS.length && (await page.locator('tbody tr a[data-view]').count()) === rows && (await page.locator('tbody tr a[data-view]').evaluateAll((a) => a.every((x) => /campaign\.html\?id=/.test(x.getAttribute("href")) && x.textContent.trim() === "View"))), String(rows));
check("list: every campaign name opens its View page", (await page.locator("tbody tr a.cell-link").evaluateAll((a) => a.every((x) => /^campaign\.html\?id=/.test(x.getAttribute("href"))))) && (await page.locator("tbody tr a.cell-link").count()) === rows);
check("list: every live campaign can be paused", (await page.locator("#group-live [data-pause]").count()) === (await page.locator("#group-live tbody tr").count()) && (await page.locator("#group-live [data-pause]").count()) > 0);
check("list: scheduled and ended campaigns can't be paused", (await page.locator("#group-scheduled [data-pause], #group-ended [data-pause]").count()) === 0);
check("rule: no end early or swap creative actions", !(await page.getByRole("button", { name: /end early|stop|swap/i }).count()) && !(await page.getByRole("link", { name: /end early|stop|swap/i }).count()));
check("rule: nothing says a live campaign can't be stopped", !/can't be stopped|cannot be stopped/i.test(await page.locator("body").innerText()));
check("list: four tiles", (await count(".tile")) === 4);
await page.screenshot({ path: `${SHOTS}/5-campaigns.png`, fullPage: true });
await page.click('tr[data-campaign="c5"] td[data-label="Period"]');
await page.waitForURL(/campaign\.html\?id=c5/);
check("list: clicking a row opens the campaign", (await page.locator("h1").innerText()) === "Fable Cycles");
await page.goto(B + "admin/campaigns.html");
await page.click('tr[data-campaign="c7"] a[data-view]');
await page.waitForURL(/campaign\.html\?id=c7/);
check("list: View opens the campaign", (await page.locator("h1").innerText()) === "Juniper Travel");

// View page for every sample campaign: details, creative, payment record and pause log
const viewProblems = [];
for (const cid of SEED_IDS) {
  await page.goto(B + `admin/campaign.html?id=${cid}`);
  const details = await page.locator("#details").innerText();
  const payment = await page.locator("#payment").innerText();
  const whole = await page.locator("main").innerText();
  const status = await page.locator(".head .badge").innerText();
  const okDetails = ["Status", "Slot", "Dates", "Daily window", "Airtime booked", "Rate", "Link", "Cost"].every((k) => details.includes(k)) && /example\.com/.test(details) && /US\$[\d,]+ per minute/.test(details) && /\d\d:\d\d–\d\d:\d\d UTC/.test(details) && !/A\$|package/i.test(whole);
  const okPay = ["Confirmed by", "Date confirmed", "Method", "Reference"].every((k) => payment.includes(k)) && /SAMPLE-\d{4}/.test(payment) && /(Sales|Finance)/.test(payment) && /(Bank transfer|Card|Payment link)/.test(payment) && !payment.includes("Not recorded");
  const okCreative = (await page.locator("#creative .ad .sponsored").innerText()) === "Sponsored";
  const okPauses = (await page.locator("#pauses").count()) === 1;
  const action = { Live: ".head [data-pause]", Ended: '.head a[href^="report.html"]', Scheduled: null }[status];
  const okAction = action === null ? (await page.locator(".head [data-pause], .head [data-resume], .head a[href^='report.html']").count()) === 0 : (await page.locator(action).count()) === 1;
  if (!(okDetails && okPay && okCreative && okPauses && okAction && noApproval(whole) && !OLD_NAMES.test(whole))) viewProblems.push(`${cid}: details ${okDetails}, payment ${okPay}, creative ${okCreative}, pauses ${okPauses}, action ${okAction}, status ${status}`);
}
check("view: every sample campaign shows its details, creative, payment record, pause log and actions", viewProblems.length === 0, viewProblems.join(" | "));
await page.goto(B + "admin/campaign.html?id=c7");
check("view: dates include the paused days", (await page.locator("#details").innerText()).includes("2 paused days added"));
check("view: the pause log has from, to and length", (await page.locator("#pauses tbody tr").count()) === 1 && /10 Oct 2026/.test(await page.locator("#pauses tbody td").first().innerText()) && /2 days/.test(await page.locator("#pauses tbody").innerText()));
check("view: ended campaign offers View report", (await page.locator('.head a[href="report.html?id=c7"]').innerText()).includes("View report"));
await page.screenshot({ path: `${SHOTS}/5b-view-ended.png`, fullPage: true });
await page.goto(B + "admin/campaign.html?id=c1");
await page.screenshot({ path: `${SHOTS}/5c-view-live.png`, fullPage: true });
await page.goto(B + "admin/campaign.html?id=nope");
check("view: unknown campaign says so", (await page.locator(".empty").innerText()).includes("wasn't found"));
await page.goto(B + "admin/campaign.html?id=c1");
const c1Details = await page.locator("#details").innerText();
check("view: cost is the daily window's minutes × days × the slot's rate", ["Billboard Prime Time", "13:00–17:00 UTC", "240 min a day", "3,360 min", "US$30 per minute", "US$100,800", "240 min × 14 days × US$30"].every((s) => c1Details.includes(s)), c1Details.replace(/\s+/g, " "));

// Create campaign
await page.goto(B + "admin/campaign-new.html");
check("create: no confirmation checkbox, a payment record instead", (await count("#confirm")) === 0 && (await count("#pay-by, #pay-date, #pay-method, #pay-ref")) === 4);
check("create: payment methods are marked as placeholders", /Placeholder payment methods/.test(await page.locator(".panel h2", { hasText: "Payment record" }).innerText()) && (await page.locator("#pay-method option").count()) >= 3);
check("create: offers the four slots by name, each with a placeholder per-minute rate in US dollars", (await page.locator("#types .option__name").allInnerTexts()).join() === PACKAGES.join() && (await page.locator("#types .option__rate").allInnerTexts()).join() === "US$12 per minute,US$30 per minute,US$7 per minute,US$3 per minute" && /Placeholder rates/.test(await page.locator(".panel h2", { hasText: "Ad slot" }).innerText()));
const createText = await page.locator("main").innerText();
check("create: no approval wording, no day packages", noApproval(createText) && (await count('input[name="days"], #durations')) === 0 && !/package|\b(7|14|30)[ -]days?\b|A\$/i.test(createText));
check("create: placeholder rates aren't the round numbers to avoid", await page.evaluate(() => Object.values(US.AD_TYPES).every((t) => ![50, 100, 8, 5].includes(t.rate))));
check("create: dates and a daily window in UTC, in 15-minute steps up to 24:00", (await count("#start, #end, #win-from, #win-to")) === 4 && (await page.locator("#win-to option").last().innerText()) === "24:00" && (await page.locator("#win-from option").nth(1).innerText()) === "00:15" && /UTC/.test(await page.locator("#schedule").innerText()));
check("create: the availability timeline runs 00:00 to 24:00 UTC with the prime band marked", (await page.locator(".tl__tick").allInnerTexts()).join() === "00:00,06:00,12:00,18:00,24:00" && (await count(".tl__prime")) === 1 && /13:00–17:00 UTC/.test(await page.locator("#legend").innerText()) && (await page.locator(".tl__prime").evaluate((e) => [e.style.left, e.style.width].join())) === "54.1667%,16.6667%");
check("create: per-minute cost is minutes a day × days × rate", await page.evaluate(() => {
  const c = (type, start, end, from, to) => US.cost({ type, start, end, from, to });
  return c("billboard", "2026-11-12", "2026-11-25", "10:00", "12:00") === 120 * 14 * 12
    && c("billboard-prime", "2026-11-12", "2026-11-12", "13:00", "17:00") === 240 * 1 * 30
    && c("featured", "2026-12-01", "2026-12-07", "00:00", "24:00") === 1440 * 7 * 7
    && c("standard", "2026-12-01", "2026-12-31", "06:15", "06:30") === 15 * 31 * 3;
}));
await page.click('button[type=submit]');
check("create: validation stops empty form", (await count(".field--invalid")) === 8, String(await count(".field--invalid")));
await page.fill("#advertiser", "Prototype <Test> Brand");
await page.click("#sample");
await page.fill("#url", "example.com/test");
await page.locator("#url").blur();
check("create: adds https:// to a pasted link", (await page.inputValue("#url")) === "https://example.com/test");
await page.fill("#start", "2026-11-04");
await page.fill("#end", "2026-11-10");

// Billboard must sit outside prime time, and Billboard Prime Time inside it
const windowError = () => page.locator("#window-error").innerText();
const pickType = (t) => page.click(`input[name=type][value="${t}"]`, { force: true });
const setWindow = async (from, to) => { await page.selectOption("#win-from", from); await page.selectOption("#win-to", to); };
await pickType("billboard");
await setWindow("11:00", "15:00");
check("create: a Billboard window that runs into prime time is blocked, with a fix to the part that fits", /runs into prime time \(13:00–17:00 UTC\)/.test(await windowError()) && (await page.locator("#window-fix").innerText()) === "Use 11:00–13:00 UTC" && (await count("#f-window.field--invalid")) === 1 && (await count(".tl__mine.is-bad")) === 1, await windowError());
await page.screenshot({ path: `${SHOTS}/6-create-prime.png`, fullPage: true });
await page.click("#window-fix");
check("create: the fix trims the window to 11:00–13:00, which then meets Volt & Ember's booking", (await page.inputValue("#win-from")) === "11:00" && (await page.inputValue("#win-to")) === "13:00" && /Volt & Ember has 08:00–12:00 UTC/.test(await windowError()), await windowError());
check("create: the overlap error suggests the nearest free window of the same length", /nearest free 120-minute window on these dates is 06:00–08:00 UTC/.test(await windowError()) && (await page.locator("#window-fix").innerText()) === "Use 06:00–08:00 UTC");
await setWindow("14:00", "16:00");
check("create: a Billboard window inside prime time offers Billboard Prime Time", /Billboard runs outside prime time/.test(await windowError()) && (await page.locator("#window-fix").innerText()) === "Switch to Billboard Prime Time");
await page.click("#window-fix");
check("create: switching to Billboard Prime Time meets Kestrel Audio, with no free prime time window left on those dates", (await page.locator('input[name=type]:checked').inputValue()) === "billboard-prime" && /Kestrel Audio has 13:00–17:00 UTC/.test(await windowError()) && /no free window of this length/.test(await windowError()) && (await count("#window-fix")) === 0, await windowError());
await setWindow("10:00", "12:00");
check("create: a Billboard Prime Time window outside prime time offers Billboard", /only runs in prime time/.test(await windowError()) && (await page.locator("#window-fix").innerText()) === "Switch to Billboard");
await setWindow("16:00", "18:00");
check("create: a Billboard Prime Time window that runs past prime time is trimmed to prime time", (await page.locator("#window-fix").innerText()) === "Use 16:00–17:00 UTC");
await setWindow("12:00", "11:00");
check("create: a window has to end after it starts", /has to end after it starts/.test(await windowError()));

// One advertiser per slot per minute: Tallow & Thread has the Featured Banner 09:00–18:00 until 8 Nov
await pickType("featured");
await setWindow("10:00", "12:00");
check("create: an overlapping booking is blocked with a clear error", /already booked\. Tallow & Thread has 09:00–18:00 UTC from 26 Oct 2026 to 8 Nov 2026/.test(await windowError()) && /one advertiser at a time/.test(await windowError()), await windowError());
check("create: the timeline greys out the booked window and marks the clash", (await page.locator(".tl__booked").count()) === 1 && (await page.locator(".tl__booked").innerText()) === "Tallow & Thread" && (await page.locator(".tl__booked").evaluate((e) => e.style.left)) === "37.5%" && (await count(".tl__mine.is-bad")) === 1 && /Tallow & Thread 09:00–18:00 UTC/.test(await page.locator("#avail-list").innerText()));
check("create: suggests 07:00–09:00 as the nearest free window", (await page.locator("#window-fix").innerText()) === "Use 07:00–09:00 UTC");
await page.screenshot({ path: `${SHOTS}/6-create-overlap.png`, fullPage: true });
await page.click('button[type=submit]');
check("create: an overlapping window can't be saved", /campaign-new\.html/.test(page.url()) && (await count("#f-window.field--invalid")) === 1);
await page.click("#window-fix");
await page.waitForTimeout(100);
check("create: the suggested window clears the error and shows as free", (await page.locator("#window-error").isHidden()) && (await count(".tl__mine.is-bad")) === 0 && (await count(".tl__mine")) === 1 && (await page.inputValue("#win-from")) === "07:00");
const payErrors = await page.locator(".field--invalid").evaluateAll((els) => els.map((e) => e.id).join());
check("create: payment record is required before scheduling", payErrors === "f-pay-by,f-pay-date,f-pay-method,f-pay-ref", payErrors);
await page.fill("#pay-by", "Sales");
await page.fill("#pay-date", "2026-11-10");
await page.selectOption("#pay-method", { index: 1 });
await page.fill("#pay-ref", "INV-TEST-1");
await page.waitForTimeout(50);
check("create: payment date can't be in the future", (await page.locator(".field--invalid").evaluateAll((els) => els.map((e) => e.id).join())) === "f-pay-date");
await page.fill("#pay-date", "2026-11-03");
await page.waitForTimeout(100);
check("create: errors clear once fixed", (await count(".field--invalid")) === 0, String(await count(".field--invalid")));
const summaryText = await page.locator("#summary").innerText();
check("create: summary gives the slot, window, dates, airtime and the cost in US dollars", ["Featured Banner", "US$7 per minute", "Placeholder rate", "07:00–09:00 UTC", "120 min a day", "4 Nov 2026 – 10 Nov 2026", "7 days", "840 min", "US$5,880", "120 min × 7 days × US$7"].every((s) => summaryText.includes(s)), summaryText.replace(/\s+/g, " "));
check("create: schedules straight away", (await page.locator("#submit").innerText()) === "Schedule campaign");
await page.screenshot({ path: `${SHOTS}/6-create.png`, fullPage: true });
await page.click('button[type=submit]');
await page.waitForURL(/campaigns\.html/);
const newId = await page.locator("tr.is-new").getAttribute("data-campaign");
check("lifecycle: new campaign goes straight to Scheduled", (await page.locator("#group-scheduled tr.is-new").innerText()).includes("Prototype <Test> Brand"));
check("lifecycle: the list says when it starts", (await page.locator(".toast").innerText()).includes("scheduled to start on 4 Nov 2026"));
await page.click(`tr[data-campaign="${newId}"] a[data-view]`);
await page.waitForURL(/campaign\.html\?id=/);
check("lifecycle: its View page shows Scheduled", (await page.locator(".head .badge").innerText()) === "Scheduled");
check("security: name is escaped", (await count("test")) === 0 && (await page.locator("h1").innerText()) === "Prototype <Test> Brand");
const savedPayment = await page.locator("#payment").innerText();
check("lifecycle: payment record saved", ["Sales", "3 Nov 2026", "INV-TEST-1"].every((s) => savedPayment.includes(s)), savedPayment.replace(/\s+/g, " "));
check("create: there's no edit page to send it back to", (await count('a[href^="campaign-new.html?id="]')) === 0);

// Move the clock
await page.evaluate((days) => US.shiftNow(days), 1);
await page.goto(B + "admin/campaigns.html");
await page.waitForTimeout(50);
check("lifecycle: goes live on start date", (await page.locator("#group-live").innerText()).includes("Prototype <Test> Brand"));
await page.goto(B + `admin/report.html?id=${newId}`);
check("report: unavailable before the end", (await page.locator("#download").count()) === 0 && (await page.locator(".empty").innerText()).includes("when the campaign ends"));
await page.goto(B + "app/discover.html");
const inFeed = async (at) => { await page.evaluate((t) => US.setNow(t), at); return (await adNames()).includes("Prototype <Test> Brand"); };
check("lifecycle: shows in Discover during its window, in the Featured Banner slot", (await inFeed("2026-11-04T08:00")) && (await page.locator(".feed .ad--featured .ad__name").innerText()) === "Prototype <Test> Brand");
check("lifecycle: not in Discover outside its window, where Tallow & Thread has the slot", !(await inFeed("2026-11-04T10:00")) && (await page.locator(".feed .ad--featured .ad__name").innerText()) === "Tallow & Thread");
await page.evaluate(() => US.setNow("2026-11-04T08:00"));
const seenOver = async () => { await page.reload(); return (await adNames()).includes("Prototype <Test> Brand"); };

// Pause and resume
await page.goto(B + "admin/campaigns.html");
await page.click(`[data-pause="${newId}"]`);
const dialogText = await page.locator("dialog.modal").innerText();
check("pause: asks first and says plainly what happens", dialogText.includes("Paused days are added to the end date. There's no refund.") && dialogText.includes("stops showing in Discover"), dialogText.replace(/\s+/g, " "));
await page.screenshot({ path: `${SHOTS}/5d-pause-confirm.png` });
await page.keyboard.press("Escape");
check("pause: cancelling leaves it live", (await page.locator("dialog.modal").count()) === 0 && (await page.locator(`[data-pause="${newId}"]`).count()) === 1);
await page.click(`[data-pause="${newId}"]`);
await page.click("dialog.modal [data-confirm]");
check("pause: the row shows paused with resume and View", (await page.locator(`tr[data-campaign="${newId}"] .badge--paused`).count()) === 1 && (await page.locator(`[data-resume="${newId}"]`).count()) === 1 && (await page.locator(`tr[data-campaign="${newId}"] a[data-view]`).count()) === 1);
await page.goto(B + "app/discover.html");
check("pause: not in Discover while paused", !(await seenOver(3)));
check("pause: the review panel lists it as paused", (await page.locator("#review-paused").innerText()).includes("Prototype <Test> Brand"));
await page.evaluate((days) => US.shiftNow(days), 2);
await page.goto(B + `admin/campaign.html?id=${newId}`);
check("pause: still paused, not ended, after the original dates move on", (await page.locator(".head .badge").innerText()) === "Paused");
check("pause: the View page says since when", (await page.locator("#pauses").innerText()).includes("Not showing in Discover since 4 Nov 2026"));
await page.click(`.head [data-resume="${newId}"]`);
check("resume: the dialog gives the new last day", (await page.locator("dialog.modal").innerText()).includes("12 Nov 2026"));
await page.click("dialog.modal [data-confirm]");
const pausesText = await page.locator("#pauses").innerText();
check("resume: live again with the paused days added to the end", (await page.locator(".head .badge").innerText()) === "Live" && pausesText.includes("2 days added to the end date") && pausesText.includes("10 Nov 2026 to 12 Nov 2026"), pausesText.replace(/\s+/g, " "));
check("resume: the pause log has from and to", (await page.locator("#pauses tbody tr").count()) === 1 && /4 Nov 2026/.test(await page.locator("#pauses tbody td").nth(0).innerText()) && /6 Nov 2026/.test(await page.locator("#pauses tbody td").nth(1).innerText()));
check("resume: the dates on the View page include the paused days", (await page.locator("#details").innerText()).includes("4 Nov 2026 – 12 Nov 2026") && (await page.locator("#details").innerText()).includes("2 paused days added"));
await page.screenshot({ path: `${SHOTS}/5e-campaign-live.png`, fullPage: true });
await page.goto(B + "app/discover.html");
check("resume: back in Discover", await seenOver(3));
await page.evaluate((days) => US.shiftNow(days), 6);
await page.goto(B + "admin/campaigns.html");
check("lifecycle: still live after its original last day, because of the pause", (await page.locator("#group-live").innerText()).includes("Prototype <Test> Brand"));
await page.evaluate((days) => US.shiftNow(days), 1);
await page.waitForTimeout(50);
check("lifecycle: ended after the package plus the paused days", (await page.locator("#group-ended").innerText()).includes("Prototype <Test> Brand"));

// Report: the admin panel's own UI, plus the brand-facing PDF
await page.goto(B + `admin/report.html?id=${newId}`);
await page.screenshot({ path: `${SHOTS}/7-report.png`, fullPage: true });
check("report: no white document card on the page", (await count(".sheet")) === 0 && (await page.evaluate(() => [...document.querySelectorAll(".main *")].filter((e) => getComputedStyle(e).backgroundColor === "rgb(255, 255, 255)" && e.offsetWidth > 100).length)) === 0);
check("report: uses the panel's stat tiles, cards and tables", (await count("#report-stats .tile")) === 6 && (await count(".main .panel")) === 5 && (await count(".main .panel table")) === 3 && (await page.locator(".panel").first().evaluate((e) => getComputedStyle(e).borderRadius)) === "14px");
const tileValue = async (label) => (await page.locator(`#report-stats .tile:has(.tile__label:text-is("${label}")) .tile__value`).innerText());
const reportImpressions = Number((await tileValue("Impressions")).replace(/,/g, ""));
check("report: airtime delivered matches the booked airtime after the pause was made good", (await tileValue("Airtime delivered")) === "840 min" && /Total delivered, one rate all day\s+840 min/.test(await page.locator("#report-airtime").innerText()) && /Booked\s+840 min/.test(await page.locator("#report-airtime").innerText()), await page.locator("#report-airtime").innerText());
const expectedCpm = "US$" + (5880 / reportImpressions * 1000).toFixed(2);
check("report: CPM is cost ÷ impressions × 1,000", (await tileValue("Cost per 1,000 impressions")) === expectedCpm && (await page.locator("#report-cpm").innerText()).includes(`US$5,880 ÷ ${reportImpressions.toLocaleString("en-AU")} impressions × 1,000 = ${expectedCpm}`), `${await tileValue("Cost per 1,000 impressions")} vs ${expectedCpm}`);
check("report: dates and statuses use the panel's badges", (await count("#report-dates .badge--live")) === 2 && (await count("#report-dates .badge--paused")) === 1);
const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#download")]);
const pdfPath = `${SHOTS}/report.pdf`;
await dl.saveAs(pdfPath);
const pdf = await readFile(pdfPath);
// PDF strings escape brackets as \( and \), so drop the backslashes before matching text.
const pdfText = pdf.toString("latin1").replace(/\\([()\\])/g, "$1");
check("report: PDF downloads", pdf.subarray(0, 4).toString() === "%PDF", `${dl.suggestedFilename()} ${pdf.length} bytes`);
check("report: PDF has the sections and the ad", ["Unique reach", "Dates the ad ran", "Impressions by country", "Country A", "The ad live in the app"].every((s) => pdfText.includes(s)) && /\/Subtype \/Image/.test(pdfText) && /\/Count 2/.test(pdfText));
check("report: PDF has the airtime delivered and the CPM", ["Airtime delivered", "Cost per 1,000 impressions (CPM)", "840 min", expectedCpm, "Total delivered, one rate all day"].every((s) => pdfText.includes(s)), ["Airtime delivered", "Cost per 1,000 impressions (CPM)", "840 min", expectedCpm].filter((s) => !pdfText.includes(s)).join(", "));
check("report: PDF has the slot, window and cost in US dollars, with no day packages", ["Featured Banner", "07:00-09:00 UTC", "US$5,880 (120 min x 7 days x US$7)", "placeholder rates in US dollars"].every((s) => pdfText.includes(s)) && !OLD_NAMES.test(pdfText) && !/A\$|Package|- (7|14|30) days/.test(pdfText));
const text = await page.locator("main").innerText();
check("report: has all fields", ["Campaign period", "Slot", "Daily window", "Rate", "Cost", "Impressions", "Unique reach", "Clicks", "Click-through rate", "Airtime delivered", "Cost per 1,000 impressions", "Featured Banner", "07:00–09:00 UTC", "US$7 per minute", "US$5,880"].every((f) => text.includes(f)) && !/A\$|package/i.test(text));
const runs = await page.locator("#report-dates tbody tr").allInnerTexts();
check("report: dates the ad ran, with the pause and the extended end", runs.length === 3 && /Paused/.test(runs[1]) && /4 Nov 2026 – 6 Nov 2026/.test(runs[1]) && /12 Nov 2026/.test(runs[2]) && (await page.locator("#report-dates").innerText()).includes("2 paused days were added"), runs.join(" | "));
check("report: campaign period runs to the extended end", text.includes("4 Nov 2026 – 12 Nov 2026"));
const countryRows = await page.locator("#report-countries tbody tr").evaluateAll((rs) => rs.map((r) => [r.cells[0].textContent, Number(r.cells[1].textContent.replace(/,/g, ""))]));
const totalImpressions = Number((await page.locator("#report-stats .tile__value").first().innerText()).replace(/,/g, ""));
check("report: impressions by placeholder country add up to the total", countryRows.length >= 4 && countryRows[0][0] === "Country A" && countryRows.reduce((s, r) => s + r[1], 0) === totalImpressions && (await page.locator("#report-countries").innerText()).includes("Placeholder"), countryRows.map((r) => r.join(" ")).join(", "));
check("report: unique reach is below impressions", Number((await page.locator("#report-stats .tile__value").nth(1).innerText()).replace(/,/g, "")) < totalImpressions);
check("report: shows the ad in the feed, labelled as a mock", (await count("#report-shot .ad .sponsored")) === 1 && (await page.locator("#report-shot figcaption").innerText()).startsWith("Mock"));
check("report: links back to the campaign", (await count(`.head a[href="campaign.html?id=${newId}"]`)) === 1);
await page.goto(B + "admin/report.html?id=c7");
check("report: a seeded campaign shows its two-day pause", (await page.locator("#report-dates tbody tr").count()) === 3 && (await page.locator("#report-summary").innerText()).includes("Paused days added"));
const billboardAir = await page.locator("#report-airtime tbody").innerText();
check("report: a Billboard's airtime is split into outside and inside prime time", /Outside prime time\s+3,360 min/.test(billboardAir) && /In prime time\s+0 min/.test(billboardAir) && /Total delivered\s+3,360 min/.test(billboardAir), billboardAir);
await page.screenshot({ path: `${SHOTS}/7b-report-seeded.png`, fullPage: true });
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
await p2.screenshot({ path: `${SHOTS}/8b-phone-enquiry.png`, fullPage: true });
await p2.goto(B + "admin/campaigns.html");
check("phone: campaigns has no sideways scroll", !(await overflow(p2)));
check("phone: every campaign card has a visible View button", (await p2.locator("tbody tr a[data-view]:visible").count()) === SEED_IDS.length);
await p2.screenshot({ path: `${SHOTS}/8c-phone-campaigns.png`, fullPage: true });
await p2.goto(B + "admin/campaign-new.html");
check("phone: create campaign has no sideways scroll", !(await overflow(p2)));
check("phone: payment fields won't trigger iPhone zoom", (await p2.locator("#pay-ref").evaluate((e) => getComputedStyle(e).fontSize)) === "16px");
await p2.screenshot({ path: `${SHOTS}/8d-phone-create.png`, fullPage: true });
await p2.goto(B + "admin/campaign-new.html?state=overlap");
check("phone: the overlap error and the availability timeline fit with no sideways scroll", !(await overflow(p2)) && (await p2.locator("#window-fix").isVisible()) && (await p2.locator(".tl").evaluate((e) => e.getBoundingClientRect().right <= innerWidth - 16)));
check("phone: window times won't trigger iPhone zoom", (await p2.locator("#win-from").evaluate((e) => getComputedStyle(e).fontSize)) === "16px");
await p2.locator("#schedule").screenshot({ path: `${SHOTS}/8d-phone-create-overlap.png` });
await p2.setViewportSize({ width: 320, height: 640 });
check("phone: the timeline still fits at 320 wide", !(await overflow(p2)));
await p2.setViewportSize({ width: 390, height: 844 });
await p2.goto(B + "admin/campaign.html?id=c7");
check("phone: View page has no sideways scroll", !(await overflow(p2)));
check("phone: View page shows the payment record", await p2.locator("#payment").isVisible());
await p2.screenshot({ path: `${SHOTS}/8e-phone-view.png`, fullPage: true });
await p2.goto(B + "admin/campaign.html?id=c1");
await p2.click(".head [data-pause]");
check("phone: pause dialog fits the screen", await p2.locator("dialog.modal").evaluate((d) => d.getBoundingClientRect().width <= innerWidth - 16));
await p2.screenshot({ path: `${SHOTS}/8f-phone-pause.png` });
await p2.keyboard.press("Escape");
await p2.goto(B + "admin/report.html?id=c7");
check("phone: report has no sideways scroll", !(await overflow(p2)));
check("phone: report tables fit their cards", await p2.locator(".data-table").evaluateAll((els) => els.every((e) => e.scrollWidth <= e.clientWidth + 1)));
await p2.screenshot({ path: `${SHOTS}/8g-phone-report.png`, fullPage: true });
await p2.goto(B + "index.html");
check("phone: overview has no sideways scroll", !(await overflow(p2)));
await p2.screenshot({ path: `${SHOTS}/9-phone-overview.png`, fullPage: true });
const barHeight = await p2.locator(".proto-bar").evaluate((e) => e.offsetHeight);
check("phone: prototype bar stays short", barHeight <= 52, barHeight + "px");
await p2.selectOption(".proto-bar__select", { label: "4. Campaigns" });
await p2.waitForURL(/campaigns\.html/);
check("phone: every screen is reachable from the bar", (await p2.locator(".group").count()) === 3);
check("phone: campaign metrics are visible without scrolling sideways", await p2.locator(".table-wrap").first().evaluate((e) => e.scrollWidth <= e.clientWidth));
check("phone: live campaigns show their numbers", await p2.locator('#group-live td[data-label="Impressions"]').first().isVisible());
check("phone: scheduled campaigns don't show empty numbers", (await p2.locator("#group-scheduled td.cell-empty:visible").count()) === 0);
check("phone: pause is reachable on a live campaign", await p2.locator("#group-live [data-pause]").first().isVisible());
await p2.click(".proto-bar__toggle");
check("phone: demo time opens", await p2.locator("#demo-now").isVisible());
check("phone: reset is reachable", await p2.locator(".proto-bar [data-reset]").isVisible());
await p2.click(".proto-bar__toggle");
await p2.waitForTimeout(100);
const closedHeight = await p2.locator(".proto-bar").evaluate((e) => e.offsetHeight);
check("phone: bar shrinks again after closing demo time", closedHeight <= 52, closedHeight + "px");
await p2.goto(B + "web/advertise.html");
check("phone: fields won't trigger iPhone zoom", (await p2.locator("#company").evaluate((e) => getComputedStyle(e).fontSize)) === "16px");
check("phone: the form starts on the first screen", (await p2.locator("#form").evaluate((f) => f.getBoundingClientRect().top)) < 844, String(await p2.locator("#form").evaluate((f) => Math.round(f.getBoundingClientRect().top))));
const phoneLayout = await p2.evaluate(() => {
  const r = (s) => document.querySelector(s).getBoundingClientRect();
  return { introFirst: r(".lede").bottom <= r("#chips").top, besideDrawing: r("#feed-sketch").right <= r("#chips").left, formAfter: r("#caption").bottom <= r("#form").top, fits: r("#feed-sketch").left >= 16 && r("#chips").right <= innerWidth - 16 };
});
check("phone: intro, then the drawing beside the chips, then the form", Object.values(phoneLayout).every(Boolean), JSON.stringify(phoneLayout));
for (const k of ["featured", "billboard-prime"]) {
  await p2.tap(`#chips [data-pkg="${k}"]`);
  check(`phone: tapping ${k === "featured" ? "Featured Banner" : "Billboard Prime Time"} picks it in the form`, (await p2.locator("#type").inputValue()) === (k === "featured" ? "Featured Banner" : "Billboard Prime Time"));
  await p2.waitForTimeout(300);
  await p2.evaluate(() => scrollTo(0, 0));
  await p2.screenshot({ path: `${SHOTS}/8b-phone-enquiry-${k}.png`, fullPage: true });
}
check("phone: enquiry still has no sideways scroll after choosing packages", !(await overflow(p2)));
await p2.setViewportSize({ width: 320, height: 640 });
await p2.waitForTimeout(100);
check("phone: enquiry has no sideways scroll at 320 wide", !(await overflow(p2)) && (await p2.locator("#feed-sketch").evaluate((e) => e.getBoundingClientRect().right <= innerWidth)));
await p2.screenshot({ path: `${SHOTS}/8b-phone-enquiry-320.png`, fullPage: true });
await p2.setViewportSize({ width: 390, height: 844 });

// Reduced motion: the chips and the drawing's slots don't fade
const calm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const p4 = await calm.newPage();
p4.on("pageerror", (e) => errors.push("reduced motion: " + e.message));
await p4.goto(B + "web/advertise.html");
check("reduced motion: no transitions on the chips or the drawing", await p4.evaluate(() => [".pchip", ".sp__slot"].every((s) => getComputedStyle(document.querySelector(s)).transitionDuration.split(",").every((d) => parseFloat(d) === 0))));
await calm.close();
await p2.goto(B + "questions.html");
check("phone: questions fit without sideways scroll", !(await overflow(p2)));
await p2.screenshot({ path: `${SHOTS}/billboard-phone-questions.png` });
await p2.goto(B + "app/watch.html?id=v1");
await p2.screenshot({ path: `${SHOTS}/10-phone-watch.png` });
await p2.setViewportSize({ width: 320, height: 640 });
check("phone: video actions scroll sideways inside their row, as in the app", await p2.locator(".actions-row").evaluate((e) => getComputedStyle(e).overflowX === "auto") && !(await overflow(p2)));
await p2.setViewportSize({ width: 390, height: 844 });
check("phone: watch has no sideways scroll", !(await overflow(p2)));
check("phone: the last video action can be scrolled to", await p2.locator(".actions-row").evaluate((e) => { e.scrollLeft = e.scrollWidth; const last = e.lastElementChild.getBoundingClientRect(); return last.right <= e.getBoundingClientRect().right + 1; }));
await desk.close(); await phone.close();

// Opened straight from disk, no server
const fileCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const p3 = await fileCtx.newPage();
const fileErrors = [];
p3.on("pageerror", (e) => fileErrors.push(e.message));
await p3.goto("file:///" + ROOT + "/index.html");
await p3.locator('a[href="app/index.html"]').first().click();
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
await p3.fill("#end", "2026-11-05");
await p3.selectOption("#win-from", "18:00");
await p3.selectOption("#win-to", "20:00");
await p3.fill("#pay-by", "Finance");
await p3.fill("#pay-date", "2026-11-02");
await p3.selectOption("#pay-method", { index: 2 });
await p3.fill("#pay-ref", "DISK-1");
await p3.click('button[type=submit]');
await p3.waitForURL(/campaigns\.html/);
check("file://: created campaign is scheduled and saves across pages", (await p3.locator("#group-scheduled").innerText()).includes("Disk Test Brand"));
await p3.click("tr.is-new a[data-view]");
await p3.waitForURL(/campaign\.html\?id=/);
check("file://: View shows its payment record", (await p3.locator("h1").innerText()) === "Disk Test Brand" && (await p3.locator("#payment").innerText()).includes("DISK-1"));
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
await p3.goto("file:///" + ROOT + "/prototypes/billboard/index.html");
await p3.click('a[href="web/advertise.html"]');
await p3.click('#chips [data-pkg="standard"]');
check("file://: the enquiry page opens from the overview, draws the feed and follows the chips", (await p3.locator("#feed-sketch .sp__screen").count()) === 1 && (await p3.inputValue("#type")) === "Standard Banner" && (await p3.locator(".proto-bar").count()) === 1);
check("file://: the enquiry page loads with no errors", fileErrors.length === 0, fileErrors.join(" | "));
await fileCtx.close();

// Source: no day packages or rotation left, and money is in US dollars
const sources = await Promise.all(["js/data.js", "js/store.js", "js/campaign-new.js", "js/discover.js", "admin/campaigns.html", "admin/campaign.html", "admin/report.html", "index.html"].map((f) => readFile(join(ROOT, "prototypes/billboard", f), "utf8").then((s) => [f, s])));
const stale = sources.filter(([, s]) => /DURATIONS|US\.PRICES|packageName|feedLoads|A\$|rotate per feed load/.test(s)).map(([f]) => f);
check("source: no day packages, rotation or A$ left", stale.length === 0, stale.join(", "));

check("no console or page errors", errors.length === 0, errors.slice(0, 5).join(" | "));
await browser.close();
server.close();
finish();
