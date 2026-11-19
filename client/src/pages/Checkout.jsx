import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, errorText, money } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'
import { btn, ErrorBox, Field } from '../components/ui.jsx'

const PAYMENTS = [
  { id: 'cod', label: 'Cash on delivery' },
  { id: 'mock_upi', label: 'UPI (demo, no real payment)' },
  { id: 'mock_card', label: 'Card (demo, no real payment)' },
]

export default function Checkout() {
  const { user } = useAuth()
  const { cart, subtotal, shipping, total, clearCart } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: user?.name || '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' })
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  if (cart.length === 0) {
    return <p className="py-16 text-center text-slate-500">Your cart is empty. <Link to="/" className="text-blue-700">Go shopping</Link></p>
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { order } = await api('/orders', {
        method: 'POST',
        body: { items: cart.map((i) => ({ productId: i.productId, qty: i.qty })), shippingAddress: form, paymentMethod },
      })
      clearCart()
      navigate(`/orders?placed=${order._id}`, { replace: true })
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-black">Delivery address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={form.fullName} onChange={set('fullName')} required minLength={2} />
            <Field label="Mobile number" value={form.phone} onChange={set('phone')} required inputMode="numeric" maxLength={10} placeholder="10-digit number" />
            <div className="sm:col-span-2"><Field label="Address line 1" value={form.line1} onChange={set('line1')} required minLength={3} /></div>
            <div className="sm:col-span-2"><Field label="Address line 2 (optional)" value={form.line2} onChange={set('line2')} /></div>
            <Field label="City" value={form.city} onChange={set('city')} required />
            <Field label="State" value={form.state} onChange={set('state')} required />
            <Field label="Pincode" value={form.pincode} onChange={set('pincode')} required inputMode="numeric" maxLength={6} />
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-black">Payment</h2>
          <div className="space-y-3">
            {PAYMENTS.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                <input type="radio" name="pay" checked={paymentMethod === p.id} onChange={() => setPaymentMethod(p.id)} />
                {p.label}
              </label>
            ))}
          </div>
        </section>
      </div>
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-black">Summary</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {cart.map((i) => (<li key={i.productId} className="flex justify-between gap-3"><span className="line-clamp-1">{i.name} × {i.qty}</span><span>{money(i.price * i.qty)}</span></li>))}
        </ul>
        <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>{shipping === 0 ? 'FREE' : money(shipping)}</dd></div>
          <div className="flex justify-between text-base font-black"><dt>Total</dt><dd>{money(total)}</dd></div>
        </dl>
        <div className="mt-4"><ErrorBox>{error}</ErrorBox></div>
        <button className={`${btn.primary} mt-4 w-full`} disabled={busy}>{busy ? 'Placing order...' : 'Place order'}</button>
      </aside>
    </form>
  )
}
