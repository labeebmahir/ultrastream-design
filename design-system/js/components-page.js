// Builds the component library from window.COMPONENTS, which design-system/components/*.js fill in.
// Each component previews in its own frame, loading only the styles it needs, so what you see matches the code you copy.
(() => {
  const GROUPS = ["Actions", "Navigation", "Inputs and forms", "Cards and lists", "Video", "Feedback and states", "Overlays", "Sign-in and onboarding", "Profile and wallet", "Creator studio"];
  const items = (window.COMPONENTS || []).slice().sort((a, b) => {
    const g = GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group);
    return g || (a.order || 0) - (b.order || 0);
  });
  const APP_DIR = new URL("../app/", location.href).href;

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Removes the shared indent from template strings so copied code starts at the left edge.
  const dedent = (s) => {
    const lines = String(s || "").replace(/^\n+|\s+$/g, "").split("\n");
    const pad = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    return lines.map((l) => l.slice(pad)).join("\n");
  };
  const hlHTML = (src) => esc(src)
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="t-c">$1</span>')
    .replace(/(&lt;\/?)([a-z][a-z0-9-]*)([^&]*?)(\/?&gt;)/gi, (m, open, tag, attrs, close) =>
      `${open}<span class="t-tag">${tag}</span>${attrs.replace(/([a-z][a-z0-9-:]*)(=)("[^"]*")/gi, '<span class="t-attr">$1</span>$2<span class="t-str">$3</span>')}${close}`);
  // TSX for the React Native tab: comments, strings, JSX tags, props and keywords in one pass
  const hlTSX = (src) => esc(src).replace(
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('[^'\n]*'|"[^"\n]*"|`[^`]*`)|(?<![\w)])(&lt;\/?)([A-Za-z][\w.]*)|(\s)([a-zA-Z]\w*)(=)(?=[{"'])|\b(import|from|export|const|let|return|function|default|true|false|null|undefined)\b/g,
    (m, com, str, open, tag, sp, attr, eq, kw) => {
      if (com) return `<span class="t-c">${com}</span>`;
      if (str) return `<span class="t-str">${str}</span>`;
      if (open) return `${open}<span class="t-tag">${tag}</span>`;
      if (attr) return `${sp}<span class="t-attr">${attr}</span>${eq}`;
      return `<span class="t-kw">${kw}</span>`;
    });
  const hlJS = (src) => esc(src).replace(/(\/\/[^\n]*)|("[^"\n]*"|'[^'\n]*'|`[^`]*`)/g, (m, c, s) => (c ? `<span class="t-c">${c}</span>` : `<span class="t-str">${s}</span>`));

  const copyText = async (text, btn) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = Object.assign(document.createElement("textarea"), { value: text });
      document.body.append(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    btn.classList.add("is-done");
    btn.querySelector("span").textContent = "Copied";
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.classList.remove("is-done"); btn.querySelector("span").textContent = "Copy"; }, 1600);
  };
  const copyBtn = (label = "Copy") => `<button class="copy" type="button"><i class="icon icon--xs" data-lucide="copy"></i><span>${label}</span></button>`;

  // Page setup block
  const setup = dedent(`
    <link rel="stylesheet" href="../assets/css/base.css">
    <link rel="stylesheet" href="../assets/css/app.css">
    <!-- Add the area's styles when a component lists one, for example: -->
    <link rel="stylesheet" href="css/watch.css">

    <!-- Screens sit in a phone frame -->
    <div class="stage"><div class="phone">
      ...components go here...
    </div></div>

    <!-- At the end of the body. Lucide draws every <i data-lucide> icon -->
    <script src="../assets/vendor/lucide.min.js"></script>
    <script src="../assets/js/app.js"></script>`);
  const setupEl = document.querySelector("[data-setup]");
  setupEl.classList.add("code--setup");
  setupEl.innerHTML = `${copyBtn()}<pre><code>${hlHTML(setup)}</code></pre>`;
  setupEl.querySelector(".copy").addEventListener("click", (e) => copyText(setup, e.currentTarget));

  // The document inside each preview frame. Paths resolve from app/, where screens live.
  const frameDoc = (c) => {
    const css = ["../assets/css/base.css", "../assets/css/app.css", ...(c.css || []).map((p) => (p.startsWith("app/") ? p.slice(4) : "../" + p))];
    const minH = c.height ? `min-height:${c.height}px;overflow:hidden;border:1px solid var(--surface-3);border-radius:28px;` : "";
    return `<!doctype html><html><head><meta charset="utf-8"><base href="${APP_DIR}">
${css.map((h) => `<link rel="stylesheet" href="${h}">`).join("")}
<style>
html,body{background:transparent!important}
body{display:block!important;height:auto!important;margin:0;padding:24px 16px}
.cd-phone{position:relative;display:flex;flex-direction:column;gap:16px;width:100%;max-width:402px;height:auto!important;min-height:0;margin:0 auto;border:0;border-radius:0;overflow:visible;background:var(--black);${minH}}
.cd-phone>*{flex-shrink:0}
${c.frameCSS || ""}
</style></head><body><div class="phone cd-phone">${dedent(c.html)}</div>
<script src="../assets/vendor/lucide.min.js"><\/script><script src="../assets/js/app.js"><\/script>
<script>
document.addEventListener("click",function(e){var a=e.target.closest("a[href]");if(a)e.preventDefault();},true);
document.addEventListener("submit",function(e){e.preventDefault();},true);
${c.js ? dedent(c.js) : ""}
(function(){var send=function(){parent.postMessage({cdFrame:${JSON.stringify(c.id)},h:Math.ceil(document.documentElement.getBoundingClientRect().height)},"*");};
new ResizeObserver(send).observe(document.documentElement);addEventListener("load",send);setTimeout(send,300);})();
<\/script></body></html>`;
  };

  // Sections
  const list = document.getElementById("list");
  let html = "";
  for (const group of GROUPS) {
    const inGroup = items.filter((c) => c.group === group);
    if (!inGroup.length) continue;
    html += `<h2 class="cl-group-title" data-group-title="${esc(group)}">${esc(group)}</h2>`;
    for (const c of inGroup) {
      const screens = (c.screens || []).map((s) => `<a href="../app/${s}">${esc(s.replace(".html", ""))}</a>`).join(", ");
      const styles = ["assets/css/app.css", ...(c.css || [])].map((s) => `<code>${esc(s)}</code>`).join(", ");
      html += `<section class="comp" id="c-${c.id}" data-group="${esc(c.group)}" data-search="${esc([c.name, c.app, c.group, c.text, c.keywords].join(" ").toLowerCase())}">
        <div class="comp__head">
          <h3 class="comp__name">${esc(c.name)}</h3>
          ${c.app ? `<span class="comp__app" title="Name in the app's code">${esc(c.app)}</span>` : ""}
          <a class="comp__anchor" href="#c-${c.id}" aria-label="Link to ${esc(c.name)}"><i class="icon icon--sm" data-lucide="link"></i></a>
        </div>
        <p class="comp__text">${c.text}</p>
        <div class="comp__card">
          <div class="comp__preview"><iframe class="comp__frame" title="${esc(c.name)} preview" loading="lazy" data-frame="${c.id}"></iframe></div>
          <div class="comp__bar" role="tablist">
            ${c.rn ? `<button class="comp__tab" type="button" role="tab" aria-selected="false" data-tab="rn">React Native</button>` : ""}
            <button class="comp__tab" type="button" role="tab" aria-selected="false" data-tab="html">HTML</button>
            ${c.js ? `<button class="comp__tab" type="button" role="tab" aria-selected="false" data-tab="js">JS</button>` : ""}
            ${copyBtn()}
          </div>
          ${c.rn ? `<div class="code" data-code="rn" hidden><p class="code__note">${c.rnKind === "pattern"
            ? `<i class="icon icon--xs" data-lucide="hammer"></i>The app builds this inside ${esc(c.rnWhere || "the screen")}. There's no shared component for it yet, so this is written from React Native parts and the theme.`
            : `<i class="icon icon--xs" data-lucide="package"></i>Uses ${(c.rnUses || [c.app]).filter(Boolean).map((n) => `<code>${esc(n)}</code>`).join(", ")} from the app. Paste it into a screen.`}</p><pre><code>${hlTSX(dedent(c.rn))}</code></pre></div>` : ""}
          <div class="code" data-code="html" hidden><pre><code>${hlHTML(dedent(c.html))}</code></pre></div>
          ${c.js ? `<div class="code" data-code="js" hidden><pre><code>${hlJS(dedent(c.js))}</code></pre></div>` : ""}
        </div>
        <p class="comp__meta">HTML styles: ${styles}${screens ? `<br>Used on: ${screens}` : ""}${c.note ? `<br>${c.note}` : ""}</p>
      </section>`;
    }
  }
  list.innerHTML = html;

  // Frames, wired after insertion so srcdoc loads with the right base address
  const byId = Object.fromEntries(items.map((c) => [c.id, c]));
  list.querySelectorAll("[data-frame]").forEach((f) => { f.srcdoc = frameDoc(byId[f.dataset.frame]); });
  addEventListener("message", (e) => {
    const d = e.data;
    if (!d || !d.cdFrame) return;
    const f = list.querySelector(`[data-frame="${CSS.escape(d.cdFrame)}"]`);
    if (f && d.h) f.style.height = d.h + "px";
  });

  // Tabs and copy
  list.addEventListener("click", (e) => {
    const tab = e.target.closest(".comp__tab");
    const copy = e.target.closest(".copy");
    const sec = e.target.closest(".comp");
    if (!sec) return;
    // Picking React Native or HTML switches every component, and is remembered
    if (tab) {
      if (tab.dataset.tab === "js") showTab(sec, "js");
      else setLang(tab.dataset.tab);
    }
    if (copy) {
      const c = byId[sec.id.slice(2)];
      const which = sec.querySelector('.comp__tab[aria-selected="true"]').dataset.tab;
      copyText(dedent(c[which]), copy);
    }
  });
  function showTab(sec, name) {
    if (!sec.querySelector(`[data-code="${name}"]`)) name = "html";
    sec.querySelectorAll(".comp__tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.tab === name));
    sec.querySelectorAll("[data-code]").forEach((b) => { b.hidden = b.dataset.code !== name; });
  }
  function setLang(lang) {
    try { localStorage.setItem("us-code-lang", lang); } catch {}
    list.querySelectorAll(".comp").forEach((sec) => showTab(sec, lang));
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === lang));
  }
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  let saved = "rn";
  try { saved = localStorage.getItem("us-code-lang") || "rn"; } catch {}
  setLang(saved === "html" ? "html" : "rn");

  // Sidebar
  const nav = document.getElementById("side-nav");
  nav.innerHTML = GROUPS.filter((g) => items.some((c) => c.group === g)).map((g) =>
    `<h2>${esc(g)}</h2>${items.filter((c) => c.group === g).map((c) => `<a class="cl-side__link" href="#c-${c.id}" data-link="${c.id}">${esc(c.name)}</a>`).join("")}`).join("");

  // Filters
  const search = document.getElementById("search");
  const groupsEl = document.getElementById("groups");
  const count = document.getElementById("count");
  const none = document.getElementById("none");
  let group = "All";
  groupsEl.innerHTML = ["All", ...GROUPS.filter((g) => items.some((c) => c.group === g))]
    .map((g) => `<button class="cl-group" type="button" aria-pressed="${g === "All"}" data-g="${esc(g)}">${esc(g)}</button>`).join("");
  const apply = () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    list.querySelectorAll(".comp").forEach((s) => {
      const ok = (group === "All" || s.dataset.group === group) && (!q || q.split(/\s+/).every((w) => s.dataset.search.includes(w)));
      s.hidden = !ok;
      nav.querySelector(`[data-link="${s.id.slice(2)}"]`).hidden = !ok;
      if (ok) shown++;
    });
    list.querySelectorAll("[data-group-title]").forEach((t) => { t.hidden = !list.querySelector(`.comp[data-group="${CSS.escape(t.dataset.groupTitle)}"]:not([hidden])`); });
    count.textContent = shown === items.length ? `${items.length} components` : `${shown} of ${items.length} components`;
    none.hidden = shown > 0;
  };
  search.addEventListener("input", apply);
  groupsEl.addEventListener("click", (e) => {
    const b = e.target.closest(".cl-group");
    if (!b) return;
    group = b.dataset.g;
    groupsEl.querySelectorAll(".cl-group").forEach((x) => x.setAttribute("aria-pressed", x === b));
    apply();
  });
  addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); search.focus(); }
    if (e.key === "Escape" && document.activeElement === search) { search.value = ""; apply(); }
  });
  apply();

  // Highlight the section in view
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      nav.querySelectorAll(".is-current").forEach((a) => a.classList.remove("is-current"));
      const a = nav.querySelector(`[data-link="${en.target.id.slice(2)}"]`);
      if (!a) continue;
      a.classList.add("is-current");
      // Scroll only the sidebar, never the page
      const side = nav.closest(".cl-side");
      if (a.offsetTop < side.scrollTop + 40 || a.offsetTop > side.scrollTop + side.clientHeight - 40) side.scrollTop = a.offsetTop - side.clientHeight / 2;
    }
  }, { rootMargin: "0px 0px -65% 0px" });
  list.querySelectorAll(".comp").forEach((s) => io.observe(s));
})();
