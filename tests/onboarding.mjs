// Onboarding from start to finish: welcome, log in, sign up with a code, forgot password,
// handle after Google or Apple, experience, interests, every ?state=, phone sizes and opening from disk.
import { fileUrl, launchBrowser, reporter, SHOTS, startServer } from "./lib.mjs";

const { server, url: SITE } = startServer();
const A = SITE + "app/";
const { check, finish } = reporter();

const browser = await launchBrowser();
const phone = { viewport: { width: 402, height: 874 } };
const errors = [];
const posts = [];
const watch = (p, name) => {
  p.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  p.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.location().url)) errors.push(`${name}: ${m.text()}`); });
  p.on("request", (r) => { if (r.method() !== "GET") posts.push(r.method() + " " + r.url()); });
};
// A fresh context per flow, so the step kept in sessionStorage never leaks between tests.
const fresh = async (name) => {
  const ctx = await browser.newContext(phone);
  const p = await ctx.newPage();
  watch(p, name);
  return p;
};
const text = (p, sel) => p.locator(sel).innerText();
const visible = (p, sel) => p.locator(sel).isVisible();
const errorOf = (p, id) => p.locator(`#${id}`).locator("xpath=ancestor::label[contains(@class,'field')]").locator(".field__error").innerText();
const shot = (p, name) => p.screenshot({ path: `${SHOTS}/onboarding-${name}.png` });
const typeCode = async (p, code) => {
  await p.locator(".otp__box").first().click();
  await p.keyboard.type(code);
};

// Welcome
let p = await fresh("welcome");
await p.goto(A + "welcome.html");
check("welcome: Discover, Rewards and Connect", (await p.locator(".welcome__features li").allInnerTexts()).join() === "Discover,Rewards,Connect");
check("welcome: Log in and Sign up", (await p.locator('a[href="sign-in.html"]').innerText()) === "Log in" && (await p.locator('a[href="sign-up.html"]').innerText()) === "Sign up");
check("welcome: Log in is the gradient button, 56px tall", (await p.locator('a[href="sign-in.html"]').evaluate((e) => [getComputedStyle(e).backgroundImage.includes("gradient"), e.offsetHeight])).join() === "true,56");
await shot(p, "welcome");
await p.click('a[href="sign-in.html"]');
check("welcome: Log in opens log in", p.url().endsWith("sign-in.html"));
await p.context().close();

// Log in: mistakes, then success
p = await fresh("sign-in");
await p.goto(A + "sign-in.html");
await p.click("#submit");
check("log in: empty submit shows both errors", (await errorOf(p, "email")) === "Email is required." && (await errorOf(p, "password")) === "Password must be at least 8 characters long.");
await shot(p, "sign-in-errors");
await p.fill("#email", "alex@example");
check("log in: bad email updates as you type after a submit", (await errorOf(p, "email")) === "Enter a valid email address.");
await p.fill("#email", "alex@example.com");
await p.fill("#password", "short");
check("log in: email error clears once fixed", !(await p.locator("#email").evaluate((e) => e.closest(".field").classList.contains("field--invalid"))));
await p.click("[data-toggle-password]");
check("log in: eye shows the password", (await p.locator("#password").getAttribute("type")) === "text");
await p.fill("#password", "password123");
await p.fill("#email", "wrong@example.com");
await p.click("#submit");
check("log in: shows Logging in... while busy", (await text(p, "#submit")).includes("Logging in..."));
await p.waitForSelector(".auth-toast");
check("log in: wrong password shows a banner with Dismiss", (await text(p, ".auth-toast")).includes("Email and password don't match.") && (await p.locator(".auth-toast__action").innerText()) === "Dismiss");
await shot(p, "sign-in-wrong-password");
await p.click(".auth-toast__action");
check("log in: Dismiss closes the banner", (await p.locator(".auth-toast").count()) === 0);
await p.fill("#email", "alex@example.com");
await p.click("#submit");
await p.waitForURL(/discover\.html/);
check("log in: success goes to Discover", p.url().endsWith("discover.html"));
await p.context().close();

