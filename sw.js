const CACHE='catalog-v3';
const FILES=['./','./index.html','./products.js','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(
    fetch(e.request).then(r=>{
      if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}
      return r;
    }).catch(()=>caches.match(e.request).then(h=>h||(e.request.mode==='navigate'?caches.match('./index.html'):Response.error())))
  );
});
