// Profile and settings screens. Each page sets <body data-screen="...">, and ?state=<name> opens a state directly.
(function () {
  const params = new URLSearchParams(location.search);
  const STATE = params.get("state") || "";
  const AS = params.get("as") || "";
  const phone = document.querySelector(".phone");
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = US.esc;

  // The signed-in person, all fictional. They have no profile picture, so avatars show the app's no-picture look.
  const ME = { username: "nova.lane", email: "nova.lane@example.com" };
  const CHANNEL = { name: "Nova Lane", handle: "novalane" };

  // Carry ?as=creator between the profile screens so the creator version stays on.
  if (AS) {
    document.querySelectorAll("a[data-keep-as]").forEach((a) => {
      const [path, query] = a.getAttribute("href").split("?");
      const q = new URLSearchParams(query);
      q.set("as", AS);
      a.setAttribute("href", `${path}?${q}`);
    });
  }

  // ---------- Dialogs and sheets ----------
  let openLayer = null;
  function closeLayer() {
    if (!openLayer) return;
    openLayer.el.remove();
    const back = openLayer.returnFocus;
    openLayer = null;
    if (back && document.contains(back)) back.focus();
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openLayer) closeLayer();
  });

  function mountLayer(el) {
    closeLayer();
    openLayer = { el, returnFocus: document.activeElement };
    phone.append(el);
    el.addEventListener("click", (e) => {
      if (e.target === el || e.target.closest("[data-close]")) closeLayer();
    });
    (el.querySelector("[data-autofocus]") || el.querySelector("button, input, a"))?.focus();
  }

  // A confirmation in the app's style: close X, bold title, one line, gradient confirm, outlined Cancel.
  function dialog({ title, text = "", body = "", confirm, cancel = "Cancel", onConfirm, id = "dialog" }) {
    const el = document.createElement("div");
    el.className = "dialog-backdrop";
    el.innerHTML = `<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="${id}-title" id="${id}">
      <button class="icon-btn dialog__close" type="button" aria-label="Close" data-close><i class="icon" data-lucide="x"></i></button>
      <h2 class="dialog__title" id="${id}-title">${esc(title)}</h2>
      ${text ? `<p class="dialog__text">${esc(text)}</p>` : ""}
      ${body}
      ${confirm ? `<button class="btn btn--primary" type="button" data-confirm data-autofocus>${esc(confirm)}</button>` : ""}
      ${cancel ? `<button class="btn" type="button" data-close>${esc(cancel)}</button>` : ""}
    </div>`;
    mountLayer(el);
    el.querySelector("[data-confirm]")?.addEventListener("click", () => {
      closeLayer();
      if (onConfirm) onConfirm();
    });
    return el;
  }

  function sheet(title, html, id = "sheet") {
    const el = document.createElement("div");
    el.className = "sheet-backdrop";
    el.innerHTML = `<div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="${id}-title" id="${id}">
      <div class="sheet-panel__handle"></div>
      <div class="pr-sheet-head"><h2 id="${id}-title">${esc(title)}</h2><button class="icon-btn" type="button" aria-label="Close" data-close><i class="icon" data-lucide="x"></i></button></div>
      ${html}
    </div>`;
    mountLayer(el);
    return el;
  }

  // ---------- Watch history ----------
  // Videos and live recordings the person watched, newest first. The first one is live.
  const HISTORY = US.CONTENT.filter((c) => c.kind === "video");

  function historyCardHTML(item) {
    const href = item.live ? "watch.html?live=1" : `watch.html?id=${item.id}`;
    const badges = item.live
      ? `<span class="pr-badge pr-badge--left"><i class="icon" data-lucide="radio"></i>Live</span><span class="pr-badge pr-badge--right"><i class="icon" data-lucide="eye"></i>12.5K</span>`
      : "";
    return `<a class="card" href="${href}">
      <span class="card__thumb" style="${US.thumbStyle(item)}">${badges}</span>
      <span class="card__row">
        ${US.avatarHTML(item.channel)}
        <span class="card__info">
          <span class="card__title">${esc(item.title)}</span>
          <span class="card__sub">${esc(item.channel)} • ${item.views} views • ${item.age}</span>
        </span>
      </span>
    </a>`;
  }

  // The app's small spinner, as on the Profile tab while history loads.
  const spinner = (label) => `<div class="pr-loader" role="status" aria-label="${label}">${US.spinnerHTML("")}</div>`;

  // ---------- Rewards ----------
  const GIFTS = { Rose: { value: 1, hue: 350 }, Teddy: { value: 5, hue: 28 }, Star: { value: 10, hue: 48 } };
  const giftDot = (name, size = "") => `<span class="pr-gift ${size}" style="background:linear-gradient(135deg,hsl(${GIFTS[name].hue} 80% 65%),hsl(${(GIFTS[name].hue + 40) % 360} 70% 40%))" aria-hidden="true"></span>`;
  const ACTIVITY_ICONS = { video: ["video", "On a video"], live: ["radio", "During a live stream"], profile: ["user-round", "On a profile"] };
  const activity = (user, hue, gifts, kind, date, time, creator) => ({ user, hue, gifts, kind, date, time, creator, amount: gifts.reduce((s, [g, q]) => s + GIFTS[g].value * q, 0) });
  const REWARDS = {
    earned: [
      activity("mira.k", 20, [["Star", 10]], "video", "Oct 28, 2026", "10:32 PM"),
      activity("jonahplays", 200, [["Teddy", 5]], "live", "Oct 27, 2026", "8:14 PM"),
      activity("tessa.w", 300, [["Rose", 10]], "profile", "Oct 25, 2026", "6:05 PM"),
      activity("mira.k", 20, [["Star", 2], ["Teddy", 4], ["Rose", 5]], "profile", "Oct 21, 2026", "9:47 AM"),
    ],
    contributions: [
      activity("pixelforge", 0, [["Teddy", 3]], "live", "Oct 26, 2026", "7:20 PM", "PixelForge"),
      activity("loophouse", 0, [["Rose", 15]], "video", "Oct 24, 2026", "11:02 AM", "LoopHouse"),
      activity("streetplate", 0, [["Star", 1], ["Rose", 5]], "profile", "Oct 19, 2026", "3:41 PM", "StreetPlate"),
    ],
  };
  const total = (list) => list.reduce((s, a) => s + a.amount, 0);
  // The profile card formats amounts like the app: "$ 180", trailing zeros dropped.
  const cardAmount = (n) => `$ ${parseFloat(n.toFixed(2))}`;

  // ---------- Screens ----------
  const screens = {};

  screens.profile = () => {
    const creator = AS === "creator";
    const noChannel = creator && STATE === "no-channel";
    const hasChannel = creator && !noChannel;
    const cards = [];
    if (hasChannel) {
      cards.push(`<a class="pr-reward" href="reward-activities.html" id="reward-card">
        <span class="pr-reward__head"><span class="pr-reward__title">Reward Activities</span><i class="icon" data-lucide="chevron-right"></i></span>
        <span class="pr-reward__stats">
          <span class="pr-reward__stat"><span class="pr-reward__label"><i class="icon" data-lucide="trending-up"></i>Earned</span><span class="pr-reward__value">${cardAmount(total(REWARDS.earned))}</span></span>
          <span class="pr-reward__stat"><span class="pr-reward__label"><i class="icon" data-lucide="hand-coins"></i>Contributions</span><span class="pr-reward__value">${cardAmount(total(REWARDS.contributions))}</span></span>
        </span>
      </a>`);
      cards.push(`<a class="pr-channel" href="ultra-studio.html" id="channel-card">
        ${US.avatarHTML(CHANNEL.name, "avatar--56")}
        <span class="pr-channel__text"><span class="pr-channel__name">${esc(CHANNEL.name)}</span><span class="pr-channel__handle">@${CHANNEL.handle}</span><span class="pr-channel__manage">Manage channel</span></span>
        <i class="icon" data-lucide="chevron-right"></i>
      </a>`);
    } else {
      // A creator without a channel goes to set one up; a viewer goes to the Create tab.
      cards.push(`<a class="box pr-promo" href="${noChannel ? "create-channel.html" : "create.html"}" id="creator-card">
        <span class="pr-promo__head"><i class="icon" data-lucide="file-video"></i><span class="pr-promo__title">${noChannel ? "Ultra studio" : "Become a Creator"}</span></span>
        <p class="pr-promo__text">Start uploading content and earn rewards from your audience.</p>
      </a>`);
    }
    cards.push(`<div class="box pr-promo" aria-disabled="true" id="advertiser-card">
      <span class="pr-promo__head"><i class="icon" data-lucide="megaphone"></i><span class="pr-promo__title">Become an Advertiser <span class="pr-promo__soon">(coming soon)</span></span></span>
      <p class="pr-promo__text">Promote your content/product to a wider audience on UltraStream.</p>
    </div>`);

    let history;
    if (STATE === "loading") history = spinner("Loading watch history");
    else if (STATE === "empty") {
      history = `<div class="pr-history-empty" id="history-empty">
        <i class="icon" data-lucide="history"></i>
        <h3 class="pr-history-empty__title">No watch history yet</h3>
        <p class="pr-history-empty__text">Videos you watch will appear here.</p>
      </div>`;
    } else history = `<div class="pr-history">${HISTORY.slice(0, 10).map(historyCardHTML).join("")}</div>`;

    $("#profile").innerHTML = `
      <div class="pr-user">
        ${US.avatarHTML(ME.username, "avatar--56")}
        <span class="pr-user__name">${esc(ME.username)}</span>
      </div>
      <div class="pr-cards">${cards.join("")}</div>
      <div class="pr-section-head">
        <h2 class="pr-section-head__title">Watch History</h2>
        <a class="pr-section-head__link" href="watch-history.html${STATE === "empty" ? "?state=empty" : ""}">View all</a>
      </div>
      ${history}`;
  };

  screens.settings = () => {
    const logout = () => dialog({ id: "logout-dialog", title: "Log out?", text: "Are you sure you want to log out?", confirm: "Yes", onConfirm: () => (location.href = "welcome.html") });
    $("#logout").addEventListener("click", logout);
    if (STATE === "logout") logout();
  };

  screens["edit-profile"] = () => {
    const TAKEN = new Set(["admin", "ultrastream", "taken", ...US.CREATORS.map((c) => c.name.toLowerCase())]);
    const s = { original: ME.username, username: ME.username, status: "idle", originalEmail: ME.email, email: ME.email, photo: false };
    const form = $("#edit-form");
    const code = $("#email-code");
    const user = $("#username");
    const email = $("#email");
    let timer = 0;
    let requestId = 0;

    const strip = (v) => v.replace(/^@+/, "").trim();
    const validEmail = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim());

    // This screen draws its own avatar in the app: grey with a person icon when there's no picture.
    // A picked photo shows as a plain gradient, standing in for the picture.
    function renderAvatar() {
      $("#avatar").outerHTML = s.photo
        ? `<span class="pr-avatar pr-avatar--72 pr-avatar--photo" id="avatar" role="img" aria-label="Profile photo"></span>`
        : `<span class="pr-avatar pr-avatar--72 pr-avatar--empty" id="avatar" role="img" aria-label="No profile photo"><i class="icon" data-lucide="user-round"></i></span>`;
    }

    function renderUsername() {
      const changed = s.username !== s.original;
      const helper = $("#username-helper");
      let cls = "pr-helper--warn";
      let text = "If you change your username, you won't be able to change it again for 30 days.";
      if (changed && s.status === "checking") [cls, text] = ["", "Checking availability..."];
      else if (changed && s.status === "available") [cls, text] = ["pr-helper--ok", `${s.username} is available!`];
      else if (changed && s.status === "unavailable") [cls, text] = ["pr-helper--error", "Username is taken"];
      helper.className = `pr-helper ${cls}`;
      helper.textContent = text;
      user.setAttribute("aria-invalid", String(changed && s.status === "unavailable"));
      const btn = $("#change-username");
      btn.hidden = !changed;
      btn.disabled = s.status === "unavailable";
    }

    function renderEmail() {
      const btn = $("#change-email");
      btn.hidden = s.email.trim() === s.originalEmail;
      btn.disabled = !validEmail();
    }

    // Stands in for the availability check: names in TAKEN are taken, anything else of 3+ characters is free.
    function check(now) {
      return new Promise((resolve) => {
        if (s.username.length < 3) { s.status = "idle"; renderUsername(); return resolve(false); }
        const id = ++requestId;
        s.status = "checking";
        renderUsername();
        setTimeout(() => {
          if (id !== requestId) return resolve(false);
          s.status = TAKEN.has(s.username.toLowerCase()) ? "unavailable" : "available";
          renderUsername();
          resolve(s.status === "available");
        }, now ? 0 : 400);
      });
    }

    user.addEventListener("input", () => {
      s.username = strip(user.value);
      if (user.value !== s.username) user.value = s.username;
      s.status = "idle";
      requestId += 1;
      renderUsername();
      clearTimeout(timer);
      if (s.username !== s.original && s.username.length >= 3) timer = setTimeout(() => check(), 500);
    });
    email.addEventListener("input", () => { s.email = email.value; renderEmail(); });

    // After saving, the app shows the phone's alert and goes back when you tap OK.
    const goBack = () => { location.href = $("#code-back").getAttribute("href"); };
    const savedAlert = (message) => US.alert("Success", message, [{ text: "OK", onPress: goBack }]);
    const confirmUsername = () => dialog({
      id: "username-dialog", title: "Change username?", text: "Are you sure you want to change your username?", confirm: "Yes",
      onConfirm: () => { s.original = s.username; s.status = "idle"; renderUsername(); savedAlert("Username updated successfully"); },
    });
    $("#change-username").addEventListener("click", async () => {
      if (s.status === "unavailable") return;
      if (s.status !== "available" && !(await check(true))) return;
      confirmUsername();
    });

    // Email change: confirm, then enter the 6-digit code sent to the new address.
    const boxes = [...code.querySelectorAll(".pr-code__box")];
    let countdown = 0;
    function startResend() {
      let left = 59;
      const btn = $("#resend");
      clearInterval(countdown);
      btn.disabled = true;
      btn.textContent = `Resend in ${left}s`;
      countdown = setInterval(() => {
        left -= 1;
        if (left <= 0) { clearInterval(countdown); btn.disabled = false; btn.textContent = "Resend code"; return; }
        btn.textContent = `Resend in ${left}s`;
      }, 1000);
    }
    function showCode() {
      form.hidden = true;
      $("#edit-bottom").hidden = true;
      code.hidden = false;
      $("#code-email").textContent = s.email.trim();
      $("#edit-title").textContent = "Verify email";
      boxes.forEach((b) => (b.value = ""));
      $("#verify").disabled = true;
      startResend();
      boxes[0].focus();
    }
    function showForm() {
      clearInterval(countdown);
      code.hidden = true;
      form.hidden = false;
      $("#edit-bottom").hidden = false;
      $("#edit-title").textContent = "Edit Profile";
    }
    const confirmEmail = () => dialog({ id: "email-dialog", title: "Change email?", text: "Are you sure you want to change your email?", confirm: "Yes", onConfirm: showCode });
    $("#change-email").addEventListener("click", confirmEmail);
    boxes.forEach((box, i) => {
      box.addEventListener("input", () => {
        box.value = box.value.replace(/\D/g, "").slice(-1);
        if (box.value && boxes[i + 1]) boxes[i + 1].focus();
        $("#verify").disabled = boxes.some((b) => !b.value);
      });
      box.addEventListener("keydown", (e) => { if (e.key === "Backspace" && !box.value && boxes[i - 1]) boxes[i - 1].focus(); });
      box.addEventListener("paste", (e) => {
        const digits = (e.clipboardData.getData("text").match(/\d/g) || []).slice(0, 6);
        if (!digits.length) return;
        e.preventDefault();
        boxes.forEach((b, j) => (b.value = digits[j] || ""));
        $("#verify").disabled = digits.length < 6;
        boxes[Math.min(digits.length, 5)].focus();
      });
    });
    // A new code restarts the timer with no message, as on the app's other code screens.
    $("#resend").addEventListener("click", () => { startResend(); });
    $("#verify").addEventListener("click", () => {
      s.originalEmail = s.email.trim();
      showForm();
      renderEmail();
      savedAlert("Email updated successfully");
    });
    $("#change-it").addEventListener("click", () => { showForm(); email.focus(); });
    $("#code-back").addEventListener("click", (e) => {
      if (code.hidden) return;
      e.preventDefault();
      showForm();
    });

    // Photo
    const pickPhoto = () => {
      const el = sheet("Change Profile Photo", `
        <button class="pr-sheet-row" type="button" data-photo="camera"><span class="pr-sheet-row__icon"><i class="icon" data-lucide="camera"></i></span><span class="pr-sheet-row__label">Take Photo</span><i class="icon" data-lucide="chevron-right"></i></button>
        <button class="pr-sheet-row" type="button" data-photo="library"><span class="pr-sheet-row__icon"><i class="icon" data-lucide="images"></i></span><span class="pr-sheet-row__label">Choose from Library</span><i class="icon" data-lucide="chevron-right"></i></button>
        <div class="pr-sheet-divider"></div>
        <button class="pr-sheet-row pr-sheet-row--danger" type="button" data-photo="remove"><span class="pr-sheet-row__icon"><i class="icon" data-lucide="trash-2"></i></span><span class="pr-sheet-row__label">Remove Profile Picture</span></button>`, "photo-sheet");
      el.addEventListener("click", (e) => {
        const kind = e.target.closest("[data-photo]")?.dataset.photo;
        if (!kind) return;
        closeLayer();
        s.photo = kind !== "remove";
        renderAvatar();
        // Review note: the app uploads the photo straight away, with no message.
        if (s.photo) US.toast("Photos aren't uploaded in this prototype.");
      });
    };
    $("#upload-photo").addEventListener("click", pickPhoto);
    $("#remove-photo").addEventListener("click", () => { s.photo = false; renderAvatar(); });

    // Delete account
    // The app confirms with the phone's alert, then signs out.
    const deleted = () => US.alert("Account deleted", "Your account has been deleted successfully.", [{ text: "OK", onPress: () => (location.href = "welcome.html") }]);
    const confirmDelete = () => dialog({ id: "delete-dialog", title: "Delete account?", text: "This action cannot be undone. Your account will be permanently deleted.", confirm: "Delete account", onConfirm: deleted });
    $("#delete-account").addEventListener("click", confirmDelete);

    // States
    const setUsername = (v) => { user.value = v; s.username = v; };
    const setEmail = (v) => { email.value = v; s.email = v; };
    user.value = s.username;
    email.value = s.email;
    if (STATE.startsWith("username-")) {
      setUsername(STATE === "username-taken" ? "pixelforge" : "nova.streams");
      s.status = { "username-checking": "checking", "username-taken": "unavailable" }[STATE] || "available";
    }
    if (STATE.startsWith("email-")) setEmail("nova.streams@example.com");
    renderUsername();
    renderEmail();
    if (STATE === "username-confirm") confirmUsername();
    if (STATE === "email-confirm") confirmEmail();
    if (STATE === "email-code") showCode();
    if (STATE === "photo") pickPhoto();
    if (STATE === "no-photo") { s.photo = false; renderAvatar(); }
    if (STATE === "delete") confirmDelete();
    if (STATE === "deleted") deleted();
  };

  screens["change-password"] = () => {
    const f = { current: $("#current"), next: $("#new"), confirm: $("#confirm") };
    const NEW_HELP = "Minimum 8 characters";

    function setError(key, message) {
      const input = f[key];
      const helper = $(`#${input.id}-msg`);
      input.setAttribute("aria-invalid", String(Boolean(message)));
      if (message) { helper.textContent = message; helper.className = "pr-helper pr-helper--error"; helper.hidden = false; }
      else if (key === "next") { helper.textContent = NEW_HELP; helper.className = "pr-helper"; helper.hidden = false; }
      else { helper.textContent = ""; helper.hidden = true; }
    }

    // Same checks, in the same order, as the app.
    function validate() {
      const c = f.current.value;
      const n = f.next.value;
      const k = f.confirm.value;
      const e = {};
      if (!c.trim()) e.current = "Current password is required";
      if (!n.trim()) e.next = "New password is required";
      else if (n.length < 8) e.next = "Password must be at least 8 characters";
      if (!k.trim()) e.confirm = "Please confirm your new password";
      else if (k !== n) e.confirm = "Passwords do not match";
      if (c && n && c === n) e.next = "New password must be different from current password";
      Object.keys(f).forEach((key) => setError(key, e[key]));
      return Object.keys(e).length === 0;
    }

    Object.entries(f).forEach(([key, input]) => input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") === "true") setError(key, "");
    }));
    document.querySelectorAll("[data-reveal]").forEach((btn) => btn.addEventListener("click", () => {
      const input = $("#" + btn.dataset.reveal);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      btn.innerHTML = `<i class="icon" data-lucide="${show ? "eye-off" : "eye"}"></i>`;
    }));

    // The app confirms with the phone's alert, then signs out.
    const success = () => US.alert("Password updated", "Your password has been updated. Please sign in again with your new password.", [
      { text: "OK", onPress: () => (location.href = "welcome.html") },
    ]);
    $("#password-form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) return;
      const btn = $("#update");
      btn.disabled = true;
      btn.innerHTML = `<i class="icon icon--spin" data-lucide="loader-circle"></i>Updating...`;
      // Nothing is sent or kept: the fields are cleared once the demo "update" finishes.
      setTimeout(() => {
        Object.values(f).forEach((i) => (i.value = ""));
        btn.disabled = false;
        btn.textContent = "Update Password";
        success();
      }, 600);
    });

    // Sample values for the states. They live only in the page.
    const fill = (c, n, k) => { f.current.value = c; f.next.value = n; f.confirm.value = k; };
    if (STATE === "errors") validate();
    if (STATE === "too-short") { fill("sample-pass", "short", "short"); validate(); }
    if (STATE === "mismatch") { fill("sample-pass", "new-sample-pass", "new-sample-pas"); validate(); }
    if (STATE === "same") { fill("sample-pass", "sample-pass", "sample-pass"); validate(); }
    if (STATE === "success") success();
  };

  // Light Mode is already selected, and tapping it changes nothing on screen, as in the app.
  screens.appearance = () => {};

  screens["watch-history"] = () => {
    const s = { paused: STATE === "paused", items: STATE === "empty" ? [] : HISTORY.slice() };
    const body = $("#history-body");
    const actions = $("#history-actions");

    function render(status) {
      actions.innerHTML = s.paused
        ? `<button class="icon-btn" type="button" id="resume" aria-label="Turn on watch history"><i class="icon" data-lucide="circle-play"></i></button>`
        : `<button class="icon-btn" type="button" id="pause" aria-label="Pause watch history"><i class="icon" data-lucide="circle-pause"></i></button>
           <button class="icon-btn pr-danger" type="button" id="clear" aria-label="Delete watch history"><i class="icon" data-lucide="trash-2"></i></button>`;
      let html;
      if (status === "loading") {
        // The app's large spinner, with its line of text in white.
        html = `<div class="empty-state pr-empty" role="status">${US.spinnerHTML()}<p class="pr-loading-text">Loading watch history…</p></div>`;
      } else if (status === "error") {
        html = `<div class="empty-state pr-empty" id="history-error"><i class="icon empty-state__icon" data-lucide="wifi-off"></i><h2 class="empty-state__title">Couldn't load history</h2><p class="empty-state__text">Check your connection and try again.</p><div class="pr-empty__action"><button class="btn btn--sm" type="button" id="retry">Retry</button></div></div>`;
      } else if (s.paused) {
        html = `<div class="empty-state pr-empty" id="history-paused"><i class="icon empty-state__icon" data-lucide="circle-pause"></i><h2 class="empty-state__title">Your watch history is paused</h2><p class="empty-state__text">To keep track of what you watch, turn on watch history</p><div class="pr-empty__action"><button class="btn btn--primary" type="button" id="turn-on">Turn on</button></div></div>`;
      } else if (!s.items.length) {
        html = `<div class="empty-state pr-empty" id="history-empty"><i class="icon empty-state__icon" data-lucide="clock"></i><h2 class="empty-state__title">You have not watched any video</h2><p class="empty-state__text">Watch your first video, it will be saved here</p><div class="pr-empty__action"><a class="btn btn--primary" href="discover.html">Go to discovery</a></div></div>`;
      } else {
        html = `<div class="pr-history pr-history--list">${s.items.map(historyCardHTML).join("")}</div><p class="pr-end">You've reached the end · ${s.items.length} video${s.items.length === 1 ? "" : "s"} total</p>`;
      }
      body.innerHTML = html;
    }

    const confirmPause = () => dialog({ id: "pause-dialog", title: "Pause watch history?", text: "Your watch history will not record new videos until you turn it back on.", confirm: "Yes", onConfirm: () => { s.paused = true; render(); } });
    const confirmClear = () => dialog({ id: "clear-dialog", title: "Delete watch history?", text: "This will permanently clear all recorded entries from your watch history.", confirm: "Yes", onConfirm: () => { s.items = []; render(); } });
    phone.addEventListener("click", (e) => {
      const id = e.target.closest("button")?.id;
      if (id === "pause") confirmPause();
      if (id === "clear") confirmClear();
      if (id === "resume" || id === "turn-on") { s.paused = false; render(); }
      if (id === "retry") { render("loading"); setTimeout(() => render(), 600); }
    });

    render(STATE === "loading" || STATE === "error" ? STATE : "");
    if (STATE === "pause-confirm") confirmPause();
    if (STATE === "delete-confirm") confirmClear();
  };

  screens["reward-activities"] = () => {
    const viewer = AS === "viewer";
    const empty = STATE.endsWith("empty");
    let tab = viewer || STATE.startsWith("contributions") ? "contributions" : "earned";
    const list = $("#activities");
    const tabs = $("#reward-tabs");
    tabs.hidden = viewer;
    if (viewer) $("#reward-back").setAttribute("href", "profile.html");

    const EMPTY = {
      earned: ["No Earnings Yet", "Start creating content and growing your audience. Your earnings will appear here once you receive support or contributions.", "Create Content", "create.html"],
      contributions: ["You Haven't Supported Any Creators Yet", "Start contributing to creators and projects you believe in. Your support history will be shown here.", "Go to discovery", "discover.html"],
    };

    function cardHTML(a, i) {
      const [icon, where] = ACTIVITY_ICONS[a.kind];
      const gift = a.gifts.length > 1
        ? `${a.gifts.map(([g]) => giftDot(g)).join("")}<span class="pr-activity__more">x ${a.gifts.reduce((n, [, q]) => n + q, 0)}</span>`
        : `${giftDot(a.gifts[0][0])}${a.gifts[0][0]} x ${a.gifts[0][1]}`;
      const avatar = US.avatarHTML(a.creator || a.user, "avatar--28");
      return `<button class="pr-activity" type="button" data-i="${i}" aria-label="$${a.amount.toFixed(2)} from @${a.user}, ${a.date}. Show details">
        <span class="pr-activity__amount"><span class="pr-activity__value">$ ${a.amount.toFixed(2)}</span><span class="pr-activity__gift">${gift}</span></span>
        <span class="pr-activity__user">${avatar}<span class="pr-activity__name">@${esc(a.user)}</span></span>
        <span class="pr-activity__time"><span class="pr-activity__date">${a.date}</span><span class="pr-activity__clock">${a.time}</span></span>
        <i class="icon" data-lucide="${icon}" aria-label="${where}"></i>
      </button>`;
    }

    function render() {
      tabs.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
      const items = empty ? [] : REWARDS[tab];
      if (!items.length) {
        const [title, text, action, href] = EMPTY[tab];
        list.innerHTML = `<div class="empty-state pr-empty pr-empty--reward" id="reward-empty"><i class="icon empty-state__icon" data-lucide="coins"></i><h2 class="empty-state__title">${esc(title)}</h2><p class="empty-state__text">${esc(text)}</p><a class="btn btn--primary btn--lg" href="${href}">${esc(action)}</a></div>`;
      } else list.innerHTML = items.map(cardHTML).join("");
    }

    const details = (a) => dialog({
      id: "reward-details", title: `Total Reward: $${a.amount}`, cancel: "",
      body: `<ul class="pr-dialog-lines">${a.gifts.map(([g, q]) => `<li>${giftDot(g, "pr-gift--lg")}${g} x ${q} = $${GIFTS[g].value * q}</li>`).join("")}</ul>`,
    });

    tabs.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tab]");
      if (!b) return;
      tab = b.dataset.tab;
      render();
    });
    list.addEventListener("click", (e) => {
      const card = e.target.closest("[data-i]");
      if (card) details(REWARDS[tab][card.dataset.i]);
    });
    render();
    if (STATE === "details") details(REWARDS[tab][tab === "earned" ? 3 : 2]);
  };

  screens.wallet = () => {
    const MIN = 1000;
    let balance = 1250;
    const PACKS = [["100", "$0.99"], ["500", "$4.99"], ["1000", "$9.99"]];
    const setBalance = () => ($("#balance").textContent = balance.toLocaleString("en-US"));

    const addCoins = (picked = 1) => {
      const el = sheet("Add coins", `<div class="pr-sheet-body">
        <div class="pr-packages" role="group" aria-label="Coin packages">${PACKS.map(([n, p], i) => `<button class="pr-package" type="button" data-pack="${i}" aria-pressed="${i === picked}"><i class="icon" data-lucide="coins"></i><span class="pr-package__amount">${n}</span><span class="pr-package__price">${p}</span></button>`).join("")}</div>
        <span class="tag tag--placeholder">Placeholder prices. Nothing is charged.</span>
        <button class="btn btn--primary" type="button" id="buy"></button>
      </div>`, "add-sheet");
      const label = () => { const [n, p] = PACKS[picked]; $("#buy").textContent = `Buy ${n} coins for ${p}`; };
      label();
      el.addEventListener("click", (e) => {
        const pack = e.target.closest("[data-pack]");
        if (pack) {
          picked = Number(pack.dataset.pack);
          el.querySelectorAll("[data-pack]").forEach((b) => b.setAttribute("aria-pressed", String(b === pack)));
          label();
        }
        if (e.target.closest("#buy")) {
          balance += Number(PACKS[picked][0]);
          setBalance();
          closeLayer();
          // Review note: the app's Add coins and Withdraw buttons do nothing yet, so these sheets are placeholders.
          US.toast(`${PACKS[picked][0]} coins added. Placeholder: Add coins does nothing in the app yet.`);
        }
      });
    };

    const withdraw = (preset = "") => {
      const el = sheet("Withdraw", `<form class="pr-sheet-body" id="withdraw-form" novalidate>
        <p class="pr-intro">Available: <strong>${balance.toLocaleString("en-US")} coins</strong></p>
        <div class="pr-field pr-field--tight">
          <label class="pr-field__label" for="withdraw-amount">Coins to withdraw</label>
          <input class="input pr-input" id="withdraw-amount" inputmode="numeric" autocomplete="off" placeholder="${MIN.toLocaleString("en-US")}" value="${preset}">
          <p class="pr-helper" id="withdraw-msg">Minimum withdrawal: ${MIN.toLocaleString("en-US")} coins ($10.00)</p>
        </div>
        <span class="tag tag--placeholder">Placeholder limits. Nothing is paid out.</span>
        <button class="btn btn--primary" type="submit">Withdraw</button>
      </form>`, "withdraw-sheet");
      const input = $("#withdraw-amount", el);
      const msg = $("#withdraw-msg", el);
      const check = () => {
        const n = Number(input.value.replace(/[,\s]/g, ""));
        let error = "";
        if (!input.value.trim()) error = "Enter how many coins to withdraw";
        else if (!Number.isInteger(n) || n <= 0) error = "Enter a whole number of coins";
        else if (n < MIN) error = `The minimum is ${MIN.toLocaleString("en-US")} coins`;
        else if (n > balance) error = "You don't have that many coins";
        input.setAttribute("aria-invalid", String(Boolean(error)));
        msg.className = `pr-helper${error ? " pr-helper--error" : ""}`;
        msg.textContent = error || `Minimum withdrawal: ${MIN.toLocaleString("en-US")} coins ($10.00)`;
        return error ? 0 : n;
      };
      input.addEventListener("input", () => { if (input.getAttribute("aria-invalid") === "true") check(); });
      $("#withdraw-form", el).addEventListener("submit", (e) => {
        e.preventDefault();
        const n = check();
        if (!n) return;
        balance -= n;
        setBalance();
        closeLayer();
        // Review note, as for Add coins.
        US.toast(`Withdrawal of ${n.toLocaleString("en-US")} coins requested. Placeholder: Withdraw does nothing in the app yet.`);
      });
      if (preset) check();
    };

    $("#add-coins").addEventListener("click", () => addCoins());
    $("#withdraw").addEventListener("click", () => withdraw());
    $("#packages").addEventListener("click", (e) => {
      const pack = e.target.closest("[data-pack]");
      if (pack) addCoins(Number(pack.dataset.pack));
    });
    setBalance();
    if (STATE === "add") addCoins();
    if (STATE === "withdraw") withdraw();
    if (STATE === "withdraw-error") withdraw("500");
  };

  screens[document.body.dataset.screen]?.();
  US.setupNotBuilt();
})();
