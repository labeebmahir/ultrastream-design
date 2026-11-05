// Creating content and Ultra Studio: Create tab, Ultra Studio, Manage contents, upload and edit, Go Live, Analysis, channel screens.
import { launchBrowser, reporter, ROOT, SHOTS, startServer } from "./lib.mjs";

const { server, url: SITE } = startServer();
const A = SITE + "app/";
const { check, finish } = reporter();

const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 960 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.location().url)) errors.push(m.text()); });
const count = (sel) => page.locator(sel).count();
const text = (sel) => page.locator(sel).first().innerText();
const go = async (path) => { await page.goto(A + path); await page.waitForTimeout(80); };
const shot = (name) => page.locator(".phone").screenshot({ path: `${SHOTS}/studio-${name}.png` });
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

// Every page and state loads cleanly, with every icon drawn
const STATES = {
  "create.html": ["?as=guest", "?as=viewer", "?as=creator", "?as=creator&state=new", "?as=creator&state=loading"],
  "ultra-studio.html": ["", "?state=new", "?state=loading"],
  "manage-contents.html": ["", "?state=shorts", "?state=lives", "?state=scheduled", "?state=empty", "?state=scheduled-empty", "?state=loading", "?state=error", "?state=menu", "?state=delete", "?state=delete-error", "?state=delete-all", "?state=login"],
  "upload.html": ["", "?state=filled", "?state=short", "?state=scheduled", "?state=picker", "?state=type", "?state=category", "?state=missing-file", "?state=missing-title", "?state=discard", "?state=uploading", "?state=cancel-upload", "?state=processing", "?state=done", "?state=paused", "?state=interrupted", "?state=failed", "?state=edit", "?state=edit-changed", "?state=edit-scheduled", "?state=edit-discard", "?state=edit-delete", "?state=edit-saved", "?mode=edit&id=v2"],
  "go-live.html": ["", "?state=filled", "?state=tips-off", "?state=category"],
  "analytics.html": ["", "?state=period-menu", "?state=30d", "?state=90d"],
  "create-channel.html": ["", "?state=errors", "?state=filled", "?state=photo", "?state=picker", "?state=category", "?state=creating", "?state=success", "?state=edit", "?state=edit-picker", "?state=updating", "?state=edit-success", "?state=edit-delete"],
  "channel-settings.html": ["", "?state=delete", "?state=deleted"],
};
const bad = [];
for (const [file, states] of Object.entries(STATES)) {
  for (const s of states) {
    await go(file + s);
    if (await count("i[data-lucide]")) bad.push(`${file}${s}: icon not drawn`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) bad.push(`${file}${s}: scrolls sideways`);
  }
}
check(`states: ${Object.values(STATES).flat().length} states load with every icon drawn`, bad.length === 0, bad.slice(0, 5).join(" | "));

// Create tab
await go("create.html?as=guest");
check("create: guest sees the sign-up prompt and the top bar", (await text(".empty-state__title")) === "Sign up to explore everything" && (await page.locator('a[href="sign-in.html"]').innerText()) === "Sign up" && await page.locator(".topbar").isVisible());
check("create: Create tab is the current tab", (await page.locator('.tabbar [aria-current="page"]').innerText()).includes("Create"));
await shot("create-guest");
await go("create.html");
check("create: viewers see the creator benefits by default", (await page.locator(".benefits__item").allInnerTexts()).join("|") === "Earn from your content|Build your community|Grow your channel");
check("create: Get Started opens Create channel", (await page.locator(".benefits__footer a").getAttribute("href")) === "create-channel.html");
check("create: no top bar for viewers", !(await page.locator(".topbar").isVisible()));
await shot("create-viewer");
await go("create.html?as=creator");
check("create: creators see Ultra Studio in the tab", (await text(".studio-title")) === "Ultra studio" && (await count(".tabbar")) === 1);
await shot("create-creator");

