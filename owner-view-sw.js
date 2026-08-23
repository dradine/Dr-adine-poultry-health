const DB='adineh-owner-view';
const STORE='state';
const KEY='target';

function openDB(){
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB,1);
    r.onupgradeneeded=()=>r.result.createObjectStore(STORE);
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
  });
}
function getTarget(){
  return openDB().then(db=>new Promise((resolve,reject)=>{
    const r=db.transaction(STORE,'readonly').objectStore(STORE).get(KEY);
    r.onsuccess=()=>resolve(r.result||null);
    r.onerror=()=>reject(r.error);
  })).catch(()=>null);
}
function setTarget(v){
  return openDB().then(db=>new Promise((resolve,reject)=>{
    const t=db.transaction(STORE,'readwrite');
    t.objectStore(STORE).put(v,KEY);
    t.oncomplete=resolve;
    t.onerror=()=>reject(t.error);
  }));
}
function clearTarget(){
  return openDB().then(db=>new Promise((resolve,reject)=>{
    const t=db.transaction(STORE,'readwrite');
    t.objectStore(STORE).delete(KEY);
    t.oncomplete=resolve;
    t.onerror=()=>reject(t.error);
  }));
}

self.addEventListener('message',event=>{
  if(event.data?.type==='OWNER_VIEW_START' && event.data.target){
    event.waitUntil(setTarget(event.data.target));
  }
  if(event.data?.type==='OWNER_VIEW_STOP'){
    event.waitUntil(clearTarget());
  }
});

self.addEventListener('fetch',event=>{
  if(event.request.mode!=='navigate') return;
  event.respondWith((async()=>{
    const target=await getTarget();
    let request=event.request;
    if(target){
      const url=new URL(request.url);
      const isOwner=url.pathname.endsWith('/owner.html') || url.pathname.endsWith('/login.html');
      if(!isOwner){
        url.searchParams.set('owner_view',target);
        request=new Request(url.toString(),request);
      }
    }
    const response=await fetch(request);
    const contentType=response.headers.get('content-type')||'';
    if(!contentType.includes('text/html')) return response;
    let html=await response.text();
    if(!html.includes('owner-view.js')){
      html=html.replace(/<\/body>/i,'<script src="owner-view.js"></script></body>');
    }
    const headers=new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.delete('etag');
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  })());
});
