import { useState } from 'react'
import { api, errorText, money } from '../../api.js'
import { useApi } from '../../hooks/useApi.js'
import { btn, ErrorBox, Field, Img, Pagination, Spinner } from '../../components/ui.jsx'

const EMPTY = { name: '', category: '', price: '', oldPrice: 0, stock: 0, image: '', tag: '', description: '', isActive: true }

function ProductForm({ initial, onSaved, onCancel }) {
  const [f, setF] = useState(initial)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const body = { name: f.name, category: f.category, price: Number(f.price), oldPrice: Number(f.oldPrice) || 0, stock: Number(f.stock), images: f.image ? [f.image] : [], tag: f.tag, description: f.description, isActive: f.isActive }
    try {
      await (f._id ? api(`/admin/products/${f._id}`, { method: 'PUT', body }) : api('/admin/products', { method: 'POST', body }))
      onSaved()
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 grid gap-4 rounded-2xl border border-blue-200 bg-white p-5 sm:grid-cols-2">
      <h2 className="font-black sm:col-span-2">{f._id ? 'Edit product' : 'New product'}</h2>
      <Field label="Name" value={f.name} onChange={set('name')} required />
      <Field label="Category" value={f.category} onChange={set('category')} required placeholder="e.g. Mobiles" />
      <Field label="Price (₹)" type="number" min="1" value={f.price} onChange={set('price')} required />
      <Field label="Old price (₹, optional)" type="number" min="0" value={f.oldPrice} onChange={set('oldPrice')} />
      <Field label="Stock" type="number" min="0" value={f.stock} onChange={set('stock')} required />
      <Field label="Tag (optional)" value={f.tag} onChange={set('tag')} maxLength={20} />
      <div className="sm:col-span-2"><Field label="Image URL" type="url" value={f.image} onChange={set('image')} placeholder="https://..." /></div>
      <label className="text-sm font-medium text-slate-700 sm:col-span-2">Description
        <textarea value={f.description} onChange={set('description')} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
      </label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={set('isActive')} /> Visible in store</label>
      <div className="sm:col-span-2"><ErrorBox>{error}</ErrorBox></div>
      <div className="flex gap-3 sm:col-span-2">
        <button className={btn.primary} disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
        <button type="button" className={btn.ghost} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

export default function AdminProducts() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const qs = new URLSearchParams({ page, limit: 10, ...(search ? { search } : {}) })
  const { data, loading, reload } = useApi(`/admin/products?${qs}`)

  const deactivate = async (p) => {
    if (!window.confirm(`Hide "${p.name}" from the store?`)) return
    try { await api(`/admin/products/${p._id}`, { method: 'DELETE' }); reload() } catch (e) { setError(errorText(e)) }
  }
  const edit = (p) => setEditing({ ...p, image: p.images?.[0] || '' })

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Products</h1>
        <div className="flex gap-3">
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search..." className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <button className={btn.primary} onClick={() => setEditing(EMPTY)}>+ New product</button>
        </div>
      </div>
      {editing && <ProductForm key={editing._id || 'new'} initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
      <ErrorBox>{error}</ErrorBox>
      {loading && !data ? <Spinner /> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data?.items.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="flex items-center gap-3 p-3"><Img src={p.images?.[0]} alt="" className="h-10 w-10 rounded-lg object-cover" /><span className="font-semibold">{p.name}</span></td>
                  <td>{p.category}</td><td>{money(p.price)}</td>
                  <td className={p.stock <= 5 ? 'font-bold text-red-600' : ''}>{p.stock}</td>
                  <td>{p.isActive ? <span className="text-green-600">Active</span> : <span className="text-slate-400">Hidden</span>}</td>
                  <td className="space-x-2 whitespace-nowrap p-3 text-right">
                    <button className="font-semibold text-blue-700" onClick={() => edit(p)}>Edit</button>
                    {p.isActive && <button className="font-semibold text-red-600" onClick={() => deactivate(p)}>Hide</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onPage={setPage} />}
    </div>
  )
}
