/* ADINE BPI — SHELL BOOTSTRAP V1
 * Presentation-only bootstrap.
 * Creates the two BPI tabs immediately after the comprehensive report is painted,
 * before the asynchronous intelligence/reference work completes.
 * No calculations, standards, data, or report engines are changed.
 */
(function(){
'use strict';
const ROOT_ID='root',SHELL_ID='broiler-performance-intelligence-v3-shell';
const root=()=>document.getElementById(ROOT_ID);
const overall=()=>document.querySelector('.report-tab.active')?.getAttribute('data-tab')==='overall';
function makeShell(r){
  if(!r||!overall())return null;
  const existing=r.querySelector('#'+SHELL_ID);
  if(existing)return existing;
  if(!r.querySelector('.cr2-hero,.cr2-chart-grid,.cr2-kpis'))return null;
  const old=Array.from(r.childNodes);
  const shell=document.createElement('div');
  shell.id=SHELL_ID;
  shell.className='bpi3-shell';
  const tabs=document.createElement('div');
  tabs.className='bpi3-tabs';
  tabs.innerHTML='<button type="button" class="bpi3-tab active" data-bpi3-tab="overall">تحلیل جامع عملکرد</button><button type="button" class="bpi3-tab" data-bpi3-tab="intelligence">هوش عملکرد گله</button>';
  const panel=document.createElement('div');
  panel.className='bpi3-panel active';
  panel.dataset.bpi3Panel='overall';
  old.forEach(x=>panel.appendChild(x));
  const intel=document.createElement('div');
  intel.className='bpi3-panel';
  intel.dataset.bpi3Panel='intelligence';
  intel.innerHTML='<div class="bpi3-loading">در حال آماده‌سازی هوش عملکرد گله…</div>';
  shell.append(tabs,panel,intel);
  r.appendChild(shell);
  return shell;
}
function ensure(){return makeShell(root());}
function tryUntilReady(){
  let n=0;
  const timer=setInterval(()=>{
    if(!overall()||ensure()||++n>80)clearInterval(timer);
  },50);
}
document.addEventListener('click',e=>{
  if(e.target?.closest?.('.report-tab[data-tab="overall"]'))tryUntilReady();
  const tab=e.target?.closest?.('.bpi3-tab');
  if(!tab)return;
  const shell=tab.closest('#'+SHELL_ID);
  if(!shell)return;
  shell.querySelectorAll('.bpi3-tab').forEach(b=>b.classList.toggle('active',b===tab));
  shell.querySelectorAll('.bpi3-panel').forEach(p=>p.classList.toggle('active',p.dataset.bpi3Panel===tab.dataset.bpi3Tab));
},{capture:true});
if(typeof MutationObserver!=='undefined'){
  const mo=new MutationObserver(()=>{if(overall()&&!document.querySelector('#'+SHELL_ID))ensure()});
  mo.observe(document.getElementById(ROOT_ID)||document.body,{subtree:true,childList:true});
}
})();