// Sign up: every step, with mistakes
p = await fresh("sign-up");
await p.goto(A + "sign-up.html");
await shot(p, "sign-up");
await p.click("#step1 button[type=submit]");
check("sign up: empty email", (await errorOf(p, "email")) === "Email is required.");
await p.fill("#email", "alex");
check("sign up: checks for an @ as you type", (await errorOf(p, "email")) === "Enter a valid email address.");
await p.fill("#email", "alex@example.com");
await p.click("#step1 button[type=submit]");
check("sign up: terms must be ticked", (await text(p, "#terms-error")) === "To proceed, you must agree with terms here to continue.");
await shot(p, "sign-up-terms");
await p.check("#terms");
check("sign up: ticking clears the terms error", !(await visible(p, "#terms-error")));
await p.click("#step1 button[type=submit]");
await p.waitForSelector('[data-step="2"]:not([hidden])');
check("sign up: code step names the email", (await text(p, "#sent-to")) === "alex@example.com");
check("sign up: resend counts down", /^Resend in \d+s$/.test(await text(p, "#resend")) && (await p.locator("#resend").isDisabled()));
check("sign up: code is six boxes", (await p.locator('[data-step="2"] .otp__box').count()) === 6);
await p.click("#step2 button[type=submit]");
check("sign up: short code is incorrect", (await text(p, "#otp .otp__error")) === "That code is incorrect. Please try again.");
await typeCode(p, "000000");
check("sign up: typing clears the code error", !(await visible(p, "#otp .otp__error")));
await p.click("#step2 button[type=submit]");
check("sign up: 000000 is incorrect", (await text(p, "#otp .otp__error")) === "That code is incorrect. Please try again.");
await shot(p, "sign-up-code-error");
await p.locator(".otp__box").nth(5).click();
await p.keyboard.press("Backspace");
await p.keyboard.press("Backspace");
check("sign up: Backspace moves back through the boxes", (await p.locator(".otp__box").evaluateAll((b) => b.map((x) => x.value).join(""))) === "0000");
await p.locator(".otp__box").first().click();
await p.keyboard.type("482913");
await p.click("#step2 button[type=submit]");
await p.waitForSelector('[data-step="3"]:not([hidden])');
check("sign up: right code moves to password", await visible(p, "#password"));
check("sign up: reload keeps the step", await (async () => { await p.reload(); return p.locator('[data-step="3"]').isVisible(); })());
await p.click("#step3 button[type=submit]");
check("sign up: password required", (await errorOf(p, "password")) === "Password is required.");
await p.fill("#password", "pass");
check("sign up: short password flagged as you type", (await errorOf(p, "password")) === "Password must be at least 8 characters long.");
await p.fill("#password", "password123");
await p.fill("#confirm", "password12");
check("sign up: mismatch flagged as you type", (await errorOf(p, "confirm")) === "Passwords do not match.");
await p.click("#step3 button[type=submit]");
check("sign up: mismatch on Continue marks both", (await errorOf(p, "password")) === "Passwords don't match." && (await errorOf(p, "confirm")) === "Passwords don't match.");
await p.fill("#confirm", "password123");
await p.click("#step3 button[type=submit]");
await p.waitForSelector('[data-step="4"]:not([hidden])');
await p.click("#step4 button[type=submit]");
check("sign up: handle required", (await errorOf(p, "handle")) === "Username is required.");
await p.fill("#handle", "Pixel Forge!");
check("sign up: handle keeps only a-z, 0-9 and _", (await p.inputValue("#handle")) === "pixelforge");
check("sign up: checks availability", (await text(p, "#handle-status")) === "Checking availability...");
await p.waitForFunction(() => document.querySelector("#handle-status").textContent.includes("taken"));
check("sign up: taken handle says so", (await text(p, "#handle-status")).includes("Username is already taken"));
await p.click("#step4 button[type=submit]");
check("sign up: can't confirm a taken handle", (await errorOf(p, "handle")) === "This username is already taken.");
await shot(p, "sign-up-handle-taken");
await p.fill("#handle", "kingpin99");
await p.waitForFunction(() => document.querySelector("#handle-status").textContent.includes("available"));
check("sign up: free handle is available", (await text(p, "#handle-status")).includes("kingpin99 is available"));
await shot(p, "sign-up-handle-available");
await p.click("#step4 button[type=submit]");
check("sign up: Confirming... while busy", (await text(p, "#confirm-handle")).includes("Confirming..."));
await p.waitForURL(/experience\.html/);
check("sign up: finishes on experience type", p.url().endsWith("experience.html"));

