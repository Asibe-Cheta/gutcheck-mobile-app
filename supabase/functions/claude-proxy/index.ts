// Supabase Edge Function: claude-proxy
// Purpose: keep Anthropic API key server-side so mobile can be fixed via OTA.
//
// Deploy with Supabase CLI, then set secret:
//   supabase secrets set ANTHROPIC_API_KEY=... --project-ref <ref>
//
// Call from app:
//   POST https://<ref>.supabase.co/functions/v1/claude-proxy
//   Headers: Authorization: Bearer <anon key>, apikey: <anon key>
//
// Streams: when the client sends `"stream": true`, Anthropic returns `text/event-stream`;
// this function passes the upstream body through without buffering.

type AnthropicMessagesRequest = {
  model: string;
  max_tokens: number;
  temperature?: number;
  stream?: boolean;
  system?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string | Array<{ type: string; text?: string; source?: unknown }>;
  }>;
};

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, anthropic-version',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
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

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'missing_anthropic_api_key' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let body: AnthropicMessagesRequest;
  try {
    body = (await req.json()) as AnthropicMessagesRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Minimal validation to avoid accidental abuse / malformed calls.
  if (!body?.model || !Array.isArray(body?.messages) || typeof body?.max_tokens !== 'number') {
    return new Response(JSON.stringify({ error: 'invalid_payload' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': req.headers.get('anthropic-version') ?? '2023-06-01',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  const ct = upstream.headers.get('content-type') ?? 'application/json';

  // Pass streaming bodies through without buffering (SSE).
  if (upstream.body && (ct.includes('text/event-stream') || body.stream === true)) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        ...cors,
        'Content-Type': ct,
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { ...cors, 'Content-Type': ct },
  });
});
