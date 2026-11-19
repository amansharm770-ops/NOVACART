import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const TABS = [
  ['/admin', 'Dashboard', true],
  ['/admin/products', 'Products'],
  ['/admin/orders', 'Orders'],
  ['/admin/users', 'Users'],
  ['/admin/audit', 'Audit log'],
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <aside className="bg-slate-950 p-4 text-white md:min-h-screen md:w-56">
        <p className="mb-6 text-xl font-black">nova<span className="text-blue-400">cart</span> admin</p>
        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {TABS.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-blue-700' : 'hover:bg-white/10'}`}>{label}</NavLink>
          ))}
        </nav>
        <div className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-400">
          <p className="truncate">{user.email}</p>
          <a href="/" target="_blank" rel="noopener noreferrer" className="mt-2 block hover:text-white">View store ↗</a>
          <button className="mt-2 hover:text-white" onClick={async () => { await logout(); navigate('/admin/login') }}>Logout</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8"><Outlet /></main>
    </div>
  )
}
