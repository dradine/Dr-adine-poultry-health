/* ADINEH SHARED CALENDAR v1
   UI-only for non-health Jalali text date fields.
   Keeps the field value Jalali, so existing save/calculation logic is untouched.
*/
(function(){
'use strict';
if(window.__ADINE_SHARED_JALALI_V1__) return;
window.__ADINE_SHARED_JALALI_V1__=true;
const M=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const W=['ش','ی','د','س','چ','پ','ج'];
const F='۰۱۲۳۴۵۶۷۸۹';
const fa=x=>String(x??'').replace(/\d/g,d=>F[d]);
const norm=x=>String(x??'').replace(/[۰-۹]/g,d=>String(F.indexOf(d))).replace(/[-.]/g,'/');
const pad=n=>String(n).padStart(2,'0');
const DS=()=>window.AdineDateSystem;
function parse(v){const a=norm(v).split('/').map(Number);return a.length===3&&a.every(Number.isFinite)&&a[0]>0&&a[1]>=1&&a[1]<=12&&a[2]>=1&&a[2]<=31?a:null}
function iso(j){return DS()?.jalaliToISO(`${j[0]}/${pad(j[1])}/${pad(j[2])}`)||''}
function fromIso(v){const j=DS()?.isoToJalali(v)||'';return parse(j)}
function days(y,m){if(m<=6)return 31;if(m<=11)return 30;return DS()?.isJalaliLeapYear(y)?30:29}
function today(){return fromIso(DS()?.todayGregorianISO())||parse('1405/01/01')}
function offset(y,m){const g=iso([y,m,1]);if(!g)return 0;return (new Date(g+'T00:00:00').getDay()+1)%7}
let pop=null, active=null;
function close(){if(pop){pop.remove();pop=null;active=null}}
function addCss(){if(document.getElementById('shared-jalali-css'))return;const s=document.createElement('style');s.id='shared-jalali-css';s.textContent='.sjc{position:fixed;z-index:2147483647;width:278px;max-width:calc(100vw - 20px);box-sizing:border-box;padding:10px;background:#fff;border:1px solid #d9e3de;border-radius:14px;box-shadow:0 15px 38px rgba(20,45,35,.2);font-family:inherit;direction:rtl;color:#263b32}.sjc *{box-sizing:border-box}.sjc-head{display:grid;grid-template-columns:34px 1fr 34px;gap:5px;align-items:center}.sjc button{font:inherit;cursor:pointer}.sjc-head button,.sjc-foot button{border:1px solid #dce5e0;background:#f7faf8;border-radius:8px;min-height:30px}.sjc-title{text-align:center;font-size:13px;font-weight:700}.sjc-week,.sjc-days{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.sjc-week span{text-align:center;font-size:9px;color:#718079;padding:5px 0}.sjc-days i{min-height:31px}.sjc-days button{border:0;background:transparent;border-radius:8px;min-height:31px;font-size:11px}.sjc-days button:hover{background:#edf4f0}.sjc-days .sel{background:#173f35;color:#fff;font-weight:700}.sjc-days .today{outline:1px solid #9ab7aa}.sjc-foot{display:flex;justify-content:space-between;margin-top:8px}.sjc-foot button{padding:4px 9px;font-size:10px}.sjc-input{direction:rtl!important;text-align:right!important;cursor:pointer!important}@media(max-width:520px){.sjc{width:280px}.sjc-days button,.sjc-days i{min-height:32px}}';document.head.appendChild(s)}
function draw(v,y,m,sel){const d=pop.querySelector('.sjc-days');pop.querySelector('.sjc-title').textContent=fa(M[m-1]+' '+y);d.innerHTML='';for(let i=0;i<offset(y,m);i++)d.insertAdjacentHTML('beforeend','<i></i>');const t=today();for(let x=1;x<=days(y,m);x++){const b=document.createElement('button');b.type='button';b.textContent=fa(x);if(sel&&sel[0]===y&&sel[1]===m&&sel[2]===x)b.classList.add('sel');if(t&&t[0]===y&&t[1]===m&&t[2]===x)b.classList.add('today');b.onclick=()=>{const j=[y,m,x];if(!iso(j))return;v.value=fa(`${y}/${pad(m)}/${pad(x)}`);v.dispatchEvent(new Event('input',{bubbles:true}));v.dispatchEvent(new Event('change',{bubbles:true}));close()};d.appendChild(b)}}
function open(v){close();addCss();active=v;const cur=parse(v.value)||today();let y=cur[0],m=cur[1],sel=parse(v.value);pop=document.createElement('div');pop.className='sjc';pop.innerHTML='<div class="sjc-head"><button type="button" data-prev>‹</button><div class="sjc-title"></div><button type="button" data-next>›</button></div><div class="sjc-week">'+W.map(x=>`<span>${x}</span>`).join('')+'</div><div class="sjc-days"></div><div class="sjc-foot"><button type="button" data-today>امروز</button><button type="button" data-clear>پاک کردن</button></div>';document.body.appendChild(pop);draw(v,y,m,sel);pop.querySelector('[data-prev]').onclick=()=>{m--;if(m<1){m=12;y--}draw(v,y,m,sel)};pop.querySelector('[data-next]').onclick=()=>{m++;if(m>12){m=1;y++}draw(v,y,m,sel)};pop.querySelector('[data-today]').onclick=()=>{const t=today();if(t){v.value=fa(`${t[0]}/${pad(t[1])}/${pad(t[2])}`);v.dispatchEvent(new Event('change',{bubbles:true}))}close()};pop.querySelector('[data-clear]').onclick=()=>{v.value='';v.dispatchEvent(new Event('change',{bubbles:true}));close()};const r=v.getBoundingClientRect(),w=Math.min(278,innerWidth-20);pop.style.width=w+'px';pop.style.left=Math.max(10,Math.min(r.left,innerWidth-w-10))+'px';pop.style.top=Math.max(10,Math.min(r.bottom+6,innerHeight-330))+'px'}
function targets(){return document.querySelectorAll('#placementDate,#productionStartDate,#evaluationDate,#eventDate,.jalali-input')}
function setup(){if(!DS())return;addCss();targets().forEach(v=>{if(v.dataset.sjc==='1')return;v.dataset.sjc='1';v.classList.add('sjc-input');v.setAttribute('readonly','readonly');v.setAttribute('autocomplete','off');v.setAttribute('inputmode','none');v.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open(v)},true);v.addEventListener('focus',e=>{e.preventDefault();e.stopPropagation()},true)})}
document.addEventListener('click',e=>{if(pop&&!pop.contains(e.target)&&e.target!==active)close()},true);window.addEventListener('resize',close);window.addEventListener('scroll',close,true);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();new MutationObserver(setup).observe(document.documentElement,{childList:true,subtree:true});
})();
