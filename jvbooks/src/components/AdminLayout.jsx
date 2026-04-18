// src/components/AdminLayout.jsx
import { useState } from 'react' // <--- Importamos useState
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore }         from '../store/authStore'

const NAV_ITEMS = [
  { to: '/admin',          label: 'Dashboard',   icon: '📊' },
  { to: '/admin/books',    label: 'Libros',      icon: '📚' },
  { to: '/admin/orders',   label: 'Pedidos',     icon: '📦' },
  { to: '/admin/users',    label: 'Usuarios',    icon: '👥' },
  { to: '/admin/coupons',  label: 'Cupones',     icon: '🏷️'  },
  { to: '/admin/genres',   label: 'Géneros',     icon: '🗂️'  },
]

export default function AdminLayout({ children, title }) {
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  
  // Estado para controlar el Sidebar en móviles
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  async function handleSignOut() {
    setIsSidebarOpen(false)
    await signOut()
    navigate('/')
  }

  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="admin-layout">
      
      {/* ── BOTÓN DE MENÚ MÓVIL (Nuevo) ── */}
      <button 
        className="admin-sidebar-toggle" 
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Abrir menú de administración"
      >
        <span>☰</span> Menú
      </button>

      {/* ── OVERLAY (Para cerrar el menú al hacer clic fuera) ── */}
      {isSidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        
        {/* Botón de cierre dentro del Sidebar (solo móvil) */}
        <button className="admin-sidebar-close" onClick={closeSidebar}>✕</button>

        <div style={{ marginBottom: 28 }}>
          <p style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, margin: 0 }}>
            JV<span style={{ color: 'var(--jv-brown-400)' }}>Books</span>
          </p>
          <p style={{ fontSize: 11, color: 'var(--jv-brown-400)', margin: '4px 0 0', letterSpacing: '.5px' }}>
            Panel de administración
          </p>
        </div>

        <p className="admin-sidebar__title">Menú</p>

        <div className="admin-sidebar__nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              onClick={closeSidebar} // Cierra al navegar
              className={({ isActive }) =>
                'admin-sidebar__link' + (isActive ? ' active' : '')
              }
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Footer sidebar */}
        <div style={{ marginTop: 'auto', paddingTop: 32, borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <p style={{ fontSize: 12, color: 'var(--jv-brown-400)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {profile?.full_name || profile?.email || 'Admin'}
          </p>
          <NavLink to="/" className="admin-sidebar__link" style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 14 }}>🏪</span> Ver tienda
          </NavLink>
          <button
            onClick={handleSignOut}
            className="admin-sidebar__link-btn"
          >
            <span style={{ fontSize: 14 }}>🚪</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Contenido ── */}
      <main className="admin-content">
        {title && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ margin: 0, fontSize: 24 }}>{title}</h2>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}