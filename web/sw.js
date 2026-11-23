/* Forma Fitness PWA — rede primeiro: atualizações substituem arquivos antigos, cache só como fallback offline. */
const CACHE="forma-fitness-v4-motion-20261123";
const ASSETS=["./","./index.html","./styles.css","./data.js","./core.js","./ui.js","./app.js","./cloud.js","./cloud-config.js","./media.js","./manifest.webmanifest","./favicon.svg"];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("forma-fitness-")&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(url.pathname.includes("/api/"))return;
 event.respondWith((async()=>{
  try{
    const response=await fetch(req);
    if(response.ok&&response.type==="basic"){
      const cache=await caches.open(CACHE);
      await cache.put(req,response.clone());
    }
    return response;
  }catch(err){
    const cached=await caches.match(req,{ignoreSearch:true});
    if(cached)return cached;
    return new Response("Você está offline. Conecte-se para carregar este recurso.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
  }
 })());
});
