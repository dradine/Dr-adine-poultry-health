import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const MODEL = Deno.env.get("VOICE_STT_MODEL") || "gpt-4o-mini-transcribe";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["audio/webm", "audio/mp4", "audio/m4a", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg"];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });
}

function extensionFor(type: string) {
  const t = type.split(";")[0].toLowerCase();
  if (t === "audio/webm") return "webm";
  if (t === "audio/mp4" || t === "audio/m4a") return "m4a";
  if (t === "audio/mpeg" || t === "audio/mp3") return "mp3";
  if (t === "audio/wav" || t === "audio/x-wav") return "wav";
  if (t === "audio/ogg") return "ogg";
  return "webm";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  if (!OPENAI_API_KEY) return json({ error: "VOICE_SERVICE_NOT_CONFIGURED" }, 503);

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_BYTES) return json({ error: "AUDIO_TOO_LARGE" }, 413);

  let form: FormData;
  try { form = await req.formData(); } catch { return json({ error: "INVALID_MULTIPART" }, 400); }
  const incoming = form.get("file");
  if (!(incoming instanceof File)) return json({ error: "AUDIO_FILE_REQUIRED" }, 400);
  if (incoming.size <= 0) return json({ error: "AUDIO_FILE_EMPTY" }, 400);
  if (incoming.size > MAX_BYTES) return json({ error: "AUDIO_TOO_LARGE" }, 413);

  const mime = (incoming.type || "audio/webm").toLowerCase().split(";")[0];
  if (!ALLOWED_TYPES.includes(mime)) return json({ error: "UNSUPPORTED_AUDIO_TYPE" }, 415);

  const openaiForm = new FormData();
  openaiForm.append("file", new File([await incoming.arrayBuffer()], `voice.${extensionFor(mime)}`, { type: mime }));
  openaiForm.append("model", MODEL);
  openaiForm.append("language", "fa");
  openaiForm.append("temperature", "0");
  openaiForm.append("prompt", "متن فارسی تخصصی بهداشت و بیماری‌های طیور. اصطلاحات ممکن: نیوکاسل، برونشیت عفونی، گامبورو، لارنگوتراکئیت، مایکوپلاسما، آنتی‌بادی، آنتی‌بیوگرام، PCR، RT-PCR، qPCR، ELISA، FCR، CV، HVT، IBD، IBV، ILT، واکسیناسیون، کالبدگشایی، کیسه هوایی، آسیت، کوکسیدیوز، سالمونلا، کلی‌باسیلوز، آمونیاک، تهویه. متن را همان‌طور که گفته شده به فارسی رونویسی کن و تشخیص یا تفسیر پزشکی اضافه نکن.");

  const upstream = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: openaiForm,
  });
  if (!upstream.ok) return json({ error: "VOICE_TRANSCRIPTION_FAILED", upstream_status: upstream.status }, upstream.status >= 500 ? 502 : 422);

  let result: { text?: string };
  try { result = await upstream.json(); } catch { return json({ error: "VOICE_INVALID_PROVIDER_RESPONSE" }, 502); }
  const text = typeof result.text === "string" ? result.text.trim() : "";
  if (!text) return json({ error: "VOICE_EMPTY_TRANSCRIPT" }, 422);
  return json({ text, model: MODEL });
});
