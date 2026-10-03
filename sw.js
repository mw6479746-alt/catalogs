const CACHE='catalog-v2';
const FILES=['./','./index.html','./products.js','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));self.clients.claim()});
// الشبكة أولاً عشان الأسعار الجديدة تظهر، لكن لو النت بطيء (أكتر من 4 ثواني) يعرض النسخة المحفوظة فوراً
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const net=fetch(e.request).then(r=>{if(r&&r.ok)cache.put(e.request,r.clone());return r});
    const hit=await cache.match(e.request);
    if(!hit)return net.catch(()=>caches.match('./index.html'));
    e.waitUntil(net.catch(()=>{}));
    return Promise.race([net.catch(()=>hit),new Promise(res=>setTimeout(()=>res(hit),4000))]);
  })());
});
