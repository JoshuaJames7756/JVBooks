// src/store/wishlistStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      localIds:  [],  // IDs para invitados (localStorage)
      remoteIds: [],  // IDs para usuarios autenticados (Supabase)

      // ── INVITADO (localStorage) ───────────────────────────
      toggleLocal(bookId) {
        const ids = get().localIds
        set({
          localIds: ids.includes(bookId)
            ? ids.filter(id => id !== bookId)
            : [...ids, bookId],
        })
      },

      isLocalWished(bookId) {
        return get().localIds.includes(bookId)
      },

      // ── AUTENTICADO (Supabase) ────────────────────────────

      // En wishlistStore.js — loadRemote
      async loadRemote(userId) {
        if (!userId) return  // ← agrega esta línea
        try {
          const { data } = await supabase
            .from('wishlist')
            .select('book_id')
            .eq('user_id', userId)
          if (data) {
            set({ remoteIds: data.map(r => r.book_id) })
          }
        } catch (error) {
          console.error('Error cargando wishlist:', error.message)
        }
      },

      // Limpia los IDs remotos al cerrar sesión
      clearRemote() {
        set({ remoteIds: [] })
      },

      // Toggle optimista: actualiza el estado local primero, luego Supabase
      async toggleRemote(userId, bookId) {
        const isWished = get().remoteIds.includes(bookId)

        // Actualización optimista inmediata (el corazón cambia al instante)
        set(s => ({
          remoteIds: isWished
            ? s.remoteIds.filter(id => id !== bookId)
            : [...s.remoteIds, bookId],
        }))

        try {
          if (isWished) {
            const { error } = await supabase
              .from('wishlist')
              .delete()
              .eq('user_id', userId)
              .eq('book_id', bookId)
            if (error) throw error
          } else {
            const { error } = await supabase
              .from('wishlist')
              .insert({ user_id: userId, book_id: bookId })
            if (error) throw error
          }
        } catch (error) {
          // Revertir si falla
          set(s => ({
            remoteIds: isWished
              ? [...s.remoteIds, bookId]
              : s.remoteIds.filter(id => id !== bookId),
          }))
          console.error('Error en wishlist:', error.message)
          throw new Error('No se pudo actualizar tu wishlist. Intenta de nuevo.')
        }
      },

      // Migrar wishlist de invitado al autenticarse
      async migrateToUser(userId) {
        try {
          const ids = get().localIds
          if (!ids.length) return
          const rows = ids.map(book_id => ({ user_id: userId, book_id }))
          const { error } = await supabase
            .from('wishlist')
            .upsert(rows, { onConflict: 'user_id,book_id' })
          if (error) throw error
          set({ localIds: [] })
          // Recargar remoteIds después de migrar
          await get().loadRemote(userId)
        } catch (error) {
          console.error('Error al migrar wishlist:', error.message)
          throw new Error('Error al migrar tu wishlist. Intenta de nuevo.')
        }
      },
    }),
    {
      name: 'jvbooks-wishlist',
      partialize: (s) => ({ localIds: s.localIds }),
      // remoteIds NO se persiste — siempre se carga fresco desde Supabase
    }
  )
)