const fs = require('fs');
const assert = require('assert');

const runtime = fs.readFileSync('voice-shenava-runtime.js', 'utf8');
const config = fs.readFileSync('config.js', 'utf8');
const network = fs.readFileSync('voice-shenava-network.js', 'utf8');

assert.match(runtime, /ADINE SHENAVA RUNTIME 4\.2/);
assert.match(runtime, /version:'4\.2\.0'/);
assert.match(config, /voice-shenava-runtime\.js\?v=4\.2\.0/);
assert.match(runtime, /const ort=window\.ort/);
assert.match(runtime, /enginePromise=null/);
assert.match(runtime, /enginePromise=null;safeLog\('LOAD_FAIL'/);
assert.match(runtime, /executionProviders:\[provider\]/);
assert.match(runtime, /providers\.push\('wasm'\)/);
assert.match(runtime, /getUserMedia/);
assert.match(runtime, /ScriptProcessor/);
assert.match(runtime, /new ort\.Tensor\('float16'/);
assert.match(runtime, /new ort\.Tensor\('int64'/);
assert.match(runtime, /INFERENCE_TIMEOUT/);
assert.match(runtime, /MODEL_DOWNLOAD_FAIL/);
assert.match(runtime, /ASSETS_FAIL/);
assert.match(runtime, /MODEL_OUTPUT/);
assert.match(runtime, /EMPTY_TEXT/);
assert.doesNotMatch(config, /voice-shenava-network\.js/);
assert.match(network, /AdineShenavaNetwork/);

// The inference call must use the ORT instance captured from window, not an
// undeclared lexical variable. This was the production regression causing
// successful capture to fail before the first model inference.
const inferStart = runtime.indexOf('async function inferPCM');
const inferEnd = runtime.indexOf('async function start', inferStart);
assert.ok(inferStart >= 0 && inferEnd > inferStart, 'inferPCM block missing');
const inferBlock = runtime.slice(inferStart, inferEnd);
assert.match(inferBlock, /const ort=window\.ort/);
assert.match(inferBlock, /new ort\.Tensor/);

console.log('Shenava static cross-platform guards: PASS');
