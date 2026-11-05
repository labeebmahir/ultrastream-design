// Video page, plus the sheets and dialogs the channel pages share: reward, confirm and overlays.
(function () {
  const esc = US.esc;
  const phone = document.querySelector(".phone");

  // Overlays close with Esc, newest first. Focus goes back to whatever opened them.
  const stack = [];
  function pushOverlay(el, onClose) {
    const opener = document.activeElement;
    const entry = {
      el,
      close() {
        const i = stack.indexOf(entry);
        if (i === -1) return;
        stack.splice(i, 1);
        el.remove();
        onClose?.();
        if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
      },
    };
    stack.push(entry);
    // Focus the sheet itself, so keyboard users start inside it without a focus ring on the first button.
    const target = el.querySelector("[role=dialog], [role=alertdialog]") || el;
    target.setAttribute("tabindex", "-1");
    requestAnimationFrame(() => target.focus({ preventScroll: true }));
    return entry;
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && stack.length) {
      e.preventDefault();
      stack[stack.length - 1].close();
    }
  });

  // Avatars for anyone: the app's no-picture avatar, as nobody in the sample data has a picture.
  const avatar = (name, extra = "") => US.avatarHTML(name, extra);

  // A sheet that slides up over the whole screen, with a dimmed backdrop that closes it.
  function openSheet(className, label, html, onClose) {
    const backdrop = document.createElement("div");
    backdrop.className = "sheet-backdrop";
    backdrop.innerHTML = `<div class="sheet-panel ${className}" role="dialog" aria-modal="true" aria-label="${esc(label)}">${html}</div>`;
    phone.append(backdrop);
    const entry = pushOverlay(backdrop, onClose);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) entry.close(); });
    return { panel: backdrop.firstElementChild, close: entry.close };
  }

  // Confirmation dialog: close X, title, one line, gradient confirm and outlined Cancel.
  function openDialog({ title, text, confirm, cancel, onConfirm }) {
    const backdrop = document.createElement("div");
    backdrop.className = "dialog-backdrop";
    backdrop.innerHTML = `<div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
      <button class="icon-btn dialog__close" type="button" aria-label="Close"><i class="icon" data-lucide="x"></i></button>
      <h2 class="dialog__title" id="dialog-title">${esc(title)}</h2>
      <p class="dialog__text">${esc(text)}</p>
      <button class="btn btn--primary btn--block" type="button" data-confirm>${esc(confirm)}</button>
      ${cancel ? `<button class="btn btn--block" type="button" data-cancel>${esc(cancel)}</button>` : ""}
    </div>`;
    phone.append(backdrop);
    const entry = pushOverlay(backdrop);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop || e.target.closest(".dialog__close, [data-cancel]")) entry.close();
      else if (e.target.closest("[data-confirm]")) { entry.close(); onConfirm?.(); }
    });
    return entry;
  }

  // Reward sheet. The app loads its items from the server; these three are placeholders.
  const GIFTS = [
    { id: "rose", name: "Rose", price: 1 },
    { id: "star", name: "Star", price: 5 },
    { id: "teddy", name: "Teddy", price: 20 },
  ];
  const money = (n) => "$" + n.toFixed(2);

  function openReward(options = {}) {
    const qty = Object.fromEntries(GIFTS.map((g) => [g.id, options.quantities?.[g.id] || 0]));
    const sheet = openSheet("reward-sheet", "Reward creator", "");
    const total = () => GIFTS.reduce((sum, g) => sum + g.price * qty[g.id], 0);

    const views = {
      loading: () => `<div class="sheet-state" role="status" aria-label="Loading">${US.spinnerHTML()}</div>`,
      error: () => `<div class="sheet-state"><p>Could not load reward gifts.</p><button class="btn" type="button" data-retry>Try again</button></div>`,
      empty: () => `<div class="sheet-state"><p>No reward gifts available right now.</p></div>`,
      list: () => `<div class="reward-sheet__scroll">
          <h2 class="reward-sheet__title">Reward creator</h2>
          <p class="reward-sheet__note"><span class="tag tag--placeholder">Placeholder items and prices</span></p>
          <div class="gift-list">${GIFTS.map((g) => `<div class="gift" data-gift="${g.id}">
            <span class="gift__icon gift__icon--${g.id}"><i class="icon" data-lucide="gift"></i></span>
            <span class="gift__info"><span class="gift__name">${g.name}</span><span class="gift__price">${money(g.price)}</span></span>
            <span class="qty">
              <button class="qty__btn" type="button" data-step="-1" aria-label="One less ${g.name}"><i class="icon" data-lucide="minus"></i></button>
              <span class="qty__value" aria-live="polite">0</span>
              <button class="qty__btn" type="button" data-step="1" aria-label="One more ${g.name}"><i class="icon" data-lucide="plus"></i></button>
            </span>
          </div>`).join("")}</div>
        </div>
        <div class="reward-sheet__footer"><button class="btn btn--primary btn--lg btn--block" type="button" data-send>Reward $0.00</button></div>`,
    };

    function update() {
      sheet.panel.querySelectorAll("[data-gift]").forEach((row) => {
        const n = qty[row.dataset.gift];
        row.querySelector(".qty__value").textContent = n;
        row.querySelector('[data-step="-1"]').disabled = n === 0;
      });
      const send = sheet.panel.querySelector("[data-send]");
      send.textContent = "Reward " + money(total());
      send.disabled = total() <= 0;
    }

    function show(view) {
      sheet.panel.innerHTML = `<div class="sheet-panel__handle"></div>${views[view]()}`;
      if (view === "list") update();
      if (sheet.panel.contains(document.activeElement) || document.activeElement === document.body) sheet.panel.focus({ preventScroll: true });
    }

    sheet.panel.addEventListener("click", (e) => {
      const step = e.target.closest("[data-step]");
      if (step) {
        const id = step.closest("[data-gift]").dataset.gift;
        qty[id] = Math.max(0, qty[id] + Number(step.dataset.step));
        update();
      // As in the app, sending the reward just closes the sheet, with no confirmation.
      } else if (e.target.closest("[data-send]")) sheet.close();
      else if (e.target.closest("[data-retry]")) show("list");
    });
    show(options.view || "list");
    return sheet;
  }

  window.WatchArea = { avatar, openSheet, openDialog, openReward, pushOverlay };

  if (!document.body.classList.contains("watch-page")) return;

  // ---------- Video page ----------
  const params = new URLSearchParams(location.search);
  const state = params.get("state") || "";
  const body = document.getElementById("watch-body");

  if (state === "loading") {
    document.getElementById("player").remove();
    body.innerHTML = `<div class="watch-loading" role="status" aria-label="Loading video">${US.spinnerHTML()}</div>`;
    return;
  }

  const item = US.renderWatch({ notFound: state === "not-found" });
  if (!item) return;

  const creator = US.creator(item.channel);
  const own = state === "own";
  const ME = "alex.rivera";
  document.getElementById("owner-link").href = "channel.html?c=" + encodeURIComponent(item.channel);
  document.getElementById("handle").textContent = `${creator.followers} followers`;

  // Follow, Following with the notification bell, or Go to Ultra Studio on your own video.
  const followBtn = document.getElementById("follow");
  let following = ["following", "notifications-off", "notifications"].includes(state);
  let notify = state === "notifications-off" ? "NONE" : "ALL";
  function renderFollow() {
    if (following) {
      followBtn.className = "btn";
      followBtn.innerHTML = `<i class="icon" data-lucide="${notify === "ALL" ? "bell" : "bell-off"}"></i>Following`;
      followBtn.setAttribute("aria-label", `Following. Notifications ${notify === "ALL" ? "on" : "off"}`);
    } else {
      followBtn.className = "btn btn--primary";
      followBtn.textContent = "Follow";
      followBtn.removeAttribute("aria-label");
    }
  }
  function openNotifications() {
    const options = [["ALL", "All", "bell"], ["NONE", "None", "bell-off"], ["UNFOLLOW", "Unfollow", "user-round-minus"]];
    const sheet = WatchArea.openSheet("notify-sheet", "Notifications", `<h2 class="notify-sheet__title">Notifications</h2>
      ${options.map(([value, label, icon]) => `<button class="notify-option" type="button" data-notify="${value}"><i class="icon" data-lucide="${icon}"></i><span class="notify-option__label">${label}</span>${value === notify ? '<i class="icon" data-lucide="check" aria-label="Selected"></i>' : ""}</button>`).join("")}`);
    sheet.panel.addEventListener("click", (e) => {
      const value = e.target.closest("[data-notify]")?.dataset.notify;
      if (!value) return;
      if (value === "UNFOLLOW") following = false;
      else notify = value;
      sheet.close();
      renderFollow();
    });
  }
  if (own) {
    followBtn.outerHTML = `<a class="btn btn--primary" href="ultra-studio.html" id="follow">Go to Ultra Studio</a>`;
    document.getElementById("rate").remove();
    document.getElementById("reward-btn").remove();
  } else {
    renderFollow();
    followBtn.addEventListener("click", () => {
      if (following) return openNotifications();
      following = true;
      notify = "ALL";
      renderFollow();
    });
  }

  // Like and dislike cancel each other out, as in the app.
  const likeBtn = document.getElementById("like");
  const dislikeBtn = document.getElementById("dislike");
  let likes = 12500;
  let liked = false;
  let disliked = false;
  const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(n));
  function renderRating() {
    if (!likeBtn) return;
    likeBtn.classList.toggle("pill-btn--on", liked);
    likeBtn.setAttribute("aria-pressed", liked);
    likeBtn.setAttribute("aria-label", `Like, ${fmt(likes)}`);
    document.getElementById("like-count").textContent = fmt(likes);
    dislikeBtn.classList.toggle("pill-btn--on", disliked);
    dislikeBtn.setAttribute("aria-pressed", disliked);
  }
  if (!own) {
    likeBtn.addEventListener("click", () => {
      liked = !liked;
      likes += liked ? 1 : -1;
      if (liked) disliked = false;
      renderRating();
    });
    dislikeBtn.addEventListener("click", () => {
      disliked = !disliked;
      if (disliked && liked) { liked = false; likes -= 1; }
      renderRating();
    });
    document.getElementById("reward-btn").addEventListener("click", () => WatchArea.openReward());
  }
  // Review note: the app opens the phone's share sheet here.
  document.getElementById("share-btn").addEventListener("click", () => US.toast("This opens the phone's share sheet."));

  // Description: the first 20 words, then See more... opens the full text.
  const DESCRIPTION = `${item.title}. A full walkthrough from start to finish, with the moments that worked and the ones that didn't. Thanks for watching, and leave a comment with what you'd like to see next. New uploads every week, with behind the scenes clips in between.`;
  const words = DESCRIPTION.split(/\s+/);
  const descEl = document.getElementById("description");
  descEl.innerHTML = words.length > 20 ? `${esc(words.slice(0, 20).join(" "))} <button class="description__more" type="button" id="see-more">See more...</button>` : esc(DESCRIPTION);
  document.getElementById("see-more")?.addEventListener("click", openDescription);

  // Related videos. The app shows its heading even when the list is empty, and these cards have no length badge.
  const related = state === "no-related" ? [] : US.CONTENT.filter((c) => c.kind === "video" && c.id !== item.id && !c.live).slice(0, 6);
  document.getElementById("related").innerHTML = related.map((c) => `<a class="card" href="watch.html?id=${c.id}">
      <span class="card__thumb" style="${US.thumbStyle(c)}"></span>
      <span class="card__row">${US.avatarHTML(c.channel)}<span class="card__info"><span class="card__title">${esc(c.title)}</span><span class="card__sub">${esc(c.channel)} • ${c.views} views</span></span></span>
    </a>`).join("");

  // Panels cover the area under the player, which stays visible.
  function openPanel(label, html, onClose) {
    const el = document.createElement("div");
    el.className = "panel";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", label);
    el.innerHTML = html;
    body.append(el);
    const entry = pushOverlay(el, onClose);
    el.querySelector(".panel__handle").addEventListener("click", entry.close);
    return { el, close: entry.close };
  }

  function openDescription() {
    openPanel("Description", `<button class="panel__handle panel__handle--wide" type="button" aria-label="Close description"><span></span></button>
      <h2 class="panel__title">Description</h2>
      <div class="panel__body"><p class="panel__text">${esc(DESCRIPTION)}</p></div>`);
  }

  // Comments
  const commentsBtn = document.getElementById("comments-btn");
  let comments = state === "comments-empty" ? [] : [
    { name: "nightowl.k", time: "6 hours ago", text: "That last round was unreal. How long did this take to film?" },
    { name: "mira_draws", time: "9 hours ago", text: "Watched this twice already." },
    { name: "tomasz.p", time: "1 day ago", text: "Would love a part two of this." },
    { name: "jules.ok", time: "2 days ago", text: "The editing on this one is so clean." },
  ];
  if (["comment-added", "delete-comment"].includes(state)) comments.unshift({ name: ME, time: "just now", text: "Great video, thanks for sharing!", own: true });
  let openMenu = state === "delete-comment" ? 0 : -1;

  function renderCount() {
    document.getElementById("comment-count").textContent = comments.length;
    commentsBtn.setAttribute("aria-label", `Comments, ${comments.length}`);
  }
  function commentHTML(c, i) {
    const actions = c.own ? `<span class="comment__actions">
        ${openMenu === i ? `<button class="comment__delete" type="button" data-delete="${i}"><i class="icon" data-lucide="trash-2"></i>Delete</button>` : ""}
        <button class="icon-btn comment__menu" type="button" data-menu="${i}" aria-label="Comment options" aria-expanded="${openMenu === i}"><i class="icon" data-lucide="ellipsis-vertical"></i></button>
      </span>` : "";
    return `<div class="comment">${avatar(c.name)}<div class="comment__body">
      <div class="comment__head"><span class="comment__who"><span class="comment__name">${esc(c.name)}</span><span class="comment__time">${esc(c.time)}</span></span>${actions}</div>
      <p class="comment__text">${esc(c.text)}</p></div></div>`;
  }
  function openComments() {
    commentsBtn.classList.add("pill-btn--on");
    const panel = openPanel("Comments", `<button class="panel__handle" type="button" aria-label="Close comments"><span></span></button>
      <h2 class="panel__title">Comments</h2>
      <div class="panel__body" id="comment-list"></div>
      <form class="composer" id="composer">
        <input class="input" id="comment-input" type="text" placeholder="Comment..." aria-label="Add a comment" maxlength="500" autocomplete="off">
        <button class="composer__send" type="submit" disabled aria-label="Post comment"><i class="icon" data-lucide="send"></i></button>
      </form>`, () => commentsBtn.classList.remove("pill-btn--on"));
    const list = panel.el.querySelector("#comment-list");
    const input = panel.el.querySelector("#comment-input");
    const send = panel.el.querySelector(".composer__send");
    const render = () => {
      list.innerHTML = comments.length ? comments.map(commentHTML).join("") : `<div class="comments-empty">
        <i class="icon" data-lucide="message-circle-more"></i>
        <h3 class="comments-empty__title">No comments yet</h3>
        <p class="comments-empty__text">Be the first to share your thoughts</p></div>`;
      renderCount();
    };
    render();
    input.addEventListener("input", () => { send.disabled = !input.value.trim(); });
    panel.el.querySelector("#composer").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      comments.unshift({ name: ME, time: "just now", text, own: true });
      openMenu = -1;
      input.value = "";
      send.disabled = true;
      render();
      list.scrollTop = 0;
    });
    list.addEventListener("click", (e) => {
      const menu = e.target.closest("[data-menu]");
      const del = e.target.closest("[data-delete]");
      if (menu) {
        const i = Number(menu.dataset.menu);
        openMenu = openMenu === i ? -1 : i;
        render();
        list.querySelector(`[data-menu="${i}"]`).focus();
      } else if (del) {
        const i = Number(del.dataset.delete);
        openMenu = -1;
        render();
        confirmDelete(i, render);
      }
    });
    return render;
  }
  function confirmDelete(i, render) {
    WatchArea.openDialog({
      title: "Delete comment?",
      text: "Are you sure you want to delete this comment? This cannot be undone.",
      confirm: "Yes",
      cancel: "Cancel",
      onConfirm() { comments.splice(i, 1); render(); },
    });
  }
  commentsBtn.addEventListener("click", openComments);
  renderCount();

  // Open whichever state the address asks for.
  if (["comments", "comments-empty", "comment-added"].includes(state)) openComments();
  if (state === "delete-comment") confirmDelete(0, openComments());
  if (state === "description") openDescription();
  if (state === "notifications") openNotifications();
  if (state === "reward") WatchArea.openReward();
  if (state === "reward-selected") WatchArea.openReward({ quantities: { rose: 2, star: 1 } });
  if (state === "reward-loading") WatchArea.openReward({ view: "loading" });
  if (state === "reward-error") WatchArea.openReward({ view: "error" });
  if (state === "reward-empty") WatchArea.openReward({ view: "empty" });
  if (state === "report-submitted") {
    WatchArea.openDialog({ title: "Report Submitted", text: "Thanks for letting us know. We'll review this report shortly.", confirm: "OK" });
  }
})();
