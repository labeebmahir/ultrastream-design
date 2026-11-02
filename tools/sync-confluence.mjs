// Download a Confluence space's readable pages and comments into .knowledge/, which Git ignores.
// First time: node tools/sync-confluence.mjs "<link to the space overview page>"
// After that: node tools/sync-confluence.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KNOWLEDGE = join(ROOT, ".knowledge");
const OUT = join(KNOWLEDGE, "confluence");
const CONFIG = join(KNOWLEDGE, "config.json");

function loadConfig() {
  const link = process.argv[2];
  if (link) {
    const url = new URL(link);
    const match = /\/spaces\/([^/]+)/.exec(url.pathname);
    if (!match) throw new Error("That link has no /spaces/<name>/ in it. Use the space's overview page.");
    const config = { base: `${url.origin}/wiki`, space: match[1] };
    mkdirSync(KNOWLEDGE, { recursive: true });
    writeFileSync(CONFIG, JSON.stringify(config, null, 1));
    return config;
  }
  if (existsSync(CONFIG)) return JSON.parse(readFileSync(CONFIG, "utf8"));
  throw new Error('No Confluence link saved yet. Run: node tools/sync-confluence.mjs "<space overview link>"');
}

const { base: BASE, space: SPACE } = loadConfig();

async function getJson(path) {
  const response = await fetch(BASE + path);
  if (!response.ok) throw new Error(`Confluence returned ${response.status} for ${path}`);
  return response.json();
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", mdash: "—", ndash: "–", rarr: "→", larr: "←", hellip: "…", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", middot: "·", times: "×", bull: "•" };

function decode(s) {
  return s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (match, e) => {
    if (e[0] === "#") {
      const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[e] ?? match;
  });
}

function toText(html = "") {
  let s = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<img\b[^>]*>/gi, "[image]");
  s = s.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => `[${text}](${href.startsWith("/") ? BASE + href : href})`);
  s = s.replace(/<h([1-6])\b[^>]*>/gi, (_, n) => `\n\n${"#".repeat(Number(n))} `).replace(/<\/h[1-6]>/gi, "\n");
  s = s.replace(/<li\b[^>]*>/gi, "\n- ");
  s = s.replace(/<t[dh]\b[^>]*>/gi, " | ");
  s = s.replace(/<\/?(p|div|tr|ul|ol|table|br|hr|blockquote|section)\b[^>]*>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  return decode(s).replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

const { key } = await getJson(`/rest/api/space/${encodeURIComponent(SPACE)}`);

const pages = [];
for (let start = 0; ;) {
  const query = new URLSearchParams({ spaceKey: key, type: "page", limit: "50", start: String(start), expand: "version,ancestors,body.view" });
  const data = await getJson(`/rest/api/content?${query}`);
  pages.push(...data.results);
  if (data.size < data.limit) break;
  start += data.size;
}

const indexPath = join(OUT, "index.json");
const previous = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, "utf8")) : [];
const previousVersions = new Map(previous.map((p) => [p.id, p.version]));

mkdirSync(join(OUT, "pages"), { recursive: true });
const index = pages.map((page) => {
  const path = [...(page.ancestors || []).map((a) => a.title), page.title].join(" > ");
  const meta = { id: page.id, title: page.title, path, version: page.version.number, updated: page.version.when, url: BASE + page._links.webui };
  writeFileSync(join(OUT, "pages", `${page.id}.md`), `# ${page.title}\n\nPath: ${path}\nVersion: ${meta.version} | Updated: ${meta.updated}\nURL: ${meta.url}\n\n${toText(page.body?.view?.value)}\n`);
  return meta;
}).sort((a, b) => a.path.localeCompare(b.path));
writeFileSync(indexPath, JSON.stringify(index, null, 1));
writeFileSync(join(OUT, "last-sync.txt"), new Date().toISOString() + "\n");

// Anonymous access can't see comment authors or dates.
const comments = ["# Confluence comments", "Authors and dates aren't visible without a login.", ""];
for (const page of index) {
  const query = new URLSearchParams({ limit: "100", depth: "all", expand: "body.view" });
  const response = await fetch(`${BASE}/rest/api/content/${page.id}/child/comment?${query}`);
  if (!response.ok) continue;
  const { results } = await response.json();
  if (!results.length) continue;
  comments.push(`## ${page.title} (${page.id})`);
  for (const comment of results) comments.push(`- ${toText(comment.body?.view?.value).replace(/\s+/g, " ")}`);
  comments.push("");
}
writeFileSync(join(OUT, "comments.md"), comments.join("\n"));

console.log(`${index.length} pages saved to .knowledge/confluence/`);
const ids = new Set(index.map((p) => p.id));
for (const page of index) {
  const state = !previousVersions.has(page.id) ? "NEW" : previousVersions.get(page.id) !== page.version ? "CHANGED" : "same";
  console.log(`${state.padEnd(8)}${page.path}  (${page.id})`);
}
for (const page of previous) if (!ids.has(page.id)) console.log(`REMOVED ${page.path}  (${page.id})`);
