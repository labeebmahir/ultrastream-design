// Shared by the rebuilt app and prototypes: helpers, placeholder content and the feed layout.
window.US = window.US || {};

US.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Review note, such as "This screen isn't rebuilt yet." Review tooling, not part of the app: it's styled like the
// screen viewer's compact bar so nobody mistakes it for app UI. For the app's own messages use US.appToast or US.alert.
US.toast = (message) => {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), 3200);
};

// The app's AppToast: a banner 50px from the top of the phone with an icon, the message and Dismiss.
// type is "error" (red, the default) or "success" (brand red). It goes after 3 seconds; pass duration 0 to keep it.
US.appToast = (message, type = "error", duration = 3000) => {
  const host = document.querySelector(".phone") || document.body;
  host.querySelector(":scope > .app-toast")?.remove();
  const el = document.createElement("div");
  el.className = `app-toast${type === "success" ? " app-toast--success" : ""}`;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.innerHTML = `<i class="icon" data-lucide="${type === "success" ? "circle-check" : "circle-alert"}"></i>
    <span class="app-toast__text">${US.esc(message)}</span>
    <button class="app-toast__action" type="button">Dismiss</button>`;
  el.querySelector("button").addEventListener("click", () => el.remove());
  host.append(el);
  if (duration) setTimeout(() => el.remove(), duration);
  return el;
};

// The phone's own alert, as the app's Alert.alert(title, message, buttons). Centred over the screen and kept plain,
// because the real one is drawn by iOS or Android. buttons: [{ text, onPress, style: "cancel" | "destructive" }].
// Pressing any button closes it, then runs that button's onPress.
US.alert = (title, message = "", buttons = [{ text: "OK" }]) => {
  const host = document.querySelector(".phone") || document.body;
  const opener = document.activeElement;
  const backdrop = document.createElement("div");
  backdrop.className = "sys-alert-backdrop";
  backdrop.innerHTML = `<div class="sys-alert" role="alertdialog" aria-modal="true" aria-labelledby="sys-alert-title"${message ? ' aria-describedby="sys-alert-text"' : ""} tabindex="-1">
      <h2 class="sys-alert__title" id="sys-alert-title">${US.esc(title)}</h2>
      ${message ? `<p class="sys-alert__text" id="sys-alert-text">${US.esc(message)}</p>` : ""}
      <div class="sys-alert__buttons${buttons.length > 2 ? " sys-alert__buttons--stack" : ""}">${buttons.map((b, i) => `<button class="sys-alert__btn${b.style === "destructive" ? " sys-alert__btn--destructive" : ""}${b.style === "cancel" ? " sys-alert__btn--cancel" : ""}" type="button" data-i="${i}">${US.esc(b.text)}</button>`).join("")}</div>
    </div>`;
  const close = (b) => {
    backdrop.remove();
    document.removeEventListener("keydown", onKey, true);
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    b?.onPress?.();
  };
  // Escape picks the cancel button if there is one, as Android's back button does. Otherwise it does nothing.
  const onKey = (e) => {
    if (e.key !== "Escape") return;
    e.stopImmediatePropagation();
    e.preventDefault();
    const cancel = buttons.find((b) => b.style === "cancel");
    if (cancel) close(cancel);
  };
  backdrop.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-i]");
    if (btn) close(buttons[Number(btn.dataset.i)]);
  });
  document.addEventListener("keydown", onKey, true);
  host.append(backdrop);
  // Focus the alert itself, so keyboard users start inside it; Tab reaches the buttons.
  requestAnimationFrame(() => backdrop.querySelector(".sys-alert").focus({ preventScroll: true }));
  return backdrop;
};

// The app's loading spinner, like React Native's ActivityIndicator: a plain ring in the brand red with no text.
// "spinner--lg" is ActivityIndicator size="large"; "" is the default small size. Add "spinner--white" or "spinner--orange" where the app does.
US.spinnerHTML = (classes = "spinner--lg") => `<span class="spinner ${classes}" aria-hidden="true"></span>`;

// The app loads categories from its API; this is its fallback list.
US.CATEGORIES = ["Gaming", "Music", "Sports", "Tech", "Entertainment", "Art", "Education", "Food", "Travel", "Fitness", "Science", "News"];

