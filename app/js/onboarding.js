// Onboarding screens. Nothing typed here is sent or stored: codes and passwords are checked
// in the page, and only the current step is kept in sessionStorage so a reload stays put.
// Reviewers can open any state with ?state=<name>; each screen lists its states below.
window.OB = window.OB || {};

OB.params = new URLSearchParams(location.search);
OB.state = OB.params.get("state") || "";
OB.EMAIL = /\S+@\S+\.\S+/;
OB.SAMPLE_EMAIL = "alex@example.com";
OB.wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
OB.$ = (sel, root = document) => root.querySelector(sel);
OB.$$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Accepts any six digits except 000000, which stands in for a wrong code.
OB.codeIsCorrect = (code) => /^\d{6}$/.test(code) && code !== "000000";
// Handles that stand in for ones already taken.
OB.TAKEN = ["taken", "admin", "ultrastream", ...US.CREATORS.map((c) => c.name.toLowerCase())];
OB.handleIsTaken = (h) => OB.TAKEN.includes(h.toLowerCase());

OB.go = (href, delay = 0) => setTimeout(() => { location.href = href; }, delay);

OB.storeStep = (key, step) => { try { sessionStorage.setItem(key, String(step)); } catch { /* storage blocked */ } };
OB.readStep = (key) => { try { return Number(sessionStorage.getItem(key)) || 0; } catch { return 0; } };
OB.clearStep = (key) => { try { sessionStorage.removeItem(key); } catch { /* storage blocked */ } };

// The app's message banner: top of the screen, an icon, the text and Dismiss. Goes after 3 seconds.
OB.toast = (message, type = "error") => {
  const phone = OB.$(".phone");
  OB.$(".auth-toast", phone)?.remove();
  clearTimeout(OB.toastTimer);
  const el = document.createElement("div");
  el.className = `auth-toast${type === "success" ? " auth-toast--success" : ""}`;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.innerHTML = `<i class="icon" data-lucide="${type === "success" ? "circle-check" : "circle-alert"}"></i>
    <span class="auth-toast__text">${US.esc(message)}</span>
    <button class="auth-toast__action" type="button">Dismiss</button>`;
  el.querySelector("button").addEventListener("click", () => el.remove());
  phone.append(el);
  // Reviewers opening a ?state= keep the banner on screen.
  if (!OB.state) OB.toastTimer = setTimeout(() => el.remove(), 3000);
  return el;
};
OB.clearToast = () => OB.$(".auth-toast")?.remove();

// Field errors: .field gets field--invalid and its .field__error shows the message.
OB.setError = (input, message) => {
  const field = input.closest(".field");
  const error = field.querySelector(".field__error");
  field.classList.toggle("field--invalid", Boolean(message));
  error.textContent = message || "";
  error.hidden = !message;
  input.setAttribute("aria-invalid", message ? "true" : "false");
};

// A button's busy look: spinner and new label. keepGradient matches buttons the app doesn't disable while loading.
OB.setBusy = (btn, busy, label, { keepGradient = false } = {}) => {
  if (!btn.dataset.label) btn.dataset.label = btn.textContent.trim();
  btn.classList.toggle("is-loading", busy && keepGradient);
  btn.disabled = busy;
  btn.setAttribute("aria-busy", busy ? "true" : "false");
  btn.innerHTML = busy ? `<i class="icon icon--spin" data-lucide="loader-circle"></i>${US.esc(label || btn.dataset.label)}` : US.esc(btn.dataset.label);
};

OB.setupPasswordToggles = (root = document) => {
  OB.$$("[data-toggle-password]", root).forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      btn.innerHTML = `<i class="icon" data-lucide="${show ? "eye-off" : "eye"}"></i>`;
    });
  });
};

