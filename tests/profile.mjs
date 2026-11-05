// Profile and settings: the Profile tab, settings, edit profile, password, appearance, watch history, reward activities and wallet.
import { launchBrowser, reporter, ROOT, SHOTS, startServer } from "./lib.mjs";

const { server, url: SITE } = startServer();
const A = SITE + "app/";
const { check, finish } = reporter();

const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 402, height: 874 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|404|ERR_FILE_NOT_FOUND/.test(m.text() + m.location().url)) errors.push(m.text()); });
const posts = [];
page.on("request", (r) => { if (r.method() !== "GET") posts.push(r.method() + " " + r.url()); });

const go = async (path) => { await page.goto(A + path); await page.waitForTimeout(80); };
const shot = (name) => page.screenshot({ path: `${SHOTS}/profile-${name}.png` });
const text = (sel) => page.locator(sel).innerText();
const count = (sel) => page.locator(sel).count();
const visible = (sel) => page.locator(sel).isVisible();
const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

// Profile tab, viewer
await go("profile.html");
check("profile: Profile tab is current", (await text('.tabbar a[aria-current="page"]')).includes("Profile"));
check("profile: viewer sees Become a Creator with the creator text", (await text("#creator-card")).includes("Become a Creator") && (await text("#creator-card")).includes("Start uploading content"));
check("profile: Become a Creator goes to Create", (await page.getAttribute("#creator-card", "href")) === "create.html");
check("profile: Become an Advertiser is coming soon and not a link", (await text("#advertiser-card")).includes("coming soon") && (await page.locator("#advertiser-card").evaluate((e) => e.tagName)) === "DIV");
check("profile: viewer has no reward or channel card", (await count("#reward-card, #channel-card")) === 0);
check("profile: watch history shows up to 10 videos", (await count(".pr-history .card")) === 10);
check("profile: history cards have no duration", (await count(".pr-history .duration")) === 0);
check("profile: live history item has Live and viewer badges", (await count(".pr-history .card >> nth=0 >> .pr-badge")) === 2);
check("profile: View all opens watch history", (await page.getAttribute(".pr-section-head__link", "href")) === "watch-history.html");
check("profile: settings link", (await page.getAttribute('a[aria-label="Settings"]', "href")) === "settings.html");
await shot("viewer");
await page.locator(".pr-scroll").evaluate((e) => e.scrollTo(0, 420));
await shot("viewer-history");

// Profile tab, creator
await go("profile.html?as=creator");
check("profile creator: Reward Activities card with Earned and Contributions", (await text("#reward-card")).includes("Earned") && (await text("#reward-card")).includes("Contributions"));
check("profile creator: amounts formatted as the app does", /\$ 180/.test(await text("#reward-card")) && /\$ 45/.test(await text("#reward-card")));
check("profile creator: manage channel card goes to Ultra Studio", (await text("#channel-card")).includes("Manage channel") && (await page.getAttribute("#channel-card", "href")) === "ultra-studio.html");
check("profile creator: no Become a Creator card", (await count("#creator-card")) === 0);
check("profile creator: advertiser card still shows", (await count("#advertiser-card")) === 1);
check("profile creator: settings keeps the creator version", (await page.getAttribute('a[aria-label="Settings"]', "href")) === "settings.html?as=creator");
await shot("creator");
await go("profile.html?as=creator&state=no-channel");
check("profile creator without channel: card opens channel setup", (await text("#creator-card")).includes("Ultra studio") && (await page.getAttribute("#creator-card", "href")) === "create-channel.html");
await go("profile.html?state=empty");
check("profile: empty history state", (await text("#history-empty")).includes("No watch history yet"));
await shot("empty");
check("profile: your avatar is the app's no-picture look", (await count(".pr-user .avatar svg.lucide-user")) === 1 && (await text(".pr-user .avatar")).trim() === "");
await go("profile.html?state=loading");
check("profile: loading state is the small spinner with no text", (await count(".pr-loader .spinner")) === 1 && (await text(".pr-loader")).trim() === "");

