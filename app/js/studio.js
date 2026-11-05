// Creating content and Ultra Studio: shared helpers, sample data and one setup per screen.
// Each page sets <body data-page="...">. Add ?state=<name> to a page's address to open one of its states.
(function () {
  const S = (window.Studio = {});
  const params = new URLSearchParams(location.search);
  const state = params.get("state") || "";
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = US.esc;
  const icon = (name, cls = "") => `<i class="icon ${cls}" data-lucide="${name}"></i>`;
  // Loader icon for busy buttons. Loading lists use the app's spinner, US.spinnerHTML().
  const spinner = icon("loader-circle", "icon--spin");
  const phone = () => $(".phone");
  S.state = state;

  // ---------- Formatting, as in the app ----------
  S.formatNumber = (n) => {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  };
  S.formatEarnings = (amount) => `$ ${parseFloat(amount.toFixed(2))}`;
  S.formatDate = (d) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  S.formatTime = (d) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  // Manage contents shows dates up to the 9th as "Scheduled for Nov 5", and later ones as "Scheduled for Nov" then "12 • 3:00 PM".
  S.scheduledLines = (d) => {
    const month = d.toLocaleDateString(undefined, { month: "short" });
    const day = d.getDate();
    const time = S.formatTime(d);
    return day <= 9 ? [`Scheduled for ${month} ${day}`, time] : [`Scheduled for ${month}`, `${day} • ${time}`];
  };

  // ---------- Sample data ----------
  // The signed-in creator. Fictional, and one of the shared creators so View channel has a page to open.
  const me = US.creator("PixelForge");
  S.CHANNEL = { name: me.name, handle: me.name.toLowerCase(), category: "Gaming", bio: "Ranked climbs, speedruns and late-night streams.", hue: me.hue };
  S.STATS = { earned: 500.2, views: 1840000, likes: 96400, videos: 120, shorts: 60, live: 50, followers: 128000 };
  S.ZERO_STATS = { earned: 0, views: 0, likes: 0, videos: 0, shorts: 0, live: 0, followers: 0 };

  const daysFromNow = (days, h, m) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(h, m, 0, 0);
    return d;
  };
  // The creator's own content. "play" is the video page each item opens.
  S.CONTENT = [
    ...US.CONTENT.filter((c) => !c.live).map((c) => ({ id: c.id, type: c.kind === "short" ? "SHORTS" : "VIDEO", title: c.title, views: c.views, ago: c.age, hue: c.hue, category: c.category, play: c.id })),
    { id: "l0", type: "LIVE_STREAM", title: "Late-night ranked with chat", views: "12.5K", ago: "2 days ago", hue: 12, category: "Gaming", play: "v9" },
    { id: "l1", type: "LIVE_STREAM", title: "Community games night", views: "8.1K", ago: "1 week ago", hue: 290, category: "Gaming", play: "v9" },
    { id: "s0", type: "VIDEO", title: "Season finale: every boss, no deaths", scheduledAt: daysFromNow(1, 15, 0), hue: 205, category: "Gaming", play: "v9" },
    { id: "s1", type: "SHORTS", title: "Ten seconds of pure panic", scheduledAt: daysFromNow(12, 9, 30), hue: 28, category: "Gaming", play: "v4" },
    { id: "s2", type: "VIDEO", title: "Building the ultimate budget setup", scheduledAt: daysFromNow(5, 18, 0), hue: 160, category: "Tech", play: "v3" },
  ];
  S.find = (id) => S.CONTENT.find((c) => c.id === id);
  S.CATEGORY_OPTIONS = US.CATEGORIES.map((c) => ({ label: c, value: c }));

  // ---------- Going back ----------
  // Back buttons are links to the screen you usually come from. If you came from inside the site, they go back instead.
  const cameFromSite = () => {
    try {
      return history.length > 1 && document.referrer && new URL(document.referrer).origin === location.origin;
    } catch {
      return false;
    }
  };
  S.goBack = (href) => {
    if (cameFromSite()) history.back();
    else location.href = href;
  };
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-back]");
    if (link && cameFromSite()) {
      e.preventDefault();
      history.back();
    }
  });

  // ---------- Layers: dialogs, dropdowns and sheets ----------
  const layers = [];
  S.layer = (html) => {
    const holder = document.createElement("div");
    holder.innerHTML = html.trim();
    const el = holder.firstElementChild;
    el._opener = document.activeElement;
    phone().append(el);
    layers.push(el);
    const focusTarget = el.querySelector("[tabindex='-1']");
    if (focusTarget) focusTarget.focus({ preventScroll: true });
    return el;
  };
  S.close = (el) => {
    if (!el.isConnected) return;
    el.remove();
    layers.splice(layers.indexOf(el), 1);
    if (el._opener && el._opener.isConnected) el._opener.focus({ preventScroll: true });
  };
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !layers.length) return;
    const top = layers[layers.length - 1];
    if (top._dismiss) top._dismiss();
    else S.close(top);
  });

  // Confirmation, as the app's confirm modal: close X, bold title, one line, gradient button and outlined button.
  // The X, the backdrop and Escape call onCancel. The outlined button calls onSecondary if given, otherwise onCancel.
  // keepOpen: a function; when it returns true, the confirm button runs onConfirm without closing, as when a delete fails.
  S.confirm = ({ title, text, confirm = "Yes", cancel = "Cancel", onConfirm, onCancel, onSecondary, keepOpen }) => {
    const el = S.layer(`<div class="dialog-backdrop"><div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-text" tabindex="-1">
      <h2 class="dialog__title" id="dialog-title">${esc(title)}</h2>
      <button class="icon-btn dialog__close" type="button" aria-label="Close" data-dismiss>${icon("x")}</button>
      ${text ? `<p class="dialog__text" id="dialog-text">${esc(text)}</p>` : ""}
      <button class="btn btn--primary" type="button" data-confirm>${esc(confirm)}</button>
      ${cancel ? `<button class="btn" type="button" data-secondary>${esc(cancel)}</button>` : ""}
    </div></div>`);
    el._dismiss = () => {
      S.close(el);
      if (onCancel) onCancel();
    };
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-confirm]")) {
        if (!keepOpen?.()) S.close(el);
        if (onConfirm) onConfirm();
      } else if (e.target.closest("[data-secondary]") && onSecondary) {
        S.close(el);
        onSecondary();
      } else if (e.target === el || e.target.closest("[data-dismiss], [data-secondary]")) {
        el._dismiss();
      }
    });
    return el;
  };
  // The app shows these messages with the phone's own alert (Alert.alert) and a single OK.
  S.alert = (title, text, onOk) => US.alert(title, text, [{ text: "OK", onPress: onOk }]);

  // Dropdown list, as the app's dropdown: a centred card with a title, close X and a tick on the chosen option.
  S.dropdown = ({ title, options, value, onSelect }) => {
    const el = S.layer(`<div class="s-dd-backdrop"><div class="s-dd" role="dialog" aria-modal="true" aria-labelledby="dd-title" tabindex="-1">
      <div class="s-dd__head"><h2 class="s-dd__title" id="dd-title">${esc(title)}</h2><button class="icon-btn" type="button" aria-label="Close" data-dismiss>${icon("x")}</button></div>
      <ul class="s-dd__list" role="listbox" aria-labelledby="dd-title">${options.map((o) => `<li><button class="s-dd__opt" type="button" role="option" aria-selected="${o.value === value}" data-value="${esc(o.value)}">${o.icon ? icon(o.icon) : ""}<span>${esc(o.label)}</span>${o.value === value ? icon("check") : ""}</button></li>`).join("")}</ul>
    </div></div>`);
    el.addEventListener("click", (e) => {
      const opt = e.target.closest("[data-value]");
      if (opt) {
        S.close(el);
        onSelect(opt.dataset.value);
      } else if (e.target === el || e.target.closest("[data-dismiss]")) S.close(el);
    });
    const chosen = el.querySelector('[aria-selected="true"]');
    if (chosen) chosen.scrollIntoView({ block: "nearest" });
    return el;
  };

  // A dropdown field: <button class="s-select" data-select="Category"><span class="s-select__value"></span>…</button>
  S.bindSelect = (btn, options, initial, onChange) => {
    const label = $(".s-select__value", btn);
    const set = (v) => {
      const match = options.find((o) => o.value === v);
      btn.dataset.value = match ? v : "";
      label.textContent = match ? match.label : btn.dataset.placeholder || "Select an option";
    };
    set(initial);
    btn.addEventListener("click", () => S.dropdown({
      title: btn.dataset.select || "Select",
      options,
      value: btn.dataset.value,
      onSelect: (v) => {
        set(v);
        if (onChange) onChange(v);
      },
    }));
    return { set, get: () => btn.dataset.value, open: () => btn.click() };
  };

  // Photo or video picker, as the app's bottom sheet. Nothing is uploaded: the file is only previewed on this page.
  S.mediaPicker = ({ title = "Select Source", cameraTitle = "Take Photo", galleryTitle = "Choose from Library", removeTitle = "Remove Profile Picture", accept = "image/*", onFile, onRemove }) => {
    const el = S.layer(`<div class="sheet-backdrop"><div class="sheet-panel s-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">
      <div class="sheet-panel__handle"></div>
      <div class="s-sheet__head"><h2 class="s-sheet__title" id="sheet-title">${esc(title)}</h2><button class="icon-btn" type="button" aria-label="Close" data-dismiss>${icon("x")}</button></div>
      <div class="s-sheet__list">
        <label class="s-pick"><input class="s-hidden-input" type="file" accept="${accept}" capture="environment" data-pick="camera"><span class="s-pick__box s-pick__box--camera">${icon("camera")}</span><span class="s-pick__label">${esc(cameraTitle)}</span>${icon("chevron-right")}</label>
        <label class="s-pick"><input class="s-hidden-input" type="file" accept="${accept}" data-pick="gallery"><span class="s-pick__box s-pick__box--gallery">${icon("images")}</span><span class="s-pick__label">${esc(galleryTitle)}</span>${icon("chevron-right")}</label>
        ${onRemove ? `<div class="s-sheet__divider"></div><button class="s-pick s-pick--remove" type="button" data-remove><span class="s-pick__box s-pick__box--remove">${icon("trash-2")}</span><span class="s-pick__label">${esc(removeTitle)}</span></button>` : ""}
      </div>
    </div></div>`);
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-remove]")) {
        S.close(el);
        onRemove();
      } else if (e.target === el || e.target.closest("[data-dismiss]")) S.close(el);
    });
    el.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      S.close(el);
      onFile(file);
    });
    return el;
  };

  // Native date and time pickers, opened from a field that looks like the app's.
  const openNativePicker = (input) => {
    try {
      input.showPicker();
    } catch {
      input.focus();
      input.click();
    }
  };
  const toDateValue = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const toTimeValue = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const startOfDay = (d) => {
    const s = new Date(d);
    s.setHours(0, 0, 0, 0);
    return s;
  };

  const loginRequiredHTML = () => `<div class="login-required">
      <div class="empty-state">
        ${icon("sparkles", "empty-state__icon")}
        <h1 class="empty-state__title">Sign up to explore everything</h1>
        <p class="empty-state__text">The next-gen streaming platform where\ncreators earn and viewers engage</p>
      </div>
      <a class="btn btn--primary btn--block" href="sign-in.html">Sign up</a>
    </div>`;

  // ---------- Ultra Studio, also shown on the Create tab for creators ----------
  function renderStudio(root, { embedded }) {
    const loading = state === "loading";
    const st = state === "new" ? S.ZERO_STATS : S.STATS;
    const stats = [
      ["chart-line", S.formatEarnings(st.earned), "Earned", true],
      ["eye", S.formatNumber(st.views), "Views"],
      ["thumbs-up", S.formatNumber(st.likes), "Likes"],
      ["video", S.formatNumber(st.videos), "Videos"],
      ["clapperboard", S.formatNumber(st.shorts), "Shorts"],
      ["radio", S.formatNumber(st.live), "Live"],
    ];
    const row = (href, ic, label) => `<a href="${href}">${icon(ic)}<span>${label}</span>${icon("chevron-right")}</a>`;
    root.innerHTML = `<header class="app-header studio-header">
        <a class="icon-btn" href="${embedded ? "discover.html" : "profile.html"}" data-back aria-label="Back">${icon("arrow-left")}</a>
        <h1 class="app-header__title studio-title">Ultra studio</h1>
        <a class="icon-btn" href="create-channel.html?mode=edit" aria-label="Edit channel">${icon("user-round-pen")}</a>
      </header>
      <div class="studio-scroll"><div class="studio-body">
        <div class="studio-profile">
          <div class="studio-profile__left">
            ${US.avatarHTML(S.CHANNEL.name, "avatar--56")}
            <div class="studio-profile__info">${loading
              ? `<span class="s-skel" style="width:120px;height:20px;margin-bottom:4px"></span><span class="s-skel" style="width:90px;height:14px"></span><span class="s-skel" style="width:70px;height:14px"></span>`
              : `<span class="studio-profile__name">${esc(S.CHANNEL.name)}</span><span class="studio-profile__meta">@${esc(S.CHANNEL.handle)}</span><span class="studio-profile__meta">${S.formatNumber(st.followers)} followers</span>`}</div>
          </div>
          <a class="btn btn--primary" href="channel.html?c=${encodeURIComponent(S.CHANNEL.name)}">View channel</a>
        </div>
        <div class="stats">${stats.map(([ic, value, label, earned]) => `<div class="stat${earned ? " stat--earned" : ""}">
          <span class="stat__head">${icon(ic)}<span>${label}</span></span>
          ${loading ? `<span class="s-skel"></span>` : `<span class="stat__value">${value}</span>`}
        </div>`).join("")}</div>
        <h2 class="studio-section">Quick actions</h2>
        <nav class="studio-menu" aria-label="Quick actions">${row("upload.html", "video", "Upload a video/short")}${row("go-live.html", "radio", "Go live")}</nav>
        <h2 class="studio-section">Studio tools</h2>
        <nav class="studio-menu" aria-label="Studio tools">${row("manage-contents.html", "video", "Manage contents")}${row("analytics.html", "chart-no-axes-column", "Analytics")}</nav>
      </div></div>`;
  }

  S.pages = {};

  // ---------- Create tab ----------
  S.pages.create = () => {
    const as = params.get("as") || "viewer";
    const root = $("#create-root");
    root.dataset.as = as;
    if (as === "guest") {
      $("#guest-topbar").hidden = false;
      root.innerHTML = loginRequiredHTML();
    } else if (as === "creator") {
      renderStudio(root, { embedded: true });
    } else {
      root.innerHTML = `<div class="benefits">
        <div class="benefits__header">
          <img class="benefits__logo" src="../assets/img/logo-icon.png" alt="UltraStream">
          <h1 class="benefits__title">Share your content with millions of viewers worldwide</h1>
        </div>
        <ul class="benefits__list">
          <li class="benefits__item"><span class="benefits__icon benefits__stack">${icon("clock")}${icon("dollar-sign")}</span>Earn from your content</li>
          <li class="benefits__item"><span class="benefits__icon">${icon("users-round")}</span>Build your community</li>
          <li class="benefits__item"><span class="benefits__icon">${icon("compass")}</span>Grow your channel</li>
        </ul>
        <div class="benefits__footer"><a class="btn btn--primary btn--block" href="create-channel.html">Get Started</a></div>
      </div>`;
    }
  };

  // ---------- Ultra Studio ----------
  S.pages.studio = () => renderStudio($("#studio-root"), { embedded: false });

  // ---------- Manage contents ----------
  S.pages.manage = () => {
    const root = $("#manage-root");
    const TYPES = { videos: "VIDEO", shorts: "SHORTS", lives: "LIVE_STREAM" };
    const NOUNS = { videos: ["videos", "video"], shorts: ["shorts", "short"], lives: ["lives", "live recording"] };
    let tab = ["shorts", "lives"].includes(state) ? state : "videos";
    let filter = state.startsWith("scheduled") ? "scheduled" : "published";
    let items = state === "empty" ? [] : state === "scheduled-empty" ? S.CONTENT.filter((c) => !c.scheduledAt) : S.CONTENT.slice();
    let openMenu = null;

    const header = `<header class="app-header studio-header">
      <a class="icon-btn" href="ultra-studio.html" data-back aria-label="Back">${icon("arrow-left")}</a>
      <h1 class="app-header__title studio-title">Manage contents</h1>
    </header>`;
    if (state === "login") {
      root.innerHTML = header + loginRequiredHTML();
      return;
    }

    root.innerHTML = `${header}
      <div class="mc-tabs" role="tablist" aria-label="Content type">${Object.keys(TYPES).map((t) => `<button class="mc-tab" type="button" role="tab" id="tab-${t}" aria-controls="mc-list" data-tab="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div>
      <div class="mc-divider"></div>
      <div class="mc-filters">
        <button class="mc-filter" type="button" data-filter="published">Published</button>
        <button class="mc-filter" type="button" data-filter="scheduled">Scheduled</button>
        <button class="mc-delete-all" type="button" id="delete-all" hidden>${icon("trash-2")}Delete all</button>
      </div>
      <div class="mc-list" id="mc-list" role="tabpanel"></div>`;
    const list = $("#mc-list");

    const ofTab = () => items.filter((c) => c.type === TYPES[tab]);
    const visible = () => ofTab().filter((c) => (filter === "scheduled" ? !!c.scheduledAt : !c.scheduledAt));

    const itemHTML = (c) => {
      const live = c.type === "LIVE_STREAM";
      const meta = c.scheduledAt ? S.scheduledLines(c.scheduledAt).map((l) => `<span>${esc(l)}</span>`).join("") : `<span>${c.views} views • ${esc(c.ago)}</span>`;
      const href = `watch.html?id=${c.play}`;
      return `<article class="mc-item" data-id="${c.id}">
        <a class="mc-thumb" href="${href}" style="${US.thumbStyle(c)}" tabindex="-1" aria-hidden="true">${live ? `<span class="mc-badge mc-badge--live"><span class="mc-badge__dot"></span>Live</span><span class="mc-badge mc-badge--views">${c.views}</span>` : ""}</a>
        <div class="mc-foot">
          <a class="mc-body" href="${href}"><span class="mc-title">${esc(c.title)}</span><span class="mc-meta">${meta}</span></a>
          <button class="icon-btn" type="button" aria-label="More options" aria-haspopup="menu" aria-expanded="false" data-menu="${c.id}">${icon("ellipsis-vertical")}</button>
        </div>
      </article>`;
    };

    const render = () => {
      closeMenu();
      $$("[data-tab]", root).forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === tab));
      $$("[data-filter]", root).forEach((b) => b.setAttribute("aria-pressed", b.dataset.filter === filter));
      list.setAttribute("aria-labelledby", "tab-" + tab);
      $("#delete-all").hidden = state === "loading" || state === "error" || ofTab().length === 0;
      if (state === "loading") {
        list.innerHTML = `<div class="mc-center" role="status" aria-label="Loading">${US.spinnerHTML()}</div>`;
        return;
      }
      if (state === "error") {
        list.innerHTML = `<div class="empty-state">${icon("wifi-off", "empty-state__icon")}<h2 class="empty-state__title">Couldn't load your content</h2><p class="empty-state__text">Check your connection and try again.</p></div>`;
        return;
      }
      const shown = visible();
      if (!shown.length) {
        const sched = filter === "scheduled";
        list.innerHTML = `<div class="mc-empty">
          <div class="empty-state">${icon("clapperboard", "empty-state__icon")}
            <h2 class="empty-state__title">${sched ? "No content scheduled yet" : "No content created yet"}</h2>
            <p class="empty-state__text">${sched ? "Start scheduling videos, or shorts to share with your audience." : "Start creating videos, shorts, or live streams to share with your audience."}</p>
          </div>
          <a class="btn btn--primary" href="upload.html">${sched ? "Schedule content" : "Create content"}</a>
        </div>`;
        return;
      }
      list.innerHTML = shown.map(itemHTML).join("");
    };

    function closeMenu() {
      if (!openMenu) return;
      openMenu.menu.remove();
      openMenu.button.setAttribute("aria-expanded", "false");
      openMenu = null;
    }
    const showMenu = (button) => {
      const c = S.find(button.dataset.menu);
      const menu = document.createElement("div");
      menu.className = "mc-menu";
      menu.setAttribute("role", "menu");
      // As in the app, only videos can be edited from here.
      menu.innerHTML = `${c.type === "VIDEO" ? `<button type="button" role="menuitem" data-edit="${c.id}">${icon("pencil")}Edit</button>` : ""}<button type="button" role="menuitem" data-delete="${c.id}">${icon("trash-2")}Delete</button>`;
      button.parentElement.append(menu);
      button.setAttribute("aria-expanded", "true");
      openMenu = { menu, button };
      menu.querySelector("button").focus({ preventScroll: true });
    };
    const askDelete = (id) => S.confirm({
      title: "Delete video?",
      text: "Are you sure you want to delete this video? This action cannot be undone.",
      // When the delete fails, the app keeps the dialog open and shows its error banner.
      keepOpen: () => state === "delete-error",
      onConfirm: () => {
        if (state === "delete-error") {
          US.appToast("Failed to delete video. Please try again.");
          return;
        }
        items = items.filter((c) => c.id !== id);
        render();
      },
    });
    const askDeleteAll = () => {
      const [plural, single] = NOUNS[tab];
      S.confirm({
        title: `Delete all ${plural}?`,
        text: `This deletes every ${single} on your channel, published and scheduled. This can't be undone.`,
        confirm: "Delete all",
        onConfirm: () => {
          // Deleting shows no message: the list simply updates, as after a single delete in the app.
          items = items.filter((c) => c.type !== TYPES[tab]);
          render();
        },
      });
    };

    root.addEventListener("click", (e) => {
      const t = e.target.closest("[data-tab]");
      const f = e.target.closest("[data-filter]");
      const m = e.target.closest("[data-menu]");
      const edit = e.target.closest("[data-edit]");
      const del = e.target.closest("[data-delete]");
      if (t) { tab = t.dataset.tab; render(); return; }
      if (f) { filter = f.dataset.filter; render(); return; }
      if (e.target.closest("#delete-all")) { askDeleteAll(); return; }
      if (edit) { location.href = `upload.html?mode=edit&id=${edit.dataset.edit}`; return; }
      if (del) { closeMenu(); askDelete(del.dataset.delete); return; }
      if (m) {
        const same = openMenu && openMenu.button === m;
        closeMenu();
        if (!same) showMenu(m);
        return;
      }
      if (openMenu && !e.target.closest(".mc-menu")) closeMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && openMenu) {
        const b = openMenu.button;
        closeMenu();
        b.focus();
      }
    });

    render();
    if (state === "menu") showMenu($("[data-menu]", list));
    if (state === "delete" || state === "delete-error") askDelete(visible()[0].id);
    if (state === "delete-all") askDeleteAll();
  };

  // ---------- Upload or edit a video or short ----------
  S.pages.upload = () => {
    const editing = params.get("mode") === "edit" || state.startsWith("edit");
    const video = editing ? S.find(params.get("id")) || S.find(state === "edit-scheduled" ? "s0" : "v3") : null;
    const scheduledEdit = !!(video && video.scheduledAt);
    const el = {
      title: $("#title"), desc: $("#desc"), count: $("#desc-count"), file: $("#file-section"), thumb: $("#thumb-section"),
      scheduleRow: $("#schedule-row"), schedule: $("#schedule"), fields: $("#schedule-fields"),
      dateBtn: $("#date-btn"), date: $("#date"), timeBtn: $("#time-btn"), time: $("#time"),
      publish: $("#publish"), save: $("#save"), del: $("#delete"),
    };
    const sample = { name: "myvideo.mp4" };
    const f = { type: "video", file: null, thumb: null, thumbRemoved: false, schedule: false, date: null, time: null };
    let initial = null;
    let upload = null;

    const typeField = S.bindSelect($("#type"), [{ label: "Video", value: "video", icon: "video" }, { label: "Short", value: "shorts", icon: "circle-play" }], "video", (v) => {
      f.type = v;
      renderThumb();
    });
    const category = S.bindSelect($("#category"), S.CATEGORY_OPTIONS, editing ? "" : "Gaming", () => renderActions());

    const updateCount = () => { el.count.textContent = `${el.desc.value.length}/250`; };
    const thumbBg = (t) => (t.url ? `background-image:url('${t.url}')` : t.style);
    const combine = () => {
      if (!f.date || !f.time) return null;
      const d = new Date(f.date);
      d.setHours(f.time.getHours(), f.time.getMinutes(), 0, 0);
      return d;
    };
    const inFuture = () => {
      const d = combine();
      return !!d && d.getTime() > Date.now();
    };
    const defaultTime = (forDate) => {
      const now = new Date();
      const isToday = forDate && startOfDay(forDate).getTime() === startOfDay(now).getTime();
      const t = isToday || !forDate ? now : startOfDay(forDate);
      t.setMinutes(0, 0, 0);
      t.setHours(t.getHours() + 1);
      return t;
    };

    const snapshot = () => ({ title: el.title.value.trim(), desc: el.desc.value.trim(), category: category.get(), schedule: f.schedule, at: f.schedule && combine() ? combine().getTime() : null });
    const hasEditChanges = () => {
      if (!editing || !initial) return false;
      if (f.thumbRemoved || (f.thumb && f.thumb.url)) return true;
      const now = snapshot();
      return Object.keys(now).some((k) => now[k] !== initial[k]);
    };
    const isDirty = () => (editing ? hasEditChanges() : !!(f.file || f.thumb || el.title.value.trim() || el.desc.value.trim() || f.schedule));
    const busy = () => !!upload && ["uploading", "paused", "processing"].includes(upload.status);

    function renderFile() {
      if (editing) { el.file.hidden = true; return; }
      el.file.innerHTML = f.file
        ? `<div class="up-file">${icon("clapperboard")}<span class="up-file__name">${esc(f.file.name)}</span><button class="icon-btn" type="button" id="remove-file" aria-label="Remove video file">${icon("x")}</button></div>`
        : `<button class="up-drop" type="button" id="pick-video">${icon("upload")}<span class="up-drop__title">Upload video</span><span class="up-drop__hint">mp4, mov, or avi (max up to 2GB)</span></button>`;
    }
    function renderThumb() {
      const short = f.type === "shorts";
      el.thumb.innerHTML = f.thumb
        ? `<div class="up-thumb"><div class="up-thumb__img${short ? " up-thumb__img--short" : ""}" style="${thumbBg(f.thumb)}" role="img" aria-label="Thumbnail"></div>
            <div class="up-thumb__actions"><button class="btn" type="button" id="pick-thumb">${icon("camera", "icon--sm")}Upload thumbnail</button><button class="btn btn-outline-red" type="button" id="remove-thumb">Remove</button></div></div>`
        : `<button class="up-drop up-drop--thumb${short ? " up-drop--short" : ""}" type="button" id="pick-thumb">${icon("upload")}<span class="up-drop__title">Upload thumbnail</span></button>`;
    }
    function renderSchedule() {
      // When editing, only videos that are still scheduled show the schedule switch.
      el.scheduleRow.hidden = editing && !scheduledEdit;
      el.schedule.setAttribute("aria-checked", f.schedule);
      el.fields.hidden = !f.schedule || el.scheduleRow.hidden;
      const setPick = (btn, value, empty) => {
        const v = $(".s-select__value", btn);
        v.textContent = value || empty;
        v.classList.toggle("s-select__value--placeholder", !value);
      };
      setPick(el.dateBtn, f.date && S.formatDate(f.date), "Pick a date");
      setPick(el.timeBtn, f.time && S.formatTime(f.time), "Pick a time");
    }
    function renderActions() {
      if (editing) {
        el.publish.hidden = true;
        el.save.hidden = !hasEditChanges();
        el.del.hidden = false;
        return;
      }
      el.publish.disabled = busy();
      el.publish.innerHTML = busy() ? `${spinner}<span>${f.schedule ? "Schedule video" : "Publish video"}</span>` : f.schedule ? "Schedule video" : "Publish video";
    }
    const renderAll = () => { renderFile(); renderThumb(); renderSchedule(); renderActions(); };

    const pick = (kind) => S.mediaPicker({
      title: kind === "video" ? "Select Video" : "Select Thumbnail",
      cameraTitle: kind === "video" ? "Take Video" : "Take Photo",
      accept: kind === "video" ? "video/*" : "image/*",
      onFile: (file) => {
        if (kind === "video") {
          f.file = { name: file.name };
          renderFile();
        } else {
          f.thumb = { url: URL.createObjectURL(file) };
          f.thumbRemoved = false;
          renderThumb();
        }
        renderActions();
      },
    });

    const turnScheduleOn = () => {
      f.schedule = true;
      const today = startOfDay(new Date());
      if (!f.date || f.date < today) {
        f.date = new Date(today);
        f.date.setDate(f.date.getDate() + 1);
      }
      if (!f.time || !inFuture()) f.time = defaultTime(f.date);
    };

    // ----- Upload progress banner -----
    const bannerHost = $("#banner");
    let bannerKey = "";
    const titleFor = (u) => (u.status === "completed" ? "Video Uploaded!" : u.interrupted ? "Upload Interrupted" : u.status === "error" ? "Upload Failed" : u.status === "paused" ? "Upload Paused" : u.status === "processing" ? "Processing Video..." : u.phase === "preparing" ? "Preparing Video..." : u.phase === "completing" ? "Finalizing Upload..." : "Uploading Video...");
    const subFor = (u) => {
      if (u.status === "uploading") return u.phase === "preparing" ? `Preparing video... ${u.progress}%` : u.phase === "completing" ? `Finalizing upload... ${u.progress}%` : `${u.progress}% uploaded • Keep app open`;
      if (u.status === "paused") return "Waiting for connection...";
      if (u.status === "processing") return "Your video is being prepared";
      if (u.status === "completed") return "Your video is now live";
      if (u.interrupted) return `${u.progress}% uploaded • Tap Resume to continue`;
      return "Upload failed. Tap to dismiss";
    };
    function renderBanner() {
      if (!upload) {
        bannerHost.innerHTML = "";
        bannerKey = "";
        return;
      }
      const u = upload;
      const key = u.status + (u.interrupted ? "-i" : "");
      if (key !== bannerKey) {
        bannerKey = key;
        const error = u.status === "error";
        const overlay = u.status === "uploading" || u.status === "processing" ? US.spinnerHTML("spinner--white") : u.status === "paused" ? icon("circle-pause") : "";
        const showBar = u.status === "uploading" || u.status === "paused" || u.interrupted;
        bannerHost.innerHTML = `<div class="up-banner" role="status" aria-live="polite">
          <div class="up-banner__info">
            <span class="up-banner__thumb" style="${u.thumb ? thumbBg(u.thumb) : ""}">${u.thumb ? "" : icon("video")}${overlay ? `<span class="up-banner__overlay">${overlay}</span>` : ""}</span>
            <button class="up-banner__text" type="button" id="banner-text"${u.interrupted ? "" : ' tabindex="-1"'}><span class="up-banner__title"></span><span class="up-banner__sub"></span></button>
            <button class="icon-btn up-banner__close${error ? " up-banner__close--error" : ""}" type="button" id="banner-close" aria-label="${["uploading", "paused"].includes(u.status) || u.interrupted ? "Cancel upload" : "Dismiss"}">${icon(error ? "circle-alert" : "circle-x")}</button>
          </div>
          ${showBar ? `<div class="up-banner__bar"><div class="up-banner__fill"></div></div>` : ""}
          ${u.interrupted ? `<div class="up-banner__actions"><button class="up-banner__resume" type="button" id="banner-resume">Resume</button><button class="up-banner__discard" type="button" id="banner-discard">Discard</button></div>` : ""}
        </div>`;
      }
      $(".up-banner__title", bannerHost).textContent = titleFor(u);
      $(".up-banner__sub", bannerHost).textContent = subFor(u);
      const fill = $(".up-banner__fill", bannerHost);
      if (fill) fill.style.width = u.progress + "%";
    }
    const stopTimer = () => { if (upload && upload.timer) clearInterval(upload.timer); };
    const resetUpload = () => {
      stopTimer();
      upload = null;
      renderBanner();
      renderActions();
    };
    const run = () => {
      stopTimer();
      upload.timer = setInterval(() => {
        const u = upload;
        if (u.status === "uploading") {
          u.progress = Math.min(100, u.progress + 3);
          u.phase = u.progress < 6 ? "preparing" : u.progress < 95 ? "uploading" : "completing";
          if (u.progress === 100) {
            u.status = "processing";
            u.ticks = 0;
          }
        } else if (u.status === "processing" && ++u.ticks > 10) {
          u.status = "completed";
          u.ticks = 0;
          renderActions();
        } else if (u.status === "completed" && ++u.ticks > 13) {
          // As in the app, the banner hides two seconds after the upload finishes. The form starts again.
          resetUpload();
          clearForm();
          return;
        }
        renderBanner();
      }, 150);
    };
    const startUpload = (from = {}) => {
      upload = { status: "uploading", phase: "preparing", progress: 0, interrupted: false, thumb: f.thumb, ticks: 0, ...from };
      renderBanner();
      renderActions();
      if (!from.frozen) run();
    };
    function clearForm() {
      f.file = null; f.thumb = null; f.schedule = false; f.date = null; f.time = null;
      el.title.value = ""; el.desc.value = "";
      category.set("Gaming");
      updateCount();
      renderAll();
    }
    const askCancelUpload = () => S.confirm({
      title: "Cancel upload?",
      text: "This will stop the upload and remove any uploaded chunks.",
      confirm: "Keep uploading",
      cancel: "Cancel upload",
      onSecondary: resetUpload,
    });

    // ----- Actions -----
    const publish = () => {
      if (busy()) return;
      if (!f.file) return S.alert("Error", "Please select a video file");
      if (!el.title.value.trim()) return S.alert("Error", "Please enter a video title");
      if (!category.get()) return S.alert("Error", "Please select a category");
      if (f.schedule && !inFuture()) return S.alert("Error", "Please pick a future date and time for scheduling");
      startUpload();
    };
    const save = () => {
      if (!el.title.value.trim()) return S.alert("Error", "Please enter a video title");
      if (!category.get()) return S.alert("Error", "Please select a category");
      if (f.schedule && !inFuture()) return S.alert("Error", "Please pick a future date and time for scheduling");
      if (!hasEditChanges()) return S.alert("No changes", "Nothing to update.");
      S.alert("Success", "Video updated successfully", () => S.goBack("manage-contents.html"));
    };
    const askDeleteVideo = () => S.confirm({
      title: "Delete video?",
      text: "Are you sure you want to delete this video? This cannot be undone.",
      onConfirm: () => S.goBack("manage-contents.html"),
    });
    const back = () => {
      const home = editing ? "manage-contents.html" : "ultra-studio.html";
      if (isDirty() && !busy()) {
        S.confirm({ title: "Discard changes?", text: "You have unsaved changes. Your edits will be lost.", confirm: "Discard", cancel: "Continue editing", onConfirm: () => S.goBack(home) });
      } else S.goBack(home);
    };

    document.addEventListener("click", (e) => {
      const id = e.target.closest("button") && e.target.closest("button").id;
      if (!id) return;
      if (id === "back") back();
      else if (id === "pick-video") pick("video");
      else if (id === "pick-thumb") pick("thumb");
      else if (id === "remove-file") { f.file = null; renderFile(); }
      else if (id === "remove-thumb") { f.thumb = null; f.thumbRemoved = true; renderThumb(); renderActions(); }
      else if (id === "schedule") {
        if (f.schedule) f.schedule = false;
        else turnScheduleOn();
        renderSchedule(); renderActions();
      } else if (id === "date-btn") {
        const min = startOfDay(new Date());
        const max = new Date();
        max.setMonth(max.getMonth() + 1);
        el.date.min = toDateValue(min);
        el.date.max = toDateValue(max);
        el.date.value = toDateValue(f.date || min);
        openNativePicker(el.date);
      } else if (id === "time-btn") {
        el.time.value = toTimeValue(f.time || defaultTime(f.date));
        openNativePicker(el.time);
      } else if (id === "publish") publish();
      else if (id === "save") save();
      else if (id === "delete") askDeleteVideo();
      else if (id === "banner-close") {
        if (["uploading", "paused"].includes(upload.status) || upload.interrupted) askCancelUpload();
        else resetUpload();
      } else if (id === "banner-discard") askCancelUpload();
      else if (id === "banner-resume" || (id === "banner-text" && upload.interrupted)) {
        upload.status = "uploading";
        upload.interrupted = false;
        renderBanner();
        run();
      }
    });
    el.date.addEventListener("change", () => {
      if (!el.date.value) return;
      const [y, m, d] = el.date.value.split("-").map(Number);
      let picked = new Date(y, m - 1, d);
      const max = new Date();
      max.setMonth(max.getMonth() + 1);
      if (picked > max) picked = startOfDay(max);
      if (picked < startOfDay(new Date())) return S.alert("Error", "Please pick a future date");
      f.date = picked;
      if (f.time && !inFuture()) f.time = defaultTime(f.date);
      renderSchedule(); renderActions();
    });
    el.time.addEventListener("change", () => {
      if (!el.time.value) return;
      const [h, min] = el.time.value.split(":").map(Number);
      const t = new Date(f.date || new Date());
      t.setHours(h, min, 0, 0);
      if (t.getTime() <= Date.now()) return S.alert("Error", "Please pick a future time");
      f.time = t;
      renderSchedule(); renderActions();
    });
    el.title.addEventListener("input", renderActions);
    el.desc.addEventListener("input", () => { updateCount(); renderActions(); });

    // ----- Starting point for each state -----
    const fill = (type = "video") => {
      f.type = type;
      typeField.set(type);
      f.file = { name: type === "shorts" ? "myshort.mp4" : sample.name };
      f.thumb = { style: US.thumbStyle({ hue: type === "shorts" ? 280 : 30 }) };
      el.title.value = type === "shorts" ? "Ten seconds of pure panic" : "Ranked grind to the final circle";
      el.desc.value = "Road to the top rank: clutch plays, close calls and a few funny moments with the squad.";
    };
    if (editing) {
      document.title = "Edit video – UltraStream design";
      $("#page-title").textContent = "Edit video";
      phone().setAttribute("aria-label", "Edit video");
      $("#type-section").hidden = true;
      f.type = video.type === "SHORTS" ? "shorts" : "video";
      f.thumb = { style: US.thumbStyle(video) };
      el.title.value = video.title;
      el.desc.value = "A sample description for this video. Real descriptions can run up to 250 characters.";
      category.set(video.category);
      if (scheduledEdit) {
        f.schedule = true;
        f.date = startOfDay(video.scheduledAt);
        f.time = new Date(video.scheduledAt);
      }
      initial = snapshot();
      if (state === "edit-changed" || state === "edit-discard") el.title.value += " (director's cut)";
    } else if (state === "filled" || state === "missing-title" || state === "discard" || state === "uploading" || state === "cancel-upload" || ["processing", "done", "paused", "interrupted", "failed"].includes(state)) {
      fill();
      if (state === "missing-title") el.title.value = "";
    } else if (state === "short") fill("shorts");
    else if (state === "scheduled") {
      fill("shorts");
      turnScheduleOn();
    }
    updateCount();
    renderAll();

    if (state === "missing-file" || state === "missing-title") publish();
    if (state === "picker") pick("video");
    if (state === "type") typeField.open();
    if (state === "category") category.open();
    if (state === "discard" || state === "edit-discard") back();
    if (state === "edit-delete") askDeleteVideo();
    if (state === "edit-saved") { el.title.value += " (director's cut)"; renderActions(); save(); }
    if (state === "uploading") startUpload({ phase: "uploading", progress: 10 });
    if (state === "cancel-upload") { startUpload({ phase: "uploading", progress: 10, frozen: true }); askCancelUpload(); }
    if (state === "processing") startUpload({ status: "processing", progress: 100, frozen: true });
    if (state === "done") startUpload({ status: "completed", progress: 100, frozen: true });
    if (state === "paused") startUpload({ status: "paused", progress: 46, frozen: true });
    if (state === "interrupted") startUpload({ status: "error", interrupted: true, progress: 46, frozen: true });
    if (state === "failed") startUpload({ status: "error", progress: 46, frozen: true });
  };

  // ---------- Go Live ----------
  S.pages.live = () => {
    const tips = $("#tips");
    const category = S.bindSelect($("#category"), S.CATEGORY_OPTIONS, "Gaming");
    tips.addEventListener("click", () => tips.setAttribute("aria-checked", tips.getAttribute("aria-checked") !== "true"));
    // Review note: in the app this button has no action yet.
    $("#go").addEventListener("click", () => US.toast("Going live isn't connected in the app yet."));
    if (state === "filled") $("#stream-title").value = "Friday night ranked, come hang out";
    if (state === "tips-off") tips.setAttribute("aria-checked", "false");
    if (state === "category") category.open();
  };

  // ---------- Analysis ----------
  // The app shows fixed sample numbers on this screen. The period menu changes only its label.
  S.barChart = (data, highlight, { max = 3000, yLabels = ["0", "1k", "2k", "3k"], label = "" } = {}) => {
    const steps = yLabels.length - 1;
    const plotHeight = 168 - 8 - 28;
    return `<div class="bar-chart" role="img" aria-label="${esc(label)}: ${data.map(([d, v]) => `${d} ${v}`).join(", ")}">
      <div class="bar-chart__plot">
        ${yLabels.map((_, i) => `<span class="bar-chart__grid" style="bottom:${(i / steps) * 100}%"></span>`).join("")}
        ${data.map(([, v], i) => `<span class="bar-chart__bar${i === highlight ? " bar-chart__bar--on" : ""}" style="height:${(v / max) * 100}%"></span>`).join("")}
      </div>
      ${yLabels.map((l, i) => `<span class="bar-chart__y" style="bottom:${28 + (i / steps) * plotHeight - 6}px">${l}</span>`).join("")}
      <div class="bar-chart__x">${data.map(([d]) => `<span>${d}</span>`).join("")}</div>
    </div>`;
  };
  S.pages.analysis = () => {
    const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const views = [1600, 700, 1800, 1000, 2400, 600, 1500];
    const revenue = [1700, 800, 1800, 1000, 2500, 500, 1600];
    const card = (title, growth, values, highlight) => `<section class="an-card">
      <h2 class="an-card__title">${title}</h2>
      <span class="an-card__growth">${growth} vs last period</span>
      <div class="an-card__divider"></div>
      ${S.barChart(values.map((v, i) => [DAYS[i], v]), highlight, { label: title })}
    </section>`;
    $("#charts").innerHTML = `${card("Average views (12.5k)", "+12.3%", views, 4)}${card("Revenue (125k)", "+8.7%", revenue, 3)}
      <div class="an-metrics">
        <div class="an-metric">${icon("users")}<span class="an-metric__value">12k</span>Followers</div>
        <div class="an-metric">${icon("thumbs-up")}<span class="an-metric__value">12%</span>Like rates</div>
      </div>`;
    const btn = $("#period");
    const menu = $("#period-menu");
    const setOpen = (open) => {
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", open);
      $("#chev-down").hidden = open;
      $("#chev-up").hidden = !open;
    };
    const choose = (value) => {
      $$("[data-period]", menu).forEach((b) => b.setAttribute("aria-checked", b.dataset.period === value));
      $("#period-label").textContent = $(`[data-period="${value}"]`, menu).textContent;
    };
    btn.addEventListener("click", () => setOpen(menu.hidden));
    menu.addEventListener("click", (e) => {
      const b = e.target.closest("[data-period]");
      if (!b) return;
      choose(b.dataset.period);
      setOpen(false);
      btn.focus();
    });
    document.addEventListener("click", (e) => { if (!menu.hidden && !e.target.closest(".an-period")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { setOpen(false); btn.focus(); } });
    if (state === "30d" || state === "90d") choose(state);
    if (state === "period-menu") setOpen(true);
  };

  // ---------- Create or edit channel ----------
  S.pages.channel = () => {
    const editing = params.get("mode") === "edit" || state.startsWith("edit") || state === "updating";
    const fields = { name: $("#name"), handle: $("#handle"), bio: $("#bio") };
    const avatar = $("#avatar");
    let photo = null; // { url } or { style }. With none, the app shows a grey circle with a person icon.
    const category = S.bindSelect($("#category"), S.CATEGORY_OPTIONS, "", () => setError("category", ""));

    const setError = (key, message) => {
      if (key === "avatar") {
        const p = $("#avatar-error");
        p.textContent = message;
        p.hidden = !message;
        return;
      }
      const wrap = $(`#f-${key}`);
      const p = $(".s-error", wrap);
      wrap.classList.toggle("s-field--invalid", !!message);
      p.textContent = message;
      p.hidden = !message;
      const input = $(".s-input, .s-select", wrap);
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    };
    const renderAvatar = () => {
      avatar.style.cssText = photo ? (photo.url ? `background-image:url('${photo.url}')` : photo.style) : "";
      avatar.innerHTML = photo ? "" : icon("user-round");
      avatar.setAttribute("aria-label", photo ? "Channel photo" : "No channel photo");
    };
    const updateCount = () => { $("#bio-count").textContent = `${fields.bio.value.length}/250`; };
    // Handles keep letters, numbers and underscores, up to 30, and always start with @.
    const sanitizeHandle = (value) => {
      const clean = value.replace(/^@+/, "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30);
      return clean ? "@" + clean : value.startsWith("@") ? "@" : "";
    };

    const validate = () => {
      const errors = {
        avatar: !photo && !editing ? "Upload profile image" : "",
        name: fields.name.value.trim() ? "" : "Enter your channel name",
        handle: !fields.handle.value.trim() ? "Enter your channel handle" : /^[a-zA-Z0-9_]{3,30}$/.test(fields.handle.value.trim().replace(/^@+/, "")) ? "" : "Use 3-30 characters (letters, numbers, underscore).",
        bio: fields.bio.value.trim() ? "" : "Enter a short channel description",
        category: category.get() ? "" : "Please select a category",
      };
      Object.entries(errors).forEach(([k, m]) => setError(k, m));
      return Object.values(errors).every((m) => !m);
    };

    const submit = $("#submit");
    const submitLabel = editing ? "Save Data" : "Create channel";
    const showSuccess = () => {
      $("#form-view").hidden = true;
      $("#edit-header").hidden = true;
      $("#success").hidden = false;
      $("#success-title").textContent = editing ? "Channel updated successfully" : "Your channel is live!";
      $("#success-text").textContent = editing ? "Your changes have been saved." : "Start creating\ncontent and grow your audience.";
      const cont = $("#continue");
      cont.setAttribute("href", editing ? "ultra-studio.html" : "discover.html");
      if (editing) cont.setAttribute("data-back", "");
    };
    const save = (instant) => {
      if (!validate()) {
        const first = $(".s-field--invalid .s-input, .s-field--invalid .s-select");
        if (first) first.focus();
        return;
      }
      submit.disabled = true;
      submit.innerHTML = `${spinner}<span>${editing ? "Updating channel..." : "Creating channel..."}</span>`;
      if (!instant) setTimeout(showSuccess, 900);
    };
    const pickPhoto = () => S.mediaPicker({
      title: "Change channel photo",
      onFile: (file) => {
        photo = { url: URL.createObjectURL(file) };
        renderAvatar();
        setError("avatar", "");
      },
      onRemove: removePhoto,
    });
    function removePhoto() {
      photo = null;
      renderAvatar();
      setError("avatar", "");
    }
    const askDelete = () => S.confirm({
      title: "Delete channel?",
      text: `Are you sure you want to delete "${S.CHANNEL.name}"? This action cannot be undone.`,
      confirm: "Delete",
      onConfirm: () => S.alert("Success", "Channel deleted successfully", () => { location.href = "profile.html"; }),
    });

    fields.name.addEventListener("input", () => setError("name", ""));
    fields.handle.addEventListener("input", () => {
      const pos = fields.handle.value.length;
      fields.handle.value = sanitizeHandle(fields.handle.value);
      if (pos !== fields.handle.value.length) fields.handle.setSelectionRange(fields.handle.value.length, fields.handle.value.length);
      setError("handle", "");
    });
    fields.bio.addEventListener("input", () => { updateCount(); setError("bio", ""); });
    $("#upload-photo").addEventListener("click", pickPhoto);
    $("#remove-photo").addEventListener("click", removePhoto);
    submit.addEventListener("click", () => save(false));
    $("#delete").addEventListener("click", askDelete);

    // The sample channel has no picture, as everywhere else in the rebuild.
    const fillSample = () => {
      photo = null;
      fields.name.value = S.CHANNEL.name;
      fields.handle.value = "@" + S.CHANNEL.handle;
      fields.bio.value = S.CHANNEL.bio;
      category.set(S.CHANNEL.category);
    };
    if (editing) {
      document.title = "Edit channel – UltraStream design";
      phone().setAttribute("aria-label", "Edit channel");
      $("#edit-header").hidden = false;
      $("#create-head").hidden = true;
      $$("[data-edit-hint]").forEach((h) => { h.hidden = false; });
      $("#go-back").hidden = true;
      $("#delete").hidden = false;
      fillSample();
    }
    submit.textContent = submitLabel;
    if (["filled", "photo", "creating", "success"].includes(state)) fillSample();
    if (state === "photo") { fields.name.value = ""; fields.handle.value = ""; fields.bio.value = ""; category.set(""); }
    renderAvatar();
    updateCount();

    if (state === "errors") save(false);
    if (state === "picker" || state === "edit-picker") pickPhoto();
    if (state === "category") category.open();
    if (state === "creating" || state === "updating") save(true);
    if (state === "success" || state === "edit-success") showSuccess();
    if (state === "edit-delete") askDelete();
  };

  // ---------- Channel settings ----------
  S.pages.settings = () => {
    const ask = () => S.confirm({
      title: "Delete channel?",
      text: `Are you sure you want to delete "${S.CHANNEL.name}"? This action cannot be undone.`,
      confirm: "Delete",
      onConfirm: () => S.alert("Success", "Channel deleted successfully", () => { location.href = "profile.html"; }),
    });
    $("#delete").addEventListener("click", ask);
    if (state === "delete") ask();
    if (state === "deleted") S.alert("Success", "Channel deleted successfully", () => { location.href = "profile.html"; });
  };

  const page = document.body.dataset.page;
  if (S.pages[page]) S.pages[page]();
})();