const AGES = { "5h": "5 hours ago", "6h": "6 hours ago", "9h": "9 hours ago", "1d": "1 day ago", "2d": "2 days ago", "3d": "3 days ago", "4d": "4 days ago", "5d": "5 days ago", "6d": "6 days ago", "1w": "1 week ago", "2w": "2 weeks ago" };

US.CONTENT = [
  ["video", "Gaming", "Ranked grind to the final circle", "PixelForge", "48K", "2d", "24:16"],
  ["short", "Food", "One-pan garlic noodles", "StreetPlate", "210K", "5h", "0:42"],
  ["video", "Music", "Writing a song in one hour", "LoopHouse", "19K", "1d", "58:03"],
  ["video", "Tech", "I rebuilt my desk setup from scratch", "ByteBench", "86K", "3d", "16:32"],
  ["short", "Sports", "Best save of the weekend", "SideLine", "340K", "9h", "0:28"],
  ["video", "Travel", "48 hours in Colombo", "FarRoutes", "27K", "6d", "21:05"],
  ["video", "Art", "Painting a mural in the rain", "OpenCanvas", "11K", "4d", "9:14"],
  ["short", "Entertainment", "When the stream lags at the worst moment", "LaughTrack", "520K", "1d", "0:19"],
  ["video", "Education", "How interest rates actually work", "PlainTerms", "63K", "1w", "14:27"],
  ["video", "Gaming", "Speedrun attempts until I win", "PixelForge", "35K", "5d", "41:02"],
  ["short", "Music", "Bass line you can't get out of your head", "LoopHouse", "98K", "2d", "0:33"],
  ["video", "Food", "Trying every night market stall", "StreetPlate", "74K", "1w", "18:50"],
  ["video", "Sports", "Training like a pro for seven days", "SideLine", "52K", "3d", "13:36"],
  ["short", "Tech", "This keyboard sounds illegal", "ByteBench", "160K", "6h", "0:24"],
  ["video", "Entertainment", "We tried improv with strangers", "LaughTrack", "44K", "4d", "22:18"],
  ["video", "Travel", "The train ride nobody talks about", "FarRoutes", "31K", "2w", "11:09"],
  ["short", "Art", "Timelapse: charcoal portrait", "OpenCanvas", "75K", "3d", "0:51"],
  ["video", "Education", "Learn the basics of colour grading", "PlainTerms", "22K", "1w", "27:44"],
].map(([kind, category, title, channel, views, age, length], i) => ({ id: "v" + i, kind, category, title, channel, views, age: AGES[age], length, live: i === 0, hue: (i * 47) % 360 }));

// Fictional creators. Every content item's channel is one of these.
US.CREATORS = [
  ["PixelForge", "Gaming", "128K", 12], ["StreetPlate", "Food", "94K", 48], ["LoopHouse", "Music", "61K", 96],
  ["ByteBench", "Tech", "210K", 140], ["SideLine", "Sports", "77K", 188], ["FarRoutes", "Travel", "45K", 236],
  ["OpenCanvas", "Art", "18K", 284], ["LaughTrack", "Entertainment", "302K", 332], ["PlainTerms", "Education", "53K", 20],
].map(([name, category, followers, hue]) => ({ name, handle: "@" + name.toLowerCase(), category, followers, hue }));
US.creator = (name) => US.CREATORS.find((c) => c.name === name) || US.CREATORS[0];
// The app's AppAvatar with no picture: the brand gradient with a white person icon. The sample people have no
// pictures, so every avatar looks like this. name is kept so callers read clearly; the avatar itself is decorative.
US.avatarHTML = (name, size = "") => `<span class="avatar ${size}" aria-hidden="true"><i class="icon" data-lucide="user"></i></span>`;

const PILLS = `<span class="live-badge"><i class="icon" data-lucide="radio"></i>Live</span><span class="views-badge"><i class="icon" data-lucide="eye"></i>12.5K</span>`;

US.thumbStyle = (item) => `background:linear-gradient(135deg,hsl(${item.hue} 55% 32%),hsl(${(item.hue + 50) % 360} 65% 18%))`;

