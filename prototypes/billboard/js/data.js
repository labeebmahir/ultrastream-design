// Placeholder data. Rates, prime time hours, creative specs, audience numbers and sample campaigns are all made up.
window.US = window.US || {};

// The four ad slots. Airtime is sold by the minute: each slot has one per-minute rate in US dollars.
// "format" is the shape of the ad in the feed. "group" is the place in the feed: Billboard and Billboard Prime Time
// share the top of the feed, split by prime time, so they're one group for availability.
// perMinute is the simulated number of impressions for each minute on air.
US.AD_TYPES = {
  "billboard": { name: "Billboard", where: "Top of the Discover feed, outside prime time", format: "billboard", group: "top", rate: 12, spec: "1200 × 675 px", perMinute: 900, ctr: 0.019 },
  "billboard-prime": { name: "Billboard Prime Time", where: "Top of the Discover feed, during prime time", format: "billboard", group: "top", rate: 30, spec: "1200 × 675 px", perMinute: 2100, ctr: 0.024 },
  "featured": { name: "Featured Banner", where: "Below the Billboard, one rate all day", format: "featured", group: "featured", rate: 7, spec: "1200 × 400 px", perMinute: 600, ctr: 0.012 },
  "standard": { name: "Standard Banner", where: "About every 15 items, one rate all day", format: "standard", group: "standard", rate: 3, spec: "1200 × 300 px", perMinute: 350, ctr: 0.008 },
};

// Prime time: one window for every viewer, in UTC, as minutes from midnight. Placeholder hours.
US.PRIME = { start: 13 * 60, end: 17 * 60 };
// Booking windows move in 15-minute steps, which is also the shortest booking.
US.STEP = 15;
US.STANDARD_EVERY = 15;
// The demo clock is in UTC.
US.DEFAULT_NOW = "2026-11-03T14:00";

// Fictional advertisers. Dates are the first and last day, and from/to the daily window, all in UTC.
// No two campaigns in the same place share a minute. c1/c2 are the gradient colours for the sample creative.
US.SEED_CAMPAIGNS = [
  { id: "c1", advertiser: "Kestrel Audio", tagline: "Hear every frame", type: "billboard-prime", start: "2026-10-28", end: "2026-11-10", from: "13:00", to: "17:00", url: "https://example.com/kestrel", c1: "#1d3557", c2: "#e63946" },
  { id: "c2", advertiser: "Volt & Ember", tagline: "Energy for late nights", type: "billboard", start: "2026-10-30", end: "2026-11-05", from: "08:00", to: "12:00", url: "https://example.com/volt", c1: "#3a0ca3", c2: "#f72585" },
  { id: "c3", advertiser: "Tallow & Thread", tagline: "Made to outlast the season", type: "featured", start: "2026-10-26", end: "2026-11-08", from: "09:00", to: "18:00", url: "https://example.com/tallow", c1: "#264653", c2: "#2a9d8f" },
  { id: "c4", advertiser: "Orbit Gear", tagline: "Kit for creators on the move", type: "standard", start: "2026-10-20", end: "2026-11-18", from: "06:00", to: "15:00", url: "https://example.com/orbit", c1: "#3d348b", c2: "#7678ed" },
  { id: "c5", advertiser: "Fable Cycles", tagline: "Ride further this summer", type: "billboard", start: "2026-11-10", end: "2026-11-23", from: "18:00", to: "22:00", url: "https://example.com/fable", c1: "#14532d", c2: "#84cc16" },
  { id: "c6", advertiser: "Marlowe Games", tagline: "The new season starts now", type: "standard", start: "2026-11-16", end: "2026-11-22", from: "15:00", to: "23:00", url: "https://example.com/marlowe", c1: "#581c87", c2: "#c026d3" },
  { id: "c7", advertiser: "Juniper Travel", tagline: "Fly somewhere new", type: "billboard", start: "2026-10-05", end: "2026-10-18", from: "18:00", to: "22:00", url: "https://example.com/juniper", c1: "#0c4a6e", c2: "#0ea5e9" },
  { id: "c8", advertiser: "Harbour Tea", tagline: "Slow down with a better cup", type: "billboard-prime", start: "2026-09-21", end: "2026-09-27", from: "14:00", to: "16:00", url: "https://example.com/harbour", c1: "#713f12", c2: "#ca8a04" },
  { id: "c9", advertiser: "Saltmarsh Coffee", tagline: "Roasted for the night shift", type: "standard", start: "2026-11-12", end: "2026-11-25", from: "00:00", to: "06:00", url: "https://example.com/saltmarsh", c1: "#422006", c2: "#ea580c" },
  { id: "c10", advertiser: "Copperline Bikes", tagline: "Built for the long way home", type: "featured", start: "2026-11-20", end: "2026-11-26", from: "09:00", to: "13:00", url: "https://example.com/copperline", c1: "#1e293b", c2: "#f97316" },
];

// Placeholder options until the payment method is decided.
US.PAYMENT_METHODS = ["Bank transfer", "Card", "Payment link", "Other"];
US.PAYMENT_ROLES = ["Sales", "Finance", "Admin"];

// Placeholder countries and their share of impressions on the report. Not real countries or data.
US.REPORT_COUNTRIES = [["Country A", 0.34], ["Country B", 0.22], ["Country C", 0.17], ["Country D", 0.12], ["Country E", 0.09], ["Other countries", 0.06]];

// Sample campaigns arrive already paid for, with a placeholder payment record. c7 was paused for two days.
US.SEED_CAMPAIGNS = US.SEED_CAMPAIGNS.map((c, i) => {
  const before = (days) => {
    const [y, m, d] = c.start.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d - days));
    return date.toISOString().slice(0, 10);
  };
  // Never later than the day before the demo date, so no record sits in the future.
  const latest = (ymd) => (ymd < "2026-11-02" ? ymd : "2026-11-02");
  return {
    payment: {
      by: US.PAYMENT_ROLES[i % 2],
      date: latest(before(6)),
      method: US.PAYMENT_METHODS[i % 3],
      ref: `SAMPLE-${String(i + 1).padStart(4, "0")}`,
    },
    pauses: c.id === "c7" ? [{ from: "2026-10-10T09:00", to: "2026-10-12T09:00" }] : [],
    ...c,
  };
});
