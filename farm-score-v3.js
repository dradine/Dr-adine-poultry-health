/* ADINE FARM SCORE LOADER — CANONICAL V9
   Safe loader: never uses document.write, so it cannot corrupt reports.html.
*/
(function(g){
  "use strict";
  if (g.__ADINE_CANONICAL_ENGINE_REQUESTED) return;
  g.__ADINE_CANONICAL_ENGINE_REQUESTED = true;

  function load(src, next){
    if (document.querySelector('script[data-adine-src="'+src+'"]')) {
      if (next) next();
      return;
    }
    var s=document.createElement('script');
    s.src=src;
    s.async=false;
    s.dataset.adineSrc=src;
    s.onload=function(){ if(next) next(); };
    s.onerror=function(e){ console.error('Adine canonical loader failed:',src,e); };
    document.head.appendChild(s);
  }

  if (typeof document !== 'undefined') {
    load('benchmark-report-adapter-v1.js', function(){
      load('performance-period-engine-v9.js');
    });
  }
})(window);
