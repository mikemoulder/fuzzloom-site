// Copies only what the site serves into dist/, for `wrangler pages deploy dist`.
import { cpSync, rmSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const out = join(root, "dist");
rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const p of ["index.html", "favicon.svg", "share.jpg", "llms.txt", "llms-full.txt", "assets", "docs"]) {
  cpSync(join(root, p), join(out, p), { recursive: true });
}
console.log(`staged ${out}`);
