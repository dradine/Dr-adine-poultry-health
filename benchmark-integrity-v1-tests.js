(function(g){'use strict';
function A(name,c,d){if(!c)throw new Error('FAIL '+name+(d?' | '+d:''));}
function eq(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function runBenchmarkIntegrityTests(){
 const E=g.AdineBenchmarkIntegrityV1;A('engine loaded',!!E);
 A('day1 week1',E.weekOfAge(1)===1);A('day7 week1',E.weekOfAge(7)===1);A('day8 week2',E.weekOfAge(8)===2);A('day14 week2',E.weekOfAge(14)===2);A('day15 week3',E.weekOfAge(15)===3);
 const p=E.assertPeriod(14);A('period start day14',p.startAgeDays===8);A('period end day14',p.endAgeDays===14);
 const good=E.validateCurve([{ageDays:1},{ageDays:7},{ageDays:14}]);A('valid curve',good.ok);
 const bad=E.validateCurve([{ageDays:7},{ageDays:7},{ageDays:14}]);A('duplicate age rejected',!bad.ok);
 const src=E.validateSource({sourceType:'official-performance-objective',sourceLabel:'Official test',sourceYear:2026,sourceUrl:'https://example.com'});A('official provenance',src.ok);
 const missing=E.validateSource({sourceType:'official-performance-objective',sourceLabel:'Official test'});A('official without url rejected',!missing.ok);
 const c=E.compare(199,200,'bodyWeight');A('deviation -0.5%',Math.abs(c.deviationPercent+0.5)<1e-12);A('body weight direction',c.direction==='higher');
 const std={official:{sourceType:'official-performance-objective',sourceLabel:'Test',sourceYear:2026,sourceUrl:'https://example.com',records:[{ageDays:7,bodyWeight:200},{ageDays:14,bodyWeight:280}]},management:{sourceType:'management-standard',sourceLabel:'Management',version:'2026.1',records:[{ageDays:7,cv:10},{ageDays:14,cv:10}]}};
 const audit=E.auditStandard(std);A('standard audit passes',audit.ok);A('official body weight exists',audit.metrics.bodyWeight.officialAvailable);A('management CV exists',audit.metrics.cv.managementAvailable);A('cv fallback marked',audit.metrics.cv.fallback==='management');
 return {passed:true,count:18,version:E.VERSION};
}
g.runBenchmarkIntegrityTests=runBenchmarkIntegrityTests;
})(window);