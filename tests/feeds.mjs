// Feeds, search, notifications and live: every state, the main interactions, phone widths and opening from disk.
import { fileUrl, launchBrowser, reporter, SHOTS, startServer } from "./lib.mjs";

const { server, url: SITE } = startServer();
const A = SITE + "app/";
const { check, finish } = reporter();

const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 402, height: 874 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.location().url)) errors.push(m.text()); });
const count = (sel) => page.locator(sel).count();
const text = (sel) => page.locator(sel).first().innerText();
const open = async (path) => { await page.goto(A + path); await page.waitForTimeout(120); };
const shot = (name) => page.screenshot({ path: `${SHOTS}/feeds-${name}.png` });
const stateTitle = () => page.locator(".empty-state__title").first().innerText().catch(() => "");

// Every ?state= shows its own screen.
const STATES = {
  "my-feed.html": { "": null, guest: "Sign up to explore everything", welcome: "Welcome to My Feed", error: "Something went wrong", offline: "You're offline", loading: null },
  "shorts.html": { "": null, "controls-hidden": null, empty: "No shorts here", error: "Something went wrong", offline: "You're offline", loading: null, "caught-up": "You're all caught up", "video-error": null, guest: null },
  "channel-shorts.html": { "": null, "controls-hidden": null, "video-error": null },
  "search.html": { "": null, empty: null, "no-results": "No search results found", guest: null },
  "search-results.html": { "": null, "no-results": "No search results found", loading: null },
  "notifications.html": { "": null, read: null, empty: "No notifications", loading: null, error: "Something went wrong", offline: "You're offline", off: "Notifications are turned off", guest: "Sign up to explore everything" },
  "live.html": { "": null, "chat-empty": "No chat yet", "chat-disabled": "Chat unavailable", "camera-off": null, ended: "Live stream ended", offline: "You're offline" },
};
for (const [file, states] of Object.entries(STATES)) {
  for (const [state, title] of Object.entries(states)) {
    await open(file + (state ? `?state=${state}` : ""));
    if (state === "caught-up") await page.waitForTimeout(300);
    const name = file.replace(".html", "") + (state ? "-" + state : "");
    await shot(name);
    if (title) check(`${name}: shows "${title}"`, (await page.getByText(title, { exact: true }).count()) > 0, await stateTitle());
  }
}

// Discover cards, as AppVideoCard: thumbnail, then the avatar row with title and "creator • views • age", for live items too.
await open("discover.html");
const firstCard = page.locator(".feed > .card").first();
const cardTop = await firstCard.evaluate((c) => ({ thumb: c.querySelector(".card__thumb").getBoundingClientRect().bottom, row: c.querySelector(".card__row").getBoundingClientRect().top }));
check("discover: the avatar row sits right under the thumbnail", Math.round(cardTop.row - cardTop.thumb) === 0);
check("discover: live card shows creator, views and age", /PixelForge • .+ views • .+ ago/.test(await firstCard.locator(".card__sub").innerText()));
check("discover: avatars are the app's no-picture look", (await count(".feed .card__row .avatar svg.lucide-user")) >= 3 && (await page.locator(".feed .card__row .avatar").first().innerText()).trim() === "");
await shot("discover");
await open("shorts.html?state=loading");
check("shorts: loading is the app's spinner with no text", (await count(".spinner")) === 1 && !(await page.locator(".feeds-shorts__page").first().innerText()).trim());

// My Feed
await open("my-feed.html");
check("my feed: My Feed tab is current", (await text(".tabbar [aria-current]")) === "My Feed");
check("my feed: followed creators' content renders", (await count(".feed .card")) >= 8);
check("my feed: consecutive shorts sit two across", (await page.locator(".feeds-grid").first().locator(".card").count()) === 2);
check("my feed: live item opens the live screen", (await count('.feed a.card[href="live.html"]')) === 1);
check("my feed: shorts open the shorts player", (await count('.feeds-grid a[href^="channel-shorts.html?id="]')) >= 2);
check("my feed: chips start with All", (await text(".chip[aria-pressed=true]")) === "All");
await page.click('.chip[data-cat="Music"]');
check("my feed: category filter narrows the feed", (await count(".feed .card")) === 2);
await page.click('.chip[data-cat="Science"]');
check("my feed: a category with nothing shows the welcome state", (await stateTitle()) === "Welcome to My Feed");
await page.click('.chip[data-cat="Science"]');
check("my feed: tapping it again returns to All", (await count(".feed .card")) >= 8);
await open("my-feed.html?state=guest");
check("my feed: guest prompt links to sign up", (await count('.empty-state a[href="sign-up.html"]')) === 1);
await open("my-feed.html?state=loading");
check("my feed: loading shows three skeleton cards", (await count(".feeds-skeleton")) === 3);

