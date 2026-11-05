// Discover feed with Billboard's ad slots added to the shared feed. Each slot shows the one campaign whose daily
// window covers the demo time, in UTC. Billboard and Billboard Prime Time share the top, split by prime time.
(function () {
  const feed = document.getElementById("feed");
  let category = null;
  let more = null;
  const BATCH = 8;

  function appendBatch() {
    sentinel.insertAdjacentHTML("beforebegin", more(BATCH, US.feedAds().standard));
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
    more = US.adFeed(category);
    feed.scrollTop = 0;
    const { billboard, featured } = US.feedAds();
    feed.innerHTML = (billboard ? US.adHTML(billboard) : "") + (featured ? US.adHTML(featured) : "");
    feed.append(sentinel);
    appendBatch();
    renderReview();
  }

  function renderReview() {
    const now = US.now();
    const { billboard, featured, standard } = US.feedAds();
    const prime = US.isPrimeTime(now);
    const paused = US.pausedNow(now);
    const m = US.minuteOfDay(now);
    const local = US.localWindow(m, m, now).replace(/^(\S+)–\S+/, "$1");
    document.getElementById("review-time").textContent =
      `${US.fmtDateTime(now)}${local ? ` (${local})` : ""} is ${prime ? "in prime time" : "outside prime time"}.`;
    const slot = (label, c) => `<div class="slot"><strong>${label}</strong><span>${c ? `${US.esc(c.advertiser)} · ${US.esc(US.AD_TYPES[c.type].name)} · ${US.fmtWindow(c)}` : "Nothing on air, so the slot collapses"}</span></div>`;
    document.getElementById("review-slots").innerHTML =
      slot("Top of feed", billboard) +
      slot("Below the billboard", featured) +
      slot(`About every ${US.STANDARD_EVERY} items`, standard) +
      (paused.length ? `<div class="slot" id="review-paused"><strong>Paused, not showing</strong><span>${paused.map((c) => US.esc(c.advertiser)).join(", ")}</span></div>` : "");
  }

  const primeLocal = US.localWindow(US.PRIME.start, US.PRIME.end);
  document.getElementById("prime-hours").textContent = US.primeLabel() + (primeLocal ? ` (${primeLocal})` : "");

  US.setupChips(document.getElementById("chips"), (cat) => {
    category = cat;
    renderFeed();
  });
  US.setupNotBuilt();

  feed.addEventListener("click", (e) => {
    const ad = e.target.closest("[data-ad]");
    if (ad) US.trackClick(ad.dataset.ad);
  });

  const setTime = (hhmm) => US.setNow(`${US.nowString().split("T")[0]}T${hhmm}`);
  document.getElementById("jump-normal").addEventListener("click", () => setTime("10:00"));
  document.getElementById("jump-prime").addEventListener("click", () => setTime("14:00"));
  document.getElementById("jump-empty").addEventListener("click", () => setTime("03:00"));
  document.getElementById("jump-banner").addEventListener("click", () => {
    const banner = [...feed.querySelectorAll(".ad--standard")].find((b) => b.offsetTop - feed.offsetTop > feed.scrollTop + 20);
    if (banner) feed.scrollTo({ top: banner.offsetTop - feed.offsetTop - 60, behavior: "smooth" });
    else US.toast("No Standard Banner is on air at this demo time");
  });

  // Review states: ?state=normal, ?state=prime or ?state=empty set the demo clock on the same day.
  const state = new URLSearchParams(location.search).get("state");
  const at = { normal: "10:00", prime: "14:00", empty: "03:00" }[state];
  if (at && !US.nowString().endsWith("T" + at)) setTime(at);

  document.addEventListener("us:change", renderFeed);

  renderFeed();
  moreObserver.observe(sentinel);
})();