// Experience, interests, then Discover
await shot(p, "experience");
check("experience: Ad Supporter is chosen first", (await p.locator('.choice[aria-checked="true"]').getAttribute("data-id")) === "ad_supporter");
await p.click('[data-id="ad_free_premium"]');
check("experience: tapping chooses a card", (await p.locator('.choice[aria-checked="true"]').getAttribute("data-id")) === "ad_free_premium");
await p.click("#continue");
await p.waitForURL(/interests\.html/);
check("interests: Continue starts disabled", await p.locator("#continue").isDisabled());
await p.locator(".interest-grid .chip").nth(0).click();
await p.locator(".interest-grid .chip").nth(1).click();
check("interests: two isn't enough", await p.locator("#continue").isDisabled());
await p.locator(".interest-grid .chip").nth(2).click();
check("interests: three enables Continue", !(await p.locator("#continue").isDisabled()));
check("interests: picked chips are white", (await p.locator('.interest-grid .chip[aria-pressed="true"]').count()) === 3);
check("interests: three to a row", (await p.locator(".interest-grid").evaluate((g) => getComputedStyle(g).gridTemplateColumns.split(" ").length)) === 3);
await shot(p, "interests");
await p.click("#continue");
await p.waitForURL(/discover\.html/);
check("interests: finishes on Discover", p.url().endsWith("discover.html"));
await p.context().close();

// Sign up with Google, then choose a handle
p = await fresh("social");
await p.goto(A + "sign-up.html");
await p.click('[data-social="google"]');
await p.waitForURL(/choose-handle\.html\?provider=google/);
check("handle: shows the account email", (await text(p, "#email-line")).startsWith("Email: "));
await p.click("#submit");
check("handle: required", (await errorOf(p, "handle")) === "Username is required");
await p.fill("#handle", "ab");
check("handle: rechecks as you type once wrong", (await errorOf(p, "handle")) === "Username must be at least 3 characters");
await p.fill("#handle", "king pin");
check("handle: letters, numbers and underscores only", (await errorOf(p, "handle")) === "Username can only contain letters, numbers, and underscores");
await p.fill("#handle", "pixelforge");
check("handle: taken disables Continue", (await errorOf(p, "handle")) === "Username already taken" && (await p.locator("#submit").isDisabled()));
await shot(p, "choose-handle-taken");
await p.fill("#handle", "kingpin99");
check("handle: free handle clears the error", !(await p.locator("#submit").isDisabled()));
await p.click("#submit");
await p.waitForURL(/experience\.html/);
check("handle: continues to experience type", true);
await p.context().close();

// Forgot password: every step
p = await fresh("forgot");
await p.goto(A + "sign-in.html");
await p.click('a[href="forgot-password.html"]');
await shot(p, "forgot-password");
await p.click("#send");
check("forgot: empty email", (await errorOf(p, "email")) === "Email is required.");
await p.fill("#email", "alex@");
check("forgot: error clears as you type", !(await p.locator("#email").evaluate((e) => e.closest(".field").classList.contains("field--invalid"))));
await p.click("#send");
check("forgot: bad email", (await errorOf(p, "email")) === "Enter a valid email address.");
await p.fill("#email", "alex@example.com");
await p.click("#send");
check("forgot: Continue disables while sending", await p.locator("#send").isDisabled());
await p.waitForSelector('[data-step="2"]:not([hidden])');
check("forgot: code step has its own wording", (await p.locator('[data-step="2"] .auth-footer').first().innerText()).startsWith("Didn't receive it?"));
await typeCode(p, "000000");
await p.click("#verify");
await p.waitForSelector("#otp .otp__error:not([hidden])");
check("forgot: 000000 is incorrect", (await text(p, "#otp .otp__error")) === "That code is incorrect. Please try again.");
await p.click("#change-email");
check("forgot: Change it returns to email, keeping it", (await p.inputValue("#email")) === "alex@example.com");
await p.click("#send");
await p.waitForSelector('[data-step="2"]:not([hidden])');
await typeCode(p, "123456");
await p.click("#verify");
await p.waitForSelector('[data-step="3"]:not([hidden])');
check("forgot: Go back sits at the bottom on the new password step", await visible(p, "#back-bottom"));
await p.fill("#password", "password123");
await p.fill("#confirm", "password321");
await p.click("#reset");
check("forgot: mismatch marks both", (await errorOf(p, "confirm")) === "Passwords don't match.");
await shot(p, "forgot-mismatch");
await p.fill("#password", "password321");
await p.click("#reset");
await p.waitForURL(/sign-in\.html\?state=reset-success/);
check("forgot: finishes on log in with a success banner", (await text(p, ".auth-toast--success")).includes("Your password has been reset. Please sign in."));
await shot(p, "sign-in-reset-success");
await p.context().close();

