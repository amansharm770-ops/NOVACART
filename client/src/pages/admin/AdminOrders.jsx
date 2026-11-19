import { useState } from 'react'
import { api, errorText, money } from '../../api.js'
import { useApi } from '../../hooks/useApi.js'
import { ErrorBox, Pagination, Spinner, StatusBadge } from '../../components/ui.jsx'

const STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled']

export default function AdminOrders() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const qs = new URLSearchParams({ page, limit: 10, ...(status ? { status } : {}) })
  const { data, loading, reload } = useApi(`/admin/orders?${qs}`)

  const change = async (id, next) => {
    setError('')
    try { await api(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status: next } }) } catch (e) { setError(errorText(e)) }
    reload()
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-black">Orders</h1>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <ErrorBox>{error}</ErrorBox>
      {loading && !data ? <Spinner /> : (
        <div className="space-y-4">
          {data?.items.map((o) => (
            <article key={o._id} className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-bold">#{o._id.slice(-8).toUpperCase()} · {o.user?.name} <span className="font-normal text-slate-500">({o.user?.email})</span></p><p className="text-slate-500">{new Date(o.createdAt).toLocaleString('en-IN')} · {o.paymentMethod} · {o.paymentStatus}{o.paymentRef ? ` · ${o.paymentRef}` : ''}</p></div>
                <div className="flex items-center gap-3"><StatusBadge status={o.status} />
                  {!['cancelled', 'delivered'].includes(o.status) && (
                    <select value={o.status} onChange={(e) => change(o._id, e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1">
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>)}
                </div>
              </header>
              <p className="mt-3 text-slate-600">{o.items.map((i) => `${i.name} × ${i.qty}`).join(', ')}</p>
              <p className="mt-1 text-slate-500">Ship to: {o.shippingAddress.fullName}, {o.shippingAddress.line1}, {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.pincode} · {o.shippingAddress.phone}</p>
              <p className="mt-2 font-black">{money(o.total)}</p>
            </article>
          ))}
          {data?.items.length === 0 && <p className="py-10 text-center text-slate-500">No orders.</p>}
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onPage={setPage} />}
    </div>
  )
}
