/* Adine Health Date Adapter - single Health datepicker */
(function(){
"use strict";
const PD="۰۱۲۳۴۵۶۷۸۹", AD="٠١٢٣٤٥٦٧٨٩";
function toEnglishDigits(v){return String(v??"").replace(/[۰-۹]/g,d=>String(PD.indexOf(d))).replace(/[٠-٩]/g,d=>String(AD.indexOf(d)));}
function loadEngine(){
 if(window.AdineDateSystem)return Promise.resolve(window.AdineDateSystem);
 return new Promise((resolve,reject)=>{
  const s=document.createElement("script");s.src="date-system.js";s.dataset.adineDateEngine="true";
  s.onload=()=>window.AdineDateSystem?resolve(window.AdineDateSystem):reject(new Error("Central date engine unavailable"));
  s.onerror=()=>reject(new Error("Unable to load date-system.js"));document.head.appendChild(s);
 });
}
function prepareDateFields(){document.querySelectorAll(".jalali-input").forEach(input=>{
 input.setAttribute("inputmode","numeric");input.setAttribute("autocomplete","off");
 if(input.dataset.adineDateInputBound==="true")return;input.dataset.adineDateInputBound="true";
 input.addEventListener("input",function(){this.value=toEnglishDigits(this.value).replace(/[^0-9/]/g,"");});
 input.addEventListener("blur",function(){const a=window.AdineDateSystem;if(a&&this.value.trim())this.setCustomValidity(a.isValidJalali(this.value)?"":"تاریخ شمسی واردشده معتبر نیست.");});
});}
function expose(a){if(!a)return;window.jalaliDate={jalaliToISO:a.jalaliToISO,isoToJalali:a.isoToJalali,todayJalali:a.todayJalali,isValidJalali:a.isValidJalali,prepareDateFields,toEnglishDigits};}
function lockViewport(){if(!/iPhone|iPad|iPod/i.test(navigator.userAgent)&&!(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1))return;let m=document.querySelector('meta[name="viewport"]');if(!m){m=document.createElement("meta");m.name="viewport";document.head.appendChild(m);}m.content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";}
function styles(){if(document.getElementById("adine-health-date-style"))return;const s=document.createElement("style");s.id="adine-health-date-style";s.textContent=`
html{-webkit-text-size-adjust:100%!important;text-size-adjust:100%!important}
.jalali-input{font-size:16px!important;line-height:22px!important;-webkit-appearance:none!important;appearance:none!important}
.datepicker-plot-area{width:238px!important;min-width:238px!important;max-width:calc(100vw - 24px)!important;box-sizing:border-box!important;padding:4px!important;font-size:12px!important;border-radius:11px!important}
.datepicker-plot-area .datepicker-header{padding:2px 0!important;margin:0!important}.datepicker-plot-area .datepicker-navigator{min-height:30px!important}.datepicker-plot-area .datepicker-navigator .pwt-btn{height:28px!important;line-height:28px!important;font-size:11px!important;padding:0 4px!important}.datepicker-plot-area .table-days{width:100%!important;table-layout:fixed!important;margin:0!important}.datepicker-plot-area .table-days th,.datepicker-plot-area .table-days td{width:14.2857%!important;height:28px!important;padding:0!important;margin:0!important;box-sizing:border-box!important}.datepicker-plot-area .table-days th{font-size:10px!important;line-height:20px!important}.datepicker-plot-area .table-days td span{width:24px!important;height:24px!important;line-height:24px!important;font-size:11px!important;margin:2px auto!important;border-radius:50%!important}.datepicker-plot-area .datepicker-footer{padding:2px 0!important;margin:0!important}.datepicker-plot-area .datepicker-footer .pwt-btn{min-height:25px!important;line-height:25px!important;font-size:10px!important;padding:0 5px!important}@media(max-width:480px){.datepicker-plot-area{width:min(238px,calc(100vw - 24px))!important;min-width:min(238px,calc(100vw - 24px))!important}}
`;document.head.appendChild(s);}
/* Keep only the last plot area. No MutationObserver: the previous observer could fight the plugin and recreate the duplicate. */
function keepLastCalendar(){const p=[...document.querySelectorAll(".datepicker-plot-area")];if(p.length<2)return;const keep=p[p.length-1];p.slice(0,-1).forEach(x=>{x.style.setProperty("display","none","important");x.style.setProperty("visibility","hidden","important");x.setAttribute("aria-hidden","true");});keep.style.removeProperty("display");keep.style.removeProperty("visibility");keep.removeAttribute("aria-hidden");}
function cleanupSoon(){keepLastCalendar();requestAnimationFrame(keepLastCalendar);setTimeout(keepLastCalendar,30);setTimeout(keepLastCalendar,100);}
function initHealthCalendar(){
 if(!window.jQuery||typeof window.jQuery.fn.persianDatepicker!=="function")return;
 lockViewport();styles();const $=window.jQuery;
 /* Initialize exactly ONE datepicker instance. It is shared by all Jalali inputs. */
 const inputs=$(".jalali-input");
 if(inputs.length){
  const first=inputs[0];
  if(!first.dataset.calendarInitialized){
   first.dataset.calendarInitialized="true";
   $(first).persianDatepicker({format:"YYYY/MM/DD",autoClose:true,initialValue:false,observer:true,calendarType:"persian",calendar:{persian:{locale:"fa",leapYearMode:"algorithmic"}},toolbox:{calendarSwitch:false,todayButton:{enabled:true,text:{fa:"امروز"}}},navigator:{enabled:true,scroll:{enabled:false}},responsive:false,timePicker:{enabled:false}});
  }
  /* Other date fields use the same picker by focusing the single owner input. */
  inputs.slice(1).each(function(){
   this.dataset.adineSharedDatepicker="true";
   this.addEventListener("click",function(){
    first.value=this.value||"";first.focus();
    $(first).persianDatepicker("show");
   });
  });
 }
 cleanupSoon();
}
function wait(){if(window.jQuery&&typeof window.jQuery.fn.persianDatepicker==="function")return initHealthCalendar();setTimeout(wait,200);}
window.initHealthCalendar=initHealthCalendar;
async function start(){lockViewport();styles();try{expose(await loadEngine());prepareDateFields();}catch(e){console.error("Health date adapter initialization error:",e);}wait();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();