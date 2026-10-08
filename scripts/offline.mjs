import { readdirSync, writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const assets = readdirSync("dist/assets").map((f) => `./assets/${f}`);
const revision = createHash("sha256")
  .update(readFileSync("dist/index.html"))
  .digest("hex")
  .slice(0, 12);
// Same-origin build assets are immutable. Ignore Vary: Origin from static hosts:
// the install fetch has no Origin header while module-script requests have one.
writeFileSync(
  "dist/sw.js",
  `const BASE=self.registration.scope;const PREFIX='jot-and-tittle-'+encodeURIComponent(BASE)+'-';const CACHE=PREFIX+'${revision}';const FILES=${JSON.stringify(["./", ...assets])}.map(file=>new URL(file,BASE).href);self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(BASE))return;const cached=()=>caches.open(CACHE).then(c=>c.match(e.request.mode==='navigate'?BASE:e.request,{ignoreVary:true}));e.respondWith(e.request.mode==='navigate'?fetch(e.request).catch(cached):cached().then(response=>response||fetch(e.request)));});`,
);
