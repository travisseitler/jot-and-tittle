import { readdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const assets = readdirSync("dist/assets").map((f) => `/assets/${f}`);
const revision = createHash("sha256")
  .update(readFileSync("dist/index.html"))
  .digest("hex")
  .slice(0, 12);
// Same-origin build assets are immutable. Ignore Vary: Origin from static hosts:
// the install fetch has no Origin header while module-script requests have one.
writeFileSync(
  "dist/sw.js",
  `const CACHE='jot-and-tittle-${revision}';const FILES=${JSON.stringify(["/", ...assets])};self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('jot-and-tittle-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(e.request.mode==='navigate'?fetch(e.request).catch(()=>caches.match('/')):caches.match(e.request,{ignoreVary:true}).then(cached=>cached||fetch(e.request)));});`,
);
