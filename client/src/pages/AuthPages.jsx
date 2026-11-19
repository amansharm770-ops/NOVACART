import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { errorText } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { btn, ErrorBox, Field } from '../components/ui.jsx'

function AuthForm({ mode }) {
  const isRegister = mode === 'register'
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const u = await (isRegister ? register(form) : login({ email: form.email, password: form.password }))
      if (!isRegister && u?.role === 'admin') {
        await logout()
        setError('Admin accounts cannot log in from the storefront. Please use the admin portal.')
        return
      }
      navigate(next && next.startsWith('/') && !next.startsWith('//') ? next : '/', { replace: true })
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8">
      <h1 className="text-2xl font-black">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {isRegister && <Field label="Full name" value={form.name} onChange={set('name')} required minLength={2} autoComplete="name" />}
        <Field label="Email" type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
        <Field label="Password" type="password" value={form.password} onChange={set('password')} required autoComplete={isRegister ? 'new-password' : 'current-password'} />
        {isRegister && <p className="text-xs text-slate-500">At least 8 characters, with a letter and a number.</p>}
        <ErrorBox>{error}</ErrorBox>
        <button className={`${btn.primary} w-full`} disabled={busy}>{busy ? 'Please wait...' : isRegister ? 'Sign up' : 'Login'}</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        {isRegister ? (<>Already have an account? <Link className="font-semibold text-blue-700" to="/login">Login</Link></>) : (<>New to NovaCart? <Link className="font-semibold text-blue-700" to="/register">Create an account</Link></>)}
      </p>
    </div>
  )
}

export const Login = () => <AuthForm mode="login" />
export const Register = () => <AuthForm mode="register" />