// Six code boxes: typing moves on, Backspace on an empty box moves back, pasting fills them all.
OB.setupOtp = (root, onChange) => {
  const boxes = OB.$$(".otp__box", root);
  const paint = () => boxes.forEach((b) => b.classList.toggle("is-filled", b.value !== ""));
  boxes.forEach((box, i) => {
    box.addEventListener("input", () => {
      const digits = box.value.replace(/\D/g, "");
      if (digits.length > 1) {
        digits.slice(0, 6 - i).split("").forEach((d, j) => { boxes[i + j].value = d; });
        boxes[Math.min(i + digits.length, 5)].focus();
      } else {
        box.value = digits;
        if (digits && i < 5) boxes[i + 1].focus();
      }
      paint();
      onChange();
    });
    box.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !box.value && i > 0) {
        boxes[i - 1].value = "";
        boxes[i - 1].focus();
        paint();
        onChange();
      }
    });
    box.addEventListener("focus", () => box.select());
  });
  return {
    value: () => boxes.map((b) => b.value).join(""),
    fill: (code) => { boxes.forEach((b, i) => { b.value = code[i] || ""; }); paint(); },
    clear: () => { boxes.forEach((b) => { b.value = ""; }); paint(); },
    focus: () => boxes[0].focus(),
  };
};

OB.setOtpError = (root, message) => {
  root.classList.toggle("otp--invalid", Boolean(message));
  const error = OB.$(".otp__error", root);
  error.textContent = message || "";
  error.hidden = !message;
};

// "Resend in 59s", counting down once a second, then a tappable "Resend code".
OB.setupResend = (link, onResend) => {
  let left = 59;
  let timer = null;
  const paint = () => {
    link.textContent = left > 0 ? `Resend in ${left}s` : "Resend code";
    link.disabled = left > 0;
  };
  const start = (from = 59) => {
    clearInterval(timer);
    left = from;
    paint();
    if (left > 0) timer = setInterval(() => { left -= 1; paint(); if (left <= 0) clearInterval(timer); }, 1000);
  };
  link.addEventListener("click", () => { if (left === 0) { onResend(); start(); } });
  return { start, stop: () => clearInterval(timer) };
};

// Shows one [data-step] panel and hides the rest.
OB.showStep = (step) => {
  OB.$$("[data-step]").forEach((el) => { el.hidden = el.dataset.step !== String(step); });
  OB.$(".auth__scroll")?.scrollTo(0, 0);
};

// Apple sign-in only appears on iPhone. ?platform=android shows the Android version.
OB.applyPlatform = () => {
  if (OB.params.get("platform") === "android") OB.$$("[data-apple]").forEach((el) => el.remove());
};

/* ---------- Welcome ---------- */
OB.welcome = () => {
  // Review note: in the app this link does nothing yet.
  OB.$("#terms").addEventListener("click", () => US.toast("The app doesn't open anything here yet."));
};

/* ---------- Log in. States: errors, email-invalid, loading, wrong-password, google-account,
   apple-account, google-failed, apple-cancelled, reset-success ---------- */
