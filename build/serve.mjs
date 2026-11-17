// A static server for local previews: node build/serve.mjs [port]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const port = Number(process.env.PORT ?? process.argv[2] ?? 4173);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2", ".glsl": "text/plain" };
createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^[/\\]+/, "");
    let f = join(root, p);
    if (!f.startsWith(root)) { res.writeHead(403).end(); return; }
    if ((await stat(f).catch(() => null))?.isDirectory()) f = join(f, "index.html");
    const body = await readFile(f);
    res.writeHead(200, { "content-type": types[extname(f)] ?? "application/octet-stream" }).end(body);
  } catch { res.writeHead(404, { "content-type": "text/plain" }).end("not found"); }
}).listen(port, "localhost", () => console.log(`serving ${root} on http://localhost:${port}/`));
