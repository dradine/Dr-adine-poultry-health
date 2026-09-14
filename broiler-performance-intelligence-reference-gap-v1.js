/* ADINE BROILER PERFORMANCE — REFERENCE-AWARE TREND LAYER V11
 * Isolated, read-only presentation layer.
 * Canonical weekly calculations and standards are never changed.
 * Position and trend are intentionally separated.
 * Numeric display keeps signed percentages explicitly LTR.
 * Visual treatment maps directly to the semantic status of each metric.
 */
(function(global){
'use strict';
if(global.__ADINE_REFERENCE_LAYER_V11__) return;
global.__ADINE_REFERENCE_LAYER_V11__=true;
const n=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
const fmt=(v,d=1)=>{const x=n(v);return x===null?'—':x.toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})};
const signed=(v,d=1)=>{const x=n(v);if(x===null)return'—';return `<span dir="ltr" class="bpi3-signed-number">${x>0?'+':''}${fmt(x,d)}٪</span>`};
const card=label=>[...document.querySelectorAll('.bpi3-card')].find(c=>c.querySelector('.bpi3-card-label')?.textContent.trim()===label);
function injectStyle(){if(document.getElementById('bpi3-reference-layer-v11-style'))return;const s=document.createElement('style');s.id='bpi3-reference-layer-v11-style';s.textContent=`
/* Premium, status-aware card system */
.bpi3-reference-card{position:relative;overflow:hidden;border:1px solid #e2e8f0!important;border-right:4px solid #cbd5e1!important;border-radius:16px!important;background:linear-gradient(145deg,#fff 0%,#f8fafc 100%)!important;box-shadow:0 5px 18px rgba(15,23,42,.055),0 1px 2px rgba(15,23,42,.04)!important;transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease,background .2s ease}
.bpi3-reference-card::before{content:"";position:absolute;inset:0 auto 0 0;width:2px;background:#cbd5e1;opacity:.55}
.bpi3-reference-card .bpi3-card-label{font-weight:850!important;letter-spacing:-.15px}
.bpi3-reference-card .bpi3-card-value{font-size:15px!important;line-height:1.75!important;font-weight:850!important;letter-spacing:-.2px}
.bpi3-reference-card .bpi3-card-sub{color:#475569!important}
.bpi3-ref-summary{display:block;margin-top:4px;font-size:10px;font-weight:850;line-height:1.7}
.bpi3-ref-detail{display:grid;gap:3px;margin-top:8px;font-size:10px;line-height:1.85}
.bpi3-ref-row{display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:1px solid rgba(148,163,184,.16);padding:2px 0}
.bpi3-ref-row:last-child{border-bottom:0}
.bpi3-ref-key{color:#64748b;font-weight:650}
.bpi3-ref-val{color:#172033;font-weight:800;text-align:left}
.bpi3-signed-number{direction:ltr;unicode-bidi:isolate;display:inline-block;white-space:nowrap;font-variant-numeric:tabular-nums}
.bpi3-unit-label{font-size:9px;color:#64748b;font-weight:700}
.bpi3-ref-interpret{margin-top:9px;padding:8px 9px;border-radius:11px;background:#f8fafc;color:#334155;font-size:10px;line-height:1.95;border:1px solid rgba(148,163,184,.16)}
/* Green = favorable; amber = caution/change; red = unfavorable; neutral = insufficient/near reference */
.bpi3-reference-card.ref-good{border-color:#bbf7d0!important;border-right-color:#16a34a!important;background:linear-gradient(145deg,#ffffff 0%,#f0fdf4 100%)!important;box-shadow:0 7px 22px rgba(22,163,74,.09),0 1px 3px rgba(22,163,74,.08)!important}
.bpi3-reference-card.ref-good::before{background:#22c55e;opacity:.9}
.bpi3-reference-card.ref-good .bpi3-card-value,.bpi3-reference-card.ref-good .bpi3-ref-summary{color:#15803d!important}
.bpi3-reference-card.ref-good .bpi3-ref-interpret{background:#f0fdf4;border-color:#bbf7d0;color:#166534}
.bpi3-reference-card.ref-watch{border-color:#e7d7a2!important;border-right-color:#b7791f!important;background:linear-gradient(145deg,#fffdf7 0%,#fffbeb 100%)!important;box-shadow:0 7px 22px rgba(180,124,25,.095),0 1px 3px rgba(180,124,25,.07)!important}
.bpi3-reference-card.ref-watch::before{background:#c58a24;opacity:.9}
.bpi3-reference-card.ref-watch .bpi3-card-value,.bpi3-reference-card.ref-watch .bpi3-ref-summary{color:#9a6500!important}
.bpi3-reference-card.ref-watch .bpi3-ref-interpret{background:#fff8df;border-color:#ead8a3;color:#765313}
.bpi3-reference-card.ref-bad{border-color:#fecaca!important;border-right-color:#dc2626!important;background:linear-gradient(145deg,#fffafa 0%,#fef2f2 100%)!important;box-shadow:0 7px 22px rgba(220,38,38,.08),0 1px 3px rgba(220,38,38,.07)!important}
.bpi3-reference-card.ref-bad::before{background:#ef4444;opacity:.9}
.bpi3-reference-card.ref-bad .bpi3-card-value,.bpi3-reference-card.ref-bad .bpi3-ref-summary{color:#b91c1c!important}
.bpi3-reference-card.ref-bad .bpi3-ref-interpret{background:#fef2f2;border-color:#fecaca;color:#991b1b}
.bpi3-reference-card.ref-neutral{border-color:#dbe3ec!important;border-right-color:#94a3b8!important;background:linear-gradient(145deg,#fff 0%,#f8fafc 100%)!important;box-shadow:0 5px 18px rgba(15,23,42,.05)!important}
.bpi3-reference-card.ref-neutral::before{background:#94a3b8;opacity:.7}
.bpi3-reference-card.ref-neutral .bpi3-card-value,.bpi3-reference-card.ref-neutral .bpi3-ref-summary{color:#475569!important}
.bpi3-reference-card.ref-neutral .bpi3-ref-interpret{background:#f8fafc;border-color:#dbe3ec}
@media(max-width:700px){.bpi3-reference-card{border-radius:14px!important;box-shadow:0 4px 14px rgba(15,23,42,.055)!important}.bpi3-reference-card .bpi3-card-value{font-size:14px!important}.bpi3-ref-detail{font-size:9.5px}.bpi3-ref-interpret{font-size:9.5px;padding:7px 8px}}
`;(document.head||document.documentElement).appendChild(s)}
function sourceLabel(row,key){const v=n(row?.[key]),s=String(row?.[key+'Source']??row?.standardSource??'').trim().toLowerCase();const name=row?.[key+'SourceName']??row?.[key+'SourceLabel']??row?.standardSourceName??row?.standardSourceLabel;const year=n(row?.[key+'SourceYear']??row?.standardSourceYear);let base=s==='official'?'مرجع رسمی':s==='official-derived'?'مرجع رسمی مشتق‌شده':s==='scientific'?'مرجع علمی':s==='management'?'مرجع مدیریتی':v!==null?'مرجع عددی موجود':'مرجع معتبر موجود نیست';if(name)base+=` · ${name}`;if(year)base+=` (${fmt(year,0)})`;return base}
/* CRITICAL: standards are owned by the weekly-report model. This layer is presentation-only.
   Never call calculate_performance_intelligence or any other independent standards resolver here.
   The rows supplied by AdineReportRouter -> AdineBroilerReportEngine are the single source of truth. */
