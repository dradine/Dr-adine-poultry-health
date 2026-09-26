(() => {
  const ENDPOINT = 'https://vzcczkavlopznljnnehp.supabase.co/functions/v1/video-search';
  const curated = [
    {
      source:'youtube', platform:'YouTube', curated:true, title:'اصول تهویه در پرورش مرغ گوشتی — جانمایی تجهیزات در سالن مرغداری',
      description:'محتوای فارسی آموزشی درباره تهویه و جانمایی تجهیزات سالن مرغ گوشتی.',
      url:'https://www.youtube.com/watch?v=NzcVK_hUhs8', thumbnail:'https://i.ytimg.com/vi/NzcVK_hUhs8/hqdefault.jpg',
      queryTerms:['تهویه','مرغ گوشتی','فن','اینلت','ventilation']
    },
    {
      source:'web', platform:'Aparat', curated:true, title:'اهمیت امگا ۳ و استراتژی‌های استفاده از آن در مزارع مرغ مادر',
      description:'نمونه وبینار تخصصی صنعت طیور با میزبانی آپارات و معرفی‌شده توسط ITPNews.',
      url:'https://aparat.com/v/baKml', thumbnail:'',
      queryTerms:['مرغ مادر','تغذیه','امگا','omega','breeder']
    },
    {
      source:'web', platform:'ITPNews', curated:true, title:'مدیریت جوجه‌کشی',
      description:'نمونه محتوای آموزشی ITPNews درباره مدیریت جوجه‌کشی.',
      url:'https://www.itpnews.com/webinar/90', thumbnail:'',
      queryTerms:['جوجه کشی','جوجه‌کشی','هچری','ستر','هچر','hatchery','incubation']
    },
    {
      source:'web', platform:'Aviagen', curated:true, title:'منابع تصویری و آموزشی مدیریت مرغ گوشتی',
      description:'مسیر رسمی منابع فنی Aviagen برای مدیریت broiler و موضوعات عملکردی.',
      url:'https://aviagen.com/technical-center/',
      thumbnail:'',
      queryTerms:['مرغ گوشتی','broiler','عملکرد','تهویه','سلامت']
    }
  ];

  const form=document.getElementById('tv-video-search-form');
  const input=document.getElementById('tv-video-query');
  const order=document.getElementById('tv-video-order');
  const resultsEl=document.getElementById('tv-video-results');
  const statusEl=document.getElementById('tv-search-status');
  const countEl=document.getElementById('tv-result-count');
  const moreBtn=document.getElementById('tv-search-more');
  let allResults=[], nextPageToken='', nextWebPage=0, activeSource='all', lastQuery='';

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const matches=(item,q)=>{
    const hay=(item.title+' '+item.description+' '+(item.queryTerms||[]).join(' ')).toLocaleLowerCase('fa');
    return q.trim().toLocaleLowerCase('fa').split(/\s+/).filter(Boolean).some(x=>hay.includes(x));
  };
  const filtered=()=>activeSource==='all'?allResults:activeSource==='curated'?allResults.filter(x=>x.curated):allResults.filter(x=>x.source===activeSource);

  function render(){
    const list=filtered();
    countEl.textContent=list.length?list.length+' نتیجه':'';
    if(!list.length){
      resultsEl.innerHTML='<div class="search-empty"><strong>نتیجه‌ای برای این فیلتر پیدا نشد.</strong><span>منبع دیگری را انتخاب کن یا عبارت را کمی عمومی‌تر بنویس.</span></div>';
      return;
    }
    resultsEl.innerHTML=list.map(v=>{
      const thumb=v.thumbnail?'<img loading="lazy" src="'+esc(v.thumbnail)+'" alt="">':'<div class="video-thumb-fallback"><span>▶</span></div>';
      return '<article class="video-result-card">'+
        '<a class="video-thumb" href="'+esc(v.url)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(v.title)+'">'+thumb+'</a>'+
        '<div class="video-result-body"><div class="video-meta"><span>'+esc(v.platform||v.source)+'</span><small>'+ (v.live?'زنده':'منتخب') +'</small></div>'+
        '<h3><a href="'+esc(v.url)+'" target="_blank" rel="noopener noreferrer">'+esc(v.title)+'</a></h3>'+
        '<p>'+esc(v.description||'')+'</p>'+
        '<a class="video-open" href="'+esc(v.url)+'" target="_blank" rel="noopener noreferrer">مشاهده در منبع ↗</a></div></article>';
    }).join('');
  }

  async function search(q, append=false){
    q=q.trim();
    if(q.length<2){statusEl.textContent='حداقل ۲ کاراکتر وارد کن';return;}
    statusEl.textContent='در حال جستجو...';
    moreBtn.hidden=true;
    try{
      const params=new URLSearchParams({q,order:order.value,maxResults:'12'});
      if(append){ if(nextPageToken) params.set('pageToken',nextPageToken); params.set('page',String(nextWebPage)); }
      const res=await fetch(ENDPOINT+'?'+params.toString(),{headers:{Accept:'application/json'}});
      const data=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.message||'search_failed');
      const incoming=(data.results||[]).map(x=>({...x,source:x.source||'youtube',live:true}));
      if(!append) {
        nextWebPage=0;
        const extras=curated.filter(x=>matches(x,q));
        allResults=[...incoming,...extras];
      } else {
        const ids=new Set(allResults.map(x=>x.id||x.url));
        allResults=[...allResults,...incoming.filter(x=>!ids.has(x.id||x.url))];
      }
      nextPageToken=data.nextPageToken||''; nextWebPage=Number(data.nextPage||0);
      lastQuery=q;
      statusEl.textContent=data.live?'نتایج زنده دریافت شد':'نمایش منابع منتخب';
      moreBtn.hidden=!(nextPageToken||nextWebPage);
      render();
      document.getElementById('video-search').scrollIntoView({behavior:'smooth',block:'start'});
    }catch(err){
      const extras=curated.filter(x=>matches(x,q));
      allResults=extras;
      nextPageToken='';
      statusEl.textContent='جستجوی زنده موقتاً در دسترس نیست؛ منابع منتخب نمایش داده شد';
      render();
    }
  }

  form.addEventListener('submit',e=>{e.preventDefault();search(input.value,false);});
  document.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.query;search(b.dataset.query,false);}));
  document.querySelectorAll('.source-pill').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.source-pill').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');activeSource=b.dataset.source;render();
  }));
  moreBtn.addEventListener('click',()=>search(lastQuery,true));

  render();
})();