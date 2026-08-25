/* ADINEH: Farm / House / Flock UX + CRUD enhancement layer. */
(function () {
  'use strict';
  const n=v=>Number(String(v??'').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[٬،,]/g,'').trim());
  const val=id=>document.getElementById(id)?.value?.trim()||'';
  const set=(id,v)=>{const e=document.getElementById(id);if(e){e.value=v==null?'':v;e.dispatchEvent(new Event('change',{bubbles:true}));}};
  let edit={type:null,id:null};

  async function refresh(type){const f=type==='farm'?window.loadFarms:type==='house'?window.loadHouses:window.loadFlocks;if(typeof f==='function')await f();}
  function formFor(type){return document.getElementById(type==='farm'?'farmForm':type==='house'?'houseForm':'flockForm');}

  async function update(type,id){
    const table=type==='farm'?'farms':type==='house'?'houses':'flocks';
    const map=type==='farm'?{name:'farmName',farm_code:'farmCode',location:'farmLocation',owner_name:'farmOwner',manager_name:'farmManager',capacity:'farmCapacity',notes:'farmNotes'}:type==='house'?{name:'houseName',house_code:'houseCode',capacity:'houseCapacity',initial_bird_count:'houseInitialBirdCount',length_m:'houseLength',width_m:'houseWidth',ventilation_type:'houseVentilation',housing_system:'houseSystem',notes:'houseNotes'}:{flock_name:'flockName',flock_code:'flockCode',production_type:'productionType',genetics:'genetics',strain:'flockStrain',program:'flockProgram',sex:'flockSex',initial_bird_count:'birdCount',initial_average_weight_g:'initialAverageWeightG',start_age_days:'startAgeDays',notes:'flockNotes'};
    const payload={};
    for(const [col,id2] of Object.entries(map)){const raw=val(id2);payload[col]=['capacity','initial_bird_count','length_m','width_m','start_age_days','initial_average_weight_g'].includes(col)?(raw===''?null:n(raw)):raw;}
    if(type==='house'&&window.selectedFarm?.id)payload.farm_id=window.selectedFarm.id;
    if(type==='flock'){const h=val('flockHouse');if(h)payload.house_id=h;if(window.selectedFarm?.id)payload.farm_id=window.selectedFarm.id;}
    if(type==='flock'&&payload.initial_bird_count==null){const h=(window.houses||[]).find(x=>x.id===payload.house_id);if(h?.initial_bird_count!=null)payload.initial_bird_count=h.initial_bird_count;}
    const {error}=await window.supabaseClient.from(table).update(payload).eq('id',id);if(error)throw error;
    edit={type:null,id:null};formFor(type)?.reset();await refresh(type);alert('تغییرات با موفقیت ذخیره شد.');
  }

  function begin(type,row){
    edit={type,id:row.id};const form=formFor(type);if(!form)return;
    const map=type==='farm'?{farmName:'name',farmCode:'farm_code',farmLocation:'location',farmOwner:'owner_name',farmManager:'manager_name',farmCapacity:'capacity',farmNotes:'notes'}:type==='house'?{houseName:'name',houseCode:'house_code',houseCapacity:'capacity',houseInitialBirdCount:'initial_bird_count',houseLength:'length_m',houseWidth:'width_m',houseVentilation:'ventilation_type',houseSystem:'housing_system',houseNotes:'notes'}:{flockName:'flock_name',flockCode:'flock_code',productionType:'production_type',genetics:'genetics',flockStrain:'strain',flockProgram:'program',flockSex:'sex',birdCount:'initial_bird_count',initialAverageWeightG:'initial_average_weight_g',placementDate:'placement_date',startAgeDays:'start_age_days',flockNotes:'notes'};
    Object.entries(map).forEach(([id,col])=>set(id,row[col]??''));
    if(type==='flock'){if(row.placement_date&&typeof gregorianISOToJalali==='function')set('placementDate',gregorianISOToJalali(row.placement_date));set('flockHouse',row.house_id||'');}
    const submit=form.querySelector('button[type=submit]');if(submit)submit.textContent='ذخیره تغییرات';
    form.querySelector('.edit-cancel')?.remove();const b=document.createElement('button');b.type='button';b.className='btn btn-secondary edit-cancel';b.textContent='انصراف از ویرایش';b.onclick=()=>{edit={type:null,id:null};form.reset();if(submit)submit.textContent=type==='farm'?'ذخیره فارم':type==='house'?'ذخیره سالن':'ذخیره گله';b.remove();};form.querySelector('.button-row')?.appendChild(b);form.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function addButtons(){
    if(window.farms&&document.getElementById('farmsList'))document.querySelectorAll('#farmsList .farm-card').forEach(card=>{if(card.querySelector('.adine-edit'))return;const row=window.farms.find(x=>x.id===card.dataset.farmId);if(!row)return;const b=document.createElement('button');b.type='button';b.className='btn btn-secondary adine-edit';b.textContent='ویرایش';b.onclick=()=>begin('farm',row);card.querySelector('.button-row')?.insertBefore(b,card.querySelector('.btn-danger'));});
    if(window.houses&&document.getElementById('housesList'))document.querySelectorAll('#housesList .card').forEach((card,i)=>{if(card.querySelector('.adine-edit'))return;const row=window.houses[i];if(!row)return;const b=document.createElement('button');b.type='button';b.className='btn btn-secondary adine-edit';b.textContent='ویرایش';b.onclick=()=>begin('house',row);card.querySelector('.button-row')?.insertBefore(b,card.querySelector('.btn-danger'));});
    if(window.flocks&&document.getElementById('flocksList'))document.querySelectorAll('#flocksList .card').forEach((card,i)=>{if(card.querySelector('.adine-edit'))return;const row=window.flocks[i];if(!row)return;const b=document.createElement('button');b.type='button';b.className='btn btn-secondary adine-edit';b.textContent='ویرایش';b.onclick=()=>begin('flock',row);card.querySelector('.button-row')?.insertBefore(b,card.querySelector('.btn-danger'));});
  }

  async function createHouse(e){
    e.preventDefault();e.stopImmediatePropagation();const form=e.currentTarget;const name=val('houseName');if(!name||!window.selectedFarm)return alert(!window.selectedFarm?'ابتدا یک فارم انتخاب کنید.':'نام سالن را وارد کنید.');
    const payload={farm_id:window.selectedFarm.id,owner_id:window.currentUser?.id,name,house_code:val('houseCode'),capacity:n(val('houseCapacity'))||0,initial_bird_count:val('houseInitialBirdCount')===''?null:n(val('houseInitialBirdCount')),length_m:val('houseLength')===''?null:n(val('houseLength')),width_m:val('houseWidth')===''?null:n(val('houseWidth')),ventilation_type:val('houseVentilation'),housing_system:val('houseSystem'),notes:val('houseNotes'),is_active:true};
    const {error}=await window.supabaseClient.from('houses').insert(payload);if(error)return alert('ذخیره سالن انجام نشد:\n'+error.message);form.reset();await refresh('house');alert('سالن با موفقیت ثبت شد.');
  }

  async function createFlock(e){
    e.preventDefault();e.stopImmediatePropagation();if(!window.selectedFarm)return alert('ابتدا فارم را انتخاب کنید.');
    const houseId=val('flockHouse'),name=val('flockName'),type=val('productionType');if(!houseId)return alert('سالن را انتخاب کنید.');if(!name||!type)return alert('نام گله و نوع پرورش الزامی است.');
    const h=(window.houses||[]).find(x=>x.id===houseId);let count=val('birdCount');if(!count&&h?.initial_bird_count!=null){set('birdCount',h.initial_bird_count);count=String(h.initial_bird_count);}const weight=val('initialAverageWeightG');if(!weight)return alert('میانگین وزن اولیه (گرم) را وارد کنید.');
    const jd=val('placementDate');let gd=null;if(jd&&typeof jalaliToGregorianISO==='function'){gd=jalaliToGregorianISO(jd);if(!gd)return alert('تاریخ ورود گله نامعتبر است.');}
    const payload={farm_id:window.selectedFarm.id,house_id:houseId,owner_id:window.currentUser?.id,flock_name:name,flock_code:val('flockCode'),production_type:type,genetics:val('genetics'),strain:val('flockStrain')||val('genetics'),program:val('flockProgram'),sex:val('flockSex')||'mixed',initial_bird_count:n(count),current_bird_count:n(count),initial_average_weight_g:n(weight),placement_date:gd,start_age_days:n(val('startAgeDays'))||1,status:'active',notes:val('flockNotes')};
    const {data,error}=await window.supabaseClient.from('flocks').insert(payload).select().single();if(error)return alert('ذخیره گله انجام نشد:\n'+error.message);setCurrentSelection({farmId:window.selectedFarm.id,houseId,flockId:data.id});e.currentTarget.reset();set('startAgeDays','۱');if(typeof updateGenetics==='function')updateGenetics();await refresh('flock');alert('گله با موفقیت ثبت شد.');
  }

  function bind(){
    const hf=document.getElementById('houseForm');if(hf&&!hf.dataset.enhanced){hf.dataset.enhanced='1';hf.addEventListener('submit',e=>{if(edit.type==='house'){e.preventDefault();e.stopImmediatePropagation();update('house',edit.id).catch(x=>alert('ویرایش سالن انجام نشد:\n'+x.message));}else createHouse(e);},true);}
    const ff=document.getElementById('flockForm');if(ff&&!ff.dataset.enhanced){ff.dataset.enhanced='1';ff.addEventListener('submit',e=>{if(edit.type==='flock'){e.preventDefault();e.stopImmediatePropagation();update('flock',edit.id).catch(x=>alert('ویرایش گله انجام نشد:\n'+x.message));}else createFlock(e);},true);}
    const farm=document.getElementById('farmForm');if(farm&&!farm.dataset.enhanced){farm.dataset.enhanced='1';farm.addEventListener('submit',e=>{if(edit.type==='farm'){e.preventDefault();e.stopImmediatePropagation();update('farm',edit.id).catch(x=>alert('ویرایش فارم انجام نشد:\n'+x.message));}},true);}
    const select=document.getElementById('flockHouse');if(select&&!select.dataset.countBound){select.dataset.countBound='1';select.addEventListener('change',()=>{const h=(window.houses||[]).find(x=>x.id===select.value);if(h?.initial_bird_count!=null)set('birdCount',h.initial_bird_count);});}
  }
  function boot(){bind();addButtons();setInterval(()=>{bind();addButtons();},500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