// As the app's AppVideoCard, which the feeds use for videos, shorts and live streams alike: thumbnail, then the
// avatar with the title and "creator • views • age" beside it. Its layout prop ("default" or "compact") draws the same card.
US.cardHTML = (item, options) => {
  const href = options?.href || (item.live ? "watch.html?live=1" : `watch.html?id=${item.id}`);
  const badges = item.live ? PILLS : `<span class="duration">${item.length}</span>`;
  const sub = `${US.esc(item.channel)} • ${item.views} views • ${item.age}`;
  return `<a class="card" href="${href}">
    <span class="card__thumb" style="${US.thumbStyle(item)}">${badges}</span>
    <span class="card__row">
      ${US.avatarHTML(item.channel)}
      <span class="card__info">
        <span class="card__title">${US.esc(item.title)}</span>
        <span class="card__sub">${sub}</span>
      </span>
    </span>
  </a>`;
};

US.peopleStripHTML = () => `<section class="people-strip" aria-label="Suggested creators">
    <h2 class="people-strip__title">Suggested Creators</h2>
    <div class="people-strip__row">${US.CREATORS.slice(0, 5).map((c) => `<div class="person-card">
      ${US.avatarHTML(c.name, "avatar--40")}
      <span class="person-card__body"><a class="person-card__name" href="channel.html?c=${encodeURIComponent(c.name)}">${US.esc(c.name)}</a><span class="person-card__meta">${c.followers} followers</span></span>
      <button class="btn btn--primary" type="button" data-follow>Follow</button>
    </div>`).join("")}</div>
  </section>`;

// As in the design: two full-width videos, then two shorts side by side. count is how many items so far.
US.createFeedStream = (category, options = {}) => {
  const inCategory = (c) => !category || c.category === category;
  const videos = US.CONTENT.filter((c) => c.kind === "video" && inCategory(c));
  const shorts = US.CONTENT.filter((c) => c.kind === "short" && inCategory(c));
  let step = 0;
  let v = 0;
  let s = 0;
  let rows = 0;
  const stream = {
    count: 0,
    next() {
      // The app shows a Suggested Creators strip after the second row.
      if (options.suggestions && rows === 2 && !category) {
        rows += 1;
        return US.peopleStripHTML();
      }
      rows += 1;
      const wantShorts = videos.length === 0 || (shorts.length > 0 && step % 3 === 2);
      step += 1;
      if (wantShorts) {
        const a = shorts[s++ % shorts.length];
        const b = shorts[s++ % shorts.length];
        stream.count += 2;
        return `<div class="short-row">${US.cardHTML(a)}${US.cardHTML(b)}</div>`;
      }
      stream.count += 1;
      return US.cardHTML(videos[v++ % videos.length]);
    },
  };
  return stream;
};

// Category chips: "All" first, then the categories. Tapping the selected one again returns to All.
US.setupChips = (container, onChange) => {
  let category = null;
  container.innerHTML = ["All", ...US.CATEGORIES]
    .map((c) => `<button class="chip" type="button" data-cat="${c}" aria-pressed="${c === "All"}">${c}</button>`)
    .join("");
  container.addEventListener("click", (e) => {
    const cat = e.target.closest("[data-cat]")?.dataset.cat;
    if (!cat) return;
    category = cat === "All" || category === cat ? null : cat;
    container.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c.dataset.cat === (category || "All")));
    onChange(category);
  });
};

// Shared app chrome. Put <header class="topbar" data-topbar></header> or <nav class="tabbar" data-tabbar="discover"></nav> on a page.
US.TABS = [
  ["discover", "Discover", "compass", "discover.html"],
  ["my-feed", "My Feed", "user-round-search", "my-feed.html"],
  ["create", "Create", "plus", "create.html"],
  ["shorts", "Shorts", "video", "shorts.html"],
  ["profile", "Profile", "circle-user-round", "profile.html"],
];
US.renderChrome = () => {
  document.querySelectorAll("[data-tabbar]").forEach((nav) => {
    nav.setAttribute("aria-label", "Main");
    nav.innerHTML = US.TABS.map(([key, label, icon, href]) => {
      const iconHTML = key === "create" ? `<span class="tabbar__create"><i class="icon" data-lucide="${icon}"></i></span>` : `<i class="icon" data-lucide="${icon}"></i>`;
      return `<a href="${href}"${nav.dataset.tabbar === key ? ' aria-current="page"' : ""}>${iconHTML}${label}</a>`;
    }).join("");
  });
  document.querySelectorAll("[data-topbar]").forEach((bar) => {
    bar.innerHTML = `<img class="topbar__logo" src="${bar.dataset.topbar || ""}../assets/img/logo-icon.png" alt="UltraStream">
      <div class="topbar__actions">
        <a class="icon-btn" href="notifications.html" aria-label="Notifications"><i class="icon" data-lucide="bell-dot"></i></a>
        <a class="icon-btn" href="search.html" aria-label="Search"><i class="icon" data-lucide="search"></i></a>
      </div>`;
  });
};