// Ultra Studio
await go("ultra-studio.html");
const statText = await page.locator(".stat").allInnerTexts();
check("studio: six stats in the app's order", statText.map((t) => t.split("\n")[0]).join() === "Earned,Views,Likes,Videos,Shorts,Live", statText.join(" / "));
check("studio: earnings formatted as in the app", (await text(".stat--earned .stat__value")) === "$ 500.2");
check("studio: earned tile uses the gradient", /linear-gradient/.test(await page.locator(".stat--earned").evaluate((e) => getComputedStyle(e).backgroundImage)));
const hrefs = await page.locator(".studio-menu a").evaluateAll((a) => a.map((x) => x.getAttribute("href")).join());
check("studio: quick actions and tools link to their screens", hrefs === "upload.html,go-live.html,manage-contents.html,analytics.html", hrefs);
check("studio: View channel and edit channel links", (await page.locator('a:has-text("View channel")').getAttribute("href")) === "channel.html?c=PixelForge" && (await page.locator('[aria-label="Edit channel"]').getAttribute("href")) === "create-channel.html?mode=edit");
check("studio: stat tiles three across", await page.locator(".stats").evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(" ").length === 3));
await shot("ultra-studio");
await go("ultra-studio.html?state=new");
check("studio: new creator shows zeros", (await page.locator(".stat__value").allInnerTexts()).join() === "$ 0,0,0,0,0,0" && (await page.locator(".studio-profile__meta").nth(1).innerText()) === "0 followers");
await shot("ultra-studio-new");
await go("ultra-studio.html?state=loading");
check("studio: loading shows skeletons", (await count(".s-skel")) === 9);

// Manage contents
await go("manage-contents.html");
check("manage: Videos and Published selected first", (await text('[role="tab"][aria-selected="true"]')) === "Videos" && (await text('.mc-filter[aria-pressed="true"]')) === "Published");
const videos = await count(".mc-item");
check("manage: lists published videos with views and age", videos > 3 && /views • /.test(await text(".mc-meta")));
await shot("manage-published");
await page.click('[data-tab="shorts"]');
check("manage: Shorts tab lists shorts", (await count(".mc-item")) > 0 && (await count(".mc-item")) !== videos);
await page.click('[data-tab="lives"]');
check("manage: Lives tab shows the Live badge", (await count(".mc-badge--live")) === 2);
await page.click('[data-tab="videos"]');
await page.click('[data-filter="scheduled"]');
check("manage: Scheduled shows scheduled videos with their date", (await count(".mc-item")) === 2 && /^Scheduled for /.test(await text(".mc-meta")));
await shot("manage-scheduled");
await page.click('[data-filter="published"]');
await page.click(".mc-item >> nth=0 >> [data-menu]");
check("manage: menu offers Edit and Delete for a video", (await page.locator(".mc-menu button").allInnerTexts()).join() === "Edit,Delete");
await shot("manage-menu");
await page.keyboard.press("Escape");
check("manage: Escape closes the menu", (await count(".mc-menu")) === 0);
await page.click('[data-tab="shorts"]');
await page.click(".mc-item >> nth=0 >> [data-menu]");
check("manage: shorts can only be deleted, as in the app", (await page.locator(".mc-menu button").allInnerTexts()).join() === "Delete");
await page.click('[data-tab="videos"]');
const firstTitle = await text(".mc-title");
await page.click(".mc-item >> nth=0 >> [data-menu]");
await page.click(".mc-menu [data-delete]");
check("manage: delete asks first", (await text(".dialog__title")) === "Delete video?" && (await page.locator(".dialog [data-confirm]").innerText()) === "Yes");
await shot("manage-delete");
await page.click(".dialog [data-confirm]");
check("manage: delete removes the item", (await count(".mc-item")) === videos - 1 && (await text(".mc-title")) !== firstTitle);
await page.click("#delete-all");
check("manage: Delete all asks first, naming the type", (await text(".dialog__title")) === "Delete all videos?");
await shot("manage-delete-all");
await page.click(".dialog [data-secondary]");
check("manage: cancelling Delete all keeps everything", (await count(".mc-item")) === videos - 1);
await page.click("#delete-all");
await page.click(".dialog [data-confirm]");
check("manage: Delete all empties the type and shows the empty state", (await text(".empty-state__title")) === "No content created yet" && (await page.locator(".mc-empty .btn").innerText()) === "Create content");
check("manage: Delete all only clears that type", await (async () => { await page.click('[data-tab="shorts"]'); return (await count(".mc-item")) > 0; })());
await page.click(".mc-item >> nth=0 >> [data-menu]");
await page.click(".mc-menu [data-delete]");
await page.keyboard.press("Escape");
check("manage: Escape closes the delete dialog", (await count(".dialog")) === 0);
await go("manage-contents.html?state=scheduled-empty");
check("manage: scheduled empty state", (await text(".empty-state__title")) === "No content scheduled yet" && (await page.locator(".mc-empty .btn").innerText()) === "Schedule content");
await shot("manage-scheduled-empty");
await go("manage-contents.html?state=empty");
await shot("manage-empty");
await go("manage-contents.html?state=error");
check("manage: error state", (await text(".empty-state__title")) === "Couldn't load your content");
await go("manage-contents.html?state=delete-error");
await page.click(".dialog [data-confirm]");
// As in the app: the red AppToast banner, the dialog stays open and the item stays.
check("manage: a failed delete shows the app's error banner and keeps the item", (await text(".app-toast__text")) === "Failed to delete video. Please try again." && (await text(".app-toast__action")) === "Dismiss" && (await count(".dialog")) === 1 && (await count(".mc-item")) === videos);
await shot("manage-delete-error");

