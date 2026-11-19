import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import ProductCard from '../components/ProductCard.jsx'
import { ErrorBox, Pagination, Spinner } from '../components/ui.jsx'

const ICONS = { Mobiles: '📱', Computers: '💻', Electronics: '🎧', Accessories: '⌚', Home: '🏠', Fashion: '👟' }

export default function Home() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') || ''
  const category = params.get('category') || 'All Products'
  const sort = params.get('sort') || 'featured'
  const page = Number(params.get('page')) || 1

  const [categories, setCategories] = useState([])
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/products/categories').then((d) => setCategories(d.categories)).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    const qs = new URLSearchParams({ sort, page, limit: 12 })
    if (search) qs.set('search', search)
    if (category !== 'All Products') qs.set('category', category)
    api(`/products?${qs}`)
      .then((d) => !cancelled && (setData(d), setError('')))
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [search, category, sort, page])

  const update = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries({ page: 1, ...patch }).forEach(([k, v]) => (v && v !== 'All Products' && v !== 'featured' && v !== 1 ? next.set(k, v) : next.delete(k)))
    setParams(next)
  }
  const filtered = search || category !== 'All Products' || page > 1

  return (
    <>
      {!filtered && (
        <section className="mb-10 rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 px-7 py-14 text-white md:px-16 md:py-20">
          <span className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold tracking-widest">NEW SEASON SALE</span>
          <h1 className="mt-7 max-w-xl text-4xl font-black leading-tight md:text-6xl">Shop smart.<br />Live better.</h1>
          <p className="mt-4 max-w-md text-blue-100">Mobiles, laptops, gadgets and more, delivered across India.</p>
        </section>
      )}

      <nav className="mb-6 flex gap-3 overflow-x-auto pb-2">
        {['All Products', ...categories].map((c) => (
          <button
            key={c}
            onClick={() => update({ category: c })}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${category === c ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-200 bg-white hover:border-blue-300'}`}
          >
            {ICONS[c] || '✦'} {c}
          </button>
        ))}
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black">
          {search ? `Results for "${search}"` : category}
          {data && <span className="ml-2 text-sm font-medium text-slate-500">({data.total} items)</span>}
        </h2>
        <select value={sort} onChange={(e) => update({ sort: e.target.value })} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="featured">Featured</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      <ErrorBox>{error}</ErrorBox>
      {!data && !error && <Spinner />}
      {data && data.items.length === 0 && <p className="py-16 text-center text-slate-500">No products found.</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {data.items.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
          <Pagination page={data.page} pages={data.pages} onPage={(n) => update({ page: n })} />
        </>
      )}
    </>
  )
}
