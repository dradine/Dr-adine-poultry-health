/* ADINE — BROILER PERFORMANCE INTELLIGENCE UI FIXES V5
   STRICT UI/PRESENTATION ONLY.
   No engine/calculation/standards/data/flock loading/navigation changes.
   FCR semantics: compare the CURRENT actual value with the CURRENT age standard.
   Lower FCR than the standard = improvement; higher = decline.
*/
(function(global){'use strict';
const ROOT_ID='root';
const num=v=>{if(v==null||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
const model=()=>global.__adinePerformanceIntelligenceModel||{};

function currentFcrPosition(key){
  const m=model(), rows=m.series?.[key];
  if(!Array.isArray(rows)||!rows.length)return 'neutral';
  const last=rows[rows.length-1];
  const a=num(last?.actual), t=num(last?.target);
  if(a===null||t===null||t===0)return 'neutral';
  const eps=Math.max(Math.abs(t)*0.001,0.0001);
  return a<t-eps?'improving':a>t+eps?'worsening':'stable';
}

function isFcrCard(el,key){
  const label=(el.querySelector('.pi-chart-head b')?.textContent||'').trim();
  return key==='cumulativeFcr' ? label==='FCR تجمعی' : label==='FCR';
}
function isFcrMetric(el,key){
  const label=(el.querySelector('.pi-metric-label')?.textContent||'').trim();
  return key==='cumulativeFcr' ? label.includes('FCR تجمعی') : label==='FCR هفتگی';
}

function removeDuplicateLegend(root){
  // The renderer's second copy is the structured legend immediately above the chart grid.
  // Keep the first explanatory legend elsewhere in the section; remove only this chart-adjacent copy.
  root.querySelectorAll('.pi-smart-trend-legend').forEach(x=>x.remove());
}

function patchFcrMetricCards(root){
  ['fcr','cumulativeFcr'].forEach(key=>{
    const card=[...root.querySelectorAll('.pi-metric')].find(el=>isFcrMetric(el,key));
    if(!card)return;
    const d=currentFcrPosition(key);
    card.classList.remove('trend-bad','trend-good','trend-neutral','critical','watch','good','excellent','pi-fcr-semantic-good','pi-fcr-semantic-bad','pi-fcr-semantic-neutral');
    card.classList.add(d==='improving'?'pi-fcr-semantic-good':d==='worsening'?'pi-fcr-semantic-bad':'pi-fcr-semantic-neutral');
    const b=card.querySelector('.pi-metric-trend b'),sp=card.querySelector('.pi-metric-trend span');
    if(b)b.textContent=d==='improving'?'بهبود':d==='worsening'?'افت':'پایدار';
    if(sp)sp.textContent=d==='improving'?' • FCR پایین‌تر از مرجع سنی؛ وضعیت مطلوب‌تر':d==='worsening'?' • FCR بالاتر از مرجع سنی؛ وضعیت نامطلوب‌تر':' • FCR تقریباً روی مرجع سنی است';
  });
}

function patchFcrTrendCharts(root){
  ['fcr','cumulativeFcr'].forEach(key=>{
    const d=currentFcrPosition(key);
    const cards=[...root.querySelectorAll('.pi-trend-chart-card')].filter(el=>isFcrCard(el,key));
    cards.forEach(card=>{
      card.classList.remove('trend-bad','trend-good','trend-neutral','pi-fcr-chart-good','pi-fcr-chart-bad');
      card.classList.add(d==='improving'?'pi-fcr-chart-good':d==='worsening'?'pi-fcr-chart-bad':'trend-neutral');
      const head=card.querySelector('.pi-chart-head span');
      if(head){
        head.classList.remove('trend-bad','trend-good','trend-neutral');
        head.classList.add(d==='improving'?'trend-good':d==='worsening'?'trend-bad':'trend-neutral');
        head.textContent=d==='improving'?'↑ بهبود':d==='worsening'?'↓ افت':'→ پایدار';
      }
      // Only the actual FCR path is recolored; dashed reference and forecast paths stay untouched.
      const svg=card.querySelector('svg');
      if(svg){
        const actual=svg.querySelector('.pi-chart-main-line');
        if(actual){
          const c=d==='improving'?'#1f8a63':d==='worsening'?'#c3473e':'#7b8782';
          actual.style.setProperty('stroke',c,'important');
          actual.setAttribute('stroke',c);
        }
        const pts=svg.querySelectorAll('.pi-chart-point circle');
        pts.forEach((p,i)=>{
          // Point colors are already based on actual-vs-standard in the renderer; keep them intact.
          if(p.tagName.toLowerCase()==='circle' && p.getAttribute('r')==='5'){
            if(d==='improving'){p.style.setProperty('fill','#1f8a63','important');p.setAttribute('fill','#1f8a63');}
            else if(d==='worsening'){p.style.setProperty('fill','#c3473e','important');p.setAttribute('fill','#c3473e');}
          }
        });
      }
      // Do not rewrite the detailed "وضعیت فعلی / فاصله / چشم‌انداز" text.
      // Those values are produced by the canonical engine and remain untouched.
    });
  });
}

function injectStyle(){
  if(document.getElementById('adine-pi-ui-v4-style'))return;
  const s=document.createElement('style');s.id='adine-pi-ui-v4-style';
  s.textContent=`
.pi-metric.pi-fcr-semantic-good{background:linear-gradient(135deg,#eef9f3,#e2f3ea)!important;border-color:#9fd0b9!important}
.pi-metric.pi-fcr-semantic-good:before{background:#4b927a!important}
.pi-metric.pi-fcr-semantic-good .pi-metric-trend b{color:#347c65!important}
.pi-metric.pi-fcr-semantic-bad{background:linear-gradient(135deg,#fff0ee,#ffe2df)!important;border-color:#df9d96!important}
.pi-metric.pi-fcr-semantic-bad:before{background:#b85c52!important}
.pi-metric.pi-fcr-semantic-bad .pi-metric-trend b{color:#a84e47!important}
.pi-trend-chart-card.pi-fcr-chart-good .pi-chart-head span{color:#347c65!important}
.pi-trend-chart-card.pi-fcr-chart-bad .pi-chart-head span{color:#a84e47!important}
`;
  document.head.appendChild(s);
}
function run(){
  const root=document.getElementById(ROOT_ID);if(!root)return;
  injectStyle();
  removeDuplicateLegend(root);
  patchFcrMetricCards(root);
  patchFcrTrendCharts(root);
}
let busy=false;
function schedule(){if(busy)return;busy=true;requestAnimationFrame(()=>{busy=false;run()})}
function boot(){
  const root=document.getElementById(ROOT_ID);if(!root)return;
  run();
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('.report-tab[data-tab="overall"]')){
      setTimeout(run,50);setTimeout(run,200);setTimeout(run,500);
    }
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
global.AdinePerformanceIntelligenceUIFixesV1={version:'PI-UI-FIXES-V5',run};
})(window);