// Upload
await go("upload.html");
check("upload: starts empty with Video and Gaming", (await text("#type .s-select__value")) === "Video" && (await text("#category .s-select__value")) === "Gaming" && (await count("#pick-video")) === 1);
await shot("upload-empty");
await page.click("#publish");
check("upload: publishing with no file asks for one in the phone's alert", (await text(".sys-alert__title")) === "Error" && (await text(".sys-alert__text")) === "Please select a video file");
await page.click(".sys-alert__btn");
await page.click("#pick-video");
check("upload: video picker sheet", (await text(".s-sheet__title")) === "Select Video" && (await page.locator(".s-pick").allInnerTexts()).join("|") === "Take Video|Choose from Library");
await shot("upload-picker");
await page.locator('[data-pick="gallery"]').setInputFiles({ name: "my-clip.mp4", mimeType: "video/mp4", buffer: Buffer.from("not really a video") });
check("upload: picked file shows its name", (await text(".up-file__name")) === "my-clip.mp4" && (await count(".s-sheet")) === 0);
await page.click("#publish");
check("upload: publishing with no title asks for one", (await text(".sys-alert__text")) === "Please enter a video title");
await page.click(".sys-alert__btn");
await page.fill("#title", "My first upload");
await page.fill("#desc", "Hello");
check("upload: description shows its character count", (await text("#desc-count")) === "5/250");
await page.fill("#desc", "x".repeat(300));
check("upload: description stops at 250 characters", (await page.inputValue("#desc")).length === 250 && (await text("#desc-count")) === "250/250");
await page.click("#pick-thumb");
await page.locator('[data-pick="gallery"]').setInputFiles({ name: "thumb.png", mimeType: "image/png", buffer: PNG });
check("upload: thumbnail previews with Upload thumbnail and Remove", (await count(".up-thumb__img")) === 1 && (await page.locator(".up-thumb__actions .btn").allInnerTexts()).join("|") === "Upload thumbnail|Remove");
await page.click("#type");
await page.click('.s-dd__opt[data-value="shorts"]');
check("upload: choosing Short makes the thumbnail portrait", await page.locator(".up-thumb__img").evaluate((e) => e.getBoundingClientRect().height > e.getBoundingClientRect().width));
await page.click("#category");
check("upload: category list marks the current one", (await page.locator('.s-dd__opt[aria-selected="true"]').innerText()) === "Gaming");
await page.click('.s-dd__opt[data-value="Music"]');
check("upload: category changes", (await text("#category .s-select__value")) === "Music");
await page.click("#schedule");
check("upload: scheduling shows date and time and renames the button", await page.locator("#schedule-fields").isVisible() && (await text("#publish")) === "Schedule video" && !/Pick/.test(await text("#date-btn")));
await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 3); const el = document.getElementById("date"); el.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; el.dispatchEvent(new Event("change")); });
const expectedDate = await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); });
check("upload: picking a date updates the field", (await text("#date-btn")) === expectedDate, await text("#date-btn"));
await page.evaluate(() => { const el = document.getElementById("time"); el.value = "14:30"; el.dispatchEvent(new Event("change")); });
check("upload: picking a time updates the field", /2:30/.test(await text("#time-btn")));
await shot("upload-scheduled");
await page.click("#schedule");
await page.click("#publish");
await page.waitForTimeout(300);
check("upload: publishing shows the progress banner", await page.locator(".up-banner").isVisible() && /Video/.test(await text(".up-banner__title")));
check("upload: publish is disabled while uploading", await page.locator("#publish").isDisabled());
await page.waitForTimeout(900);
const sub = await text(".up-banner__sub");
check("upload: progress moves", /\d+% uploaded • Keep app open/.test(sub), sub);
await shot("upload-uploading");
await page.click("#banner-close");
check("upload: closing asks before cancelling", (await text(".dialog__title")) === "Cancel upload?" && (await page.locator(".dialog [data-confirm]").innerText()) === "Keep uploading");
await page.click(".dialog [data-dismiss]");
check("upload: the X keeps uploading", await page.locator(".up-banner").isVisible());
await page.click("#banner-close");
await page.click(".dialog [data-secondary]");
check("upload: Cancel upload removes the banner", (await count(".up-banner")) === 0 && !(await page.locator("#publish").isDisabled()));
await page.click("#publish");
await page.waitForFunction(() => document.querySelector(".up-banner__title")?.textContent === "Video Uploaded!", null, { timeout: 15000 });
check("upload: finishes with Video Uploaded", (await text(".up-banner__sub")) === "Your video is now live");
await page.waitForFunction(() => !document.querySelector(".up-banner"), null, { timeout: 5000 });
check("upload: banner hides and the form starts again", (await page.inputValue("#title")) === "" && (await count("#pick-video")) === 1);
await go("upload.html?state=interrupted");
check("upload: interrupted upload offers Resume and Discard", (await page.locator(".up-banner__actions button").allInnerTexts()).join() === "Resume,Discard");
await shot("upload-interrupted");
await page.click("#banner-resume");
check("upload: Resume carries on", (await text(".up-banner__title")) !== "Upload Interrupted" && (await count(".up-banner__actions")) === 0);
await go("upload.html?state=filled");
await page.click("#back");
check("upload: leaving with changes asks to discard", (await text(".dialog__title")) === "Discard changes?" && (await page.locator(".dialog [data-secondary]").innerText()) === "Continue editing");
await shot("upload-discard");
await page.click(".dialog [data-secondary]");
check("upload: Continue editing stays", (await count(".dialog")) === 0 && page.url().includes("upload.html"));

