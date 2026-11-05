// Site header for the repo's own pages and the screen viewer: the logo, App, Components and Activity, and the version.
// Put <header data-site-header data-root="../" data-current="app"></header> on a page, then load this script.
// data-root is the path from the page to the repo's root, empty at the root. data-current is app, components or
// activity, and marks that link. The version shows only when assets/js/activity-log.js is loaded first.
window.US = window.US || {};

US.SITE_LINKS = [
  ["app", "App", "app/index.html"],
  ["components", "Components", "design-system/components.html"],
  ["activity", "Activity", "activity.html"],
];

US.renderSiteHeader = (el) => {
  const root = el.dataset.root || "";
  const current = el.dataset.current || "";
  const version = window.ACTIVITY && window.ACTIVITY[0] && window.ACTIVITY[0].version;
  el.classList.add("site-header");
  el.innerHTML = `<div class="site-header__inner">
      <a class="site-header__logo" href="${root}index.html" aria-label="UltraStream design, home">
        <img src="${root}assets/img/logo-icon.png" alt="" width="24" height="20">
        <span class="site-header__word">UltraStream <span>design</span></span>
      </a>
      <nav class="site-header__nav" aria-label="Site">${US.SITE_LINKS.map(([key, label, href]) =>
        `<a href="${root}${href}"${key === current ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav>
      ${version ? `<a class="site-header__ver" href="${root}activity.html" title="Latest version">v${US.esc ? US.esc(version) : version}</a>` : ""}
    </div>`;
};

document.querySelectorAll("[data-site-header]").forEach(US.renderSiteHeader);
