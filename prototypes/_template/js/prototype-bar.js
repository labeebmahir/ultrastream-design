// Review bar shown on every page of this prototype. List the prototype's screens in links.
(function () {
  const root = document.currentScript.src.replace(/js\/prototype-bar\.js.*$/, "");
  const here = location.href.split(/[?#]/)[0];
  const links = [
    ["Overview", "index.html"],
    ["First screen", "app/screen.html"],
  ];

  const bar = document.createElement("div");
  bar.className = "proto-bar";
  bar.innerHTML = `
    <span class="proto-bar__label">Prototype</span>
    <nav class="proto-bar__nav" aria-label="Prototype screens">
      ${links.map(([label, path]) => `<a href="${root + path}"${here === root + path ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
    </nav>`;
  document.body.prepend(bar);
})();
