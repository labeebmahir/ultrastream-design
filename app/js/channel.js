// Creator channel, followers and following lists, and all subscribers.
(function () {
  const esc = US.esc;
  const params = new URLSearchParams(location.search);
  const state = params.get("state") || "";
  const page = document.body.className;

  // Back goes to the previous screen when there is one, as in the app.
  document.addEventListener("click", (e) => {
    const back = e.target.closest("[data-back]");
    if (back && document.referrer.startsWith(location.origin) && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  });

  // The app's no-picture avatar, as nobody in the sample data has a picture.
  const avatar = (name, extra = "") => US.avatarHTML(name, extra);

  // ---------- Channel ----------
  if (page === "channel-page") {
    const main = document.querySelector(".phone");
    const name = params.get("c");
    const creator = name ? US.CREATORS.find((c) => c.name === name) : US.CREATORS[0];

    if (state === "loading") {
      document.getElementById("channel").outerHTML = `<div class="channel-state" role="status">${US.spinnerHTML()}<span>Loading profile...</span></div>`;
      document.querySelector(".channel-bar__actions").remove();
      return;
    }
    if (state === "error" || (!creator && state !== "viewer")) {
      document.getElementById("channel").outerHTML = `<div class="channel-state">
        <i class="icon" data-lucide="user-round-x"></i><span>Could not load this profile.</span>
        <a class="btn" href="discover.html" data-back>Go Back</a></div>`;
      document.querySelector(".channel-bar__actions").remove();
      return;
    }

    // A viewer without a channel uses the same screen, with no bio and no content.
    const viewer = state === "viewer";
    const own = state === "own";
    const empty = viewer || state === "empty";
    const profile = viewer ? { name: "mira_draws", followers: "12" } : creator;
    main.setAttribute("aria-label", profile.name);

    document.getElementById("avatar").outerHTML = avatar(profile.name, "avatar--56");
    document.getElementById("name").textContent = profile.name;
    document.getElementById("followers").textContent = `${profile.followers} followers`;

    const BIO = viewer ? "" : `Welcome to ${profile.name}. New ${profile.category.toLowerCase()} videos every week, shorts most days and a live stream every Friday night. Follow to see new uploads in My Feed, and say hello in the comments.`;
    const bioEl = document.getElementById("bio");
    function renderBio(expanded) {
      const words = BIO.split(/\s+/);
      bioEl.hidden = !BIO;
      bioEl.innerHTML = words.length > 20 && !expanded ? `${esc(words.slice(0, 20).join(" "))} <button class="bio__more" type="button">See more</button>` : esc(BIO);
    }
    renderBio(state === "bio");
    bioEl.addEventListener("click", (e) => { if (e.target.closest(".bio__more")) renderBio(true); });

    // Follow, Following, or Go to Ultra Studio on your own channel.
    const followBtn = document.getElementById("follow");
    let following = state === "following";
    const renderFollow = () => {
      followBtn.className = following ? "btn" : "btn btn--primary";
      followBtn.textContent = following ? "Following" : "Follow";
    };
    if (own) {
      followBtn.outerHTML = `<a class="btn btn--primary" href="ultra-studio.html" id="follow">Go to Ultra Studio</a>`;
      document.getElementById("reward").remove();
    } else {
      renderFollow();
      followBtn.addEventListener("click", () => { following = !following; renderFollow(); });
      document.getElementById("reward").addEventListener("click", () => WatchArea.openReward());
    }
    // Review note: the app opens the phone's share sheet here.
    document.getElementById("share").addEventListener("click", () => US.toast("This opens the phone's share sheet."));

    // Videos are full width, shorts sit two across with square thumbnails, live shows its badges.
    const short = (age) => age.replace(/^(\d+) (\w)\w* ago$/, "$1$2 ago");
    // Sample items so each channel has enough to fill its tabs, on top of its items in the shared content.
    const extras = empty ? [] : [
      ["video", "Answering your questions", "12K", "1 week ago", "18:21"],
      ["short", "Behind the scenes", "40K", "2 days ago", "0:31"],
      ["short", "Quick tip of the day", "22K", "4 days ago", "0:17"],
      ["short", "This took 40 takes", "65K", "1 week ago", "0:45"],
    ].map(([kind, title, views, age, length], i) => ({ id: (US.CONTENT.find((c) => c.channel === profile.name && c.kind === kind && !c.live) || US.CONTENT[2]).id, kind, title, channel: profile.name, views, age, length, live: false, hue: (creator.hue + 60 * (i + 1)) % 360 }));
    const items = empty ? [] : [...US.CONTENT.filter((c) => c.channel === profile.name), ...extras];
    const lists = {
      videos: items.filter((c) => c.kind === "video" && !c.live),
      shorts: items.filter((c) => c.kind === "short"),
      live: items.filter((c) => c.live),
    };
    function cardHTML(c) {
      const href = c.live ? "live.html" : c.kind === "short" ? `channel-shorts.html?c=${encodeURIComponent(profile.name)}&id=${c.id}` : `watch.html?id=${c.id}`;
      const badges = c.live
        ? `<span class="live-badge"><i class="icon" data-lucide="radio"></i>Live</span><span class="views-badge"><i class="icon" data-lucide="eye"></i>${c.views}</span>`
        : `<span class="duration">${c.length}</span>`;
      return `<a class="card" href="${href}">
        <span class="card__thumb" style="${US.thumbStyle(c)}">${badges}</span>
        <span class="card__row">${avatar(profile.name)}<span class="card__info"><span class="card__title">${esc(c.title)}</span><span class="card__sub">${c.views} views • ${short(c.age)}</span></span></span>
      </a>`;
    }
    const listEl = document.getElementById("list");
    function renderTab(tab) {
      document.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === tab));
      const list = lists[tab];
      if (!list.length) {
        listEl.innerHTML = `<div class="empty-state"><i class="icon empty-state__icon" data-lucide="clapperboard"></i><h2 class="empty-state__title">No contents yet</h2><p class="empty-state__text">Check back again</p></div>`;
      } else if (tab === "shorts") {
        let html = "";
        for (let i = 0; i < list.length; i += 2) {
          const pair = list.slice(i, i + 2);
          html += pair.length === 2 ? `<div class="short-row">${pair.map(cardHTML).join("")}</div>` : cardHTML(pair[0]);
        }
        listEl.innerHTML = html;
      } else {
        listEl.innerHTML = list.map(cardHTML).join("");
      }
    }
    document.querySelector(".tab-pills").addEventListener("click", (e) => {
      const tab = e.target.closest("[data-tab]")?.dataset.tab;
      if (tab) renderTab(tab);
    });
    renderTab(["shorts", "live"].includes(state) ? state : "videos");
    if (state === "reward") WatchArea.openReward();
    return;
  }

  // ---------- Followers and following ----------
  if (page === "followers-page") {
    const people = {
      followers: [
        ["Gamezone", "@gamezone", false], ["TechGirl", "@techgirl", true], ["TechwithSam", "@techwithsam", false],
        ["Alex plays", "@alexplays", false], ["FantasyFan", "@fantasyfan", true], ["nightowl.k", "@nightowl.k", false],
      ],
      following: [["PixelForge", "@pixelforge", true], ["LoopHouse", "@loophouse", true], ["StreetPlate", "@streetplate", true], ["PlainTerms", "@plainterms", true]],
    };
    if (state === "empty") people.followers = people.following = [];
    const list = document.getElementById("people");
    const search = document.getElementById("search");
    let tab = state === "following" ? "following" : "followers";
    if (state === "no-results") search.value = "zzz";

    function render() {
      document.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === tab));
      const q = search.value.trim().toLowerCase();
      const rows = people[tab].map((p, i) => [p, i]).filter(([[n, h]]) => !q || n.toLowerCase().includes(q) || h.includes(q));
      if (!rows.length) {
        const none = !people[tab].length;
        list.innerHTML = `<div class="empty-state"><i class="icon empty-state__icon" data-lucide="${none ? "users-round" : "user-round-search"}"></i>
          <h2 class="empty-state__title">${none ? (tab === "followers" ? "No followers yet" : "Not following anyone yet") : "No results"}</h2>
          <p class="empty-state__text">${none ? (tab === "followers" ? "People who follow you will appear here." : "Creators you follow will appear here.") : "Try a different name or handle."}</p></div>`;
        return;
      }
      list.innerHTML = rows.map(([[n, h, on], i]) => `<div class="person-row"><div class="person-row__card">
        <a class="person-row__link" href="channel.html?c=${encodeURIComponent(n)}">${avatar(n)}<span class="person-row__text"><span class="person-row__name">${esc(n)}</span><span class="person-row__sub">${esc(h)}</span></span></a>
        <button class="btn${on ? "" : " btn--primary"}" type="button" data-i="${i}" aria-pressed="${on}">${on ? "Following" : "Follow"}</button>
      </div></div>`).join("");
    }
    document.querySelector(".line-tabs").addEventListener("click", (e) => {
      const t = e.target.closest("[data-tab]")?.dataset.tab;
      if (t) { tab = t; render(); }
    });
    search.addEventListener("input", render);
    list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-i]");
      if (!btn) return;
      const p = people[tab][btn.dataset.i];
      p[2] = !p[2];
      render();
      list.querySelector(`[data-i="${btn.dataset.i}"]`)?.focus();
    });
    render();
    return;
  }

  // ---------- All subscribers ----------
  if (page === "subscribers-page") {
    const DAY = 86400000;
    const subs = state === "empty" ? [] : [
      ["Madcreators", 2, "free"], ["Gamecreators", 35, "paid"], ["Streamlab", 5, "paid"], ["Pixelplay", 12, "free"], ["Nightowl", 21, "paid"],
    ].map(([name, days, tier]) => ({ name, joined: Date.now() - days * DAY, tier }));
    const stats = state === "empty" ? { total: 0, paid: 0, free: 0 } : { total: 1250, paid: 1000, free: 250 };
    const count = (n) => (n >= 1000 ? (n / 1000).toFixed(2).replace(/\.?0+$/, "") + "k" : String(n));
    document.getElementById("stat-total").textContent = count(stats.total);
    document.getElementById("stat-paid").textContent = count(stats.paid);
    document.getElementById("stat-free").textContent = count(stats.free);
    const joined = (t) => {
      const days = Math.max(1, Math.floor((Date.now() - t) / DAY));
      return days < 7 ? `Join ${days} days ago` : `Join ${Math.floor(days / 7)} weeks ago`;
    };
    const listEl = document.getElementById("subs");
    let filter = ["free", "paid"].includes(state) ? state : "all";
    function render() {
      document.querySelectorAll("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.filter === filter));
      const rows = subs.filter((s) => filter === "all" || s.tier === filter);
      listEl.innerHTML = rows.length ? rows.map((s) => `<div class="sub-row">${avatar(s.name)}<span class="sub-row__body"><span class="sub-row__name">${esc(s.name)}</span><span class="sub-row__joined">${joined(s.joined)}</span></span><span class="sub-badge">${s.tier === "paid" ? "Paid" : "Free"}</span></div>`).join("")
        : `<div class="empty-state"><i class="icon empty-state__icon" data-lucide="users-round"></i><h2 class="empty-state__title">No subscribers yet</h2><p class="empty-state__text">People who subscribe to your channel will appear here.</p></div>`;
    }
    document.querySelector(".sub-filters").addEventListener("click", (e) => {
      const f = e.target.closest("[data-filter]")?.dataset.filter;
      if (f) { filter = f; render(); }
    });
    render();
  }
})();
