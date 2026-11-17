// Builds docs/*.html, llms.txt and llms-full.txt from markdown.
//
// Sources: the site's own pages in content/ (introduction, quick start, CLI
// reference) and the Fuzzloom repository's docs (guide, architecture,
// algorithms), read from FUZZLOOM_REPO (default: the parent directory). The
// guide is split into one page per numbered section, so the site and the
// repository never drift apart: change the repo's markdown and rebuild.
//
//   node build/docs.mjs            (BASE=https://example.pages.dev for absolute llms.txt links)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { marked } from "marked";

const SITE = resolve(import.meta.dirname, "..");
const REPO = resolve(process.env.FUZZLOOM_REPO ?? join(SITE, ".."));
const BASE = (process.env.BASE ?? "").replace(/\/$/, "");
const GH = "https://github.com/MikeMoulder/fuzzloom";
const OUT = join(SITE, "docs");

const read = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");

/** GitHub's heading slug, so anchors written in the repo's markdown keep working. */
export function slug(text) {
  return text.trim().toLowerCase().replace(/<[^>]+>/g, "").replace(/[`*_]/g, "")
    .replace(/[^\p{L}\p{N} -]/gu, "").replace(/ /g, "-");
}

// ---------------------------------------------------------------- pages

/** Guide sections, by number, to the page that holds them. */
const GUIDE_PAGES = [
  { n: [1], file: "installation", title: "Installation" },
  { n: [2], file: "writing-properties", title: "Writing properties" },
  { n: [3, 4], file: "results", title: "Reading the results" },
  { n: [5], file: "effects", title: "Effects and fixtures" },
  { n: [6], file: "ranges", title: "Input ranges" },
  { n: [7], file: "differential", title: "Differential testing" },
  { n: [8], file: "saved-failures", title: "Saved failures" },
  { n: [9], file: "ci", title: "Running in CI" },
  { n: [10], file: "configuration", title: "Configuration" },
  { n: [11], file: "troubleshooting", title: "Troubleshooting" },
  { n: [12], file: "good-properties", title: "Writing good properties" },
];

/** Splits the guide into its numbered sections: { n, title, slug, body }. */
function guideSections(md) {
  const parts = md.split(/^## (?=\d+\. )/m).slice(1);
  return parts.map((p) => {
    const nl = p.indexOf("\n");
    const head = p.slice(0, nl).trim();
    const n = Number(head.match(/^(\d+)\./)[1]);
    return { n, title: head.replace(/^\d+\.\s*/, ""), slug: slug(head), body: p.slice(nl + 1).trim() };
  });
}

const guide = read(join(REPO, "docs", "guide.md"));
const sections = guideSections(guide);
/** guide anchor -> the page it now lives on */
const guideAnchor = new Map(sections.map((s) => [s.slug, GUIDE_PAGES.find((g) => g.n.includes(s.n)).file]));

const pages = [];
const add = (p) => pages.push(p);

add({ file: "index", title: "Introduction", group: "Getting started", md: read(join(SITE, "content", "index.md")), src: null });
add({ file: "quickstart", title: "Quick start", group: "Getting started", md: read(join(SITE, "content", "quickstart.md")), src: null });
for (const g of GUIDE_PAGES) {
  const own = sections.filter((s) => g.n.includes(s.n));
  // One section: its "###" become this page's "##". Two sections: each keeps a "##" heading.
  const body = own.length === 1
    ? own[0].body.replace(/^### /gm, "## ")
    : own.map((s) => `## ${s.title}\n\n${s.body}`).join("\n\n");
  const group = g.n[0] <= 1 ? "Getting started" : g.n[0] >= 10 && g.n[0] <= 11 ? "Reference" : "Guides";
  add({ file: g.file, title: g.title, group, md: `# ${g.title}\n\n${body}\n`, src: "docs/guide.md" });
}
add({ file: "guide", title: "The whole guide", group: "Guides", md: guide, src: "docs/guide.md" });
add({ file: "cli", title: "CLI reference", group: "Reference", md: read(join(SITE, "content", "cli.md")), src: null });
add({ file: "architecture", title: "How it works", group: "Concepts", md: read(join(REPO, "docs", "architecture.md")), src: "docs/architecture.md" });
add({ file: "algorithms", title: "Algorithms and guarantees", group: "Concepts", md: read(join(REPO, "docs", "algorithms.md")), src: "docs/algorithms.md" });

const ORDER = ["Getting started", "Guides", "Reference", "Concepts"];
pages.sort((a, b) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group));
// keep the declared order inside each group
const byGroup = ORDER.map((g) => ({ group: g, items: pages.filter((p) => p.group === g) }));
const flat = byGroup.flatMap((g) => g.items);

// ---------------------------------------------------------------- links

/** Rewrites a markdown href for the site. `from` is the source markdown's repo path (or null for site content). */
function href(h, from) {
  if (/^(https?:|mailto:)/.test(h)) return h;
  const [path, hash = ""] = h.split("#");
  const anchor = hash ? `#${hash}` : "";
  if (!path) {
    // an anchor inside the same source: inside the guide it may now be on another page
    if (from === "docs/guide.md" && guideAnchor.has(hash)) return `${guideAnchor.get(hash)}.html`;
    return anchor;
  }
  if (path.endsWith(".html")) return h;
  const name = path.replace(/^\.\//, "");
  if (name === "guide.md") return guideAnchor.get(hash) ? `${guideAnchor.get(hash)}.html` : `guide.html${anchor}`;
  if (name === "architecture.md") return `architecture.html${anchor}`;
  if (name === "algorithms.md") return `algorithms.html${anchor}`;
  // anything else points into the repository
  const repoPath = from ? join(dirname(from), path).split("\\").join("/") : path;
  const clean = repoPath.replace(/^(\.\.\/)+/, "");
  if (clean === "README.md") return `${GH}${anchor}`;
  const isDir = !/\.[a-z0-9]+$/i.test(clean.split("/").pop() ?? "");
  return `${GH}/${isDir ? "tree" : "blob"}/main/${clean}${anchor}`;
}

// ---------------------------------------------------------------- render

function render(page) {
  const toc = [];
  const renderer = new marked.Renderer();
  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const id = slug(text);
    if (depth === 2) toc.push({ id, text: text.replace(/<[^>]+>/g, "") });
    if (depth === 1) return `<h1 id="${id}">${text}</h1>\n`;
    return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${text}</h${depth}>\n`;
  };
  renderer.link = function ({ href: h, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    const to = href(h, page.src);
    const ext = /^https?:/.test(to) ? ' rel="noopener"' : "";
    return `<a href="${to}"${title ? ` title="${title}"` : ""}${ext}>${text}</a>`;
  };
  renderer.code = function ({ text, lang }) {
    const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const label = lang ? `<span class="code__lang">${lang}</span>` : "";
    return `<div class="code">${label}<button class="code__copy" type="button" aria-label="Copy code">Copy</button><pre><code${lang ? ` class="lang-${lang}"` : ""}>${esc}</code></pre></div>\n`;
  };
  renderer.table = function (token) {
    return `<div class="table">${marked.Renderer.prototype.table.call(this, token)}</div>\n`;
  };
  const html = marked.parse(page.md, { renderer, gfm: true });
  return { html, toc };
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const desc = (md) => {
  const para = md.split("\n\n").find((b) => b && !b.startsWith("#") && !b.startsWith("```") && !b.startsWith("|") && !b.startsWith("-") && !b.startsWith("1."));
  return (para ?? "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[`*]/g, "").replace(/\s+/g, " ").trim().slice(0, 155);
};

function sidebar(current) {
  return byGroup.map(({ group, items }) => `
        <div class="side__group">
          <p class="side__label">${group}</p>
          <ul>${items.map((p) => `<li><a href="${p.file}.html"${p.file === current ? ' aria-current="page"' : ""}>${p.title}</a></li>`).join("")}</ul>
        </div>`).join("");
}

function pageHtml(page, { html, toc }) {
  const i = flat.indexOf(page);
  const prev = flat[i - 1], next = flat[i + 1];
  const title = page.file === "index" ? "Fuzzloom docs" : `${page.title}: Fuzzloom docs`;
  const edit = page.src ? `${GH}/blob/main/${page.src}` : null;
  return `<!doctype html>
<html lang="en" data-type="software" data-radius="sharp" data-buttons="tonal" data-motion>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc(page.md) || page.title)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:image" content="../share.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#0f1f10">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gabarito:wght@400..700&family=Figtree:wght@400..600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/system.css">
<link rel="stylesheet" href="../assets/motion/motion.css">
<link rel="stylesheet" href="docs.css">
</head>
<body class="docs">
<header class="nav">
  <div class="wrap nav__bar">
    <a class="skip-link" href="#doc">Skip to content</a>
    <a class="nav__logo" href="../"><span class="mark" data-mark="dots" aria-hidden="true"></span>Fuzzloom <span class="docs__crumb">Docs</span></a>
    <nav class="nav__links" aria-label="Main">
      <div class="nav__item"><a class="nav__link" href="../">Home</a></div>
      <div class="nav__item"><a class="nav__link" href="cli.html">CLI</a></div>
      <div class="nav__item"><a class="nav__link" href="../llms.txt">llms.txt</a></div>
    </nav>
    <div class="nav__actions">
      <a class="nav__link" href="${GH}">GitHub</a>
      <a class="btn btn--primary" href="quickstart.html">Read the quick start</a>
    </div>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-label="Menu"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
  </div>
</header>
<div class="docs__layout wrap">
  <aside class="side" aria-label="Documentation">
    <label class="side__search"><span class="sr-only">Find a page</span><input type="search" placeholder="Find a page" data-docs-search></label>
    <nav>${sidebar(page.file)}
    </nav>
  </aside>
  <main class="doc" id="doc">
    <p class="doc__crumbs"><a href="index.html">Docs</a> / ${esc(page.group)}</p>
    <article class="prose">
${html}
    </article>
    <nav class="doc__pager" aria-label="Previous and next page">
      ${prev ? `<a class="doc__prev" href="${prev.file}.html"><span>Previous</span>${prev.title}</a>` : "<span></span>"}
      ${next ? `<a class="doc__next" href="${next.file}.html"><span>Next</span>${next.title}</a>` : "<span></span>"}
    </nav>
    ${edit ? `<p class="doc__edit"><a href="${edit}">Edit this page on GitHub</a></p>` : ""}
  </main>
  <aside class="toc" aria-label="On this page">
    ${toc.length ? `<p class="side__label">On this page</p><ul>${toc.map((t) => `<li><a href="#${t.id}">${t.text}</a></li>`).join("")}</ul>` : ""}
  </aside>
</div>
<footer class="docs__footer">
  <div class="wrap"><span>&copy; 2026 Fuzzloom &nbsp; Apache License 2.0</span><span><a href="${GH}">GitHub</a> &nbsp; <a href="https://www.npmjs.com/package/fuzzloom">npm</a> &nbsp; <a href="../llms-full.txt">llms-full.txt</a></span></div>
</footer>
<script type="module" src="../assets/system.js"></script>
<script type="module" src="../assets/motion/motion.js"></script>
<script type="module" src="docs.js"></script>
</body>
</html>
`;
}

mkdirSync(OUT, { recursive: true });
for (const p of pages) writeFileSync(join(OUT, `${p.file}.html`), pageHtml(p, render(p)));

// ---------------------------------------------------------------- llms

const url = (p) => `${BASE}${BASE ? "/" : ""}docs/${p.file}.html`;
const llms = [
  "# Fuzzloom",
  "",
  "> Property-based testing and fuzzing for the Fe language, with EVM (sonatina) and native differential testing. Write a property as a Fe function returning bool; Fuzzloom generates inputs inside Fe, shrinks failures, saves them for replay and compares backends. Install: npx fuzzloom. Requires fe 26.6 and Node 22.18.",
  "",
  "Key facts: properties are `pub fn prop_<name>(args) -> bool`, differential targets `pub fn diff_<name>(args) -> T`; arguments are 1 to 3 of u8..u256, i8..i256 or bool; effects come from `pub fn fixture_*() -> T`; ranges from `/// fuzzloom: <arg> in <lo>..=<hi>`. Exit codes: 0 passed, 1 finding, 2 infrastructure error. Fuzzing does not prove a property holds.",
  "",
  ...byGroup.flatMap(({ group, items }) => ["", `## ${group}`, "", ...items.map((p) => `- [${p.title}](${url(p)}): ${desc(p.md)}`)]),
  "",
  "## Source",
  "",
  `- [Repository](${GH}): the Fe library (ingots/fuzzloom), the CLI (packages/cli), examples and CI`,
  "- [npm package](https://www.npmjs.com/package/fuzzloom)",
  "",
].join("\n");
writeFileSync(join(SITE, "llms.txt"), llms);
const full = flat.map((p) => `<!-- ${url(p)} -->\n\n${p.md.trim()}\n`).join("\n\n---\n\n");
writeFileSync(join(SITE, "llms-full.txt"), `# Fuzzloom documentation (full text)\n\n${full}`);

console.log(`built ${pages.length} pages into docs/, plus llms.txt and llms-full.txt (repo: ${REPO})`);
if (!existsSync(join(OUT, "docs.css"))) console.log("note: docs/docs.css is missing");