// Edit
await go("manage-contents.html");
await page.click(".mc-item >> nth=0 >> [data-menu]");
await page.click(".mc-menu [data-edit]");
await page.waitForURL(/upload\.html\?mode=edit/);
await page.waitForTimeout(80);
check("edit: opens from Manage contents with the video's details", (await text("#page-title")) === "Edit video" && (await page.inputValue("#title")).length > 3);
check("edit: no content type, file or schedule for a published video", !(await page.locator("#type-section").isVisible()) && !(await page.locator("#file-section").isVisible()) && !(await page.locator("#schedule-row").isVisible()));
check("edit: Save changes hidden until something changes", !(await page.locator("#save").isVisible()) && await page.locator("#delete").isVisible());
await shot("edit");
await page.fill("#title", "A better title");
check("edit: Save changes appears after a change", await page.locator("#save").isVisible());
await shot("edit-changed");
await page.click("#save");
check("edit: saving confirms", (await text(".sys-alert__title")) === "Success" && (await text(".sys-alert__text")) === "Video updated successfully");
await go("upload.html?state=edit-scheduled");
check("edit: a scheduled video shows its date and time", await page.locator("#schedule-fields").isVisible() && (await page.locator("#schedule").getAttribute("aria-checked")) === "true");
await shot("edit-scheduled");
await page.click("#delete");
check("edit: Delete video asks first", (await text(".dialog__title")) === "Delete video?");