// Settings
await go("settings.html");
check("settings: Edit profile, Change password, Log out", (await page.locator(".list-row__label").allInnerTexts()).join("|") === "Edit profile|Change password|Log out");
await shot("settings");
await page.click("#logout");
check("settings: log out asks first", (await text("#logout-dialog-title")) === "Log out?" && (await text("#logout-dialog")).includes("Are you sure you want to log out?"));
await shot("settings-logout");
await page.click(".dialog >> text=Cancel");
check("settings: cancel closes the dialog", (await count(".dialog")) === 0);
await page.click("#logout");
await page.keyboard.press("Escape");
check("settings: escape closes the dialog", (await count(".dialog")) === 0);
await page.click("#logout");
await Promise.all([page.waitForURL(/welcome\.html/), page.click(".dialog [data-confirm]")]);
check("settings: Yes logs out to welcome", page.url().endsWith("welcome.html"));

// Edit profile
await go("edit-profile.html");
check("edit profile: 30-day warning shows by default", (await text("#username-helper")).includes("30 days") && (await page.locator("#username-helper").getAttribute("class")).includes("warn"));
check("edit profile: no change buttons until something changes", !(await visible("#change-username")) && !(await visible("#change-email")));
await shot("edit");
await page.fill("#username", "@pixelforge");
check("edit profile: @ is stripped", (await page.inputValue("#username")) === "pixelforge");
await page.waitForSelector("#username-helper.pr-helper--error", { timeout: 3000 }).catch(() => {});
check("edit profile: taken username shows an error and disables the button", (await text("#username-helper")) === "Username is taken" && (await page.isDisabled("#change-username")));
await shot("edit-username-taken");
await page.fill("#username", "nova.streams");
await page.waitForSelector("#username-helper.pr-helper--ok", { timeout: 3000 }).catch(() => {});
check("edit profile: free username is available", (await text("#username-helper")) === "nova.streams is available!" && !(await page.isDisabled("#change-username")));
await shot("edit-username-available");
await page.click("#change-username");
check("edit profile: change username asks first", (await text("#username-dialog-title")) === "Change username?");
await shot("edit-username-confirm");
await page.click(".dialog [data-confirm]");
// As in the app: the phone's alert says Success, and OK goes back.
check("edit profile: username saved with the phone's alert", (await text(".sys-alert__title")) === "Success" && (await text(".sys-alert__text")) === "Username updated successfully" && !(await visible("#change-username")) && (await count(".toast")) === 0);
await shot("edit-username-saved");
await Promise.all([page.waitForURL(/settings\.html/), page.click(".sys-alert__btn")]);
check("edit profile: OK goes back", page.url().includes("settings.html"));
await go("edit-profile.html");
await page.fill("#email", "not-an-email");
check("edit profile: invalid email disables Change email", (await visible("#change-email")) && (await page.isDisabled("#change-email")));
await page.fill("#email", "nova.streams@example.com");
check("edit profile: valid email enables Change email", !(await page.isDisabled("#change-email")));
await shot("edit-email-changed");
await page.click("#change-email");
check("edit profile: change email asks first", (await text("#email-dialog-title")) === "Change email?");
await page.click(".dialog [data-confirm]");
check("edit profile: code step names the new email", (await visible("#email-code")) && (await text("#code-email")) === "nova.streams@example.com");
check("edit profile: verify waits for 6 digits", await page.isDisabled("#verify"));
check("edit profile: resend counts down", /Resend in \d+s/.test(await text("#resend")));
await shot("edit-email-code");
await page.keyboard.type("123456");
check("edit profile: typing fills the boxes", !(await page.isDisabled("#verify")));
await page.click("#verify");
check("edit profile: email saved with the phone's alert", (await visible("#edit-form")) && (await text(".sys-alert__text")) === "Email updated successfully" && !(await visible("#change-email")));
await Promise.all([page.waitForURL(/settings\.html/), page.click(".sys-alert__btn")]);
await go("edit-profile.html");
check("edit profile: no picture shows the app's grey placeholder", (await count("#avatar.pr-avatar--empty svg.lucide-user-round")) === 1);
await page.click("#upload-photo");
check("edit profile: photo picker sheet", (await text("#photo-sheet")).includes("Take Photo") && (await text("#photo-sheet")).includes("Remove Profile Picture"));
await shot("edit-photo");
await page.click('[data-photo="remove"]');
check("edit profile: removing the photo shows the placeholder", (await count("#avatar.pr-avatar--empty")) === 1);
await page.click("#delete-account");
check("edit profile: delete asks first", (await text("#delete-dialog-title")) === "Delete account?" && (await text("#delete-dialog")).includes("cannot be undone"));
await shot("edit-delete");
await page.click(".dialog [data-confirm]");
check("edit profile: account deleted message", (await text(".sys-alert__title")) === "Account deleted");
await Promise.all([page.waitForURL(/welcome\.html/), page.click(".sys-alert__btn")]);
check("edit profile: after deleting, goes to welcome", page.url().endsWith("welcome.html"));
for (const s of ["username-checking", "username-available", "username-taken", "username-confirm", "email-changed", "email-confirm", "email-code", "photo", "no-photo", "delete", "deleted"]) {
  await go("edit-profile.html?state=" + s);
}
check("edit profile: every state opens without errors", errors.length === 0, errors.join(" | "));

