const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const MODEL_URL = 'https://huggingface.co/Reza2kn/Shenava-Rizeh-Pizeh-v1.0-ONNX-fp16/resolve/0a5032d5d7b4a2c8c3a7f286f05c8900d83edf0c/rizeh-69m-v6_ctc_fixed2005_len_att70_13_fp16_full_io_embedded.onnx';
const MODEL_SHA256 = '43af9841032ae2358a3b2b8ad54097f5817942eb7a6158de02d484fb986fa8da';
const MODEL_BYTES = 17098975;

function download(url, target) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'User-Agent': 'Adine-Shenava-Regression/2.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return download(res.headers.location, target).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`model HTTP ${res.statusCode}`));
      }
      const out = fs.createWriteStream(target);
      const hash = crypto.createHash('sha256');
      let bytes = 0;
      res.on('data', chunk => { bytes += chunk.length; hash.update(chunk); });
      res.on('error', reject);
      out.on('error', reject);
      out.on('finish', () => out.close(() => resolve({ bytes, sha256: hash.digest('hex') })));
      res.pipe(out);
    });
    request.on('error', reject);
  });
}

(async () => {
  const ort = require('onnxruntime-node');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adine-shenava-'));
  const model = path.join(dir, 'shenava-pizeh.onnx');
  try {
    const meta = await download(MODEL_URL, model);
    if (meta.bytes !== MODEL_BYTES) throw new Error(`model byte-size mismatch: ${meta.bytes}`);
    if (meta.sha256 !== MODEL_SHA256) throw new Error(`model sha256 mismatch: ${meta.sha256}`);

    const session = await ort.InferenceSession.create(model, {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'basic',
      executionMode: 'sequential'
    });

    const signal = new Uint16Array(80 * 2005);
    const length = new BigInt64Array([2005n]);
    const input = new ort.Tensor('float16', signal, [1, 80, 2005]);
    const inputLength = new ort.Tensor('int64', length, [1]);
    const result = await session.run({processed_signal: input, processed_signal_length: inputLength});
    const logits = result.logits;
    const encoded = result.encoded_lengths;
    if (!logits || !encoded) throw new Error('missing ONNX outputs');
    if (logits.dims.join(',') !== '1,252,1025') throw new Error(`unexpected logits shape: ${logits.dims.join(',')}`);
    if (encoded.dims.join(',') !== '1') throw new Error(`unexpected encoded_lengths shape: ${encoded.dims.join(',')}`);
    if (Number(encoded.data[0]) !== 252) throw new Error(`unexpected encoded length: ${encoded.data[0]}`);

    console.log('Shenava Pizeh actual ONNX model inference: PASS');
    console.log(`Model bytes: ${meta.bytes}`);
    console.log(`Model sha256: ${meta.sha256}`);
    console.log(`Logits: ${logits.dims.join('x')}`);
    console.log(`Encoded length: ${encoded.data[0]}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
})().catch(err => { console.error(err); process.exit(1); });