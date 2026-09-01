const fs = require('fs');
const assert = require('assert');

const runtime = fs.readFileSync('voice-sherpa-runtime.js','utf8');
const worker = fs.readFileSync('voice-sherpa-worker.js','utf8');
const controls = fs.readFileSync('voice-universal-controls.js','utf8');
const config = fs.readFileSync('config.js','utf8');
const supabaseConfig = fs.readFileSync('supabase-config.js','utf8');

function has(re, text, message){ assert(re.test(text), message); }
function not(re, text, message){ assert(!re.test(text), message); }

has(/version:\s*['"]7\.0\.0['"]/, runtime, 'Runtime must be 7.0.0');
has(/Shenava-Rizeh-v1\.0-sherpa-onnx/, runtime, 'Must use official Shenava Rizeh sherpa artifact');
has(/@sherpaw\/asr@0\.0\.2/, worker, 'WASM wrapper must be pinned');
has(/OfflineRecognizer/, worker, 'Worker must use sherpa OfflineRecognizer');
has(/nemoCtc:\s*\{\s*model:/, worker, 'Rizeh must be configured as NeMo CTC');
has(/tokens:\s*`\//, worker, 'Tokens must be loaded into WASM FS');
has(/sampleRate:\s*16000/, worker, 'Recognizer must use 16 kHz');
has(/featureDim:\s*80/, worker, 'Recognizer must use 80-dim features');
has(/tokenCount:\s*1025/, worker, 'Rizeh vocabulary must be 1025 tokens');
has(/modelMinBytes:\s*30000000/, runtime, 'Model lower-size guard missing');
has(/modelMaxBytes:\s*50000000/, runtime, 'Model upper-size guard missing');
has(/new Worker\(['"]voice-sherpa-worker\.js\?v=7\.0\.0['"]/, runtime, 'ASR must run in a dedicated worker');
has(/dcRemove/, runtime, 'DC removal filter missing');
has(/highPass/, runtime, 'High-pass filter missing');
has(/trimSilence/, runtime, 'Adaptive silence trim missing');
has(/limiter/, runtime, 'Limiter missing');
has(/echoCancellation:true/, controls, 'Browser echo cancellation constraint missing');
has(/noiseSuppression:true/, controls, 'Browser noise suppression constraint missing');
has(/channelCount:1/, controls, 'Mono capture constraint missing');
has(/runtimeVersion:'7\.0\.0'/, controls, 'Controller must require runtime 7.0.0');
has(/voice-sherpa-runtime\.js\?v=7\.0\.0/, config, 'config.js must load 7.0 runtime');
has(/voice-universal-controls\.js\?v=7\.0\.0/, config, 'config.js must load 7.0 controller');
has(/voice-sherpa-runtime\.js\?v=7\.0\.0/, supabaseConfig, 'supabase-config.js must load 7.0 runtime');

not(/voice-shenava-runtime\.js\?v=6\./, config, 'Legacy runtime must not be loaded by config.js');
not(/voice-shenava-runtime\.js\?v=6\./, supabaseConfig, 'Legacy runtime must not be loaded by supabase-config.js');
not(/voice-universal-controls\.js\?v=6\./, config, 'Legacy controller must not be loaded by config.js');
not(/voice-universal-controls\.js\?v=6\./, supabaseConfig, 'Legacy controller must not be loaded by supabase-config.js');
not(/onnxruntime-web/, runtime, 'Custom onnxruntime-web path must not remain in the new runtime');
not(/mel_filters|processed_signal|float16Data|function fft\(/, runtime, 'Hand-written feature/CTC pipeline must not remain in the new runtime');
not(/OPENAI_API_KEY|api\.openai\.com/, runtime, 'Local runtime must not contain cloud credentials');

console.log('PASS: strict Shenava Rizeh 32M sherpa architecture guards');
