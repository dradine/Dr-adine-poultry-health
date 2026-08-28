"use strict";
(function(){
  const fa=/[۰-۹]/g, ar=/[٠-٩]/g;
  const latin=v=>String(v??"").replace(fa,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(ar,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  function bind(root=document){
    root.querySelectorAll('input[type="number"], input[data-numeric="true"]').forEach(input=>{
      if(input.dataset.persianDigitsReady==='1')return;
      input.dataset.persianDigitsReady='1';
      input.type='text';
      input.inputMode='numeric';
      input.autocomplete='off';
      input.setAttribute('pattern','[0-9۰-۹٠-٩]*');
      const normalize=()=>{const v=latin(input.value);if(v!==input.value)input.value=v};
      input.addEventListener('beforeinput',e=>{if(e.data&&/[^0-9۰-۹٠-٩]/.test(e.data))e.preventDefault()},{capture:true});
      input.addEventListener('input',normalize,{capture:true});
      input.addEventListener('change',normalize,{capture:true});
      input.addEventListener('blur',normalize,{capture:true});
      input.addEventListener('paste',e=>{const text=e.clipboardData?.getData('text')||'';if(/[۰-۹٠-٩]/.test(text)){e.preventDefault();const value=latin(text);const start=input.selectionStart??input.value.length,end=input.selectionEnd??input.value.length;input.value=input.value.slice(0,start)+value+input.value.slice(end);input.dispatchEvent(new Event('input',{bubbles:true}))}},{capture:true});
    });
  }
  function init(){
    bind(document);
    const observer=new MutationObserver(()=>bind(document));
    observer.observe(document.body,{childList:true,subtree:true});
    window.adineNormalizeHealthNumbers=latin;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();