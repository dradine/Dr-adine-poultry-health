/* WEEKLY REPORT — VISUAL-ONLY FCR CHART. No calculation or standard changes. */
(function(){
'use strict';
if(String(location.pathname||'').toLowerCase().split('/').pop()!=='reports.html')return;
var db=window.supabaseClient;if(!db)return;
var id=(function(){var p=new URLSearchParams(location.search),x=p.get('flock_id')||p.get('flockId')||p.get('id');if(x)return x;try{var o=JSON.parse(localStorage.getItem('adine_poultry_current_selection')||'{}');return o.flockId||o.flock_id||null}catch(e){return null}})();
var N=function(v){var x=Number(String(v??'').replace(/[٬,]/g,'').replace('٫','.').replace(/[۰-۹]/g,function(c){return c.charCodeAt(0)-1776}).replace(/[٠-٩]/g,function(c){return c.charCodeAt(0)-1632}));return Number.isFinite(x)?x:null};
var F=function(v,d){return N(v)==null?'—':N(v).toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})};
var P=function(r,a){for(var i=0;i<a.length;i++){var x=N(r&&r[a[i]]);if(x!==null)return x}return null};
function std(r,key,flock){try{if(typeof window.resolvePoultryStandard!=='function')return null;var s=window.resolvePoultryStandard({productionType:flock.production_type,genetics:flock.genetics,strain:flock.strain,variant:flock.variant,ageDays:N(r.age_days)});return N(s&&s[key])}catch(e){return null}}
function removeLegacy(root){if(!root)return;root.querySelectorAll('canvas').forEach(function(x){var b=x.closest('.box');if(b)b.remove();else x.remove()});root.querySelectorAll('.chart').forEach(function(x){x.style.display='none';x.style.height='0';x.style.overflow='hidden'})}
function svgFcr(title,labels,actual,target){
 var vals=actual.concat(target).filter(function(v){return v!==null&&v>=0});
 if(!vals.length)return '<div class="wa2-empty">داده قابل رسم موجود نیست.</div>';
 var min=Math.min.apply(null,vals),max=Math.max.apply(null,vals),spread=max-min;
 var pad=spread>0?spread*0.08:Math.max(max*0.08,0.05);
 var lo=Math.max(0,min-pad),hi=max+pad;if(hi<=lo){lo=0;hi=Math.max(1,max+1)}
 var W=980,H=390,L=92,R=28,T=72,B=72,plotW=W-L-R,plotH=H-T-B,dx=labels.length>1?plotW/(labels.length-1):0;
 function x(i){return L+i*dx} function y(v){return T+(hi-v)/(hi-lo)*plotH}
 function path(arr){var d='',started=false;arr.forEach(function(v,i){if(v===null)return;d+=(started?' L':'M')+x(i).toFixed(1)+' '+y(v).toFixed(1);started=true});return d}
 function points(arr,stroke,fill){var out='';arr.forEach(function(v,i){if(v===null)return;var xx=x(i),yy=y(v);out+='<circle cx="'+xx.toFixed(1)+'" cy="'+yy.toFixed(1)+'" r="5.5" fill="'+fill+'" stroke="white" stroke-width="2"/><text x="'+xx.toFixed(1)+'" y="'+(yy-11).toFixed(1)+'" text-anchor="middle" font-size="11" font-weight="800" fill="'+stroke+'">'+F(v,3)+'</text>'});return out}
 var grid='',ticks=6;for(var i=0;i<ticks;i++){var v=lo+(hi-lo)*i/(ticks-1),yy=y(v);grid+='<line x1="'+L+'" y1="'+yy.toFixed(1)+'" x2="'+(W-R)+'" y2="'+yy.toFixed(1)+'" stroke="#dfe7e3" stroke-dasharray="4 5"/><text x="'+(L-12)+'" y="'+(yy+4).toFixed(1)+'" text-anchor="end" font-size="11" fill="#61716b">'+F(v,3)+'</text>'}
 var xl=labels.map(function(label,i){return '<text x="'+x(i).toFixed(1)+'" y="'+(H-35)+'" text-anchor="middle" font-size="11" fill="#61716b">'+label+'</text>'}).join('');
 return '<div class="wa2-title">'+title+' <small>FCR — کمتر بهتر است</small></div>'+ 
 '<div class="wa2-legend"><span><i class="wa2-line wa2-actual"></i>خط آبی: FCR هفتگی واقعی</span><span><i class="wa2-line wa2-target"></i>خط نارنجی: هدف مدیریتی FCR</span></div>'+ 
 '<div class="wa2-axis-note">محور Y = مقدار FCR واقعی، بدون تبدیل به اختلاف؛ محور X = هفته؛ اعداد کنار نقاط = مقدار همان هفته</div>'+ 
 '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="FCR هفتگی واقعی در برابر هدف مدیریتی">'+
 '<line x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+(H-B)+'" stroke="#51615b" stroke-width="1.2"/>'+ 
 '<line x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-R)+'" y2="'+(H-B)+'" stroke="#51615b" stroke-width="1.2"/>'+grid+xl+
 '<path d="'+path(actual)+'" fill="none" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'+points(actual,'#2563eb','#2563eb')+
 '<path d="'+path(target)+'" fill="none" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="8 5"/>'+points(target,'#b96b00','#f59e0b')+
 '<text x="'+(W/2)+'" y="'+(H-7)+'" text-anchor="middle" font-size="12" font-weight="800" fill="#51615b">هفته</text>'+ 
 '<text x="18" y="'+(H/2)+'" text-anchor="middle" font-size="12" font-weight="800" fill="#51615b" transform="rotate(-90 18 '+(H/2)+')">FCR</text>'+ 
 '</svg>';
}
async function run(){
 if(!id)return;try{
  var q=await db.from('flocks').select('*').eq('id',id).maybeSingle();if(q.error||!q.data)return;var flock=q.data;
  var w=await db.from('weekly_records').select('*').eq('flock_id',id).order('week_number',{ascending:true});if(w.error)return;var rows=w.data||[];if(!rows.length)return;
  var root=document.getElementById('root');if(!root)return;removeLegacy(root);
  var rsel=document.getElementById('week'),idx=Math.max(0,Number(rsel&&rsel.value)||0),cur=rows[idx]||rows[0],maxWeek=N(cur.week_number),rs=rows.filter(function(r){return N(r.week_number)<=maxWeek});
  var labels=rs.map(function(r){return 'هفته '+F(r.week_number,0)});
  var fcr=await db.rpc('get_flock_fcr_analysis_v4',{p_flock_id:id}),fr=!fcr.error?(fcr.data||[]):[];
  /* Rendering-only join: each FCR value is matched to the identical week_number. */
  var byWeek={};fr.forEach(function(x){var wk=N(x.week_number);if(wk!==null)byWeek[wk]=x});
  var fw=rs.map(function(r){var x=byWeek[N(r.week_number)];return x?N(x.weekly_fcr):null});
  var fm=rs.map(function(r){var x=byWeek[N(r.week_number)];return x?N(x.management_weekly_fcr):null});
  var fc=rs.map(function(r){var x=byWeek[N(r.week_number)];return x?N(x.cumulative_fcr):null});
  var fo=rs.map(function(r){var x=byWeek[N(r.week_number)];return x?N(x.official_cumulative_fcr):null});
  var wa=rs.map(function(r){return P(r,['average_weight_g','avg_weight_g','weight_g'])}),wr=rs.map(function(r){return std(r,'weight',flock)});
  root.querySelectorAll('.wa2').forEach(function(x){x.remove()});
  var sec=document.createElement('section');sec.className='section wa2';
  sec.innerHTML='<h2>گزارش تحلیلی و نمودارهای ارزیابی هفتگی</h2><div class="wa2-sub">ترسیم آماری داده‌های واقعی در برابر مراجع؛ هیچ محاسبه یا استانداردی در این لایه تغییر نمی‌کند.</div><div class="wa2-grid">'+
   '<div class="wa2-box">'+svgFcr('FCR هفتگی در برابر هدف مدیریتی',labels,fw,fm)+'</div>'+ 
   '<div class="wa2-box">'+svgFcr('FCR تجمعی در برابر استاندارد رسمی',labels,fc,fo)+'</div>'+ 
   '</div><div class="wa2-analysis"><b>تحلیل هفته '+F(cur.week_number,0)+'</b><br>FCR هفتگی: '+F(fw[idx],3)+' | هدف مدیریتی: '+F(fm[idx],3)+' | FCR تجمعی: '+F(fc[idx],3)+' | استاندارد رسمی تجمعی: '+F(fo[idx],3)+'</div>';
  root.appendChild(sec);
  if(rsel&&!rsel.__wa2){rsel.addEventListener('change',function(){setTimeout(run,0)});rsel.__wa2=true}
 }catch(e){console.error('Weekly visual FCR renderer',e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(run,2600)},{once:true});else setTimeout(run,2600);
})();
