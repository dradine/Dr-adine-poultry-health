/* ADINE — COMPREHENSIVE REPORT
   Weight Distribution & Adine Weight-Band presentation layer.
   Additive/read-only: does not alter weekly calculations, standards, FCR,
   navigation, Supabase data, or the canonical weight-band engine.
*/
"use strict";
(function(global){
  const ID="adine-weight-distribution-v1";
  const $=id=>document.getElementById(id);
  const num=v=>{if(v===null||v===undefined||v==='')return null;const x=Number(String(v).replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٬,]/g,'').replace('٫','.'));return Number.isFinite(x)?x:null};
  const fa=(v,d=0)=>{const x=num(v);return x===null?'—':x.toLocaleString('fa-IR',{minimumFractionDigits:d,maximumFractionDigits:d})};
  const pct=(v,d=1)=>num(v)===null?'—':fa(v,d)+'٪';
  const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function stats(weights){
    const w=weights.map(num).filter(x=>x!==null&&x>0).sort((a,b)=>a-b);
    if(!w.length)return null;
    const mean=w.reduce((a,b)=>a+b,0)/w.length;
    const sd=Math.sqrt(w.reduce((a,b)=>a+(b-mean)**2,0)/w.length);
    const median=w.length%2?w[(w.length-1)/2]:(w[w.length/2-1]+w[w.length/2])/2;
    const band=(t)=>{const lo=mean*(1-t/100),hi=mean*(1+t/100),c=w.filter(x=>x>=lo&&x<=hi).length;return{lo,hi,count:c,p:100*c/w.length};};
    const b10=band(10),b15=band(15);
    const targetBand=t=>{if(num(t)===null||num(t)<=0)return null;const c=num(t);return{lo:c*.9,hi:c*1.1,target:c};};
    return {w,n:w.length,mean,sd,cv:mean?sd*100/mean:null,median,min:w[0],max:w[w.length-1],range:w[w.length-1]-w[0],b10,b15,targetBand};
  }

  function bandCounts(w,center){
    if(!w.length||!Number.isFinite(center)||center<=0)return null;
    const b=[center*.85,center*.90,center*1.10,center*1.15];
    const c=[0,0,0,0,0];
    w.forEach(x=>{if(x<b[0])c[0]++;else if(x<b[1])c[1]++;else if(x<=b[2])c[2]++;else if(x<=b[3])c[3]++;else c[4]++;});
    return {bounds:b,counts:c};
  }

  function draw(canvas,s,target){
    if(!canvas||!s)return;
    const rect=canvas.getBoundingClientRect(),dpr=global.devicePixelRatio||1,w=Math.max(320,Math.floor(rect.width||canvas.parentElement?.clientWidth||600)),h=300;
    canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.height=h+'px';
    const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const pad={l:42,r:18,t:42,b:52},x0=pad.l,x1=w-pad.r,y0=pad.t,y1=h-pad.b;
    const center=target||s.mean;
    const lo=Math.min(s.min,center*.78),hi=Math.max(s.max,center*1.22),span=hi-lo||1;
    const X=v=>x0+(v-lo)/span*(x1-x0);
    const bands=[
      {a:lo,b:center*.85,label:'زیر ۱۵٪-',fill:'#fde8e8'},
      {a:center*.85,b:center*.90,label:'۱۵٪- تا ۱۰٪-',fill:'#fff1df'},
      {a:center*.90,b:center*1.10,label:'محدوده آدینه ±۱۰٪',fill:'#e5f5ee'},
      {a:center*1.10,b:center*1.15,label:'۱۰٪+ تا ۱۵٪+',fill:'#fff1df'},
      {a:center*1.15,b:hi,label:'بیش از ۱۵٪+',fill:'#fde8e8'}
    ];
    ctx.font='12px Tahoma';ctx.textAlign='center';ctx.textBaseline='middle';
    bands.forEach((b,i)=>{const a=Math.max(lo,b.a),z=Math.min(hi,b.b);if(z>a){ctx.fillStyle=b.fill;ctx.fillRect(X(a),y0,X(z)-X(a),y1-y0);}});
    ctx.strokeStyle='#d7dee5';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,y1);ctx.lineTo(x1,y1);ctx.stroke();
    for(let i=0;i<=5;i++){const v=lo+(hi-lo)*i/5,x=X(v);ctx.strokeStyle='#eef1f4';ctx.beginPath();ctx.moveTo(x,y0);ctx.lineTo(x,y1);ctx.stroke();ctx.fillStyle='#68737d';ctx.fillText(fa(v,0),x,y1+20);}
    const lines=[{v:center,label:target?'وزن هدف رسمی':'میانگین نمونه',color:'#1f7052',dash:[]},{v:center*.9,label:'−۱۰٪',color:'#2d8b68',dash:[4,3]},{v:center*1.1,label:'+۱۰٪',color:'#2d8b68',dash:[4,3]},{v:center*.85,label:'−۱۵٪',color:'#c98b42',dash:[3,4]},{v:center*1.15,label:'+۱۵٪',color:'#c98b42',dash:[3,4]}];
    lines.forEach(L=>{if(L.v<lo||L.v>hi)return;const x=X(L.v);ctx.save();ctx.strokeStyle=L.color;ctx.lineWidth=L.v===center?3:1.5;ctx.setLineDash(L.dash);ctx.beginPath();ctx.moveTo(x,y0-4);ctx.lineTo(x,y1);ctx.stroke();ctx.restore();ctx.fillStyle=L.color;ctx.font=L.v===center?'bold 11px Tahoma':'10px Tahoma';ctx.fillText(L.label,x,18);});
    s.w.forEach((v,i)=>{const x=X(v),yy=y0+34+(i%(Math.max(1,Math.min(7,s.n))))*(Math.max(10,(y1-y0-45)/Math.max(1,Math.min(7,s.n)-1)));ctx.beginPath();ctx.arc(x,Math.min(y1-12,yy),4.5,0,Math.PI*2);ctx.fillStyle='#276c9b';ctx.fill();});
    ctx.fillStyle='#56616b';ctx.font='10px Tahoma';ctx.fillText('توزیع وزن نمونه‌های آخرین ارزیابی',w/2,h-13);
  }

  function injectStyles(){
    if($(ID+'-style'))return;
    const s=document.createElement('style');s.id=ID+'-style';s.textContent=`
      #adineWeightDistribution{margin-top:14px;border:1px solid #e5e9ed;border-radius:16px;background:#fff;box-shadow:0 5px 18px rgba(15,23,42,.05);overflow:hidden}
      #adineWeightDistribution .awd-head{padding:16px 16px 10px;display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      #adineWeightDistribution h3{margin:0;font-size:16px;color:#17212b}#adineWeightDistribution .awd-sub{margin:6px 0 0;color:#69747e;font-size:11px;line-height:1.8}
      #adineWeightDistribution .awd-status{white-space:nowrap;padding:7px 10px;border-radius:999px;font-size:10px;font-weight:800;background:#e5f5ee;color:#1f7052}
      #adineWeightDistribution .awd-chart{padding:4px 10px 0}.awd-canvas-wrap{width:100%;overflow:hidden}
      #adineWeightDistribution .awd-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:10px 12px 12px}
      #adineWeightDistribution .awd-kpi{border:1px solid #edf0f2;border-radius:12px;padding:9px;background:#fbfcfd}.awd-kpi b{display:block;font-size:14px;color:#17212b}.awd-kpi span{font-size:9px;color:#77818a;display:block;margin-top:4px}
      #adineWeightDistribution .awd-bands{margin:0 12px 12px;border-radius:13px;overflow:hidden;border:1px solid #e9edf0}.awd-band-row{display:grid;grid-template-columns:1fr 70px 70px;align-items:center;padding:8px 10px;font-size:10px;border-bottom:1px solid #edf0f2}.awd-band-row:last-child{border-bottom:0}.awd-band-row strong{text-align:center}.awd-band-row span{text-align:center;font-weight:800}.awd-band-row.mid{background:#e9f7f0}.awd-band-row.warn{background:#fff6e9}.awd-band-row.alert{background:#fff0f0}
      #adineWeightDistribution .awd-note{margin:0 12px 14px;padding:9px 10px;background:#f7f8fa;border-radius:10px;color:#626d76;font-size:10px;line-height:1.9}
      @media(max-width:600px){#adineWeightDistribution .awd-head{display:block}.awd-status{display:inline-block;margin-top:9px}.awd-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.awd-band-row{grid-template-columns:1fr 58px 58px;font-size:9px}}
    `;document.head.appendChild(s);
  }

  function render(){
    const root=$('root'),m=global.__adineBroilerComprehensiveModel;
    if(!root||!m||!Array.isArray(m.sampleWeights))return false;
    const s=stats(m.sampleWeights);if(!s)return false;
    let sec=$('adineWeightDistribution');
    if(!sec){
      sec=document.createElement('section');sec.id='adineWeightDistribution';sec.className='section';
      const anchor=$('cr2Dist')?.closest('.cr2-panel,.cr2-chart,.cr2-card,.section')||root.lastElementChild;
      if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(sec,anchor.nextSibling);else root.appendChild(sec);
    }
    const target=num(m.last?.standardWeight);
    const bands=target?bandCounts(s.w,target):bandCounts(s.w,s.mean);
    const b=bands?.counts||[0,0,0,0,0],n=s.n;
    const rows=[['کمتر از ۱۵٪ هدف',b[0],100*b[0]/n,'alert'],['۱۵٪- تا ۱۰٪- هدف',b[1],100*b[1]/n,'warn'],['محدوده سلامت آدینه ±۱۰٪',b[2],100*b[2]/n,'mid'],['۱۰٪+ تا ۱۵٪+ هدف',b[3],100*b[3]/n,'warn'],['بیشتر از ۱۵٪ هدف',b[4],100*b[4]/n,'alert']];
    const in10=b[2],in15=b[1]+b[2]+b[3];
    const status=in10/n>=.8?'مطلوب':in10/n>=.65?'نیازمند پایش':'نیازمند بررسی';
    sec.innerHTML=`<div class="awd-head"><div><h3>توزیع وزن و محدوده سلامت طیور آدینه</h3><p class="awd-sub">آخرین ارزیابی · ${fa(s.n)} نمونه · مقایسه مستقیم وزن نمونه‌ها با وزن هدف رسمی سویه در همین سن</p></div><span class="awd-status">${status}</span></div><div class="awd-chart"><div class="awd-canvas-wrap"><canvas id="awdCanvas" aria-label="نمودار توزیع وزن و محدوده سلامت آدینه"></canvas></div></div><div class="awd-grid"><div class="awd-kpi"><b>${fa(s.mean,0)} گرم</b><span>میانگین</span></div><div class="awd-kpi"><b>${fa(s.median,0)} گرم</b><span>میانه</span></div><div class="awd-kpi"><b>${fa(s.sd,1)} گرم</b><span>SD</span></div><div class="awd-kpi"><b>${pct(s.cv,1)}</b><span>CV نمونه</span></div><div class="awd-kpi"><b>${fa(s.min,0)}–${fa(s.max,0)}</b><span>حداقل تا حداکثر</span></div><div class="awd-kpi"><b>${fa(s.range,0)} گرم</b><span>دامنه تغییرات</span></div><div class="awd-kpi"><b>${fa(in10)} / ${fa(n)}</b><span>داخل ±۱۰٪ وزن هدف</span></div><div class="awd-kpi"><b>${fa(in15)} / ${fa(n)}</b><span>داخل ±۱۵٪ وزن هدف</span></div></div><div class="awd-bands"><div class="awd-band-row" style="font-weight:800;background:#f7f8fa"><span>محدوده نسبت به وزن هدف</span><strong>قطعه</strong><strong>درصد</strong></div>${rows.map(r=>`<div class="awd-band-row ${r[3]}"><span>${r[0]}</span><strong>${fa(r[1])}</strong><strong>${pct(r[2],1)}</strong></div>`).join('')}</div><div class="awd-note">${target?`وزن هدف رسمی این سن: <b>${fa(target,0)} گرم</b>. محدوده سلامت آدینه برای این تحلیل ±۱۰٪ وزن هدف است؛ ±۱۵٪ فقط برای نشان‌دادن پراکندگی گسترده‌تر نمونه‌هاست. این محدوده‌ها با حداقل/حداکثر نمونه ساخته نشده‌اند.`:'وزن هدف رسمی برای این سن در داده قابل دسترس نیست؛ بنابراین نمودار حول میانگین نمونه نمایش داده شده و نباید به‌عنوان محدوده هدف سویه تفسیر شود.'}</div>`;
    draw($('awdCanvas'),s,target||s.mean);
    sec.dataset.signature=String(m.last?.week||'')+'|'+s.n+'|'+s.mean.toFixed(3)+'|'+(target||'');
    return true;
  }

  function start(){injectStyles();let tries=0;const tick=()=>{tries++;const ok=render();if(!ok&&tries<40)setTimeout(tick,250);};tick();
    const root=$('root');if(root&&!root.dataset.awdObserver){root.dataset.awdObserver='1';let timer=null;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>render(),80)}).observe(root,{childList:true,subtree:true});}
    global.addEventListener('adine:report-ready',()=>setTimeout(render,150));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
