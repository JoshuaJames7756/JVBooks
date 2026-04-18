// src/lib/queryClient.js
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:        1000 * 60 * 5,  // 5 min — catálogo no cambia tan seguido
      gcTime:           1000 * 60 * 10, // 10 min en caché
      retry:            1,
      refetchOnWindowFocus: false,
    },
  },
})