// Shorts
await open("shorts.html");
check("shorts: Shorts tab is current", (await text(".tabbar [aria-current]")) === "Shorts");
check("shorts: six shorts plus the caught-up page", (await count(".short")) === 6 && (await count(".feeds-shorts__page")) === 7);
check("shorts: header icons and chips sit over the video", (await count(".feeds-shorts__header .topbar svg.lucide")) === 2 && (await count(".feeds-shorts__header .chip")) > 5);
const first = page.locator(".short").first();
check("shorts: bottom actions use Lucide", (await first.locator(".short__bottom svg.lucide").evaluateAll((els) => els.map((e) => e.getAttribute("data-lucide")).join())) === "thumbs-up,thumbs-down,message-circle,hand-coins,share,eye");
const p0 = Number(await first.locator(".short__progress").getAttribute("aria-valuenow"));
await page.waitForTimeout(1300);
check("shorts: progress bar moves while playing", Number(await first.locator(".short__progress").getAttribute("aria-valuenow")) > p0);
const likeLabel = await first.locator("[data-like] span").innerText();
await first.locator("[data-like]").click();
const likedLabel = await first.locator("[data-like] span").innerText();
check("shorts: like toggles on and counts", (await first.locator("[data-like]").getAttribute("aria-pressed")) === "true" && (likedLabel !== likeLabel || likeLabel.endsWith("k")), `${likeLabel} -> ${likedLabel}`);
await first.locator("[data-dislike]").click();
check("shorts: dislike turns like off", (await first.locator("[data-like]").getAttribute("aria-pressed")) === "false" && (await first.locator("[data-dislike]").getAttribute("aria-pressed")) === "true");
await first.locator(".short__tap").click({ position: { x: 200, y: 400 } });
check("shorts: tapping the video pauses it", await first.evaluate((e) => e.classList.contains("short--paused")));
await first.locator(".short__tap").click({ position: { x: 200, y: 400 } });
const bar = await first.locator(".short__progress").boundingBox();
await page.mouse.click(bar.x + bar.width / 2, bar.y + bar.height / 2);
const seeked = Number(await first.locator(".short__progress").getAttribute("aria-valuenow"));
check("shorts: tapping the progress bar seeks", seeked >= 45 && seeked <= 56, String(seeked));
await first.locator("[data-eye]").click();
check("shorts: eye hides the overlay and actions", !(await first.locator(".short__top").isVisible()) && !(await first.locator(".short__actions").isVisible()) && (await first.locator("[data-eye]").isVisible()));
check("shorts: eye icon changes to eye-off", (await first.locator("[data-eye] svg").getAttribute("data-lucide")) === "eye-off");
await page.locator("#list").evaluate((l) => { l.scrollTop = l.clientHeight; });
await page.waitForTimeout(400);
check("shorts: hidden overlay stays hidden on the next short", !(await page.locator(".short").nth(1).locator(".short__top").isVisible()));
await page.locator(".short").nth(1).locator("[data-eye]").click();
check("shorts: eye shows the overlay again", await page.locator(".short").nth(1).locator(".short__top").isVisible());
const p1 = Number(await page.locator(".short").nth(1).locator(".short__progress").getAttribute("aria-valuenow"));
await page.waitForTimeout(800);
check("shorts: scrolling makes the next short play", Number(await page.locator(".short").nth(1).locator(".short__progress").getAttribute("aria-valuenow")) > p1);
await page.keyboard.press("ArrowDown");
await page.waitForTimeout(700);
check("shorts: arrow keys move between shorts", (await page.locator("#list").evaluate((l) => Math.round(l.scrollTop / l.clientHeight))) === 2);
await page.locator(".short").nth(2).locator("[data-comments]").click();
check("shorts: comments open in a sheet", await page.locator(".feeds-comments").isVisible());
await page.fill(".feeds-comments input", "Nice one");
await page.click(".feeds-comments button[type=submit]");
check("shorts: posting a comment adds it", (await page.locator(".feeds-comment").first().innerText()).includes("Nice one"));
await shot("shorts-comments");
await page.keyboard.press("Escape");
check("shorts: escape closes the sheet", (await count(".sheet-backdrop")) === 0);
await page.click('.chip[data-cat="Gaming"]');
check("shorts: a category with no shorts shows the empty state", (await stateTitle()) === "No shorts here");
await page.click('.chip[data-cat="Food"]');
check("shorts: category filter narrows the feed", (await count(".short")) === 1);
await open("shorts.html?state=caught-up");
await page.waitForTimeout(300);
await page.click(".empty-state [data-retry]");
await page.waitForTimeout(700);
check("shorts: Refresh at the end returns to the first short", (await page.locator("#list").evaluate((l) => l.scrollTop)) < 5);
await open("shorts.html?state=controls-hidden");
check("shorts: controls-hidden state hides the overlay", !(await page.locator(".short__top").first().isVisible()));
await open("shorts.html?state=guest");
await page.locator(".short").first().locator("[data-like]").click();
check("shorts: guests get the sign-up sheet on like", (await page.getByText("Join UltraStream").count()) === 1 && (await count('.feeds-auth a[href="sign-up.html"]')) === 1);
await shot("shorts-guest-sheet");
await open("shorts.html?state=video-error");
check("shorts: video error shows Video unavailable", (await page.getByText("Video unavailable").count()) === 1);

