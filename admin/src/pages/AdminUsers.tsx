import { useEffect, useState } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { AdminRole, AdminUser } from '../types'

export function AdminUsers() {
  const { session } = useAuth()
  const { notify } = useToast()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<AdminRole>('editor')
  const [inviting, setInviting] = useState(false)

  const [manualId, setManualId] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [manualRole, setManualRole] = useState<AdminRole>('editor')
  const [addingManual, setAddingManual] = useState(false)

  async function loadAll() {
    setLoading(true)
    const { data, error } = await supabase.from('admin_users').select('*').order('created_at')
    if (error) notify(error.message, 'error')
    else setUsers(data as AdminUser[])
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function changeRole(user: AdminUser, role: AdminRole) {
    const { error } = await supabase.from('admin_users').update({ role }).eq('id', user.id)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify('Role updated.')
    loadAll()
  }

  async function confirmRemove() {
    if (!removeTarget) return
    const { error } = await supabase.from('admin_users').delete().eq('id', removeTarget.id)
    setRemoveTarget(null)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify('Access revoked.')
    loadAll()
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) {
      notify('Email is required.', 'error')
      return
    }
    setInviting(true)
    // Requires the `invite-admin` Supabase Edge Function (see
    // supabase/functions/invite-admin) to be deployed — it uses the
    // service_role key server-side to create the auth.users account and
    // send the invite email, which the browser can never safely do itself.
    const { error } = await supabase.functions.invoke('invite-admin', {
      body: { email: inviteEmail.trim(), role: inviteRole },
    })
    setInviting(false)
    if (error) {
      // A non-2xx response means the function ran and rejected the request
      // for a specific reason (the detail it returned, in error.context's
      // response body) — error.message itself is just the generic
      // "Edge Function returned a non-2xx status code" from the client.
      let detail = error.message
      if (error instanceof FunctionsHttpError) {
        try {
          const body = await error.context.json()
          if (body?.error) detail = body.error
        } catch {
          // Response body wasn't JSON — fall back to the generic message.
        }
      }
      notify(
        `Invite failed: ${detail}. If the invite-admin Edge Function isn't deployed yet, create the user in the Supabase Dashboard (Authentication → Users → Invite) and then add them below with their user ID instead.`,
        'error'
      )
      return
    }
    notify(`Invite sent to ${inviteEmail}.`)
    setInviteEmail('')
    loadAll()
  }

  async function addByUserId() {
    const id = manualId.trim()
    if (!id || !manualEmail.trim()) {
      notify('User ID and email are required.', 'error')
      return
    }
    setAddingManual(true)
    // Used when the invite-admin Edge Function isn't deployed: the user is
    // created directly in the Supabase Dashboard (Authentication → Users →
    // Invite) first, and this just registers their existing auth user ID
    // here with a role — no service_role key needed, since RLS already lets
    // a Super Admin insert any row into admin_users.
    const { error } = await supabase.from('admin_users').insert({ id, email: manualEmail.trim(), role: manualRole })
    setAddingManual(false)
    if (error) {
      notify(error.message, 'error')
      return
    }
    notify(`${manualEmail} added.`)
    setManualId('')
    setManualEmail('')
    loadAll()
  }

  return (
    <div>
      <h1>Admin Users</h1>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.email}
                  {u.id === session?.user.id && <span className="you-badge"> (you)</span>}
                </td>
                <td>
                  <select value={u.role} onChange={(e) => changeRole(u, e.target.value as AdminRole)}>
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td>
                  <button type="button" className="btn-link btn-link-danger" onClick={() => setRemoveTarget(u)}>
                    Revoke access
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="section-subheading">Invite a new admin</h2>
      <div className="invite-row">
        <input
          type="email"
          placeholder="email@example.org"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />
        <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as AdminRole)}>
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <button type="button" className="btn btn-primary" onClick={sendInvite} disabled={inviting}>
          {inviting ? 'Sending…' : 'Send invite'}
        </button>
      </div>

      <h2 className="section-subheading">Add an existing user by ID</h2>
      <p className="field-hint">
        Use this if "Send invite" fails because the invite-admin Edge Function isn't deployed. First create the
        person in the Supabase Dashboard under Authentication → Users → Invite, then copy their User UID from that
        same list and enter it below.
      </p>
      <div className="invite-row">
        <input
          type="text"
          placeholder="User ID (UUID from Supabase Dashboard)"
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
        />
        <input
          type="email"
          placeholder="email@example.org"
          value={manualEmail}
          onChange={(e) => setManualEmail(e.target.value)}
        />
        <select value={manualRole} onChange={(e) => setManualRole(e.target.value as AdminRole)}>
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <button type="button" className="btn btn-secondary" onClick={addByUserId} disabled={addingManual}>
          {addingManual ? 'Adding…' : 'Add'}
        </button>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title="Revoke access"
        message={`Revoke dashboard access for ${removeTarget?.email}? Their Supabase Auth account is not deleted, only their admin_users row.`}
        confirmLabel="Revoke"
        danger
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}
