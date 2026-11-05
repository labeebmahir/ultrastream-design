// Review bar on every page of this prototype: where you are, what's next, and demo tools.
(function () {
  const CONFIG = {
    name: "Billboard",
    feature: "billboard",
    clock: true,
    answersVersion: 4, // matches version in questions.html
    steps: [
      { label: "Enquiry", href: "web/advertise.html" },
      { label: "Create", href: "admin/campaign-new.html" },
      { label: "Discover", href: "app/discover.html", also: ["app/watch.html"] },
      { label: "Campaigns", href: "admin/campaigns.html", also: ["admin/campaign.html"] },
      { label: "Report", href: "admin/report.html?id=c7" },
      { label: "Questions", href: "questions.html", numbered: false, count: 19 },
    ],
  };

  const root = document.currentScript.src.replace(/js\/[^/]*\.js.*$/, "");
  const path = location.href.split(/[?#]/)[0];
  const isHere = (link) => [link.href, ...(link.also || [])].some((p) => path === root + p.split("?")[0]);
  const steps = CONFIG.steps;
  const hereIndex = steps.findIndex(isHere);
  const onOverview = isHere({ href: "index.html" });
  const prev = hereIndex > 0 ? steps[hereIndex - 1] : onOverview ? null : { href: "index.html", label: "Overview" };
  const next = hereIndex >= 0 ? steps[hereIndex + 1] : onOverview ? steps[0] : null;

  function answered() {
    try {
      const data = JSON.parse(localStorage.getItem(`us-answers-${CONFIG.feature}-v${CONFIG.answersVersion || 2}`)) || {};
      return Object.values(data.answers || {}).filter((a) => a.choice || a.note?.trim()).length;
    } catch (e) {
      return 0;
    }
  }

  const stepLink = (step, i) => {
    const number = step.numbered === false ? "" : `<span class="proto-bar__n">${i + 1}</span>`;
    const count = step.count ? ` <span class="proto-bar__count"><span data-answered>${answered()}</span>/${step.count}</span>` : "";
    return `<a href="${root + step.href}"${i === hereIndex ? ' aria-current="page"' : ""}>${number}${step.label}${count}</a>`;
  };
  const arrow = (link, name, label) => link
    ? `<a class="proto-bar__arrow" href="${root + link.href}" aria-label="${label}: ${link.label}" title="${label}: ${link.label}"><i class="icon icon--sm" data-lucide="${name}"></i></a>`
    : `<span class="proto-bar__arrow is-off" aria-hidden="true"><i class="icon icon--sm" data-lucide="${name}"></i></span>`;
  const hasClock = CONFIG.clock && typeof US.now === "function";

  const bar = document.createElement("div");
  bar.className = "proto-bar";
  bar.innerHTML = `
    <a class="proto-bar__home" href="${root}index.html"${onOverview ? ' aria-current="page"' : ""} title="Overview">
      <i class="icon icon--sm" data-lucide="layout-grid"></i><span class="proto-bar__name">${CONFIG.name}</span>
    </a>
    <span class="proto-bar__badge">Prototype</span>
    <nav class="proto-bar__nav" aria-label="Prototype steps">${steps.map(stepLink).join("")}</nav>
    <div class="proto-bar__compact">
      ${arrow(prev, "chevron-left", "Previous")}
      <select class="proto-bar__select" aria-label="Go to step">
        <option value="${root}index.html"${onOverview ? " selected" : ""}>Overview</option>
        ${steps.map((step, i) => `<option value="${root + step.href}"${i === hereIndex ? " selected" : ""}>${step.numbered === false ? "" : i + 1 + ". "}${step.label}</option>`).join("")}
      </select>
      ${arrow(next, "chevron-right", "Next")}
    </div>
    ${hasClock ? `<div class="proto-bar__clock">
      <button class="proto-bar__toggle" type="button" aria-expanded="false" aria-controls="demo-panel" aria-label="Demo time">
        <i class="icon icon--sm" data-lucide="clock"></i><span class="proto-bar__when"></span>
        <i class="icon icon--sm proto-bar__chev" data-lucide="chevron-down"></i>
      </button>
      <div class="proto-bar__time" id="demo-panel" hidden>
        <p class="proto-bar__help"><strong>Demo time</strong> Move the clock to see campaigns go from scheduled to live to ended, and paused days added to the end.</p>
        <label for="demo-now" class="proto-bar__label">Date and time</label>
        <input id="demo-now" type="datetime-local">
        <div class="proto-bar__row">
          <button type="button" data-shift="1">+1 day</button>
          <button type="button" data-shift="7">+7 days</button>
          <button type="button" data-reset>Reset demo</button>
        </div>
      </div>
    </div>` : ""}`;
  document.body.prepend(bar);

  const select = bar.querySelector(".proto-bar__select");
  select.addEventListener("change", () => { location.href = select.value; });

  // Sticky headers and full-height screens need the bar's real height.
  const setHeight = () => document.documentElement.style.setProperty("--bar-h", bar.offsetHeight + "px");
  setHeight();
  new ResizeObserver(setHeight).observe(bar);

  document.addEventListener("us:answers", () => {
    bar.querySelectorAll("[data-answered]").forEach((el) => { el.textContent = answered(); });
  });

  if (!hasClock) return;
  const toggle = bar.querySelector(".proto-bar__toggle");
  const panel = bar.querySelector("#demo-panel");
  const input = bar.querySelector("#demo-now");
  const when = bar.querySelector(".proto-bar__when");
  const sync = () => {
    input.value = US.nowString();
    when.textContent = US.now().toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  };
  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", open);
  };
  sync();
  toggle.addEventListener("click", () => setOpen(panel.hidden));
  input.addEventListener("change", () => { if (input.value) US.setNow(input.value); });
  panel.addEventListener("click", (e) => {
    const shift = e.target.dataset.shift;
    if (shift) US.shiftNow(Number(shift));
    if ("reset" in e.target.dataset) {
      US.reset();
      US.toast("Demo data and time reset");
    }
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".proto-bar__clock")) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener("us:change", sync);
})();
