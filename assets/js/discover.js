(function () {
  const feed = document.getElementById("feed");
  const chips = document.getElementById("chips");
  let category = null;
  let rendered = 0;
  let nextBanner = US.STANDARD_EVERY;
  let bannerIndex = 0;
  let videoIndex = 0;
  let shortIndex = 0;
  let step = 0;
  const BATCH = 8;

  chips.innerHTML = US.CATEGORIES
    .map((c) => `<button class="chip" type="button" data-cat="${c}" aria-pressed="false">${c}</button>`)
    .join("");

  const thumbStyle = (item) => `background:linear-gradient(135deg,hsl(${item.hue} 55% 32%),hsl(${(item.hue + 50) % 360} 65% 18%))`;

  function cardHTML(item) {
    const href = item.live ? "watch.html?live=1" : `watch.html?id=${item.id}`;
    const pills = item.live
      ? `<span class="thumb-pill thumb-pill--left">Live</span><span class="thumb-pill thumb-pill--right">12.5k</span>`
      : "";
    const sub = item.live ? US.esc(item.channel) : `${US.esc(item.channel)} • ${item.views} views • ${item.age}`;
    return `<a class="card" href="${href}">
      <span class="card__thumb" style="${thumbStyle(item)}">${pills}</span>
      <span class="card__row">
        <span class="avatar" style="background:hsl(${item.hue} 70% 70%)">${item.channel[0]}</span>
        <span>
          <span class="card__title">${US.esc(item.title)}</span>
          <span class="card__sub">${sub}</span>
        </span>
      </span>
    </a>`;
  }

  const inCategory = (c) => !category || c.category === category;

  // As in the design: two full-width videos, then two shorts side by side.
  function nextBlock() {
    const videos = US.CONTENT.filter((c) => c.kind === "video" && inCategory(c));
    const shorts = US.CONTENT.filter((c) => c.kind === "short" && inCategory(c));
    const wantShorts = videos.length === 0 || (shorts.length > 0 && step % 3 === 2);
    step += 1;
    if (wantShorts) {
      const a = shorts[shortIndex++ % shorts.length];
      const b = shorts[shortIndex++ % shorts.length];
      rendered += 2;
      return `<div class="short-row">${cardHTML(a)}${cardHTML(b)}</div>`;
    }
    rendered += 1;
    return cardHTML(videos[videoIndex++ % videos.length]);
  }

  function appendBatch() {
    const { standard } = US.feedAds();
    let html = "";
    for (let i = 0; i < BATCH; i++) {
      html += nextBlock();
      if (rendered >= nextBanner) {
        nextBanner += US.STANDARD_EVERY;
        if (standard.length) html += US.adHTML(standard[bannerIndex++ % standard.length]);
      }
    }
    sentinel.insertAdjacentHTML("beforebegin", html);
    watchAds();
  }

  const sentinel = document.createElement("div");
  sentinel.className = "feed__end";

  const seen = new WeakSet();
  const impressionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !seen.has(entry.target)) {
        seen.add(entry.target);
        US.trackImpression(entry.target.dataset.ad);
      }
    }
  }, { root: feed, threshold: 0.5 });

  function watchAds() {
    feed.querySelectorAll("[data-ad]").forEach((el) => impressionObserver.observe(el));
  }

  const moreObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) appendBatch();
  }, { root: feed, rootMargin: "600px" });

  function renderFeed() {
    rendered = 0;
    nextBanner = US.STANDARD_EVERY;
    bannerIndex = 0;
    videoIndex = 0;
    shortIndex = 0;
    step = 0;
    feed.scrollTop = 0;
    const { billboard, primeBanner } = US.feedAds();
    feed.innerHTML = (billboard ? US.adHTML(billboard) : "") + (primeBanner ? US.adHTML(primeBanner) : "");
    feed.append(sentinel);
    appendBatch();
    renderReview();
  }

  function renderReview() {
    const now = US.now();
    const { billboard, primeBanner, standard } = US.feedAds();
    const prime = US.isPrimeTime(now);
    document.getElementById("review-time").textContent =
      `${now.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })} is ${prime ? "prime time" : "normal time"}.`;
    const slot = (label, c) => `<div class="slot"><strong>${label}</strong><span>${c ? `${US.esc(c.advertiser)} · ${US.esc(US.AD_TYPES[c.type].name)}` : "Nothing live, so the slot collapses"}</span></div>`;
    document.getElementById("review-slots").innerHTML =
      slot("Top of feed", billboard) +
      slot("After the billboard", primeBanner) +
      `<div class="slot"><strong>About every ${US.STANDARD_EVERY} posts</strong><span>${standard.length ? standard.map((c) => US.esc(c.advertiser)).join(", ") : "Nothing live"}</span></div>`;
  }

  // Tap a category to filter, tap it again to clear.
  chips.addEventListener("click", (e) => {
    const cat = e.target.dataset.cat;
    if (!cat) return;
    category = category === cat ? null : cat;
    chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c.dataset.cat === category));
    renderFeed();
  });

  feed.addEventListener("click", (e) => {
    const ad = e.target.closest("[data-ad]");
    if (ad) US.trackClick(ad.dataset.ad);
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-todo]")) US.toast("Not rebuilt yet. This prototype covers Discover only.");
  });

  const setHour = (hour) => US.setNow(`${US.nowString().split("T")[0]}T${hour}:00`);
  document.getElementById("jump-normal").addEventListener("click", () => setHour("11"));
  document.getElementById("jump-prime").addEventListener("click", () => setHour("19"));
  document.getElementById("jump-banner").addEventListener("click", () => {
    const banner = [...feed.querySelectorAll(".ad--standard")].find((b) => b.offsetTop - feed.offsetTop > feed.scrollTop + 20);
    if (banner) feed.scrollTo({ top: banner.offsetTop - feed.offsetTop - 60, behavior: "smooth" });
    else US.toast("No Standard Banner is live at this demo time");
  });

  document.addEventListener("us:change", renderFeed);

  US.countFeedLoad();
  renderFeed();
  moreObserver.observe(sentinel);
})();
