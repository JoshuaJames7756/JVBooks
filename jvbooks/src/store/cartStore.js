// src/store/cartStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],     // [{ id, title, author, price, cover_url, qty }]
      coupon: null,  // { code, discount_pct }

      // ── ACCIONES ──────────────────────────────────────────
      addItem(book) {
        const items = get().items
        const existing = items.find(i => i.id === book.id)
        if (existing) {
          set({
            items: items.map(i =>
              i.id === book.id ? { ...i, qty: i.qty + 1 } : i
            )
          })
        } else {
          // Guarda stock junto con el resto de los datos del libro
          set({ items: [...items, { ...book, qty: 1 }] })
          // ↑ Ya funciona si el objeto 'book' que le pasas incluye el campo stock.
          //   Verifica que en el componente donde llamas addItem(book),
          //   el objeto book tenga { id, title, author, price, cover_url, stock, ... }
        }
      },

      removeItem(bookId) {
        set({ items: get().items.filter(i => i.id !== bookId) })
      },

      updateQty(bookId, qty) {
        if (qty < 1) return get().removeItem(bookId)
        set({
          items: get().items.map(i =>
            i.id === bookId ? { ...i, qty } : i
          )
        })
      },

      clearCart() {
        set({ items: [], coupon: null })
      },

      applyCoupon(coupon) {
        set({ coupon })
      },

      removeCoupon() {
        set({ coupon: null })
      },

      // ── MÉTODOS DE LECTURA ────────────────────────────────
      getTotalItems() {
        return get().items.reduce((acc, i) => acc + i.qty, 0)
      },

      getSubtotal() {
        return get().items.reduce((acc, i) => acc + Number(i.price) * i.qty, 0)
      },

      getDiscount() {
        const { coupon } = get()
        const subtotal = get().getSubtotal()
        if (!coupon) return 0
        return subtotal * (coupon.discount_pct / 100)
      },

      getTotal() {
        return get().getSubtotal() - get().getDiscount()
      },
    }),
    {
      name: 'jvbooks-cart',
      partialize: (state) => ({ items: state.items, coupon: state.coupon }),
    }
  )
)