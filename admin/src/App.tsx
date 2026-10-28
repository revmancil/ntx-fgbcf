import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Churches } from './pages/Churches'
import { Pastors } from './pages/Pastors'
import { Directors } from './pages/Directors'
import { Events } from './pages/Events'
import { Pages } from './pages/Pages'
import { HeroImages } from './pages/HeroImages'
import { SiteSettings } from './pages/SiteSettings'
import { AdminUsers } from './pages/AdminUsers'

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/churches" element={<Churches />} />
              <Route path="/pastors" element={<Pastors />} />
              <Route path="/directors" element={<Directors />} />
              <Route path="/events" element={<Events />} />
              <Route path="/pages" element={<Pages />} />
              <Route path="/hero-images" element={<HeroImages />} />
              <Route path="/settings" element={<SiteSettings />} />
              <Route
                path="/admin-users"
                element={
                  <ProtectedRoute requireRole="super_admin">
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  )
}
