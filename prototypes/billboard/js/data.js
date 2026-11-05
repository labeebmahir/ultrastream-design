// Placeholder data. Replace prices, durations and specs when the package document is added to the brief.
window.US = window.US || {};

// The four packages. "format" is the shape of the ad in the feed.
US.AD_TYPES = {
  "billboard": { name: "Billboard", where: "Top of the Discover feed, outside prime hours", format: "billboard", spec: "1200 × 675 px", dailyImpressions: 42000, ctr: 0.019 },
  "billboard-prime": { name: "Billboard Prime Time", where: "Top of the Discover feed, during prime hours", format: "billboard", spec: "1200 × 675 px", dailyImpressions: 31000, ctr: 0.024 },
  "featured": { name: "Featured Banner", where: "Below the billboard", format: "featured", spec: "1200 × 400 px", dailyImpressions: 28000, ctr: 0.012 },
  "standard": { name: "Standard Banner", where: "About every 15 items, repeating as the viewer scrolls", format: "standard", spec: "1200 × 300 px", dailyImpressions: 16000, ctr: 0.008 },
};

US.DURATIONS = [7, 14, 30];

US.PRICES = {
  "billboard": { 7: 1500, 14: 2700, 30: 5000 },
  "billboard-prime": { 7: 2500, 14: 4500, 30: 8500 },
  "featured": { 7: 900, 14: 1600, 30: 3000 },
  "standard": { 7: 400, 14: 700, 30: 1300 },
};

US.PRIME_HOURS = { start: 18, end: 22 };
US.STANDARD_EVERY = 15;
US.DEFAULT_NOW = "2026-11-03T19:00";

// Fictional advertisers. c1/c2 are the gradient colours for the sample creative.
US.SEED_CAMPAIGNS = [
  { id: "c1", advertiser: "Kestrel Audio", tagline: "Hear every frame", type: "billboard-prime", days: 14, start: "2026-10-28", url: "https://example.com/kestrel", c1: "#1d3557", c2: "#e63946" },
  { id: "c2", advertiser: "Volt & Ember", tagline: "Energy for late nights", type: "billboard", days: 7, start: "2026-10-30", url: "https://example.com/volt", c1: "#3a0ca3", c2: "#f72585" },
  { id: "c3", advertiser: "Tallow & Thread", tagline: "Made to outlast the season", type: "featured", days: 14, start: "2026-10-26", url: "https://example.com/tallow", c1: "#264653", c2: "#2a9d8f" },
  { id: "c4", advertiser: "Orbit Gear", tagline: "Kit for creators on the move", type: "standard", days: 30, start: "2026-10-20", url: "https://example.com/orbit", c1: "#3d348b", c2: "#7678ed" },
  { id: "c5", advertiser: "Fable Cycles", tagline: "Ride further this summer", type: "billboard", days: 14, start: "2026-11-10", url: "https://example.com/fable", c1: "#14532d", c2: "#84cc16" },
  { id: "c6", advertiser: "Marlowe Games", tagline: "The new season starts now", type: "standard", days: 7, start: "2026-11-16", url: "https://example.com/marlowe", c1: "#581c87", c2: "#c026d3" },
  { id: "c7", advertiser: "Juniper Travel", tagline: "Fly somewhere new", type: "featured", days: 14, start: "2026-10-05", url: "https://example.com/juniper", c1: "#0c4a6e", c2: "#0ea5e9" },
  { id: "c8", advertiser: "Harbour Tea", tagline: "Slow down with a better cup", type: "billboard-prime", days: 7, start: "2026-09-21", url: "https://example.com/harbour", c1: "#713f12", c2: "#ca8a04" },
  { id: "c9", advertiser: "Saltmarsh Coffee", tagline: "Roasted for the night shift", type: "standard", days: 14, start: "2026-11-12", url: "https://example.com/saltmarsh", c1: "#422006", c2: "#ea580c" },
  { id: "c10", advertiser: "Copperline Bikes", tagline: "Built for the long way home", type: "featured", days: 7, start: "2026-11-20", url: "https://example.com/copperline", c1: "#1e293b", c2: "#f97316" },
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
    const date = new Date(y, m - 1, d - days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
