"use strict";
const fs=require("fs"),assert=require("assert");
const html=fs.readFileSync("reports.html","utf8");
for(const token of ["reports.css","standard-data.js","broiler-official-standards-v1.js","standards-resolver-core-v1.js","broiler-report-engine.js","reports-router.js","reports.js","broiler-performance-intelligence-source-runtime-v1.js","broiler-performance-intelligence-engine-v2.js","broiler-performance-intelligence-report-v1.js","data-tab=\"weekly\"","data-tab=\"overall\"","data-tab=\"compare-empty\""])assert.ok(html.includes(token),`missing report shell token: ${token}`);
for(const forbidden of ["broiler-canonical-metric-standards-v1.js","broiler-standards-bridge.js","broiler-official-standards-global-bridge.js","report-standards-ui-v1.js"])assert.ok(!html.includes(forbidden),`reports shell must not load obsolete broiler standards source: ${forbidden}`);
assert.ok(!html.includes("standards.js"),"reports shell must not load legacy benchmark-coupled standards runtime");
assert.ok(!html.includes("broiler-fcr-engine-v11.js"),"reports shell must not load the calculation engine directly");
console.log("reports shell single-source architecture test: PASS");
