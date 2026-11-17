// Every relative href and src in the site's HTML points at a file that exists, and every #anchor at an id.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
const root = resolve(import.meta.dirname, "..");
const pages = [join(root, "index.html"), ...readdirSync(join(root, "docs")).filter((f) => f.endsWith(".html")).map((f) => join(root, "docs", f))];
const ids = (f) => new Set([...readFileSync(f, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
let bad = 0;
for (const f of pages) {
  const html = readFileSync(f, "utf8").replace(/<script type="application\/json">[\s\S]*?<\/script>/g, "");
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const l = m[1];
    if (/^(https?:|mailto:|data:)/.test(l)) continue;
    const [p, hash] = l.split("#");
    let target = p ? resolve(dirname(f), p) : f;
    if (p && existsSync(target) && statSync(target).isDirectory()) target = join(target, "index.html");
    if (!existsSync(target)) { console.log(`MISSING ${relative(root, f)} -> ${l}`); bad++; continue; }
    if (hash && target.endsWith(".html") && !ids(target).has(hash)) { console.log(`ANCHOR  ${relative(root, f)} -> ${l}`); bad++; }
  }
}
console.log(bad ? `${bad} broken` : `all links ok across ${pages.length} pages`);
process.exitCode = bad ? 1 : 0;