OB.signIn = () => {
  OB.applyPlatform();
  OB.setupPasswordToggles();
  const form = OB.$("#form");
  const email = OB.$("#email");
  const password = OB.$("#password");
  const submit = OB.$("#submit");
  let submitted = false;
  let emailTouched = false;

  const errors = () => {
    const e = email.value.trim();
    return {
      email: !e ? "Email is required." : !OB.EMAIL.test(e) ? "Enter a valid email address." : "",
      password: password.value.length >= 8 ? "" : "Password must be at least 8 characters long.",
    };
  };
  // As in the app: email is checked once you leave it, password only after a first submit.
  const paint = () => {
    const err = errors();
    OB.setError(email, submitted || emailTouched ? err.email : "");
    OB.setError(password, submitted ? err.password : "");
    return err;
  };
  email.addEventListener("blur", () => { emailTouched = true; paint(); });
  [email, password].forEach((i) => i.addEventListener("input", () => { OB.clearToast(); paint(); }));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitted = true;
    const err = paint();
    if (err.email || err.password) return;
    OB.clearToast();
    OB.setBusy(submit, true, "Logging in...", { keepGradient: true });
    await OB.wait(900);
    const address = email.value.trim().toLowerCase();
    const problem = {
      "wrong@example.com": "Email and password don't match.",
      "google@example.com": "This account uses Google sign-in. Please continue with Google.",
      "apple@example.com": "This account uses Apple sign-in. Please continue with Apple.",
    }[address];
    if (problem) {
      OB.setBusy(submit, false);
      OB.toast(problem);
      return;
    }
    location.href = "discover.html";
  });

  // An existing account signs straight in. Google or Apple accounts without a handle go to choose-handle.html.
  OB.$$("[data-social]").forEach((btn) => btn.addEventListener("click", async () => {
    OB.$$("[data-social], #submit").forEach((b) => { b.disabled = true; });
    await OB.wait(700);
    location.href = "discover.html";
  }));

  const s = OB.state;
  if (s === "errors") form.requestSubmit();
  if (s === "email-invalid") { email.value = "alex@example"; emailTouched = true; paint(); }
  if (["loading", "wrong-password", "google-account", "apple-account"].includes(s)) {
    email.value = { "wrong-password": "wrong@example.com", "google-account": "google@example.com", "apple-account": "apple@example.com" }[s] || OB.SAMPLE_EMAIL;
    password.value = "password123";
  }
  if (s === "loading") OB.setBusy(submit, true, "Logging in...", { keepGradient: true });
  if (s === "wrong-password") OB.toast("Email and password don't match.");
  if (s === "google-account") OB.toast("This account uses Google sign-in. Please continue with Google.");
  if (s === "apple-account") OB.toast("This account uses Apple sign-in. Please continue with Apple.");
  if (s === "google-failed") OB.toast("We couldn't complete Google sign-in. Please try again.");
  if (s === "apple-cancelled") OB.toast("Apple sign-in was cancelled. You can try again when you are ready.");
  if (s === "reset-success") OB.toast("Your password has been reset. Please sign in.", "success");
};

/* ---------- Sign up. States: email-required, email-invalid, terms, email-exists, age-verified, under-18,
   google-failed, code, code-error, resend, password, password-short, password-mismatch,
   handle, handle-checking, handle-available, handle-taken, handle-short, confirming, failed ---------- */
