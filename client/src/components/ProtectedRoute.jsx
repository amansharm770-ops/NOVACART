import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Spinner } from './ui.jsx'

export default function ProtectedRoute({ role, loginPath = '/login' }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!user || (role && user.role !== role)) {
    return <Navigate to={`${loginPath}?next=${encodeURIComponent(location.pathname)}`} replace />
  }
  return <Outlet />
}
