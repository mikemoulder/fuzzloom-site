// Copies only what the site serves into dist/, for `wrangler pages deploy dist`.
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const repo = resolve(process.env.FUZZLOOM_REPO ?? join(root, ".."));
const out = join(root, "dist");
const { version } = JSON.parse(readFileSync(join(repo, "packages/cli/package.json"), "utf8"));
if (typeof version !== "string" || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.+-]+)?$/.test(version)) {
  throw new Error("Expected a CLI package version");
}
const marker = "<span data-cli-version>CLI releases</span>";
const index = readFileSync(join(root, "index.html"), "utf8");
if (index.split(marker).length !== 2) throw new Error("Expected one CLI version marker");

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
writeFileSync(join(out, "index.html"), index.replace(marker, `<span data-cli-version>CLI version ${version}</span>`));
for (const p of ["favicon.svg", "share.jpg", "llms.txt", "llms-full.txt", "assets", "docs"]) {
  cpSync(join(root, p), join(out, p), {
    recursive: true,
    // Keep UI fragments, which the runtime loads as templates.
    filter: (src) => p !== "assets" || !src.endsWith(".html") || basename(src) === "fragment.html",
  });
}
console.log(`staged ${out}`);