US.setupNotBuilt = () => {
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-todo]")) US.toast("This screen isn't rebuilt yet.");
  });
};

// Fills in the video page. Pass { notFound: true } to show the not-found state. Returns the item shown, or null.
US.renderWatch = (options = {}) => {
  const params = new URLSearchParams(location.search);
  US.setupNotBuilt();
  const id = params.get("id");
  const item = options.notFound ? null : id ? US.CONTENT.find((c) => c.id === id) : US.CONTENT[0];
  if (!item) {
    document.getElementById("player").remove();
    document.querySelector(".watch").outerHTML = `<div class="empty-state empty-state--gone">
      <span class="empty-state__message">
        <i class="icon empty-state__icon" data-lucide="party-popper"></i>
        <h1 class="empty-state__title">Content Not Found</h1>
        <p class="empty-state__text">The content you're looking for is no longer available.</p>
      </span>
      <a class="btn btn--primary btn--lg btn--block" href="discover.html">Go to discovery</a>
    </div>`;
    return null;
  }
  const live = params.has("live") || item.live;
  const player = document.getElementById("player");
  player.style.background = US.thumbStyle(item).replace("background:", "");
  if (live) player.innerHTML = PILLS;
  document.getElementById("title").textContent = item.title;
  document.getElementById("sub").textContent = live ? "Live now" : `${item.views} views • ${item.age}`;
  const creator = US.creator(item.channel);
  document.getElementById("channel").textContent = item.channel;
  document.getElementById("handle").textContent = `${creator.handle} • ${creator.followers} followers`;
  document.getElementById("avatar").outerHTML = US.avatarHTML(item.channel, "avatar--40");
  return item;
};

// Lucide icons: write <i class="icon" data-lucide="bell"></i> anywhere, including in content rendered later.
US.renderIcons = () => {
  if (window.lucide && document.querySelector("i[data-lucide]")) window.lucide.createIcons();
};
// Every rebuilt screen in app/, by area: [file, name, start]. start is the address the screen opens with from the
// list, such as which video, and can be left out. This is the one list of screens: the app index, the screen viewer
// and the home page search all read it. When you add a screen, add it here and its states to US.APP_STATES.
US.APP_SCREENS = [
  ["Main tabs", [["discover.html", "Discover"], ["my-feed.html", "My Feed"], ["create.html", "Create"], ["shorts.html", "Shorts"], ["profile.html", "Profile"]]],
  ["Onboarding", [["welcome.html", "Welcome"], ["sign-in.html", "Log in"], ["sign-up.html", "Sign up"], ["forgot-password.html", "Forgot password"], ["choose-handle.html", "Choose handle"], ["age-check.html", "Age check"], ["experience.html", "Experience type"], ["interests.html", "Interests"], ["creator-benefits.html", "Creator benefits"]]],
  ["Watching", [["watch.html", "Video", "id=v2"], ["live.html", "Live stream"], ["channel.html", "Channel", "c=PixelForge"], ["channel-shorts.html", "Channel shorts", "c=StreetPlate"], ["followers.html", "Followers"], ["subscribers.html", "Subscribers"]]],
  ["Search and notifications", [["search.html", "Search"], ["search-results.html", "Search results", "q=gaming"], ["notifications.html", "Notifications"]]],
  ["Profile and settings", [["settings.html", "Settings"], ["edit-profile.html", "Edit profile"], ["change-password.html", "Change password"], ["appearance.html", "Appearance"], ["watch-history.html", "Watch history"], ["reward-activities.html", "Reward activities"], ["wallet.html", "Wallet"]]],
  ["Creator studio", [["ultra-studio.html", "Ultra Studio"], ["manage-contents.html", "Manage contents"], ["upload.html", "Upload"], ["go-live.html", "Go live"], ["analytics.html", "Analytics"], ["create-channel.html", "Create channel"], ["channel-settings.html", "Channel settings"]]],
];

