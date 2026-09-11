/* ADINE — Farm geography + climate runtime V3.
   Province detection is the primary location layer. It derives a practical
   geographic region and a four-class climate cohort for Benchmarking.
   Climate classes are based on a published province-level grouping:
   cold / hot-arid / hot-humid / temperate-humid.
*/
(function(){'use strict';
const PROVINCES={
 'آذربایجان شرقی':{region:'west',climate:'cold'},'آذربایجان غربی':{region:'west',climate:'cold'},'اردبیل':{region:'west',climate:'cold'},
 'اصفهان':{region:'center',climate:'hot_arid'},'البرز':{region:'center',climate:'cold'},'ایلام':{region:'west',climate:'cold'},
 'بوشهر':{region:'south',climate:'hot_humid'},'تهران':{region:'center',climate:'cold'},'چهارمحال و بختیاری':{region:'south',climate:'cold'},
 'خراسان جنوبی':{region:'east',climate:'hot_arid'},'خراسان رضوی':{region:'east',climate:'cold'},'خراسان شمالی':{region:'east',climate:'cold'},
 'خوزستان':{region:'south',climate:'hot_humid'},'زنجان':{region:'west',climate:'cold'},'سمنان':{region:'east',climate:'hot_arid'},
 'سیستان و بلوچستان':{region:'east',climate:'hot_arid'},'فارس':{region:'south',climate:'hot_arid'},'قزوین':{region:'center',climate:'cold'},
 'قم':{region:'center',climate:'hot_arid'},'کردستان':{region:'west',climate:'cold'},'کرمان':{region:'east',climate:'hot_arid'},
 'کرمانشاه':{region:'west',climate:'cold'},'کهگیلویه و بویراحمد':{region:'south',climate:'cold'},'گلستان':{region:'north',climate:'temperate_humid'},
 'گیلان':{region:'north',climate:'temperate_humid'},'لرستان':{region:'west',climate:'cold'},'مازندران':{region:'north',climate:'temperate_humid'},
 'مرکزی':{region:'center',climate:'hot_arid'},'هرمزگان':{region:'south',climate:'hot_humid'},'همدان':{region:'west',climate:'cold'},'یزد':{region:'east',climate:'hot_arid'}
};
const REGION_LABELS={north:'شمال',south:'جنوب',east:'شرق',west:'غرب',center:'مرکز'};
const CLIMATE_LABELS={cold:'سرد',hot_arid:'گرم–خشک',hot_humid:'گرم–مرطوب',temperate_humid:'معتدل–مرطوب'};
const CAPITALS={
 'اردبیل':'اردبیل','اصفهان':'اصفهان','البرز':'کرج','ایلام':'ایلام','آذربایجان شرقی':'تبریز','آذربایجان غربی':'ارومیه','بوشهر':'بوشهر',
 'تهران':'تهران','چهارمحال و بختیاری':'شهرکرد','خراسان جنوبی':'بیرجند','خراسان رضوی':'مشهد','خراسان شمالی':'بجنورد','خوزستان':'اهواز',
 'زنجان':'زنجان','سمنان':'سمنان','سیستان و بلوچستان':'زاهدان','فارس':'شیراز','قزوین':'قزوین','قم':'قم','کردستان':'سنندج','کرمان':'کرمان',
 'کرمانشاه':'کرمانشاه','کهگیلویه و بویراحمد':'یاسوج','گلستان':'گرگان','گیلان':'رشت','لرستان':'خرم‌آباد','مازندران':'ساری','مرکزی':'اراک',
 'هرمزگان':'بندرعباس','همدان':'همدان','یزد':'یزد'
};
const CITY_PROVINCE={
 'شاهین شهر':'اصفهان','شاهین‌شهر':'اصفهان','گرگاب':'اصفهان','گُرگاب':'اصفهان','گز':'اصفهان','گزبرخوار':'اصفهان','دولت آباد':'اصفهان','دولت‌آباد':'اصفهان','برخوار':'اصفهان','نجف آباد':'اصفهان','نجف‌آباد':'اصفهان','خمینی شهر':'اصفهان','خمینی‌شهر':'اصفهان','فلاورجان':'اصفهان','مبارکه':'اصفهان','زرین شهر':'اصفهان','زرین‌شهر':'اصفهان','کاشان':'اصفهان','آران و بیدگل':'اصفهان','آران‌وبیدگل':'اصفهان',
 'مشهد':'خراسان رضوی','نیشابور':'خراسان رضوی','سبزوار':'خراسان رضوی','بیرجند':'خراسان جنوبی','زاهدان':'سیستان و بلوچستان','کرمان':'کرمان','رفسنجان':'کرمان','سیرجان':'کرمان','یزد':'یزد','طبس':'خراسان جنوبی','شاهرود':'سمنان',
 'رشت':'گیلان','لاهیجان':'گیلان','انزلی':'گیلان','ساری':'مازندران','بابل':'مازندران','آمل':'مازندران','گرگان':'گلستان','تبریز':'آذربایجان شرقی','ارومیه':'آذربایجان غربی','زنجان':'زنجان','اردبیل':'اردبیل',
 'شیراز':'فارس','مرودشت':'فارس','بوشهر':'بوشهر','اهواز':'خوزستان','دزفول':'خوزستان','آبادان':'خوزستان','بندرعباس':'هرمزگان','لار':'فارس','کازرون':'فارس',
 'کرمانشاه':'کرمانشاه','سنندج':'کردستان','ایلام':'ایلام','خرم آباد':'لرستان','خرم‌آباد':'لرستان','همدان':'همدان','ملایر':'همدان','تهران':'تهران','کرج':'البرز','قزوین':'قزوین','قم':'قم','اراک':'مرکزی','سمنان':'سمنان','یاسوج':'کهگیلویه و بویراحمد','شهرکرد':'چهارمحال و بختیاری'
};
function normalize(s){return String(s||'').replace(/[يى]/g,'ی').replace(/[ك]/g,'ک').replace(/\u200c/g,'').replace(/[\u064B-\u065F]/g,'').replace(/[ـ]/g,'').replace(/\s+/g,' ').trim()}
function detectProvince(location){const s=normalize(location);if(!s)return '';for(const [city,p] of Object.entries(CITY_PROVINCE))if(s.includes(normalize(city)))return p;for(const p of Object.keys(PROVINCES))if(s.includes(normalize(p)))return p;return ''}
function getInfo(location,manualProvince){const p=detectProvince(location)||manualProvince||'';const x=PROVINCES[p];return {province:p,region:x?.region||'',climate:x?.climate||''}}
function applyUI(){
 const input=document.getElementById('farmLocation'),province=document.getElementById('farmProvince'),region=document.getElementById('farmRegion'),climate=document.getElementById('farmClimate');if(!input)return;
 const update=()=>{const info=getInfo(input.value,province?.value||'');if(province){if(info.province){province.value=info.province;province.dataset.autoProvince='true';province.disabled=true}else{province.disabled=false;province.dataset.autoProvince='false'}}if(region&&info.region){region.value=info.region;region.dataset.autoRegion='true';region.disabled=true}else if(region){region.disabled=false;region.dataset.autoRegion='false'}if(climate&&info.climate){climate.value=info.climate;climate.dataset.autoClimate='true';climate.disabled=true}else if(climate){climate.disabled=false;climate.dataset.autoClimate='false'}};
 input.addEventListener('input',update);input.addEventListener('change',update);province?.addEventListener('change',update);update();
}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
async function getSession(){return await window.supabaseClient?.auth?.getSession?.()}
async function findNewFarm(sb,uid,submittedAt,attempts){for(let i=0;i<attempts;i++){const q=await sb.from('farms').select('id,created_at,region,province,climate_class,location').eq('owner_id',uid).order('created_at',{ascending:false}).limit(8);if(q.error)throw q.error;const row=(q.data||[]).find(x=>x.created_at&&new Date(x.created_at).getTime()>=submittedAt-2000);if(row)return row;await wait(400)}return null}
document.addEventListener('DOMContentLoaded',function(){applyUI();const form=document.getElementById('farmForm');if(!form)return;form.addEventListener('submit',function(){const location=document.getElementById('farmLocation')?.value||'',manualProvince=document.getElementById('farmProvince')?.value||'',info=getInfo(location,manualProvince);const region=info.region||document.getElementById('farmRegion')?.value||'',climate=info.climate||document.getElementById('farmClimate')?.value||'',province=info.province||manualProvince;if(!province&&!region&&!climate)return;const submittedAt=Date.now();setTimeout(async function(){try{const sb=window.supabaseClient;if(!sb)return;const session=await getSession(),uid=session?.data?.session?.user?.id;if(!uid)return;const row=await findNewFarm(sb,uid,submittedAt,20);if(!row)return;const patch={};if(province&&row.province!==province)patch.province=province;if(region&&row.region!==region)patch.region=region;if(climate&&row.climate_class!==climate)patch.climate_class=climate;if(Object.keys(patch).length){const u=await sb.from('farms').update(patch).eq('id',row.id).eq('owner_id',uid);if(u.error)throw u.error}}catch(e){console.warn('Farm geography save bridge:',e)}},250)},false)});
window.AdineFarmRegion={detect:location=>getInfo(location).region,detectProvince,info:getInfo,labels:REGION_LABELS,climateLabels:CLIMATE_LABELS,provinces:PROVINCES};
})();