OB.signUp = () => {
  OB.applyPlatform();
  OB.setupPasswordToggles();
  const KEY = "ob-signup-step";
  const email = OB.$("#email");
  const terms = OB.$("#terms");
  const termsError = OB.$("#terms-error");
  const password = OB.$("#password");
  const confirm = OB.$("#confirm");
  const handle = OB.$("#handle");
  const status = OB.$("#handle-status");
  const confirmBtn = OB.$("#confirm-handle");
  const otpRoot = OB.$("#otp");
  const touched = new Set();
  let step = 1;
  let handleState = null;
  let handleTimer = null;

  const go = (n) => {
    step = n;
    OB.showStep(n);
    OB.storeStep(KEY, n);
    if (n === 2) { OB.$("#sent-to").textContent = email.value.trim() || OB.SAMPLE_EMAIL; resend.start(); otp.focus(); }
    else resend.stop();
  };

  /* Step 1: email and terms */
  const setTermsError = (message) => {
    termsError.textContent = message || "";
    termsError.hidden = !message;
    terms.closest(".check").classList.toggle("is-invalid", Boolean(message));
  };
  // The app checks for an @ as you type, then the full pattern on Continue.
  email.addEventListener("input", () => {
    touched.add("email");
    OB.clearToast();
    OB.setError(email, email.value.includes("@") ? "" : "Enter a valid email address.");
  });
  terms.addEventListener("change", () => setTermsError(""));
  OB.$("#step1").addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = email.value.trim();
    if (!value) return OB.setError(email, "Email is required.");
    if (!OB.EMAIL.test(value)) return OB.setError(email, "Enter a valid email address.");
    if (!terms.checked) return setTermsError("To proceed, you must agree with terms here to continue.");
    OB.setError(email, "");
    setTermsError("");
    await OB.wait(400);
    if (value.toLowerCase() === "taken@example.com") return OB.toast("An account with this email already exists.");
    otp.clear();
    OB.setOtpError(otpRoot, "");
    go(2);
  });

  /* Step 2: code */
  const otp = OB.setupOtp(otpRoot, () => OB.setOtpError(otpRoot, ""));
  // As in the app, a new code clears the boxes and restarts the timer, with no message.
  const resend = OB.setupResend(OB.$("#resend"), () => { otp.clear(); otp.focus(); });
  OB.$("#step2").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!OB.codeIsCorrect(otp.value())) return OB.setOtpError(otpRoot, "That code is incorrect. Please try again.");
    await OB.wait(400);
    go(3);
  });
  OB.$("#change-email").addEventListener("click", () => go(1));

  /* Step 3: password. Like the app, errors update as you type once a field has been used. */
  const livePassword = () => {
    if (touched.has("password")) OB.setError(password, password.value.length >= 8 ? "" : "Password must be at least 8 characters long.");
    if (touched.has("confirm")) OB.setError(confirm, confirm.value === password.value ? "" : "Passwords do not match.");
  };
  password.addEventListener("input", () => { touched.add("password"); livePassword(); });
  confirm.addEventListener("input", () => { touched.add("confirm"); livePassword(); });
  OB.$("#step3").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!password.value) return OB.setError(password, "Password is required.");
    if (password.value.length < 8) return OB.setError(password, "Password must be at least 8 characters long.");
    if (password.value !== confirm.value) {
      OB.setError(password, "Passwords don't match.");
      OB.setError(confirm, "Passwords don't match.");
      return;
    }
    OB.setError(password, "");
    OB.setError(confirm, "");
    await OB.wait(400);
    go(4);
  });

  /* Step 4: handle. Only a-z, 0-9 and _ can be typed; availability is checked 0.6s after typing stops. */
  const paintStatus = () => {
    const show = handleState && handle.value.length >= 3 && !handle.closest(".field").classList.contains("field--invalid");
    status.hidden = !show;
    if (!show) return;
    status.className = `field__status field__status--${{ checking: "checking", available: "ok", taken: "bad" }[handleState]}`;
    status.innerHTML = {
      checking: "Checking availability...",
      available: `<i class="icon" data-lucide="circle-check"></i>${US.esc(handle.value)} is available`,
      taken: `<i class="icon" data-lucide="circle-x"></i>Username is already taken`,
    }[handleState];
  };
  const checkHandle = () => {
    clearTimeout(handleTimer);
    if (handle.value.length < 3) { handleState = null; paintStatus(); return; }
    handleState = "checking";
    paintStatus();
    handleTimer = setTimeout(() => { handleState = OB.handleIsTaken(handle.value) ? "taken" : "available"; paintStatus(); }, 600);
  };
  handle.addEventListener("input", () => {
    handle.value = handle.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    touched.add("handle");
    OB.setError(handle, handle.value.trim() ? "" : "Username is required.");
    checkHandle();
  });
  OB.$("#step4").addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = handle.value;
    if (!value.trim()) return OB.setError(handle, "Username is required.");
    if (value.length < 3) { OB.setError(handle, "Username must be at least 3 characters."); return paintStatus(); }
    if (handleState === "taken") { OB.setError(handle, "This username is already taken."); return paintStatus(); }
    OB.setError(handle, "");
    OB.setBusy(confirmBtn, true, "Confirming...");
    await OB.wait(900);
    OB.clearStep(KEY);
    location.href = "experience.html";
  });

  /* Back: steps 1, 3 and 4 have Go back. Step 1 returns to Welcome. */
  OB.$$("[data-back]").forEach((b) => b.addEventListener("click", () => (step > 1 ? go(step - 1) : (location.href = "welcome.html"))));

  // Google or Apple: a new account chooses a handle next.
  OB.$$("[data-social]").forEach((btn) => btn.addEventListener("click", async () => {
    OB.$$("[data-social]").forEach((b) => { b.disabled = true; });
    await OB.wait(700);
    location.href = `choose-handle.html?provider=${btn.dataset.social}`;
  }));

  /* States */
  const s = OB.state;
  const fillTo = (n) => {
    email.value = OB.SAMPLE_EMAIL;
    terms.checked = true;
    if (n >= 4) { password.value = confirm.value = "password123"; }
    go(n);
  };
  const steps = { code: 2, "code-error": 2, resend: 2, password: 3, "password-short": 3, "password-mismatch": 3, handle: 4, "handle-checking": 4, "handle-available": 4, "handle-taken": 4, "handle-short": 4, confirming: 4, failed: 4 };
  if (steps[s]) fillTo(steps[s]);
  else if (!s && OB.readStep(KEY) > 1) fillTo(OB.readStep(KEY));
  else go(1);

  if (s === "email-required") OB.$("#step1").requestSubmit();
  if (s === "email-invalid") { email.value = "alex@example"; OB.setError(email, "Enter a valid email address."); }
  if (s === "terms") { email.value = OB.SAMPLE_EMAIL; OB.$("#step1").requestSubmit(); }
  if (s === "email-exists") { email.value = "taken@example.com"; terms.checked = true; OB.toast("An account with this email already exists."); }
  // From the design file: the result of the age check, shown on this screen.
  if (s === "age-verified") OB.toast("Your age is verified, you are 18+", "success");
  if (s === "under-18") OB.toast("You must be 18 or older to use this feature.");
  if (s === "google-failed") OB.toast("We couldn't complete Google sign-in. Please try again.");
  if (s === "code-error") { otp.fill("000000"); OB.setOtpError(otpRoot, "That code is incorrect. Please try again."); }
  if (s === "resend") resend.start(0);
  if (s === "password-short") { password.value = "pass"; touched.add("password"); livePassword(); }
  if (s === "password-mismatch") { password.value = "password123"; confirm.value = "password124"; OB.$("#step3").requestSubmit(); }
  const handleSample = { "handle-checking": "kingpin99", "handle-available": "kingpin99", "handle-taken": "pixelforge", "handle-short": "ab", confirming: "kingpin99", failed: "kingpin99" }[s];
  if (handleSample) {
    handle.value = handleSample;
    clearTimeout(handleTimer);
    handleState = s === "handle-checking" ? "checking" : s === "handle-taken" ? "taken" : s === "handle-short" ? null : "available";
    if (s === "handle-short") OB.$("#step4").requestSubmit();
    paintStatus();
  }
  if (s === "confirming") OB.setBusy(confirmBtn, true, "Confirming...");
  if (s === "failed") OB.toast("Registration failed. Please try again.");
};