// The states reviewers can open on each screen, starting with the one it opens in. Each is [query, label]:
// a bare word means ?state=<word>, and anything with "=" is used as it is, such as "as=creator&state=new".
// List only what the screen's script really handles, and keep labels short and plain.
US.APP_STATES = {
  "discover.html": [["", "Feed"], ["loading", "Loading"], ["empty", "Empty"], ["error", "Error"], ["offline", "Offline"]],
  "my-feed.html": [["", "Feed"], ["loading", "Loading"], ["welcome", "Not following anyone"], ["error", "Error"], ["offline", "Offline"], ["guest", "Signed out"]],
  "create.html": [["", "Viewer"], ["as=guest", "Signed out"], ["as=creator", "Creator"], ["as=creator&state=new", "New creator"], ["as=creator&state=loading", "Creator, loading"]],
  "shorts.html": [["", "Feed"], ["controls-hidden", "Controls hidden"], ["loading", "Loading"], ["empty", "Empty"], ["error", "Error"], ["offline", "Offline"], ["caught-up", "All caught up"], ["video-error", "Video error"], ["guest", "Signed out"]],
  "profile.html": [["", "Viewer"], ["as=creator", "Creator"], ["as=creator&state=no-channel", "Creator, no channel"], ["loading", "Loading"], ["empty", "No watch history"]],
  "welcome.html": [["", "Welcome"]],
  "sign-in.html": [["", "Empty form"], ["errors", "Missing details"], ["email-invalid", "Invalid email"], ["loading", "Logging in"], ["wrong-password", "Wrong password"], ["google-account", "Google account"], ["apple-account", "Apple account"], ["google-failed", "Google sign-in failed"], ["apple-cancelled", "Apple sign-in cancelled"], ["reset-success", "Password was reset"], ["platform=android", "On Android"]],
  "sign-up.html": [["", "Email"], ["email-required", "Email missing"], ["email-invalid", "Invalid email"], ["terms", "Terms not accepted"], ["email-exists", "Email already used"], ["age-verified", "Age verified"], ["under-18", "Under 18"], ["google-failed", "Google sign-in failed"], ["code", "Code"], ["code-error", "Wrong code"], ["resend", "Resend code"], ["password", "Password"], ["password-short", "Password too short"], ["password-mismatch", "Passwords differ"], ["handle", "Handle"], ["handle-checking", "Checking handle"], ["handle-available", "Handle available"], ["handle-taken", "Handle taken"], ["handle-short", "Handle too short"], ["confirming", "Confirming"], ["failed", "Sign-up failed"]],
  "forgot-password.html": [["", "Email"], ["email-required", "Email missing"], ["email-invalid", "Invalid email"], ["sending", "Sending code"], ["send-failed", "Sending failed"], ["code", "Code"], ["code-error", "Wrong code"], ["verifying", "Verifying"], ["resend", "Resend code"], ["reset", "New password"], ["reset-required", "Password missing"], ["reset-short", "Password too short"], ["reset-mismatch", "Passwords differ"], ["resetting", "Resetting"]],
  "choose-handle.html": [["", "After Google"], ["provider=apple", "After Apple"], ["required", "Handle missing"], ["short", "Handle too short"], ["invalid", "Invalid handle"], ["taken", "Handle taken"], ["loading", "Saving"], ["failed", "Saving failed"]],
  "age-check.html": [["", "Selfie"], ["checking", "Checking"]],
  "experience.html": [["", "During sign-up"], ["from=settings", "From Settings"], ["saving", "Saving"], ["error", "Saving failed"]],
  "interests.html": [["", "Interests"], ["loading", "Loading"], ["error", "Loading failed"], ["selected", "Some chosen"], ["saving", "Saving"], ["save-error", "Saving failed"]],
  "creator-benefits.html": [["", "Benefits"]],
  "watch.html": [["", "Video"], ["loading", "Loading"], ["not-found", "Not found"], ["own", "Own video"], ["following", "Following"], ["notifications-off", "Following, bell off"], ["notifications", "Notification options"], ["no-related", "No related videos"], ["description", "Description"], ["comments", "Comments"], ["comments-empty", "No comments"], ["comment-added", "Own comment"], ["delete-comment", "Delete comment"], ["reward", "Reward"], ["reward-selected", "Reward chosen"], ["reward-loading", "Reward loading"], ["reward-error", "Reward error"], ["reward-empty", "No rewards"], ["report-submitted", "Report sent"]],
  "live.html": [["", "Live"], ["chat-empty", "No chat yet"], ["chat-disabled", "Chat turned off"], ["camera-off", "Camera off"], ["ended", "Ended"], ["offline", "Offline"]],
  "channel.html": [["", "Channel"], ["loading", "Loading"], ["error", "Error"], ["empty", "No content"], ["bio", "Full bio"], ["following", "Following"], ["shorts", "Shorts tab"], ["live", "Live tab"], ["own", "Own channel"], ["viewer", "Viewer, no channel"], ["reward", "Reward"]],
  "channel-shorts.html": [["", "Shorts"], ["controls-hidden", "Controls hidden"], ["video-error", "Video error"], ["loading", "Loading"], ["error", "Error"], ["offline", "Offline"]],
  "followers.html": [["", "Followers"], ["following", "Following tab"], ["empty", "Empty"], ["no-results", "No results"]],
  "subscribers.html": [["", "All"], ["paid", "Paid"], ["free", "Free"], ["empty", "Empty"]],
  "search.html": [["", "Recent searches"], ["empty", "No recent searches"], ["no-results", "No results"], ["guest", "Signed out"]],
  "search-results.html": [["", "Results"], ["loading", "Searching"], ["no-results", "No results"]],
  "notifications.html": [["", "Unread"], ["read", "Some read"], ["loading", "Loading"], ["empty", "Empty"], ["error", "Error"], ["offline", "Offline"], ["off", "Turned off"], ["guest", "Signed out"]],
  "settings.html": [["", "Settings"], ["logout", "Log out"]],
  "edit-profile.html": [["", "Profile"], ["username-checking", "Checking username"], ["username-available", "Username available"], ["username-taken", "Username taken"], ["username-confirm", "Confirm username"], ["email-changed", "Email changed"], ["email-confirm", "Confirm email"], ["email-code", "Email code"], ["photo", "Change photo"], ["no-photo", "No photo"], ["delete", "Delete account"], ["deleted", "Account deleted"]],
  "change-password.html": [["", "Empty form"], ["errors", "Missing details"], ["too-short", "Too short"], ["mismatch", "Passwords differ"], ["same", "Same as current"], ["success", "Changed"]],
  "appearance.html": [["", "Appearance"]],
  "watch-history.html": [["", "History"], ["empty", "Empty"], ["paused", "Paused"], ["loading", "Loading"], ["error", "Error"], ["pause-confirm", "Pause history"], ["delete-confirm", "Clear history"]],
  "reward-activities.html": [["", "Earned"], ["contributions", "Contributions"], ["earned-empty", "Earned, empty"], ["contributions-empty", "Contributions, empty"], ["details", "Reward details"], ["as=viewer", "Viewer"], ["as=viewer&state=empty", "Viewer, empty"], ["as=viewer&state=details", "Viewer, details"]],
  "wallet.html": [["", "Wallet"], ["add", "Add coins"], ["withdraw", "Withdraw"], ["withdraw-error", "Withdraw error"]],
  "ultra-studio.html": [["", "Studio"], ["new", "New creator"], ["loading", "Loading"]],
  "manage-contents.html": [["", "Videos"], ["shorts", "Shorts"], ["lives", "Live streams"], ["scheduled", "Scheduled"], ["empty", "Nothing yet"], ["scheduled-empty", "Nothing scheduled"], ["loading", "Loading"], ["error", "Error"], ["menu", "Item menu"], ["delete", "Delete one"], ["delete-error", "Delete failed"], ["delete-all", "Delete all"], ["login", "Signed out"]],
  "upload.html": [["", "Empty"], ["filled", "Filled in"], ["short", "Short"], ["scheduled", "Scheduled"], ["picker", "File picker"], ["type", "Type menu"], ["category", "Category menu"], ["missing-file", "No file"], ["missing-title", "No title"], ["discard", "Discard changes"], ["uploading", "Uploading"], ["cancel-upload", "Cancel upload"], ["processing", "Processing"], ["done", "Done"], ["paused", "Paused"], ["interrupted", "Interrupted"], ["failed", "Failed"], ["edit", "Edit"], ["edit-changed", "Edit, changed"], ["edit-scheduled", "Edit, scheduled"], ["edit-discard", "Edit, discard"], ["edit-delete", "Edit, delete"], ["edit-saved", "Edit, saved"]],
  "go-live.html": [["", "Empty"], ["filled", "Filled in"], ["tips-off", "Tips off"], ["category", "Category menu"]],
  "analytics.html": [["", "Last 7 days"], ["period-menu", "Period menu"], ["30d", "Last 30 days"], ["90d", "Last 90 days"]],
  "create-channel.html": [["", "Empty"], ["errors", "Missing details"], ["filled", "Filled in"], ["photo", "Photo only"], ["picker", "Photo picker"], ["category", "Category menu"], ["creating", "Creating"], ["success", "Created"], ["edit", "Edit channel"], ["edit-picker", "Edit, photo picker"], ["updating", "Edit, saving"], ["edit-success", "Edit, saved"], ["edit-delete", "Edit, delete"]],
  "channel-settings.html": [["", "Settings"], ["delete", "Delete channel"], ["deleted", "Deleted"]],
};

