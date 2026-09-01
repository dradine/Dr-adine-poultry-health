const fs = require('fs');
const assert = require('assert');

const runtime = fs.readFileSync('voice-shenava-runtime.js', 'utf8');
const config = fs.readFileSync('config.js', 'utf8');
const network = fs.readFileSync('voice-shenava-network.js', 'utf8');

assert.match(runtime, /ADINE SHENAVA RUNTIME 5\.0/);
assert.match(runtime, /version:'5\.0\.0'/);
assert.match(config, /voice-shenava-runtime\.js\?v=5\.0\.0/);
assert.match(runtime, /const ort=window\.ort/);
assert.match(runtime, /enginePromise=null/);
assert.match(runtime, /enginePromise=null;log\('LOAD_FAIL'/);
assert.match(runtime, /executionProviders:\[provider\]/);
assert.match(runtime, /order=isMobile\(\)\?\['wasm','webgpu'\]:\['webgpu','wasm'\]/);
assert.match(runtime, /ort\.env\.wasm\.numThreads=1/);
assert.match(runtime, /ort\.env\.wasm\.simd=true/);
assert.match(runtime, /getUserMedia/);
assert.match(runtime, /ScriptProcessor/);
assert.match(runtime, /new e\.ort\.Tensor\('float16'/);
assert.match(runtime, /new e\.ort\.Tensor\('int64'/);
assert.match(runtime, /INFERENCE_TIMEOUT/);
assert.match(runtime, /MODEL_DOWNLOAD_FAIL/);
assert.match(runtime, /MODEL_HASH/);
assert.match(runtime, /PREPROCESSOR_CONTRACT/);
assert.match(runtime, /ASSET_UNAVAILABLE/);
assert.match(runtime, /MODEL_OUTPUT/);
assert.match(runtime, /EMPTY_TEXT/);
assert.match(runtime, /function reflect\(/);
assert.match(runtime, /padded\[reflect\(/);
assert.match(runtime, /pre\.center_pad/);
assert.doesNotMatch(config, /voice-shenava-network\.js/);
assert.match(network, /AdineShenavaNetwork/);

const inferStart = runtime.indexOf('async function inferPCM');
const inferEnd = runtime.indexOf('function fieldOK', inferStart);
assert.ok(inferStart >= 0 && inferEnd > inferStart, 'inferPCM block missing');
const inferBlock = runtime.slice(inferStart, inferEnd);
assert.match(inferBlock, /new e\.ort\.Tensor\('float16'/);
assert.match(inferBlock, /new e\.ort\.Tensor\('int64'/);
assert.match(inferBlock, /WEBGPU_INFERENCE_FAIL/);

console.log('Shenava static cross-platform guards: PASS');
