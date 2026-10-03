const CACHE='catalog-v9';
const CORE=['./','./index.html','./products.js','./thumbs.js','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
const INDEX=new URL('./index.html',self.registration.scope).href;
function key(req){const u=new URL(req.url);return u.pathname.endsWith('/')?INDEX:u.origin+u.pathname}
async function putOne(c,u,force){
  try{
    const rq=new Request(u);
    if(!force&&await c.match(key(rq)))return;
    const r=await fetch(rq);
    if(r&&r.status===200)await c.put(key(rq),r);
  }catch(_){}
}
// يقرأ products.js ويطلّع قايمة كل الصور المطلوبة
function imgList(t){
  try{
    const C=(new Function(t+';return CATALOG'))(),o=[];
    C.sections.forEach(s=>s.items.forEach(x=>{
      if(x.img)o.push(x.id);
      (x.gal||[]).forEach(g=>o.push(g));
      (x.variants||[]).forEach(v=>{if(v.img)o.push(v.id)});
    }));
    return o.map(i=>'./img-'+i+'.jpg');
  }catch(_){return[]}
}
// يحفظ كل الصور اللي لسه مش محفوظة، 6 في المرة
async function precache(c,t){
  const l=imgList(t);
  for(let i=0;i<l.length;i+=6)await Promise.all(l.slice(i,i+6).map(u=>putOne(c,u,false)));
}
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    await Promise.all(CORE.map(u=>putOne(c,u,true)));
    const r=await c.match(key(new Request('./products.js')));
    if(r)await precache(c,await r.text());
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
  const k=key(q),isProd=/\/products\.js$/.test(u.pathname);
  // الصور: من المحفوظ فوراً (من غير انتظار الشبكة)، وتتحدّث في الخلفية للمرة الجاية
  if(/\/img-[^/]+\.jpg$/.test(u.pathname)){
    e.respondWith((async()=>{
      const c=await caches.open(CACHE),hit=await c.match(k);
      const net=fetch(q).then(r=>{if(r&&r.status===200)c.put(k,r.clone());return r});
      e.waitUntil(net.catch(()=>{}));
      return hit||net.catch(()=>Response.error());
    })());
    return;
  }
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    let pre=Promise.resolve();
    const net=fetch(q).then(r=>{
      if(r&&r.status===200){
        c.put(k,r.clone());
        if(isProd)pre=r.clone().text().then(t=>precache(c,t)).catch(()=>{});
      }
      return r;
    });
    e.waitUntil(net.then(()=>pre,()=>{}));
    const hit=await c.match(k);
    if(!hit)return net.catch(async()=>q.mode==='navigate'?((await c.match(INDEX))||Response.error()):Response.error());
    return Promise.race([net.catch(()=>hit),new Promise(r=>setTimeout(()=>r(hit),5000))]);
  })());
});
