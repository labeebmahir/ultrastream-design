// Home page and activity log helpers. Reads US.APP_SCREENS and US.APP_STATES (app.js), window.COMPONENTS and window.ACTIVITY.
window.HOME = (() => {
  const esc = (s) => US.esc(s);
  const TYPE_LABELS = { prototype: "Prototype", app: "Rebuilt app", components: "Design system", tooling: "Workflow", fix: "Fix" };
  const formatDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const verId = (v) => "v" + v.replace(/\./g, "-");

  // One activity log entry, with what was asked and what was made.
  const logEntryHTML = (e) => {
    const links = (e.links || []).map(([label, href]) => `<a href="${href}">${esc(label)}<i class="icon icon--xs" data-lucide="arrow-up-right"></i></a>`).join("");
    return `<li class="log-entry" id="${verId(e.version)}">
      <div class="log-entry__meta">
        <a class="log-entry__ver" href="activity.html#${verId(e.version)}">v${esc(e.version)}</a>
        <time datetime="${e.date}">${formatDate(e.date)}</time>
        <span class="log-entry__type log-entry__type--${e.type}">${TYPE_LABELS[e.type] || esc(e.type)}</span>
      </div>
      <div class="log-entry__card">
        <h2 class="log-entry__title">${esc(e.title)}</h2>
        <p class="log-entry__asked"><b>Asked</b>${esc(e.asked)}</p>
        <ul class="log-entry__made">${e.made.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
        ${links ? `<div class="log-entry__links">${links}</div>` : ""}
      </div></li>`;
  };

  // Everything the home page search can find: screens and prototypes first, then screen states, components and the log.
  const searchIndex = () => {
    const out = [];
    const screens = US.appScreens();
    for (const s of screens) out.push({ label: s.label, kind: `Screen · ${s.area}`, icon: "smartphone", href: "app/" + US.appStateHref(s, ""), words: `${s.label} ${s.area} ${s.file}` });
    for (const p of window.PROTOTYPES || []) out.push({ label: p.title, kind: "Prototype", icon: "flask-conical", href: p.href, words: `${p.title} ${p.text}` });
    for (const s of screens) {
      for (const [value, label] of s.states.slice(1)) out.push({ label: `${s.label}: ${label}`, kind: "State", icon: "layers", href: "app/" + US.appStateHref(s, value), words: `${s.label} ${label} ${value} ${s.file}` });
    }
    for (const c of window.COMPONENTS || []) out.push({ label: c.name, kind: c.app ? `Component · ${c.app}` : "Component", icon: "component", href: `design-system/components.html#c-${c.id}`, words: `${c.name} ${c.app} ${c.group} ${c.keywords || ""}` });
    for (const e of window.ACTIVITY || []) out.push({ label: e.title, kind: `Activity · v${e.version}`, icon: "history", href: `activity.html#${verId(e.version)}`, words: `${e.title} ${e.asked} ${e.version}` });
    out.push(
      { label: "Design system: colour, type and icons", kind: "Page", icon: "palette", href: "design-system/index.html", words: "design system colour color type font icons palette tokens" },
      { label: "All rebuilt screens", kind: "Page", icon: "layout-grid", href: "app/index.html", words: "app screens rebuilt list" },
    );
    return out;
  };

  return { TYPE_LABELS, formatDate, verId, logEntryHTML, searchIndex };
})();

// Home page wiring. Runs only on the home page.
(() => {
  if (!document.querySelector("[data-home]")) return;
  const esc = US.esc;
  const screens = US.appScreens();
  const log = window.ACTIVITY || [];
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

  // Prototypes
  document.getElementById("prototype-list").innerHTML = (window.PROTOTYPES || []).map((p) => `<li><a class="row" href="${p.href}">
      <span class="row__body"><span class="row__title">${esc(p.title)}</span><span class="row__text">${esc(p.text)}</span></span>
      ${p.status ? `<span class="row__tag">${esc(p.status)}</span>` : ""}
      <i class="icon icon--sm row__arrow" data-lucide="arrow-right"></i>
    </a></li>`).join("");

  // Where to go, with a count each
  const meta = {
    screens: `${plural(screens.length, "screen")}, ${plural(screens.reduce((n, s) => n + s.states.length, 0), "state")}`,
    components: plural((window.COMPONENTS || []).length, "component"),
    activity: log.length ? `Latest v${log[0].version}` : "",
  };
  document.querySelectorAll("[data-meta]").forEach((el) => { el.textContent = meta[el.dataset.meta] || ""; });

  // Latest activity, as one quiet line
  const latest = document.getElementById("latest");
  if (log.length) {
    const e = log[0];
    latest.innerHTML = `<a href="activity.html#${HOME.verId(e.version)}"><span class="home__latest-ver">v${esc(e.version)}</span>${esc(e.title)}<span class="home__latest-date">${HOME.formatDate(e.date)}</span></a>`;
  }

  // Search across screens, states, components, prototypes and the log
  const input = document.getElementById("find");
  const results = document.getElementById("find-results");
  const index = HOME.searchIndex();
  let hits = [];
  let active = -1;
  const close = () => { results.hidden = true; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); };
  const select = (i) => {
    active = i;
    results.querySelectorAll(".find__result").forEach((r, n) => r.setAttribute("aria-selected", n === i));
    if (hits[i]) {
      results.children[i].scrollIntoView({ block: "nearest" });
      input.setAttribute("aria-activedescendant", "find-" + i);
    }
  };
  const render = () => {
    const words = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) { close(); return; }
    hits = index.filter((x) => words.every((w) => x.words.toLowerCase().includes(w))).slice(0, 12);
    results.innerHTML = hits.length
      ? hits.map((h, i) => `<li><a class="find__result" id="find-${i}" role="option" aria-selected="false" href="${h.href}"><i class="icon icon--sm" data-lucide="${h.icon}"></i><span class="find__label">${esc(h.label)}</span><span class="find__kind">${esc(h.kind)}</span></a></li>`).join("")
      : `<li class="find__empty">Nothing found. Try a screen like "wallet" or a component like "AppButton".</li>`;
    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
    active = -1;
  };
  input.addEventListener("input", render);
  input.addEventListener("focus", render);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && hits.length) { e.preventDefault(); select((active + 1) % hits.length); }
    if (e.key === "ArrowUp" && hits.length) { e.preventDefault(); select((active - 1 + hits.length) % hits.length); }
    if (e.key === "Enter" && hits.length && !results.hidden) { e.preventDefault(); location.href = hits[Math.max(0, active)].href; }
    if (e.key === "Escape") { input.value = ""; close(); input.blur(); }
  });
  results.addEventListener("mousemove", (e) => {
    const r = e.target.closest(".find__result");
    if (r) { const i = [...results.querySelectorAll(".find__result")].indexOf(r); if (i !== active) select(i); }
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".find")) close(); });
  addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); }
  });
})();
