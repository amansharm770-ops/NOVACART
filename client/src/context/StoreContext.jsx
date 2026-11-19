import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { FREE_SHIPPING_ABOVE, SHIPPING_FEE } from '../api.js'

const StoreContext = createContext(null)
const MAX_QTY = 10

const load = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => load('novacart_cart', []))
  const [wishlist, setWishlist] = useState(() => load('novacart_wishlist', []))

  useEffect(() => localStorage.setItem('novacart_cart', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('novacart_wishlist', JSON.stringify(wishlist)), [wishlist])

  const value = useMemo(() => {
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
    const shipping = cart.length === 0 || subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE
    const limit = (item) => Math.min(MAX_QTY, item.stock ?? MAX_QTY)
    return {
      cart,
      wishlist,
      count: cart.reduce((s, i) => s + i.qty, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
      addToCart(p, qty = 1) {
        setCart((c) => {
          const found = c.find((i) => i.productId === p._id)
          if (found) {
            return c.map((i) => (i.productId === p._id ? { ...i, stock: p.stock, qty: Math.min(limit({ stock: p.stock }), i.qty + qty) } : i))
          }
          return [...c, { productId: p._id, name: p.name, price: p.price, image: p.images?.[0] || '', stock: p.stock, qty: Math.min(limit(p), qty) }]
        })
      },
      setQty(id, qty) {
        setCart((c) =>
          c.map((i) => (i.productId === id ? { ...i, qty: Math.max(1, Math.min(limit(i), qty)) } : i)),
        )
      },
      removeFromCart: (id) => setCart((c) => c.filter((i) => i.productId !== id)),
      clearCart: () => setCart([]),
      toggleWishlist: (id) => setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])),
    }
  }, [cart, wishlist])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => useContext(StoreContext)
