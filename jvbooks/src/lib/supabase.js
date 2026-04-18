import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY')
}

// Storage custom que evita el mutex lock de Supabase
const memoryStorage = (() => {
  const store = {}
  // Precarga desde localStorage si existe
  try {
    const saved = localStorage.getItem('jvbooks-auth')
    if (saved) store['jvbooks-auth'] = saved
  } catch {}

  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value
      try { localStorage.setItem(key, value) } catch {}
    },
    removeItem: (key) => {
      delete store[key]
      try { localStorage.removeItem(key) } catch {}
    },
  }
})()

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: memoryStorage,
    storageKey: 'jvbooks-auth',
  }
})