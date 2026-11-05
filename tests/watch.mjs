// Video page and creator channels: every state, the sheets, comments, rewards, follow, and the lists.
import { launchBrowser, reporter, SHOTS, startServer } from "./lib.mjs";

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
const go = async (path) => { await page.goto(A + path); await page.waitForTimeout(350); };
const shot = async (name) => { await page.waitForTimeout(320); return page.screenshot({ path: `${SHOTS}/watch-${name}.png` }); };
const icons = (sel) => page.locator(`${sel} svg.lucide`).evaluateAll((els) => els.map((e) => e.getAttribute("data-lucide")).join());

// ---------- Video page ----------
await go("watch.html?id=v2");
check("watch: title and back button", (await page.title()).startsWith("Watch") && (await count(".player__back svg.lucide-chevron-left")) === 1);
check("watch: actions in order, like, dislike, comments, Reward, share", (await icons(".actions-row")) === "thumbs-up,thumbs-down,message-circle,hand-coins,share", await icons(".actions-row"));
check("watch: no Billboard note", (await count(".note")) === 0);
check("watch: creator shows followers and links to the channel", (await text("#handle")) === "61K followers" && (await page.locator("#owner-link").getAttribute("href")) === "channel.html?c=LoopHouse");
check("watch: related videos listed under their heading", (await text(".section-title")) === "Related Videos" && (await count("#related .card")) === 6);
check("watch: description cut at 20 words with See more...", (await text("#see-more")) === "See more...");
await shot("video");

await page.click("#like");
check("watch: like turns on and adds one", (await page.getAttribute("#like", "aria-pressed")) === "true" && (await page.locator("#like").evaluate((e) => e.classList.contains("pill-btn--on"))));
await page.click("#dislike");
check("watch: dislike turns like off", (await page.getAttribute("#like", "aria-pressed")) === "false" && (await page.getAttribute("#dislike", "aria-pressed")) === "true");

await page.click("#see-more");
check("watch: See more opens the full description", (await count('.panel[aria-label="Description"]')) === 1);
await shot("description");
await page.keyboard.press("Escape");
check("watch: Esc closes the description", (await count(".panel")) === 0);

// Follow and the notification bell
await page.click("#follow");
check("watch: Follow becomes Following with the bell on", (await text("#follow")) === "Following" && (await count("#follow svg.lucide-bell")) === 1);
await page.click("#follow");
check("watch: tapping Following opens notification options", (await count(".notify-sheet .notify-option")) === 3);
await shot("notifications");
await page.click('[data-notify="NONE"]');
check("watch: None turns the bell off", (await count("#follow svg.lucide-bell-off")) === 1 && (await count(".sheet-backdrop")) === 0);
await page.click("#follow");
await page.mouse.click(200, 60);
check("watch: tapping the backdrop closes the sheet", (await count(".sheet-backdrop")) === 0);
await page.click("#follow");
await page.click('[data-notify="UNFOLLOW"]');
check("watch: Unfollow goes back to Follow", (await text("#follow")) === "Follow");

// Comments
await page.click("#comments-btn");
check("watch: comments open below the player", (await count('.panel[aria-label="Comments"] .comment')) === 4 && (await page.locator("#comments-btn").evaluate((e) => e.classList.contains("pill-btn--on"))));
check("watch: post button waits for text", await page.locator(".composer__send").isDisabled());
await page.fill("#comment-input", "Loved the ending");
await page.click(".composer__send");
check("watch: posting adds your comment at the top and counts it", (await text(".comment__text")) === "Loved the ending" && (await text("#comment-count")) === "5");
await page.click('[data-menu="0"]');
check("watch: your comment's menu shows Delete", (await count(".comment__delete")) === 1);
await shot("comment-menu");
await page.click(".comment__delete");
check("watch: delete asks first", (await text(".dialog__title")) === "Delete comment?");
await page.click("[data-confirm]");
check("watch: Yes deletes the comment", (await count(".comment")) === 4 && (await text("#comment-count")) === "4");
await page.keyboard.press("Escape");
check("watch: Esc closes comments", (await count(".panel")) === 0 && !(await page.locator("#comments-btn").evaluate((e) => e.classList.contains("pill-btn--on"))));

