// src/store/authStore.js
import { create } from 'zustand'
import { supabaseAuth } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  user:    null,
  profile: null,
  loading: true,

  setUser(user)       { set({ user }) },
  setProfile(profile) { set({ profile }) },
  setLoading(loading) { set({ loading }) },

  isAdmin() {
    return get().profile?.role === 'admin'
  },

  async signOut() {
    await supabaseAuth.auth.signOut()
    set({ user: null, profile: null })
  },
}))