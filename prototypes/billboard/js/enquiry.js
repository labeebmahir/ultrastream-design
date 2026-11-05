// The advertise page: package chips, a simple drawing of the Discover feed with the chosen slot in colour, and the
// enquiry form. The chosen package (US.Enquiry.current) stays in step with the form's package field both ways.
(function () {
  const E = (US.Enquiry = {});
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");

  E.ORDER = ["billboard", "billboard-prime", "featured", "standard"];
  E.HOURS = `${pad(US.PRIME_HOURS.start)}:00–${pad(US.PRIME_HOURS.end)}:00`;
  E.name = (key) => US.AD_TYPES[key].name;
  E.keyOf = (value) => E.ORDER.find((k) => E.name(k) === value) || null;

  // One line on where each package sits. Billboard and Billboard Prime Time share the top slot.
  E.LINES = {
    "billboard": "The first thing people see in the Discover feed, outside prime hours.",
    "billboard-prime": "The same top spot, during prime hours,",
    "featured": "Directly below the Billboard, the second thing in the feed. Shown all day.",
    "standard": `Between videos and shorts, repeating about every ${US.STANDARD_EVERY} items as people scroll.`,
  };

  E.lineHTML = (key) => {
    if (!key) return "Choose a package to see where it appears.";
    const hours = key === "billboard-prime" ? ` <span class="nowrap">${E.HOURS}.</span> <span class="tag tag--placeholder">Placeholder hours</span>` : "";
    return US.esc(E.LINES[key]) + hours;
  };

  // The drawing: grey blocks for the top bar, chips and content, and an outlined tab bar. The feed is in the app's
  // order: Billboard or Billboard Prime Time at the top, the Featured Banner directly below, then content, with a
  // Standard Banner after about every 15 items. Only the chosen slot is in colour (set with E.light).
  E.phone = () => {
    const label = (key, sub) => `<span class="sp__label" data-for="${key}"><b>${US.esc(E.name(key))}</b><span>${sub}</span></span>`;
    const item = '<div class="sp__item"><i class="sp__thumb"></i><i class="sp__lines"><i></i><i></i></i></div>';
    const gap = `<div class="sp__gap"><span>about ${US.STANDARD_EVERY} items</span></div>`;
    return `<div class="sp" data-on="" aria-hidden="true">
      <div class="sp__screen">
        <div class="sp__top"><i class="sp__logo"></i><i class="sp__dot"></i><i class="sp__dot"></i></div>
        <div class="sp__chips"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="sp__feed">
          <div class="sp__slot sp__slot--top" data-slot="top">
            ${label("billboard", "Top of the feed")}
            ${label("billboard-prime", '<span class="sp__tag"><i class="icon" data-lucide="clock"></i>Prime hours</span>')}
          </div>
          <div class="sp__slot sp__slot--featured" data-slot="featured">${label("featured", "Below the Billboard")}</div>
          ${item}
          ${gap}
          <div class="sp__slot sp__slot--standard" data-slot="standard">${label("standard", `Every ~${US.STANDARD_EVERY} items`)}</div>
          ${gap}
          <div class="sp__slot sp__slot--standard sp__slot--again" data-slot="standard">
            <span class="sp__label" data-for="standard"><span class="sp__again"><i class="icon" data-lucide="repeat"></i>Repeats</span></span>
          </div>
          ${item}
        </div>
        <div class="sp__tabs"><i></i><i></i><i></i><i></i><i></i></div>
      </div>
    </div>`;
  };

  // Choosing a package. Unless the form made the choice, it also sets the form's package field.
  E.current = null;
  E.select = (key, options = {}) => {
    E.current = key;
    if (!options.fromForm && $("type")) {
      $("type").value = key ? E.name(key) : "";
      // Lets the form clear its package error after a failed send.
      $("type").dispatchEvent(new Event("input", { bubbles: true }));
    }
    $("feed-sketch").firstElementChild.dataset.on = key || "";
    document.querySelectorAll("#chips [data-pkg]").forEach((chip) => chip.setAttribute("aria-pressed", String(chip.dataset.pkg === key)));
    $("caption").innerHTML = E.lineHTML(key);
  };

  // The enquiry form. Nothing is sent or saved.
  function setupForm() {
    const form = $("form");
    const val = (id) => $(id).value.trim();
    const mark = (id, bad) => { $(id).classList.toggle("field--invalid", bad); return bad; };
    const now = new Date();
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    let attempted = false;
    $("from").min = today;
    $("to").min = today;
    $("from").addEventListener("change", (e) => { $("to").min = e.target.value || today; });

    function validate() {
      const errors = [
        mark("f-company", !val("company")),
        mark("f-contact", !val("contact")),
        mark("f-email", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val("email"))),
        mark("f-phone", val("phone").replace(/\D/g, "").length < 6),
        mark("f-type", !val("type")),
        mark("f-dates", !val("from") || val("from") < today || (val("to") && val("to") < val("from"))),
      ];
      return !errors.some(Boolean);
    }

    form.addEventListener("input", () => { if (attempted) validate(); });
    $("type").addEventListener("change", (e) => E.select(E.keyOf(e.target.value), { fromForm: true }));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      attempted = true;
      if (!validate()) {
        form.querySelector(".field--invalid").querySelector("input, select").focus();
        return;
      }
      $("panel").innerHTML = `<div class="success" role="status"><i class="icon success__icon" data-lucide="circle-check"></i><h2>Thanks, we've got your enquiry</h2><p>Our sales team will reply to ${US.esc(val("email"))} about advertising for ${US.esc(val("company"))}.</p><button class="btn" type="button" onclick="location.reload()">Send another enquiry</button></div>`;
    });
  }

  $("feed-sketch").innerHTML = E.phone();
  document.querySelectorAll("#chips [data-pkg]").forEach((chip) => chip.addEventListener("click", () => E.select(chip.dataset.pkg)));
  setupForm();
  // Opens on Billboard, so the drawing always shows a slot.
  E.select("billboard");
})();
