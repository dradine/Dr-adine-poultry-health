(() => {
  const ENDPOINT = 'https://vzcczkavlopznljnnehp.supabase.co/functions/v1/video-search';
  const curated = [
    {
      source:'youtube', platform:'YouTube', curated:true,
      title:'اصول تهویه در پرورش مرغ گوشتی — جانمایی تجهیزات در سالن مرغداری',
      description:'ویدئوی آموزشی تخصصی درباره تهویه و تجهیزات سالن مرغ گوشتی.',
      url:'https://www.youtube.com/watch?v=NzcVK_hUhs8', thumbnail:'https://i.ytimg.com/vi/NzcVK_hUhs8/hqdefault.jpg',
      queryTerms:['تهویه','مرغ گوشتی','فن','اینلت','ventilation','broiler']
    },
    {
      source:'web', platform:'Aparat', curated:true,
      title:'وبینار بررسی اهمیت امگا ۳ در مزارع مرغ مادر',
      description:'نسخه آپارات همان وبینار تخصصی مرغ مادر.',
      url:'https://aparat.com/v/baKml', thumbnail:'',
      queryTerms:['مرغ مادر','تغذیه','امگا','omega','breeder','poultry']
    },
  ];
  const form=document.getElementById('tv-video-search-form');
  const input=document.getElementById('tv-video-query');
  const order=document.getElementById('tv-video-order');
  const resultsEl=document.getElementById('tv-video-results');
  const statusEl=document.getElementById('tv-search-status');
  const countEl=document.getElementById('tv-result-count');
  const moreBtn=document.getElementById('tv-search-more');
  const categoriesEl=document.getElementById('categories');
  let allResults=[], nextPageToken='', nextWebPage=0, activeSource='all', lastQuery='', searching=false;

  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=(s='')=>String(s).toLocaleLowerCase('fa').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[ۀة]/g,'ه').replace(/[‌]/g,' ').replace(/\s+/g,' ').trim();
  const matches=(item,q)=>{
    const hay=normalize(item.title+' '+item.description+' '+(item.queryTerms||[]).join(' '));
    const tokens=normalize(q).split(/\s+/).filter(x=>x.length>1);
    return tokens.length>0 && tokens.every(x=>hay.includes(x));
  };
  const rankResults=(items,q)=>{
    const phrase=normalize(q);
    const tokens=phrase.split(/\s+/).filter(x=>x.length>1);
    return items.map(item=>{
      const title=normalize(item.title||''), hay=normalize((item.title||'')+' '+(item.description||'')+' '+(item.channelTitle||''));
      let score=0;
      if(phrase && title===phrase) score+=180;
      else if(phrase && title.startsWith(phrase)) score+=155;
      else if(phrase && title.includes(phrase)) score+=135;
      if(phrase && hay.includes(phrase)) score+=25;
      const titleMatched=tokens.filter(t=>title.includes(t)).length;
      if(tokens.length) score+=Math.round(titleMatched/tokens.length*55);
      tokens.forEach(t=>{if(title.includes(t))score+=10;else if(hay.includes(t))score+=2;});
      return {...item,_score:score};
    }).filter(x=>x._score>0).sort((a,b)=>b._score-a._score).map(({_score,...item})=>item);
  };
  const filtered=()=>activeSource==='all'?allResults:activeSource==='curated'?allResults.filter(x=>x.curated):allResults.filter(x=>activeSource==='web'?x.source==='web':x.source===activeSource);

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
    searching=true;
    statusEl.textContent='در حال جستجو…';
    if(form){ form.classList.add('is-searching'); }
    const submitBtn=form?.querySelector('button[type="submit"]');
    if(submitBtn){ submitBtn.disabled=true; submitBtn.setAttribute('aria-busy','true'); submitBtn.dataset.originalText=submitBtn.textContent; submitBtn.textContent='در حال جستجو…'; }
    moreBtn.hidden=true;
    try{
      const params=new URLSearchParams({q,order:order.value,maxResults:'24'});
      if(append){ if(nextPageToken) params.set('pageToken',nextPageToken); params.set('page',String(nextWebPage)); }
      const res=await fetch(ENDPOINT+'?'+params.toString(),{headers:{Accept:'application/json'}});
      const data=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.message||'search_failed');
      const incoming=(data.results||[]).map(x=>({...x,source:x.source||'youtube',live:true,platform:x.platform||x.source||'منبع تخصصی'}));
      if(!append) {
        nextWebPage=0;
        const extras=curated.filter(x=>matches(x,q));
        allResults=rankResults([...incoming,...extras],q);
      } else {
        const ids=new Set(allResults.map(x=>x.id||x.url));
        allResults=rankResults([...allResults,...incoming.filter(x=>!ids.has(x.id||x.url))],q);
      }
      nextPageToken=data.nextPageToken||''; nextWebPage=Number(data.nextPage||0);
      lastQuery=q;
      statusEl.textContent=data.live?'نتایج زنده از منابع تخصصی دریافت شد':'نمایش منابع منتخب';
      moreBtn.hidden=!(nextPageToken||nextWebPage);
      render();
      if(categoriesEl) categoriesEl.hidden=true;
      if(!allResults.length){
        const yt='https://www.youtube.com/results?search_query='+encodeURIComponent(q+' مرغداری');
        resultsEl.innerHTML='<div class="search-empty search-no-results"><strong>نتیجه مستقیمی از منابع زنده دریافت نشد.</strong><span>برای ادامه، جستجوی همین موضوع در YouTube را باز کن.</span><a class="video-open" href="'+yt+'" target="_blank" rel="noopener noreferrer">جستجوی «'+esc(q)+'» در YouTube ↗</a></div>';
        statusEl.textContent='جستجو انجام شد؛ نتیجه مستقیمی پیدا نشد';
      }
      document.getElementById('video-search').scrollIntoView({behavior:'smooth',block:'start'});
    }catch(err){
      const extras=curated.filter(x=>matches(x,q));
      allResults=rankResults(extras,q);
      nextPageToken='';
      if(categoriesEl) categoriesEl.hidden=true;
      statusEl.textContent=extras.length?'اتصال زنده در دسترس نبود؛ منابع منتخب نمایش داده شد':'اتصال جستجوی زنده برقرار نشد';
      render();
    } finally {
      searching=false;
      if(form){ form.classList.remove('is-searching'); }
      const submitBtn=form?.querySelector('button[type="submit"]');
      if(submitBtn){ submitBtn.disabled=false; submitBtn.removeAttribute('aria-busy'); submitBtn.textContent=submitBtn.dataset.originalText||'جستجو'; }
    }
  }

  form.addEventListener('submit',e=>{e.preventDefault();search(input.value,false);});
  input.addEventListener('input',()=>{
    if(!searching && input.value.trim().length>0) statusEl.textContent='برای جستجو دکمه «جستجو» را بزنید';
  });
  document.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.query;search(b.dataset.query,false);}));
  document.querySelectorAll('.source-pill').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('.source-pill').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');activeSource=b.dataset.source;render();
  }));
  moreBtn.addEventListener('click',()=>search(lastQuery,true));

  render();
})();