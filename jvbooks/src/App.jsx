// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools }  from '@tanstack/react-query-devtools'

import { queryClient }  from './lib/queryClient'
import { useAuthInit }  from './hooks/useAuth'
import { useAuthStore } from './store/authStore'
import NavBar           from './components/NavBar'
import Footer           from './components/Footer'

// ── Pages: Tienda ──────────────────────────────────────────
import Home         from './pages/Home'
import Catalog      from './pages/Catalog'
import BookDetail   from './pages/BookDetail'
import Cart         from './pages/Cart'
import Checkout     from './pages/Checkout'
import OrderConfirm from './pages/OrderConfirm'
import Wishlist     from './pages/Wishlist'
import Auth         from './pages/Auth'

// ── Pages: Cuenta ──────────────────────────────────────────
import Orders  from './pages/Account/Orders'
import Profile from './pages/Account/Profile'

// ── Pages: Admin ───────────────────────────────────────────
import AdminDashboard from './pages/Admin/Dashboard'
import AdminBooks     from './pages/Admin/Books'
import AdminOrders    from './pages/Admin/Orders'
import AdminUsers     from './pages/Admin/Users'
import AdminCoupons   from './pages/Admin/Coupons'
import AdminGenres    from './pages/Admin/Genres'

// ── Guards ─────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="loading-page"><span className="spinner" /></div>
  return user ? children : <Navigate to="/auth" replace />
}

function RequireAdmin({ children }) {
  const { profile, loading } = useAuthStore()
  if (loading) return <div className="loading-page"><span className="spinner" /></div>
  return profile?.role === 'admin' ? children : <Navigate to="/" replace />
}

// ── Root ───────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

// ── Rutas ──────────────────────────────────────────────────
function AppRoutes() {
  useAuthInit()

  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Navbar solo en tienda */}
      {!isAdmin && <NavBar />}

      <main style={{ flex: 1 }}>
        <Routes>
          {/* ── Públicas ── */}
          <Route path="/"           element={<Home />} />
          <Route path="/catalog"    element={<Catalog />} />
          <Route path="/book/:slug" element={<BookDetail />} />
          <Route path="/cart"       element={<Cart />} />
          <Route path="/checkout"   element={<Checkout />} />
          <Route path="/order-ok"   element={<OrderConfirm />} />
          <Route path="/wishlist"   element={<Wishlist />} />
          <Route path="/auth"       element={<Auth />} />

          {/* ── Cuenta ── */}
          <Route path="/account" element={
            <RequireAuth><Profile /></RequireAuth>
          } />
          <Route path="/account/orders" element={
            <RequireAuth><Orders /></RequireAuth>
          } />

          {/* ── Admin ── */}
          <Route path="/admin" element={
            <RequireAdmin><AdminDashboard /></RequireAdmin>
          } />
          <Route path="/admin/books" element={
            <RequireAdmin><AdminBooks /></RequireAdmin>
          } />
          <Route path="/admin/orders" element={
            <RequireAdmin><AdminOrders /></RequireAdmin>
          } />
          <Route path="/admin/users" element={
            <RequireAdmin><AdminUsers /></RequireAdmin>
          } />
          <Route path="/admin/coupons" element={
            <RequireAdmin><AdminCoupons /></RequireAdmin>
          } />
          <Route path="/admin/genres" element={
            <RequireAdmin><AdminGenres /></RequireAdmin>
          } />

          {/* ── 404 ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer solo en tienda */}
      {!isAdmin && <Footer />}

    </div>
  )
}