// Every ?state= opens without errors and shows what it should
const STATES = {
  "sign-in.html": { errors: ".field--invalid", "email-invalid": ".field--invalid", loading: "#submit[aria-busy=true]", "wrong-password": ".auth-toast", "google-account": ".auth-toast", "apple-account": ".auth-toast", "google-failed": ".auth-toast", "apple-cancelled": ".auth-toast", "reset-success": ".auth-toast--success" },
  "sign-up.html": { "email-required": ".field--invalid", "email-invalid": ".field--invalid", terms: "#terms-error:not([hidden])", "email-exists": ".auth-toast", "age-verified": ".auth-toast--success", "under-18": ".auth-toast", "google-failed": ".auth-toast", code: '[data-step="2"]:not([hidden])', "code-error": ".otp--invalid", resend: "#resend:not([disabled])", password: '[data-step="3"]:not([hidden])', "password-short": '[data-step="3"] .field--invalid', "password-mismatch": '[data-step="3"] .field--invalid', handle: '[data-step="4"]:not([hidden])', "handle-checking": ".field__status--checking", "handle-available": ".field__status--ok", "handle-taken": ".field__status--bad", "handle-short": '[data-step="4"] .field--invalid', confirming: "#confirm-handle[aria-busy=true]", failed: ".auth-toast" },
  "forgot-password.html": { "email-required": ".field--invalid", "email-invalid": ".field--invalid", sending: "#send[aria-busy=true]", "send-failed": ".auth-toast", code: '[data-step="2"]:not([hidden])', "code-error": ".otp--invalid", verifying: "#verify[aria-busy=true]", resend: "#resend:not([disabled])", reset: '[data-step="3"]:not([hidden])', "reset-required": '[data-step="3"] .field--invalid', "reset-short": '[data-step="3"] .field--invalid', "reset-mismatch": '[data-step="3"] .field--invalid', resetting: "#reset[aria-busy=true]" },
  "choose-handle.html": { required: ".field--invalid", short: ".field--invalid", invalid: ".field--invalid", taken: "#submit[disabled]", loading: "#submit[aria-busy=true]", failed: ".auth-toast" },
  "experience.html": { saving: "#continue[aria-busy=true]", error: "#error:not([hidden])" },
  "interests.html": { loading: "#loading:not([hidden])", error: "#failed:not([hidden])", selected: "#continue:not([disabled])", saving: "#continue[aria-busy=true]", "save-error": "#save-error:not([hidden])" },
  "age-check.html": { checking: "#selfie[aria-busy=true]" },
};
const stateCtx = await browser.newContext(phone);
const missing = [];
for (const [page, states] of Object.entries(STATES)) {
  for (const [state, sel] of Object.entries(states)) {
    const tab = await stateCtx.newPage();
    watch(tab, `${page}?state=${state}`);
    await tab.goto(`${A}${page}?state=${state}`);
    await tab.waitForTimeout(80);
    if (!(await tab.locator(sel).count())) missing.push(`${page}?state=${state}`);
    if (["sign-up.html:code-error", "sign-up.html:handle-available", "interests.html:error", "interests.html:loading", "sign-in.html:google-account", "sign-up.html:under-18", "experience.html:error", "age-check.html:checking", "forgot-password.html:reset", "choose-handle.html:invalid"].includes(`${page}:${state}`)) {
      await tab.screenshot({ path: `${SHOTS}/onboarding-state-${page.replace(".html", "")}-${state}.png` });
    }
    await tab.close();
  }
}
check(`states: all ${Object.values(STATES).reduce((n, s) => n + Object.keys(s).length, 0)} ?state= links show their state`, missing.length === 0, missing.join(" | "));

