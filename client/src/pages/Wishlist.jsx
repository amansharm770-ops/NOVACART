import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import ProductCard from '../components/ProductCard.jsx'
import { Spinner } from '../components/ui.jsx'
import { useStore } from '../context/StoreContext.jsx'

export default function Wishlist() {
  const { wishlist } = useStore()
  const [items, setItems] = useState(null)

  useEffect(() => {
    Promise.all(wishlist.map((id) => api(`/products/${id}`).then((d) => d.product).catch(() => null)))
      .then((list) => setItems(list.filter(Boolean)))
  }, [wishlist])

  if (!items) return <Spinner />
  return (
    <>
      <h1 className="mb-6 text-2xl font-black">Your wishlist</h1>
      {items.length === 0 ? (
        <p className="py-16 text-center text-slate-500">Nothing saved yet. <Link to="/" className="text-blue-700">Browse products</Link></p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {items.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </>
  )
}
