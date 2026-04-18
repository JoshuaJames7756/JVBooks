// src/components/NavBar.jsx
import { useState, useEffect } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuthStore }   from '../store/authStore'
import { useCartStore }   from '../store/cartStore'

export default function NavBar() {
  const { user, profile, signOut } = useAuthStore()
  const items    = useCartStore(s => s.items)
  const totalQty = items.reduce((acc, i) => acc + i.qty, 0)
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  async function handleSignOut() {
    setIsOpen(false)
    await signOut()
    navigate('/')
  }

  const closeMenu = () => setIsOpen(false)

  return (
    <>
      <header className="navbar">
        <div className="navbar__inner">

          {/* 1. IZQUIERDA: Logo */}
          <Link to="/" className="navbar__logo" onClick={closeMenu}>
            <img src="/logo.png" alt="JVBooks logo" />
            <span className="navbar__logo-text">
              JV<span>Books</span>
            </span>
          </Link>

          {/* 2. CENTRO: Navegación */}
          <nav className={`navbar__nav ${isOpen ? 'is-open' : ''}`}>
            <NavLink to="/catalog"  className="navbar__link" onClick={closeMenu}>Catálogo</NavLink>
            <NavLink to="/wishlist" className="navbar__link" onClick={closeMenu}>Wishlist</NavLink>
            {profile?.role === 'admin' && (
              <NavLink to="/admin" className="navbar__link" onClick={closeMenu}>Admin</NavLink>
            )}

            <div className="navbar__mobile-actions">
              {user ? (
                <>
                  <Link to="/account" className="btn btn-ghost btn-block" onClick={closeMenu}>Mi cuenta</Link>
                  <button className="btn btn-danger btn-block" onClick={handleSignOut}>Salir</button>
                </>
              ) : (
                <Link to="/auth" className="btn btn-primary btn-block" onClick={closeMenu}>Iniciar sesión</Link>
              )}
            </div>
          </nav>

          {/* 3. DERECHA: Carrito y Auth Desktop */}
          <div className="navbar__actions">
            <button
              className="navbar__cart-btn"
              onClick={() => { navigate('/cart'); closeMenu(); }}
            >
              🛒
              {totalQty > 0 && (
                <span className="navbar__cart-count">{totalQty}</span>
              )}
            </button>

            <div className="navbar__desktop-auth">
              {user ? (
                <div className="flex flex-gap-2">
                  <Link to="/account" className="btn btn-ghost btn-sm">Mi cuenta</Link>
                  <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>Salir</button>
                </div>
              ) : (
                <Link to="/auth" className="btn btn-primary btn-sm">Iniciar sesión</Link>
              )}
            </div>

            <button className="hamburger-btn" onClick={() => setIsOpen(!isOpen)}>
              <span className={`bar ${isOpen ? 'open' : ''}`}></span>
              <span className={`bar ${isOpen ? 'open' : ''}`}></span>
              <span className={`bar ${isOpen ? 'open' : ''}`}></span>
            </button>
          </div>

        </div>
      </header>

      {/* Overlay fuera del header */}
      {isOpen && (
        <div className="navbar__overlay" onClick={closeMenu} />
      )}
    </>
  )
}