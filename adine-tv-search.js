(() => {
  const ENDPOINT = 'https://vzcczkavlopznljnnehp.supabase.co/functions/v1/video-search';
  const curated = [
    {source:'youtube',platform:'YouTube',curated:true,title:'اصول تهویه در پرورش مرغ گوشتی — جانمایی تجهیزات در سالن مرغداری',description:'ویدئوی آموزشی تخصصی درباره تهویه و تجهیزات سالن مرغ گوشتی.',url:'https://www.youtube.com/watch?v=NzcVK_hUhs8',embedUrl:'https://www.youtube.com/embed/NzcVK_hUhs8',thumbnail:'https://i.ytimg.com/vi/NzcVK_hUhs8/hqdefault.jpg',queryTerms:['تهویه','مرغ گوشتی','فن','اینلت','ventilation','broiler']},
    {source:'aparat',platform:'Aparat',curated:true,title:'وبینار بررسی اهمیت امگا ۳ در مزارع مرغ مادر',description:'نسخه آپارات همان وبینار تخصصی مرغ مادر.',url:'https://aparat.com/v/baKml',thumbnail:'',queryTerms:['مرغ مادر','تغذیه','امگا','omega','breeder','poultry']}
  ];

  const form=document.getElementById('tv-video-search-form');
  const input=document.getElementById('tv-video-query');
  const order=document.getElementById('tv-video-order');
  const resultsEl=document.getElementById('tv-video-results');
  const statusEl=document.getElementById('tv-search-status');
  const countEl=document.getElementById('tv-result-count');
  const moreBtn=document.getElementById('tv-search-more');
  const categoriesEl=document.getElementById('categories');
  let allResults=[],nextPageToken='',activeSource='all',lastQuery='',searching=false;

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=(s='')=>String(s).toLocaleLowerCase('fa').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[ۀة]/g,'ه').replace(/[\u200c]/g,' ').replace(/\s+/g,' ').trim();
  const matches=(item,q)=>{
    const hay=normalize((item.title||'')+' '+(item.description||' ')+' '+(item.queryTerms||[]).join(' '));
    const tokens=normalize(q).split(/\s+/).filter(x=>x.length>1);
    return tokens.length>0 && tokens.every(x=>hay.includes(x));
  };
  const sourceLabel=s=>({youtube:'YouTube',aparat:'Aparat',web:'سایر منابع',curated:'منتخب'}[s]||s||'منبع تخصصی');
  const providerRank=['curated','youtube','aparat','web'];

  function filtered(){
    if(activeSource==='all')return allResults;
    if(activeSource==='curated')return allResults.filter(x=>x.curated);
    return allResults.filter(x=>x.source===activeSource&&!x.curated);
  }

  function card(v){
    const thumb=v.thumbnail?'<img loading="lazy" src="'+esc(v.thumbnail)+'" alt="">':'<div class="video-thumb-fallback"><span>▶</span></div>';
    const play=v.embedUrl?'<button type="button" class="video-play" data-play="'+esc(v.embedUrl)+'" data-title="'+esc(v.title)+'">پخش در آدینه TV</button>':'';
    return '<article class="video-result-card">'+
      '<div class="video-thumb-wrap"><a class="video-thumb" href="'+esc(v.url)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(v.title)+'">'+thumb+'</a></div>'+
      '<div class="video-result-body"><div class="video-meta"><span>'+esc(v.platform||sourceLabel(v.source))+'</span><small>'+ (v.curated?'منتخب':'زنده') +'</small></div>'+
      '<h3><a href="'+esc(v.url)+'" target="_blank" rel="noopener noreferrer">'+esc(v.title)+'</a></h3>'+
      '<p>'+esc(v.description||'')+'</p><div class="video-actions">'+play+'<a class="video-open" href="'+esc(v.url)+'" target="_blank" rel="noopener noreferrer">مشاهده در منبع ↗</a></div></div></article>';
  }

  function render(){
    const list=filtered();
    countEl.textContent=list.length?list.length+' نتیجه':'';
    if(!list.length){
      resultsEl.innerHTML='<div class="search-empty"><strong>نتیجه‌ای برای این فیلتر پیدا نشد.</strong><span>منبع دیگری را انتخاب کن یا عبارت را کمی عمومی‌تر بنویس.</span></div>';
      return;
    }
    if(activeSource!=='all'){
      resultsEl.innerHTML=list.map(card).join('');
      return;
    }
    const groups=providerRank.map(src=>({src,items:list.filter(x=>src==='curated'?x.curated:x.source===src&&!x.curated)})).filter(g=>g.items.length);
    resultsEl.innerHTML=groups.map(g=>'<section class="video-source-group"><div class="video-source-heading"><span>'+esc(sourceLabel(g.src))+'</span><small>'+g.items.length+' نتیجه</small></div><div class="video-source-grid">'+g.items.map(card).join('')+'</div></section>').join('');
  }

  function addCurated(q,incoming){
    const extras=curated.filter(x=>matches(x,q));
    const ids=new Set(incoming.map(x=>x.id||x.url));
    return [...extras.filter(x=>!ids.has(x.id||x.url)),...incoming];
  }

  async function search(q,append=false){
    q=q.trim();
    if(q.length<2){statusEl.textContent='حداقل ۲ کاراکتر وارد کن';return;}
    searching=true;
    statusEl.textContent='در حال جستجو…';
    form?.classList.add('is-searching');
    const submitBtn=form?.querySelector('button[type="submit"]');
    if(submitBtn){submitBtn.disabled=true;submitBtn.setAttribute('aria-busy','true');submitBtn.dataset.originalText=submitBtn.textContent;submitBtn.textContent='در حال جستجو…';}
    moreBtn.hidden=true;
    try{
      const params=new URLSearchParams({q,order:order.value,maxResults:'24'});
      if(append&&nextPageToken)params.set('pageToken',nextPageToken);
      const res=await fetch(ENDPOINT+'?'+params.toString(),{headers:{Accept:'application/json'}});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.message||'search_failed');
      const incoming=(data.results||[]).map(x=>({...x,source:x.source||'web',platform:x.platform||x.source||'منبع تخصصی',live:true}));
      if(!append){allResults=addCurated(q,incoming);}else{
        const ids=new Set(allResults.map(x=>x.id||x.url));
        allResults=[...allResults,...incoming.filter(x=>!ids.has(x.id||x.url))];
      }
      nextPageToken=data.nextPageToken||'';
      lastQuery=q;
      statusEl.textContent=allResults.length?'نتایج زنده از منابع قابل جستجو دریافت شد':'نتیجه‌ای پیدا نشد';
      moreBtn.hidden=!nextPageToken;
      render();
      if(categoriesEl)categoriesEl.hidden=true;
      if(!allResults.length){
        const yt='https://www.youtube.com/results?search_query='+encodeURIComponent(q);
        resultsEl.innerHTML='<div class="search-empty search-no-results"><strong>در منابع متصل نتیجه مستقیمی پیدا نشد.</strong><span>می‌توانی همین عبارت را مستقیماً در YouTube جستجو کنی.</span><a class="video-open" href="'+yt+'" target="_blank" rel="noopener noreferrer">جستجوی «'+esc(q)+'» در YouTube ↗</a></div>';
      }
      document.getElementById('video-search')?.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(err){
      const extras=curated.filter(x=>matches(x,q));
      allResults=extras;nextPageToken='';
      statusEl.textContent=extras.length?'اتصال زنده در دسترس نبود؛ منابع منتخب نمایش داده شد':'اتصال جستجوی زنده برقرار نشد';
      if(categoriesEl)categoriesEl.hidden=true;
      render();
    }finally{
      searching=false;
      form?.classList.remove('is-searching');
      if(submitBtn){submitBtn.disabled=false;submitBtn.removeAttribute('aria-busy');submitBtn.textContent=submitBtn.dataset.originalText||'جستجو';}
    }
  }

  function openPlayer(url,title){
    let modal=document.getElementById('tv-player-modal');
    if(!modal){
      modal=document.createElement('div');
      modal.id='tv-player-modal';
      modal.className='tv-player-modal';
      modal.innerHTML='<div class="tv-player-dialog" role="dialog" aria-modal="true" aria-labelledby="tv-player-title"><div class="tv-player-head"><strong id="tv-player-title"></strong><button type="button" class="tv-player-close" aria-label="بستن">×</button></div><div class="tv-player-frame"><iframe id="tv-player-iframe" title="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div></div>';
      document.body.appendChild(modal);
      modal.addEventListener('click',e=>{if(e.target===modal)closePlayer();});
      modal.querySelector('.tv-player-close').addEventListener('click',closePlayer);
    }
    modal.querySelector('#tv-player-title').textContent=title||'پخش ویدئو';
    const iframe=modal.querySelector('#tv-player-iframe');
    iframe.src=url;iframe.title=title||'پخش ویدئو';
    modal.classList.add('is-open');
    document.body.classList.add('tv-player-open');
  }
  function closePlayer(){
    const modal=document.getElementById('tv-player-modal');if(!modal)return;
    modal.classList.remove('is-open');
    const iframe=modal.querySelector('#tv-player-iframe');if(iframe)iframe.src='about:blank';
    document.body.classList.remove('tv-player-open');
  }

  form?.addEventListener('submit',e=>{e.preventDefault();search(input.value,false);});
  input?.addEventListener('input',()=>{if(!searching&&input.value.trim())statusEl.textContent='برای جستجو دکمه «جستجو» را بزنید';});
  document.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.query;search(b.dataset.query,false);}));
  document.querySelectorAll('.source-pill').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.source-pill').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeSource=b.dataset.source;render();}));
  moreBtn?.addEventListener('click',()=>{if(lastQuery&&!searching)search(lastQuery,true);});
  resultsEl?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-play]');if(!btn)return;
    e.preventDefault();openPlayer(btn.dataset.play,btn.dataset.title);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closePlayer();});

  render();
})();