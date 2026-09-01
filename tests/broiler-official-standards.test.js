"use strict";
const fs=require("fs"),vm=require("vm"),assert=require("assert");
const context={console}; context.window=context;
vm.runInNewContext(fs.readFileSync("broiler-official-standards-v1.js","utf8"),context);
const r=context.BROILER_OFFICIAL_STANDARDS_V1;
const expected=["Ross 308","Ross 308 FF","Ross 708","Ross 308 AP","Cobb500","Cobb800","Arbor Acres Plus","Arbor Acres Plus S","Indian River","Indian River FF","Efficiency Plus","Hubbard EDGE","Arian"];
assert.deepStrictEqual(Object.keys(r.strains),expected);
for(const name of expected){const s=r.strains[name];assert.ok(s.producer&&s.sourceLabel&&Array.isArray(s.records),`${name}: metadata`);assert.strictEqual(s.records.length,8,`${name}: 8 weekly records`);for(const row of s.records){assert.strictEqual(row.length,3,`${name}: tuple`);assert.strictEqual(Number.isInteger(row[0]),true,`${name}: age`);assert.ok([7,14,21,28,35,42,49,56].includes(row[0]),`${name}: age range`);}} 
assert.strictEqual(r.strains["Arian"].sourceType,"official-guide-reference");
assert.strictEqual(r.strains["Cobb500"].producer,"Cobb");
assert.strictEqual(r.strains["Ross 308"].producer,"Aviagen");
console.log("broiler official reference registry: PASS — 13 strains / 8 weekly points each");
