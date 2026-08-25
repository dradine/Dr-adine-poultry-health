/* Four production engines: domain rules kept separate from compact UI. */
(function(){'use strict';
const N=v=>{const x=Number(v);return Number.isFinite(x)?x:null};
function phase(type,age){const t=String(type||'').toLowerCase(),a=N(age);if(a==null)return 'unknown';if(t==='broiler'||t==='گوشتی')return a<=14?'starter':a<=28?'grower':'finisher';if(t==='pullet'||t==='پولت')return a<7?'brooding':a<12?'starter':a<18?'developer':'prelay';if(t==='layer'||t==='تخمگذار'||t==='تخم‌گذار')return a<20?'rearing':a<=35?'peak':a<=60?'production':'late_production';if(t==='breeder'||t==='مادر'||t==='مرغ مادر')return a<24?'prepeak':a<=35?'peak':'postpeak';return 'unknown'}
function engine(type){const t=String(type||'').toLowerCase();if(t==='broiler'||t==='گوشتی')return 'broiler';if(t==='layer'||t==='تخمگذار'||t==='تخم‌گذار')return 'layer';if(t==='breeder'||t==='مادر'||t==='مرغ مادر')return 'breeder';if(t==='pullet'||t==='پولت')return 'pullet';return 'unknown'}
window.AdineFourEngines={engine,phase};
})();
