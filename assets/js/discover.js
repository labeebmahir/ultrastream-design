(function () {
  const feed = document.getElementById("feed");
  const chips = document.getElementById("chips");
  let category = "All";
  let rendered = 0;
  let bannerIndex = 0;
  const BATCH = 10;

  chips.innerHTML = ["All", ...US.CATEGORIES]
    .map((c) => `<button class="chip" type="button" data-cat="${c}" aria-pressed="${c === "All"}">${c}</button>`)
    .join("");

  function cardHTML(item) {
    const a = `hsl(${item.hue} 55% 32%)`;
    const b = `hsl(${(item.hue + 50) % 360} 65% 18%)`;
    return `<a class="card" href="watch.html?id=${item.id}">
      <span class="card__thumb" style="background:linear-gradient(135deg,${a},${b})">
        ${item.kind === "short" ? '<span class="card__badge">Short</span>' : ""}
        <span class="card__len">${item.length}</span>
      </span>
      <span class="card__row">
        <span class="avatar" style="background:hsl(${item.hue} 70% 70%)">${item.channel[0]}</span>
        <span>
          <span class="card__title">${US.esc(item.title)}</span>
          <span class="card__sub">${US.esc(item.channel)} · ${item.views} views · ${item.age}</span>
        </span>
      </span>
    </a>`;
  }

  const pool = () => (category === "All" ? US.CONTENT : US.CONTENT.filter((c) => c.category === category));

  function appendBatch() {
    const items = pool();
    const { standard } = US.feedAds();
    let html = "";
    for (let i = 0; i < BATCH; i++) {
      html += cardHTML(items[rendered % items.length]);
      rendered += 1;
      if (rendered % US.STANDARD_EVERY === 0 && standard.length) {
        html += US.adHTML(standard[bannerIndex % standard.length]);
        bannerIndex += 1;
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
      `<div class="slot"><strong>Every ${US.STANDARD_EVERY} posts</strong><span>${standard.length ? standard.map((c) => US.esc(c.advertiser)).join(", ") : "Nothing live"}</span></div>`;
  }

  chips.addEventListener("click", (e) => {
    const cat = e.target.dataset.cat;
    if (!cat) return;
    category = cat;
    chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c.dataset.cat === cat));
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
    const banner = [...feed.querySelectorAll(".ad--standard")].find((b) => b.offsetTop > feed.scrollTop + 20);
    if (banner) feed.scrollTo({ top: banner.offsetTop - 60, behavior: "smooth" });
    else US.toast("No Standard Banner is live at this demo time");
  });

  document.addEventListener("us:change", renderFeed);

  US.countFeedLoad();
  renderFeed();
  moreObserver.observe(sentinel);
})();
