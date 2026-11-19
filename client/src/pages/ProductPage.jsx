import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, money } from '../api.js'
import { useStore } from '../context/StoreContext.jsx'
import { btn, ErrorBox, Img, Spinner } from '../components/ui.jsx'

export default function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useStore()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setProduct(null)
    setError('')
    api(`/products/${id}`).then((d) => setProduct(d.product)).catch((e) => setError(e.message))
  }, [id])

  if (error) return <div className="space-y-4"><ErrorBox>{error}</ErrorBox><Link to="/" className="text-blue-700">← Back to shop</Link></div>
  if (!product) return <Spinner />

  const max = Math.min(10, product.stock)
  const discount = product.oldPrice > product.price ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0
  const add = () => { addToCart(product, qty); setAdded(true); setTimeout(() => setAdded(false), 1500) }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <Img src={product.images?.[0]} alt={product.name} className="aspect-square w-full object-cover" />
      </div>
      <div>
        <Link to={`/?category=${encodeURIComponent(product.category)}`} className="text-sm font-medium text-blue-700">{product.category}</Link>
        <h1 className="mt-2 text-3xl font-black">{product.name}</h1>
        <p className="mt-2 text-sm text-slate-500">★ {product.rating} · {product.reviews.toLocaleString('en-IN')} reviews</p>
        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-3xl font-black">{money(product.price)}</span>
          {discount > 0 && (<><span className="text-slate-400 line-through">{money(product.oldPrice)}</span><span className="font-bold text-green-600">{discount}% off</span></>)}
        </div>
        <p className="mt-5 leading-relaxed text-slate-600">{product.description}</p>
        <p className={`mt-4 text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {product.stock > 5 ? 'In stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of stock'}
        </p>
        {product.stock > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-300 bg-white">
              <button className="px-4 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span className="w-8 text-center text-sm font-semibold">{qty}</span>
              <button className="px-4 py-2" onClick={() => setQty((q) => Math.min(max, q + 1))}>+</button>
            </div>
            <button className={btn.primary} onClick={add}>{added ? 'Added ✓' : 'Add to cart'}</button>
            <button className={btn.ghost} onClick={() => { addToCart(product, qty); navigate('/checkout') }}>Buy now</button>
          </div>
        )}
      </div>
    </div>
  )
}
