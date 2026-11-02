// Demo state and Billboard rules. All state lives in this browser; nothing is sent anywhere.
(function () {
  const KEY = "us-billboard-demo-v1";
  let memory = null;

  function fresh() {
    return { now: US.DEFAULT_NOW, campaigns: US.SEED_CAMPAIGNS.map((c) => ({ ...c })), events: {}, feedLoads: 0 };
  }

  function read() {
    if (memory) return memory;
    try {
      memory = JSON.parse(localStorage.getItem(KEY)) || fresh();
    } catch (e) {
      memory = fresh();
    }
    return memory;
  }

  function write() {
    try {
      localStorage.setItem(KEY, JSON.stringify(memory));
      return true;
    } catch (e) {
      return false;
    }
  }

  function changed() {
    write();
    document.dispatchEvent(new CustomEvent("us:change"));
  }

  const pad = (n) => String(n).padStart(2, "0");
  const toDate = (ymd) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const toYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
  const parseLocal = (s) => {
    const [date, time = "00:00"] = s.split("T");
    const [h, m] = time.split(":").map(Number);
    const d = toDate(date);
    d.setHours(h, m);
    return d;
  };

  US.fmtDate = (d) => d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  US.fmtMoney = (n) => "A$" + n.toLocaleString("en-AU");
  US.fmtNum = (n) => n.toLocaleString("en-AU");
  US.fmtPct = (x) => (x * 100).toFixed(2) + "%";
  US.toYmd = toYmd;
  US.toDate = toDate;
  US.addDays = addDays;

  US.now = () => parseLocal(read().now);
  US.nowString = () => read().now;
  US.setNow = (s) => { read().now = s; changed(); };
  US.shiftNow = (days) => {
    const d = addDays(US.now(), days);
    US.setNow(`${toYmd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
  };
  US.reset = () => { memory = fresh(); changed(); };

  US.campaigns = () => read().campaigns;
  US.campaign = (id) => read().campaigns.find((c) => c.id === id);
  US.addCampaign = (c) => {
    const state = read();
    const campaign = { ...c, id: "n" + Date.now() };
    state.campaigns.push(campaign);
    if (!write()) {
      state.campaigns.pop();
      return null;
    }
    return campaign;
  };

  US.endDate = (c) => addDays(toDate(c.start), c.days); // exclusive: the campaign stops at 00:00 on this date
  US.lastDay = (c) => addDays(toDate(c.start), c.days - 1);
  US.period = (c) => `${US.fmtDate(toDate(c.start))} – ${US.fmtDate(US.lastDay(c))}`;
  US.packageName = (c) => `${US.AD_TYPES[c.type].name} · ${c.days} days`;
  US.cost = (c) => US.PRICES[c.type][c.days];

  // scheduled -> live (start date) -> ended (package ends). Derived from the date, never set by hand.
  US.status = (c, now = US.now()) => {
    if (now < toDate(c.start)) return "scheduled";
    if (now < US.endDate(c)) return "live";
    return "ended";
  };

  function seedOf(id) {
    return [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 1000, 7) / 1000;
  }

  // Simulated baseline plus what was actually viewed and clicked in this prototype.
  US.metrics = (c, now = US.now()) => {
    const status = US.status(c, now);
    if (status === "scheduled") return { impressions: 0, clicks: 0, ctr: 0 };
    const t = US.AD_TYPES[c.type];
    const end = status === "ended" ? US.endDate(c) : now;
    const elapsed = Math.max(0, (end - toDate(c.start)) / 86400000);
    const s = seedOf(c.id);
    const base = Math.round(elapsed * t.dailyImpressions * (0.8 + s * 0.4));
    const e = read().events[c.id] || { impressions: 0, clicks: 0 };
    const impressions = base + e.impressions;
    const clicks = Math.round(base * t.ctr * (0.85 + s * 0.3)) + e.clicks;
    return { impressions, clicks, ctr: impressions ? clicks / impressions : 0 };
  };

  function track(id, field) {
    const events = read().events;
    events[id] = events[id] || { impressions: 0, clicks: 0 };
    events[id][field] += 1;
    write();
  }
  US.trackImpression = (id) => track(id, "impressions");
  US.trackClick = (id) => track(id, "clicks");

  US.isPrimeTime = (now = US.now()) => now.getHours() >= US.PRIME_HOURS.start && now.getHours() < US.PRIME_HOURS.end;
  US.liveOf = (type, now = US.now()) => US.campaigns().filter((c) => c.type === type && US.status(c, now) === "live");

  // Assumptions for review:
  // Prime Time shows during prime hours. Normal Time holds the slot whenever no Prime Time ad is showing.
  // An empty slot collapses, so Prime Banner rises to the top if no billboard is live.
  // Several campaigns in one slot rotate per feed load (exclusive vs rotating is undecided).
  US.feedAds = (now = US.now()) => {
    const load = read().feedLoads;
    const pick = (list) => (list.length ? list[load % list.length] : null);
    const primeTime = US.isPrimeTime(now) ? pick(US.liveOf("prime-time", now)) : null;
    return {
      billboard: primeTime || pick(US.liveOf("prime-normal", now)),
      primeBanner: pick(US.liveOf("prime-banner", now)),
      standard: US.liveOf("standard", now),
    };
  };
  US.countFeedLoad = () => { read().feedLoads += 1; write(); };

  function sampleSvg(c, format) {
    const size = { billboard: [1200, 675, 92, 40], "prime-banner": [1200, 400, 84, 36], standard: [1200, 300, 76, 32] }[format];
    const [w, h, big, small] = size;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${c.c1 || "#333"}"/><stop offset="1" stop-color="${c.c2 || "#ff5c00"}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/><circle cx="${w * 0.86}" cy="${h * 0.3}" r="${h * 0.5}" fill="#fff" opacity=".08"/><text x="70" y="${h / 2}" font-family="Arial,sans-serif" font-weight="700" font-size="${big}" fill="#fff">${US.esc(c.advertiser)}</text><text x="72" y="${h / 2 + small * 1.6}" font-family="Arial,sans-serif" font-size="${small}" fill="#fff" opacity=".85">${US.esc(c.tagline || "")}</text></svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  US.creativeSrc = (c) => c.creative || sampleSvg(c, US.AD_TYPES[c.type].format);

  US.adHTML = (c, options = {}) => {
    const format = US.AD_TYPES[c.type].format;
    const tag = options.preview ? "div" : "a";
    const attrs = options.preview ? "" : `href="${US.esc(c.url)}" target="_blank" rel="noopener sponsored" data-ad="${c.id}"`;
    return `<${tag} class="ad ad--${format}" ${attrs}>
      <img class="ad__media" src="${US.creativeSrc(c)}" alt="${US.esc(c.advertiser)} advertisement">
      <span class="ad__meta">
        <span class="sponsored">Sponsored</span>
        <span class="ad__name">${US.esc(c.advertiser)}</span>
        <span class="ad__cta">Learn more ↗</span>
      </span>
    </${tag}>`;
  };

  // Re-render other open tabs when demo state changes there.
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      memory = null;
      document.dispatchEvent(new CustomEvent("us:change"));
    }
  });
})();
