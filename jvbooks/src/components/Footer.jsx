// src/components/Footer.jsx
import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{
      background: 'var(--jv-brown-900)',
      color: 'rgba(255,255,255,.6)',
      padding: '48px 0 28px',
      marginTop: 'auto',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 32, marginBottom: 40,
        }}>

          {/* Brand */}
          <div>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 20,
              fontWeight: 700, color: '#fff', margin: '0 0 8px',
            }}>
              JV<span style={{ color: 'var(--jv-brown-400)' }}>Books</span>
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Tu librería online en Bolivia.<br />
              Desarrollado por{' '}
              <a
                href="https://jvsoftware-mu.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--jv-brown-400)', textDecoration: 'none', fontWeight: 500 }}
              >
                JVSoftware
              </a>
            </p>
          </div>

          {/* Tienda */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--jv-brown-400)', margin: '0 0 14px' }}>
              Tienda
            </p>
            {[
              { to: '/catalog',  label: 'Catálogo' },
              { to: '/wishlist', label: 'Wishlist'  },
              { to: '/cart',     label: 'Carrito'   },
            ].map(link => (
              <Link
                key={link.to} to={link.to}
                style={{
                  display: 'block', fontSize: 14,
                  color: 'rgba(255,255,255,.6)', textDecoration: 'none',
                  marginBottom: 8, transition: 'color var(--transition)',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.6)'}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Cuenta */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--jv-brown-400)', margin: '0 0 14px' }}>
              Mi cuenta
            </p>
            {[
              { to: '/auth',           label: 'Iniciar sesión' },
              { to: '/account',        label: 'Mi perfil'      },
              { to: '/account/orders', label: 'Mis pedidos'    },
            ].map(link => (
              <Link
                key={link.to} to={link.to}
                style={{
                  display: 'block', fontSize: 14,
                  color: 'rgba(255,255,255,.6)', textDecoration: 'none',
                  marginBottom: 8, transition: 'color var(--transition)',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.6)'}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contacto */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--jv-brown-400)', margin: '0 0 14px' }}>
              Contacto
            </p>
            <p style={{ fontSize: 14, margin: '0 0 8px' }}>📍 Cochabamba, Bolivia</p>
            <p style={{ fontSize: 14, margin: '0 0 8px' }}>
              <a
                href="mailto:info@jvsoftware.com"
                style={{ color: 'rgba(255,255,255,.6)', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.6)'}
              >
                info@jvsoftware.com
              </a>
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,.08)',
          paddingTop: 20,
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 12,
          fontSize: 12,
        }}>
          <p style={{ margin: 0 }}>
            © {year} JVBooks · Todos los derechos reservados
          </p>
          <p style={{ margin: 0 }}>
            Hecho con ☕ por{' '}
            <a
              href="https://jvsoftware-mu.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--jv-brown-400)', textDecoration: 'none', fontWeight: 500 }}
            >
              JVSoftware
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}