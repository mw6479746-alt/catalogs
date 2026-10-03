self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){
  e.waitUntil((async function(){
    var ks=await caches.keys();
    await Promise.all(ks.map(function(k){return caches.delete(k)}));
    await self.registration.unregister();
  })());
});
