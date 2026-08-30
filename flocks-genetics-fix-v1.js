/* FINAL FLOCK GENETICS SELECTOR FIX - v4 */
(function(){
'use strict';
function cat(){try{return typeof POULTRY_CATALOG!=='undefined'?POULTRY_CATALOG:null}catch(e){return null}}
function type(v){v=String(v??'').normalize('NFKC').replace(/[\u200c\u200f\u202a-\u202e]/g,'').trim().toLowerCase();return ({'گوشتی':'broiler','broiler':'broiler','تخمگذار':'layer','تخم گذار':'layer','تخم‌گذار':'layer','layer':'layer','پولت':'pullet','pullet':'pullet','مادر':'breeder','مرغ مادر':'breeder','breeder':'breeder'})[v]||v}
function groups(v){const c=cat(),g=c&&c[type(v)]&&c[type(v)].genetics;return Array.isArray(g)?g:[]}
function e(){return {t:document.getElementById('productionType'),g:document.getElementById('genetics'),s:document.getElementById('flockStrain'),p:document.getElementById('flockProgram')}}
function opt(t,v){const o=document.createElement('option');o.value=String(v??'');o.textContent=String(t??'');return o}
function companies(){const x=e();if(!x.t||!x.g||!x.s)return;const a=groups(x.t.value);x.g.disabled=false;x.g.innerHTML='';x.g.appendChild(opt('انتخاب شرکت / ژنتیک',''));a.forEach(g=>x.g.appendChild(opt(g.name,g.id)));x.s.disabled=true;x.s.innerHTML='';x.s.appendChild(opt('ابتدا شرکت / ژنتیک را انتخاب کنید',''));if(x.p){x.p.disabled=true;x.p.innerHTML='';x.p.appendChild(opt('انتخاب استاندارد / برنامه',''))}}
function strains(){const x=e();if(!x.t||!x.g||!x.s)return;const g=groups(x.t.value).find(g=>String(g.id)===String(x.g.value));const a=Array.isArray(g&&g.strains)?g.strains:[];x.s.disabled=false;x.s.innerHTML='';x.s.appendChild(opt('انتخاب سویه / خط ژنتیکی',''));a.forEach(s=>x.s.appendChild(opt(s,s)));if(x.p){x.p.disabled=!x.g.value;x.p.innerHTML='';x.p.appendChild(opt('انتخاب استاندارد / برنامه',''));}}
function program(){const x=e();if(!x.p)return;x.p.disabled=!x.g?.value;x.p.innerHTML='';x.p.appendChild(opt('انتخاب استاندارد / برنامه',''));if(x.g?.value)x.p.appendChild(opt('استاندارد '+(x.g.selectedOptions[0]?.textContent||x.g.value)+(x.s?.value?' — '+x.s.value:''),type(x.t?.value)+'_'+x.g.value+'_'+(x.s?.value||'default')))}
/* flocks.js contains its own setupGenetics() which used the wrong window-level
   catalog fallback. Replace that initializer so it cannot disable our selects. */
try{window.setupGenetics=function(){companies()}}catch(e){}
function bind(){const x=e();if(!x.t||!x.g||!x.s)return false;if(x.t.dataset.geneticsV4==='1')return true;x.t.dataset.geneticsV4='1';document.addEventListener('change',function(ev){const z=ev.target;if(z===x.t){ev.stopImmediatePropagation();companies()}else if(z===x.g){ev.stopImmediatePropagation();strains()}else if(z===x.s){ev.stopImmediatePropagation();program()}},true);companies();return true}
function boot(){if(!bind())setTimeout(boot,100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.AdineFinalGeneticsSelector={refresh:companies,refreshStrains:strains};
})();