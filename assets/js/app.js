// Shared by the rebuilt app and prototypes: helpers, placeholder content and the feed layout.
window.US = window.US || {};

US.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

US.toast = (message) => {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), 3200);
};

US.CATEGORIES = ["Gaming", "Music", "Sports", "Tech", "Entertainment", "Art", "Education", "Food", "Travel"];

const AGES = { "5h": "5 hours ago", "6h": "6 hours ago", "9h": "9 hours ago", "1d": "1 day ago", "2d": "2 days ago", "3d": "3 days ago", "4d": "4 days ago", "5d": "5 days ago", "6d": "6 days ago", "1w": "1 week ago", "2w": "2 weeks ago" };

US.CONTENT = [
  ["video", "Gaming", "Ranked grind to the final circle", "PixelForge", "48K", "2d"],
  ["short", "Food", "One-pan garlic noodles", "StreetPlate", "210K", "5h"],
  ["video", "Music", "Writing a song in one hour", "LoopHouse", "19K", "1d"],
  ["video", "Tech", "I rebuilt my desk setup from scratch", "ByteBench", "86K", "3d"],
  ["short", "Sports", "Best save of the weekend", "SideLine", "340K", "9h"],
  ["video", "Travel", "48 hours in Colombo", "FarRoutes", "27K", "6d"],
  ["video", "Art", "Painting a mural in the rain", "OpenCanvas", "11K", "4d"],
  ["short", "Entertainment", "When the stream lags at the worst moment", "LaughTrack", "520K", "1d"],
  ["video", "Education", "How interest rates actually work", "PlainTerms", "63K", "1w"],
  ["video", "Gaming", "Speedrun attempts until I win", "PixelForge", "35K", "5d"],
  ["short", "Music", "Bass line you can't get out of your head", "LoopHouse", "98K", "2d"],
  ["video", "Food", "Trying every night market stall", "StreetPlate", "74K", "1w"],
  ["video", "Sports", "Training like a pro for seven days", "SideLine", "52K", "3d"],
  ["short", "Tech", "This keyboard sounds illegal", "ByteBench", "160K", "6h"],
  ["video", "Entertainment", "We tried improv with strangers", "LaughTrack", "44K", "4d"],
  ["video", "Travel", "The train ride nobody talks about", "FarRoutes", "31K", "2w"],
  ["short", "Art", "Timelapse: charcoal portrait", "OpenCanvas", "75K", "3d"],
  ["video", "Education", "Learn the basics of colour grading", "PlainTerms", "22K", "1w"],
].map(([kind, category, title, channel, views, age], i) => ({ id: "v" + i, kind, category, title, channel, views, age: AGES[age], live: i === 0, hue: (i * 47) % 360 }));

const PILLS = `<span class="thumb-pill thumb-pill--left"><i class="icon icon--xs" data-lucide="radio"></i>Live</span><span class="thumb-pill thumb-pill--right"><i class="icon icon--xs" data-lucide="eye"></i>12.5k</span>`;

US.thumbStyle = (item) => `background:linear-gradient(135deg,hsl(${item.hue} 55% 32%),hsl(${(item.hue + 50) % 360} 65% 18%))`;

US.cardHTML = (item, options) => {
  const href = options?.href || (item.live ? "watch.html?live=1" : `watch.html?id=${item.id}`);
  const pills = item.live
    ? PILLS
    : "";
  const sub = item.live ? US.esc(item.channel) : `${US.esc(item.channel)} • ${item.views} views • ${item.age}`;
  return `<a class="card" href="${href}">
    <span class="card__thumb" style="${US.thumbStyle(item)}">${pills}</span>
    <span class="card__row">
      <span class="avatar" style="background:hsl(${item.hue} 70% 70%)">${item.channel[0]}</span>
      <span>
        <span class="card__title">${US.esc(item.title)}</span>
        <span class="card__sub">${sub}</span>
      </span>
    </span>
  </a>`;
};

// As in the design: two full-width videos, then two shorts side by side. count is how many items so far.
US.createFeedStream = (category) => {
  const inCategory = (c) => !category || c.category === category;
  const videos = US.CONTENT.filter((c) => c.kind === "video" && inCategory(c));
  const shorts = US.CONTENT.filter((c) => c.kind === "short" && inCategory(c));
  let step = 0;
  let v = 0;
  let s = 0;
  const stream = {
    count: 0,
    next() {
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

// Category chips: tap to filter, tap again to clear.
US.setupChips = (container, onChange) => {
  let category = null;
  container.innerHTML = US.CATEGORIES
    .map((c) => `<button class="chip" type="button" data-cat="${c}" aria-pressed="false">${c}</button>`)
    .join("");
  container.addEventListener("click", (e) => {
    const cat = e.target.dataset.cat;
    if (!cat) return;
    category = category === cat ? null : cat;
    container.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c.dataset.cat === category));
    onChange(category);
  });
};

US.setupNotBuilt = () => {
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-todo]")) US.toast("This screen isn't rebuilt yet.");
  });
};

US.renderWatch = () => {
  const params = new URLSearchParams(location.search);
  US.setupNotBuilt();
  const id = params.get("id");
  const item = id ? US.CONTENT.find((c) => c.id === id) : US.CONTENT[0];
  if (!item) {
    document.getElementById("player").remove();
    document.querySelector(".watch").outerHTML = `<div class="empty-state">
      <i class="icon empty-state__icon" data-lucide="video-off"></i>
      <h1 class="empty-state__title">Content not found</h1>
      <p class="empty-state__text">The content you're looking for is no longer available.</p>
      <a class="btn btn--primary" href="discover.html">Go to discovery</a>
    </div>`;
    return;
  }
  const live = params.has("live") || item.live;
  const player = document.getElementById("player");
  player.style.background = US.thumbStyle(item).replace("background:", "");
  if (live) player.innerHTML = PILLS;
  document.getElementById("title").textContent = item.title;
  document.getElementById("sub").textContent = live ? "Live now" : `${item.views} views • ${item.age}`;
  document.getElementById("channel").textContent = item.channel;
  document.getElementById("handle").textContent = "@" + item.channel.toLowerCase();
  const avatar = document.getElementById("avatar");
  avatar.textContent = item.channel[0];
  avatar.style.background = `hsl(${item.hue} 70% 70%)`;
};

// Lucide icons: write <i class="icon" data-lucide="bell"></i> anywhere, including in content rendered later.
US.renderIcons = () => {
  if (window.lucide && document.querySelector("i[data-lucide]")) window.lucide.createIcons();
};
US.renderIcons();
new MutationObserver(US.renderIcons).observe(document.body, { childList: true, subtree: true });
