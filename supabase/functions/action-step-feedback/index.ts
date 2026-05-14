/**
 * Edge Function: anonymised action-step effectiveness ingest (Part D / D.5).
 *
 * Inserts one row into public.anonymised_action_step_feedback using the service role
 * (bypasses RLS). Caller uses the normal Supabase anon JWT to invoke the function.
 *
 * Optional hardening: set Edge secret ACTION_STEP_INGEST_SECRET and send the same value
 * in header x-action-step-ingest-secret from the app (EXPO_PUBLIC_ACTION_STEP_INGEST_SECRET).
 *
 * Auto-provided in Supabase Edge: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type IngestBody = {
  session_token: string;
  status: 'acted_upon' | 'not_acted_upon' | 'skipped';
  total_steps_presented: number;
  selected_step_count: number;
  barrier_text_provided: boolean;
  barrier_text_length: number;
  elapsed_bucket: '1-24h' | '25-48h' | '3-7d' | '7+d';
  age_group?: string | null;
  source_category?: string | null;
  barrier_theme?: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, apikey, content-type, x-action-step-ingest-secret',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function badRequest(cors: Record<string, string>, msg: string) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status: 400,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function parseBody(raw: unknown): IngestBody | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const session_token = typeof o.session_token === 'string' ? o.session_token.trim() : '';
  const status = o.status;
  const total_steps_presented = Number(o.total_steps_presented);
  const selected_step_count = Number(o.selected_step_count);
  const barrier_text_provided = o.barrier_text_provided === true;
  const barrier_text_length = Number(o.barrier_text_length);
  const elapsed_bucket = o.elapsed_bucket;

  if (!UUID_RE.test(session_token)) return null;
  if (status !== 'acted_upon' && status !== 'not_acted_upon' && status !== 'skipped') return null;
  if (!Number.isInteger(total_steps_presented) || total_steps_presented < 0 || total_steps_presented > 20) {
    return null;
  }
  if (!Number.isInteger(selected_step_count) || selected_step_count < 0 || selected_step_count > 20) {
    return null;
  }
  if (selected_step_count > total_steps_presented) return null;
  if (status === 'skipped' && selected_step_count !== 0) return null;
  if (status === 'acted_upon' && selected_step_count < 1) return null;
  if (typeof barrier_text_length !== 'number' || !Number.isInteger(barrier_text_length) || barrier_text_length < 0 || barrier_text_length > 280) {
    return null;
  }
  if (barrier_text_provided !== true && barrier_text_length !== 0) return null;

  const eb = elapsed_bucket;
  if (eb !== '1-24h' && eb !== '25-48h' && eb !== '3-7d' && eb !== '7+d') return null;

  const age_group =
    o.age_group === null || o.age_group === undefined
      ? null
      : typeof o.age_group === 'string'
        ? o.age_group.trim().slice(0, 120) || null
        : null;
  const source_category =
    o.source_category === null || o.source_category === undefined
      ? null
      : typeof o.source_category === 'string'
        ? o.source_category.trim().slice(0, 64) || null
        : null;
  const barrier_theme =
    o.barrier_theme === null || o.barrier_theme === undefined
      ? null
      : typeof o.barrier_theme === 'string'
        ? o.barrier_theme.trim().slice(0, 64) || null
        : null;

  return {
    session_token,
    status,
    total_steps_presented,
    selected_step_count,
    barrier_text_provided,
    barrier_text_length,
    elapsed_bucket: eb,
    age_group,
    source_category,
    barrier_theme,
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const cors = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  // Prefer ACTION_STEP_INGEST_SECRET; EXPO_PUBLIC_* name supported if someone added it in Dashboard by mistake.
  const expectedSecret =
    Deno.env.get('ACTION_STEP_INGEST_SECRET') ?? Deno.env.get('EXPO_PUBLIC_ACTION_STEP_INGEST_SECRET');
  if (expectedSecret) {
    const sent = req.headers.get('x-action-step-ingest-secret') ?? '';
    if (sent !== expectedSecret) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest(cors, 'invalid_json');
  }

  const row = parseBody(body);
  if (!row) {
    return badRequest(cors, 'invalid_payload');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ ok: false, error: 'server_misconfigured' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await admin.from('anonymised_action_step_feedback').insert({
    session_token: row.session_token,
    status: row.status,
    total_steps_presented: row.total_steps_presented,
    selected_step_count: row.selected_step_count,
    barrier_text_provided: row.barrier_text_provided,
    barrier_text_length: row.barrier_text_length,
    elapsed_bucket: row.elapsed_bucket,
    age_group: row.age_group,
    source_category: row.source_category,
    barrier_theme: row.barrier_theme,
  });

  if (error) {
    // Unique violation: treat as success (idempotent retry)
    if (error.code === '23505') {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    console.error('[action-step-feedback] insert error', error);
    return new Response(JSON.stringify({ ok: false, error: 'insert_failed', detail: error.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
