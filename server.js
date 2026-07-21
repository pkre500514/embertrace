import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(process.cwd(), "public");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".wav": "audio/wav" };

export function createAppServer() {
  return createServer(async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { allow: "GET, HEAD" }).end("Method not allowed");
      return;
    }
    const pathname = new URL(request.url, "http://localhost").pathname;
    const safePath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
    if (safePath.includes("..") || safePath.includes("\0")) {
      response.writeHead(400).end("Invalid request");
      return;
    }
    try {
      const file = await readFile(join(root, safePath));
      response.writeHead(200, { "content-type": types[extname(safePath)] ?? "application/octet-stream" });
      response.end(request.method === "HEAD" ? undefined : file);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createAppServer().listen(4173, () => console.log("EmberTrace demo: http://localhost:4173"));
}
