(function(global){'use strict';
 const engine=global.AdineBroilerFCR;
 const VERSION='ADINE-PERFORMANCE-V5.1';
 const num=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
 const flockFor=()=>global.currentFlockForSpecialized||global.currentFlock||null;
 const typeOf=f=>{const t=String(f?.production_type||f?.productionType||'broiler').toLowerCase();return ['layer','تخمگذار','تخم‌گذار'].includes(t)?'layer':['breeder','مادر','مرغ مادر'].includes(t)?'breeder':'broiler'};
 const canonicalRows=(rows,f)=>engine?.canonical?engine.canonical(rows,f):[];
 function weeklyFCR(input){
   const p=input||{};
   const flock=flockFor();
   const prev={
     live_birds:num(p.openBirds??p.open_birds??flock?.initial_bird_count??flock?.initialBirdCount),
     average_weight_g:num(p.openWeight??p.open_weight_g??flock?.initial_average_weight_g??flock?.initialAverageWeightG),
     age_days:num(p.openAgeDays??p.open_age_days)??0
   };
   const curr={
     live_birds:num(p.closeBirds??p.close_birds),
     average_weight_g:num(p.closeWeight??p.close_weight_g),
     feed_total_kg:num(p.feedKg??p.feed_total_kg??p.feedTotalKg),
     age_days:num(p.closeAgeDays??p.close_age_days)??1
   };
   if(prev.live_birds==null||prev.live_birds<=0||prev.average_weight_g==null||prev.average_weight_g<=0||curr.live_birds==null||curr.live_birds<=0||curr.average_weight_g==null||curr.average_weight_g<=0||curr.feed_total_kg==null||curr.feed_total_kg<0)return null;
   const out=canonicalRows([prev,curr],flock);
   return out.length?out[out.length-1].weeklyFcr:null;
 }
 function cumulativeFCR(rows,f){return engine?.canonical?engine.canonical(rows||[],f).at(-1)?.cumulativeFcr??null:null}
 function latestWeekly(rows){return (rows||[]).slice().sort((a,b)=>num(a.age_days??a.ageDays)-num(b.age_days??b.ageDays)).at(-1)?.weeklyFcr??null}
 function latestCumulative(rows){return (rows||[]).slice().sort((a,b)=>num(a.age_days??a.ageDays)-num(b.age_days??b.ageDays)).at(-1)?.cumulativeFcr??null}
 function quality(rows){const r=rows||[];return {count:r.length,valid:r.filter(x=>x.weeklyFcr!=null).length}};
 global.AdinePerformance={version:VERSION,typeOf,canonicalRows,rows:canonicalRows,broilerWeeklyFCR:weeklyFCR,broilerCumulativeFCR:cumulativeFCR,latestWeekly,latestCumulative,quality};
 if(typeof document!=='undefined'&&!document.querySelector('script[data-adine-broiler-fcr-weekly-ui="1"]')){
   const s=document.createElement('script');
   s.src='broiler-fcr-weekly-ui-v1.js?v=1.2.0';
   s.async=false;
   s.dataset.adineBroilerFcrWeeklyUi='1';
   (document.head||document.documentElement).appendChild(s);
 }
})(typeof window!=='undefined'?window:globalThis);
