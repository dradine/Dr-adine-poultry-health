/* ADINEH HEALTH | Persian/Jalali date UI adapter
   Storage remains Gregorian ISO YYYY-MM-DD. UI is Persian/Jalali only. */
(function(){
  'use strict';
  const digits='۰۱۲۳۴۵۶۷۸۹';
  const toFa=s=>String(s??'').replace(/\d/g,d=>digits[d]);
  function boot(){
    if(!window.AdineDateSystem || !window.jQuery || !jQuery.fn.persianDatepicker) return;
    document.querySelectorAll('input[type="date"]').forEach(src=>{
      if(src.dataset.jalaliAdapter==='1') return;
      const id=src.id; if(!id) return;
      src.dataset.jalaliAdapter='1'; src.type='hidden'; src.required=false;
      const visible=document.createElement('input');
      visible.type='text'; visible.id=id+'Jalali'; visible.className=src.className;
      visible.setAttribute('inputmode','none'); visible.setAttribute('autocomplete','off'); visible.setAttribute('readonly','readonly');
      visible.placeholder='۱۴۰۵/۰۱/۰۱'; visible.setAttribute('aria-label','تاریخ شمسی');
      src.parentNode.insertBefore(visible,src);
      const sync=()=>{ visible.value=src.value?toFa(window.AdineDateSystem.isoToJalali(src.value)):''; };
      const setIso=iso=>{ src.value=iso||''; sync(); src.dispatchEvent(new Event('change',{bubbles:true})); src.dispatchEvent(new Event('input',{bubbles:true})); };
      jQuery(visible).persianDatepicker({format:'YYYY/MM/DD',autoClose:true,initialValue:false,observer:true,calendarType:'persian',toolbox:{calendarSwitch:{enabled:false}},onSelect:function(unix){
        const d=new Date(unix);
        const j=window.AdineDateSystem.gregorianToJalali(d.getFullYear(),d.getMonth()+1,d.getDate());
        setIso(j ? window.AdineDateSystem.jalaliToISO(j.join('/')) : '');
      }});
      sync();
    });
  }
  function start(){
    if(!window.AdineDateSystem){ const s=document.createElement('script'); s.src='date-system.js'; s.onload=()=>setTimeout(boot,0); document.head.appendChild(s); }
    else boot();
    setTimeout(boot,250); setTimeout(boot,1000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
