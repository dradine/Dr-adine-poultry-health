/* ADINE FARM SCORE LOADER — CANONICAL V11
   Safe loader. Reports flock bootstrap uses the actual flocks schema and
   deliberately relies on Supabase RLS for authorized farm/professional access.
*/
(function(g){
  "use strict";
  if (g.__ADINE_CANONICAL_ENGINE_REQUESTED) return;
  g.__ADINE_CANONICAL_ENGINE_REQUESTED = true;

  function load(src,next){
    if(document.querySelector('script[data-adine-src="'+src+'"]')){if(next)next();return;}
    var s=document.createElement('script');
    s.src=src;s.async=false;s.dataset.adineSrc=src;
    s.onload=function(){if(next)next();};
    s.onerror=function(e){console.error('Adine canonical loader failed:',src,e);};
    document.head.appendChild(s);
  }
  function flockLabel(f){return f.flock_name||f.flock_code||('گله '+String(f.id||'').slice(0,8));}
  function flockType(f){
    var x=String(f.production_type||'').trim().toLowerCase();
    if(x.indexOf('layer')>=0||x.indexOf('تخم')>=0)return 'تخم‌گذار';
    if(x.indexOf('breeder')>=0||x.indexOf('مادر')>=0)return 'مادر';
    if(x.indexOf('pullet')>=0||x.indexOf('پولت')>=0)return 'پولت';
    return 'گوشتی';
  }
  function fill(sel,rows){
    var current=sel.value;
    sel.innerHTML='';
    var first=document.createElement('option');first.value='';first.textContent='یک گله را انتخاب کنید';sel.appendChild(first);
    rows.forEach(function(f){
      var o=document.createElement('option');o.value=f.id;
      var farm=f.farms&&f.farms.name?' — '+f.farms.name:'';
      var house=f.houses&&f.houses.name?' / '+f.houses.name:'';
      o.textContent=flockLabel(f)+' — '+flockType(f)+farm+house;
      sel.appendChild(o);
    });
    if(current&&rows.some(function(f){return String(f.id)===String(current)}))sel.value=current;
  }
  async function populateReportsFlocks(){
    var sel=document.getElementById('flockSelect');
    if(!sel||!g.supabaseClient)return false;
    sel.innerHTML='<option value="">در حال دریافت گله‌ها...</option>';
    try{
      var auth=await g.supabaseClient.auth.getUser();
      var user=auth&&auth.data&&auth.data.user;
      if(!user){sel.innerHTML='<option value="">کاربر وارد نشده است</option>';return false;}

      /* IMPORTANT: do NOT filter by owner_id here. The flocks SELECT RLS policy
         already authorizes owners, farm owners, admins/owners and professionals.
         Filtering by owner_id previously hid professionally assigned farms. */
      var q=g.supabaseClient.from('flocks')
        .select('id,flock_name,flock_code,production_type,farm_id,house_id,farms(id,name),houses(id,name)')
        .order('created_at',{ascending:false});
      var res=await q;
      if(res.error)throw res.error;
      var rows=Array.isArray(res.data)?res.data:[];
      fill(sel,rows);
      sel.dispatchEvent(new Event('adine:flocks-loaded'));
      return true;
    }catch(err){
      console.error('Adine reports flock loading failed:',err);
      sel.innerHTML='<option value="">خطا در دریافت گله‌ها — دوباره تلاش کنید</option>';
      return false;
    }
  }
  function startReportsFlockBootstrap(){
    if(!document.getElementById('flockSelect'))return;
    var tries=0;
    var timer=setInterval(function(){
      tries++;
      if(g.supabaseClient){clearInterval(timer);populateReportsFlocks();}
      else if(tries>100){clearInterval(timer);console.error('Adine reports: supabaseClient not available');}
    },100);
  }
  if(typeof document!=='undefined'){
    load('report-period-normalizer-v1.js',function(){
      load('benchmark-report-adapter-v1.js',function(){
        load('report-week-selector-v1.js',function(){load('performance-period-engine-v9.js');});
      });
    });
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startReportsFlockBootstrap,{once:true});
    else startReportsFlockBootstrap();
  }
  g.__adinePopulateReportsFlocks=populateReportsFlocks;
})(window);