// Create campaign: slot, dates and a daily window in UTC, priced by the minute, with the slot's availability.
// One advertiser per slot at a time, so a window that shares a minute with another booking can't be saved.
(function () {
  const $ = (id) => document.getElementById(id);
  let creative = null;
  let useSample = false;
  let attempted = false;

  $("pay-roles").innerHTML = US.PAYMENT_ROLES.map((r) => `<option value="${r}"></option>`).join("");
  $("pay-method").insertAdjacentHTML("beforeend", US.PAYMENT_METHODS.map((m) => `<option>${m}</option>`).join(""));

  $("types").innerHTML = Object.entries(US.AD_TYPES).map(([key, t], i) => `
    <label class="option">
      <input type="radio" name="type" value="${key}" ${i === 0 ? "checked" : ""}>
      <span class="option__name">${t.name}</span>
      <span class="option__sub">${t.where}</span>
      <span class="option__rate">${US.fmtRate(key)}</span>
    </label>`).join("");

  // 15-minute steps. A window can end at 24:00.
  const times = (first, last) => {
    const list = [];
    for (let m = first; m <= last; m += US.STEP) list.push(US.hhmm(m));
    return list.map((t) => `<option>${t}</option>`).join("");
  };
  $("win-from").innerHTML = times(0, 1440 - US.STEP);
  $("win-to").innerHTML = times(US.STEP, 1440);
  $("win-from").value = "10:00";
  $("win-to").value = "12:00";

  function value(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value;
  }

  function draft() {
    return {
      advertiser: $("advertiser").value.trim() || "Advertiser name",
      tagline: "Sample creative",
      type: value("type"),
      start: $("start").value,
      end: $("end").value,
      from: $("win-from").value,
      to: $("win-to").value,
      url: $("url").value.trim(),
      creative,
      c1: "#3a0ca3",
      c2: "#ff5c00",
      payment: { by: $("pay-by").value.trim(), date: $("pay-date").value, method: $("pay-method").value, ref: $("pay-ref").value.trim() },
    };
  }

  const tomorrow = () => US.toYmd(US.addDays(US.now(), 1));
  const datesOk = (c) => c.start && c.end && c.start >= tomorrow() && c.end >= c.start;
  const shortDates = (c) => `${US.fmtDate(US.toDate(c.start))} – ${US.fmtDate(US.lastDay(c))}`;

  // What's wrong with the window, if anything: { text, fix } where fix is a button that puts it right.
  function windowProblem(c) {
    const from = US.mins(c.from);
    const to = US.mins(c.to);
    if (to <= from) return { text: "The window has to end after it starts. The shortest window is 15 minutes." };
    const P = US.PRIME;
    const prime = US.primeLabel();
    const inPrime = Math.max(0, Math.min(to, P.end) - Math.max(from, P.start));
    const length = to - from;
    if (c.type === "billboard" && inPrime) {
      if (inPrime === length) {
        return { text: `This window is in prime time (${prime}). Billboard runs outside prime time, so book it as Billboard Prime Time.`, fix: { label: "Switch to Billboard Prime Time", type: "billboard-prime" } };
      }
      const parts = [[from, Math.min(to, P.start)], [Math.max(from, P.end), to]].filter(([a, b]) => b > a);
      const [a, b] = parts.sort((x, y) => (y[1] - y[0]) - (x[1] - x[0]))[0];
      return { text: `This window runs into prime time (${prime}), which has its own rate. A Billboard window has to end by ${US.hhmm(P.start)} or start from ${US.hhmm(P.end)} UTC. Book the prime time part as a separate Billboard Prime Time campaign.`, fix: { label: `Use ${US.hhmm(a)}–${US.hhmm(b)} UTC`, from: US.hhmm(a), to: US.hhmm(b) } };
    }
    if (c.type === "billboard-prime" && inPrime < length) {
      if (!inPrime) {
        return { text: `This window is outside prime time (${prime}). Billboard Prime Time only runs in prime time, so book it as Billboard.`, fix: { label: "Switch to Billboard", type: "billboard" } };
      }
      const a = Math.max(from, P.start);
      const b = Math.min(to, P.end);
      return { text: `Billboard Prime Time only runs in prime time (${prime}). Part of this window is outside it. Book that part as a separate Billboard campaign.`, fix: { label: `Use ${US.hhmm(a)}–${US.hhmm(b)} UTC`, from: US.hhmm(a), to: US.hhmm(b) } };
    }
    if (!datesOk(c)) return null;
    const clash = US.clashes(c);
    if (!clash.length) return null;
    const who = clash.map((o) => `${o.advertiser} has ${o.from}–${o.to} UTC from ${US.fmtDate(US.toDate(o.start))} to ${US.fmtDate(US.lastDay(o))}`).join(". ");
    const free = US.nearestFree(c);
    return {
      clash: true,
      text: `This window is already booked. ${who}. Each slot has one advertiser at a time.${free ? ` The nearest free ${US.fmtNum(length)}-minute window on these dates is ${free.from}–${free.to} UTC.` : " There's no free window of this length on these dates. Try other dates or a shorter window."}`,
      fix: free && { label: `Use ${free.from}–${free.to} UTC`, from: free.from, to: free.to },
    };
  }

  function renderWindow(c, problem) {
    $("f-window").classList.toggle("field--invalid", !!problem);
    $("window-error").hidden = !problem;
    $("window-error").innerHTML = problem
      ? `<span>${US.esc(problem.text)}</span>${problem.fix ? `<button class="btn btn--sm" type="button" id="window-fix">${US.esc(problem.fix.label)}</button>` : ""}`
      : "";
    if (problem?.fix) {
      $("window-fix").addEventListener("click", () => {
        const fix = problem.fix;
        if (fix.type) document.querySelector(`input[name="type"][value="${fix.type}"]`).checked = true;
        if (fix.from) {
          $("win-from").value = fix.from;
          $("win-to").value = fix.to;
        }
        render();
        $("win-from").focus();
      });
    }
    const from = US.mins(c.from);
    const to = US.mins(c.to);
    const local = to > from ? US.localWindow(from, to, c.start ? US.toDate(c.start) : US.now()) : "";
    $("window-hint").textContent = to > from ? `${US.fmtNum(to - from)} minutes a day${local ? `. ${c.from}–${c.to} UTC is ${local}` : ""}.` : "";
  }

  function renderAvailability(c, problem) {
    const t = US.AD_TYPES[c.type];
    const has = datesOk(c);
    const bookings = has ? US.bookingsFor(c.type, c.start, c.end) : [];
    $("avail-title").textContent = `${t.group === "top" ? "Top of the feed" : t.name} availability`;
    $("avail-sub").textContent = has ? `${shortDates(c)}, 00:00–24:00 UTC` : "Choose dates to see what's already booked.";
    const label = `${t.name} on these dates. ${bookings.length ? bookings.map((o) => `${o.advertiser} booked ${o.from}–${o.to} UTC`).join(", ") : "Nothing booked"}. Your window ${c.from}–${c.to} UTC${problem?.clash ? " clashes" : ""}.`;
    $("timeline").innerHTML = US.timelineHTML(c, bookings, { label, bad: !!problem });
    const closed = c.type === "billboard" ? "Billboard Prime Time only" : c.type === "billboard-prime" ? "Billboard only" : "";
    $("legend").innerHTML = [
      `<li><i class="tl-key tl-key--booked"></i>Booked</li>`,
      `<li><i class="tl-key tl-key--mine${problem ? " is-bad" : ""}"></i>This campaign</li>`,
      `<li><i class="tl-key tl-key--prime"></i>Prime time, ${US.primeLabel()}</li>`,
      closed ? `<li><i class="tl-key tl-key--closed"></i>${closed}</li>` : "",
    ].join("");
    $("avail-list").textContent = !has ? ""
      : bookings.length
        ? `Booked on these dates: ${bookings.map((o) => `${o.advertiser} ${o.from}–${o.to} UTC (${US.fmtDate(US.toDate(o.start))} – ${US.fmtDate(US.lastDay(o))})`).join("; ")}.`
        : "Nothing else is booked in this slot on these dates.";
  }

  function render() {
    const c = draft();
    const t = US.AD_TYPES[c.type];
    $("spec").textContent = `${t.name}: ${t.spec} (placeholder spec). Image only in this prototype.`;

    const skeleton = '<div class="preview-skeleton"></div>';
    const ad = US.adHTML(c, { preview: true });
    const placed = {
      billboard: ad + skeleton,
      featured: skeleton + ad + skeleton,
      standard: skeleton + ad + skeleton,
    }[t.format];
    const slot = `<div class="preview-slot preview-slot--${t.format}">Your creative goes here</div>`;
    $("preview").innerHTML = creative || useSample ? placed : placed.replace(ad, slot);

    const problem = windowProblem(c);
    renderWindow(c, problem);
    renderAvailability(c, problem);

    const perDay = US.mins(c.to) - US.mins(c.from);
    const has = datesOk(c) && perDay > 0;
    const rows = [
      ["Slot", `${US.esc(t.name)}<span class="cell-sub">${US.esc(t.where)}</span>`],
      ["Rate", `${US.fmtRate(c.type)}<span class="cell-sub">Placeholder rate</span>`],
      ["Daily window", perDay > 0 ? `${c.from}–${c.to} UTC<span class="cell-sub">${US.fmtNum(perDay)} min a day</span>` : "–"],
      ["Dates", has ? `${shortDates(c)}<span class="cell-sub">${US.days(c)} day${US.days(c) === 1 ? "" : "s"}</span>` : "Choose dates"],
      ["Airtime", has ? US.fmtMins(US.airtimeBooked(c)) : "–"],
      ["Cost", has && !problem ? `<span id="cost">${US.fmtMoney(US.cost(c))}</span><span class="cell-sub">${US.costLine(c)}</span>` : has ? '<span class="cell-sub">Choose a window this slot can use</span>' : "–"],
    ];
    $("summary").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");

    $("start").min = tomorrow();
    $("end").min = c.start || tomorrow();
    $("pay-date").max = US.toYmd(US.now());
    if (attempted) validate();
  }

  function setInvalid(id, invalid) {
    $(id).classList.toggle("field--invalid", invalid);
    return invalid;
  }

  function validate() {
    const c = draft();
    const urlOk = /^https:\/\/[^\s.]+\.[^\s]+$/.test(c.url);
    const errors = [
      setInvalid("f-advertiser", !$("advertiser").value.trim()),
      setInvalid("f-dates", !datesOk(c)),
      setInvalid("f-window", !!windowProblem(c)),
      setInvalid("f-creative", !creative && !useSample),
      setInvalid("f-url", !urlOk),
      setInvalid("f-pay-by", !c.payment.by),
      setInvalid("f-pay-date", !c.payment.date || c.payment.date > US.toYmd(US.now())),
      setInvalid("f-pay-method", !c.payment.method),
      setInvalid("f-pay-ref", !c.payment.ref),
    ];
    return !errors.some(Boolean);
  }

  // Downscale so uploads fit in browser storage.
  function readImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1200 / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(img.src);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  $("file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      creative = await readImage(file);
      useSample = false;
      $("file-name").textContent = file.name;
      setInvalid("f-creative", false);
      render();
    } catch (err) {
      creative = null;
      $("file-name").textContent = "That file couldn't be read. Try a JPG or PNG.";
    }
  });

  function chooseSample() {
    creative = null;
    useSample = true;
    $("file").value = "";
    $("file-name").textContent = "Sample creative";
    setInvalid("f-creative", false);
    render();
  }
  $("sample").addEventListener("click", chooseSample);

  // People often paste links without the https:// part.
  $("url").addEventListener("blur", () => {
    const value = $("url").value.trim();
    if (value && !/^[a-z]+:\/\//i.test(value)) {
      $("url").value = "https://" + value;
      render();
    }
  });

  $("types").addEventListener("change", render);
  ["advertiser", "start", "end", "url", "pay-by", "pay-date", "pay-ref"].forEach((id) => $(id).addEventListener("input", render));
  ["pay-method", "win-from", "win-to"].forEach((id) => $(id).addEventListener("change", render));
  document.addEventListener("us:change", render);

  $("form").addEventListener("submit", (e) => {
    e.preventDefault();
    attempted = true;
    if (!validate()) {
      const first = document.querySelector(".field--invalid");
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      first?.querySelector("input:not([hidden]), select, button")?.focus({ preventScroll: true });
      return;
    }
    // Scheduled straight away: the list opens with the new campaign highlighted.
    const saved = US.addCampaign(draft());
    if (!saved) {
      US.toast("Browser storage is full. Use a smaller image or press Reset.");
      return;
    }
    location.href = `campaigns.html?new=${saved.id}`;
  });

  // Review states: ?state=overlap books a window that's taken, ?state=prime a Billboard window that runs into prime time.
  const state = new URLSearchParams(location.search).get("state");
  const preset = {
    overlap: { type: "featured", from: "10:00", to: "12:00", days: 7 },
    prime: { type: "billboard", from: "11:00", to: "15:00", days: 7 },
  }[state];
  if (preset) {
    $("advertiser").value = "Sample brand";
    document.querySelector(`input[name="type"][value="${preset.type}"]`).checked = true;
    $("start").value = tomorrow();
    $("end").value = US.toYmd(US.addDays(US.toDate(tomorrow()), preset.days - 1));
    $("win-from").value = preset.from;
    $("win-to").value = preset.to;
    $("url").value = "https://example.com/sample";
    chooseSample();
  }

  render();
})();
