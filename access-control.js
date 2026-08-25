/* ADINEH ROLE/FARM ACCESS BRIDGE */
(function(){
'use strict';

function isoDate(value){if(!value)return null;const s=String(value).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:null}
window.AdineAge={
 calculateAgeDays(placementDate,targetDate,startAgeDays=0){const p=isoDate(placementDate),t=isoDate(targetDate||new Date().toISOString()),s=Number(startAgeDays);if(!p||!t||!Number.isFinite(s))return null;const a=Date.parse(p+'T00:00:00Z'),b=Date.parse(t+'T00:00:00Z');if(!Number.isFinite(a)||!Number.isFinite(b))return null;return Math.max(0,Math.floor((b-a)/86400000)+Math.trunc(s))},
 calculateFlockAgeDays(flock,targetDate){if(!flock)return null;return this.calculateAgeDays(flock.placement_date||flock.placementDate,targetDate||new Date().toISOString(),flock.start_age_days??flock.startAgeDays??0)}
};
window.calculateAgeDays=(placementDate,targetDate,startAgeDays=0)=>window.AdineAge.calculateAgeDays(placementDate,targetDate,startAgeDays);
window.calculateFlockAgeDays=(flock,targetDate)=>window.AdineAge.calculateFlockAgeDays(flock,targetDate);

window.AdineAccess={
 normalizeRole(p){return String(p?.user_type||p?.role||'').trim().toLowerCase()},
 async current(){const auth=await AdineAuth.requireAuth();if(!auth)return null;return auth},
 async farmAccessRows(){const a=await this.current();if(!a)return [];const rls=await supabaseClient.from('farms').select('id,name,farm_code,capacity,farm_type,owner_id,owner_name,manager_name,operational_status,monitoring_status,monitoring_message,monitoring_updated_at,created_at').order('created_at',{ascending:false});if(rls.error){console.error('RLS farm access query failed',rls.error);return []}const rows=new Map((rls.data||[]).map(x=>[x.id,{...x,_source:['rls']} ]));const allowed=new Set(rows.keys());for(const rpcName of ['get_my_farm_access','get_my_professional_farms']){try{const r=await supabaseClient.rpc(rpcName);if(r.error)continue;for(const x of(r.data||[])){if(x.connection_status&&x.connection_status!=='active')continue;const id=x.id||x.farm_id;if(!id||!allowed.has(id))continue;const old=rows.get(id)||{};rows.set(id,{...old,...x,id,_source:[...(old._source||[]),rpcName]})}}catch(error){console.warn(rpcName+' fallback unavailable',error)}}return [...rows.values()]},
 async farmIds(){return(await this.farmAccessRows()).map(x=>x.id)},
 async canAccessFarm(id){if(!id)return false;const a=await this.current();if(!a)return false;const r=await supabaseClient.from('farms').select('id').eq('id',id).maybeSingle();if(r.error||!r.data)return false;const role=this.normalizeRole(a.profile);if(role==='owner'||role==='admin')return true;return(await this.farmIds()).includes(id)},
 async canAccessFlock(id){if(!id)return false;const r=await supabaseClient.from('flocks').select('id,farm_id').eq('id',id).maybeSingle();if(r.error||!r.data)return false;return await this.canAccessFarm(r.data.farm_id)},
 async flockRows(farmId){if(!farmId||!(await this.canAccessFarm(farmId)))return [];const r=await supabaseClient.from('flocks').select('id,farm_id,house_id,flock_name,production_type,genetics,strain,program,sex,initial_bird_count,current_bird_count,placement_date,start_age_days,status,notes,created_at,updated_at').eq('farm_id',farmId).order('created_at',{ascending:false});if(r.error){console.error('RLS flock query failed',r.error);return []}return r.data||[]},
 async openFarm(id,target='weekly.html'){if(!await this.canAccessFarm(id)){alert('دسترسی این فارم برای حساب شما فعال نیست.');return}setCurrentSelection({farmId:id,houseId:null,flockId:null});window.location.href=target+'?farm='+encodeURIComponent(id)},
 roleLabel(p){const m={veterinarian:'دامپزشک',technical_veterinarian:'دامپزشک مسئول فنی',poultry_operator:'بهره‌بردار واحد طیور',poultry_manager:'مدیر واحد طیور',veterinary_lab:'آزمایشگاه تشخیص دامپزشکی',diagnostic_lab:'آزمایشگاه تشخیص دامپزشکی',poultry_technical_expert:'کارشناس فنی طیور',organization_manager:'مدیر / نماینده مجموعه',other:'سایر',owner:'مالک سامانه'};return m[String(p?.user_type||p?.role||'').toLowerCase()]||'کاربر'},
 esc(v){const d=document.createElement('div');d.textContent=v??'';return d.innerHTML}
};

function installUnifiedFlockWeeklyFixes(){
  if(window.__adineFlockWeeklyFixInstalled)return;
  window.__adineFlockWeeklyFixInstalled=true;

  window.renderFarmChooser=async function(){
    const container=document.getElementById('selectedFarm');
    if(!container)return;
    try{
      const farms=await window.AdineAccess.farmAccessRows();
      if(!farms.length){container.innerHTML='<p>هنوز فارمی برای این حساب ثبت نشده است.</p><button class="btn btn-primary" type="button" onclick="location.href=\'Farms.html\'">ثبت / انتخاب فارم</button>';return;}
      container.innerHTML='<div class="form-group"><label for="directFarmSelect">انتخاب فارم</label><select id="directFarmSelect"><option value="">انتخاب فارم</option></select></div>';
      const select=document.getElementById('directFarmSelect');
      farms.forEach(farm=>{const option=document.createElement('option');option.value=farm.id;option.textContent=(farm.name||'بدون نام')+(farm.farm_code?' — '+farm.farm_code:'');select.appendChild(option)});
      const current=getCurrentSelection();if(current.farmId&&farms.some(f=>f.id===current.farmId))select.value=current.farmId;
      select.addEventListener('change',async function(){
        const farmId=this.value;if(!farmId)return;
        if(!(await window.AdineAccess.canAccessFarm(farmId))){alert('دسترسی این فارم برای حساب شما فعال نیست.');this.value='';return;}
        setCurrentSelection({farmId,houseId:null,flockId:null});
        if(typeof loadSelectedFarm==='function')await loadSelectedFarm();
        if(typeof enableForms==='function')enableForms();
      });
    }catch(error){console.error('Unified farm chooser error:',error);container.innerHTML='<p>دریافت فهرست فارم‌ها انجام نشد.</p><button class="btn btn-secondary" type="button" onclick="location.reload()">تلاش مجدد</button>'}
  };

  const originalSelectFlock=window.selectFlock;
  window.selectFlock=async function(flockId){
    try{
      const r=await supabaseClient.from('flocks').select('id,farm_id,house_id').eq('id',flockId).maybeSingle();
      if(r.error||!r.data){alert('گله موردنظر پیدا نشد.');return;}
      if(!(await window.AdineAccess.canAccessFarm(r.data.farm_id))){alert('دسترسی این گله برای حساب شما فعال نیست.');return;}
      setCurrentSelection({farmId:r.data.farm_id,houseId:r.data.house_id||null,flockId:r.data.id});
      window.location.href='weekly.html?farm='+encodeURIComponent(r.data.farm_id)+'&flockId='+encodeURIComponent(r.data.id)+(r.data.house_id?'&houseId='+encodeURIComponent(r.data.house_id):'');
    }catch(error){console.error('Flock selection error:',error);alert('انتخاب گله انجام نشد. لطفاً دوباره تلاش کنید.');}
  };

  const originalLoadCurrentFlock=window.loadCurrentFlock;
  window.loadCurrentFlock=async function(){
    const container=document.getElementById('currentFlock');
    if(!container)return;
    try{
      const params=new URLSearchParams(window.location.search);
      const urlFlockId=params.get('flockId')||params.get('flock')||null;
      let selection=typeof getCurrentSelection==='function'?getCurrentSelection():{};
      const flockId=urlFlockId||selection.flockId;
      if(!flockId){container.innerHTML='<p>ابتدا یک گله انتخاب کنید.</p><button class="btn btn-primary" type="button" onclick="location.href=\'flocks.html\'">انتخاب گله</button>';return;}
      const r=await supabaseClient.from('flocks').select('*').eq('id',flockId).maybeSingle();
      if(r.error||!r.data){console.error('Unified flock loading error:',r.error);container.innerHTML='<p>گله انتخاب‌شده پیدا نشد یا دیگر قابل مشاهده نیست.</p><button class="btn btn-primary" type="button" onclick="location.href=\'flocks.html\'">انتخاب گله</button>';return;}
      const flock=r.data;
      if(!(await window.AdineAccess.canAccessFarm(flock.farm_id))){container.innerHTML='<p>دسترسی این گله برای حساب شما فعال نیست.</p>';return;}
      setCurrentSelection({farmId:flock.farm_id,houseId:flock.house_id||null,flockId:flock.id});
      let farmName='-',houseName='-';
      const [farmRes,houseRes]=await Promise.all([
        supabaseClient.from('farms').select('name').eq('id',flock.farm_id).maybeSingle(),
        flock.house_id?supabaseClient.from('houses').select('name').eq('id',flock.house_id).maybeSingle():Promise.resolve({data:null})
      ]);
      farmName=farmRes.data?.name||'-';houseName=houseRes.data?.name||'-';
      window.currentFlockForSpecialized=flock;
      currentFlock=flock;
      container.innerHTML='<div class="farm-summary"><strong>🐔 '+(window.AdineAccess.esc(flock.flock_name||'-'))+'</strong><br>فارم: '+(window.AdineAccess.esc(farmName))+'<br>سالن: '+(window.AdineAccess.esc(houseName))+'<br>نوع: '+(typeof getProductionLabel==='function'?getProductionLabel(flock.production_type):window.AdineAccess.esc(flock.production_type||'-'))+'<br>سویه: '+(window.AdineAccess.esc(flock.genetics||'-'))+'</div>';
      if(typeof renderWeeklySpecializedFields==='function')renderWeeklySpecializedFields(flock);
      if(typeof loadHistory==='function')await loadHistory();
    }catch(error){console.error('Unified current flock load error:',error);container.innerHTML='<p>راه‌اندازی گله انجام نشد. لطفاً دوباره تلاش کنید.</p>'}
  };

  const originalLoadHistory=window.loadHistory;
  window.loadHistory=async function(){
    if(!currentFlock||!currentUser)return;
    const history=document.getElementById('weeklyHistory');
    try{
      const r=await supabaseClient.from('weekly_records').select('*').eq('flock_id',currentFlock.id).order('evaluation_date',{ascending:true,nullsFirst:false}).order('week_number',{ascending:true,nullsFirst:false}).order('created_at',{ascending:true,nullsFirst:false});
      if(r.error){console.error('Unified weekly history error:',r.error);if(history)history.innerHTML='<p>سوابق پایش هفتگی قابل دریافت نیست. لطفاً دسترسی حساب و اتصال اینترنت را بررسی کنید.</p>';return;}
      weeklyRecords=r.data||[];
      if(typeof renderHistory==='function')renderHistory();
    }catch(error){console.error('Unified weekly history exception:',error);if(history)history.innerHTML='<p>خطا در بارگذاری سوابق پایش هفتگی.</p>';}
  };

  // Repair the old local age helper: callers that only pass placement/evaluation
  // must still use the selected flock's real start age.
  window.calculateAgeDays=(placementDate,targetDate,startAgeDays)=>{
    let start=startAgeDays;
    if(start===undefined&&typeof currentFlock!=='undefined'&&currentFlock)start=currentFlock.start_age_days??currentFlock.startAgeDays??0;
    return window.AdineAge.calculateAgeDays(placementDate,targetDate,start??0);
  };
}

document.addEventListener('DOMContentLoaded',function(){
  installUnifiedFlockWeeklyFixes();
  setTimeout(installUnifiedFlockWeeklyFixes,0);
  setTimeout(installUnifiedFlockWeeklyFixes,100);
  const patchReports=()=>{if(typeof window.getReportFlock==='function'&&!window.getReportFlock.__adinePatched){window.getReportFlock=async function(flockId){if(!flockId)return null;const{data,error}=await supabaseClient.from('flocks').select('*, farms(id,name), houses(id,name)').eq('id',flockId).maybeSingle();if(error)throw error;if(!data)return null;const farmId=data.farm_id||data.farmId||data.farms?.id;if(farmId&&!(await window.AdineAccess.canAccessFarm(farmId)))return null;window.__adineReportFlock=data;return data};window.getReportFlock.__adinePatched=true}
  if(typeof window.normalizeReportRecord==='function'&&!window.normalizeReportRecord.__adinePatched){const original=window.normalizeReportRecord;window.normalizeReportRecord=function(record){const out=original(record);const flock=window.__adineReportFlock||null;const d=record?.evaluation_date||record?.record_date;let age=Number(record?.age_days);if(flock?.placement_date&&d){const start=Number(flock.start_age_days);const t=Date.parse(String(d)),p=Date.parse(String(flock.placement_date));if(Number.isFinite(start)&&Number.isFinite(t)&&Number.isFinite(p))age=Math.max(0,Math.round(start+(t-p)/86400000))}if(Number.isFinite(age))out.ageDays=age;return out};window.normalizeReportRecord.__adinePatched=true}}
  patchReports();setTimeout(patchReports,0);setTimeout(patchReports,100);setTimeout(patchReports,500);
});
})();
