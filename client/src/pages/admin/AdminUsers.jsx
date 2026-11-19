import { useState } from 'react'
import { api, errorText } from '../../api.js'
import { useApi } from '../../hooks/useApi.js'
import { btn, ErrorBox, Pagination, Spinner } from '../../components/ui.jsx'

export default function AdminUsers() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const qs = new URLSearchParams({ page, limit: 15, ...(search ? { search } : {}) })
  const { data, loading, reload } = useApi(`/admin/users?${qs}`)

  const toggle = async (u) => {
    setError('')
    try { await api(`/admin/users/${u._id}`, { method: 'PATCH', body: { isActive: !u.isActive } }) } catch (e) { setError(errorText(e)) }
    reload()
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-black">Users</h1>
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search name or email..." className="rounded-xl border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <ErrorBox>{error}</ErrorBox>
      {loading && !data ? <Spinner /> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data?.items.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-3 font-semibold">{u.name}</td><td>{u.email}</td><td className="capitalize">{u.role}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>{u.isActive ? <span className="text-green-600">Active</span> : <span className="text-red-600">Disabled</span>}</td>
                  <td className="p-3 text-right">{u.role !== 'admin' && <button className={u.isActive ? btn.danger : btn.ghost} onClick={() => toggle(u)}>{u.isActive ? 'Disable' : 'Enable'}</button>}</td>
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
