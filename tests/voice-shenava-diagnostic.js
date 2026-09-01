/* Cross-platform Shenava diagnostic harness.
 * Node-side contract/integration checks only; browser/iOS/Android diagnostics
 * are emitted by the runtime itself and must never expose secrets or user audio.
 */
const fs = require('fs');
const assert = (c, m) => { if (!c) throw new Error(m); };

const runtime = fs.readFileSync('voice-shenava-runtime.js', 'utf8');
const network = fs.readFileSync('voice-shenava-network.js', 'utf8');
const config = fs.readFileSync('config.js', 'utf8');

assert(/getUserMedia/.test(runtime), 'microphone capture missing');
assert(/ScriptProcessor|AudioWorklet/.test(runtime), 'raw PCM capture path missing');
assert(/16_000|16000/.test(runtime), '16 kHz contract missing');
assert(/80/.test(runtime), '80-mel contract missing');
assert(/baseMirror/.test(runtime) && /baseOfficial/.test(runtime), 'model endpoints missing');
assert(/hf-mirror\.com/.test(runtime) && /huggingface\.co/.test(runtime), 'network fallback endpoints missing');
assert(/d393dce04e8b8f4ae87e7cbc0c2d7c48072c44a2/.test(runtime), 'model revision not pinned');
assert(/voice-shenava-network\.js/.test(config), 'network adapter not loaded');
assert(!/OPENAI_API_KEY/.test(`${runtime}\n${network}\n${config}`), 'secret exposed to browser');
assert(!/api\.openai\.com/.test(`${runtime}\n${network}`), 'paid transcription provider shipped in local engine');

// Diagnostics must be safe: no raw PCM/base64/audio payload logging.
assert(!/console\.(log|debug|info)\([^)]*(pcm|audio|base64)/i.test(runtime), 'raw audio logging detected');
console.log('Cross-platform Shenava diagnostic contracts: PASS');