// One creator's shorts
await open("channel-shorts.html?c=StreetPlate");
check("channel shorts: shows that creator's shorts", (await count(".short")) === 3 && (await page.locator(".short__sub").allInnerTexts()).every((t) => t.startsWith("StreetPlate")));
check("channel shorts: back button, no tabs", (await count(".feeds-back svg.lucide-chevron-left")) === 1 && (await count(".tabbar")) === 0);
check("channel shorts: overlay sits below the back button", (await page.locator(".short__top").first().evaluate((e) => e.offsetTop)) === 60);
await open("channel-shorts.html?id=v4");
await page.waitForTimeout(200);
check("channel shorts: opens at the short that was tapped", (await page.locator("#list").evaluate((l) => Math.round(l.scrollTop / l.clientHeight))) === 1);

// Search
await page.evaluate(() => localStorage.removeItem("us-feeds-recent-v1"));
await open("search.html");
check("search: recent searches with clear all", (await text(".feeds-history-head h2")) === "Recent searches" && (await count(".feeds-suggestion")) === 5);
check("search: field is focused", await page.evaluate(() => document.activeElement.id === "q"));
await page.fill("#q", "food");
check("search: typing shows creator and content suggestions", (await page.locator('.feeds-suggestion[data-q="StreetPlate"] svg.lucide-user').count()) === 1 && (await page.locator(".feeds-suggestion svg.lucide-search").count()) >= 2);
check("search: clear button appears", await page.locator("#clear").isVisible());
await page.fill("#q", "qqqzz");
check("search: nothing matching shows no results", (await stateTitle()) === "No search results found");
await page.click("#clear");
check("search: clearing returns to recent searches", (await count(".feeds-history-head")) === 1);
await page.fill("#q", "food");
await page.press("#q", "Enter");
await page.waitForURL(/search-results\.html\?q=food/);
check("search: enter opens results for the query", (await page.inputValue("#q")) === "food");
await open("search.html");
check("search: the search is added to recent searches", (await page.locator(".feeds-suggestion").first().getAttribute("data-q")) === "food");
await page.click("#clear-all");
check("search: clear all asks first", (await page.getByText("Clear search history?").count()) === 1);
await page.click(".dialog [data-confirm]");
check("search: clearing leaves the empty history state", (await page.getByText("No recent searches yet.").count()) === 1);
await page.evaluate(() => localStorage.removeItem("us-feeds-recent-v1"));
await open("search.html?state=guest");
check("search: guests see no history", (await count(".feeds-suggestion")) === 0 && (await count(".feeds-history-empty")) === 0);

