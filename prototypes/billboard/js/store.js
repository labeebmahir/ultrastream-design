// Demo state and Billboard rules. All state lives in this browser; nothing is sent anywhere.
(function () {
  const KEY = "us-billboard-demo-v3";
  let memory = null;

  function fresh() {
    return { now: US.DEFAULT_NOW, campaigns: JSON.parse(JSON.stringify(US.SEED_CAMPAIGNS)), events: {}, feedLoads: 0 };
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
  US.parseLocal = parseLocal;
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
  // A new campaign is scheduled as soon as it's saved with its payment record.
  US.addCampaign = (c) => {
    const state = read();
    const campaign = { ...c, id: "n" + Date.now(), pauses: [] };
    state.campaigns.push(campaign);
    if (!write()) {
      state.campaigns.pop();
      return null;
    }
    return campaign;
  };

  const DAY = 86400000;
  const pausesOf = (c, now = US.now()) => (c.pauses || [])
    .map((p) => ({ from: parseLocal(p.from), to: p.to ? parseLocal(p.to) : now, open: !p.to }))
    .filter((p) => p.to > p.from || p.open)
    .sort((a, b) => a.from - b.from);

  US.fmtDateTime = (d) => d.toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  US.pausesOf = pausesOf;
  US.isPaused = (c) => (c.pauses || []).some((p) => !p.to);
  US.pausedMs = (c, now = US.now()) => pausesOf(c, now).reduce((sum, p) => sum + Math.max(0, p.to - p.from), 0);
  // Paused time is added to the end date in whole days, so a campaign always ends at midnight.
  US.addedDays = (c, now = US.now()) => Math.ceil(US.pausedMs(c, now) / DAY);
  US.originalEnd = (c) => addDays(toDate(c.start), c.days);
  US.endDate = (c, now = US.now()) => addDays(toDate(c.start), c.days + US.addedDays(c, now)); // exclusive: the campaign stops at 00:00 on this date
  US.lastDay = (c, now = US.now()) => addDays(US.endDate(c, now), -1);
  US.period = (c) => `${US.fmtDate(toDate(c.start))} – ${US.fmtDate(US.lastDay(c))}`;
  US.packageName = (c) => `${US.AD_TYPES[c.type].name} · ${c.days} days`;
  US.cost = (c) => US.PRICES[c.type][c.days];

  US.STATUS_LABELS = { scheduled: "Scheduled", live: "Live", paused: "Paused", ended: "Ended" };
  // A campaign goes live at the start of its start date.
  US.liveFrom = (c) => toDate(c.start);

  // scheduled -> live, which admin can pause -> ended.
  // Derived from the start date, the pause log and the date, never set by hand.
  US.status = (c, now = US.now()) => {
    if (now < US.liveFrom(c)) return "scheduled";
    if (now < US.endDate(c, now)) return US.isPaused(c) ? "paused" : "live";
    return "ended";
  };

  US.pause = (id) => {
    const c = US.campaign(id);
    if (US.status(c) !== "live") return;
    c.pauses = c.pauses || [];
    c.pauses.push({ from: read().now, to: null });
    changed();
  };
  US.resume = (id) => {
    const open = (US.campaign(id).pauses || []).find((p) => !p.to);
    if (!open) return;
    open.to = read().now;
    changed();
  };

  // When the ad was showing and when it was paused, from going live to the end (or now).
  US.runSegments = (c, now = US.now()) => {
    const status = US.status(c, now);
    if (status === "scheduled") return [];
    const end = status === "ended" ? US.endDate(c, now) : now;
    const segments = [];
    let cursor = US.liveFrom(c);
    for (const p of pausesOf(c, now)) {
      if (p.to <= cursor || p.from >= end) continue;
      if (p.from > cursor) segments.push({ kind: "live", from: cursor, to: p.from });
      segments.push({ kind: "paused", from: p.from > cursor ? p.from : cursor, to: p.to < end ? p.to : end, open: p.open });
      cursor = p.to;
    }
    if (end > cursor) segments.push({ kind: "live", from: cursor, to: end });
    return segments;
  };

  function seedOf(id) {
    return [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 1000, 7) / 1000;
  }

  // Simulated baseline for the time the ad was showing, plus what was actually viewed and clicked here.
  US.metrics = (c, now = US.now()) => {
    if (US.status(c, now) === "scheduled") return { impressions: 0, clicks: 0, ctr: 0, reach: 0 };
    const shown = US.runSegments(c, now).filter((s) => s.kind === "live").reduce((sum, s) => sum + (s.to - s.from), 0);
    const t = US.AD_TYPES[c.type];
    const s = seedOf(c.id);
    const base = Math.round((shown / DAY) * t.dailyImpressions * (0.8 + s * 0.4));
    const e = read().events[c.id] || { impressions: 0, clicks: 0 };
    const impressions = base + e.impressions;
    const clicks = Math.round(base * t.ctr * (0.85 + s * 0.3)) + e.clicks;
    const reach = Math.round(base * (0.36 + s * 0.08)) + e.impressions;
    return { impressions, clicks, ctr: impressions ? clicks / impressions : 0, reach };
  };

  // Placeholder split of impressions across placeholder countries. Adds up to the total.
  US.countryImpressions = (impressions) => {
    let left = impressions;
    return US.REPORT_COUNTRIES.map(([name, share], i, all) => {
      const n = i === all.length - 1 ? left : Math.round(impressions * share);
      left -= n;
      return { name, impressions: n, share: impressions ? n / impressions : 0 };
    });
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
  US.pausedNow = (now = US.now()) => US.campaigns().filter((c) => US.status(c, now) === "paused");

  // How the slots behave in this prototype:
  // Only live campaigns show. Paused and scheduled campaigns never do.
  // Billboard Prime Time shows during prime hours. Billboard holds the slot whenever no Prime Time ad is showing.
  // An empty slot collapses, so the Featured Banner rises to the top if no billboard is live.
  // Several campaigns in one slot rotate per feed load.
  US.feedAds = (now = US.now()) => {
    const load = read().feedLoads;
    const pick = (list) => (list.length ? list[load % list.length] : null);
    const primeTime = US.isPrimeTime(now) ? pick(US.liveOf("billboard-prime", now)) : null;
    return {
      billboard: primeTime || pick(US.liveOf("billboard", now)),
      featured: pick(US.liveOf("featured", now)),
      standard: US.liveOf("standard", now),
    };
  };
  US.countFeedLoad = () => { read().feedLoads += 1; write(); };

  // The feed below the top two slots: the shared feed's rows, with a Standard Banner after about every
  // US.STANDARD_EVERY items. Returns next(rows, standard, render), which gives the HTML for the next rows.
  // render(campaign, itemsSoFar) draws each banner. Used by the Discover screen.
  US.adFeed = (category) => {
    const stream = US.createFeedStream(category);
    let nextBanner = US.STANDARD_EVERY;
    let bannerIndex = 0;
    return (rows, standard, render = (c) => US.adHTML(c)) => {
      let html = "";
      for (let i = 0; i < rows; i++) {
        html += stream.next();
        if (stream.count >= nextBanner) {
          nextBanner += US.STANDARD_EVERY;
          if (standard.length) html += render(standard[bannerIndex++ % standard.length], stream.count);
        }
      }
      return html;
    };
  };

  function sampleSvg(c, format) {
    const size = { billboard: [1200, 675, 92, 40], featured: [1200, 400, 84, 36], standard: [1200, 300, 76, 32] }[format];
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
        <span class="ad__cta">Learn more <i class="icon icon--sm" data-lucide="arrow-up-right"></i></span>
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
