/*
  ADINE POULTRY HEALTH CENTER
  STANDARD ENGINE REGRESSION TESTS
  Run with: node test-standards.js
*/

const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const context = { console, window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("standard-data.js", "utf8"), context);

function value(type, genetics, strain, metric, age) {
    const standard = context.getStandard(type, genetics, strain);
    return context.getStandardMeta(standard, metric, age);
}

// Official Ross 308 2022 points used by the report engine.
assert.strictEqual(value("broiler", "aviagen_ross", "Ross 308", "bodyWeight", 28).value, 1536);
assert.strictEqual(value("broiler", "aviagen_ross", "Ross 308", "dailyFeed", 35).value, 180);
assert.strictEqual(value("broiler", "aviagen_ross", "Ross 308", "fcr", 42).value, 1.531);
assert.strictEqual(value("broiler", "aviagen_ross", "Ross 308", "bodyWeight", 28).sourceType, "official-performance-objective");

// Missing genetic metric must fall back explicitly to management standard.
const rossCV = value("broiler", "aviagen_ross", "Ross 308", "cv", 28);
assert.strictEqual(rossCV.value, 10);
assert.strictEqual(rossCV.sourceType, "management-standard");
assert.strictEqual(rossCV.isFallback, true);

// Cobb and breeder/layer/pullet must never silently borrow Ross genetics.
assert.strictEqual(value("broiler", "cobb", "Cobb500", "bodyWeight", 28).sourceType, "management-standard");
assert.strictEqual(value("breeder", "aviagen_ross", "Ross 308", "bodyWeight", 224).sourceType, "management-standard");
assert.strictEqual(value("pullet", "hyline", "W-80", "cv", 119).sourceType, "management-standard");

// All five report charts must have a standard source/value at representative ages.
const chartMetrics = [
    "bodyWeight",
    "cv",
    "uniformity10",
    "uniformity15",
    "dailyFeed",
    "dailyWater",
    "fcr"
];

const ageSets = {
    broiler: [7, 14, 21, 28, 35, 42],
    layer: [119, 140, 168, 182, 224, 280, 350, 420, 490, 700],
    pullet: [28, 56, 84, 112, 119, 126],
    breeder: [28, 56, 84, 112, 140, 168, 182, 224, 280, 350, 420, 490, 560]
};

for (const [type, ages] of Object.entries(ageSets)) {
    const genetics = type === "broiler" || type === "breeder" ? "aviagen_ross" : "hyline";
    const strain = type === "broiler" || type === "breeder" ? "Ross 308" : "W-80";
    for (const age of ages) {
        for (const metric of chartMetrics) {
            const result = value(type, genetics, strain, metric, age);
            assert.notStrictEqual(result.value, null, `${type} ${age}d ${metric} has no standard`);
            assert.ok(result.sourceType, `${type} ${age}d ${metric} has no source type`);
        }
    }
}

console.log("All standard regression tests passed.");
