/* ADINEH OWNER READ-ONLY USER VIEW */
(function(){
  'use strict';
  const params=new URLSearchParams(location.search);
  const target=params.get('owner_view');
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if(!target||!uuid.test(target))return;
  const KEY='adineh_owner_view_target';
  try{sessionStorage.setItem(KEY,target);localStorage.removeItem('adine_poultry_current_selection');}catch(_){}
  window.__ADINEH_OWNER_VIEW__={active:true,targetUserId:target,readOnly:true};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  async function ready(){for(let i=0;i<240;i++){if(window.supabaseClient?.auth)return window.supabaseClient;try{if(typeof supabaseClient!=='undefined'&&supabaseClient?.auth)return supabaseClient}catch(_){}await sleep(25)}return null;}
  function blockClientMutations(c){
    if(!c||c.__adinehOwnerReadonlyWrapped)return;
    const originalFrom=c.from.bind(c);
    c.from=function(table){const builder=originalFrom(table);return new Proxy(builder,{get(obj,prop,recv){if(['insert','update','upsert','delete'].includes(String(prop)))return()=>Promise.resolve({data:null,error:{message:'OWNER_READ_ONLY',code:'42501'}});return Reflect.get(obj,prop,recv);}})};
    const originalRpc=c.rpc.bind(c);
    const blocked=new Set(['owner_manage_user','owner_set_user_role','owner_set_user_status','owner_update_user_basic','owner_update_professional_profile','owner_verify_professional','owner_generate_professional_code','owner_set_professional_access_code','owner_set_professional_code_status','update_my_activity','log_owner_user_action','owner_log_activity']);
    c.rpc=function(name,args,options){if(blocked.has(name))return Promise.resolve({data:null,error:{message:'OWNER_READ_ONLY',code:'42501'}});return originalRpc(name,args,options);};
    c.__adinehOwnerReadonlyWrapped=true;
  }
  function fakeUser(){return{id:target,email:'',aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{},ownerView:true};}
  function installUi(){
    const css=document.createElement('style');css.textContent='.adineh-owner-view-bar{position:fixed;top:10px;right:12px;z-index:2147483647;display:flex;align-items:center;gap:7px;background:#173f35;color:#fff;border-radius:10px;padding:6px 8px;box-shadow:0 5px 22px #0004;font:800 11px Tahoma}.adineh-owner-view-bar button{border:0;background:#fff;color:#173f35;border-radius:7px;padding:6px 9px;font:800 10px Tahoma;cursor:pointer}.adineh-owner-view-readonly input,.adineh-owner-view-readonly select,.adineh-owner-view-readonly textarea{pointer-events:none}.adineh-owner-view-readonly button[data-owner-mutation],.adineh-owner-view-readonly .save-btn,.adineh-owner-view-readonly .delete-btn{display:none!important}';document.head.appendChild(css);document.documentElement.classList.add('adineh-owner-view-readonly');
    const bar=document.createElement('div');bar.className='adineh-owner-view-bar';bar.innerHTML='<button type="button" id="adinehOwnerBack">بازگشت به مدیریت</button>';bar.querySelector('#adinehOwnerBack').onclick=()=>{try{sessionStorage.removeItem(KEY)}catch(_){};location.href='owner.html'};document.body.appendChild(bar);
    const disable=()=>{document.querySelectorAll('input,select,textarea,[contenteditable="true"]').forEach(el=>{el.readOnly=true;el.disabled=true;el.setAttribute('aria-readonly','true')});document.querySelectorAll('button,a').forEach(el=>{const t=(el.innerText||el.textContent||'').trim();if(/ذخیره|ثبت|ویرایش|حذف|پاک|افزودن|ایجاد|تغییر|ارسال|save|edit|delete|add|create|update/i.test(t)&&!/بازگشت|خانه|فارم|گزارش|هفتگی|مدیریت/i.test(t)){el.disabled=true;el.style.pointerEvents='none';el.style.opacity='.45';}})};
    disable();new MutationObserver(disable).observe(document.body,{subtree:true,childList:true});
  }
  async function start(){const c=await ready();if(!c){installUi();return;}blockClientMutations(c);const originalGetUser=c.auth.getUser.bind(c.auth);if(!c.auth.__adinehOwnerReadonlyGetUser){c.auth.getUser=async jwt=>jwt?originalGetUser(jwt):{data:{user:fakeUser()},error:null};c.auth.__adinehOwnerReadonlyGetUser=true;}if(window.AdineAuth?.requireAuth&&!window.AdineAuth.__adinehOwnerReadonly){window.AdineAuth.requireAuth=async()=>({authenticated:true,allowed:true,user:fakeUser(),ownerView:true,readOnly:true});window.AdineAuth.__adinehOwnerReadonly=true;}installUi();}
  start();
})();
