"use strict";
const fs=require("fs"),assert=require("assert");
const html=fs.readFileSync("reports.html","utf8");
for(const token of ["reports.css","standard-data.js","standards.js","broiler-report-engine.js","reports-router.js","reports.js","data-tab=\"weekly\"","data-tab=\"overall\"","data-tab=\"compare\""])assert.ok(html.includes(token),`missing report shell token: ${token}`);
assert.ok(!html.includes("health-records-runtime-v2.js"),"reports shell must not load unrelated health runtime");
assert.ok(!html.includes("broiler-fcr-engine-v11.js"),"reports shell must not load the calculation engine directly");
console.log("reports shell architecture test: PASS");