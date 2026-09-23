/* ADINE — BROILER PERFORMANCE INTELLIGENCE UI FIXES V1
   UI-only patch. The PI engine already defines lower-is-better semantics for FCR and cumulative FCR.
   This patch prevents the presenter from displaying the intrinsic numeric decline as a negative event.
   It also removes the duplicated age-standard legend that appears immediately before the charts.
*/
(function(global){'use strict';
  const ROOT_ID='root';
  const DUP='۰ = استاندارد سنیهمان ارزیابیمثبت = بهتر از مرجعمنفی = ضعیف‌تر از مرجعخط پیوسته = مسیر مشاهده‌شدهخط انتهایی = چشم‌انداز مشروط';
  const normalize=s=>String(s||'').replace(/\s+/g,'').replace(/‌/g,'');
  const isFcrLabel=s=>{
    const x=String(s||'').replace(/\s+/g,' ').trim();
    return x==='FCR' || x==='FCR تجمعی' || x.includes('FCR هفتگی') || x.includes('FCR تجمعی');
  };
  function removeDuplicateLegend(root){
    const exact=[];
    root.querySelectorAll('*').forEach(el=>{
      const txt=normalize(el.textContent);
      if(txt===DUP) exact.push(el);
    });
    if(exact.length>1){
      // Keep the first legend near the Smart Trend header; remove later duplicate(s).
      exact.slice(1).forEach(el=>el.remove());
    }
  }
  function patchFcrCards(root){
    const model=global.__adinePerformanceIntelligenceModel||{};
    const keys=['fcr','cumulativeFcr'];
    keys.forEach(key=>{
      const state=model.states?.[key]||{};
      const trend=state.trend||{};
      const lowerBetter=true;
      const card=[...root.querySelectorAll('.pi-metric')].find(el=>{
        const label=el.querySelector('.pi-metric-label')?.textContent||'';
        return key==='fcr' ? (label.trim()==='FCR') : label.includes('FCR تجمعی');
      });
      if(!card)return;
      // For FCR, a lower trajectory is intrinsically favorable.
      card.classList.remove('trend-bad','trend-good','trend-neutral','trend-muted','critical','watch','good','excellent');
      const semantic=trend.direction==='improving'?'good':trend.direction==='worsening'?'bad':'neutral';
      card.classList.add('pi-fcr-semantic-'+semantic);
      const trendEl=card.querySelector('.pi-metric-trend');
      if(trendEl){
        const b=trendEl.querySelector('b');
        if(b)b.textContent=trend.direction==='improving'?'بهبود':trend.direction==='worsening'?'افت':'پایدار';
        const spans=[...trendEl.querySelectorAll('span')];
        const movement=trend.movement;
        let text='';
        if(movement==='better_farther')text=' • بهتر از استاندارد؛ فاصله عملکردی بیشتر';
        else if(movement==='closer')text=' • نزدیک‌تر به استاندارد سنی';
        else if(movement==='worse_farther')text=' • نامطلوب‌تر؛ فاصله عملکردی بیشتر';
        else if(movement==='crossed_to_better')text=' • عبور به سمت بهتر از استاندارد';
        else if(movement==='crossed_to_worse')text=' • عبور به سمت نامطلوب';
        else if(movement==='stable')text=' • فاصله عملکردی تقریباً ثابت';
        if(spans[0])spans[0].textContent=text;
      }
      // Mark the nearest chart/sparkline associated with this metric as favorable when the
      // actual FCR trajectory is improving. This is presentation-only; data remain untouched.
      let chart=card.nextElementSibling;
      if(!chart){chart=card.parentElement?.querySelector('.pi-sparkline, .pi-spark, svg');}
      if(chart){
        chart.classList.remove('pi-fcr-chart-bad','pi-fcr-chart-good');
        chart.classList.add(trend.direction==='improving'?'pi-fcr-chart-good':trend.direction==='worsening'?'pi-fcr-chart-bad':'pi-fcr-chart-neutral');
      }
    });
  }
  function patchChartVisuals(root){
    // The PI presenter uses SVG sparklines. Detect FCR chart containers by their nearby title,
    // then recolor only the observed/projection paths; keep the reference path neutral/dashed.
    root.querySelectorAll('svg').forEach(svg=>{
      const box=svg.closest('.pi-chart, .pi-sparkline, .pi-spark, .pi-trajectory, article, section, div');
      if(!box)return;
      const txt=box.textContent||'';
      if(!txt.includes('FCR'))return;
      const isCumulative=txt.includes('FCR تجمعی');
      const label=isCumulative?'FCR تجمعی':'FCR';
      if(!txt.includes(label))return;
      const model=global.__adinePerformanceIntelligenceModel||{};
      const key=isCumulative?'cumulativeFcr':'fcr';
      const direction=model.states?.[key]?.trend?.direction;
      if(direction!=='improving')return;
      const paths=[...svg.querySelectorAll('path,polyline')];
      paths.forEach((p,i)=>{
        // Do not recolor dashed reference/axis paths.
        const dash=p.getAttribute('stroke-dasharray');
        if(dash)return;
        if(p.getAttribute('fill')==='none' || p.tagName.toLowerCase()==='polyline'){
          p.setAttribute('stroke','var(--pi-fcr-good,#2f8f5b)');
          p.style.stroke='var(--pi-fcr-good,#2f8f5b)';
        }
      });
    });
  }
  function injectStyle(){
    if(document.getElementById('adine-pi-fcr-ui-fix-style'))return;
    const s=document.createElement('style');s.id='adine-pi-fcr-ui-fix-style';
    s.textContent=`
      .pi-metric.pi-fcr-semantic-good .pi-metric-trend b{color:#2f8f5b!important}
      .pi-metric.pi-fcr-semantic-good .pi-metric-dot{background:#2f8f5b!important}
      .pi-fcr-chart-good path,.pi-fcr-chart-good polyline{stroke:#2f8f5b!important}
    `;
    document.head.appendChild(s);
  }
  function run(){
    const root=document.getElementById(ROOT_ID);if(!root)return;
    injectStyle();
    removeDuplicateLegend(root);
    patchFcrCards(root);
    patchChartVisuals(root);
  }
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;run()})}
  function boot(){
    const root=document.getElementById(ROOT_ID);if(!root)return;
    run();
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    document.addEventListener('click',e=>{if(e.target?.closest?.('.report-tab[data-tab="overall"]'))setTimeout(run,50)},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  global.AdinePerformanceIntelligenceUIFixesV1={version:'PI-UI-FIXES-V1',run};
})(window);
