import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { AdminRole } from '../types'

const ROLE_RANK: Record<AdminRole, number> = { viewer: 0, editor: 1, super_admin: 2 }

export function ProtectedRoute({
  children,
  requireRole,
}: {
  children: ReactNode
  requireRole?: AdminRole
}) {
  const { session, role, loading, configured } = useAuth()

  if (!configured) {
    return (
      <div className="centered-message">
        <h2>Supabase not configured</h2>
        <p>
          This admin portal has no Supabase connection yet. Copy <code>admin/.env.example</code> to{' '}
          <code>admin/.env</code> and fill in your project's URL and anon key, then rebuild.
        </p>
      </div>
    )
  }

  if (loading) {
    return <div className="centered-message">Loading…</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!role) {
    return (
      <div className="centered-message">
        <h2>No access</h2>
        <p>
          Your account is signed in but has no row in <code>admin_users</code>, so you have no
          dashboard permissions yet. Ask a Super Admin to add you.
        </p>
      </div>
    )
  }

  if (requireRole && ROLE_RANK[role] < ROLE_RANK[requireRole]) {
    return (
      <div className="centered-message">
        <h2>Insufficient permissions</h2>
        <p>This page requires the {requireRole.replace('_', ' ')} role.</p>
      </div>
    )
  }

  return <>{children}</>
}
