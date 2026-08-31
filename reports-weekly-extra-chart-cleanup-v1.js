/* Weekly reports UI-only cleanup. Does not read/write or alter calculations, standards, or Supabase data. */
(function(){
  'use strict';
  if(String(location.pathname||'').toLowerCase().split('/').pop()!=='reports.html') return;
  const targets=[
    'وزن واقعی و استاندارد',
    'مقایسه FCR واقعی با هدف مدیریتی و استاندارد رسمی'
  ];
  function removeExtraBlocks(){
    let removed=0;
    const all=document.querySelectorAll('h1,h2,h3,h4,h5,h6,div,span,p');
    all.forEach(el=>{
      const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
      if(!text || !targets.some(t=>text===t || text.includes(t))) return;
      let node=el;
      for(let i=0;i<6 && node.parentElement;i++){
        if(node.classList?.contains('box') || node.classList?.contains('chart') || node.classList?.contains('section') || node.querySelector?.('canvas')){
          node.remove(); removed++; return;
        }
        node=node.parentElement;
      }
    });
    return removed;
  }
  function run(){
    removeExtraBlocks();
    if(window.__adineWeeklyExtraChartCleanupObserver) return;
    const root=document.getElementById('root');
    if(!root) return;
    let tries=0;
    const observer=new MutationObserver(function(){
      if(removeExtraBlocks()>=2 || ++tries>20){
        observer.disconnect();
        window.__adineWeeklyExtraChartCleanupObserver=null;
      }
    });
    window.__adineWeeklyExtraChartCleanupObserver=observer;
    observer.observe(root,{childList:true,subtree:true});
    setTimeout(function(){try{observer.disconnect()}catch(e){} window.__adineWeeklyExtraChartCleanupObserver=null},4000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
})();
