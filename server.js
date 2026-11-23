import { serve } from "bun";
import { join, normalize } from "node:path";

const ROOT = import.meta.dir;
const PORT = Number(Bun.env.PORT || 4180);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

function safePath(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const relative = clean === "/" || clean === "\\" ? "index.html" : clean.replace(/^[/\\]+/, "");
  const full = join(ROOT, relative);
  return full.startsWith(ROOT) ? full : null;
}

const server = serve({
  hostname: "0.0.0.0",
  port: PORT,
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Metode tidak didukung", { status: 405 });
    }
    const path = safePath(new URL(request.url).pathname);
    if (!path) return new Response("Path tidak valid", { status: 400 });
    const file = Bun.file(path);
    if (!(await file.exists())) return new Response("Tidak ditemukan", { status: 404 });
    const ext = path.slice(path.lastIndexOf("."));
    return new Response(request.method === "HEAD" ? null : file, {
      headers: {
        "content-type": MIME[ext] || "application/octet-stream",
        "cache-control": "no-store",
      },
    });
  },
});

console.log(`ACE siap di http://localhost:${server.port}`);
