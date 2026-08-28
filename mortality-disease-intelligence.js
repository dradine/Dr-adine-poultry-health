/* ADINEH — Mortality & Disease Intelligence v1
 * Isolated to mortality.html. No write operations; reads existing health data and standards.
 * Four production types: broiler, pullet, layer, breeder.
 */
(function(){
  'use strict';

  const TYPE_LABELS = {
    broiler: 'گوشتی',
    pullet: 'پولت',
    layer: 'تخمگذار',
    breeder: 'مادر'
  };

  const DISEASE_EVENT_TYPES = new Set(['disease','suspected_disease','clinical_case']);

  function faNumber(value, digits){
    if(value === null || value === undefined || Number.isNaN(Number(value))) return '—';
    const n = Number(value);
    return n.toLocaleString('fa-IR', {maximumFractionDigits: digits ?? 2});
  }

  function pct(value){
    return value === null || value === undefined || Number.isNaN(Number(value)) ? '—' : `${faNumber(value,2)}٪`;
  }

  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  function normalizeType(value){
    const v = String(value || '').toLowerCase().trim();
    if(v.includes('broil') || v.includes('گوش')) return 'broiler';
    if(v.includes('pullet') || v.includes('پولت')) return 'pullet';
    if(v.includes('layer') || v.includes('تخم')) return 'layer';
    if(v.includes('breeder') || v.includes('مادر')) return 'breeder';
    return v || null;
  }

  function ageFromRow(row, flock){
    if(Number.isFinite(Number(row.age_days))) return Number(row.age_days);
    if(row.event_date && flock?.placement_date){
      const a = new Date(`${flock.placement_date}T00:00:00Z`).getTime();
      const b = new Date(`${row.event_date}T00:00:00Z`).getTime();
      if(Number.isFinite(a) && Number.isFinite(b)) return Math.max(0, Math.floor((b-a)/86400000));
    }
    return null;
  }

  function pickStandard(standards, flock, age){
    if(age === null) return null;
    const type = normalizeType(flock?.production_type);
    const genetics = String(flock?.genetics || '').toLowerCase();
    const strain = String(flock?.strain || '').toLowerCase();
    const candidates = (standards || []).filter(s =>
      normalizeType(s.production_type) === type &&
      Number(s.age_min_days) <= age && age <= Number(s.age_max_days) &&
      s.metric === 'mortality' && s.metric_scope === 'cumulative'
    );
    if(!candidates.length) return null;
    candidates.sort((a,b)=>{
      const score = s => (String(s.strain||'').toLowerCase() && strain && String(s.strain).toLowerCase()===strain ? 8 : 0)
        + (String(s.genetics||'').toLowerCase() && genetics && String(s.genetics).toLowerCase()===genetics ? 4 : 0)
        + (s.expected_mortality_percent != null ? 2 : 0);
      return score(b)-score(a);
    });
    return candidates[0];
  }

  function classify(actual, standard){
    if(!standard || standard.expected_mortality_percent == null) return {kind:'neutral', text:'مرجع عددی معتبر برای این سن در بانک فعلی ثبت نشده است'};
    const ref = Number(standard.expected_mortality_percent);
    const deviation = ref === 0 ? null : ((actual-ref)/ref)*100;
    if(actual <= ref) return {kind:'good', text:`در حد مرجع یا پایین‌تر؛ انحراف ${deviation === null ? '—' : faNumber(deviation,1)}٪`};
    if(deviation !== null && deviation <= 25) return {kind:'watch', text:`بالاتر از مرجع؛ انحراف ${faNumber(deviation,1)}٪`};
    return {kind:'danger', text:`بالاتر از مرجع؛ انحراف قابل توجه ${faNumber(deviation,1)}٪`};
  }

  function injectStyles(){
    if(document.getElementById('mortality-intelligence-style')) return;
    const style = document.createElement('style');
    style.id = 'mortality-intelligence-style';
    style.textContent = `
      .mi-card{margin-top:16px;border:1px solid #e1e8e4;border-radius:16px;background:#fff;overflow:hidden}
      .mi-head{padding:15px 16px;background:#f6faf8;border-bottom:1px solid #e5ebe8;display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}
      .mi-title{font-weight:800;color:#173f35;font-size:16px}.mi-sub{font-size:12px;color:#6d7872;margin-top:4px}
      .mi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:14px}
      .mi-kpi{border:1px solid #e7ece9;border-radius:12px;padding:12px;background:#fbfdfc}.mi-kpi b{display:block;font-size:20px;color:#173f35;margin-top:4px}.mi-kpi span{font-size:12px;color:#6d7872}
      .mi-body{padding:0 14px 14px}.mi-alert{padding:11px 12px;border-radius:11px;margin-top:8px;border:1px solid #e5ebe8;font-size:13px}.mi-alert.good{background:#eff9f2;color:#176b37}.mi-alert.watch{background:#fff7e8;color:#8a4b00}.mi-alert.danger{background:#fff0f0;color:#a61b1b}.mi-alert.neutral{background:#f7f8f8;color:#5e6964}
      .mi-table{width:100%;border-collapse:collapse;font-size:12px}.mi-table th,.mi-table td{padding:9px;border-bottom:1px solid #edf0ef;text-align:right;white-space:nowrap}.mi-table th{color:#5d6963;background:#fafcfb}
      .mi-source{font-size:11px;color:#7a8580;margin-top:10px;line-height:1.8}
      @media(max-width:800px){.mi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.mi-table{min-width:650px}}
      @media(max-width:480px){.mi-grid{grid-template-columns:1fr 1fr}.mi-kpi b{font-size:17px}}
    `;
    document.head.appendChild(style);
  }

  function renderShell(){
    const overview = document.getElementById('healthOverview');
    if(!overview || document.getElementById('mortalityIntelligence')) return;
    const card = document.createElement('section');
    card.id='mortalityIntelligence';
    card.className='mi-card';
    card.innerHTML=`
      <div class="mi-head"><div><div class="mi-title">تحلیل هوشمند تلفات و بیماری</div><div class="mi-sub" id="miTypeNote">در حال تحلیل گله...</div></div><span class="badge">۴ تیپ پرورشی</span></div>
      <div class="mi-grid">
        <div class="mi-kpi"><span>تلفات ثبت‌شده</span><b id="miMortality">—</b></div>
        <div class="mi-kpi"><span>حذفی ثبت‌شده</span><b id="miCull">—</b></div>
        <div class="mi-kpi"><span>موارد بیماری</span><b id="miDisease">—</b></div>
        <div class="mi-kpi"><span>مرگ ناگهانی</span><b id="miSudden">—</b></div>
      </div>
      <div class="mi-body"><div id="miAlerts"></div><div class="table-wrapper" style="margin-top:12px"><table class="mi-table"><thead><tr><th>هفته</th><th>سن</th><th>تلفات</th><th>حذفی</th><th>درگیر</th><th>تلفات تجمعی/ثبت‌شده</th><th>مرجع</th><th>وضعیت</th></tr></thead><tbody id="miRows"></tbody></table></div><div class="mi-source">مرجع عددی فقط زمانی نمایش داده می‌شود که برای تیپ و سن گله در بانک استاندارد مقدار معتبر وجود داشته باشد؛ در غیر این صورت سیستم عدد ساختگی تولید نمی‌کند.</div></div>`;
    overview.prepend(card);
  }

  async function run(){
    if(!window.supabaseClient) return;
    if(!window.healthFlock) return;
    injectStyles(); renderShell();
    const flock = window.healthFlock;
    const type = normalizeType(flock.production_type);
    document.getElementById('miTypeNote').textContent = `گله ${TYPE_LABELS[type] || 'نامشخص'} | ${flock.flock_name || 'بدون نام'} | تحلیل رخدادهای ثبت‌شده`;

    const [dailyRes, stdRes] = await Promise.all([
      supabaseClient.from('health_mortality_event_daily').select('*').eq('flock_id', flock.id).order('event_date',{ascending:false}).limit(120),
      supabaseClient.from('poultry_mortality_standards').select('*').eq('is_active',true)
    ]);
    if(dailyRes.error){ console.warn('Mortality intelligence daily view:',dailyRes.error); return; }
    const daily = dailyRes.data || [];
    const standards = stdRes.error ? [] : (stdRes.data || []);

    const mortality = daily.reduce((s,r)=>s+Number(r.mortality_count||0),0);
    const cull = daily.reduce((s,r)=>s+Number(r.cull_count||0),0);
    const disease = daily.reduce((s,r)=>s+Number(r.disease_events||0),0);
    const sudden = daily.reduce((s,r)=>s+Number(r.sudden_death_events||0),0);
    document.getElementById('miMortality').textContent=faNumber(mortality);
    document.getElementById('miCull').textContent=faNumber(cull);
    document.getElementById('miDisease').textContent=faNumber(disease);
    document.getElementById('miSudden').textContent=faNumber(sudden);

    const latestAge = daily.length ? Number(daily[0].age_days) : null;
    const latestStandard = pickStandard(standards,flock,latestAge);
    const alerts=[];
    if(sudden>0) alerts.push({kind:'danger',text:`${faNumber(sudden)} رخداد مرگ ناگهانی ثبت شده است؛ بررسی سریع، کالبدگشایی و در صورت لزوم نمونه‌برداری توصیه می‌شود.`});
    if(daily.some(r=>Number(r.disease_events||0)>0)) alerts.push({kind:'watch',text:'رخداد بیماری ثبت شده است؛ تشخیص را از «مشکوک» تا «آزمایشگاهی/تأییدشده» تفکیک کنید و نتیجه آزمایش را به پرونده متصل نگه دارید.'});
    if(latestStandard && latestStandard.expected_mortality_percent != null){
      const pop=Number(daily[0]?.population_snapshot||flock.initial_bird_count||0);
      if(pop>0){
        const cumulative=(mortality/pop)*100;
        const c=classify(cumulative,latestStandard);
        alerts.push({kind:c.kind,text:`مرجع ${TYPE_LABELS[type]||type} در سن ${faNumber(latestAge)} روز: ${pct(latestStandard.expected_mortality_percent)}؛ تلفات ثبت‌شده نسبت به جمعیت مبنا: ${pct(cumulative)} — ${c.text}`});
      }
    } else {
      alerts.push({kind:'neutral',text:`برای ${TYPE_LABELS[type]||'این تیپ'} در سن فعلی مرجع عددی کافی در بانک استاندارد تلفات موجود نیست؛ سیستم از اعمال آستانه ساختگی خودداری می‌کند.`});
    }
    document.getElementById('miAlerts').innerHTML=alerts.map(a=>`<div class="mi-alert ${a.kind}">${esc(a.text)}</div>`).join('');

    const sorted = [...daily].sort((a,b)=>String(a.event_date).localeCompare(String(b.event_date)));
    let cumulative=0;
    const rows = sorted.slice(-12).reverse().map(r=>{
      cumulative += Number(r.mortality_count||0);
      const age=Number(r.age_days);
      const week=age>=0 ? Math.floor(age/7)+1 : null;
      const st=pickStandard(standards,flock,age);
      const pop=Number(r.population_snapshot||flock.initial_bird_count||0);
      const cumPct=pop>0 ? (cumulative/pop)*100 : null;
      const c=st && st.expected_mortality_percent!=null && cumPct!=null ? classify(cumPct,st) : {kind:'neutral',text:'بدون مرجع عددی'};
      return `<tr><td>${week==null?'—':faNumber(week)}</td><td>${age==null?'—':faNumber(age)}</td><td>${faNumber(r.mortality_count)}</td><td>${faNumber(r.cull_count)}</td><td>${faNumber(r.affected_count)}</td><td>${pct(cumPct)}</td><td>${st&&st.expected_mortality_percent!=null?pct(st.expected_mortality_percent):'—'}</td><td><span class="badge ${c.kind==='danger'?'badge-danger':c.kind==='watch'?'badge-warning':c.kind==='good'?'badge-success':''}">${esc(c.text)}</span></td></tr>`;
    });
    document.getElementById('miRows').innerHTML=rows.length?rows.join(''):`<tr><td colspan="8" class="empty-state">هنوز رخداد تلفات/بیماری برای این گله ثبت نشده است.</td></tr>`;
  }

  function boot(){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(window.supabaseClient && window.healthFlock){ clearInterval(timer); run().catch(e=>console.error('Mortality intelligence:',e)); }
      if(tries>60) clearInterval(timer);
    },500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
