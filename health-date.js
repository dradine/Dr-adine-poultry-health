/* Adine Health Date Adapter - Central Date Engine only */
(function () {
  "use strict";
  const PERSIAN_DIGITS="۰۱۲۳۴۵۶۷۸۹", ARABIC_DIGITS="٠١٢٣٤٥٦٧٨٩";
  function toEnglishDigits(v){return String(v??"").replace(/[۰-۹]/g,d=>String(PERSIAN_DIGITS.indexOf(d))).replace(/[٠-٩]/g,d=>String(ARABIC_DIGITS.indexOf(d)));}
  function loadCentralEngine(){
    if(window.AdineDateSystem)return Promise.resolve(window.AdineDateSystem);
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-adine-date-engine="true"]');
      if(existing){const started=Date.now();const wait=()=>{if(window.AdineDateSystem)return resolve(window.AdineDateSystem);if(Date.now()-started>5000)return reject(new Error("Central date engine did not initialize."));setTimeout(wait,25);};wait();return;}
      const script=document.createElement("script");script.src="date-system.js";script.dataset.adineDateEngine="true";
      script.onload=()=>window.AdineDateSystem?resolve(window.AdineDateSystem):reject(new Error("Central date engine loaded without API."));
      script.onerror=()=>reject(new Error("Unable to load date-system.js."));document.head.appendChild(script);
    });
  }
  function exposeCentralAPI(api){if(!api)return;window.jalaliDate={jalaliToISO:api.jalaliToISO,isoToJalali:api.isoToJalali,todayJalali:api.todayJalali,isValidJalali:api.isValidJalali,prepareDateFields,toEnglishDigits};}
  function prepareDateFields(){document.querySelectorAll(".jalali-input").forEach(input=>{
    input.setAttribute("inputmode","numeric");input.setAttribute("autocomplete","off");input.setAttribute("placeholder","۱۴۰۵/۰۵/۲۹");
    if(input.dataset.adineDateInputBound==="true")return;input.dataset.adineDateInputBound="true";
    input.addEventListener("input",function(){this.value=toEnglishDigits(this.value).replace(/[^0-9/]/g,"");});
    input.addEventListener("blur",function(){const api=window.AdineDateSystem;if(!api||!this.value.trim())return;this.setCustomValidity(api.isValidJalali(this.value)?"":"تاریخ شمسی واردشده معتبر نیست.");});
  });}
  async function initializeDateAdapter(){try{const api=await loadCentralEngine();exposeCentralAPI(api);prepareDateFields();}catch(e){console.error("Health date adapter initialization error:",e);}}

  /* iOS Safari fix: this page intentionally keeps a fixed viewport.
     This is the reliable solution for the persistent Safari auto-zoom
     seen when the Persian datepicker/input receives focus. */
  function lockHealthViewport(){
    const isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
    if(!isIOS)return;
    let meta=document.querySelector('meta[name="viewport"]');
    if(!meta){meta=document.createElement("meta");meta.name="viewport";document.head.appendChild(meta);}
    meta.setAttribute("content","width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");
  }

  function installMobileDateStyle(){
    if(document.getElementById("adine-health-date-style"))return;
    const style=document.createElement("style");style.id="adine-health-date-style";
    style.textContent=`
      html{-webkit-text-size-adjust:100% !important;text-size-adjust:100% !important}
      .jalali-input{font-size:16px !important;line-height:22px !important;-webkit-appearance:none;appearance:none}
      .jalali-input,.datepicker-plot-area input,.datepicker-plot-area select,.datepicker-plot-area button{-webkit-text-size-adjust:100% !important;text-size-adjust:100% !important}
      .datepicker-plot-area{width:238px !important;min-width:238px !important;max-width:calc(100vw - 24px) !important;box-sizing:border-box !important;padding:4px !important;font-size:12px !important;border-radius:11px !important}
      .datepicker-plot-area .datepicker-header{padding:2px 0 !important;margin:0 !important}
      .datepicker-plot-area .datepicker-navigator{min-height:30px !important}
      .datepicker-plot-area .datepicker-navigator .pwt-btn{height:28px !important;line-height:28px !important;font-size:11px !important;padding:0 4px !important}
      .datepicker-plot-area .table-days{width:100% !important;table-layout:fixed !important;margin:0 !important}
      .datepicker-plot-area .table-days th,.datepicker-plot-area .table-days td{width:14.2857% !important;height:28px !important;padding:0 !important;margin:0 !important;box-sizing:border-box !important}
      .datepicker-plot-area .table-days th{font-size:10px !important;line-height:20px !important}
      .datepicker-plot-area .table-days td span{width:24px !important;height:24px !important;line-height:24px !important;font-size:11px !important;margin:2px auto !important;border-radius:50% !important}
      .datepicker-plot-area .datepicker-footer{padding:2px 0 !important;margin:0 !important}
      .datepicker-plot-area .datepicker-footer .pwt-btn{min-height:25px !important;line-height:25px !important;font-size:10px !important;padding:0 5px !important}
      @media(max-width:480px){.datepicker-plot-area{width:min(238px,calc(100vw - 24px)) !important;min-width:min(238px,calc(100vw - 24px)) !important;max-width:calc(100vw - 24px) !important}}
    `;document.head.appendChild(style);
  }

  function initHealthCalendar(){
    if(!window.jQuery||typeof window.jQuery.fn.persianDatepicker!=="function")return;
    lockHealthViewport();installMobileDateStyle();
    const $=window.jQuery;
    $(".jalali-input").each(function(){
      if(this.dataset.calendarInitialized==="true")return;this.dataset.calendarInitialized="true";
      $(this).persianDatepicker({format:"YYYY/MM/DD",autoClose:true,initialValue:false,observer:true,calendarType:"persian",calendar:{persian:{locale:"fa",leapYearMode:"algorithmic"}},toolbox:{calendarSwitch:false,todayButton:{enabled:true,text:{fa:"امروز"}}},navigator:{enabled:true,scroll:{enabled:false}},responsive:false,timePicker:{enabled:false}});
    });
  }
  function waitForCalendar(){if(window.jQuery&&typeof window.jQuery.fn.persianDatepicker==="function")return initHealthCalendar();setTimeout(waitForCalendar,200);}
  window.initHealthCalendar=initHealthCalendar;
  function start(){lockHealthViewport();installMobileDateStyle();initializeDateAdapter();waitForCalendar();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();