// Change password
await go("change-password.html");
await shot("password");
await page.click("#update");
check("password: empty submit shows three errors", (await count('[aria-invalid="true"]')) === 3 && (await text("#current-msg")) === "Current password is required");
await shot("password-errors");
await page.fill("#current", "a");
check("password: error clears as you type", (await page.getAttribute("#current", "aria-invalid")) === "false");
await page.fill("#current", "old-sample-pass");
await page.fill("#new", "short");
await page.fill("#confirm", "short");
await page.click("#update");
check("password: too short", (await text("#new-msg")) === "Password must be at least 8 characters");
await page.fill("#new", "new-sample-pass");
await page.fill("#confirm", "new-sample-pas");
await page.click("#update");
check("password: mismatch", (await text("#confirm-msg")) === "Passwords do not match");
await page.fill("#new", "old-sample-pass");
await page.fill("#confirm", "old-sample-pass");
await page.click("#update");
check("password: must differ from current", (await text("#new-msg")) === "New password must be different from current password");
await page.click('[data-reveal="new"]');
check("password: eye shows the password", (await page.getAttribute("#new", "type")) === "text");
await page.fill("#new", "new-sample-pass");
await page.fill("#confirm", "new-sample-pass");
await page.click("#update");
await page.waitForSelector(".sys-alert", { timeout: 3000 }).catch(() => {});
check("password: success asks you to sign in again", (await text(".sys-alert__title")) === "Password updated" && (await text(".sys-alert")).includes("sign in again"));
check("password: fields are cleared and nothing is stored", (await page.inputValue("#new")) === "" && (await page.evaluate(() => localStorage.length + sessionStorage.length)) === 0);
await shot("password-success");

// Appearance
await go("appearance.html");
check("appearance: Light Mode is selected", (await page.getAttribute("#light", "aria-checked")) === "true" && (await text("#light")).includes("Light Mode"));
await shot("appearance");

// Watch history
await go("watch-history.html");
check("history: list with end note", (await count(".pr-history .card")) === 12 && (await text(".pr-end")).includes("12 videos total"));
check("history: pause and delete in the header", (await count("#pause")) === 1 && (await count("#clear")) === 1);
await shot("history");
await page.click("#pause");
check("history: pause asks first", (await text("#pause-dialog-title")) === "Pause watch history?");
await shot("history-pause-confirm");
await page.click(".dialog [data-confirm]");
check("history: paused state with Turn on", (await text("#history-paused")).includes("Your watch history is paused") && (await count("#resume")) === 1);
await shot("history-paused");
await page.click("#turn-on");
check("history: turning on shows the list again", (await count(".pr-history .card")) === 12);
await page.click("#clear");
check("history: delete asks first", (await text("#clear-dialog-title")) === "Delete watch history?");
await shot("history-delete-confirm");
await page.click(".dialog [data-confirm]");
check("history: deleting empties it", (await text("#history-empty")).includes("You have not watched any video") && (await page.getAttribute("#history-empty a", "href")) === "discover.html");
await shot("history-empty");
await go("watch-history.html?state=error");
check("history: error state with Retry", (await count("#retry")) === 1);
await shot("history-error");
await go("watch-history.html?state=loading");
check("history: loading state", (await text("#history-body")).includes("Loading watch history"));