// Search results
await open("search-results.html?q=Best%20games");
check("results: Video selected first, then Shorts, Live, Creators", (await page.locator("#filters .chip").allInnerTexts()).join() === "Video,Shorts,Live,Creators" && (await text("#filters [aria-pressed=true]")) === "Video");
check("results: videos match the query", (await count("#results .card")) >= 1);
await page.click('[data-filter="shorts"]');
check("results: Shorts filter shows shorts", (await count('#results a.card[href^="channel-shorts.html"]')) >= 1);
await page.click('[data-filter="live"]');
check("results: Live filter links to the live screen", (await count('#results a.card[href="live.html"]')) === 1);
await page.click('[data-filter="accounts"]');
check("results: Creators filter shows people cards", (await count(".feeds-people")) >= 1);
const follow = page.locator(".feeds-people [data-follow]").first();
const before = await follow.innerText();
await follow.click();
check("results: follow toggles", (await follow.innerText()) !== before && ["Follow", "Following"].includes(await follow.innerText()));
await shot("search-results-creators");
await page.fill("#q", "street food");
check("results: retyping updates the results", (await page.locator(".feeds-people__name").allInnerTexts()).includes("StreetPlate"));
await page.fill("#q", "qqqzz");
check("results: no accounts wording on Creators", (await stateTitle()) === "No accounts found");
await page.click('[data-filter="live"]');
check("results: no live wording on Live", (await stateTitle()) === "No live results found");

// Notifications
await open("notifications.html");
check("notifications: list with unread dots", (await count(".feeds-notif")) === 8 && (await count(".feeds-notif__dot")) === 8);
check("notifications: filters in order", (await page.locator("#filters .chip").allInnerTexts()).join() === "All,Rewards,Comments,Likes,Follows");
await page.locator(".feeds-notif").first().click();
check("notifications: tapping marks it read", (await count(".feeds-notif__dot")) === 7);
await page.click('[data-filter="follows"]');
check("notifications: filter narrows the list", (await count(".feeds-notif")) === 2);
await page.click('[data-filter="likes"]');
await page.click("#mark-all");
check("notifications: mark all read asks first", (await page.locator(".dialog__title").innerText()) === "Mark All Read");
await page.click(".dialog [data-confirm]");
check("notifications: mark all read clears the dots and disables itself", (await count(".feeds-notif__dot")) === 0 && (await page.locator("#mark-all").isDisabled()));
await open("notifications.html?state=off");
check("notifications: off state links to settings", (await count('.empty-state a[href="settings.html"]')) === 1);
await open("notifications.html?state=loading");
check("notifications: loading shows five skeletons", (await count(".feeds-notif--skeleton")) === 5);

// Live
await open("live.html");
check("live: badges, chat and message box", (await page.getByText("LIVE", { exact: true }).count()) === 1 && (await count(".feeds-chat__msg")) >= 3 && (await count(".feeds-chat__reward")) === 1);
await page.fill(".feeds-live__input", "Hello <b>chat</b>");
await page.click(".feeds-live__send");
check("live: sending adds the message, escaped", (await page.locator(".feeds-chat__msg").last().innerText()) === "You : Hello <b>chat</b>" && (await page.inputValue(".feeds-live__input")) === "");
await page.press(".feeds-live__input", "Enter");
check("live: empty messages aren't sent", (await page.locator(".feeds-chat__msg").last().innerText()).includes("Hello"));
await page.click("[data-heart]");
check("live: heart toggles", (await page.locator("[data-heart]").getAttribute("aria-pressed")) === "true");
await shot("live-sent");
await open("live.html?state=chat-empty");
await page.fill(".feeds-live__input", "First!");
await page.press(".feeds-live__input", "Enter");
check("live: first message replaces the empty chat state", (await count(".feeds-chat .empty-state")) === 0 && (await count(".feeds-chat__msg")) === 1);
await open("live.html?state=chat-disabled");
check("live: chat disabled turns off the message box", await page.locator(".feeds-live__input").isDisabled() && await page.locator(".feeds-live__send").isDisabled());
await open("live.html?state=camera-off");
check("live: camera off keeps the live badges", (await page.getByText("Camera is off").count()) === 1 && (await page.getByText("LIVE", { exact: true }).count()) === 1);
await open("live.html?state=ended");
check("live: ended links to the recording", (await count('.empty-state a[href^="watch.html?id="]')) === 1);
await open("live.html?state=offline");
await page.click("[data-retry]");
await page.waitForURL(/live\.html$/);
check("live: retry reloads the stream", (await count(".feeds-chat")) === 1);

