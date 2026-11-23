const CACHE="forma-fitness-v1-20261123";
const ASSETS=["./","./index.html","./styles.css","./data.js","./core.js","./ui.js","./app.js","./manifest.webmanifest","./favicon.svg"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
 const req=e.request;if(req.method!=="GET"||new URL(req.url).origin!==self.location.origin)return;
 e.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE).then(c=>c.put(req,clone));}return response;}).catch(()=>new Response("Sem conexão. Abra o Forma novamente quando estiver online.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}}))));
});
