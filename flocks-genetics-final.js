/* STABLE FLOCK GENETICS SELECTOR
   Production type -> genetics/company -> strain -> program.
   Deliberately uses direct event handlers only. No MutationObserver and no
   polling, to avoid recursive DOM mutations/freezing the page.
*/
(function () {
  "use strict";

  var FALLBACK = {
    broiler: [
      {id:"aviagen_ross",name:"Aviagen / Ross",strains:["Ross 308","Ross 308 FF","Ross 708","Ross 308 AP"]},
      {id:"cobb",name:"Cobb",strains:["Cobb500","Cobb800"]},
      {id:"aviagen_arbor",name:"Aviagen / Arbor Acres",strains:["Arbor Acres Plus","Arbor Acres Plus S"]},
      {id:"aviagen_indian",name:"Aviagen / Indian River",strains:["Indian River","Indian River FF"]},
      {id:"hubbard",name:"Hubbard",strains:["Efficiency Plus","Hubbard EDGE"]},
      {id:"arian",name:"آرین ایران",strains:["Arian"]}
    ],
    layer: [
      {id:"hyline",name:"Hy-Line",strains:["W-36","W-80","W-80 Plus","W-80 Pro","Brown"]},
      {id:"hendrix",name:"Hendrix Genetics",strains:["ISA Brown","ISA White","Dekalb White","Dekalb Brown","Bovans White","Bovans Brown","Shaver White","Shaver Brown","Hisex White","Hisex Brown"]},
      {id:"lohmann",name:"Lohmann",strains:["Lohmann Brown-Classic","Lohmann Brown-Lite","Lohmann Brown-Extra","Lohmann LSL-Classic","Lohmann LSL-Lite","Lohmann LSL-Extra","Lohmann Sandy","Lohmann Tradition"]}
    ],
    pullet: [],
    breeder: []
  };

  function key(v){
    v=String(v==null?"":v).normalize("NFKC").replace(/[\u200c\u200f\u202a-\u202e]/g,"").replace(/ي/g,"ی").replace(/ك/g,"ک").trim().toLowerCase();
    return ({"گوشتی":"broiler",broiler:"broiler",meat:"broiler","تخمگذار":"layer","تخم گذار":"layer","تخم‌گذار":"layer",layer:"layer","پولت":"pullet",pullet:"pullet","مادر":"breeder","مرغ مادر":"breeder",breeder:"breeder"})[v]||v;
  }
  function catalog(){try{if(typeof POULTRY_CATALOG!=="undefined"&&POULTRY_CATALOG)return POULTRY_CATALOG;}catch(e){}return window.POULTRY_CATALOG||null;}
  function els(){return{t:document.getElementById("productionType"),g:document.getElementById("genetics"),s:document.getElementById("flockStrain"),p:document.getElementById("flockProgram")};}
  function groups(t){var c=catalog(),g=c&&c[key(t)]&&c[key(t)].genetics;return Array.isArray(g)&&g.length?g:(FALLBACK[key(t)]||[]);}
  function reset(s,text){if(!s)return;s.innerHTML="";var o=document.createElement("option");o.value="";o.textContent=text;s.appendChild(o);}
  function add(s,text,value){var o=document.createElement("option");o.value=String(value==null?"":value);o.textContent=String(text==null?"":text);s.appendChild(o);}
  function companies(){var x=els();if(!x.t||!x.g||!x.s)return;var a=groups(x.t.value);x.g.disabled=false;reset(x.g,"انتخاب شرکت / ژنتیک");a.forEach(function(g){add(x.g,g.name,g.id);});x.s.disabled=true;reset(x.s,"ابتدا شرکت / ژنتیک را انتخاب کنید");if(x.p){x.p.disabled=true;reset(x.p,"ابتدا سویه را انتخاب کنید");}}
  function strains(){var x=els();if(!x.t||!x.g||!x.s)return;var a=groups(x.t.value),g=a.find(function(v){return String(v.id)===String(x.g.value)}),ss=g&&Array.isArray(g.strains)?g.strains:[];x.s.disabled=false;reset(x.s,"انتخاب سویه / خط ژنتیکی");ss.forEach(function(s){add(x.s,s,s);});if(x.p){x.p.disabled=true;reset(x.p,"ابتدا سویه را انتخاب کنید");}}
  function program(){var x=els();if(!x.p)return;reset(x.p,"انتخاب استاندارد / برنامه");if(!x.g||!x.g.value||!x.s||!x.s.value){x.p.disabled=true;return;}x.p.disabled=false;var n=x.g.options[x.g.selectedIndex]?x.g.options[x.g.selectedIndex].textContent:x.g.value;add(x.p,"استاندارد "+n+" — "+x.s.value,key(x.t.value)+"_"+x.g.value+"_"+x.s.value);}
  function bind(){var x=els();if(!x.t||!x.g||!x.s)return false;if(x.t.dataset.stableGeneticsBound==="1")return true;x.t.dataset.stableGeneticsBound="1";x.t.addEventListener("change",companies);x.g.addEventListener("change",strains);x.s.addEventListener("change",program);if(x.t.value)companies();else{x.g.disabled=true;reset(x.g,"ابتدا نوع پرورش را انتخاب کنید");x.s.disabled=true;reset(x.s,"ابتدا شرکت / ژنتیک را انتخاب کنید");if(x.p){x.p.disabled=true;reset(x.p,"انتخاب خودکار");}}return true;}
  function boot(){if(!bind())window.setTimeout(boot,250);}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
  window.AdineFinalGeneticsSelector={sync:function(){var x=els();if(x&&x.t&&x.t.value)companies();},companies:companies,strains:strains,program:program};
})();