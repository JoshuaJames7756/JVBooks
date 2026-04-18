// src/hooks/useAuth.js
import { useEffect, useRef } from 'react'
import { supabase, supabaseAuth } from '../lib/supabase'
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
        const { data: { session } } = await supabaseAuth.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          const profile = await fetchProfile(session.user.id)
          if (profile) setProfile(profile)
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

    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          if (profile) setProfile(profile)
          useWishlistStore.getState().loadRemote(session.user.id)
        } else {
          setProfile(null)
          useWishlistStore.getState().clearRemote()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])
}