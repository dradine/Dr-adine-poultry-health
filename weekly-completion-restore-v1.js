/* ADINE - Weekly completion restore v2
   Robust broiler-only weekly completion panel.
   Does not depend on window.currentFlock because weekly.js uses a top-level lexical variable.
*/
(function(){
  'use strict';

  var PANEL_ID='weeklyBroilerCompletionPanel';
  var RATIO_ID='weeklyBroilerWaterFeedRatio';
  var LITTER_ID='weeklyBroilerLitterScore';

  function num(v){
    var s=String(v==null?'':v)
      .replace(/[۰-۹]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d);})
      .replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d);})
      .replace(/٬/g,'').replace(/,/g,'').replace(/٫/g,'.');
    var x=Number(s);
    return Number.isFinite(x)?x:null;
  }

  function getFlock(){
    try{
      if(typeof currentFlock!=='undefined' && currentFlock) return currentFlock;
    }catch(e){}
    return window.currentFlockForSpecialized || null;
  }

  function isBroiler(f){
    var t=String(f && (f.production_type || f.productionType || '')).trim().toLowerCase();
    return t.indexOf('گوشتی')!==-1 || t.indexOf('broiler')!==-1 || t.indexOf('meat')!==-1 || t.indexOf('گوش')!==-1;
  }

  function getHost(){return document.getElementById('specializedMetrics');}
  function getCard(){return document.getElementById('specializedMetricsCard');}

  function build(){
    var host=getHost(), card=getCard();
    if(!host || !card) return false;
    var panel=document.getElementById(PANEL_ID);
    if(!panel){
      panel=document.createElement('div');
      panel.id=PANEL_ID;
      panel.className='weekly-broiler-completion-panel';
      panel.innerHTML=
        '<div class="weekly-completion-title"><span class="required-star">★</span> تکمیل اطلاعات مهم گوشتی</div>'+
        '<div class="weekly-completion-sub">دو شاخص مهم برای تصمیم‌گیری همان هفته؛ سایر شاخص‌های تخصصی در «پایش تکمیلی» قرار دارند.</div>'+
        '<div class="form-grid weekly-completion-grid">'+
          '<div class="form-group">'+
            '<label for="'+RATIO_ID+'"><span class="required-star">★</span> نسبت آب به دان <span>(L/kg)</span></label>'+
            '<input id="'+RATIO_ID+'" data-weekly-specialized="water_feed_ratio" type="text" inputmode="decimal" readonly autocomplete="off" aria-readonly="true">'+
            '<small>خودکار از مصرف کل آب ÷ مصرف کل دان محاسبه می‌شود.</small>'+
          '</div>'+
          '<div class="form-group">'+
            '<label for="'+LITTER_ID+'"><span class="required-star">★</span> وضعیت بستر <span>(۰ تا ۵)</span></label>'+
            '<input id="'+LITTER_ID+'" data-weekly-specialized="litter_score" type="text" inputmode="decimal" autocomplete="off" min="0" max="5">'+
            '<small>۰ = عالی، ۵ = بسیار نامطلوب. این شاخص در ارزیابی گوشتی ذخیره می‌شود.</small>'+
          '</div>'+ 
        '</div>';
      host.insertBefore(panel,host.firstChild);
    }

    card.hidden=false;
    card.style.display='block';
    card.style.visibility='visible';
    card.style.opacity='1';

    updateRatio();
    return true;
  }

  function updateRatio(){
    var r=document.getElementById(RATIO_ID);
    if(!r) return;
    var feed=num(document.getElementById('feedTotal') && document.getElementById('feedTotal').value);
    var water=num(document.getElementById('waterTotal') && document.getElementById('waterTotal').value);
    if(feed!==null && feed>0 && water!==null && water>=0){
      r.value=(water/feed).toFixed(3);
    }else{
      r.value='';
    }
  }

  function apply(){
    var flock=getFlock();
    if(!flock || !isBroiler(flock)) return;
    build();
  }

  function bindInputs(){
    ['feedTotal','waterTotal'].forEach(function(id){
      var el=document.getElementById(id);
      if(el && !el.dataset.broilerRatioBound){
        el.dataset.broilerRatioBound='1';
        el.addEventListener('input',updateRatio);
        el.addEventListener('change',updateRatio);
      }
    });
    var litter=document.getElementById(LITTER_ID);
    if(litter && !litter.dataset.litterBound){
      litter.dataset.litterBound='1';
      litter.addEventListener('input',function(){
        var v=num(litter.value);
        if(v!==null){
          if(v<0) litter.value='0';
          if(v>5) litter.value='5';
        }
      });
    }
  }

  function run(){
    apply();
    bindInputs();
    updateRatio();
  }

  document.addEventListener('DOMContentLoaded',run);

  /* weekly.js loads the flock asynchronously. Keep watching the actual DOM/state,
     so the panel cannot disappear when the specialized renderer runs later. */
  var observer=new MutationObserver(function(){
    var flock=getFlock();
    if(flock && isBroiler(flock)) run();
  });
  function startObserver(){
    if(document.body) observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',startObserver);
  else startObserver();

  var attempts=0;
  var timer=setInterval(function(){
    run();
    attempts++;
    if(attempts>120) clearInterval(timer);
  },250);

  window.restoreWeeklyCompletion=run;
})();

/* v2 visual fallback styles are intentionally scoped to this component only. */
(function(){
  var css=document.createElement('style');
  css.textContent=''+
    '#weeklyBroilerCompletionPanel{display:block!important;visibility:visible!important;opacity:1!important;position:relative;z-index:2;margin:0 0 16px;padding:14px;border:1px solid rgba(37,99,235,.18);border-radius:14px;background:rgba(248,250,252,.9)}'+
    '#weeklyBroilerCompletionPanel .weekly-completion-title{font-weight:800;font-size:1.05rem;margin-bottom:6px}'+
    '#weeklyBroilerCompletionPanel .weekly-completion-sub{font-size:.86rem;line-height:1.8;margin-bottom:10px;opacity:.82}'+
    '#weeklyBroilerCompletionPanel .required-star{font-weight:900}';
  document.head.appendChild(css);
})();
