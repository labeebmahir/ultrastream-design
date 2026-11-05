// Demo state and Billboard rules. All state lives in this browser; nothing is sent anywhere.
// Every date and time here is UTC: campaign dates, daily windows, prime time and the demo clock.
(function () {
  const KEY = "us-billboard-demo-v4";
  let memory = null;

  function fresh() {
    return { now: US.DEFAULT_NOW, campaigns: JSON.parse(JSON.stringify(US.SEED_CAMPAIGNS)), events: {} };
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

  const DAY = 86400000;
  const MIN = 60000;
  const pad = (n) => String(n).padStart(2, "0");
  const toDate = (ymd) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  };
  const toYmd = (d) => d.toISOString().slice(0, 10);
  const addDays = (d, n) => new Date(d.getTime() + n * DAY);
  const parseUTC = (s) => {
    const [date, time = "00:00"] = s.split("T");
    const [h, m] = time.split(":").map(Number);
    return new Date(toDate(date).getTime() + (h * 60 + m) * MIN);
  };
  const dayStart = (d) => new Date(Math.floor(d.getTime() / DAY) * DAY);

  // "13:30" <-> 810 minutes from midnight. "24:00" is the end of the day.
  US.mins = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  US.hhmm = (mins) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
  US.minuteOfDay = (d) => d.getUTCHours() * 60 + d.getUTCMinutes();

  const UTC = { timeZone: "UTC" };
  US.fmtDate = (d) => d.toLocaleDateString("en-AU", { ...UTC, day: "numeric", month: "short", year: "numeric" });
  US.fmtDateTime = (d) => `${d.toLocaleDateString("en-AU", { ...UTC, day: "numeric", month: "short", year: "numeric" })}, ${US.hhmm(US.minuteOfDay(d))} UTC`;
  US.fmtMoney = (n, cents = false) => "US$" + n.toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 });
  US.fmtNum = (n) => n.toLocaleString("en-AU");
  US.fmtPct = (x) => (x * 100).toFixed(2) + "%";
  US.fmtMins = (n) => `${US.fmtNum(n)} min`;
  US.toYmd = toYmd;
  US.toDate = toDate;
  US.parseUTC = parseUTC;
  US.addDays = addDays;

  // A window in the reviewer's own time zone, on a given UTC day. Empty when their device is on UTC.
  US.localWindow = (from, to, day = US.now()) => {
    const base = dayStart(day).getTime();
    const a = new Date(base + from * MIN);
    const b = new Date(base + to * MIN);
    if (a.getTimezoneOffset() === 0 && b.getTimezoneOffset() === 0) return "";
    const time = (d) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
    const zone = new Intl.DateTimeFormat("en-AU", { timeZoneName: "short" }).formatToParts(a).find((p) => p.type === "timeZoneName")?.value || "";
    return `${time(a)}–${time(b)} your time${zone ? `, ${zone}` : ""}`;
  };
  US.primeLabel = () => `${US.hhmm(US.PRIME.start)}–${US.hhmm(US.PRIME.end)} UTC`;

  US.now = () => parseUTC(read().now);
  US.nowString = () => read().now;
  US.setNow = (s) => { read().now = s; changed(); };
  US.shiftNow = (days) => {
    const d = addDays(US.now(), days);
    US.setNow(`${toYmd(d)}T${US.hhmm(US.minuteOfDay(d))}`);
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

  // Airtime and cost: minutes a day × days × the slot's per-minute rate.
  US.windowOf = (c) => ({ from: US.mins(c.from), to: US.mins(c.to) });
  US.minutesPerDay = (c) => US.mins(c.to) - US.mins(c.from);
  US.days = (c) => Math.round((toDate(c.end) - toDate(c.start)) / DAY) + 1;
  US.airtimeBooked = (c) => US.minutesPerDay(c) * US.days(c);
  US.rate = (c) => US.AD_TYPES[c.type].rate;
  US.cost = (c) => US.airtimeBooked(c) * US.rate(c);
  US.fmtRate = (type) => `${US.fmtMoney(US.AD_TYPES[type].rate)} per minute`;
  US.fmtWindow = (c) => `${c.from}–${c.to} UTC`;
  US.slotLine = (c) => `${US.AD_TYPES[c.type].name} · ${c.from}–${c.to} UTC daily`;
  US.costLine = (c) => `${US.fmtNum(US.minutesPerDay(c))} min × ${US.days(c)} day${US.days(c) === 1 ? "" : "s"} × ${US.fmtMoney(US.rate(c))}`;

  const pausesOf = (c, now = US.now()) => (c.pauses || [])
    .map((p) => ({ from: parseUTC(p.from), to: p.to ? parseUTC(p.to) : now, open: !p.to }))
    .filter((p) => p.to > p.from || p.open)
    .sort((a, b) => a.from - b.from);

  US.pausesOf = pausesOf;
  US.isPaused = (c) => (c.pauses || []).some((p) => !p.to);
  US.pausedMs = (c, now = US.now()) => pausesOf(c, now).reduce((sum, p) => sum + Math.max(0, p.to - p.from), 0);
  // Paused time is added to the end date in whole days, so a campaign always ends at midnight UTC.
  US.addedDays = (c, now = US.now()) => Math.ceil(US.pausedMs(c, now) / DAY);
  US.originalEnd = (c) => addDays(toDate(c.end), 1); // exclusive: 00:00 UTC on the day after the last day
  US.endDate = (c, now = US.now()) => addDays(US.originalEnd(c), US.addedDays(c, now));
  US.lastDay = (c, now = US.now()) => addDays(US.endDate(c, now), -1);
  US.period = (c) => `${US.fmtDate(toDate(c.start))} – ${US.fmtDate(US.lastDay(c))}`;

  US.STATUS_LABELS = { scheduled: "Scheduled", live: "Live", paused: "Paused", ended: "Ended" };
  // A campaign goes live at 00:00 UTC on its start date, and is on air each day during its window.
  US.liveFrom = (c) => toDate(c.start);

  // scheduled -> live, which admin can pause -> ended.
  // Derived from the dates, the pause log and the demo clock, never set by hand.
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

  // When the campaign was live and when it was paused, from going live to the end (or now).
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

  // Minutes between two moments that fall inside a daily window [a, b), counted day by day.
  function minutesInWindow(from, to, a, b) {
    let total = 0;
    for (let day = dayStart(from).getTime(); day < to.getTime(); day += DAY) {
      const start = Math.max(from.getTime(), day + a * MIN);
      const end = Math.min(to.getTime(), day + b * MIN);
      if (end > start) total += (end - start) / MIN;
    }
    return Math.round(total);
  }

  // Airtime delivered: minutes on air while live, split into outside and inside prime time.
  US.airtime = (c, now = US.now()) => {
    const w = US.windowOf(c);
    const pa = Math.max(w.from, US.PRIME.start);
    const pb = Math.min(w.to, US.PRIME.end);
    let total = 0;
    let prime = 0;
    for (const s of US.runSegments(c, now)) {
      if (s.kind !== "live") continue;
      total += minutesInWindow(s.from, s.to, w.from, w.to);
      if (pb > pa) prime += minutesInWindow(s.from, s.to, pa, pb);
    }
    return { total, prime, normal: total - prime };
  };

  function seedOf(id) {
    return [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 1000, 7) / 1000;
  }

  // Simulated baseline for the minutes on air, plus what was actually viewed and clicked here.
  US.metrics = (c, now = US.now()) => {
    const air = US.airtime(c, now);
    if (US.status(c, now) === "scheduled") return { impressions: 0, clicks: 0, ctr: 0, reach: 0, cpm: 0, air };
    const t = US.AD_TYPES[c.type];
    const s = seedOf(c.id);
    const base = Math.round(air.total * t.perMinute * (0.8 + s * 0.4));
    const e = read().events[c.id] || { impressions: 0, clicks: 0 };
    const impressions = base + e.impressions;
    const clicks = Math.round(base * t.ctr * (0.85 + s * 0.3)) + e.clicks;
    const reach = Math.round(base * (0.36 + s * 0.08)) + e.impressions;
    // Cost per 1,000 impressions: the booked cost ÷ impressions × 1,000.
    const cpm = impressions ? (US.cost(c) / impressions) * 1000 : 0;
    return { impressions, clicks, ctr: impressions ? clicks / impressions : 0, reach, cpm, air };
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

  // Prime time is the same moment for every viewer, set in UTC.
  US.isPrimeTime = (now = US.now()) => {
    const m = US.minuteOfDay(now);
    return m >= US.PRIME.start && m < US.PRIME.end;
  };
  US.isOnAir = (c, now = US.now()) => {
    const m = US.minuteOfDay(now);
    const w = US.windowOf(c);
    return US.status(c, now) === "live" && m >= w.from && m < w.to;
  };
  US.pausedNow = (now = US.now()) => US.campaigns().filter((c) => US.status(c, now) === "paused");

  // How the slots behave in this prototype:
  // Each place in the feed has one advertiser at a time: the campaign whose daily window covers this minute.
  // Billboard and Billboard Prime Time share the top of the feed, split by prime time.
  // Paused and scheduled campaigns never show. An empty slot collapses, so the Featured Banner rises to the top.
  // If added paused days ever meet another booking, the original booking keeps the slot.
  US.onAirIn = (group, now = US.now()) => US.campaigns()
    .filter((c) => US.AD_TYPES[c.type].group === group && US.isOnAir(c, now))
    .sort((a, b) => (now < US.originalEnd(b)) - (now < US.originalEnd(a)))[0] || null;
  US.feedAds = (now = US.now()) => ({
    billboard: US.onAirIn("top", now),
    featured: US.onAirIn("featured", now),
    standard: US.onAirIn("standard", now),
  });

  // Booking rules for Create campaign.
  // Billboard sits outside prime time and Billboard Prime Time inside it. Banners can use any window.
  US.allowedRanges = (type) => {
    if (type === "billboard") return [[0, US.PRIME.start], [US.PRIME.end, 1440]];
    if (type === "billboard-prime") return [[US.PRIME.start, US.PRIME.end]];
    return [[0, 1440]];
  };

  // Campaigns that hold the same place in the feed on any of these dates.
  US.bookingsFor = (type, start, end, now = US.now()) => {
    const group = US.AD_TYPES[type].group;
    const a = toDate(start);
    const b = addDays(toDate(end), 1);
    return US.campaigns().filter((c) => US.AD_TYPES[c.type].group === group && US.status(c, now) !== "ended"
      && US.liveFrom(c) < b && US.endDate(c, now) > a);
  };

  // Bookings whose daily window shares a minute with [from, to).
  US.clashes = (draft) => US.bookingsFor(draft.type, draft.start, draft.end)
    .filter((c) => US.mins(c.from) < US.mins(draft.to) && US.mins(c.to) > US.mins(draft.from));

  // The free window of the same length that starts nearest the one asked for, or null.
  US.nearestFree = (draft) => {
    const length = US.mins(draft.to) - US.mins(draft.from);
    const wanted = US.mins(draft.from);
    const busy = US.bookingsFor(draft.type, draft.start, draft.end).map((c) => [US.mins(c.from), US.mins(c.to)]);
    let best = null;
    for (const [lo, hi] of US.allowedRanges(draft.type)) {
      for (let s = lo; s + length <= hi; s += US.STEP) {
        if (busy.some(([a, b]) => a < s + length && b > s)) continue;
        if (best === null || Math.abs(s - wanted) < Math.abs(best - wanted)) best = s;
      }
    }
    return best === null ? null : { from: US.hhmm(best), to: US.hhmm(best + length) };
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

  // The feed below the top two slots: the shared feed's rows, with the Standard Banner after about every
  // US.STANDARD_EVERY items. Returns next(rows, standard), which gives the HTML for the next rows.
  // standard is the one campaign on air in that slot, or null. Used by the Discover screen.
  US.adFeed = (category) => {
    const stream = US.createFeedStream(category);
    let nextBanner = US.STANDARD_EVERY;
    return (rows, standard) => {
      let html = "";
      for (let i = 0; i < rows; i++) {
        html += stream.next();
        if (stream.count >= nextBanner) {
          nextBanner += US.STANDARD_EVERY;
          if (standard) html += US.adHTML(standard);
        }
      }
      return html;
    };
  };

  // The availability timeline for Create campaign: 00:00 to 24:00 UTC, with the prime band, the hours this slot
  // can't use, booked windows and the window being booked. Returns HTML.
  US.timelineHTML = (draft, bookings, state) => {
    const pct = (m) => `${(m / 1440) * 100}%`;
    const span = (a, b) => `left:${pct(a)};width:${pct(b - a)}`;
    const closed = [];
    let cursor = 0;
    for (const [lo, hi] of US.allowedRanges(draft.type)) {
      if (lo > cursor) closed.push([cursor, lo]);
      cursor = hi;
    }
    if (cursor < 1440) closed.push([cursor, 1440]);
    const from = US.mins(draft.from);
    const to = US.mins(draft.to);
    const ticks = [0, 6, 12, 18, 24].map((h) => `<span class="tl__tick" style="left:${pct(h * 60)}">${pad(h)}:00</span>`).join("");
    return `<div class="tl" role="img" aria-label="${US.esc(state.label)}">
      <div class="tl__track">
        <span class="tl__prime" style="${span(US.PRIME.start, US.PRIME.end)}"><span>Prime</span></span>
        ${closed.map(([a, b]) => `<span class="tl__closed" style="${span(a, b)}"></span>`).join("")}
        ${bookings.map((c) => `<span class="tl__booked" style="${span(US.mins(c.from), US.mins(c.to))}" title="${US.esc(c.advertiser)} ${c.from}–${c.to} UTC"><span>${US.esc(c.advertiser)}</span></span>`).join("")}
        ${to > from ? `<span class="tl__mine${state.bad ? " is-bad" : ""}" style="${span(from, to)}"></span>` : ""}
      </div>
      <div class="tl__ticks">${ticks}</div>
    </div>`;
  };

  // Re-render other open tabs when demo state changes there.
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      memory = null;
      document.dispatchEvent(new CustomEvent("us:change"));
    }
  });
})();
