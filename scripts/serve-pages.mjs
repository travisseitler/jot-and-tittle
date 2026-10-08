import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, relative, sep } from "node:path";

const root = resolve("_site");
const prefix = "/jot-and-tittle/";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (!pathname.startsWith(prefix)) {
      response.writeHead(404).end();
      return;
    }
    let file = resolve(root, pathname.slice(prefix.length));
    const withinRoot = relative(root, file);
    if (withinRoot.startsWith(`..${sep}`) || withinRoot === "..") {
      response.writeHead(404).end();
      return;
    }
    if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
    const contents = await readFile(file);
    response
      .writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      })
      .end(contents);
  } catch {
    response.writeHead(404).end();
  }
}).listen(4174, "127.0.0.1");
