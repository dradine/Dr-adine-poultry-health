const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const code=fs.readFileSync(require('path').join(__dirname,'..','broiler-performance-reference-interpreter-v1.js'),'utf8');
const context={console};vm.runInNewContext(code,context);
const I=context.AdineBroilerReferenceInterpreterV1;
assert(I&&I.version==='BROILER-REFERENCE-INTERPRETER-V1');

const rows=[
 {age:28,weight:1200,standardWeight:1271.1,standardWeightSource:'official',cumulativeFcr:1.20,standardCumulativeFcr:1.24,standardCumulativeFcrSource:'official',cv:10},
 {age:35,weight:1600,standardWeight:1695.0,standardWeightSource:'official',cumulativeFcr:1.40,standardCumulativeFcr:1.35,standardCumulativeFcrSource:'official',cv:11},
 {age:42,weight:2050,standardWeight:2021.7,standardWeightSource:'official',cumulativeFcr:1.50,standardCumulativeFcr:1.54,standardCumulativeFcrSource:'official',cv:13}
];
const w=I.build('weight',rows,{actualKey:'weight',referenceKey:'standardWeight',direction:'higher',label:'وزن',unit:'g/day'});
assert(w.available);
assert(Math.abs(w.currentGap-1.4)<0.1);
assert(Math.abs(w.previousGap+5.6)<0.2);
assert(Math.abs(w.gapChange-7.0)<0.2);
assert(w.improvement>0);
assert(w.trend.key==='strong_improvement'||w.trend.key==='improvement');
assert(w.position.key==='near'||w.position.key==='above');

const f=I.build('fcr',rows,{actualKey:'cumulativeFcr',referenceKey:'standardCumulativeFcr',direction:'lower',label:'FCR تجمعی',unit:'واحد FCR/day'});
assert(f.available);
assert(f.currentGap<0);
assert(f.previousGap>0);
assert(f.improvement>0);
assert(f.trend.arrow==='↗');
assert(f.position.key==='better'||f.position.key==='near');

const cvRows=[
 {age:28,cv:10,standardCv:10,standardCvSource:'scientific'},
 {age:35,cv:11,standardCv:10,standardCvSource:'scientific'},
 {age:42,cv:13,standardCv:10,standardCvSource:'scientific'}
];
const cv=I.build('cv',cvRows,{actualKey:'cv',referenceKey:'standardCv',direction:'lower',label:'CV',unit:'/ روز'});
assert(cv.available);
assert(cv.improvement<0);
assert(cv.trend.arrow==='↘');

const noSource={age:42,weight:2050,standardWeight:2021.7};
const source=I.sourceInfo(noSource,'standardWeight');
assert(source.available===true);
assert(source.type==='numeric');

console.log('broiler-performance-reference-interpreter-v1: PASS');
