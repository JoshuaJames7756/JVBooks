// src/store/authStore.js
import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user:    null,   // usuario de Supabase
  profile: null,   // fila de la tabla profiles
  loading: true,

  setUser(user)       { set({ user }) },
  setProfile(profile) { set({ profile }) },
  setLoading(loading) { set({ loading }) },

  isAdmin() {
    return get().profile?.role === 'admin'
  },

  async signOut() {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },
}))