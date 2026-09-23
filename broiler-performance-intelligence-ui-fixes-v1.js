/* ADINE — BROILER PERFORMANCE INTELLIGENCE UI FIXES V2
   STRICT UI/PRESENTATION PATCH ONLY.
   No calculation, canonical standard, flock loading, navigation, or data mutation.
   FCR and cumulative FCR are lower-is-better: numeric decline = improvement.
*/
(function(global){'use strict';
  const ROOT_ID='root';
  const DUP='۰ = استاندارد سنیهمان ارزیابیمثبت = بهتر از مرجعمنفی = ضعیف‌تر از مرجعخط پیوسته = مسیر مشاهده‌شدهخط انتهایی = چشم‌انداز مشروط';
  const normalize=s=>String(s??'').replace(/[\s‌]+/g,'');
  const num=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
  function removeDuplicateLegend(root){
    const matches=[];
    root.querySelectorAll('*').forEach(el=>{if(normalize(el.textContent)===DUP)matches.push(el)});
    // The first occurrence belongs to the Smart Trend explanation. Only later copies are removed.
    for(let i=1;i<matches.length;i++)matches[i].remove();
  }
  function actualSeries(model,key){
    const rows=model?.series?.[key];
    if(!Array.isArray(rows))return [];
    return rows.map(x=>num(x?.actual)).filter(v=>v!==null);
  }
  function fcrDirection(model,key){
    const a=actualSeries(model,key);
    if(a.length<2)return 'neutral';
    const first=a[0],last=a[a.length-1];
    const eps=Math.max(Math.abs(first)*0.001,0.0001);
    // FCR: lower is better. Do not use the raw generic direction label here.
    if(last<first-eps)return 'improving';
    if(last>first+eps)return 'worsening';
    return 'stable';
  }
  function findMetric(root,key){
    return [...root.querySelectorAll('.pi-metric')].find(el=>{
      const label=(el.querySelector('.pi-metric-label')?.textContent||'').trim();
      return key==='fcr'?label==='FCR':label.includes('FCR تجمعی');
    });
  }
  function patchFcrCards(root){
    const model=global.__adinePerformanceIntelligenceModel||{};
    ['fcr','cumulativeFcr'].forEach(key=>{
      const card=findMetric(root,key);if(!card)return;
      const direction=fcrDirection(model,key);
      card.classList.remove('trend-bad','trend-good','trend-neutral','trend-muted','critical','watch','good','excellent');
      card.classList.add(direction==='improving'?'pi-fcr-semantic-good':direction==='worsening'?'pi-fcr-semantic-bad':'pi-fcr-semantic-neutral');
      const trend=card.querySelector('.pi-metric-trend');
      if(trend){
        const b=trend.querySelector('b');
        if(b)b.textContent=direction==='improving'?'بهبود':direction==='worsening'?'افت':'پایدار';
        const span=trend.querySelector('span');
        if(span)span.textContent=direction==='improving'?' • کاهش FCR در این شاخص بهبود عملکرد است':direction==='worsening'?' • افزایش FCR در این شاخص نامطلوب است':' • تغییر معناداری در مسیر FCR دیده نمی‌شود';
      }
    });
  }
  function patchFcrCharts(root){
    const model=global.__adinePerformanceIntelligenceModel||{};
    ['fcr','cumulativeFcr'].forEach(key=>{
      if(fcrDirection(model,key)!=='improving')return;
      const label=key==='cumulativeFcr'?'FCR تجمعی':'FCR';
      // Find the chart/sparkline by its nearest textual container. Reference/forecast dashed paths are untouched.
      [...root.querySelectorAll('svg')].forEach(svg=>{
        const box=svg.closest('.pi-chart,.pi-sparkline,.pi-spark,.pi-trajectory,article,section,div');
        if(!box||!(box.textContent||'').includes(label))return;
        [...svg.querySelectorAll('path,polyline')].forEach(p=>{
          if(p.getAttribute('stroke-dasharray'))return;
          const fill=p.getAttribute('fill');
          if(fill==='none'||p.tagName.toLowerCase()==='polyline'){
            p.style.setProperty('stroke','#4b927a','important');
            p.setAttribute('stroke','#4b927a');
          }
        });
      });
      const metric=findMetric(root,key);
      const chart=metric?.nextElementSibling||metric?.parentElement?.querySelector('.pi-sparkline,.pi-spark');
      chart?.classList.remove('pi-fcr-chart-bad','pi-fcr-chart-neutral');
      chart?.classList.add('pi-fcr-chart-good');
    });
  }
  function injectStyle(){
    if(document.getElementById('adine-pi-fcr-ui-fix-style'))return;
    const s=document.createElement('style');s.id='adine-pi-fcr-ui-fix-style';
    s.textContent=`
      .pi-metric.pi-fcr-semantic-good{background:linear-gradient(135deg,#eef9f3,#e2f3ea)!important;border-color:#9fd0b9!important}
      .pi-metric.pi-fcr-semantic-good:before{background:#4b927a!important}
      .pi-metric.pi-fcr-semantic-good .pi-metric-trend b{color:#347c65!important}
      .pi-metric.pi-fcr-semantic-bad{background:linear-gradient(135deg,#fff0ee,#ffe2df)!important;border-color:#df9d96!important}
      .pi-metric.pi-fcr-semantic-bad:before{background:#b85c52!important}
      .pi-metric.pi-fcr-semantic-bad .pi-metric-trend b{color:#a84e47!important}
      .pi-fcr-chart-good path,.pi-fcr-chart-good polyline{stroke:#4b927a!important}
    `;
    document.head.appendChild(s);
  }
  function run(){const root=document.getElementById(ROOT_ID);if(!root)return;injectStyle();removeDuplicateLegend(root);patchFcrCards(root);patchFcrCharts(root)}
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;run()})}
  function boot(){
    const root=document.getElementById(ROOT_ID);if(!root)return;
    run();
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    document.addEventListener('click',e=>{if(e.target?.closest?.('.report-tab[data-tab="overall"]'))setTimeout(run,80)},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  global.AdinePerformanceIntelligenceUIFixesV1={version:'PI-UI-FIXES-V2',run};
})(window);
