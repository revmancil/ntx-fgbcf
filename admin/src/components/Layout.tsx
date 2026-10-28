import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/churches', label: 'Churches' },
  { to: '/pastors', label: 'Pastors' },
  { to: '/directors', label: 'Directors' },
  { to: '/events', label: 'Events' },
  { to: '/pages', label: 'Pages & Menu' },
  { to: '/hero-images', label: 'Hero Images' },
  { to: '/settings', label: 'Site Settings' },
]

export function Layout() {
  const { role, signOut } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">NTX FGBCF Admin</div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
          {role === 'super_admin' && (
            <NavLink to="/admin-users" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Admin Users
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="role-badge">{role?.replace('_', ' ')}</div>
          <button type="button" className="btn btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
