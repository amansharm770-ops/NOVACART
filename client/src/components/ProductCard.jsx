import { Link } from 'react-router-dom'
import { money } from '../api.js'
import { useStore } from '../context/StoreContext.jsx'
import { Img } from './ui.jsx'

export default function ProductCard({ product: p }) {
  const { addToCart, wishlist, toggleWishlist } = useStore()
  const liked = wishlist.includes(p._id)
  const discount = p.oldPrice > p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-lg">
      <Link to={`/product/${p._id}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        <Img src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover transition group-hover:scale-105" />
        {p.tag && <span className="absolute left-3 top-3 rounded-full bg-slate-950 px-3 py-1 text-[10px] font-bold tracking-wider text-white">{p.tag}</span>}
      </Link>
      <button
        onClick={() => toggleWishlist(p._id)}
        aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
        className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/90 text-lg shadow"
      >
        {liked ? '♥' : '♡'}
      </button>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-slate-500">{p.category}</p>
        <Link to={`/product/${p._id}`} className="mt-1 line-clamp-2 font-semibold hover:text-blue-700">{p.name}</Link>
        <p className="mt-1 text-xs text-slate-500">★ {p.rating} <span className="text-slate-400">({p.reviews.toLocaleString('en-IN')})</span></p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-black">{money(p.price)}</span>
          {discount > 0 && (<><span className="text-sm text-slate-400 line-through">{money(p.oldPrice)}</span><span className="text-xs font-bold text-green-600">{discount}% off</span></>)}
        </div>
        <button
          disabled={p.stock < 1}
          onClick={() => addToCart(p)}
          className="mt-4 rounded-xl bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:bg-slate-300"
        >
          {p.stock < 1 ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </article>
  )
}