async function resolveRows(rows){return(rows||[]).map(r=>({...r}))}
function statusClass(ev){if(!ev?.available)return'ref-neutral';const p=ev.position?.favorable,t=ev.trend?.mode;if(p===true){if(t==='advantage_reduced'||t==='gap_worsened')return'ref-watch';return'ref-good'}if(p===false){if(t==='gap_improved')return'ref-watch';return'ref-bad'}return'ref-neutral'}
function directionText(ev){return ev?.outlook||'برای قضاوت روند داده کافی نیست.'}
function paint(c,ev,d){if(!c||!ev?.available)return;if(!c.isConnected)return;c.classList.remove('good','warn','bad','ref-good','ref-watch','ref-bad','ref-neutral');c.classList.add('bpi3-reference-card',statusClass(ev));const value=c.querySelector('.bpi3-card-value'),sub=c.querySelector('.bpi3-card-sub');if(value)value.innerHTML=`${ev.trend.arrow} ${ev.trend.label}<span class="bpi3-ref-summary">${ev.position.label}</span>`;const slope=ev.actualSlope?.available?`${fmt(ev.actualSlope.slope,d.slope)} ${d.unit}`:'برای شیب توصیفی حداقل ۳ ثبت لازم است';const source=sourceLabel(ev.currentRow,d.referenceKey);const rows=[['مبنای مقایسه',source],['شیب توصیفی واقعی',slope],['فاصله فعلی از مرجع',signed(ev.currentGap,1)],['فاصله ثبت قبلی',signed(ev.previousGap,1)],['تغییر فاصله',`${signed(ev.gapChange,1)} <span class="bpi3-unit-label">واحد درصد</span>`],[`تغییر ${d.label} واقعی`,signed(ev.actualChange,1)],['تغییر مرجع',signed(ev.referenceChange,1)]];if(sub)sub.innerHTML=`<div class="bpi3-ref-detail">${rows.map(r=>`<div class="bpi3-ref-row"><span class="bpi3-ref-key">${r[0]}</span><span class="bpi3-ref-val">${r[1]}</span></div>`).join('')}</div><div class="bpi3-ref-interpret"><b>تفسیر:</b> ${directionText(ev)}</div>`}
function paintCv(c,rows,Interpreter){if(!c)return;const a=(rows||[]).filter(r=>n(r.cv)!==null&&n(r.age)!==null).sort((x,y)=>n(x.age)-n(y.age));if(a.length<2)return;const hasRef=n(a[a.length-1].standardCv)!==null;if(hasRef){const ev=Interpreter.build('cv',a,{actualKey:'cv',referenceKey:'standardCv',direction:'lower',label:'CV',unit:'/ روز'});if(ev?.available){ev.currentRow=ev.points[ev.points.length-1].row;paint(c,ev,{label:'CV',referenceKey:'standardCv',slope:4,unit:'/ روز'});return}}
const cur=a[a.length-1],prev=a[a.length-2],ch=(n(cur.cv)!==null&&n(prev.cv)!==null&&n(prev.cv)!==0)?(cur.cv-prev.cv)/Math.abs(prev.cv)*100:null;c.classList.remove('good','warn','bad','ref-good','ref-watch','ref-bad','ref-neutral');c.classList.add('bpi3-reference-card',ch!==null&&ch<0?'ref-good':ch!==null&&ch>0?'ref-bad':'ref-neutral');const v=c.querySelector('.bpi3-card-value'),sub=c.querySelector('.bpi3-card-sub');if(v)v.innerHTML=`${ch===null?'→ تغییر CV قابل قضاوت نیست':ch>0?'↗ پراکندگی بیشتر':'↘ پراکندگی کمتر'}<span class="bpi3-ref-summary">مرجع معتبر CV برای این ثبت در دسترس نیست</span>`;const slope=(()=>{const pts=a.map(r=>({x:n(r.age),y:n(r.cv)}));if(pts.length<3)return 'برای شیب توصیفی حداقل ۳ ثبت لازم است';const x=pts.map(p=>p.x),y=pts.map(p=>p.y),mx=x.reduce((s,z)=>s+z,0)/x.length,my=y.reduce((s,z)=>s+z,0)/y.length,sxx=x.reduce((s,z)=>s+(z-mx)**2,0);if(!sxx)return'قابل محاسبه نیست';return `${fmt(x.reduce((s,z,i)=>s+(z-mx)*(y[i]-my),0)/sxx,4)} / روز`})();if(sub)sub.innerHTML=`<div class="bpi3-ref-detail"><div class="bpi3-ref-row"><span class="bpi3-ref-key">مبنای مقایسه</span><span class="bpi3-ref-val">بدون مرجع معتبر</span></div><div class="bpi3-ref-row"><span class="bpi3-ref-key">CV ثبت فعلی</span><span class="bpi3-ref-val">${fmt(cur.cv,1)}٪</span></div><div class="bpi3-ref-row"><span class="bpi3-ref-key">CV ثبت قبلی</span><span class="bpi3-ref-val">${fmt(prev.cv,1)}٪</span></div><div class="bpi3-ref-row"><span class="bpi3-ref-key">تغییر CV</span><span class="bpi3-ref-val">${signed(ch,1)}</span></div><div class="bpi3-ref-row"><span class="bpi3-ref-key">شیب توصیفی</span><span class="bpi3-ref-val">${slope}</span></div></div><div class="bpi3-ref-interpret"><b>تفسیر:</b> ${ch===null?'داده کافی برای تفسیر تغییر CV نداریم.':ch>0?'پراکندگی وزن افزایش یافته و یکنواختی نسبت به ثبت قبلی نامطلوب‌تر شده است؛ این شاخص باید همراه با وزن، تلفات و شرایط مدیریتی بررسی شود.':'پراکندگی وزن کاهش یافته و یکنواختی نسبت به ثبت قبلی بهتر شده است.'}</div>`}
let running=false,lastKey='';async function render(){const panel=document.querySelector('#broiler-performance-intelligence-v3-shell [data-bpi3-panel="intelligence"]');if(!panel)return;const router=global.AdineReportRouter,Interpreter=global.AdineBroilerReferenceInterpreterV1;if(!router||!Interpreter)return;const id=router.currentFlockId();if(!id||running)return;running=true;try{const[flock,raw]=await Promise.all([router.getFlock(id),router.getWeeklyRecords(id)]);const model=router.buildModel(flock,raw),rows=await resolveRows(model?.rows||[]);const key=JSON.stringify(rows.map(r=>[r.age,r.weight,r.cumulativeFcr,r.cv,r.standardWeight,r.standardCumulativeFcr,r.standardCv,r.standardWeightSource,r.standardCumulativeFcrSource,r.standardCvSource]));if(key===lastKey)return;lastKey=key;const w=Interpreter.build('weight',rows,{actualKey:'weight',referenceKey:'standardWeight',direction:'higher',label:'وزن',unit:'g/day'});const f=Interpreter.build('fcr',rows,{actualKey:'cumulativeFcr',referenceKey:'standardCumulativeFcr',direction:'lower',label:'FCR تجمعی',unit:'واحد FCR/day'});if(w?.available)w.currentRow=w.points[w.points.length-1].row;if(f?.available)f.currentRow=f.points[f.points.length-1].row;paint(card('روند وزن'),w,{label:'وزن',referenceKey:'standardWeight',slope:1,unit:'g/day'});paint(card('روند FCR'),f,{label:'FCR تجمعی',referenceKey:'standardCumulativeFcr',slope:4,unit:'واحد FCR/day'});paintCv(card('روند CV'),rows,Interpreter)}catch(e){console.warn('[Adine PI reference layer v11]',e)}finally{running=false}}
function start(){injectStyle();let tries=0;const timer=setInterval(()=>{render();if(++tries>=160)clearInterval(timer)},250);render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})(typeof window!=='undefined'?window:globalThis);