// Experience from Settings, interests retry, Android hides Apple, creator benefits, age check
p = await stateCtx.newPage();
watch(p, "extras");
await p.goto(A + "experience.html?from=settings");
check("experience: from Settings has a header and no Continue", (await visible(p, ".app-header")) && !(await visible(p, "#continue")));
await shot(p, "experience-settings");
await p.goto(A + "interests.html?state=error");
await p.click("#retry");
await p.waitForSelector(".interest-grid .chip");
check("interests: Retry loads the list", (await p.locator(".interest-grid .chip").count()) === 12);
await p.goto(A + "sign-in.html?platform=android");
check("log in: Android has no Apple button", (await p.locator('[data-social="apple"]').count()) === 0);
await p.goto(A + "creator-benefits.html");
check("creator benefits: three benefits and Get Started", (await p.locator(".benefits__item").count()) === 3 && (await text(p, ".benefits__footer .btn")) === "Get Started");
await shot(p, "creator-benefits");
await p.goto(A + "age-check.html");
await shot(p, "age-check");
await p.click("#selfie");
await p.waitForURL(/sign-up\.html\?state=age-verified/);
check("age check: a passed selfie lands on sign up with a message", (await text(p, ".auth-toast")).includes("18+"));
await p.goto(A + "age-check.html?result=under-18");
await p.click("#selfie");
await p.waitForURL(/state=under-18/);
check("age check: under 18 lands on sign up with a message", (await text(p, ".auth-toast")).includes("18 or older"));
await stateCtx.close();

// Phone sizes: no sideways scrolling at 320px, and buttons stay on screen
const PAGES = ["welcome", "sign-in", "sign-up", "forgot-password", "choose-handle", "experience", "interests", "creator-benefits", "age-check"];
const small = await browser.newContext({ viewport: { width: 320, height: 640 } });
const sideways = [];
for (const name of PAGES) {
  const tab = await small.newPage();
  watch(tab, `320 ${name}`);
  for (const q of ["", "?state=code", "?state=handle-available"]) {
    if (q && name !== "sign-up") continue;
    await tab.goto(`${A}${name}.html${q}`);
    await tab.waitForTimeout(60);
    if (await tab.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || [...document.querySelectorAll(".phone *")].some((e) => e.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(e).position !== "fixed" && !e.closest(".otp__boxes, .auth-toast")))) sideways.push(name + q);
  }
  if (name === "sign-up") await tab.screenshot({ path: `${SHOTS}/onboarding-320-sign-up.png` });
  if (name === "interests") await tab.screenshot({ path: `${SHOTS}/onboarding-320-interests.png` });
  await tab.close();
}
check("phone: nothing sticks out at 320px wide", sideways.length === 0, sideways.join(" | "));
await small.close();

// Opening from disk, as someone double-clicking the file
const disk = await browser.newContext(phone);
p = await disk.newPage();
watch(p, "disk");
await p.goto(fileUrl("app/welcome.html"));
check("disk: welcome renders its icons", (await p.locator(".welcome__features svg").count()) === 3);
await p.click('a[href="sign-up.html"]');
await p.fill("#email", "alex@example.com");
await p.check("#terms");
await p.click("#step1 button[type=submit]");
await p.waitForSelector('[data-step="2"]:not([hidden])');
await typeCode(p, "123456");
await p.click("#step2 button[type=submit]");
await p.waitForSelector('[data-step="3"]:not([hidden])');
check("disk: sign up steps work from a file", p.url().startsWith("file:"));
await disk.close();

check("privacy: nothing is sent anywhere", posts.length === 0, posts.slice(0, 4).join(" | "));
check("no script errors", errors.length === 0, errors.slice(0, 6).join(" | "));

await browser.close();
server.close();
finish();
