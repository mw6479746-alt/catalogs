const CACHE='catalog-v4';
const FILES=['./','./index.html','./products.js','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  const key=u.origin+u.pathname;
  e.respondWith(
    fetch(e.request).then(r=>{
      if(r&&r.status===200){const c=r.clone();caches.open(CACHE).then(x=>x.put(key,c))}
      return r;
    }).catch(()=>caches.match(key,{ignoreVary:true}).then(h=>h||(e.request.mode==='navigate'?caches.match('./index.html',{ignoreVary:true}):Response.error())))
  );
});