// Reward
await page.click("#reward-btn");
check("watch: reward sheet opens with nothing chosen", (await text(".reward-sheet__title")) === "Reward creator" && (await page.locator("[data-send]").isDisabled()) && (await text("[data-send]")) === "Reward $0.00");
check("watch: reward items are marked as placeholders", (await count(".reward-sheet .tag--placeholder")) === 1);
check("watch: minus is off at zero", await page.locator('[data-gift="rose"] [data-step="-1"]').isDisabled());
await page.click('[data-gift="rose"] [data-step="1"]');
await page.click('[data-gift="rose"] [data-step="1"]');
await page.click('[data-gift="star"] [data-step="1"]');
check("watch: quantities update the total", (await text('[data-gift="rose"] .qty__value')) === "2" && (await text("[data-send]")) === "Reward $7.00");
await page.click('[data-gift="rose"] [data-step="-1"]');
check("watch: minus lowers the total", (await text("[data-send]")) === "Reward $6.00");
await shot("reward");
await page.click("[data-send]");
// As in the app, sending just closes the sheet: there's no "reward sent" confirmation.
check("watch: sending the reward closes the sheet with no confirmation", (await count(".sheet-backdrop")) === 0 && (await count(".reward-sent")) === 0);
await page.click("#reward-btn");
await page.keyboard.press("Escape");
check("watch: Esc closes the reward sheet", (await count(".sheet-backdrop")) === 0);

// States reached from the address
const states = {
  "following": async () => (await text("#follow")) === "Following" && (await count("#follow svg.lucide-bell")) === 1,
  "notifications-off": async () => (await count("#follow svg.lucide-bell-off")) === 1,
  "notifications": async () => (await count(".notify-sheet")) === 1,
  "own": async () => (await text("#follow")) === "Go to Ultra Studio" && (await page.getAttribute("#follow", "href")) === "ultra-studio.html" && (await icons(".actions-row")) === "message-circle,share",
  "description": async () => (await count('.panel[aria-label="Description"]')) === 1,
  "comments": async () => (await count(".comment")) === 4,
  "comments-empty": async () => (await text(".comments-empty__title")) === "No comments yet",
  "comment-added": async () => (await text(".comment__name")) === "alex.rivera" && (await count(".comment__menu")) === 1,
  "delete-comment": async () => (await text(".dialog__title")) === "Delete comment?",
  "reward": async () => (await count(".reward-sheet .gift")) === 3,
  "reward-selected": async () => (await text("[data-send]")) === "Reward $7.00",
  "reward-loading": async () => (await count(".sheet-state .spinner")) === 1 && (await text(".sheet-state")).trim() === "",
  "reward-error": async () => (await text(".sheet-state")).includes("Could not load reward gifts."),
  "reward-empty": async () => (await text(".sheet-state")).includes("No reward gifts available right now."),
  "no-related": async () => (await count("#related .card")) === 0 && (await count(".section-title")) === 1,
  "not-found": async () => (await count(".empty-state svg.lucide-party-popper")) === 1 && (await text(".empty-state__title")) === "Content Not Found" && (await page.getAttribute(".empty-state .btn", "href")) === "discover.html",
  "report-submitted": async () => (await text(".dialog__title")) === "Report Submitted",
  "loading": async () => (await count(".watch-loading .spinner")) === 1 && (await text(".watch-loading")).trim() === "",
};
for (const [state, test] of Object.entries(states)) {
  await go(`watch.html?id=v2&state=${state}`);
  check(`watch ?state=${state}`, await test());
  await shot(state);
}
await go("watch.html?id=gone");
check("watch: unknown video shows not found", (await count(".empty-state--gone")) === 1);

// The app has no live chat replay on a video, so that state is gone.
await go("watch.html?id=v2&state=live-chat");
check("watch: no recorded live chat", (await count('.panel[aria-label="Live Chat"]')) === 0 && (await count(".chat-row")) === 0);

// Avatars with no picture are the app's: the gradient with a person icon, never a letter.
await go("watch.html?id=v2");
check("watch: avatars show the person icon, not a letter", (await count(".owner .avatar svg.lucide-user")) === 1 && (await text(".owner .avatar")).trim() === "");

// Billboard's copy shares the page script and must still work.
await page.goto(SITE + "prototypes/billboard/app/watch.html?id=v1");
await page.waitForTimeout(120);
check("billboard copy: video page still renders", (await text("#title")).length > 3 && (await count(".note")) === 1);

// ---------- Channel ----------
await go("channel.html?c=PixelForge");
check("channel: name, followers and Follow", (await text("#name")) === "PixelForge" && (await text("#followers")) === "128K followers" && (await text("#follow")) === "Follow");
check("channel: top bar has reward and share", (await icons(".channel-bar__actions")) === "hand-coins,share");
check("channel: Videos tab first and selected", (await text('[aria-selected="true"]')) === "Videos" && (await count("#list .card")) === 2);
await shot("channel");
await page.click(".bio__more");
check("channel: See more expands the bio", (await count(".bio__more")) === 0 && (await text("#bio")).endsWith("comments."));
await page.click("#follow");
check("channel: Follow toggles to Following", (await text("#follow")) === "Following");
await page.click('[data-tab="shorts"]');
check("channel: shorts sit two across", (await count("#list .short-row .card")) === 2 && (await count("#list > .card")) === 1);
await shot("channel-shorts");
await page.click('[data-tab="live"]');
check("channel: live tab shows the live badge", (await count("#list .live-badge")) === 1);
await page.click("#reward");
check("channel: reward opens the reward sheet", (await count(".reward-sheet")) === 1);
await page.keyboard.press("Escape");

