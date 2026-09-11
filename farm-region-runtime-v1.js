/* ADINE — Farm region persistence bridge V2.
   Automatically maps a farm's entered location to a broad Iranian benchmark region.
   It never overwrites a recognized/manual region with a guess; if the location is not
   recognized, the existing selection remains available as a manual fallback. */
(function(){'use strict';
const REGIONS={
 north:['آذربایجان شرقی','آذربایجان‌شرقی','آذربایجان غربی','آذربایجان‌غربی','اردبیل','گیلان','مازندران','گلستان','زنجان'],
 south:['خوزستان','بوشهر','فارس','هرمزگان','کهگیلویه و بویراحمد','کهگیلویه‌وبویراحمد'],
 east:['خراسان رضوی','خراسان شمالی','خراسان جنوبی','سیستان و بلوچستان','کرمان','یزد','سمنان'],
 west:['کردستان','کرمانشاه','ایلام','لرستان','همدان','مرکزی غرب'],
 center:['اصفهان','تهران','البرز','قم','مرکزی','قزوین','سمنان غربی']
};
const REGION_LABELS={north:'شمال',south:'جنوب',east:'شرق',west:'غرب',center:'مرکز'};
const CITY_REGION={
 'شاهین شهر':'center','شاهین‌شهر':'center','گُرگاب':'center','گرگاب':'center','گز':'center','گزبرخوار':'center','دولت آباد':'center','دولت‌آباد':'center','برخوار':'center','نجف آباد':'center','نجف‌آباد':'center','خمینی شهر':'center','خمینی‌شهر':'center','فلاورجان':'center','مبارکه':'center','زرین شهر':'center','زرین‌شهر':'center','اصفهان':'center','کاشان':'center','آران و بیدگل':'center','آران‌وبیدگل':'center',
 'مشهد':'east','نیشابور':'east','سبزوار':'east','بیرجند':'east','زاهدان':'east','کرمان':'east','رفسنجان':'east','سیرجان':'east','یزد':'east','طبس':'east','سمنان':'east','شاهرود':'east',
 'رشت':'north','لاهیجان':'north','انزلی':'north','ساری':'north','بابل':'north','آمل':'north','گرگان':'north','اردبیل':'north','تبریز':'north','ارومیه':'north','زنجان':'north',
 'شیراز':'south','مرودشت':'south','بوشهر':'south','اهواز':'south','دزفول':'south','آبادان':'south','بندرعباس':'south','لار':'south','کازرون':'south',
 'کرمانشاه':'west','سنندج':'west','ایلام':'west','خرم آباد':'west','خرم‌آباد':'west','همدان':'west','ملایر':'west'
};
function normalize(s){return String(s||'').replace(/[يى]/g,'ی').replace(/[ك]/g,'ک').replace(/\u200c/g,'').replace(/[\u064B-\u065F]/g,'').replace(/\s+/g,' ').trim();}
function detectRegion(location){
 const s=normalize(location);if(!s)return '';
 for(const [city,region] of Object.entries(CITY_REGION))if(s.includes(normalize(city)))return region;
 for(const [region,items] of Object.entries(REGIONS))for(const item of items)if(s.includes(normalize(item)))return region;
 return '';
}
function applyUI(){
 const input=document.getElementById('farmLocation'),select=document.getElementById('farmRegion');if(!input||!select)return;
 const update=()=>{
  const detected=detectRegion(input.value);
  if(detected){select.value=detected;select.dataset.autoRegion='true';select.disabled=true;select.title=`منطقه ${REGION_LABELS[detected]} به‌صورت خودکار از موقعیت تشخیص داده شد.`;}
  else{select.disabled=false;select.dataset.autoRegion='false';select.title='برای موقعیت‌های ناشناخته می‌توانید منطقه را دستی انتخاب کنید.';}
 };
 input.addEventListener('input',update);input.addEventListener('change',update);update();
}
function wait(ms){return new Promise(r=>setTimeout(r,ms));}
async function getSession(){return await window.supabaseClient?.auth?.getSession?.();}
async function findNewFarm(sb,uid,submittedAt,attempts){
 for(let i=0;i<attempts;i++){
  const q=await sb.from('farms').select('id,created_at,region,location').eq('owner_id',uid).order('created_at',{ascending:false}).limit(8);
  if(q.error)throw q.error;
  const row=(q.data||[]).find(x=>x.created_at&&new Date(x.created_at).getTime()>=submittedAt-2000);
  if(row)return row;await wait(400);
 }
 return null;
}
document.addEventListener('DOMContentLoaded',function(){
 applyUI();
 const form=document.getElementById('farmForm');if(!form)return;
 form.addEventListener('submit',function(){
  const location=document.getElementById('farmLocation')?.value||'';
  const select=document.getElementById('farmRegion');
  const detected=detectRegion(location);
  const region=detected||select?.value||'';
  if(select&&detected)select.value=detected;
  if(!region)return;
  const submittedAt=Date.now();
  setTimeout(async function(){
   try{
    const sb=window.supabaseClient;if(!sb)return;
    const session=await getSession();const uid=session?.data?.session?.user?.id;if(!uid)return;
    const row=await findNewFarm(sb,uid,submittedAt,20);if(!row||row.region===region)return;
    const u=await sb.from('farms').update({region}).eq('id',row.id).eq('owner_id',uid);if(u.error)throw u.error;
   }catch(e){console.warn('Farm region save bridge:',e)}
  },250);
 },false);
});
window.AdineFarmRegion={detect:detectRegion,labels:REGION_LABELS};
})();
