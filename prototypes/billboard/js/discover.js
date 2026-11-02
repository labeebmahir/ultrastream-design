// Discover feed with Billboard's ad slots added to the shared feed.
(function () {
  const feed = document.getElementById("feed");
  let category = null;
  let stream = null;
  let nextBanner = US.STANDARD_EVERY;
  let bannerIndex = 0;
  const BATCH = 8;

  function appendBatch() {
    const { standard } = US.feedAds();
    let html = "";
    for (let i = 0; i < BATCH; i++) {
      html += stream.next();
      if (stream.count >= nextBanner) {
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
    stream = US.createFeedStream(category);
    nextBanner = US.STANDARD_EVERY;
    bannerIndex = 0;
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

  US.setupChips(document.getElementById("chips"), (cat) => {
    category = cat;
    renderFeed();
  });
  US.setupNotBuilt();

  feed.addEventListener("click", (e) => {
    const ad = e.target.closest("[data-ad]");
    if (ad) US.trackClick(ad.dataset.ad);
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