const channelStates = {
  "following": async () => (await text("#follow")) === "Following",
  "own": async () => (await text("#follow")) === "Go to Ultra Studio" && (await count("#reward")) === 0,
  "viewer": async () => (await text("#name")) === "mira_draws" && !(await page.locator("#bio").isVisible()) && (await text(".empty-state__title")) === "No contents yet",
  "empty": async () => (await text(".empty-state__title")) === "No contents yet" && (await text(".empty-state__text")) === "Check back again",
  "shorts": async () => (await text('[aria-selected="true"]')) === "Shorts",
  "live": async () => (await text('[aria-selected="true"]')) === "Live",
  "bio": async () => (await count(".bio__more")) === 0,
  "reward": async () => (await count(".reward-sheet")) === 1,
  "loading": async () => (await text(".channel-state")).includes("Loading profile..."),
  "error": async () => (await text(".channel-state")).includes("Could not load this profile."),
};
for (const [state, test] of Object.entries(channelStates)) {
  await go(`channel.html?c=LoopHouse&state=${state}`);
  check(`channel ?state=${state}`, await test());
  await shot(`channel-${state}`);
}
await go("channel.html?c=Nobody");
check("channel: unknown creator can't load", (await text(".channel-state")).includes("Could not load this profile."));

// ---------- Followers ----------
await go("followers.html");
check("followers: title, search and two tabs", (await text(".list-header__title")) === "Followers" && (await count(".line-tab")) === 2 && (await count(".person-row")) === 6);
await shot("followers");
await page.fill("#search", "tech");
check("followers: search filters by name or handle", (await count(".person-row")) === 2);
await page.fill("#search", "zzz");
check("followers: no results state", (await text(".empty-state__title")) === "No results");
await page.fill("#search", "");
const first = page.locator(".person-row .btn").first();
await first.click();
check("followers: Follow toggles", (await page.locator(".person-row .btn").first().innerText()) === "Following");
await page.click('[data-tab="following"]');
check("followers: Following tab lists who you follow", (await count(".person-row")) === 4 && (await page.locator(".person-row .btn").allInnerTexts()).every((t) => t === "Following"));
for (const state of ["following", "no-results", "empty"]) {
  await go(`followers.html?state=${state}`);
  await shot(`followers-${state}`);
}
await go("followers.html?state=empty");
check("followers ?state=empty", (await text(".empty-state__title")) === "No followers yet");

// ---------- Subscribers ----------
await go("subscribers.html");
check("subscribers: totals card", (await text("#stat-total")) === "1.25k" && (await text("#stat-paid")) === "1k" && (await text("#stat-free")) === "250");
check("subscribers: list with join time and tier", (await count(".sub-row")) === 5 && (await text(".sub-row__joined")) === "Join 2 days ago");
await shot("subscribers");
await page.click('[data-filter="paid"]');
check("subscribers: Paid filter", (await count(".sub-row")) === 3);
await page.click('[data-filter="free"]');
check("subscribers: Free filter", (await count(".sub-row")) === 2);
await go("subscribers.html?state=empty");
check("subscribers ?state=empty", (await text(".empty-state__title")) === "No subscribers yet");
await shot("subscribers-empty");

// ---------- Small phone: nothing scrolls sideways ----------
const small = await browser.newContext({ viewport: { width: 320, height: 640 } });
const sp = await small.newPage();
sp.on("pageerror", (e) => errors.push("320: " + e.message));
const wide = [];
const paths = [
  ...Object.keys(states).map((s) => `watch.html?id=v2&state=${s}`), "watch.html?id=v2",
  ...Object.keys(channelStates).map((s) => `channel.html?c=LaughTrack&state=${s}`), "channel.html?c=LaughTrack",
  "followers.html", "followers.html?state=following", "subscribers.html",
];
for (const p of paths) {
  await sp.goto(A + p);
  await sp.waitForTimeout(80);
  if (await sp.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) wide.push(p);
}
check("320px: no page or state scrolls sideways", wide.length === 0, wide.join(" | "));
await sp.goto(A + "watch.html?id=v2&state=reward");
await sp.waitForTimeout(80);
await sp.screenshot({ path: `${SHOTS}/watch-320-reward.png` });
await sp.goto(A + "followers.html");
await sp.screenshot({ path: `${SHOTS}/watch-320-followers.png` });
check("320px: follower names truncate instead of pushing the button off", await sp.locator(".person-row__card .btn").first().evaluate((b) => b.getBoundingClientRect().right <= b.closest(".person-row__card").getBoundingClientRect().right));
await small.close();

check("no script errors", errors.length === 0, errors.slice(0, 5).join(" | "));
await browser.close();
server.close();
finish();
