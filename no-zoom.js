/* Adine Global iOS No-Zoom Guard
 * Presentation-only: prevents Safari auto/persistent zoom while preserving app logic.
 */
(function(){
  "use strict";
  try {
    var meta=document.querySelector('meta[name="viewport"]');
    if(!meta){
      meta=document.createElement("meta");
      meta.name="viewport";
      (document.head||document.documentElement).appendChild(meta);
    }
    meta.setAttribute("content","width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");
    var style=document.createElement("style");
    style.id="adine-global-no-zoom-style";
    style.textContent='html{-webkit-text-size-adjust:100%!important;text-size-adjust:100%!important}input,select,textarea,button{touch-action:manipulation}input,select,textarea{font-size:16px!important}';
    (document.head||document.documentElement).appendChild(style);
  } catch(e) { console.warn("Global no-zoom guard:",e); }
})();