/* ---------- Forgot password. States: email-required, email-invalid, sending, send-failed,
   code, code-error, verifying, resend, reset, reset-required, reset-short, reset-mismatch, resetting ---------- */
OB.forgot = () => {
  OB.setupPasswordToggles();
  const KEY = "ob-forgot-step";
  const email = OB.$("#email");
  const password = OB.$("#password");
  const confirm = OB.$("#confirm");
  const otpRoot = OB.$("#otp");
  const sendBtn = OB.$("#send");
  const verifyBtn = OB.$("#verify");
  const resetBtn = OB.$("#reset");
  let step = 1;

  const go = (n) => {
    step = n;
    OB.showStep(n);
    OB.storeStep(KEY, n);
    OB.$("#back-bottom").hidden = n !== 3;
    if (n === 2) { OB.$("#sent-to").textContent = email.value.trim() || OB.SAMPLE_EMAIL; resend.start(); otp.focus(); }
    else resend.stop();
  };

  // Errors appear on Continue and clear as soon as you type.
  email.addEventListener("input", () => { OB.setError(email, ""); OB.clearToast(); });
  OB.$("#step1").addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = email.value.trim();
    if (!value) return OB.setError(email, "Email is required.");
    if (!OB.EMAIL.test(value)) return OB.setError(email, "Enter a valid email address.");
    OB.setBusy(sendBtn, true);
    await OB.wait(700);
    OB.setBusy(sendBtn, false);
    otp.clear();
    OB.setOtpError(otpRoot, "");
    go(2);
  });

  const otp = OB.setupOtp(otpRoot, () => OB.setOtpError(otpRoot, ""));
  // As in the app, a new code clears the boxes and restarts the timer, with no message.
  const resend = OB.setupResend(OB.$("#resend"), () => { otp.clear(); otp.focus(); });
  OB.$("#step2").addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = otp.value();
    if (code.length < 6) return OB.setOtpError(otpRoot, "That code is incorrect. Please try again.");
    OB.setBusy(verifyBtn, true);
    await OB.wait(700);
    OB.setBusy(verifyBtn, false);
    if (!OB.codeIsCorrect(code)) return OB.setOtpError(otpRoot, "That code is incorrect. Please try again.");
    go(3);
  });
  OB.$("#change-email").addEventListener("click", () => go(1));

  password.addEventListener("input", () => OB.setError(password, ""));
  confirm.addEventListener("input", () => OB.setError(confirm, ""));
  OB.$("#step3").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!password.value) return OB.setError(password, "Password is required.");
    if (password.value.length < 8) return OB.setError(password, "Password must be at least 8 characters long.");
    if (password.value !== confirm.value) {
      OB.setError(password, "Passwords don't match.");
      OB.setError(confirm, "Passwords don't match.");
      return;
    }
    OB.setBusy(resetBtn, true);
    await OB.wait(800);
    OB.clearStep(KEY);
    location.href = "sign-in.html?state=reset-success";
  });

  OB.$$("[data-back]").forEach((b) => b.addEventListener("click", () => (step > 1 ? go(step - 1) : (location.href = "sign-in.html"))));

  const s = OB.state;
  const steps = { code: 2, "code-error": 2, verifying: 2, resend: 2, reset: 3, "reset-required": 3, "reset-short": 3, "reset-mismatch": 3, resetting: 3 };
  if (steps[s] || (!s && OB.readStep(KEY) > 1)) { email.value = OB.SAMPLE_EMAIL; go(steps[s] || OB.readStep(KEY)); }
  else go(1);

  if (s === "email-required") OB.$("#step1").requestSubmit();
  if (s === "email-invalid") { email.value = "alex@example"; OB.$("#step1").requestSubmit(); }
  if (s === "sending" || s === "send-failed") email.value = OB.SAMPLE_EMAIL;
  if (s === "sending") OB.setBusy(sendBtn, true);
  if (s === "send-failed") OB.toast("Failed to send verification code.");
  if (s === "code-error") { otp.fill("000000"); OB.setOtpError(otpRoot, "That code is incorrect. Please try again."); }
  if (s === "verifying") { otp.fill("482913"); OB.setBusy(verifyBtn, true); }
  if (s === "resend") resend.start(0);
  if (s === "reset-required") OB.$("#step3").requestSubmit();
  if (s === "reset-short") { password.value = "pass"; OB.$("#step3").requestSubmit(); }
  if (s === "reset-mismatch") { password.value = "password123"; confirm.value = "password124"; OB.$("#step3").requestSubmit(); }
  if (s === "resetting") { password.value = confirm.value = "password123"; OB.setBusy(resetBtn, true); }
};

