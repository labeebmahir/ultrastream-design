// The rebuilt app's screen list (app/index.html): a card per screen in US.APP_SCREENS with a small live preview.
// Previews are the real screens in frames, loaded only when they come near the viewport so the page stays fast.
(() => {
  const esc = US.esc;
  const screens = US.appScreens();
  const areas = US.APP_SCREENS.map(([area]) => area);
  const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, "-");
  const stateCount = screens.reduce((n, s) => n + s.states.length, 0);
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  document.getElementById("lede").textContent = `${plural(screens.length, "screen")} and ${plural(stateCount, "state")}, rebuilt from the live app's code.`;

  const sections = document.getElementById("sections");
  sections.innerHTML = areas.map((area) => {
    const list = screens.filter((s) => s.area === area);
    return `<section class="sb__section" data-area="${esc(area)}" aria-labelledby="area-${slug(area)}">
      <h2 class="sb__area" id="area-${slug(area)}">${esc(area)}<span>${list.length}</span></h2>
      <ul class="sb__grid">${list.map((s) => `<li class="sb-card" data-words="${esc(`${s.label} ${s.file} ${area} ${s.states.map(([, l]) => l).join(" ")}`.toLowerCase())}">
        <a class="sb-card__link" href="${esc(US.appStateHref(s, ""))}">
          <span class="sb-card__preview"><iframe data-src="${esc(US.appStateHref(s, ""))}" title="${esc(s.label)} preview" tabindex="-1" aria-hidden="true" loading="lazy"></iframe></span>
          <span class="sb-card__name">${esc(s.label)}</span>
          <span class="sb-card__meta">${plural(s.states.length, "state")}</span>
        </a>
      </li>`).join("")}</ul>
    </section>`;
  }).join("");

  // Scale the 402 by 874 screens to the card width
  const fit = () => {
    const box = sections.querySelector(".sb-card__preview");
    if (box && box.clientWidth) sections.style.setProperty("--sb-scale", box.clientWidth / 402);
  };
  new ResizeObserver(fit).observe(sections);
  fit();

  // Load each preview when it comes near the viewport
  const frames = [...sections.querySelectorAll("iframe[data-src]")];
  const load = (f) => {
    if (f.src) return;
    f.addEventListener("load", () => f.classList.add("is-loaded"), { once: true });
    f.src = f.dataset.src;
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { load(e.target); io.unobserve(e.target); }
    }), { rootMargin: "300px 0px" });
    frames.forEach((f) => io.observe(f));
  } else frames.forEach(load);

  // Area filter and search
  const areasEl = document.getElementById("areas");
  const q = document.getElementById("q");
  const none = document.getElementById("none");
  let area = "All";
  areasEl.innerHTML = ["All", ...areas].map((a) => `<button class="sb__chip" type="button" data-area="${esc(a)}" aria-pressed="${a === area}">${esc(a)}</button>`).join("");
  const apply = () => {
    const words = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    sections.querySelectorAll(".sb__section").forEach((sec) => {
      let inSection = 0;
      sec.querySelectorAll(".sb-card").forEach((card) => {
        const ok = (area === "All" || sec.dataset.area === area) && words.every((w) => card.dataset.words.includes(w));
        card.hidden = !ok;
        if (ok) inSection++;
      });
      sec.hidden = inSection === 0;
      shown += inSection;
    });
    none.hidden = shown > 0;
    fit();
  };
  areasEl.addEventListener("click", (e) => {
    const b = e.target.closest(".sb__chip");
    if (!b) return;
    area = b.dataset.area;
    areasEl.querySelectorAll(".sb__chip").forEach((x) => x.setAttribute("aria-pressed", x === b));
    apply();
  });
  q.addEventListener("input", apply);
  addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); }
    if (e.key === "Escape" && document.activeElement === q) { q.value = ""; apply(); }
  });
})();
