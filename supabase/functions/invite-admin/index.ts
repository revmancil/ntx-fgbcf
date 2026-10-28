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

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 })
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
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 })
  }

  const { data: callerAdminRow, error: callerRoleError } = await callerClient
    .from('admin_users')
    .select('role')
    .eq('id', caller.id)
    .single()
  if (callerRoleError || callerAdminRow?.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Only Super Admins can invite new admins' }), { status: 403 })
  }

  let body: { email?: string; role?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { email, role } = body
  if (!email || !['super_admin', 'editor', 'viewer'].includes(role ?? '')) {
    return new Response(JSON.stringify({ error: 'email and a valid role are required' }), { status: 400 })
  }

  // Admin client — the only place in this codebase the service role key is
  // used, and it never leaves this server-side function.
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email)
  if (inviteError || !invited.user) {
    return new Response(JSON.stringify({ error: inviteError?.message ?? 'Invite failed' }), { status: 500 })
  }

  const { error: insertError } = await adminClient
    .from('admin_users')
    .insert({ id: invited.user.id, email, role })
  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true, userId: invited.user.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
