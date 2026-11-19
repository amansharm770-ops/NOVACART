import { useState } from 'react'
import { useApi } from '../../hooks/useApi.js'
import { ErrorBox, Pagination, Spinner } from '../../components/ui.jsx'

export default function AdminAudit() {
  const [page, setPage] = useState(1)
  const { data, loading, error } = useApi(`/admin/audit?page=${page}&limit=20`)
  return (
    <div>
      <h1 className="mb-5 text-2xl font-black">Audit log</h1>
      <ErrorBox>{error}</ErrorBox>
      {loading && !data ? <Spinner /> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th><th>IP</th></tr></thead>
            <tbody>
              {data?.items.map((l) => (
                <tr key={l._id} className="border-t align-top">
                  <td className="whitespace-nowrap p-3">{new Date(l.createdAt).toLocaleString('en-IN')}</td>
                  <td>{l.actorEmail || 'system'}</td>
                  <td className="font-mono text-xs">{l.action}</td>
                  <td>{l.entity} <span className="text-slate-400">{l.entityId?.slice(-6)}</span></td>
                  <td className="max-w-xs truncate text-slate-500">{l.meta ? JSON.stringify(l.meta) : ''}</td>
                  <td>{l.ip}</td>
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
