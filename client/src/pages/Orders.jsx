import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, errorText, money } from '../api.js'
import { btn, ErrorBox, Img, Spinner, StatusBadge } from '../components/ui.jsx'

export default function Orders() {
  const [params] = useSearchParams()
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const placed = params.get('placed')

  const load = useCallback(() => api('/orders/mine').then((d) => setOrders(d.orders)).catch((e) => setError(e.message)), [])
  useEffect(() => { load() }, [load])

  const cancel = async (id) => {
    if (!window.confirm('Cancel this order?')) return
    try { await api(`/orders/${id}/cancel`, { method: 'POST', body: {} }); load() } catch (e) { setError(errorText(e)) }
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-black">My orders</h1>
      {placed && <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">🎉 Order placed successfully! Order ID: {placed.slice(-8).toUpperCase()}</div>}
      <ErrorBox>{error}</ErrorBox>
      {!orders && !error && <Spinner />}
      {orders?.length === 0 && <p className="py-16 text-center text-slate-500">No orders yet. <Link to="/" className="text-blue-700">Start shopping</Link></p>}
      <div className="space-y-5">
        {orders?.map((o) => (
          <article key={o._id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 text-sm">
              <div>
                <p className="font-bold">Order #{o._id.slice(-8).toUpperCase()}</p>
                <p className="text-slate-500">{new Date(o.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500">Payment: {o.paymentStatus}</span>
                <StatusBadge status={o.status} />
              </div>
            </header>
            <ul className="divide-y">
              {o.items.map((i) => (
                <li key={i.product} className="flex items-center gap-4 py-3">
                  <Img src={i.image} alt={i.name} className="h-14 w-14 rounded-lg object-cover" />
                  <div className="flex-1 text-sm"><Link to={`/product/${i.product}`} className="font-semibold hover:text-blue-700">{i.name}</Link><p className="text-slate-500">Qty {i.qty} × {money(i.price)}</p></div>
                </li>
              ))}
            </ul>
            <footer className="flex items-center justify-between border-t pt-3">
              <span className="font-black">Total {money(o.total)}</span>
              {['placed', 'processing'].includes(o.status) && <button className={btn.danger} onClick={() => cancel(o._id)}>Cancel order</button>}
            </footer>
          </article>
        ))}
      </div>
    </>
  )
}
