// Supabase Edge Function: invite-admin
//
// Creates a new Supabase Auth user via invite email and adds a matching
// admin_users row, in one atomic-ish operation. This exists as a server-side
// function (Deno runtime, deployed with `supabase functions deploy
// invite-admin`) because it needs the SUPABASE_SERVICE_ROLE_KEY to call
// auth.admin.inviteUserByEmail — a key that must never reach the browser,
// since it bypasses Row Level Security entirely.
//
// Called from the admin SPA via supabase.functions.invoke('invite-admin', ...)
// using the caller's own session, so this function re-checks that the caller
// is actually a Super Admin before doing anything — the anon/authenticated
// Supabase client used for that check respects RLS, but this function's own
// admin client (built from the service role key below) does not, so that
// check is the only thing standing in a non-super-admin's way.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// The admin SPA calls this function from the browser via
// supabase.functions.invoke(), which is a cross-origin request from
// whatever the site's own origin is — the browser sends a CORS preflight
// (OPTIONS) first, and without these headers on every response (including
// error ones) it never gets past that preflight, which surfaces in
// supabase-js as the generic "Failed to send a request to the Edge
// Function" rather than any error this function actually returns.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Missing Authorization header' }, 401)
  }

  // Client scoped to the caller's own JWT, so RLS applies when we look up
  // their role below.
  const callerClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser()
  if (callerError || !caller) {
    return json({ error: 'Not authenticated' }, 401)
  }

  const { data: callerAdminRow, error: callerRoleError } = await callerClient
    .from('admin_users')
    .select('role')
    .eq('id', caller.id)
    .single()
  if (callerRoleError || callerAdminRow?.role !== 'super_admin') {
    return json({ error: 'Only Super Admins can invite new admins' }, 403)
  }

  let body: { email?: string; role?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { email, role } = body
  if (!email || !['super_admin', 'editor', 'viewer'].includes(role ?? '')) {
    return json({ error: 'email and a valid role are required' }, 400)
  }

  // Admin client — the only place in this codebase the service role key is
  // used, and it never leaves this server-side function.
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email)
  if (inviteError || !invited.user) {
    return json({ error: inviteError?.message ?? 'Invite failed' }, 500)
  }

  const { error: insertError } = await adminClient
    .from('admin_users')
    .insert({ id: invited.user.id, email, role })
  if (insertError) {
    return json({ error: insertError.message }, 500)
  }

  return json({ success: true, userId: invited.user.id })
})
