import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { errorText } from '../../api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { btn, ErrorBox, Field } from '../../components/ui.jsx'

export default function AdminLogin() {
  const { user, adminLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user?.role === 'admin') return <Navigate to="/admin" replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await adminLogin(form)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-8">
        <h1 className="text-2xl font-black">nova<span className="text-blue-700">cart</span> admin</h1>
        <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="username" />
        <Field label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete="current-password" />
        <ErrorBox>{error}</ErrorBox>
        <button className={`${btn.primary} w-full`} disabled={busy}>{busy ? 'Please wait...' : 'Login'}</button>
      </form>
    </div>
  )
}
