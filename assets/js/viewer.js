// Screen viewer around every rebuilt screen in app/. Review tooling, not part of the app.
// At 1024 wide and up: the site header, every screen by area on the left, and on the right the screen's name, its
// states and previous and next. Narrower: a compact bar with back to the list, a screen picker and a state picker.
// app.js loads this only for top-level pages in app/. It reads US.APP_SCREENS and US.APP_STATES, and adds its parts
// around the screen without touching it. Its class names start with vw- so they never clash with the app's.
(() => {
  const esc = US.esc;
  const icon = (name) => `<i class="icon icon--sm" data-lucide="${name}"></i>`;
  const screens = US.appScreens();
  const index = screens.findIndex((s) => s.file === US.viewerFile);
  const screen = screens[index] || { area: "Rebuilt app", file: US.viewerFile, label: document.title.split(" – ")[0], start: "", states: [["", "Default"]] };
  const current = US.appStateIndex(screen, location.search);
  const prev = index > 0 ? screens[index - 1] : null;
  const next = index >= 0 && index < screens.length - 1 ? screens[index + 1] : null;
  // Screen links start with ./ so they never match a test or script looking for the app's own links.
  const link = (s) => "./" + US.appStateHref(s, "");
  const stateLink = (value) => "./" + US.appStateHref(screen, value, location.search);
  const areas = US.APP_SCREENS.map(([area]) => [area, screens.filter((s) => s.area === area)]);

  // Desktop: the shared site header
  const header = document.createElement("header");
  header.className = "vw-header";
  header.dataset.root = "../";
  header.dataset.current = "app";
  US.renderSiteHeader(header);

  // Tablet and phone: back, screen picker, state picker
  const bar = document.createElement("div");
  bar.className = "vw-bar";
  bar.innerHTML = `<a class="vw-bar__back" href="index.html" aria-label="All screens">${icon("arrow-left")}<span>All screens</span></a>
    <select class="vw-select vw-select--screen" aria-label="Screen">${areas.map(([area, list]) => `<optgroup label="${esc(area)}">${list.map((s) =>
      `<option value="${esc(link(s))}"${s.file === screen.file ? " selected" : ""}>${esc(s.label)}</option>`).join("")}</optgroup>`).join("")}</select>
    ${screen.states.length > 1 ? `<select class="vw-select vw-select--state" aria-label="State">${current < 0 ? '<option value="" selected disabled>Other</option>' : ""}${screen.states.map(([value, label], i) =>
      `<option value="${esc(stateLink(value))}"${i === current ? " selected" : ""}>${esc(label)}</option>`).join("")}</select>` : ""}`;
  bar.querySelectorAll("select").forEach((s) => s.addEventListener("change", () => { if (s.value) location.href = s.value; }));

  // Desktop: every screen, by area
  const rail = document.createElement("nav");
  rail.className = "vw-rail";
  rail.setAttribute("aria-label", "Screens");
  rail.innerHTML = `<a class="vw-rail__all" href="index.html">${icon("layout-grid")}All screens</a>
    ${areas.map(([area, list]) => `<div class="vw-rail__group"><p class="vw-rail__area">${esc(area)}</p>${list.map((s) =>
      `<a class="vw-rail__link" href="${esc(link(s))}"${s.file === screen.file ? ' aria-current="page"' : ""}>${esc(s.label)}</a>`).join("")}</div>`).join("")}`;

  // Desktop: this screen, its states, previous and next
  const step = (s, dir) => s
    ? `<a class="vw-step vw-step--${dir}" href="${esc(link(s))}">${dir === "prev" ? icon("arrow-left") : ""}<span><span class="vw-step__dir">${dir === "prev" ? "Previous" : "Next"}</span><span class="vw-step__name">${esc(s.label)}</span></span>${dir === "next" ? icon("arrow-right") : ""}</a>`
    : `<span class="vw-step vw-step--${dir} vw-step--off" aria-hidden="true"></span>`;
  const panel = document.createElement("aside");
  panel.className = "vw-panel";
  panel.setAttribute("aria-label", "This screen");
  panel.innerHTML = `<div class="vw-panel__body">
      <p class="vw-panel__area">${esc(screen.area)}</p>
      <p class="vw-panel__name">${esc(screen.label)}</p>
      <p class="vw-panel__file">${esc(screen.file)}</p>
      <p class="vw-panel__label">States<span>${screen.states.length}</span></p>
      <div class="vw-states">${screen.states.map(([value, label], i) =>
        `<a class="vw-state" href="${esc(stateLink(value))}"${i === current ? ' aria-current="true"' : ""}>${esc(label)}</a>`).join("")}</div>
      <div class="vw-panel__foot">
        <div class="vw-steps">${step(prev, "prev")}${step(next, "next")}</div>
        <p class="vw-panel__hint">The left and right arrow keys move between screens.</p>
      </div>
    </div>`;

  document.body.prepend(header, bar, rail, panel);
  // Keep the current screen in view in the list, without scrolling the page.
  const here = rail.querySelector('[aria-current="page"]');
  if (here && here.offsetTop > rail.clientHeight - 80) rail.scrollTop = here.offsetTop - rail.clientHeight / 2;

  // Left and right arrows go to the previous and next screen, unless someone is typing or the screen used the key.
  addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const t = e.target;
    if (t.closest && t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="slider"], [role="tab"], [role="radio"], [role="menuitem"], [role="option"], [role="listbox"]')) return;
    const to = e.key === "ArrowLeft" ? prev : next;
    if (to) location.href = link(to);
  });
})();