/* ---------- Choose handle after Google or Apple. ?provider=google|apple
   States: required, short, invalid, taken, loading, failed ---------- */
OB.chooseHandle = () => {
  const handle = OB.$("#handle");
  const submit = OB.$("#submit");
  const provider = OB.params.get("provider") === "apple" ? "apple" : "google";
  OB.$("#email-line").textContent = `Email: ${provider === "apple" ? "alex@privaterelay.example" : OB.SAMPLE_EMAIL}`;
  let error = "";

  const validate = (v) => {
    if (!v.trim()) return "Username is required";
    if (v.length < 3) return "Username must be at least 3 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return "Username can only contain letters, numbers, and underscores";
    return "";
  };
  const set = (message) => { error = message; OB.setError(handle, message); };
  // The app checks availability on every change once the handle is valid, and says nothing when it's free.
  const check = () => {
    const taken = !error && handle.value && OB.handleIsTaken(handle.value);
    submit.disabled = Boolean(taken);
    if (taken) set("Username already taken");
  };
  handle.addEventListener("input", () => {
    OB.clearToast();
    submit.disabled = false;
    if (error) set(validate(handle.value));
    check();
  });
  OB.$("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = validate(handle.value);
    if (message) return set(message);
    if (OB.handleIsTaken(handle.value)) return set("Username already taken");
    OB.setBusy(submit, true, "Continue", { keepGradient: true });
    await OB.wait(900);
    location.href = "experience.html";
  });

  const s = OB.state;
  const sample = { short: "ab", invalid: "king pin", taken: "pixelforge", loading: "kingpin99", failed: "kingpin99" }[s];
  if (s === "required" || s === "short" || s === "invalid") { handle.value = sample || ""; OB.$("#form").requestSubmit(); }
  if (s === "taken") { handle.value = sample; check(); }
  if (s === "loading") { handle.value = sample; OB.setBusy(submit, true, "Continue", { keepGradient: true }); }
  if (s === "failed") { handle.value = sample; OB.toast("Something went wrong. Please try again."); }
};

