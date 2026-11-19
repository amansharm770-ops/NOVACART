import { Link, useNavigate } from 'react-router-dom'
import { money } from '../api.js'
import { useStore } from '../context/StoreContext.jsx'
import { btn, Img } from '../components/ui.jsx'

export default function Cart() {
  const { cart, setQty, removeFromCart, subtotal, shipping, total } = useStore()
  const navigate = useNavigate()

  if (cart.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 text-2xl font-black">Your cart is empty</h1>
        <Link to="/" className={`${btn.primary} mt-6 inline-block`}>Continue shopping</Link>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="mb-5 text-2xl font-black">Shopping cart</h1>
        <ul className="space-y-4">
          {cart.map((i) => (
            <li key={i.productId} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <Img src={i.image} alt={i.name} className="h-24 w-24 rounded-xl object-cover" />
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex justify-between gap-3">
                  <Link to={`/product/${i.productId}`} className="font-semibold hover:text-blue-700">{i.name}</Link>
                  <span className="font-black">{money(i.price * i.qty)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-slate-300 text-sm">
                    <button className="px-3 py-1" onClick={() => setQty(i.productId, i.qty - 1)}>−</button>
                    <span className="w-6 text-center font-semibold">{i.qty}</span>
                    <button className="px-3 py-1" onClick={() => setQty(i.productId, i.qty + 1)}>+</button>
                  </div>
                  <button className="text-sm text-red-600 hover:underline" onClick={() => removeFromCart(i.productId)}>Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-black">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>{shipping === 0 ? 'FREE' : money(shipping)}</dd></div>
          <div className="flex justify-between border-t pt-3 text-base font-black"><dt>Total</dt><dd>{money(total)}</dd></div>
        </dl>
        <button className={`${btn.primary} mt-6 w-full`} onClick={() => navigate('/checkout')}>Proceed to checkout</button>
        <p className="mt-3 text-xs text-slate-500">Final prices and stock are confirmed by the server when you place the order.</p>
      </aside>
    </div>
  )
}
