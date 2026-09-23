/* ADINE — Adaptive Reference Warning V1 UI */
(function(g){
'use strict';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function pct(v){return Number.isFinite(Number(v))?(Number(v)>0?'+':'')+Number(v).toFixed(1)+'٪':'—'}
function render(model){
 const root=document.getElementById('root');if(!root||!model?.adaptiveWarning)return;
 const a=model.adaptiveWarning,labels={normal:'پایش عادی',watch:'نیازمند پایش',warning:'هشدار تطبیقی'};
 const cls=a.overall==='warning'?'arw-warning':a.overall==='watch'?'arw-watch':'arw-normal';
 let box=document.getElementById('adineAdaptiveReferenceWarning');if(!box){box=document.createElement('section');box.id='adineAdaptiveReferenceWarning';box.className='adaptive-reference-warning';root.appendChild(box)}
 const order=['weight','adg','fcr','cumulativeFcr','mortality','cv','u10','u15','epef'];
 const cards=order.map(k=>a.metrics[k]).filter(x=>x?.available).map(x=>'<div class="arw-metric '+(x.state==='warning'?'is-warning':x.state==='watch'?'is-watch':'')+'"><div class="arw-label">'+esc(x.label)+'</div><div class="arw-value">'+pct(x.currentGapPercent)+'</div><div class="arw-note">خط پایه: '+pct(x.baselineMedianPercent)+' · EWMA: '+pct(x.ewmaCurrentPercent)+'<br>مرجع: '+esc(x.reference?.sourceLabel||'استاندارد کاننیکال')+'</div></div>').join('');
 box.innerHTML='<div class="arw-head"><div><div class="arw-title">هشدار تطبیقی نسبت به مرجع سنی</div><div class="arw-sub">محاسبه فقط روی فاصله جهت‌دار از مرجع همان سن؛ مقادیر خام FCR/وزن مستقیماً مبنای هشدار نیستند. حداقل ۴ ارزیابی قبلی لازم است.</div></div><span class="arw-badge '+cls+'">'+labels[a.overall]+'</span></div><div class="arw-grid">'+(cards||'<div class="arw-note">برای فعال شدن هشدار تطبیقی هنوز داده کافی وجود ندارد.</div>')+'</div>';
}
g.addEventListener?.('adine:adaptive-warning',e=>render(e.detail));
g.addEventListener?.('adine:pi-rendered',()=>{const model=g.__adinePerformanceIntelligenceModel;if(model?.adaptiveWarning)render(model)});
g.AdineAdaptiveReferenceWarningUI={render};
})(window);