// Go Live
await go("go-live.html");
check("live: defaults to Gaming with tips on", (await text("#category .s-select__value")) === "Gaming" && (await page.locator("#tips").getAttribute("aria-checked")) === "true");
await shot("go-live");
await page.click("#tips");
check("live: tips switch turns off", (await page.locator("#tips").getAttribute("aria-checked")) === "false");
await page.waitForTimeout(300); // let the switch's colour change finish
check("live: off is a white track with a white thumb, as the app passes", await page.locator("#tips").evaluate((e) => getComputedStyle(e).backgroundColor === "rgb(255, 255, 255)" && getComputedStyle(e, "::after").backgroundColor === "rgb(255, 255, 255)"));
await page.click("#tips");
await page.waitForTimeout(300);
check("live: on is solid red, not the gradient", await page.locator("#tips").evaluate((e) => getComputedStyle(e).backgroundColor === "rgb(216, 10, 0)" && getComputedStyle(e).backgroundImage === "none"));
await page.click("#tips");
await page.click("#category");
check("live: category list is titled as in the app", (await text(".s-dd__title")) === "Select");
await page.click('.s-dd__opt[data-value="Music"]');
check("live: category changes", (await text("#category .s-select__value")) === "Music");
check("live: Go Live button is a gradient pill", await page.locator("#go").evaluate((e) => getComputedStyle(e).borderRadius === "999px" && /gradient/.test(getComputedStyle(e).backgroundImage)));

// Analysis
await go("analytics.html");
check("analysis: two charts of seven bars", (await count(".an-card")) === 2 && (await count(".an-card >> nth=0 >> .bar-chart__bar")) === 7);
check("analysis: Friday is highlighted on views and Thursday on revenue", (await page.locator(".an-card >> nth=0 >> .bar-chart__bar").nth(4).getAttribute("class")).includes("--on") && (await page.locator(".an-card >> nth=1 >> .bar-chart__bar").nth(3).getAttribute("class")).includes("--on"));
check("analysis: bars scale to 3k", await page.locator(".an-card >> nth=0 >> .bar-chart__bar").nth(4).evaluate((e) => Math.abs(e.offsetHeight / e.parentElement.offsetHeight - 0.8) < 0.02));
check("analysis: axis labels", (await page.locator(".an-card >> nth=0 >> .bar-chart__x span").allInnerTexts()).join() === "MON,TUE,WED,THU,FRI,SAT,SUN" && (await page.locator(".an-card >> nth=0 >> .bar-chart__y").allInnerTexts()).join() === "0,1k,2k,3k");
await shot("analytics");
await page.click("#period");
check("analysis: period menu opens", await page.locator("#period-menu").isVisible());
await shot("analytics-period");
await page.click('[data-period="30d"]');
check("analysis: choosing a period updates the label", (await text("#period-label")) === "Last 30 days" && !(await page.locator("#period-menu").isVisible()));

// Create channel
await go("create-channel.html");
await page.click("#submit");
const errs = await page.locator(".s-error:visible").allInnerTexts();
check("channel: empty submit shows every error", errs.join("|") === "Upload profile image|Enter your channel name|Enter your channel handle|Enter a short channel description|Please select a category", errs.join("|"));
await shot("channel-errors");
await page.fill("#name", "Night Owl");
check("channel: errors clear as you fix them", !(await page.locator("#f-name .s-error").isVisible()));
await page.locator("#handle").pressSequentially("Night Owl!");
check("channel: handle keeps letters, numbers and underscores, with an @", (await page.inputValue("#handle")) === "@NightOwl");
await page.fill("#bio", "Late streams.");
check("channel: bio count", (await text("#bio-count")) === "13/250");
await page.click("#upload-photo");
check("channel: photo sheet with remove option", (await text(".s-sheet__title")) === "Change channel photo" && (await count("[data-remove]")) === 1);
await shot("channel-picker");
await page.locator('[data-pick="gallery"]').setInputFiles({ name: "me.png", mimeType: "image/png", buffer: PNG });
check("channel: picked photo shows in the avatar", /blob:/.test(await page.locator("#avatar").evaluate((e) => e.style.backgroundImage)) && !(await page.locator("#avatar-error").isVisible()));
await page.click("#category");
check("channel: category list titled Select", (await text(".s-dd__title")) === "Select");
await page.click('.s-dd__opt[data-value="Art"]');
await page.fill("#handle", "@no");
await page.click("#submit");
check("channel: short handle is rejected", (await text("#f-handle .s-error")) === "Use 3-30 characters (letters, numbers, underscore).");
await page.fill("#handle", "@night_owl");
await page.click("#submit");
check("channel: creating shows progress", (await text("#submit")) === "Creating channel..." && await page.locator("#submit").isDisabled());
await page.waitForSelector("#success:not([hidden])");
check("channel: success screen", (await text("#success-title")) === "Your channel is live!" && (await page.locator("#continue").getAttribute("href")) === "discover.html");
await shot("channel-success");
await go("create-channel.html?mode=edit");
check("channel: edit is prefilled with 30-day warnings", (await page.inputValue("#name")) === "PixelForge" && (await page.locator(".s-hint:visible").count()) === 2 && (await text("#submit")) === "Save Data");
check("channel: edit has Delete Channel, not Go back", await page.locator("#delete").isVisible() && !(await page.locator("#go-back").isVisible()));
await shot("channel-edit");
await page.click("#delete");
check("channel: delete names the channel", (await text(".dialog__text")).includes('"PixelForge"'));
await go("create-channel.html");
await shot("channel-create");

