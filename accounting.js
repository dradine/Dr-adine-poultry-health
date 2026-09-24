document.addEventListener('DOMContentLoaded', async function(){
  var $=function(id){return document.getElementById(id)};
  var esc=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})};
  var state={type:new URLSearchParams(location.search).get('type')||localStorage.getItem('adine_accounting_type')||'layer',farmId:new URLSearchParams(location.search).get('farm')||localStorage.getItem('adine_accounting_farm')||'',farms:[]};
  var auth=window.AdineAuth?await AdineAuth.requireAuth():null;if(!auth)return;
  function farmType(v){var s=String(v||'').toLowerCase();if(/layer|egg|تخم/.test(s))return 'layer';if(/broiler|meat|گوشتی/.test(s))return 'broiler';return null}
  function currentFarm(){return state.farms.find(function(f){return String(f.id)===String(state.farmId)})||null}
  function syncUrl(){var p=new URLSearchParams(location.search);if(state.farmId)p.set('farm',state.farmId);else p.delete('farm');p.set('type',state.type);history.replaceState(null,'',location.pathname+'?'+p.toString())}
  function setType(t){state.type=t==='broiler'?'broiler':'layer';localStorage.setItem('adine_accounting_type',state.type);document.querySelectorAll('.type-card').forEach(function(b){b.classList.toggle('active',b.dataset.type===state.type)});syncUrl();render()}
  document.querySelectorAll('.type-card').forEach(function(b){b.onclick=function(){setType(b.dataset.type)}});
  $('backDashboard').onclick=$('bottomDashboard').onclick=function(){location.href='Dashboard.html'};
  $('backFarms').onclick=$('bottomFarms').onclick=function(){location.href='Farms.html'};
  $('farmSelect').onchange=function(){state.farmId=this.value;localStorage.setItem('adine_accounting_farm',state.farmId);var t=farmType(currentFarm()&&currentFarm().farm_type);if(t)state.type=t;document.querySelectorAll('.type-card').forEach(function(b){b.classList.toggle('active',b.dataset.type===state.type)});syncUrl();render()};
  async function loadFarms(){
    var p=auth.profile||{},role=String(p.user_type||p.role||'').toLowerCase();
    var q=supabaseClient.from('farms').select('id,name,farm_code,farm_type').order('created_at',{ascending:false});
    var res=['owner','admin'].includes(role)?await q:await q.eq('owner_id',p.id);
    if(res.error){$('farmSelect').innerHTML='<option>خطا در دریافت فارم‌ها</option>';$('farmStatus').textContent='خطا';render();return}
    state.farms=res.data||[];
    if(!state.farmId||!state.farms.some(function(f){return String(f.id)===String(state.farmId)}))state.farmId=state.farms[0]?state.farms[0].id:'';
    $('farmSelect').innerHTML=state.farms.length?state.farms.map(function(f){return '<option value="'+esc(f.id)+'">'+esc(f.name)+(f.farm_code?' — '+esc(f.farm_code):'')+'</option>'}).join(''):'<option value="">فارمی ثبت نشده است</option>';
    $('farmSelect').value=state.farmId;$('farmStatus').textContent=state.farmId?'فارم فعال':'بدون فارم';
    var detected=farmType(currentFarm()&&currentFarm().farm_type);if(detected)state.type=detected;
    localStorage.setItem('adine_accounting_farm',state.farmId||'');localStorage.setItem('adine_accounting_type',state.type);syncUrl();
    document.querySelectorAll('.type-card').forEach(function(b){b.classList.toggle('active',b.dataset.type===state.type)});render();
  }
  function common(title,sub,note){return '<section class="ac-panel"><h2>'+title+'</h2><p class="sub">'+sub+'</p><div class="ledger-note">'+note+'</div></section>'}
  function kpis(items){return '<section class="ac-panel"><h2>شاخص‌های اصلی</h2><p class="sub">مقادیر پس از ثبت داده‌های واقعی محاسبه می‌شوند.</p><div class="kpi-grid">'+items.map(function(x){return '<div class="kpi '+x[0]+'"><small>'+x[1]+'</small><strong>—</strong><span class="unit">'+x[2]+'</span></div>'}).join('')+'</div></section>'}
  function modules(items){return '<section class="ac-panel"><h2>عملیات مالی</h2><p class="sub">فرم‌ها بر اساس ساختار اقتصادی همین نوع گله تفکیک شده‌اند.</p><div class="module-grid">'+items.map(function(x){return '<button class="module" data-open-form="'+x[0]+'"><span class="ico">'+x[1]+'</span><b>'+x[2]+'</b><span>'+x[3]+'</span></button>'}).join('')+'</div></section>'}
  function dateField(){return '<div class="form-group"><label>تاریخ</label><input class="jalali-input" type="text" inputmode="none" readonly placeholder="انتخاب تاریخ شمسی"><span class="date-note">تقویم شمسی • جلالی</span></div>'}
  function quickCards(a,b){return '<section class="ac-panel"><h2>ثبت سریع</h2><p class="sub">رابط ثبت آماده است؛ ذخیره‌سازی واقعی پس از نهایی‌شدن جداول مالی فعال می‌شود.</p><div class="entry-grid"><div class="entry-card"><h3>'+a[0]+'</h3><p>'+a[1]+'</p><button class="ac-btn primary" data-open-form="'+a[2]+'">'+a[3]+'</button></div><div class="entry-card"><h3>'+b[0]+'</h3><p>'+b[1]+'</p><button class="ac-btn primary" data-open-form="'+b[2]+'">'+b[3]+'</button></div></div><div id="quickForm" class="hidden" style="margin-top:12px"></div></section>'}
  function charts(kind){return '<section class="ac-panel"><h2>تحلیل مالی '+kind+'</h2><p class="sub">نمودارهای هزینه و درآمد دایره‌ای هستند؛ با Hover یا لمس، مبلغ و سهم نمایش داده می‌شود. سود و زیان به‌صورت روندی نمایش داده خواهد شد.</p><div class="charts-grid"><div class="chart-card"><h3>نمودار هزینه‌ها</h3><p>ترکیب هزینه‌ها</p><div class="chart-box"><canvas id="expenseChart"></canvas><div class="chart-empty" id="expenseEmpty">هنوز هزینه‌ای ثبت نشده است.<br>بعد از ثبت تراکنش، نمودار فعال می‌شود.</div></div></div><div class="chart-card"><h3>نمودار درآمدها</h3><p>ترکیب درآمدها</p><div class="chart-box"><canvas id="incomeChart"></canvas><div class="chart-empty" id="incomeEmpty">هنوز درآمدی ثبت نشده است.<br>بعد از ثبت فروش، نمودار فعال می‌شود.</div></div></div><div class="chart-card"><h3>سود و زیان</h3><p>درآمد منهای هزینه در طول زمان</p><div class="chart-box"><canvas id="profitChart"></canvas><div class="chart-empty" id="profitEmpty">برای نمایش روند، داده مالی لازم است.</div></div></div><div class="chart-card"><h3>تحلیل اقتصادی</h3><p>شاخص‌های اختصاصی '+kind+'</p><div class="chart-box"><div class="chart-empty">پس از اتصال داده‌های واقعی، شاخص‌های اقتصادی اختصاصی این بخش نمایش داده می‌شوند.</div></div></div></div></section>'}
  function forms(){return '<section class="ac-panel"><h2>فرم ثبت تراکنش</h2><p class="sub">تمام تاریخ‌ها شمسی و تمام مبالغ تومان هستند.</p><div id="quickForm" class="entry-card hidden"></div></section>'}
  function render(){
    var farm=currentFarm(),actual=farmType(farm&&farm.farm_type);if(actual)state.type=actual;
    var html='';
    if(state.type==='layer'){
      html+=common('🥚 داشبورد مالی تخم‌گذار','محور حسابداری: گله + تولید تخم + فروش + هزینه‌های دوره تولید.','گردش گله مستقل ثبت می‌شود: خرید اولیه، ورود جدید، انتقال، تلفات و حذف؛ بنابراین موجودی فعلی همیشه از رویدادهای واقعی ساخته می‌شود.');
      html+=kpis([['green','موجودی فعلی گله','قطعه'],['blue','فروش تخم','تومان'],['orange','هزینه تولید','تومان'],['red','سود / زیان','تومان']]);
      html+=modules([['layer-flock','🐔','خرید و ورود گله','خرید اولیه، خرید جدید و انتقال'],['layer-change','🔄','گردش گله','تلفات، حذف، انتقال خروجی و افزایش'],['layer-eggs','🥚','فروش تخم','تعداد، شانه، کارتن، قیمت و دریافت'],['layer-cull','💰','فروش مرغ حذفی','تعداد، وزن، قیمت و خریدار'],['layer-expense','💸','هزینه‌ها','خوراک، دارو، انرژی، کارگر و سایر'],['payments','💳','دریافت و پرداخت','نقدی، کارت، نسیه و مانده']]);
      html+=quickCards(['🐔 ورود / خرید گله','تعداد، منبع، سن، قیمت هر قطعه و هزینه ورود.','layer-flock','ثبت ورود گله'],['🥚 فروش تخم','تعداد، شانه/کارتن، قیمت، مشتری و دریافت.','layer-eggs','ثبت فروش تخم']);
      html+=charts('تخم‌گذار');
    }else{
      html+=common('🐔 داشبورد مالی گوشتی','محور حسابداری: دوره پرورش + هزینه دوره + فروش مرغ + سود/زیان دوره.','هر دوره مالی مستقل است؛ خرید جوجه، خوراک، دارو، انرژی، بستر، کارگری، حمل و فروش به همان دوره متصل می‌شوند.');
      html+=kpis([['green','هزینه کل دوره','تومان'],['blue','درآمد فروش','تومان'],['orange','هزینه هر کیلو','تومان/کیلو'],['red','سود / زیان دوره','تومان']]);
      html+=modules([['broiler-batch','📋','دوره پرورش','تعریف دوره، سالن و گله'],['broiler-chick','🐣','خرید جوجه','تعداد، قیمت و هزینه ورود'],['broiler-feed','🌾','خوراک','مقدار، قیمت و هزینه تجمعی'],['broiler-expense','💸','هزینه‌های دوره','دارو، انرژی، کارگر، بستر و حمل'],['broiler-sale','⚖️','فروش مرغ','تعداد، وزن، قیمت و کسورات'],['payments','💳','دریافت و پرداخت','نقدی، کارت، نسیه و مانده']]);
      html+=quickCards(['🐣 خرید جوجه','تعداد، قیمت قطعه، حمل و هزینه ورود.','broiler-chick','ثبت خرید جوجه'],['⚖️ فروش مرغ','تعداد، وزن زنده، قیمت هر کیلو و کسورات.','broiler-sale','ثبت فروش مرغ']);
      html+=charts('گوشتی');
    }
    $('accountingWorkspace').innerHTML=html;wire();
  }
  function wire(){
    document.querySelectorAll('[data-open-form]').forEach(function(b){b.onclick=function(){openForm(b.dataset.openForm)}});
    drawEmptyCharts();
  }
  function openForm(action){
    var box=$('quickForm');if(!box)return;box.classList.remove('hidden');
    var title={'layer-flock':'🐔 ثبت ورود / خرید گله','layer-eggs':'🥚 ثبت فروش تخم','layer-change':'🔄 ثبت تغییر موجودی گله','layer-cull':'💰 ثبت فروش مرغ حذفی','layer-expense':'💸 ثبت هزینه','broiler-batch':'📋 تعریف دوره پرورش','broiler-chick':'🐣 ثبت خرید جوجه','broiler-feed':'🌾 ثبت خوراک','broiler-expense':'💸 ثبت هزینه دوره','broiler-sale':'⚖️ ثبت فروش مرغ','payments':'💳 ثبت دریافت / پرداخت'}[action]||'ثبت تراکنش';
    box.innerHTML='<h3>'+title+'</h3><div class="form-grid">'+dateField()+'<div class="form-group"><label>مبلغ</label><input inputmode="numeric" placeholder="مبلغ به تومان"><span class="date-note">واحد ثابت: تومان</span></div><div class="form-group"><label>تعداد / مقدار</label><input inputmode="numeric" placeholder="در صورت نیاز"></div><div class="form-group"><label>طرف حساب / منبع</label><input placeholder="نام مشتری یا تأمین‌کننده"></div><div class="form-group full"><label>توضیحات</label><textarea rows="3" placeholder="توضیحات اختیاری"></textarea></div></div><div class="ac-toolbar"><button class="ac-btn primary" type="button" data-save>ثبت آزمایشی فرم</button><button class="ac-btn ghost" type="button" data-close>بستن</button></div>';
    box.querySelector('[data-save]').onclick=function(){alert('فرم و قواعد ورود آماده است؛ ذخیره مالی واقعی در مرحله اتصال جداول جدید حسابداری فعال می‌شود.')};
    box.querySelector('[data-close]').onclick=function(){box.classList.add('hidden');box.innerHTML=''};
    if(window.__ADINE_SHARED_JALALI_V1__)document.dispatchEvent(new Event('DOMContentLoaded'));
  }
  function drawEmptyCharts(){if(!window.Chart)return;['expenseChart','incomeChart','profitChart'].forEach(function(id){var c=$(id);if(!c)return;var old=Chart.getChart(c);if(old)old.destroy();if(id==='profitChart'){new Chart(c,{type:'line',data:{labels:[],datasets:[{label:'سود / زیان',data:[],tension:.35,borderWidth:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}} ,scales:{x:{display:false},y:{display:false}}}})}else{new Chart(c,{type:'doughnut',data:{labels:[],datasets:[{data:[],borderWidth:0,hoverOffset:7}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{display:false}}}})}})}
  await loadFarms();
});