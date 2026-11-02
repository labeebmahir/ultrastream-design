// Placeholder data. Replace PACKAGES when the package document is added to the brief.
window.US = window.US || {};

US.AD_TYPES = {
  "prime-normal": { name: "Prime Billboard – Normal Time", where: "Top of the Discover feed", format: "billboard", spec: "1200 × 675 px", dailyImpressions: 42000, ctr: 0.019 },
  "prime-time": { name: "Prime Billboard – Prime Time", where: "Top of the Discover feed, during prime-time hours", format: "billboard", spec: "1200 × 675 px", dailyImpressions: 31000, ctr: 0.024 },
  "prime-banner": { name: "Prime Banner", where: "After the Prime Billboard", format: "prime-banner", spec: "1200 × 400 px", dailyImpressions: 28000, ctr: 0.012 },
  "standard": { name: "Standard Banner", where: "About every 15 posts, repeating as the viewer scrolls", format: "standard", spec: "1200 × 300 px", dailyImpressions: 16000, ctr: 0.008 },
};

US.DURATIONS = [7, 14, 30];

US.PRICES = {
  "prime-normal": { 7: 1500, 14: 2700, 30: 5000 },
  "prime-time": { 7: 2500, 14: 4500, 30: 8500 },
  "prime-banner": { 7: 900, 14: 1600, 30: 3000 },
  "standard": { 7: 400, 14: 700, 30: 1300 },
};

US.PRIME_HOURS = { start: 18, end: 22 };
US.STANDARD_EVERY = 15;
US.DEFAULT_NOW = "2026-11-03T19:00";

// Fictional advertisers. c1/c2 are the gradient colours for the sample creative.
US.SEED_CAMPAIGNS = [
  { id: "c1", advertiser: "Kestrel Audio", tagline: "Hear every frame", type: "prime-time", days: 14, start: "2026-10-28", url: "https://example.com/kestrel", c1: "#1d3557", c2: "#e63946" },
  { id: "c2", advertiser: "Volt & Ember", tagline: "Energy for late nights", type: "prime-normal", days: 7, start: "2026-10-30", url: "https://example.com/volt", c1: "#3a0ca3", c2: "#f72585" },
  { id: "c3", advertiser: "Tallow & Thread", tagline: "Made to outlast the season", type: "prime-banner", days: 14, start: "2026-10-26", url: "https://example.com/tallow", c1: "#264653", c2: "#2a9d8f" },
  { id: "c4", advertiser: "Orbit Gear", tagline: "Kit for creators on the move", type: "standard", days: 30, start: "2026-10-20", url: "https://example.com/orbit", c1: "#3d348b", c2: "#7678ed" },
  { id: "c5", advertiser: "Fable Cycles", tagline: "Ride further this summer", type: "prime-normal", days: 14, start: "2026-11-10", url: "https://example.com/fable", c1: "#14532d", c2: "#84cc16" },
  { id: "c6", advertiser: "Marlowe Games", tagline: "The new season starts now", type: "standard", days: 7, start: "2026-11-16", url: "https://example.com/marlowe", c1: "#581c87", c2: "#c026d3" },
  { id: "c7", advertiser: "Juniper Travel", tagline: "Fly somewhere new", type: "prime-banner", days: 14, start: "2026-10-05", url: "https://example.com/juniper", c1: "#0c4a6e", c2: "#0ea5e9" },
  { id: "c8", advertiser: "Harbour Tea", tagline: "Slow down with a better cup", type: "prime-time", days: 7, start: "2026-09-21", url: "https://example.com/harbour", c1: "#713f12", c2: "#ca8a04" },
];
