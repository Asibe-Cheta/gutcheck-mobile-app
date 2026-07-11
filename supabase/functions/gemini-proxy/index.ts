// Supabase Edge Function: gemini-proxy
// Purpose: keep Google Gemini API key server-side so mobile can be updated via OTA.
//
// Deploy with Supabase CLI, then set secret:
//   supabase secrets set GEMINI_API_KEY=... --project-ref <ref>
//
// Call from app:
//   POST https://<ref>.supabase.co/functions/v1/gemini-proxy
//   Headers: Authorization: Bearer <anon key>, apikey: <anon key>
//
// Notes:
// - This function translates the app's existing "messages" structure (Anthropic-like)
//   into Google Gemini "contents/parts".
// - Streaming is not implemented; if the client sends `"stream": true`, this will
//   still return a non-streaming JSON response.

type ProxyMessagesRequest = {
  model: string;
  max_tokens: number;
  temperature?: number;
  stream?: boolean;
  system?: string;
  messages: Array<{
    role: 'user' | 'assistant' | string;
    content: string | Array<any>;
  }>;
};

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function isDataUrl(str: string): boolean {
  return typeof str === 'string' && str.startsWith('data:') && str.includes(';base64,');
}

function dataUrlToInlineData(dataUrl: string): { mimeType: string; data: string } | null {
  try {
    // Example: data:image/png;base64,AAAA...
    const [, meta, b64] = dataUrl.match(/^data:([^;]+);base64,(.*)$/) ?? [];
    if (!meta || !b64) return null;
    return { mimeType: meta, data: b64 };
  } catch {
    return null;
  }
}

function contentItemToGeminiParts(item: any): Array<any> {
  // Gemini part formats we use:
  // - { text: string }
  // - { inlineData: { mimeType: string, data: string } }

  if (!item) return [];

  // Common "text" shape
  if (typeof item === 'string') {
    return [{ text: item }];
  }

  const type = item.type;

  if (type === 'text') {
    if (typeof item.text === 'string' && item.text.trim()) return [{ text: item.text }];
    return [];
  }

  if (type === 'image') {
    const source = item.source as any;
    if (source?.type === 'base64' && typeof source?.media_type === 'string' && typeof source?.data === 'string') {
      return [{ inlineData: { mimeType: source.media_type, data: source.data } }];
    }
    return [];
  }

  if (type === 'document') {
    const source = item.source as any;
    if (source?.type === 'base64' && typeof source?.media_type === 'string' && typeof source?.data === 'string') {
      return [{ inlineData: { mimeType: source.media_type, data: source.data } }];
    }
    return [];
  }

  if (type === 'image_url') {
    const url = item.image_url?.url;
    if (typeof url === 'string' && isDataUrl(url)) {
      const inline = dataUrlToInlineData(url);
      if (!inline) return [];
      return [{ inlineData: inline }];
    }
    // If it's not a data URL (e.g. remote URL), we intentionally ignore it.
    return [];
  }

  // Last resort: if a text-ish property exists, include it.
  if (typeof item.text === 'string' && item.text.trim()) return [{ text: item.text }];

  return [];
}

function messageToGeminiContent(message: ProxyMessagesRequest['messages'][number]): any {
  const roleRaw = String(message.role ?? '');
  // Gemini expects roles: 'user' or 'model'
  const geminiRole = roleRaw === 'assistant' ? 'model' : 'user';

  if (typeof message.content === 'string') {
    return { role: geminiRole, parts: [{ text: message.content }] };
  }

  const parts: Array<any> = [];
  for (const item of message.content) {
    parts.push(...contentItemToGeminiParts(item));
  }

  // If we couldn't parse anything, fall back to empty text.
  if (parts.length === 0) return { role: geminiRole, parts: [{ text: '' }] };
  return { role: geminiRole, parts };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    return new Response(JSON.stringify({ error: 'missing_gemini_api_key' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let body: ProxyMessagesRequest;
  try {
    body = (await req.json()) as ProxyMessagesRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (!body?.model || typeof body.max_tokens !== 'number' || !Array.isArray(body?.messages)) {
    return new Response(JSON.stringify({ error: 'invalid_payload' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const contents = body.messages.map(messageToGeminiContent);
  const systemInstruction =
    typeof body.system === 'string' && body.system.trim()
      ? { parts: [{ text: body.system }] }
      : undefined;

  // Gemini API keys (including "auth" keys created in AI Studio) are expected via
  // the x-goog-api-key header. Putting the key in the query string can break
  // some key formats (e.g. AQ.* keys).
  const upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    body.model,
  )}:generateContent`;

  const upstreamBody: any = {
    contents,
    generationConfig: {
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.3,
      maxOutputTokens: Math.max(body.max_tokens, 256),
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  if (systemInstruction) upstreamBody.systemInstruction = systemInstruction;

  const upstream = await fetch(upstreamUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': geminiApiKey,
    },
    body: JSON.stringify(upstreamBody),
  });

  const ct = upstream.headers.get('content-type') ?? 'application/json';
  const text = await upstream.text();

  if (!upstream.ok) {
    return new Response(
      JSON.stringify({
        error: 'gemini_upstream_error',
        status: upstream.status,
        body: text.slice(0, 2000),
      }),
      { status: upstream.status, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }

  let parsed: any = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {};
  }

  const parts = parsed?.candidates?.[0]?.content?.parts ?? [];
  const extracted = Array.isArray(parts) ? parts.map((p: any) => p?.text).filter((t: any) => typeof t === 'string').join('') : '';

  // Return in the same shape the app expects (Anthropic-like):
  // { content: [{ text: "..." }] }
  return new Response(
    JSON.stringify({ content: [{ text: extracted }] }),
    { status: 200, headers: { ...cors, 'Content-Type': ct } },
  );
});

