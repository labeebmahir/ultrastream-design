// Review toolbar shown on every prototype page, with a demo clock to move campaigns through their states.
(function () {
  const root = document.currentScript.src.replace(/js\/proto-bar\.js.*$/, "");
  const here = location.href.split(/[?#]/)[0];
  const links = [
    ["Overview", "index.html"],
    ["Enquiry page", "web/advertise.html"],
    ["Create campaign", "admin/campaign-new.html"],
    ["Campaigns", "admin/campaigns.html"],
    ["Discover feed", "app/discover.html"],
  ];

  const bar = document.createElement("div");
  bar.className = "proto-bar";
  bar.innerHTML = `
    <span class="proto-bar__label">Prototype</span>
    <nav class="proto-bar__nav" aria-label="Prototype screens">
      ${links.map(([label, path]) => `<a href="${root + path}"${here === root + path ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
    </nav>
    <div class="proto-bar__time">
      <label for="demo-now">Demo time</label>
      <input id="demo-now" type="datetime-local">
      <button type="button" data-shift="1">+1 day</button>
      <button type="button" data-shift="7">+7 days</button>
      <button type="button" data-reset>Reset</button>
    </div>`;
  document.body.prepend(bar);

  const input = bar.querySelector("#demo-now");
  const sync = () => { input.value = US.nowString(); };
  sync();
  input.addEventListener("change", () => { if (input.value) US.setNow(input.value); });
  bar.addEventListener("click", (e) => {
    const shift = e.target.dataset.shift;
    if (shift) US.shiftNow(Number(shift));
    if ("reset" in e.target.dataset) {
      US.reset();
      US.toast("Demo data and time reset");
    }
  });
  document.addEventListener("us:change", sync);
})();
