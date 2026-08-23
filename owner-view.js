/* ADINEH OWNER READ-ONLY VIEW MODE */
(function(){
  'use strict';
  const q=new URLSearchParams(location.search);
  const target=q.get('owner_view');
  if(!target || !/^[0-9a-f-]{36}$/i.test(target)) return;
  const key='adineh_owner_view_target';
  try{sessionStorage.setItem(key,target);localStorage.removeItem('adine_poultry_current_selection')}catch(_){ }
  window.__ADINEH_OWNER_VIEW__={active:true,targetUserId:target};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  async function ready(){
    for(let i=0;i<200;i++){
      if(window.supabaseClient?.auth) return window.supabaseClient;
      await sleep(25);
    }
    return null;
  }
  function blockMutations(client){
    if(!client || client.__adinehOwnerReadonlyWrapped) return;
    const originalFrom=client.from.bind(client);
    client.from=function(table){
      const builder=originalFrom(table);
      return new Proxy(builder,{get(obj,prop,recv){
        if(['insert','update','upsert','delete'].includes(String(prop))){
          return function(){
            return Promise.resolve({data:null,error:{message:'OWNER_READ_ONLY'}});
          };
        }
        return Reflect.get(obj,prop,recv);
      }});
    };
    client.__adinehOwnerReadonlyWrapped=true;
    const originalRpc=client.rpc.bind(client);
    client.rpc=function(name,args,options){
      const mutating=new Set(['owner_manage_user','owner_set_user_role','owner_set_user_status','owner_update_user_basic','owner_update_professional_profile','owner_verify_professional','owner_generate_professional_code','owner_set_professional_access_code','owner_set_professional_code_status','update_my_activity','log_owner_user_action','owner_log_activity']);
      if(mutating.has(name)) return Promise.resolve({data:null,error:{message:'OWNER_READ_ONLY'}});
      return originalRpc(name,args,options);
    };
  }
  function fakeUser(uid){return {id:uid,email:'',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}};}
  async function start(){
    const c=await ready();
    if(!c)return;
    blockMutations(c);
    const originalGetUser=c.auth.getUser.bind(c.auth);
    if(!c.auth.__adinehOwnerReadonlyGetUser){
      c.auth.getUser=async function(jwt){
        if(jwt) return originalGetUser(jwt);
        return {data:{user:fakeUser(target)},error:null};
      };
      c.auth.__adinehOwnerReadonlyGetUser=true;
    }
    if(window.AdineAuth){
      const originalRequire=window.AdineAuth.requireAuth?.bind(window.AdineAuth);
      if(originalRequire && !window.AdineAuth.__adinehOwnerReadonly){
        window.AdineAuth.requireAuth=async function(){
          return {authenticated:true,allowed:true,user:fakeUser(target),ownerView:true,readOnly:true};
        };
        window.AdineAuth.__adinehOwnerReadonly=true;
      }
    }
    installUi();
  }
  function installUi(){
    const css=document.createElement('style');
    css.textContent='.adineh-owner-view-banner{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:2147483646;background:#173f35;color:#fff;border-radius:999px;padding:7px 12px;font:700 11px Tahoma;box-shadow:0 5px 20px #0003;display:flex;gap:8px;align-items:center}.adineh-owner-view-banner button{border:0;background:#fff;color:#173f35;border-radius:8px;padding:5px 9px;font:800 10px Tahoma;cursor:pointer}.adineh-owner-view-readonly input,.adineh-owner-view-readonly select,.adineh-owner-view-readonly textarea{pointer-events:none;filter:saturate(.7)}';
    document.head.appendChild(css);
    document.documentElement.classList.add('adineh-owner-view-readonly');
    const b=document.createElement('div');b.className='adineh-owner-view-banner';b.innerHTML='<span>بازدید مدیریتی</span><button type="button">بازگشت به مدیریت</button>';b.querySelector('button').onclick=()=>{sessionStorage.removeItem(key);location.href='owner.html'};document.body.appendChild(b);
    const disable=()=>{
      document.querySelectorAll('input,select,textarea,[contenteditable="true"]').forEach(el=>{el.readOnly=true;el.disabled=true;el.setAttribute('aria-readonly','true')});
      document.querySelectorAll('button').forEach(btn=>{const t=(btn.innerText||btn.textContent||'').trim();if(/ذخیره|ثبت|ویرایش|حذف|پاک|افزودن|ایجاد|تغییر|ارسال|save|edit|delete|add|create|update/i.test(t)&&!/بازگشت|خانه|فارم|گزارش|هفتگی|مدیریت/i.test(t)){btn.disabled=true;btn.style.pointerEvents='none';btn.style.opacity='.45'}});
    };
    disable();new MutationObserver(disable).observe(document.body,{subtree:true,childList:true});
  }
  start();
})();