// Channel settings
await go("channel-settings.html");
await shot("channel-settings");
await page.click("#delete");
check("settings: delete asks first", (await text(".dialog__title")) === "Delete channel?" && (await page.locator(".dialog [data-confirm]").innerText()) === "Delete");
await shot("channel-settings-delete");
await page.click(".dialog [data-confirm]");
check("settings: deleting confirms", (await text(".sys-alert__text")) === "Channel deleted successfully");

// Design details from the app's code
await go("ultra-studio.html");
check("design: studio screens use a 24px side margin", (await page.locator(".studio-body").evaluate((e) => getComputedStyle(e).paddingLeft)) === "24px");
await go("upload.html");
check("design: Publish is 56px tall", (await page.locator("#publish").evaluate((e) => e.offsetHeight)) === 56);
check("design: dropdown fields are 54px", (await page.locator("#category").evaluate((e) => e.offsetHeight)) === 54);
check("icons: Lucide only", (await page.locator(".phone svg:not(.lucide)").count()) === 0);
await go("manage-contents.html?state=delete");
check("design: dialog buttons are 52px with 16px corners", await page.locator(".dialog [data-confirm]").evaluate((e) => e.offsetHeight === 52 && getComputedStyle(e).borderRadius === "16px"));

// Phone sizes: no sideways scrolling, and the narrow layout on the channel form
const phone = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
const p2 = await phone.newPage();
p2.on("pageerror", (e) => errors.push("phone: " + e.message));
const wide = [];
for (const file of ["create.html", "create.html?as=creator", "ultra-studio.html", "manage-contents.html", "manage-contents.html?state=menu", "upload.html?state=scheduled", "upload.html?state=interrupted", "go-live.html", "analytics.html?state=period-menu", "create-channel.html?state=errors", "create-channel.html?mode=edit", "channel-settings.html"]) {
  await p2.goto(A + file);
  await p2.waitForTimeout(60);
  if (await p2.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) wide.push(file);
  const clipped = await p2.evaluate(() => [...document.querySelectorAll(".phone *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 0.5 && !e.closest(".chips, .actions-row"); }).map((e) => e.className));
  if (clipped.length) wide.push(`${file} clips ${clipped[0]}`);
}
check("phone: no sideways scrolling or clipped content at 320px", wide.length === 0, wide.join(" | "));
await p2.goto(A + "create-channel.html");
check("phone: narrow screens use the short Upload label", (await p2.locator("#upload-photo").innerText()) === "Upload");
await p2.screenshot({ path: `${SHOTS}/studio-phone-320-channel.png` });
await p2.goto(A + "ultra-studio.html");
await p2.screenshot({ path: `${SHOTS}/studio-phone-320-studio.png` });
await p2.goto(A + "upload.html?state=uploading");
await p2.screenshot({ path: `${SHOTS}/studio-phone-320-upload.png` });
await phone.close();

// Opened straight from disk
const fileCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const p3 = await fileCtx.newPage();
const fileErrors = [];
p3.on("pageerror", (e) => fileErrors.push(e.message));
await p3.goto(`file:///${ROOT}/app/create.html?as=creator`);
await p3.click('a:has-text("Upload a video/short")');
await p3.waitForLoadState("load");
check("file://: Ultra Studio links work from disk", (await p3.locator("#page-title").innerText()) === "Upload content");
await p3.click("#back");
await p3.waitForLoadState("load");
check("file://: back works from disk", p3.url().includes("create.html") || p3.url().includes("ultra-studio.html"), p3.url());
check("file://: no JS errors", fileErrors.length === 0, fileErrors.join(" | "));
await fileCtx.close();

check("no console or page errors", errors.length === 0, errors.slice(0, 5).join(" | "));
await browser.close();
server.close();
finish();
