/* ADINE BROILER PERFORMANCE INTELLIGENCE — LIFECYCLE GUARD V1
 * Presentation/lifecycle isolation only.
 * Prevents the intelligence shell from being destroyed and recreated by the
 * top-level reports renderer when users move between report tabs.
 * Does not calculate, mutate, or persist any poultry data.
 */
(function(global){
  'use strict';
  if(global.__ADINE_BPI_LIFECYCLE_GUARD_V1__) return;
  global.__ADINE_BPI_LIFECYCLE_GUARD_V1__=true;

  var PARK_ID='adine-bpi-shell-parking-v1';
  var SHELL_ID='broiler-performance-intelligence-v3-shell';
  var rootId='root';
  var busy=false;

  function root(){return document.getElementById(rootId)}
  function shell(){return document.getElementById(SHELL_ID)}
  function activeReportTab(){
    return document.querySelector('.report-tab.active')?.getAttribute('data-tab') || null;
  }
  function parking(){
    var p=document.getElementById(PARK_ID);
    if(!p){
      p=document.createElement('div');
      p.id=PARK_ID;
      p.hidden=true;
      p.setAttribute('aria-hidden','true');
      p.style.display='none';
      (document.body||document.documentElement).appendChild(p);
    }
    return p;
  }
  function park(){
    var s=shell();
    if(!s || busy) return false;
    busy=true;
    try{parking().appendChild(s);return true}
    finally{busy=false}
  }
  function restore(){
    var r=root(),p=document.getElementById(PARK_ID),s=p?.querySelector('#'+SHELL_ID);
    if(!r||!s||busy)return false;
    busy=true;
    try{
      r.replaceChildren(s);
      return true;
    }finally{busy=false}
  }
  function quarantineLegacy(){
    document.querySelectorAll('#broiler-intelligence-panel').forEach(function(el){
      if(el.id!=='broiler-performance-intelligence-v3-shell') el.remove();
    });
  }
  function reconcile(){
    if(busy)return;
    quarantineLegacy();
    var tab=activeReportTab(),r=root(),s=shell();
    if(!r || !tab)return;
    if(tab==='overall'){
      if(!r.querySelector('#'+SHELL_ID)) restore();
    }else{
      if(r.querySelector('#'+SHELL_ID)) park();
    }
  }
  function start(){
    if(!document.body)return;
    parking();
    reconcile();
    if(typeof MutationObserver!=='undefined'){
      var observer=new MutationObserver(function(){
        if(busy)return;
        queueMicrotask(reconcile);
      });
      observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','id']});
      global.__ADINE_BPI_LIFECYCLE_OBSERVER_V1__=observer;
    }
    document.addEventListener('click',function(e){
      if(e.target?.closest?.('.report-tab')) setTimeout(reconcile,0);
    },true);
    global.addEventListener('pageshow',function(){setTimeout(reconcile,0)});
    global.addEventListener('popstate',function(){setTimeout(reconcile,0)});
    global.addEventListener('adine:report-ready',function(){setTimeout(reconcile,0)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})(window);
