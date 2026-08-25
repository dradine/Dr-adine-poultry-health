/* ADINEH: Farm / House / Flock UX enhancements.
   Visual + CRUD convenience layer. Does not alter weekly/report calculations. */
(function () {
  'use strict';

  const n = v => Number(String(v ?? '').replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[٬،,]/g,'' ).trim());
  const val = id => document.getElementById(id)?.value?.trim() || '';
  const set = (id,v) => { const e=document.getElementById(id); if(e){e.value=v==null?'':v;e.dispatchEvent(new Event('change',{bubbles:true}));} };
  const esc = v => String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

  let edit = {type:null,id:null};

  async function update(type,id) {
    const table = type==='farm'?'farms':type==='house'?'houses':'flocks';
    const map = type==='farm' ? {
      name:'farmName',farm_code:'farmCode',location:'farmLocation',owner_name:'farmOwner',manager_name:'farmManager',capacity:'farmCapacity',notes:'farmNotes'
    } : type==='house' ? {
      name:'houseName',house_code:'houseCode',capacity:'houseCapacity',initial_bird_count:'houseInitialBirdCount',length_m:'houseLength',width_m:'houseWidth',ventilation_type:'houseVentilation',housing_system:'houseSystem',notes:'houseNotes'
    } : {
      flock_name:'flockName',flock_code:'flockCode',production_type:'productionType',genetics:'genetics',strain:'flockStrain',program:'flockProgram',sex:'flockSex',initial_bird_count:'birdCount',initial_average_weight_g:'initialAverageWeightG',start_age_days:'startAgeDays',notes:'flockNotes'
    };
    const payload={};
    for(const [column,id2] of Object.entries(map)) {
      const raw=val(id2);
      payload[column]=['capacity','initial_bird_count','length_m','width_m','start_age_days','initial_average_weight_g'].includes(column) ? (raw===''?null:n(raw)) : raw;
    }
    if(type==='house' && window.selectedFarm?.id) payload.farm_id=window.selectedFarm.id;
    if(type==='flock') {
      const houseId=val('flockHouse');
      if(houseId) payload.house_id=houseId;
      if(window.selectedFarm?.id) payload.farm_id=window.selectedFarm.id;
    }
    const {error}=await window.supabaseClient.from(table).update(payload).eq('id',id);
    if(error) throw error;
    edit={type:null,id:null};
    document.getElementById(type==='farm'?'farmForm':type==='house'?'houseForm':'flockForm')?.reset();
    const load=type==='farm'?window.loadFarms:type==='house'?window.loadHouses:window.loadFlocks;
    if(typeof load==='function') await load();
    alert('تغییرات با موفقیت ذخیره شد.');
  }

  function begin(type,row) {
    edit={type,id:row.id};
    const form=document.getElementById(type==='farm'?'farmForm':type==='house'?'houseForm':'flockForm');
    if(!form)return;
    const map=type==='farm'?{farmName:'name',farmCode:'farm_code',farmLocation:'location',farmOwner:'owner_name',farmManager:'manager_name',farmCapacity:'capacity',farmNotes:'notes'}:type==='house'?{houseName:'name',houseCode:'house_code',houseCapacity:'capacity',houseInitialBirdCount:'initial_bird_count',houseLength:'length_m',houseWidth:'width_m',houseVentilation:'ventilation_type',houseSystem:'housing_system',houseNotes:'notes'}:{flockName:'flock_name',flockCode:'flock_code',productionType:'production_type',genetics:'genetics',flockStrain:'strain',flockProgram:'program',flockSex:'sex',birdCount:'initial_bird_count',initialAverageWeightG:'initial_average_weight_g',placementDate:'placement_date',startAgeDays:'start_age_days',flockNotes:'notes'};
    Object.entries(map).forEach(([id,col])=>set(id,row[col]??''));
    if(type==='flock' && row.placement_date && typeof gregorianISOToJalali==='function') set('placementDate',gregorianISOToJalali(row.placement_date));
    const submit=form.querySelector('button[type=submit]'); if(submit)submit.textContent='ذخیره تغییرات';
    form.querySelector('.edit-cancel')?.remove();
    const b=document.createElement('button');b.type='button';b.className='btn btn-secondary edit-cancel';b.textContent='انصراف از ویرایش';b.onclick=()=>{edit={type:null,id:null};form.reset();if(submit)submit.textContent=type==='farm'?'ذخیره فارم':type==='house'?'ذخیره سالن':'ذخیره گله';b.remove();};
    form.querySelector('.button-row')?.appendChild(b);
    form.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function addButtons() {
    if(window.farms && document.getElementById('farmsList')) document.querySelectorAll('#farmsList .farm-card').forEach(card=>{ if(card.querySelector('.adine-edit'))return; const row=window.farms.find(x=>x.id===card.dataset.farmId); if(!row)return; const b=document.createElement('button');b.type='button';b.className='btn btn-secondary adine-edit';b.textContent='ویرایش';b.onclick=()=>begin('farm',row);card.querySelector('.button-row')?.insertBefore(b,card.querySelector('.btn-danger')); });
    if(window.houses && document.getElementById('housesList')) document.querySelectorAll('#housesList .card').forEach((card,i)=>{if(card.querySelector('.adine-edit'))return;const row=window.houses[i];if(!row)return;const b=document.createElement('button');b.type='button';b.className='btn btn-secondary adine-edit';b.textContent='ویرایش';b.onclick=()=>begin('house',row);card.querySelector('.button-row')?.insertBefore(b,card.querySelector('.btn-danger'));});
    if(window.flocks && document.getElementById('flocksList')) document.querySelectorAll('#flocksList .card').forEach((card,i)=>{if(card.querySelector('.adine-edit'))return;const row=window.flocks[i];if(!row)return;const b=document.createElement('button');b.type='button';b.className='btn btn-secondary adine-edit';b.textContent='ویرایش';b.onclick=()=>begin('flock',row);card.querySelector('.button-row')?.insertBefore(b,card.querySelector('.btn-danger'));});
  }

  function bindSaveInterception() {
    const hf=document.getElementById('houseForm');
    if(hf && !hf.dataset.adineEnhanced) { hf.dataset.adineEnhanced='1'; hf.addEventListener('submit',async e=>{
      if(!edit.type||edit.type!=='house') return;
      e.preventDefault();e.stopImmediatePropagation();try{await update('house',edit.id);}catch(err){alert('ویرایش سالن انجام نشد:\n'+(err.message||err));}
    },true); }
    const ff=document.getElementById('flockForm');
    if(ff && !ff.dataset.adineEnhanced) { ff.dataset.adineEnhanced='1'; ff.addEventListener('submit',async e=>{
      if(!edit.type||edit.type!=='flock') return;
      e.preventDefault();e.stopImmediatePropagation();try{await update('flock',edit.id);}catch(err){alert('ویرایش گله انجام نشد:\n'+(err.message||err));}
    },true); }
    const farm=document.getElementById('farmForm');
    if(farm && !farm.dataset.adineEnhanced) { farm.dataset.adineEnhanced='1'; farm.addEventListener('submit',async e=>{
      if(!edit.type||edit.type!=='farm') return;
      e.preventDefault();e.stopImmediatePropagation();try{await update('farm',edit.id);}catch(err){alert('ویرایش فارم انجام نشد:\n'+(err.message||err));}
    },true); }
  }

  function bindInitialCount() {
    const select=document.getElementById('flockHouse');
    if(!select||select.dataset.countBound)return;
    select.dataset.countBound='1';
    const apply=()=>{const h=(window.houses||[]).find(x=>x.id===select.value);if(h && h.initial_bird_count!=null && !val('birdCount')) set('birdCount',h.initial_bird_count);};
    select.addEventListener('change',apply); apply();
  }

  function boot(){
    bindSaveInterception();bindInitialCount();addButtons();
    setInterval(()=>{bindSaveInterception();bindInitialCount();addButtons();},700);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
