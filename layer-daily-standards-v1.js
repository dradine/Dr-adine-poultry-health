/* ADINE — LAYER DAILY STANDARDS ENGINE V1
   Scope: commercial laying-hen DAILY monitoring only.
   Independent from all broiler engines and standards.
   Authority: official genetic-company data first; same-company management guidance second;
   evidence-based management reference third. No silent cross-strain borrowing.
*/
(function(g){
'use strict';
const OFFICIAL='official-genetic';
const MG='same-genetic-management';
const EVIDENCE='management-evidence';
const catalogs={
 hyline:{
  producer:'Hy-Line',
  strains:{
   'W-36':{source:OFFICIAL,label:'Hy-Line W-36 Commercial Layers Performance Standards',url:'https://www.hyline.com/',anchors:{production:[18,100],metrics:['egg_production','egg_weight','body_weight','feed']}},
   'W-80':{source:OFFICIAL,label:'Hy-Line W-80 Commercial Layers Performance Standards — 2026',url:'https://www.hyline.com/filesimages/Hy-Line-Products/Hy-Line-Product-PDFs/W-80/80%20STD%20ENG.pdf',anchors:{production:[17,100],metrics:['egg_production','egg_weight','body_weight','feed','water']}},
   'W-80 Plus':{source:OFFICIAL,label:'Hy-Line W-80 Plus Commercial Layers Performance Standards',url:'https://www.hyline.com/',anchors:{production:[17,100],metrics:['egg_production','egg_weight','body_weight','feed']}},
   'W-80 Pro':{source:OFFICIAL,label:'Hy-Line W-80 Pro Commercial Layers Performance Standards — 2026',url:'https://www.hyline.com/',anchors:{production:[17,100],metrics:['egg_production','egg_weight','body_weight','feed']}},
   'Brown':{source:OFFICIAL,label:'Hy-Line Brown Commercial Layers Performance Standards',url:'https://www.hyline.com/',anchors:{production:[18,100],metrics:['egg_production','egg_weight','body_weight','feed']}}
  }
 },
 hendrix:{
  producer:'Hendrix Genetics',
  strains:{
   'ISA Brown':{source:OFFICIAL,label:'ISA Brown Commercial Layer Guide',url:'https://www.hendrix-genetics.com/en/news-events/events/space-en-2026/laying-hens/',metrics:['egg_production','egg_weight','egg_mass','feed','water','body_weight']},
   'ISA White':{source:OFFICIAL,label:'ISA White Commercial Layer Guide',url:'https://www.hendrix-genetics.com/en/news-events/events/space-en-2026/laying-hens/',metrics:['egg_production','egg_weight','egg_mass','feed','water','body_weight']},
   'Dekalb White':{source:OFFICIAL,label:'Dekalb White Commercial Layer Guide',url:'https://www.hendrix-genetics.com/en/news-events/events/space-en-2026/laying-hens/',metrics:['egg_production','egg_weight','egg_mass','feed','water','body_weight']},
   'Dekalb Brown':{source:OFFICIAL,label:'Dekalb Brown Commercial Layer Guide',url:'https://www.hendrix-genetics.com/en/news-events/events/space-en-2026/laying-hens/',metrics:['egg_production','egg_weight','egg_mass','feed','water','body_weight']},
   'Bovans White':{source:OFFICIAL,label:'Bovans White Commercial Layer Guide',url:'https://www.hendrix-genetics.com/en/news-events/events/space-en-2026/laying-hens/',metrics:['egg_production','egg_weight','egg_mass','feed','water','body_weight']},
   'Bovans Brown':{source:OFFICIAL,label:'Bovans Brown Commercial Layer Guide',url:'https://www.hendrix-genetics.com/en/news-events/events/space-en-2026/laying-hens/',metrics:['egg_production','egg_weight','egg_mass','feed','water','body_weight']},
   'Shaver White':{source:OFFICIAL,label:'Shaver White Commercial Layer Guide',url:'https://www.hendrix-genetics.com/en/news-events/events/space-en-2026/laying-hens/',metrics:['egg_production','egg_weight','egg_mass','feed','water','body_weight']},
   'Shaver Brown':{source:OFFICIAL,label:'Shaver Brown Commercial Layer Guide',url:'https://www.hendrix-genetics.com/en/news-events/events/space-en-2026/laying-hens/',metrics:['egg_production','egg_weight','egg_mass','feed','water','body_weight']},
   'Hisex White':{source:OFFICIAL,label:'Hisex White Commercial Layer Guide',url:'https://www.hendrix-genetics.com/en/news-events/events/space-en-2026/laying-hens/',metrics:['egg_production','egg_weight','egg_mass','feed','water','body_weight']},
   'Hisex Brown':{source:OFFICIAL,label:'Hisex Brown Commercial Layer Guide',url:'https://www.hendrix-genetics.com/en/news-events/events/space-en-2026/laying-hens/',metrics:['egg_production','egg_weight','egg_mass','feed','water','body_weight']}
  }
 },
 lohmann:{
  producer:'Lohmann Breeders',
  strains:{
   'Lohmann Brown-Classic':{source:OFFICIAL,label:'LOHMANN BROWN-CLASSIC Management Guide',url:'https://lohmann-breeders.com/media/2020/07/ManagementGuideLBClassicCage-EN.pdf',metrics:['egg_production','egg_weight','egg_mass','body_weight','feed','water']},
   'Lohmann Brown-Lite':{source:OFFICIAL,label:'LOHMANN BROWN-LITE Management Guide',url:'https://lohmann-breeders.com/',metrics:['egg_production','egg_weight','egg_mass','body_weight','feed','water']},
   'Lohmann Brown-Extra':{source:OFFICIAL,label:'LOHMANN BROWN-EXTRA Management Guide',url:'https://lohmann-breeders.com/',metrics:['egg_production','egg_weight','egg_mass','body_weight','feed','water']},
   'Lohmann LSL-Classic':{source:OFFICIAL,label:'LOHMANN LSL-CLASSIC Management Guide',url:'https://lohmann-breeders.com/strains/lohmann-lsl-classic/',metrics:['egg_production','egg_weight','egg_mass','body_weight','feed','water']},
   'Lohmann LSL-Lite':{source:OFFICIAL,label:'LOHMANN LSL-LITE Management Guide',url:'https://lohmann-breeders.com/',metrics:['egg_production','egg_weight','egg_mass','body_weight','feed','water']},
   'Lohmann LSL-Extra':{source:OFFICIAL,label:'LOHMANN LSL-EXTRA Management Guide',url:'https://lohmann-breeders.com/',metrics:['egg_production','egg_weight','egg_mass','body_weight','feed','water']},
   'Lohmann Sandy':{source:OFFICIAL,label:'LOHMANN Sandy Management Guide',url:'https://lohmann-breeders.com/',metrics:['egg_production','egg_weight','egg_mass','body_weight','feed','water']},
   'Lohmann Tradition':{source:OFFICIAL,label:'LOHMANN Tradition Management Guide',url:'https://lohmann-breeders.com/',metrics:['egg_production','egg_weight','egg_mass','body_weight','feed','water']}
  }
 },
 novogen:{
  producer:'NOVOGEN',
  strains:{
   'NOVOgen Brown':{source:OFFICIAL,label:'NOVOgen BROWN Commercial Layers Management Guide',url:'https://novocenter.novogen-layers.com/wp-content/uploads/2021/11/202402-Guide_management_CS_Brown_V2comp.pdf',metrics:['egg_production','egg_weight','egg_mass','body_weight','feed','water']},
   'NOVOgen White':{source:OFFICIAL,label:'NOVOgen WHITE Commercial Layers Management Guide',url:'https://novocenter.novogen-layers.com/wp-content/uploads/2021/11/202402-Guide_management_CS_White_V2comp.pdf',metrics:['egg_production','egg_weight','egg_mass','body_weight','feed','water']}
  }
 },
 tetra:{producer:'TETRA',strains:{'TETRA Brown':{source:MG,label:'TETRA Brown — management reference pending official numeric import',url:null,metrics:['egg_production','egg_weight','egg_mass','body_weight','feed','water']}}}
};
const generic={source:EVIDENCE,label:'Layer management reference — official numeric curve unavailable for selected strain',url:null,
 metrics:['egg_production','egg_weight','egg_mass','body_weight','feed','water','mortality','livability'],
 daily:{feed:{min:90,max:125},water:{min:120,max:300},waterFeed:{min:1.5,max:3.5},mortality:{max:0.08},humidity:{min:45,max:75},temp:{min:18,max:28}}};
function norm(s){return String(s||'').normalize('NFKC').replace(/[\u200c\u200f]/g,'').trim().toLowerCase()}
function resolve(flock){
 const g=norm(flock?.genetics),s=norm(flock?.strain);
 const key=g.includes('hy')?'hyline':g.includes('hendrix')||g.includes('isa')||g.includes('dekalb')||g.includes('bovans')||g.includes('shaver')||g.includes('hisex')?'hendrix':g.includes('lohmann')?'lohmann':g.includes('novo')?'novogen':g.includes('tetra')?'tetra':'';
 const family=catalogs[key];
 if(family){const found=Object.entries(family.strains).find(([name])=>norm(name)===s||s.includes(norm(name))||norm(name).includes(s));if(found)return {...found[1],genetics:key,strain:found[0],fallback:false}}
 return {...generic,genetics:key||'unknown',strain:flock?.strain||'unknown',fallback:true}
}
function interpolate(age,anchors){
 const a=Number(age); if(!Number.isFinite(a)||!anchors?.length)return null;
 const sorted=anchors.slice().sort((x,y)=>x.age-y.age);
 if(a<=sorted[0].age)return sorted[0].value;
 if(a>=sorted.at(-1).age)return sorted.at(-1).value;
 for(let i=1;i<sorted.length;i++){if(a<=sorted[i].age){const x=sorted[i-1],y=sorted[i];return x.value+(y.value-x.value)*(a-x.age)/(y.age-x.age)}}
 return null;
}
function evaluate(metric,actual,ref,direction){
 if(actual==null||ref==null)return {state:'no_data'};
 const delta=((actual-ref)/ref)*100;
 const good=direction==='lower'?-delta:delta;
 const state=Math.abs(good)<=3?'normal':good>0?'improving':'watch';
 return {state,deltaPercent:delta};
}
g.ADINE_LAYER_DAILY_STANDARDS_V1=Object.freeze({version:'2026-09-24.v1',catalogs,resolve,interpolate,evaluate,generic});
})(window);