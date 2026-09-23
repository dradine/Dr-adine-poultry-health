/* ADINE — BROILER PERFORMANCE INTELLIGENCE UI FIXES V3
   STRICT UI/PRESENTATION ONLY. No engine/calculation/standards/data/navigation changes.
*/
(function(global){'use strict';
const ROOT_ID='root';
const norm=s=>String(s??'').replace(/[\s‌]+/g,'').replace(/۰/g,'0').replace(/۱/g,'1').replace(/۲/g,'2').replace(/۳/g,'3').replace(/۴/g,'4').replace(/۵/g,'5').replace(/۶/g,'6').replace(/۷/g,'7').replace(/۸/g,'8').replace(/۹/g,'9');
const num=v=>{if(v==null||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
const model=()=>global.__adinePerformanceIntelligenceModel||{};
function series(key){const a=model().series?.[key];return Array.isArray(a)?a.map(x=>num(x?.actual)).filter(v=>v!==null):[]}
function direction(key){const a=series(key);if(a.length<2)return'neutral';const first=a[0],last=a[a.length-1],eps=Math.max(Math.abs(first)*.001,.0001);return last<first-eps?'improving':last>first+eps?'worsening':'stable'}
function removeDuplicateLegend(root){
 const wanted=['استاندارد سنی','همان ارزیابی','بهتر از مرجع','ضعیف‌تر از مرجع','مسیر مشاهده‌شده','چشم‌انداز مشروط'];
 const candidates=[...root.querySelectorAll('*')].filter(el=>{if(!el.children.length)return false;const t=norm(el.textContent);return wanted.every(x=>t.includes(norm(x)))&&t.length<220});
 // Keep the first explanatory legend; any later instance is the duplicate before the charts.
 if(candidates.length>1)candidates.slice(1).forEach(el=>el.remove());
}
function patchFcrText(root,key){
 const dir=direction(key),label=key==='cumulativeFcr'?'FCR تجمعی':'FCR';
 if(dir==='neutral')return;
 const containers=[...root.querySelectorAll('.pi-section, .pi-chart, .pi-sparkline, .pi-spark, .pi-trajectory, article, section, div')].filter(el=>(el.textContent||'').includes(label));
 containers.forEach(el=>{
   // Change only visible semantic labels belonging to this FCR block. Do not alter numeric data/reference text.
   [...el.querySelectorAll('b,strong,span,small,div')].forEach(node=>{
     if(node.children.length) return;
     const t=(node.textContent||'').trim();
     if(t==='افت' || t==='↓ افت' || t==='افت ↓') node.textContent=dir==='improving'?'بهبود':'افت';
   });
   if(dir==='improving'){
     el.classList.remove('trend-bad','pi-fcr-chart-bad');el.classList.add('trend-good','pi-fcr-chart-good');
     [...el.querySelectorAll('.pi-trend-icon')].forEach(i=>i.textContent='↑');
   }
 });
}
function patchFcrMetricCards(root){
 ['fcr','cumulativeFcr'].forEach(key=>{
  const card=[...root.querySelectorAll('.pi-metric')].find(el=>{const l=(el.querySelector('.pi-metric-label')?.textContent||'').trim();return key==='fcr'?l==='FCR':l.includes('FCR تجمعی')});
  if(!card)return;const d=direction(key);
  card.classList.remove('trend-bad','trend-good','trend-neutral','critical','watch','good','excellent');
  card.classList.add(d==='improving'?'pi-fcr-semantic-good':d==='worsening'?'pi-fcr-semantic-bad':'pi-fcr-semantic-neutral');
  const b=card.querySelector('.pi-metric-trend b'),sp=card.querySelector('.pi-metric-trend span');
  if(b)b.textContent=d==='improving'?'بهبود':d==='worsening'?'افت':'پایدار';
  if(sp)sp.textContent=d==='improving'?' • کاهش FCR در این شاخص بهبود عملکرد است':d==='worsening'?' • افزایش FCR در این شاخص نامطلوب است':' • تغییر معناداری در مسیر FCR دیده نمی‌شود';
 });
}
function recolorFcrSvg(root,key){
 if(direction(key)!=='improving')return;const label=key==='cumulativeFcr'?'FCR تجمعی':'FCR';
 [...root.querySelectorAll('svg')].forEach(svg=>{
   const box=svg.closest('.pi-section, .pi-chart, .pi-sparkline, .pi-spark, .pi-trajectory, article, section');
   if(!box||(box.textContent||'').indexOf(label)<0)return;
   [...svg.querySelectorAll('path,polyline')].forEach(p=>{if(p.getAttribute('stroke-dasharray'))return;if(p.getAttribute('fill')==='none'||p.tagName.toLowerCase()==='polyline'){p.style.setProperty('stroke','#4b927a','important');p.setAttribute('stroke','#4b927a')}});
 });
}
function inject(){if(document.getElementById('adine-pi-ui-v3-style'))return;const s=document.createElement('style');s.id='adine-pi-ui-v3-style';s.textContent=`
.pi-metric.pi-fcr-semantic-good{background:linear-gradient(135deg,#eef9f3,#e2f3ea)!important;border-color:#9fd0b9!important}.pi-metric.pi-fcr-semantic-good:before{background:#4b927a!important}.pi-metric.pi-fcr-semantic-good .pi-metric-trend b{color:#347c65!important}.pi-metric.pi-fcr-semantic-bad{background:linear-gradient(135deg,#fff0ee,#ffe2df)!important;border-color:#df9d96!important}.pi-metric.pi-fcr-semantic-bad:before{background:#b85c52!important}.pi-fcr-chart-good,.pi-fcr-chart-good .pi-trend{border-color:#9fd0b9!important}.pi-fcr-chart-good .pi-trend-icon{background:#4b927a!important}
`;document.head.appendChild(s)}
function run(){const r=document.getElementById(ROOT_ID);if(!r)return;inject();removeDuplicateLegend(r);patchFcrMetricCards(r);patchFcrText(r,'fcr');patchFcrText(r,'cumulativeFcr');recolorFcrSvg(r,'fcr');recolorFcrSvg(r,'cumulativeFcr')}
let busy=false;function schedule(){if(busy)return;busy=true;requestAnimationFrame(()=>{busy=false;run()})}
function boot(){const r=document.getElementById(ROOT_ID);if(!r)return;run();new MutationObserver(schedule).observe(r,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target?.closest?.('.report-tab[data-tab="overall"]')){setTimeout(run,50);setTimeout(run,250)}},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.AdinePerformanceIntelligenceUIFixesV1={version:'PI-UI-FIXES-V3',run};
})(window);