// The parameters a state can set. Links to another state replace these and keep the rest, such as which video.
const stateParams = (value) => new URLSearchParams(value.includes("=") ? value : value ? "state=" + value : "");
US.STATE_KEYS = [...new Set(["state", ...Object.values(US.APP_STATES).flat().flatMap(([v]) => [...stateParams(v).keys()])])];

// Every screen as { area, file, label, start, states }, in list order.
US.appScreens = () => US.APP_SCREENS.flatMap(([area, screens]) => screens.map(([file, label, start = ""]) => ({ area, file, label, start, states: US.APP_STATES[file] || [["", "Default"]] })));

// Address of a screen in one of its states. from is the address to keep other settings from, the screen's start by default.
US.appStateHref = (screen, value, from = screen.start) => {
  const q = new URLSearchParams(from);
  US.STATE_KEYS.forEach((k) => q.delete(k));
  stateParams(value).forEach((v, k) => q.set(k, v));
  const s = q.toString();
  return screen.file + (s ? "?" + s : "");
};

// Which of a screen's states an address shows, as an index into screen.states, or -1 if none of them.
US.appStateIndex = (screen, search) => {
  const q = new URLSearchParams(search);
  return screen.states.findIndex(([v]) => {
    const p = stateParams(v);
    return US.STATE_KEYS.every((k) => (q.get(k) || "") === (p.get(k) || ""));
  });
};

// Screen viewer around rebuilt app screens: the screen list, its states and previous and next (assets/js/viewer.js).
// Review tooling, not part of the app. Only on top-level pages in app/, never inside a frame or a prototype.
US.viewerFile = (() => {
  const path = location.pathname.split(String.fromCharCode(92)).join("/");
  const parts = path.split("/");
  const file = parts.pop();
  const inApp = parts.pop() === "app" && file.endsWith(".html") && file !== "index.html" && !path.includes("/prototypes/");
  return inApp && window.self === window.top && document.querySelector(".stage") ? file : "";
})();
if (US.viewerFile) {
  document.documentElement.classList.add("has-viewer");
  const here = document.currentScript?.src || location.href;
  // Ordered, so the log and header are ready before the viewer draws.
  for (const src of ["activity-log.js", "site-header.js", "viewer.js"]) {
    const s = document.createElement("script");
    s.src = new URL(src, here).href;
    s.async = false;
    document.head.append(s);
  }
}
US.renderChrome();
US.renderIcons();
new MutationObserver(US.renderIcons).observe(document.body, { childList: true, subtree: true });
