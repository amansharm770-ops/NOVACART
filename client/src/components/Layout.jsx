import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'

export default function Layout() {
  const { user, logout } = useAuth()
  const { count, wishlist } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const submit = (e) => {
    e.preventDefault()
    navigate(q.trim() ? `/?search=${encodeURIComponent(q.trim())}` : '/')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-slate-950 px-4 py-2 text-center text-xs font-medium text-white">
        Free delivery on orders above ₹499 · Demo store, no real payments
      </div>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <Link to="/" className="text-3xl font-black tracking-tight text-blue-700">
            nova<span className="text-slate-900">cart.</span>
          </Link>
          <form onSubmit={submit} className="order-3 flex w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 md:order-none md:w-2/5">
            <span className="mr-3 text-lg">⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products..." className="w-full bg-transparent text-sm outline-none" />
          </form>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            {user ? (
              <>
                <NavLink to="/orders" className="hover:text-blue-700">Orders</NavLink>
                <span className="hidden text-slate-500 sm:inline">Hi, {user.name.split(' ')[0]}</span>
                <button onClick={logout} className="hover:text-blue-700">Logout</button>
              </>
            ) : (
              <NavLink to="/login" className="hover:text-blue-700">Login</NavLink>
            )}
            <NavLink to="/wishlist" className="hover:text-blue-700">♡{wishlist.length > 0 && <span className="ml-1 rounded-full bg-pink-100 px-2 text-pink-700">{wishlist.length}</span>}</NavLink>
            <NavLink to="/cart" className="hover:text-blue-700">
              Cart{count > 0 && <span className="ml-1 rounded-full bg-blue-600 px-2 text-white">{count}</span>}
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} NovaCart · Built with React, Express & MongoDB
      </footer>
    </div>
  )
}
