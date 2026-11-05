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
    </label>`).join("");

  function renderDurations() {
    const type = value("type") || "billboard";
    const current = Number(value("days")) || 7;
    $("durations").innerHTML = US.DURATIONS.map((d) => `
      <label class="option">
        <input type="radio" name="days" value="${d}" ${d === current ? "checked" : ""}>
        <span class="option__name">${d} days</span>
        <span class="option__sub">${US.fmtMoney(US.PRICES[type][d])}</span>
      </label>`).join("");
  }

  function value(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value;
  }

  function draft() {
    return {
      advertiser: $("advertiser").value.trim() || "Advertiser name",
      tagline: "Sample creative",
      type: value("type"),
      days: Number(value("days")),
      start: $("start").value,
      url: $("url").value.trim(),
      creative,
      c1: "#3a0ca3",
      c2: "#ff5c00",
      payment: { by: $("pay-by").value.trim(), date: $("pay-date").value, method: $("pay-method").value, ref: $("pay-ref").value.trim() },
    };
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

    const rows = [["Placement", t.where], ["Package", US.packageName(c)], ["Cost", US.fmtMoney(US.cost(c))]];
    if (c.start) rows.push(["Runs", US.period(c)]);
    $("summary").innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${US.esc(v)}</dd>`).join("");

    const clash = c.start ? overlaps(c) : [];
    $("overlap").hidden = !clash.length;
    $("overlap").textContent = clash.length
      ? `This overlaps with ${clash.map((x) => x.advertiser).join(", ")} in the same slot. They will rotate in this prototype. Whether slots are exclusive isn't decided yet.`
      : "";

    $("start").min = US.toYmd(US.addDays(US.now(), 1));
    $("pay-date").max = US.toYmd(US.now());
    if (attempted) validate();
  }

  function overlaps(c) {
    const start = US.toDate(c.start);
    const end = US.addDays(start, c.days);
    return US.campaigns().filter((o) => o.type === c.type && US.toDate(o.start) < end && US.endDate(o) > start);
  }

  function setInvalid(id, invalid) {
    $(id).classList.toggle("field--invalid", invalid);
    return invalid;
  }

  function validate() {
    const c = draft();
    const tomorrow = US.toYmd(US.addDays(US.now(), 1));
    const urlOk = /^https:\/\/[^\s.]+\.[^\s]+$/.test(c.url);
    const errors = [
      setInvalid("f-advertiser", !$("advertiser").value.trim()),
      setInvalid("f-creative", !creative && !useSample),
      setInvalid("f-url", !urlOk),
      setInvalid("f-start", !c.start || c.start < tomorrow),
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

  $("sample").addEventListener("click", () => {
    creative = null;
    useSample = true;
    $("file").value = "";
    $("file-name").textContent = "Sample creative";
    setInvalid("f-creative", false);
    render();
  });

  // People often paste links without the https:// part.
  $("url").addEventListener("blur", () => {
    const value = $("url").value.trim();
    if (value && !/^[a-z]+:\/\//i.test(value)) {
      $("url").value = "https://" + value;
      render();
    }
  });

  $("types").addEventListener("change", () => { renderDurations(); render(); });
  $("durations").addEventListener("change", render);
  ["advertiser", "start", "url", "pay-by", "pay-date", "pay-ref"].forEach((id) => $(id).addEventListener("input", render));
  $("pay-method").addEventListener("change", render);
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

  renderDurations();
  render();
})();
