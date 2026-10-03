const CACHE='catalog-v5';
const CORE=['./','./index.html','./products.js','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./img-0.js'];
const INDEX=new URL('./index.html',self.registration.scope).href;
function key(req){const u=new URL(req.url);return u.pathname.endsWith('/')?INDEX:u.origin+u.pathname}
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    const put=async u=>{try{const r=await fetch(u);if(r&&r.status===200)await c.put(key(new Request(u)),r)}catch(_){}};
    await Promise.all(CORE.map(put));
    try{
      const r=await c.match(key(new Request('./img-0.js')));
      const m=r&&(await r.text()).match(/IMGN=(\d+)/);
      const n=m?+m[1]:0,jobs=[];
      for(let i=1;i<n;i++)jobs.push(put('./img-'+i+'.js'));
      await Promise.all(jobs);
    }catch(_){}
  })());
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
// الشبكة أولاً. لو النت بطيء (أكتر من 5 ثواني) أو مفيش نت، يعرض النسخة المحفوظة.
self.addEventListener('fetch',e=>{
  const q=e.request;
  if(q.method!=='GET')return;
  const u=new URL(q.url);
  if(u.origin!==location.origin)return;
  if(/admin\.html/.test(q.url)||/admin\.html/.test(q.referrer||''))return; // صفحة الإدارة دايماً من الشبكة
  const k=key(q);
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const net=fetch(q).then(r=>{if(r&&r.status===200)c.put(k,r.clone());return r});
    const hit=await c.match(k);
    if(!hit)return net.catch(async()=>q.mode==='navigate'?((await c.match(INDEX))||Response.error()):Response.error());
    e.waitUntil(net.catch(()=>{}));
    return Promise.race([net.catch(()=>hit),new Promise(r=>setTimeout(()=>r(hit),5000))]);
  })());
});
