import { money } from '../../api.js'
import { useApi } from '../../hooks/useApi.js'
import { ErrorBox, Spinner, StatusBadge } from '../../components/ui.jsx'

const Card = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-black">{value}</p>
  </div>
)

export default function Dashboard() {
  const { data: s, error, loading } = useApi('/admin/stats')
  if (loading) return <Spinner />
  if (error) return <ErrorBox>{error}</ErrorBox>

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card label="Revenue (excl. cancelled)" value={money(s.revenue)} />
        <Card label="Orders" value={s.orders} />
        <Card label="Customers" value={s.users} />
        <Card label="Active products" value={s.products} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-black">Orders by status</h2>
          <ul className="space-y-2 text-sm">
            {Object.entries(s.ordersByStatus).map(([k, v]) => (<li key={k} className="flex items-center justify-between"><StatusBadge status={k} /><span className="font-bold">{v}</span></li>))}
            {Object.keys(s.ordersByStatus).length === 0 && <li className="text-slate-500">No orders yet.</li>}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-black">Low stock (≤ 5)</h2>
          <ul className="space-y-2 text-sm">
            {s.lowStock.map((p) => (<li key={p._id} className="flex justify-between"><span>{p.name}</span><span className="font-bold text-red-600">{p.stock}</span></li>))}
            {s.lowStock.length === 0 && <li className="text-slate-500">All products are well stocked.</li>}
          </ul>
        </section>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-black">Recent orders</h2>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="text-slate-500"><tr><th className="py-2">Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>{s.recentOrders.map((o) => (<tr key={o._id} className="border-t"><td className="py-2">#{o._id.slice(-8).toUpperCase()}</td><td>{o.user?.name}</td><td>{money(o.total)}</td><td><StatusBadge status={o.status} /></td></tr>))}</tbody>
        </table></div>
      </section>
    </div>
  )
}
