"use strict";
(function(){
  const toLatin=s=>String(s??"").replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const notify=(msg,type="success")=>{try{if(typeof showHealthStatus==="function"){showHealthStatus(msg,type);return}}catch(e){}const b=document.getElementById('healthStatus');if(b){b.textContent=msg;b.className='status-box show status-'+type;}};
  function bindNumbers(root=document){root.querySelectorAll('input[type="number"],input[data-numeric="true"]').forEach(input=>{if(input.dataset.persianDigitsReady==='1')return;input.dataset.persianDigitsReady='1';input.type='text';input.inputMode='numeric';input.autocomplete='off';input.setAttribute('pattern','[0-9۰-۹٠-٩]*');const normalize=()=>{const v=toLatin(input.value);if(v!==input.value)input.value=v};input.addEventListener('beforeinput',e=>{if(e.data&&/[^0-9۰-۹٠-٩]/.test(e.data))e.preventDefault()},{capture:true});input.addEventListener('input',normalize,{capture:true});input.addEventListener('change',normalize,{capture:true});input.addEventListener('blur',normalize,{capture:true});input.addEventListener('paste',e=>{const text=e.clipboardData?.getData('text')||'';if(/[۰-۹٠-٩]/.test(text)){e.preventDefault();const value=toLatin(text);const start=input.selectionStart??input.value.length,end=input.selectionEnd??input.value.length;input.value=input.value.slice(0,start)+value+input.value.slice(end);input.dispatchEvent(new Event('input',{bubbles:true}))}},{capture:true})})}
  let editId=null;
  const events=()=>{try{return typeof healthEvents!=='undefined'&&Array.isArray(healthEvents)?healthEvents:[]}catch(e){return[]}};
  function fill(id){const e=events().find(x=>x.id===id);if(!e)return;editId=id;const map={eventDate:e.event_date,eventAge:e.flock_age_days,eventType:e.event_type,mortalityCount:e.mortality_count||0,cullCount:e.cull_count||0,affectedCount:e.affected_count||0,suspectedDisease:e.suspected_disease_id||'',confirmedDisease:e.confirmed_disease_id||'',severity:e.severity||'',diagnosisStatus:e.diagnosis_status||'not_confirmed',suddenDeath:String(!!e.sudden_death),eventNotes:e.notes||''};Object.entries(map).forEach(([k,v])=>{const el=document.getElementById(k);if(el)el.value=toLatin(v)});[['showInReports',e.show_in_reports],['includeWeekly',e.include_in_weekly_report],['includeAnalysis',e.include_in_management_analysis]].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.checked=!!v});const level=document.getElementById('reportLevel');if(level)level.value=e.report_level||'private';const submit=document.querySelector('#healthEventForm button[type="submit"]');if(submit)submit.textContent='ذخیره ویرایش';const cancel=document.getElementById('cancelHealthEventEdit');if(cancel)cancel.style.display='inline-flex';document.querySelector('.health-tab[data-tab="event"]')?.click();bindNumbers(document)}
  async function update(){if(!editId)return false;bindNumbers(document);const n=id=>{const el=document.getElementById(id);return el?Number(toLatin(el.value||0)):0};const v=id=>{const el=document.getElementById(id);return el?toLatin(el.value||''):''};const rawDate=v('eventDate');const iso=window.jalaliDate?.jalaliToISO?.(rawDate)||window.AdineDateSystem?.jalaliToISO?.(rawDate)||rawDate;const payload={event_date:String(iso).slice(0,10),flock_age_days:n('eventAge'),event_type:v('eventType'),mortality_count:n('mortalityCount'),cull_count:n('cullCount'),affected_count:n('affectedCount'),suspected_disease_id:v('suspectedDisease')||null,confirmed_disease_id:v('confirmedDisease')||null,severity:v('severity')||null,diagnosis_status:v('diagnosisStatus')||'not_confirmed',sudden_death:v('suddenDeath')==='true',notes:v('eventNotes'),show_in_reports:!!document.getElementById('showInReports')?.checked,report_level:v('reportLevel')||'private',include_in_weekly_report:!!document.getElementById('includeWeekly')?.checked,include_in_management_analysis:!!document.getElementById('includeAnalysis')?.checked};if(!payload.show_in_reports){payload.report_level='private';payload.include_in_weekly_report=false}const r=await supabaseClient.from('health_events').update(payload).eq('id',editId).select('*').single();if(r.error){notify('خطا در ویرایش رخداد: '+r.error.message,'error');return true}editId=null;const form=document.getElementById('healthEventForm');form?.reset();const submit=form?.querySelector('button[type="submit"]');if(submit)submit.textContent='ثبت رخداد';const cancel=document.getElementById('cancelHealthEventEdit');if(cancel)cancel.style.display='none';if(typeof loadEvents==='function')await loadEvents();if(typeof renderDashboard==='function')renderDashboard();if(typeof renderOverview==='function')renderOverview();notify('ویرایش رخداد با موفقیت انجام شد.','success');return true}
  async function strictDelete(id){const e=events().find(x=>x.id===id);const label=e?`${e.event_date||''} - ${e.event_type||'رخداد سلامت'}`:'این رخداد';const first=prompt(`حذف دائمی «${label}»\nاین عملیات قابل بازگشت نیست. برای ادامه دقیقاً کلمه «حذف» را وارد کنید:`);if(first!=='حذف'){if(first!==null)notify('حذف انجام نشد؛ عبارت تأیید صحیح وارد نشد.','error');return}if(!confirm('تأیید نهایی: تمام اطلاعات این رخداد حذف می‌شود و قابل بازیابی نخواهد بود. ادامه می‌دهید؟'))return;try{const r=await supabaseClient.from('health_events').delete().eq('id',id);if(r.error)throw r.error;await Promise.all([supabaseClient.from('health_event_signs').delete().eq('event_id',id),supabaseClient.from('health_necropsies').delete().eq('event_id',id)]);if(typeof loadEvents==='function')await loadEvents();if(typeof renderDashboard==='function')renderDashboard();if(typeof renderOverview==='function')renderOverview();notify('رخداد با موفقیت حذف شد.','success')}catch(e){notify('خطا در حذف: '+e.message,'error')}}
  function addControls(){const tbody=document.getElementById('healthHistoryTable');if(!tbody)return;tbody.querySelectorAll('tr').forEach(tr=>{const del=tr.querySelector('button[onclick^="deleteHealthEvent"]');if(!del)return;const m=(del.getAttribute('onclick')||'').match(/deleteHealthEvent\(['"]([^'"]+)/);if(!m)return;const id=m[1];del.removeAttribute('onclick');del.onclick=()=>strictDelete(id);if(!tr.querySelector('.health-edit-btn')){const b=document.createElement('button');b.type='button';b.className='btn btn-secondary health-edit-btn';b.textContent='ویرایش';b.onclick=()=>fill(id);del.parentNode.insertBefore(b,del)}})}
  function bindSubmitGuards(){const eventForm=document.getElementById('healthEventForm'),necForm=document.getElementById('necropsyForm');if(eventForm&&!eventForm.dataset.reliableSubmit){eventForm.dataset.reliableSubmit='1';eventForm.addEventListener('submit',async ev=>{if(editId)return;ev.preventDefault();ev.stopImmediatePropagation();try{if(typeof saveHealthEvent!=='function')throw new Error('تابع ثبت رخداد سلامت بارگذاری نشده است.');await saveHealthEvent(ev)}catch(e){console.error('ADINEH health event submit:',e);notify('ثبت رخداد انجام نشد: '+e.message,'error')}},{capture:true})}if(necForm&&!necForm.dataset.reliableSubmit){necForm.dataset.reliableSubmit='1';necForm.addEventListener('submit',async ev=>{ev.preventDefault();ev.stopImmediatePropagation();try{if(typeof saveNecropsy!=='function')throw new Error('تابع ثبت کالبدگشایی بارگذاری نشده است.');await saveNecropsy(ev)}catch(e){console.error('ADINEH necropsy submit:',e);notify('ثبت علائم و کالبدگشایی انجام نشد: '+e.message,'error')}},{capture:true})}}
  function compactClinicalSections(){
    const container=document.getElementById('clinicalSignsContainer');
    if(container&&!container.dataset.compactReady){
      const nodes=Array.from(container.children);
      const groups=[];
      for(let i=0;i<nodes.length;i++){
        const h=nodes[i];
        if(h.matches&&h.matches('.sub-title')){
          const grid=nodes[i+1];
          if(grid&&grid.classList.contains('check-grid'))groups.push({h,grid});
        }
      }
      if(groups.length){
        container.innerHTML='';
        const order=['تلفات','تنفسی','حرکتی','عصبی','عمومی','گوارشی'];
        groups.sort((a,b)=>{const ai=order.indexOf(a.h.textContent.trim()),bi=order.indexOf(b.h.textContent.trim());return (ai<0?99:ai)-(bi<0?99:bi)});
        groups.forEach(({h,grid})=>{
          const section=document.createElement('div');section.className='adine-collapsible-section';
          const button=document.createElement('button');button.type='button';button.className='adine-collapsible-header';button.setAttribute('aria-expanded','false');
          const title=document.createElement('span');title.textContent=h.textContent.trim();
          const icon=document.createElement('span');icon.className='adine-collapsible-icon';icon.textContent='+';button.append(title,icon);
          grid.classList.add('adine-collapsible-content');grid.hidden=true;
          button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!open));icon.textContent=open?'+':'−';grid.hidden=open;section.classList.toggle('open',!open)});
          section.append(button,grid);container.appendChild(section);
        });
        container.dataset.compactReady='1';
      }
    }
    const clinicalPanel=document.getElementById('panel-clinical');
    if(clinicalPanel&&!clinicalPanel.dataset.necCompactReady){
      const cards=clinicalPanel.querySelectorAll(':scope > .card');
      const necCard=cards.length>1?cards[1]:null;
      const title=necCard?.querySelector('.section-title');
      const form=necCard?.querySelector('#necropsyForm');
      if(necCard&&title&&form){
        const header=document.createElement('button');header.type='button';header.className='adine-collapsible-header adine-necropsy-header';header.setAttribute('aria-expanded','false');
        const text=document.createElement('span');text.textContent='کالبدگشایی';const icon=document.createElement('span');icon.className='adine-collapsible-icon';icon.textContent='+';header.append(text,icon);title.replaceWith(header);form.hidden=true;
        header.addEventListener('click',()=>{const open=header.getAttribute('aria-expanded')==='true';header.setAttribute('aria-expanded',String(!open));icon.textContent=open?'+':'−';form.hidden=open;necCard.classList.toggle('adine-necropsy-open',!open)});
        necCard.dataset.necCompactReady='1';
      }
    }
    let style=document.getElementById('adine-clinical-compact-style');
    if(!style){style=document.createElement('style');style.id='adine-clinical-compact-style';style.textContent=`
      #panel-clinical .adine-collapsible-section{margin:0 0 8px;border:1px solid #e1e8e4;border-radius:12px;background:#fff;overflow:hidden}
      #panel-clinical .adine-collapsible-header{width:100%;display:flex;align-items:center;justify-content:space-between;direction:rtl;border:0;background:#f7faf8;color:#173f35;padding:12px 14px;margin:0;font:600 14px/1.5 inherit;text-align:right;cursor:pointer;box-sizing:border-box}
      #panel-clinical .adine-collapsible-header:active{transform:none}
      #panel-clinical .adine-collapsible-icon{width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:1px solid #cbd8d1;border-radius:7px;font-size:19px;line-height:1;font-weight:500;flex:0 0 24px}
      #panel-clinical .adine-collapsible-content{padding:10px;margin:0!important}
      #panel-clinical .adine-collapsible-content[hidden],#panel-clinical #necropsyForm[hidden]{display:none!important}
      #panel-clinical .adine-necropsy-header{margin:0}
      #panel-clinical .adine-necropsy-open .adine-necropsy-header{border-bottom:1px solid #e1e8e4}
      #panel-clinical .adine-necropsy-open #necropsyForm{padding-top:12px}
      #panel-clinical .sub-title{display:none!important}
      #panel-clinical .check-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
      @media(max-width:700px){#panel-clinical .check-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;document.head.appendChild(style)}
  }
  function init(){bindNumbers(document);addControls();bindSubmitGuards();compactClinicalSections();const form=document.getElementById('healthEventForm');if(form&&!form.dataset.editControls){form.dataset.editControls='1';const c=document.createElement('button');c.id='cancelHealthEventEdit';c.type='button';c.className='btn btn-secondary';c.textContent='انصراف از ویرایش';c.style.display='none';c.onclick=()=>{editId=null;form.reset();const s=form.querySelector('button[type="submit"]');if(s)s.textContent='ثبت رخداد';c.style.display='none'};form.appendChild(c)} }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();setTimeout(init,500);setTimeout(init,1200);setTimeout(init,2500);setTimeout(compactClinicalSections,1800);
})();