// Reward activities
await go("reward-activities.html");
check("rewards: Earned tab selected with rows", (await page.getAttribute('[data-tab="earned"]', "aria-selected")) === "true" && (await count(".pr-activity")) === 4);
check("rewards: row shows amount, gift, handle, date", /\$ 100\.00/.test(await text(".pr-activity >> nth=0")) && (await text(".pr-activity >> nth=0")).includes("@mira.k"));
await shot("rewards-earned");
await page.click('[data-tab="contributions"]');
check("rewards: Contributions tab", (await page.getAttribute('[data-tab="contributions"]', "aria-selected")) === "true" && (await count(".pr-activity")) === 3);
await shot("rewards-contributions");
await page.click(".pr-activity >> nth=2");
check("rewards: details popup lists each reward", (await text("#reward-details-title")) === "Total Reward: $15" && (await count(".pr-dialog-lines li")) === 2);
await shot("rewards-details");
await page.keyboard.press("Escape");
await go("reward-activities.html?state=earned-empty");
check("rewards: earned empty state", (await text("#reward-empty")).includes("No Earnings Yet") && (await page.getAttribute("#reward-empty a", "href")) === "create.html");
await shot("rewards-earned-empty");
await go("reward-activities.html?state=contributions-empty");
check("rewards: contributions empty state", (await text("#reward-empty")).includes("Haven't Supported") && (await page.getAttribute("#reward-empty a", "href")) === "discover.html");
await shot("rewards-contributions-empty");
await go("reward-activities.html?as=viewer");
check("rewards viewer: no tabs, contributions only", !(await visible("#reward-tabs")) && (await count(".pr-activity")) === 3);
await shot("rewards-viewer");
await go("reward-activities.html?state=details");
check("rewards: details state opens", (await count("#reward-details")) === 1);

// Wallet
await go("wallet.html");
check("wallet: balance and actions", (await text("#balance")) === "1,250" && (await count("#add-coins, #withdraw")) === 2);
check("wallet: coin packages are visible", (await page.locator("#packages .pr-package >> nth=0").boundingBox()).height > 60);
await shot("wallet");
await page.click("#add-coins");
check("wallet: Add coins sheet with packages", (await count("#add-sheet .pr-package")) === 3 && (await text("#buy")).includes("500 coins"));
await shot("wallet-add");
await page.click('#add-sheet [data-pack="2"]');
await page.click("#buy");
check("wallet: buying adds to the balance", (await text("#balance")) === "2,250");
await page.click("#withdraw");
await page.fill("#withdraw-amount", "500");
await page.click("#withdraw-form [type=submit]");
check("wallet: withdraw below the minimum shows an error", (await text("#withdraw-msg")).includes("minimum"));
await shot("wallet-withdraw-error");
await page.fill("#withdraw-amount", "9000");
await page.click("#withdraw-form [type=submit]");
check("wallet: withdraw more than the balance shows an error", (await text("#withdraw-msg")).includes("don't have"));
await page.fill("#withdraw-amount", "1000");
await page.click("#withdraw-form [type=submit]");
check("wallet: withdraw takes it off the balance", (await text("#balance")) === "1,250" && (await count("#withdraw-sheet")) === 0);

// Small phone: nothing scrolls sideways
await page.setViewportSize({ width: 320, height: 640 });
const wide = [];
for (const p of ["profile.html", "profile.html?as=creator", "settings.html", "edit-profile.html?state=email-code", "edit-profile.html?state=username-available", "change-password.html?state=errors", "appearance.html", "watch-history.html", "watch-history.html?state=paused", "reward-activities.html", "reward-activities.html?state=details", "reward-activities.html?as=viewer", "wallet.html", "wallet.html?state=withdraw"]) {
  await go(p);
  if (await overflow()) wide.push(p);
}
check("small phone: no sideways scrolling at 320px", wide.length === 0, wide.join(" | "));
await go("reward-activities.html");
check("small phone: reward rows fit", await page.locator(".pr-activity >> nth=0").evaluate((e) => e.scrollWidth <= e.clientWidth + 1));
await shot("small-rewards");
await go("profile.html?as=creator");
await shot("small-creator");

// Opened straight from disk
const disk = await browser.newPage();
const diskErrors = [];
disk.on("pageerror", (e) => diskErrors.push(e.message));
await disk.goto("file:///" + ROOT + "/app/profile.html?as=creator");
await disk.waitForTimeout(100);
check("file://: profile renders from disk", (await disk.locator("#reward-card").count()) === 1 && (await disk.locator(".tabbar svg.lucide").count()) === 5 && diskErrors.length === 0, diskErrors.join(" | "));
await disk.close();

check("nothing is sent anywhere", posts.length === 0, posts.join(" | "));
check("no console or page errors", errors.length === 0, errors.slice(0, 5).join(" | "));
await browser.close();
server.close();
finish();