/* ---------- Experience type. ?from=settings shows the version opened from Settings.
   States: saving, error ---------- */
OB.experience = () => {
  const fromSettings = OB.params.get("from") === "settings";
  OB.$$("[data-onboarding]").forEach((el) => { el.hidden = fromSettings; });
  OB.$$("[data-settings]").forEach((el) => { el.hidden = !fromSettings; });
  const cards = OB.$$(".choice");
  const errorEl = OB.$("#error");
  const btn = OB.$("#continue");
  cards.forEach((card) => card.addEventListener("click", () => {
    cards.forEach((c) => c.setAttribute("aria-checked", String(c === card)));
    errorEl.hidden = true;
  }));
  btn.addEventListener("click", async () => {
    errorEl.hidden = true;
    OB.setBusy(btn, true);
    await OB.wait(800);
    location.href = "interests.html";
  });
  if (OB.state === "saving") OB.setBusy(btn, true);
  if (OB.state === "error") errorEl.hidden = false;
};

/* ---------- Interests. States: loading, error, selected, saving, save-error ---------- */
OB.interests = () => {
  const grid = OB.$("#grid");
  const btn = OB.$("#continue");
  const loading = OB.$("#loading");
  const failed = OB.$("#failed");
  const saveError = OB.$("#save-error");
  const picked = new Set();

  const update = () => {
    OB.$$(".chip", grid).forEach((c) => c.setAttribute("aria-pressed", String(picked.has(c.dataset.id))));
    btn.disabled = picked.size < 3;
  };
  const render = () => {
    loading.hidden = true;
    failed.hidden = true;
    grid.hidden = false;
    grid.innerHTML = US.CATEGORIES.map((c) => `<button class="chip" type="button" data-id="${c.toLowerCase()}" aria-pressed="false" title="${c}">${c}</button>`).join("");
    update();
  };
  const load = async (fail = false) => {
    grid.hidden = true;
    failed.hidden = true;
    loading.hidden = false;
    btn.disabled = true;
    if (OB.state === "loading") return;
    if (!fail) await OB.wait(500);
    if (fail) { loading.hidden = true; failed.hidden = false; return; }
    render();
  };
  grid.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    saveError.hidden = true;
    picked.has(chip.dataset.id) ? picked.delete(chip.dataset.id) : picked.add(chip.dataset.id);
    update();
  });
  OB.$("#retry").addEventListener("click", () => load());
  btn.addEventListener("click", async () => {
    if (picked.size < 3) return;
    saveError.hidden = true;
    OB.setBusy(btn, true);
    await OB.wait(800);
    location.href = "discover.html";
  });

  const s = OB.state;
  if (s === "loading" || s === "error") { load(s === "error"); return; }
  render();
  if (["selected", "saving", "save-error"].includes(s)) { ["gaming", "music", "tech"].forEach((id) => picked.add(id)); update(); }
  if (s === "saving") OB.setBusy(btn, true);
  if (s === "save-error") saveError.hidden = false;
};

/* ---------- Age check (from the design file; the app has no age check screen yet).
   ?result=under-18 ends on the under-18 message. States: checking ---------- */
OB.ageCheck = () => {
  const btn = OB.$("#selfie");
  const oval = OB.$("#oval");
  const hint = OB.$("#hint");
  const checking = () => {
    oval.innerHTML = `<i class="icon icon--spin" data-lucide="loader-circle"></i>`;
    hint.textContent = "Checking your selfie...";
    OB.setBusy(btn, true, "Take Selfie");
  };
  btn.addEventListener("click", async () => {
    checking();
    await OB.wait(1200);
    location.href = `sign-up.html?state=${OB.params.get("result") === "under-18" ? "under-18" : "age-verified"}`;
  });
  if (OB.state === "checking") checking();
};

OB[document.body.dataset.screen]?.();