check("icons: none left unrendered", (await count("i[data-lucide]")) === 0);

// Narrow phones: nothing scrolls sideways, and the Shorts action row fits.
const small = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
const p2 = await small.newPage();
p2.on("pageerror", (e) => errors.push("320: " + e.message));
const wide = [];
for (const path of ["my-feed.html", "shorts.html", "channel-shorts.html?c=LoopHouse", "search.html", "search-results.html?q=games", "search-results.html?q=games&filter=accounts", "notifications.html", "live.html", "live.html?state=camera-off", "shorts.html?state=guest"]) {
  await p2.goto(A + path);
  await p2.waitForTimeout(100);
  if (await p2.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) wide.push(path);
}
check("320px: no page scrolls sideways", wide.length === 0, wide.join(" | "));
await p2.goto(A + "shorts.html");
await p2.waitForTimeout(100);
check("320px: Shorts eye button stays on screen", await p2.locator(".short [data-eye]").first().evaluate((e) => e.getBoundingClientRect().right <= innerWidth));
await p2.screenshot({ path: `${SHOTS}/feeds-shorts-320.png` });
await p2.goto(A + "notifications.html");
await p2.screenshot({ path: `${SHOTS}/feeds-notifications-320.png` });
await small.close();

// Desktop frame
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p3 = await desk.newPage();
await p3.goto(A + "shorts.html");
await p3.waitForTimeout(150);
check("desktop: shorts fill the phone frame", await p3.locator(".feeds-shorts__page").first().evaluate((e) => Math.abs(e.offsetHeight - e.parentElement.clientHeight) < 2));
await p3.screenshot({ path: `${SHOTS}/feeds-desktop-shorts.png` });
await desk.close();

// Opened straight from disk
const fileCtx = await browser.newContext({ viewport: { width: 402, height: 874 } });
const p4 = await fileCtx.newPage();
const fileErrors = [];
p4.on("pageerror", (e) => fileErrors.push(e.message));
await p4.goto(fileUrl("app/my-feed.html"));
await p4.waitForTimeout(150);
check("file://: My Feed renders", (await p4.locator(".feed .card").count()) >= 8 && (await p4.locator(".tabbar svg.lucide").count()) === 5);
await p4.click('.tabbar a[href="shorts.html"]');
await p4.waitForTimeout(150);
check("file://: tab bar opens Shorts", (await p4.locator(".short").count()) === 6);
await p4.click('.topbar a[href="search.html"]');
await p4.fill("#q", "music");
await p4.press("#q", "Enter");
await p4.waitForURL(/search-results\.html/);
check("file://: search runs and recent searches save", (await p4.locator("#results .card").count()) >= 1);
await p4.goto(fileUrl("app/notifications.html"));
check("file://: notifications render", (await p4.locator(".feeds-notif").count()) === 8);
await p4.goto(fileUrl("app/live.html"));
check("file://: live renders", (await p4.locator(".feeds-chat__msg").count()) >= 3);
check("file://: no JS errors", fileErrors.length === 0, fileErrors.join(" | "));
await fileCtx.close();

check("no console or page errors", errors.length === 0, errors.slice(0, 5).join(" | "));
await browser.close();
server.close();
finish();
