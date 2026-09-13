/* ADINE SHENAVA NETWORK FALLBACK 1.0
 * Only intercepts Shenava model/sidecar requests.
 * Official Hugging Face is tried first; hf-mirror is a download fallback.
 * No application/API/Supabase requests are modified.
 */
(function(){
  'use strict';
  if(window.AdineShenavaNetwork)return;
  const OFFICIAL='https://huggingface.co/Reza2kn/Shenava-Rizeh-v1.0-ONNX-fp16/';
  const MIRROR='https://hf-mirror.com/Reza2kn/Shenava-Rizeh-v1.0-ONNX-fp16/';
  const original=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(!url.startsWith(OFFICIAL))return original(input,init);
    try{
      const response=await original(input,init);
      if(response&&response.ok)return response;
    }catch(_){ }
    const fallback=url.replace(OFFICIAL,MIRROR);
    return original(fallback,init);
  };
  window.AdineShenavaNetwork=Object.freeze({version:'1.0',official:OFFICIAL,mirror:MIRROR});
})();
