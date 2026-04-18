// src/hooks/useAuth.js
import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useWishlistStore } from '../store/wishlistStore'

export function useAuthInit() {
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const setUser    = useAuthStore.getState().setUser
    const setProfile = useAuthStore.getState().setProfile
    const setLoading = useAuthStore.getState().setLoading

    const fetchProfile = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        if (error) throw error
        return data
      } catch (error) {
        console.error('Error cargando perfil:', error.message)
        return null
      }
    }

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          const profile = await fetchProfile(session.user.id)
          if (profile) setProfile(profile)
          // Cargar wishlist remota al iniciar sesión existente
          useWishlistStore.getState().loadRemote(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Error en initSession:', error)
      } finally {
        setLoading(false)
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          if (profile) setProfile(profile)
          // Cargar wishlist remota en cada cambio de sesión (login)
          useWishlistStore.getState().loadRemote(session.user.id)
        } else {
          setProfile(null)
          // Limpiar wishlist remota al cerrar sesión
          useWishlistStore.getState().clearRemote()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])
}