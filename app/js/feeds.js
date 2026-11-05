// Feeds, search, notifications and live. Each page sets data-screen on <body>; ?state=<name> shows its other states.
(function () {
  const params = new URLSearchParams(location.search);
  const STATE = params.get("state") || "";
  const GUEST = STATE === "guest";
  const esc = US.esc;
  const $ = (sel, root = document) => root.querySelector(sel);
  const phone = $(".phone");
  const icon = (name, cls = "") => `<i class="icon ${cls}" data-lucide="${name}"></i>`;

  // Replace a rendered Lucide icon inside an element. The shared observer draws the new one.
  const setIcon = (el, name) => {
    const old = el.querySelector("svg, i[data-lucide]");
    const i = document.createElement("i");
    i.className = "icon";
    i.dataset.lucide = name;
    if (old) old.replaceWith(i); else el.prepend(i);
  };

  // Link to this page without ?state, used by Retry buttons.
  const pageWithoutState = () => {
    const p = new URLSearchParams(location.search);
    p.delete("state");
    const file = location.pathname.split("/").pop() || "index.html";
    return file + (p.toString() ? "?" + p : "");
  };

  // ---- States ----
  const stateHTML = ({ iconName, iconClass = "", title, text, action, href, offline }) => `<div class="empty-state feeds-state${offline ? " feeds-state--offline" : ""}">
      ${icon(iconName, "empty-state__icon " + iconClass)}
      <h2 class="empty-state__title">${title}</h2>
      ${text ? `<p class="empty-state__text">${text}</p>` : ""}
      ${action ? (href ? `<a class="btn btn--primary" href="${href}">${action}</a>` : `<button class="btn btn--primary" type="button" data-retry>${action}</button>`) : ""}
    </div>`;
  const STATES = {
    error: { iconName: "triangle-alert", title: "Something went wrong", text: "We couldn't load the content right now", action: "Retry" },
    offline: { iconName: "wifi-off", title: "You're offline", text: "Connect to the internet and try again", action: "Retry", offline: true },
    guest: { iconName: "sparkles", title: "Sign up to explore everything", text: "The next-gen streaming platform where<br>creators earn and viewers engage", action: "Sign up", href: "sign-up.html" },
  };
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-retry]")) location.href = pageWithoutState();
  });

  // ---- Shared overlays ----
  function openSheet(html, panelClass = "") {
    const backdrop = document.createElement("div");
    backdrop.className = "sheet-backdrop";
    backdrop.innerHTML = `<div class="sheet-panel ${panelClass}" role="dialog" aria-modal="true"><div class="sheet-panel__handle"></div>${html}</div>`;
    const close = () => { backdrop.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop || e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown", onKey);
    phone.append(backdrop);
    return { el: backdrop, close };
  }

  function openDialog({ title, text, confirm, destructive, onConfirm }) {
    const backdrop = document.createElement("div");
    backdrop.className = "dialog-backdrop";
    backdrop.innerHTML = `<div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="feeds-dialog-title">
        <button class="icon-btn dialog__close" type="button" data-close aria-label="Close">${icon("x")}</button>
        <h2 class="dialog__title" id="feeds-dialog-title">${title}</h2>
        <p class="dialog__text">${text}</p>
        <button class="btn ${destructive ? "feeds-btn-destructive" : "btn--primary"}" type="button" data-confirm>${confirm}</button>
        <button class="btn" type="button" data-close>Cancel</button>
      </div>`;
    const close = () => { backdrop.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    backdrop.addEventListener("click", (e) => {
      if (e.target.closest("[data-confirm]")) { onConfirm(); close(); }
      else if (e.target === backdrop || e.target.closest("[data-close]")) close();
    });
    document.addEventListener("keydown", onKey);
    phone.append(backdrop);
    backdrop.querySelector("[data-confirm]").focus();
  }

  // Shown when a guest taps something that needs an account.
  const openAuthSheet = () => openSheet(`<div class="feeds-auth">
      <span class="feeds-auth__icon">${icon("lock")}</span>
      <h2 class="feeds-auth__title">Join UltraStream</h2>
      <p class="feeds-auth__text">Sign up to like, comment, share and reward<br>your favourite creators.</p>
      <a class="btn btn--primary" href="sign-up.html">Create a free account</a>
      <p class="feeds-auth__alt">Already have an account? <a href="sign-in.html">Sign in</a></p>
    </div>`);

  // ---- Content helpers ----
  const hrefFor = (item) => (item.live ? "live.html" : item.kind === "short" ? `channel-shorts.html?id=${item.id}` : `watch.html?id=${item.id}`);
  const card = (item) => US.cardHTML(item, { href: hrefFor(item) });
  const byId = (id) => US.CONTENT.find((c) => c.id === id);
  const toNumber = (views) => parseFloat(views) * (/K$/.test(views) ? 1000 : /M$/.test(views) ? 1e6 : 1);
  // Matches the app's short count format: 12500 becomes 12.5k.
  const shortCount = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n));

  // Feed rows as in the app: videos and live full width, consecutive shorts in a two-column grid.
  function feedRowsHTML(items) {
    let html = "";
    let shorts = [];
    const flush = () => { if (shorts.length) html += `<div class="feeds-grid">${shorts.map(card).join("")}</div>`; shorts = []; };
    for (const item of items) {
      if (item.kind === "short" && !item.live) shorts.push(item);
      else { flush(); html += card(item); }
    }
    flush();
    return html;
  }

  const skeletonCards = (n) => Array.from({ length: n }, () => `<div class="feeds-skeleton feeds-pulse" aria-hidden="true">
      <div class="feeds-skeleton__thumb"></div>
      <div class="feeds-skeleton__row"><span class="feeds-skeleton__dot"></span><span class="feeds-skeleton__lines"><span class="feeds-skeleton__line"></span><span class="feeds-skeleton__line feeds-skeleton__line--short"></span></span></div>
    </div>`).join("");

  // Placeholder search: a word matches when a word in the item starts with most of it.
  function makeMatcher(query) {
    const stems = query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3).map((t) => t.slice(0, Math.max(3, t.length - 2)));
    return (text) => {
      if (!stems.length) return false;
      const words = text.toLowerCase().split(/[^a-z0-9]+/);
      return stems.some((s) => words.some((w) => w.startsWith(s)));
    };
  }
  const itemText = (c) => `${c.title} ${c.channel} ${c.category} ${c.kind}${c.live ? " live" : ""}`;
  const creatorText = (c) => `${c.name} ${c.handle} ${c.category}`;

  // ================= My Feed =================
  function initMyFeed() {
    const feed = $("#feed");
    const chips = $("#chips");
    // Content from the creators this viewer follows, newest first.
    const items = ["v0", "v2", "v1", "v4", "v3", "v9", "v10", "v13", "v11", "v12"].map(byId);
    const center = (html) => { feed.classList.add("feeds-center"); feed.innerHTML = html; };
    const welcome = stateHTML({ iconName: "user-round-plus", title: "Welcome to My Feed", text: "Follow creators to see their latest content here", action: "Get Started", href: "create.html" });

    if (GUEST) { chips.hidden = true; return center(stateHTML(STATES.guest)); }
    if (STATE === "error" || STATE === "offline") { chips.hidden = STATE === "offline"; return center(stateHTML(STATES[STATE])); }
    US.setupChips(chips, render);
    if (STATE === "loading") { feed.innerHTML = `<div class="feeds-list">${skeletonCards(3)}</div>`; return; }
    if (STATE === "welcome") return center(welcome);

    function render(category) {
      const list = items.filter((c) => !category || c.category === category);
      feed.scrollTop = 0;
      if (!list.length) return center(welcome);
      feed.classList.remove("feeds-center");
      feed.innerHTML = `<div class="feeds-list">${feedRowsHTML(list)}</div>`;
    }
    render(null);
  }

  // ================= Shorts (tab and one creator's) =================
  function extraShorts(name) {
    const c = US.creator(name);
    return ["Quick tip in under a minute", "Behind the scenes today"].map((title, i) => ({
      id: `s-${c.name}-${i}`, kind: "short", category: c.category, title, channel: c.name, views: ["41K", "18K"][i], age: ["2 days ago", "1 week ago"][i], length: ["0:37", "0:22"][i], live: false, hue: (c.hue + 90 + i * 60) % 360,
    }));
  }

  const DESCRIPTIONS = ["Shot in one take. Let me know what you want to see next.", "", "Part of a weekly series. New one every Friday.", "Turn the sound on for this one."];

  function shortHTML(item, i) {
    const likes = Math.round(toNumber(item.views) * 0.06);
    const comments = 120 + ((i * 37) % 180);
    const desc = DESCRIPTIONS[i % DESCRIPTIONS.length] || "No description provided.";
    return `<article class="short" data-index="${i}" data-likes="${likes}" data-length="${esc(item.length)}">
      <div class="short__video" style="${US.thumbStyle(item)}"></div>
      <button class="short__tap" type="button" aria-label="Play or pause"><span class="short__pill">${icon("pause")}</span></button>
      <div class="short__top">
        <div class="short__row">${US.avatarHTML(item.channel, "avatar--40")}
          <div class="short__text"><h2 class="short__title">${esc(item.title)}</h2><span class="short__sub"><a href="channel.html?c=${encodeURIComponent(item.channel)}">${esc(item.channel)}</a> • ${item.views} views • ${esc(item.age)}</span></div>
        </div>
        <p class="short__desc">${esc(desc)}</p>
      </div>
      <div class="short__bottom">
        <div class="short__actions">
          <button class="short-btn" type="button" data-like aria-pressed="false" aria-label="Like">${icon("thumbs-up")}<span>${shortCount(likes)}</span></button>
          <button class="short-btn" type="button" data-dislike aria-pressed="false" aria-label="Dislike">${icon("thumbs-down")}</button>
          <button class="short-btn" type="button" data-comments aria-label="Comments">${icon("message-circle")}<span>${shortCount(comments)}</span></button>
          <button class="short-btn" type="button" data-reward aria-label="Reward">${icon("hand-coins")}</button>
          <button class="short-btn" type="button" data-share aria-label="Share">${icon("share")}</button>
        </div>
        <button class="short-btn" type="button" data-eye aria-label="Hide controls">${icon("eye")}</button>
      </div>
      <div class="short__progress" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="short__track"><div class="short__fill"></div><span class="short__thumb"></span></div></div>
    </article>`;
  }

  function initShorts({ items, list, endPage }) {
    let uiVisible = STATE !== "controls-hidden";
    let active = 0;
    const progress = new Map();
    const page = (html) => `<section class="feeds-shorts__page">${html}</section>`;
    const caughtUp = page(stateHTML({ iconName: "party-popper", title: "You're all caught up", text: "You've watched all available shorts. Check back later for new content", action: "Refresh" }));

    function render(shorts) {
      active = 0;
      list.scrollTop = 0;
      if (!shorts.length) {
        list.innerHTML = page(stateHTML({ iconName: "video", title: "No shorts here", text: "Be the first to create and share amazing shorts!" }));
        return;
      }
      list.innerHTML = shorts.map((item, i) => page(shortHTML(item, i))).join("") + (endPage ? caughtUp : "");
      applyUi();
    }

    const shortsEls = () => [...list.querySelectorAll(".short")];
    function applyUi() {
      shortsEls().forEach((s) => {
        s.classList.toggle("short--hidden", !uiVisible);
        const eye = s.querySelector("[data-eye]");
        eye.setAttribute("aria-label", uiVisible ? "Hide controls" : "Show controls");
        setIcon(eye, uiVisible ? "eye" : "eye-off");
      });
    }

    function setPaused(s, paused, flash) {
      s.classList.toggle("short--paused", paused);
      setIcon(s.querySelector(".short__pill"), paused ? "play" : "pause");
      clearTimeout(s._flash);
      s.classList.toggle("short--flash", Boolean(flash) && !paused);
      if (flash && !paused) s._flash = setTimeout(() => s.classList.remove("short--flash"), 800);
    }

    function setProgress(s, pct) {
      progress.set(s.dataset.index, pct);
      s.querySelector(".short__fill").style.width = pct + "%";
      s.querySelector(".short__thumb").style.left = pct + "%";
      s.querySelector(".short__progress").setAttribute("aria-valuenow", Math.round(pct));
    }

    // Placeholder playback: the active short's bar fills over its length and loops.
    setInterval(() => {
      const s = shortsEls()[active];
      if (!s || s.classList.contains("short--paused") || s.classList.contains("short--error") || s._seeking) return;
      const [m, sec] = s.dataset.length.split(":").map(Number);
      const total = Math.max(5, m * 60 + sec);
      const next = (progress.get(s.dataset.index) || 0) + (25 / total);
      setProgress(s, next >= 100 ? 0 : next);
    }, 250);

    let ticking = false;
    list.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const idx = Math.round(list.scrollTop / Math.max(1, list.clientHeight));
        if (idx !== active) {
          active = idx;
          const s = shortsEls()[idx];
          if (s) setPaused(s, false);
        }
      });
    });

    const goTo = (idx) => list.scrollTo({ top: idx * list.clientHeight, behavior: "smooth" });
    document.addEventListener("keydown", (e) => {
      if (e.target.closest("input, textarea, .sheet-backdrop, .dialog-backdrop")) return;
      const pages = list.children.length;
      if ((e.key === "ArrowDown" || e.key === "PageDown") && active < pages - 1) { e.preventDefault(); goTo(active + 1); }
      if ((e.key === "ArrowUp" || e.key === "PageUp") && active > 0) { e.preventDefault(); goTo(active - 1); }
    });

    const needsAccount = () => { if (GUEST) { openAuthSheet(); return true; } return false; };

    list.addEventListener("click", (e) => {
      const s = e.target.closest(".short");
      // Refresh at the end of the feed jumps back to the first short without animating, as in the app.
      if (e.target.closest("[data-retry]")) { e.stopPropagation(); list.scrollTop = 0; return; }
      if (!s) return;
      const like = s.querySelector("[data-like]");
      const dislike = s.querySelector("[data-dislike]");
      const setLike = (on) => {
        const was = like.getAttribute("aria-pressed") === "true";
        if (was === on) return;
        like.setAttribute("aria-pressed", on);
        s.dataset.likes = Number(s.dataset.likes) + (on ? 1 : -1);
        like.querySelector("span").textContent = shortCount(Number(s.dataset.likes));
      };
      if (e.target.closest(".short__tap")) setPaused(s, !s.classList.contains("short--paused"), true);
      else if (e.target.closest("[data-like]")) { if (needsAccount()) return; const on = like.getAttribute("aria-pressed") !== "true"; setLike(on); if (on) dislike.setAttribute("aria-pressed", "false"); }
      else if (e.target.closest("[data-dislike]")) { if (needsAccount()) return; const on = dislike.getAttribute("aria-pressed") !== "true"; dislike.setAttribute("aria-pressed", on); if (on) setLike(false); }
      else if (e.target.closest("[data-comments]")) { if (needsAccount()) return; openComments(s.querySelector("[data-comments] span")); }
      // Review notes: the app opens its reward sheet and the phone's share sheet here.
      else if (e.target.closest("[data-reward]")) { if (needsAccount()) return; US.toast("This screen isn't rebuilt yet."); }
      else if (e.target.closest("[data-share]")) US.toast("This opens the phone's share sheet.");
      else if (e.target.closest("[data-eye]")) { uiVisible = !uiVisible; applyUi(); }
    });

    // Seeking: press on the bar, drag, release.
    list.addEventListener("pointerdown", (e) => {
      const bar = e.target.closest(".short__progress");
      if (!bar) return;
      e.preventDefault();
      const s = bar.closest(".short");
      const pctAt = (x) => { const r = bar.getBoundingClientRect(); return Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100)); };
      s._seeking = true;
      bar.classList.add("short__progress--seeking");
      bar.setPointerCapture(e.pointerId);
      setProgress(s, pctAt(e.clientX));
      const move = (ev) => setProgress(s, pctAt(ev.clientX));
      const up = (ev) => {
        setProgress(s, pctAt(ev.clientX));
        s._seeking = false;
        bar.classList.remove("short__progress--seeking");
        bar.removeEventListener("pointermove", move);
        bar.removeEventListener("pointerup", up);
        bar.removeEventListener("pointercancel", up);
      };
      bar.addEventListener("pointermove", move);
      bar.addEventListener("pointerup", up);
      bar.addEventListener("pointercancel", up);
    });
    list.addEventListener("keydown", (e) => {
      const bar = e.target.closest(".short__progress");
      if (!bar || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
      e.preventDefault();
      e.stopPropagation();
      const s = bar.closest(".short");
      setProgress(s, Math.max(0, Math.min(100, (progress.get(s.dataset.index) || 0) + (e.key === "ArrowRight" ? 5 : -5))));
    });

    function openComments(countEl) {
      const sample = [["PlainTerms", "1h ago", "This is so satisfying to watch."], ["FarRoutes", "3h ago", "Need a longer version of this."], ["OpenCanvas", "5h ago", "The ending got me."]];
      const commentHTML = (name, when, text) => `<div class="feeds-comment">${US.avatarHTML(name)}<div><span class="feeds-comment__name">${esc(name)}<span class="feeds-comment__when">${esc(when)}</span></span>${esc(text)}</div></div>`;
      const sheet = openSheet(`<h2 class="feeds-comments__title">Comments</h2>
        <div class="feeds-comments__list">${sample.map((c) => commentHTML(...c)).join("")}</div>
        <form class="feeds-compose"><input class="input" name="comment" placeholder="Add a comment..." aria-label="Add a comment" autocomplete="off"><button class="btn btn--primary btn--sm" type="submit" aria-label="Post comment">${icon("send", "icon--sm")}</button></form>`, "feeds-comments");
      sheet.el.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const input = e.target.comment;
        const text = input.value.trim();
        if (!text) return;
        const listEl = sheet.el.querySelector(".feeds-comments__list");
        listEl.insertAdjacentHTML("afterbegin", commentHTML("You", "just now", text));
        input.value = "";
        const n = parseInt(countEl.textContent, 10) || 0;
        if (!/k$/.test(countEl.textContent)) countEl.textContent = shortCount(n + 1);
      });
    }

    return { render };
  }

  function stateOrRender(list, renderFn) {
    const page = (html) => `<section class="feeds-shorts__page">${html}</section>`;
    if (STATE === "loading") { list.innerHTML = page(`<div class="empty-state" role="status" aria-label="Loading">${US.spinnerHTML()}</div>`); return; }
    if (STATE === "error" || STATE === "offline") { list.innerHTML = page(stateHTML(STATES[STATE])); return; }
    renderFn();
    if (STATE === "video-error") {
      const s = list.querySelector(".short");
      s.classList.add("short--error");
      s.insertAdjacentHTML("beforeend", `<div class="short__error">${icon("circle-alert")}<span>Video unavailable</span></div>`);
    }
  }

  function initShortsTab() {
    const list = $("#list");
    const all = US.CONTENT.filter((c) => c.kind === "short");
    const shorts = initShorts({ items: all, list, endPage: true });
    const chips = $("#chips");
    // As in the app, the category chips are hidden while offline.
    chips.hidden = STATE === "offline";
    US.setupChips(chips, (cat) => shorts.render(all.filter((c) => !cat || c.category === cat)));
    stateOrRender(list, () => shorts.render(STATE === "empty" ? [] : all));
    if (STATE === "caught-up") requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });
  }

  function initChannelShorts() {
    const list = $("#list");
    const name = params.get("c");
    const all = US.CONTENT.filter((c) => c.kind === "short");
    const items = name ? [...all.filter((c) => c.channel === US.creator(name).name), ...extraShorts(name)] : all;
    const shorts = initShorts({ items, list, endPage: false });
    stateOrRender(list, () => shorts.render(items));
    const start = Math.max(0, items.findIndex((c) => c.id === params.get("id")));
    if (start) requestAnimationFrame(() => { list.scrollTop = start * list.clientHeight; });
  }

  // ================= Search =================
  const HISTORY_KEY = "us-feeds-recent-v1";
  const DEFAULT_HISTORY = ["Best games", "street food", "lofi beats", "desk setup", "travel vlog"];
  function readHistory() {
    try { const v = JSON.parse(localStorage.getItem(HISTORY_KEY)); return Array.isArray(v) ? v : DEFAULT_HISTORY.slice(); } catch { return DEFAULT_HISTORY.slice(); }
  }
  function saveHistory(list) { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 10))); } catch { /* Storage may be blocked. */ } }
  function addToHistory(q) {
    if (GUEST) return;
    saveHistory([q, ...readHistory().filter((h) => h.toLowerCase() !== q.toLowerCase())]);
  }
  const goToResults = (q) => { const t = q.trim(); if (!t) return; addToHistory(t); location.href = `search-results.html?q=${encodeURIComponent(t)}`; };

  function setupSearchBar(onInput) {
    const input = $("#q");
    const clear = $("#clear");
    const spacer = $("#clear-spacer");
    const sync = () => { const has = input.value.length > 0; clear.hidden = !has; spacer.hidden = has; };
    input.addEventListener("input", () => { sync(); onInput(input.value); });
    clear.addEventListener("click", () => { input.value = ""; sync(); onInput(""); input.focus(); });
    sync();
    return input;
  }

  function initSearch() {
    const listEl = $("#list");
    let history = STATE === "empty" ? [] : readHistory();
    if (STATE === "empty") saveHistory([]);
    const row = (type, text) => `<button class="feeds-suggestion" type="button" data-q="${esc(text)}">
        <span class="feeds-suggestion__left">${icon(type === "history" ? "clock-8" : type === "profile" ? "user" : "search")}<span class="feeds-suggestion__text">${esc(text)}</span></span>${icon("arrow-up-left")}
      </button>`;

    function render(q) {
      const query = q.trim();
      listEl.classList.remove("feeds-search-list--pad");
      if (!query) {
        if (GUEST) { listEl.innerHTML = ""; return; }
        if (!history.length) {
          listEl.classList.add("feeds-search-list--pad");
          listEl.innerHTML = `<div class="feeds-history-empty">${icon("history")}<p>No recent searches yet.</p></div>`;
          return;
        }
        listEl.innerHTML = `<div class="feeds-history-head"><h2>Recent searches</h2><button class="feeds-link-btn" type="button" id="clear-all">Clear all</button></div>${history.map((h) => row("history", h)).join("")}`;
        return;
      }
      listEl.classList.add("feeds-search-list--pad");
      const hit = makeMatcher(query);
      const people = US.CREATORS.filter((c) => hit(creatorText(c))).slice(0, 5).map((c) => row("profile", c.name));
      const content = US.CONTENT.filter((c) => hit(itemText(c))).slice(0, 10).map((c) => row("content", c.title));
      listEl.innerHTML = people.length + content.length ? people.join("") + content.join("") : stateHTML({ iconName: "search-x", iconClass: "feeds-state__icon-lg", title: "No search results found", text: "Try something different" });
    }

    const input = setupSearchBar(render);
    $("#form").addEventListener("submit", (e) => { e.preventDefault(); goToResults(input.value); });
    listEl.addEventListener("click", (e) => {
      const item = e.target.closest("[data-q]");
      if (item) return goToResults(item.dataset.q);
      if (e.target.closest("#clear-all")) {
        openDialog({ title: "Clear search history?", text: "This will remove all of your recent searches.", confirm: "Clear all", destructive: true, onConfirm: () => { history = []; saveHistory([]); render(input.value); } });
      }
    });
    if (STATE === "no-results") input.value = "underwater basket weaving";
    if (params.get("q")) input.value = params.get("q");
    input.dispatchEvent(new Event("input"));
    input.focus();
  }

  // ================= Search results =================
  function initSearchResults() {
    const results = $("#results");
    const chips = $("#filters");
    let filter = params.get("filter") || "video";
    const following = new Set(["StreetPlate"]);
    const FILTERS = [["video", "Video"], ["shorts", "Shorts"], ["live", "Live"], ["accounts", "Creators"]];
    chips.innerHTML = FILTERS.map(([id, label]) => `<button class="chip" type="button" data-filter="${id}" aria-pressed="${id === filter}">${label}</button>`).join("");

    const personHTML = (c) => {
      const on = following.has(c.name);
      return `<div class="feeds-people">
        <a class="feeds-people__link" href="channel.html?c=${encodeURIComponent(c.name)}">${US.avatarHTML(c.name)}<span class="feeds-people__text"><span class="feeds-people__name">${esc(c.name)}</span><span class="feeds-people__meta">${esc(c.handle.slice(1))} • ${c.followers} followers</span></span></a>
        <button class="btn ${on ? "" : "btn--primary"}" type="button" data-follow="${esc(c.name)}" aria-pressed="${on}">${on ? "Following" : "Follow"}</button>
      </div>`;
    };

    function render(q) {
      const query = q.trim();
      results.style.justifyContent = "";
      if (STATE === "loading") {
        results.innerHTML = `<div class="feeds-searching" role="status">${US.spinnerHTML()}<span>Searching...</span></div>`;
        return;
      }
      if (!query) { results.innerHTML = ""; return; }
      const hit = makeMatcher(query);
      const content = US.CONTENT.filter((c) => hit(itemText(c)));
      let html = "";
      if (filter === "accounts") {
        const people = US.CREATORS.filter((c) => hit(creatorText(c)));
        if (people.length) html = `<div class="feeds-results__people">${people.map(personHTML).join("")}</div>`;
      } else {
        const list = content.filter((c) => (filter === "live" ? c.live : !c.live && c.kind === (filter === "video" ? "video" : "short")));
        html = list.map(card).join("");
      }
      if (!html) {
        results.style.justifyContent = "center";
        const title = filter === "accounts" ? "No accounts found" : filter === "live" ? "No live results found" : "No search results found";
        html = stateHTML({ iconName: "search-x", iconClass: "feeds-state__icon-lg", title, text: "Try something different" });
      }
      results.innerHTML = html;
    }

    const input = setupSearchBar(render);
    input.value = STATE === "no-results" ? "underwater basket weaving" : params.get("q") || "Best games";
    input.dispatchEvent(new Event("input"));
    $("#form").addEventListener("submit", (e) => { e.preventDefault(); const t = input.value.trim(); if (t) addToHistory(t); input.blur(); });
    chips.addEventListener("click", (e) => {
      const b = e.target.closest("[data-filter]");
      if (!b) return;
      filter = b.dataset.filter;
      chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === b));
      results.scrollTop = 0;
      render(input.value);
    });
    results.addEventListener("click", (e) => {
      const b = e.target.closest("[data-follow]");
      if (!b) return;
      if (GUEST) { location.href = "sign-in.html"; return; }
      const name = b.dataset.follow;
      if (following.has(name)) following.delete(name); else following.add(name);
      const on = following.has(name);
      b.textContent = on ? "Following" : "Follow";
      b.classList.toggle("btn--primary", !on);
      b.setAttribute("aria-pressed", on);
    });
  }

  // ================= Notifications =================
  function initNotifications() {
    const listEl = $("#list");
    const chips = $("#filters");
    const markAll = $("#mark-all");
    const TYPE_ICON = { reward: "hand-coins", comment: "message-square-text", like: "heart", follow: "user-round-plus" };
    const FILTERS = [["all", "All", null], ["rewards", "Rewards", "reward"], ["comments", "Comments", "comment"], ["likes", "Likes", "like"], ["follows", "Follows", "follow"]];
    const items = [
      ["follow", "PixelForge", "started following you.", "5m ago"],
      ["live", "LoopHouse", "is live now.", "12m ago"],
      ["reward", "StreetPlate", "sent you a reward.", "1h ago"],
      ["comment", "ByteBench", "commented on your video: “Clean setup.”", "3h ago"],
      ["like", "SideLine", "liked your short.", "5h ago"],
      ["upload", "FarRoutes", "uploaded a new video.", "1d ago"],
      ["follow", "OpenCanvas", "started following you.", "2d ago"],
      ["system", "UltraStream", "Welcome to UltraStream.", "6d ago"],
    ].map(([type, title, message, time], i) => ({ id: "n" + i, type, title, message, time, read: STATE === "read" && i < 2 }));
    let filter = "all";

    const center = (html) => { listEl.innerHTML = html; listEl.style.justifyContent = "center"; };
    if (GUEST) { markAll.hidden = true; chips.hidden = true; return center(stateHTML(STATES.guest)); }
    if (STATE === "off") {
      markAll.disabled = true; chips.hidden = true;
      return center(stateHTML({ iconName: "bell-off", title: "Notifications are turned off", text: "Enable notifications to stay updated.", action: "Manage settings", href: "settings.html" }));
    }
    chips.innerHTML = FILTERS.map(([id, label]) => `<button class="chip" type="button" data-filter="${id}" aria-pressed="${id === "all"}">${label}</button>`).join("");
    if (STATE === "error" || STATE === "offline") { markAll.disabled = true; return center(stateHTML(STATES[STATE])); }
    if (STATE === "loading") {
      markAll.disabled = true;
      listEl.innerHTML = Array.from({ length: 5 }, () => `<div class="feeds-notif feeds-notif--skeleton feeds-pulse" aria-hidden="true"><span class="feeds-notif__avatar"></span><span class="feeds-notif__body"><span class="feeds-skeleton__line" style="width:80%;height:16px"></span><span class="feeds-skeleton__line" style="width:50%"></span></span></div>`).join("");
      return;
    }
    if (STATE === "empty") items.length = 0;

    const visible = () => { const type = FILTERS.find((f) => f[0] === filter)[2]; return items.filter((n) => !type || n.type === type); };
    function render() {
      const list = visible();
      markAll.disabled = !list.some((n) => !n.read);
      listEl.style.justifyContent = list.length ? "" : "center";
      listEl.innerHTML = list.length ? list.map((n) => `<button class="feeds-notif" type="button" data-id="${n.id}" aria-label="${esc(`${n.title} ${n.message} ${n.time}${n.read ? "" : ", unread"}`)}">
          <span class="feeds-notif__avatar">${icon("user-round")}<span class="feeds-notif__type">${icon(TYPE_ICON[n.type] || "bell")}</span></span>
          <span class="feeds-notif__body"><span><b>${esc(n.title)}</b> ${esc(n.message)}</span><span class="feeds-notif__time">${esc(n.time)}</span></span>
          ${n.read ? "" : '<span class="feeds-notif__dot"></span>'}
        </button>`).join("") : stateHTML({ iconName: "circle-alert", title: "No notifications", text: "You have no notifications to show right now." });
    }
    chips.addEventListener("click", (e) => {
      const b = e.target.closest("[data-filter]");
      if (!b) return;
      filter = b.dataset.filter;
      chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === b));
      render();
    });
    listEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-id]");
      if (!b) return;
      items.find((n) => n.id === b.dataset.id).read = true;
      render();
    });
    markAll.addEventListener("click", () => openDialog({
      title: "Mark All Read",
      text: "Are you sure you want to mark all your notifications as read? This cannot be undone.",
      confirm: "Mark Read",
      onConfirm: () => { items.forEach((n) => { n.read = true; }); render(); },
    }));
    render();
  }

  // ================= Live stream =================
  function initLive() {
    const item = US.CONTENT.find((c) => c.live) || US.CONTENT[0];
    if (STATE === "ended" || STATE === "offline") {
      const s = STATE === "ended"
        ? { iconName: "square-play", title: "Live stream ended", text: "Streamed content saved on the platform", action: "Watch the recording", href: `watch.html?id=${item.id}` }
        : STATES.offline;
      phone.innerHTML = `<header class="app-header"><a class="icon-btn" href="discover.html" aria-label="Back">${icon("arrow-left")}</a></header>${stateHTML(s)}`;
      return;
    }
    const camOff = STATE === "camera-off";
    phone.innerHTML = `<div class="feeds-live__video" style="${camOff ? "" : US.thumbStyle(item)}">
        ${camOff ? `<div class="feeds-live__camoff">${icon("camera-off")}<h2>Camera is off</h2><p>The creator will be back on camera shortly.</p></div>` : ""}
        <div class="feeds-live__overlay">
          <div class="feeds-live__top">
            <div class="feeds-live__left"><a class="feeds-live__back" href="discover.html" aria-label="Back">${icon("chevron-left")}</a><span class="feeds-badge feeds-badge--live">${icon("radio")}LIVE</span></div>
            <span class="feeds-badge" aria-label="12.5K watching">${icon("eye")}12.5K</span>
          </div>
          <div class="feeds-live__side">
            <button class="feeds-live__round" type="button" data-heart aria-pressed="false" aria-label="Like">${icon("heart")}</button>
            <button class="feeds-live__round" type="button" data-todo aria-label="Reward">${icon("hand-coins")}</button>
          </div>
        </div>
      </div>
      <section class="feeds-chat" aria-label="Live chat">
        <h1 class="feeds-chat__title">Comments</h1>
        <div class="feeds-chat__list" id="chat" aria-live="polite"></div>
      </section>
      <form class="feeds-live__footer" id="chat-form" autocomplete="off">
        <input class="feeds-live__input" name="message" placeholder="Send a message" aria-label="Send a message">
        <button class="feeds-live__send" type="submit" aria-label="Send">${icon("send")}</button>
      </form>`;
    US.setupNotBuilt();

    const chat = $("#chat");
    const msgHTML = (user, text) => `<p class="feeds-chat__msg"><b>${esc(user)}</b> : ${esc(text)}</p>`;
    const rewardHTML = (user, note) => `<div class="feeds-chat__reward"><span class="feeds-chat__coin">${icon("hand-coins")}</span><div><p><b>${esc(user)}</b> sent a reward!</p><small>${esc(note)}</small></div></div>`;
    const toBottom = () => { chat.scrollTop = chat.scrollHeight; };
    const form = $("#chat-form");

    if (STATE === "chat-disabled") {
      chat.innerHTML = stateHTML({ iconName: "message-circle-off", title: "Chat unavailable", text: "The creator has turned off chat." });
      form.message.disabled = true;
      form.message.placeholder = "Chat is turned off";
      form.querySelector("button").disabled = true;
    } else if (STATE === "chat-empty") {
      chat.innerHTML = stateHTML({ iconName: "message-circle-more", title: "No chat yet", text: "Be the first to share your thoughts" });
    } else {
      chat.innerHTML = msgHTML("TechGuru", "This stream is fire!") + msgHTML("QuietRiver", "Great gameplay!") + rewardHTML("MusicLover", "Amazing") + msgHTML("NightOwl", "Keep it up");
      // Placeholder chat activity while the page is open.
      const pool = [["SideLine", "That was close"], ["FarRoutes", "Watching from the train"], ["OpenCanvas", "Clean move"], ["PlainTerms", "Hi from the chat"]];
      let n = 0;
      const timer = setInterval(() => {
        if (n >= pool.length) return clearInterval(timer);
        const atEnd = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 40;
        chat.insertAdjacentHTML("beforeend", msgHTML(...pool[n++]));
        if (atEnd) toBottom();
      }, 6000);
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = form.message.value.trim();
      form.message.value = "";
      if (!text) return;
      chat.querySelector(".empty-state")?.remove();
      chat.insertAdjacentHTML("beforeend", msgHTML("You", text));
      toBottom();
    });
    phone.addEventListener("click", (e) => {
      const heart = e.target.closest("[data-heart]");
      if (heart) heart.setAttribute("aria-pressed", heart.getAttribute("aria-pressed") !== "true");
    });
  }

  const SCREENS = { "my-feed": initMyFeed, shorts: initShortsTab, "channel-shorts": initChannelShorts, search: initSearch, "search-results": initSearchResults, notifications: initNotifications, live: initLive };
  SCREENS[document.body.dataset.screen]?.();
})();
