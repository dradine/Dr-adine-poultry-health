/* ADINE — Farm geography + climate runtime V4.
   Province detection is the primary location layer. It derives a practical
   geographic region and a four-class climate cohort for Benchmarking.
   City aliases are expanded across Iran; Persian Arabic/spacing variants
   are normalized before matching.
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

// City database used only for province detection. The province metadata above
// remains the single source of truth for region/climate.
const CITY_GROUPS={
'آذربایجان شرقی':'اسکو|اهر|ایلخچی|آبش احمد|آذرشهر|آقکند|باسمنج|بخشایش|بستان آباد|بناب|بناب جدید|تبریز|ترک|ترکمانچای|تسوج|تیکمه داش|جلفا|خاروانا|خامنه|خراجو|خسروشهر|خواجه|سراب|سردرود|سهند|شبستر|شربیان|شرفخانه|شندآباد|صوفیان|عجب شیر|قره آغاج|کلیبر|گوگان|لیلان|مراغه|مرند|ملکان|ممقان|میانه|هادی شهر|هریس|هشترود|هوراند|ورزقان|یامچی',
'آذربایجان غربی':'ارومیه|اشنویه|ایواوغلی|آواجیق|باروق|بازرگان|بوکان|پلدشت|پیرانشهر|تازه شهر|تکاب|چهاربرج|خوی|دیزج دیز|ربط|سردشت|سرو|سلماس|سیلوانه|سیمینه|سیه چشمه|شاهین دژ|شوط|ماکو|مهاباد|میاندوآب|نقده',
'اردبیل':'اردبیل|بیله سوار|پارس آباد|خلخال|سرعین|کوثر|گرمی|مشگین شهر|نمین|نیر|اصلاندوز|آبی بیگلو|جعفرآباد|مشکین شهر',
'اصفهان':'اصفهان|آران و بیدگل|اردستان|باغ بهادران|تیران|خمینی شهر|خوانسار|دهاقان|دولت آباد|زرین شهر|زیباشهر|سمیرم|شاهین شهر|شهرضا|فریدن|فریدون شهر|فلاورجان|فولاد شهر|قهدریجان|کاشان|گلپایگان|گلدشت|مبارکه|مهاباد|نایین|نجف آباد|نطنز|هرند|دولت‌آباد|زرین‌شهر|نجف‌آباد|خمینی‌شهر|آران‌وبیدگل|گرگاب|گز|گزبرخوار|برخوار|داران|دامنه|دیزیچه|حسن آباد|خورزوق|میمه|وزوان|بویین میاندشت',
'البرز':'آسارا|اشتهارد|شهر جدید هشتگرد|طالقان|کرج|نظرآباد|هشتگرد|محمدشهر|ماهدشت|کمالشهر|فردیس|گرمدره|چهارباغ|گلسار',
'ایلام':'آبدانان|ایلام|ایوان|دره شهر|دهلران|سرابله|شیروان|مهران|بدره|چرداول|لومار|موسیان|مهر',
'بوشهر':'آبپخش|اهرم|برازجان|بندر دیر|بندر دیلم|بندر کنگان|بندر گناوه|بوشهر|دلوار|عسلویه|خورموج|جم|دشتستان|شبانکاره|ریز|بردخون|بندر ریگ|خارک|تنگستان',
'تهران':'اسلامشهر|بومهن|پاکدشت|تهران|چهاردانگه|دماوند|رودهن|ری|شریف آباد|رباط کریم|شهریار|فشم|فیروزکوه|قدس|کهریزک|لواسان|ملارد|ورامین|پردیس|اندیشه|قرچک|پیشوا|رباط‌کریم|صالحیه|گلستان|نسیم شهر|صباشهر|وحیدیه|باقرشهر',
'چهارمحال و بختیاری':'اردل|بروجن|چلگرد|سامان|شهرکرد|فارسان|لردگان|بن|فرخ شهر|هفشجان|کیان|گندمان|ناغان|پردنجان|صمصامی',
'خراسان جنوبی':'بشرویه|بیرجند|خضری|خوسف|سرایان|سربیشه|طبس|فردوس|قائن|نهبندان|درح|آیسک|اسلامیه|دیهوک|عشق آباد|اسدیه|حاجی آباد',
'خراسان رضوی':'بجستان|بردسکن|تایباد|تربت جام|تربت حیدریه|جغتای|جوین|چناران|خلیل آباد|خواف|درگز|رشتخوار|سبزوار|سرخس|طرقبه|فریمان|قوچان|کاشمر|کلات|گناباد|مشهد|نیشابور|فیروزه|درود|گلبهار|گلمکان|شاندیز|نقاب|داورزن|ششتمد|خرو|تربت|سنگان|تربت جام|بردسکن|بایگ|بجستان|خواف|روداب',
'خراسان شمالی':'آشخانه|اسفراین|بجنورد|جاجرم|شیروان|فاروج|راز|گرمه|صفی آباد|پیش قلعه|سنخواست|حصار گرمخان',
'خوزستان':'آبادان|امیدیه|اندیمشک|اهواز|ایذه|باغ ملک|بستان|بندر ماهشهر|بندر امام خمینی|بهبهان|خرمشهر|دزفول|رامشیر|رامهرمز|سوسنگرد|شادگان|شوش|شوشتر|لالی|مسجد سلیمان|هندیجان|هویزه|آغاجاری|حمیدیه|ملاثانی|ویس|صفی آباد|گتوند|لالی|هفتکل|هندیجان|بندرماهشهر',
'زنجان':'آب بر|ابهر|خرمدره|زرین آباد|زنجان|قیدار|ماهنشان|سلطانیه|هیدج|صائین قلعه|دندی|نوربهار|حلب',
'سمنان':'ایوانکی|بسطام|دامغان|سرخه|سمنان|شاهرود|شهمیرزاد|گرمسار|مهدیشهر|میامی|بیارجمند|کلاته خیج|رودیان|مجن|دیباج',
'سیستان و بلوچستان':'ایرانشهر|چابهار|خاش|راسک|زابل|زاهدان|سراوان|سرباز|میرجاوه|نیکشهر|کنارک|قصرقند|بزمان|بمپور|بنت|پیشین|فنوج|هیدوچ|گشت|محمدان|زهک|هیرمند|دوست محمد|نوک آباد|جالق',
'فارس':'آباده|آباده طشک|اردکان|ارسنجان|استهبان|اشکنان|اقليد|اوز|ایج|ایزدخواست|باب انار|بالاده|بنارویه|بهمن|بوانات|بیضا|جنت شهر|جهرم|حاجی آباد|خاوران|خرامه|خشت|خفر|خنج|خور|داراب|زاهدشهر|زرقان|سده|سروستان|سعادت شهر|سورمق|ششده|شیراز|صغاد|صفاشهر|فسا|فیروزآباد|قائمیه|قادرآباد|قطب آباد|قیروکارزین|کازرون|کنارتخته|گراش|لار|لامرد|لطیفی|مرودشت|مشکان|مهر|میمند|نورآباد|نی ریز|کوار|فراشبند|رونیز|سپیدان|مصیری|فدامی|خاوران|خنج|جویم|گله دار|مهر|علامرودشت|ارسنجان|قیر',
'قزوین':'آبیک|البرز|بوئین زهرا|تاکستان|قزوین|محمودآباد نمونه|آوج|اسفرورین|خرمدشت|دانسفهان|رازمیان|سیردان',
'قم':'قم|جعفریه|کهک|سلفچگان',
'کردستان':'بانه|بیجار|دهگلان|دیواندره|سقز|سنندج|قروه|کامیاران|مریوان|موچش|برده رشه|دزج|سریش آباد|دلبران|چناره|اورامان تخت',
'کرمان':'بابک|بافت|بردسیر|بم|جیرفت|راور|رفسنجان|زرند|سیرجان|کرمان|کهنوج|منوجان|انار|بروات|رابر|ریگان|فهرج|قلعه گنج|رودبار جنوب|کوهبنان|گلباف|ماهان|شهداد|اندوهجرد|دوساری|بلورد|هماشهر|کشکوئیه|بهرمان',
'کرمانشاه':'اسلام آباد غرب|پاوه|تازه آباد|جوانرود|سر پل ذهاب|سنقر|صحنه|قصر شیرین|کرمانشاه|کنگاور|گیلان غرب|هرسین|ثلاث باباجانی|روانسر|دالاهو|بیستون|هلشی|نوسود|نودشه|ازگله|سطر',
'کهگیلویه و بویراحمد':'دهدشت|دوگنبدان|سی سخت|گچساران|یاسوج|لیکک|چرام|لنده|باشت|سوق|دیشموک|قلعه رئیسی',
'گلستان':'آزادشهر|آق قلا|انبار آلوم|اینچه برون|بندر گز|ترکمن|جلین|خان ببین|رامیان|سیمین شهر|علی آباد کتول|فاضل آباد|کردکوی|کلاله|گالیکش|گرگان|گمیش تپه|گنبد کاووس|مراوه تپه|مینودشت|نگین شهر|نوده خاندوز|نوکنده|دلند|سرخنکلاته|قرق|خان ببین|مزرعه',
'گیلان':'آستارا|آستانه اشرفیه|املش|بندرانزلی|خمام|رشت|رضوانشهر|رودسر|رودبار|سیاهکل|شفت|صومعه سرا|فومن|کلاچای|لاهیجان|لنگرود|لوشان|ماسال|ماسوله|منجیل|هشتپر|تالش|رودبنه|چابکسر|کومله|اطاقور|دیلمان|احمدسرگوراب|بازار جمعه|اسالم',
'لرستان':'ازنا|الشتر|الیگودرز|بروجرد|پلدختر|خرم آباد|دورود|سپیددشت|کوهدشت|نورآباد|چغلوندی|اشترینان|فیروزآباد|درب گنبد|معمولان|ویسیان|زاغه|هفت چشمه|چقابل|گراب|مومن آباد|شول آباد',
'مازندران':'آمل|بابل|بابلسر|بلده|بهشهر|پل سفید|تنکابن|جویبار|چالوس|خرم آباد|رامسر|رستمکلا|ساری|سلمانشهر|سوادکوه|فریدونکنار|قائم شهر|گلوگاه|محمودآباد|مرزن آباد|نکا|نور|نوشهر|سورک|کیاسر|کتالم|کیاکلا|گتاب|زرگرمحله|آلاشت|کلاردشت|گلوگاه|عباس آباد|سادات شهر|هادی شهر|کله بست|امیرکلا|زرگرمحله|جویبار|ایزدشهر|رویان|بلده|چمستان',
'مرکزی':'آشتیان|اراک|تفرش|خمین|دلیجان|ساوه|شازند|محلات|کمیجان|مهاجران|خنداب|آستانه|پرندک|غرق آباد|نوبران|رازقان|میلاجرد|داودآباد|کارچان|سنجان|نراق|نیمور|خشکرود|مامونیه|محلات',
'هرمزگان':'ابوموسی|انگهران|بستک|بندر جاسک|بندر لنگه|بندرعباس|پارسیان|حاجی آباد|دشتی|دهبارز|رودان|قشم|کیش|میناب|بیکاه|فین|بندر خمیر|سیریک|بشاگرد|جناح|کنگ|چارک|هرمز|هنگام|سوزا|درگهان|قلعه قاضی|تخت|بندرخمیر|بندرکنگ|گوهران',
'همدان':'اسدآباد|بهار|تویسرکان|رزن|کبودرآهنگ|ملایر|نهاوند|همدان|لالجین|مریانج|قهاوند|فامنین|برزول|دمق|جورقان|صالح آباد|آجین|فیروزان|سرکان|گیان|ازندریان',
'یزد':'ابرکوه|اردکان|اشکذر|بافق|تفت|مهریز|میبد|هرات|یزد|بهاباد|خضرآباد|زارچ|حمیدیا|احمدآباد|عقدا|اشکذر|مروست|مهردشت|بفروئیه|ندوشن|شاهدیه|دیهوک'
};

const CITY_PROVINCE={};
for(const [province,list] of Object.entries(CITY_GROUPS)){
  list.split('|').forEach(city=>{const c=String(city||'').trim();if(c)CITY_PROVINCE[c]=province;});
}
const addAlias=(province,...cities)=>cities.forEach(c=>CITY_PROVINCE[c]=province);
addAlias('اصفهان','شاهین‌شهر','نجف‌آباد','خمینی‌شهر','زرین‌شهر','دولت‌آباد','آران‌وبیدگل','گُرگاب','گزبرخوار');
addAlias('تهران','رباط‌کریم','چهاردانگه','شریف‌آباد');
addAlias('خوزستان','بندرماهشهر','بندرامام خمینی','مسجدسلیمان');
addAlias('مازندران','قائم‌شهر','فریدون‌کنار','بندرگز');
addAlias('گیلان','بندرانزلی','آستانه‌اشرفیه');
addAlias('کرمانشاه','اسلام‌آباد غرب','سرپل ذهاب','قصرشیرین');
addAlias('سیستان و بلوچستان','ایرانشهر','بندر چابهار');

function normalize(s){return String(s||'').replace(/[يى]/g,'ی').replace(/[ك]/g,'ک').replace(/\u200c/g,'').replace(/[\u064B-\u065F]/g,'').replace(/[ـ]/g,'').replace(/[،,؛;|/\\-]+/g,' ').replace(/\s+/g,' ').trim()}
function detectProvince(location){
 const s=normalize(location);if(!s)return '';
 // Exact/contained city matching. Longest city name wins so compound names are safe.
 const cities=Object.keys(CITY_PROVINCE).sort((a,b)=>normalize(b).length-normalize(a).length);
 for(const city of cities){const n=normalize(city);if(n&&s.includes(n))return CITY_PROVINCE[city];}
 const provinces=Object.keys(PROVINCES).sort((a,b)=>normalize(b).length-normalize(a).length);
 for(const p of provinces)if(s.includes(normalize(p)))return p;
 return '';
}
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
window.AdineFarmRegion={detect:location=>getInfo(location).region,detectProvince,info:getInfo,labels:REGION_LABELS,climateLabels:CLIMATE_LABELS,provinces:PROVINCES,cityProvince:CITY_PROVINCE};
})();
