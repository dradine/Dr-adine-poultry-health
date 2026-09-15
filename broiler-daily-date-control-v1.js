/* ADINE — Daily monitoring date/day navigation addon */
(function(){
  document.addEventListener('DOMContentLoaded',function(){
    const form=document.getElementById('dailyForm'); if(!form)return;
    const box=document.createElement('div');box.className='form-grid';box.style.marginBottom='14px';
    box.innerHTML='<div class="group"><label for="dailyRecordDate">تاریخ پایش روزانه</label><input id="dailyRecordDate" type="date"></div>';
    form.insertBefore(box,form.firstChild);
    const input=document.getElementById('dailyRecordDate');
    const p=new URLSearchParams(location.search);const d=p.get('date');
    if(d) input.value=d; else input.value=new Date().toISOString().slice(0,10);
    input.addEventListener('change',function(){
      if(!this.value)return;
      const q=new URLSearchParams(location.search);q.set('date',this.value);q.delete('day');location.search=q.toString();
    });
  });
})();
