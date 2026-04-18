// src/pages/Cart.jsx
import { useState }              from 'react'
import { Link, useNavigate }     from 'react-router-dom'
import { useCartStore }          from '../store/cartStore'

export default function Cart() {
  const navigate = useNavigate()
  const store = useCartStore()
  const { items, removeItem, updateQty, clearCart } = store
  const subtotal = store.getSubtotal()
  const total = store.getTotal()

  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [loadingCoupon, setLoadingCoupon] = useState(false)

  async function applyCoupon() {
    if (!couponCode.trim()) {
      setCouponError('Ingresa un código de cupón')
      return
    }

    setLoadingCoupon(true)
    setCouponError('')

    // TODO: Validar cupón contra Supabase
    // Por ahora es un placeholder
    console.log('Validar cupón:', couponCode)
    
    setLoadingCoupon(false)
  }

  function handleCheckout() {
    if (items.length === 0) {
      setCouponError('El carrito está vacío')
      return
    }
    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="empty-state__icon">🛒</div>
          <p className="empty-state__title">Tu carrito está vacío</p>
          <p className="empty-state__text" style={{ color: 'var(--jv-ink-muted)', marginBottom: 24 }}>
            Explora nuestro catálogo y agrega los libros que te gusten.
          </p>
          <Link to="/catalog" className="btn btn-primary">
            Ir al catálogo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container section">
      {/* Breadcrumb */}
      <nav style={{ fontSize: 13, color: 'var(--jv-ink-muted)', marginBottom: 28 }}>
        <Link to="/catalog" style={{ color: 'var(--jv-brown-600)' }}>Catálogo</Link>
        {' / '}
        <span style={{ color: 'var(--jv-ink)' }}>Carrito</span>
      </nav>

      <h1 style={{ marginBottom: 28 }}>Tu carrito</h1>

      <div className="layout-two-col">

        {/* Lista de items */}
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {items.map(item => (
              <div key={item.id} className="cart-item">
                {/* Portada */}
                {item.cover_url ? (
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    className="cart-item__cover"
                    onClick={() => navigate(`/book/${item.slug}`)}
                    style={{ cursor: 'pointer' }}
                  />
                ) : (
                  <div style={{
                    width: 64,
                    aspectRatio: '3/4',
                    background: 'var(--jv-brown-100)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                  }}>
                    📖
                  </div>
                )}

                {/* Info */}
                <div style={{ minWidth: 0 }}>
                  <p
                    onClick={() => navigate(`/book/${item.slug}`)}
                    style={{
                      margin: 0,
                      fontWeight: 500,
                      cursor: 'pointer',
                      color: 'var(--jv-brown-700)',
                      textDecoration: 'underline',
                    }}
                  >
                    {item.title}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--jv-ink-muted)' }}>
                    {item.author}
                  </p>
                  <p style={{ margin: '8px 0 0', fontWeight: 600, color: 'var(--jv-brown-700)' }}>
                    Bs. {Number(item.price).toFixed(2)}
                  </p>
                </div>

                {/* Cantidad y acciones */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--jv-border)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                  }}>
                    <button
                      onClick={() => updateQty(item.id, Math.max(1, item.qty - 1))}
                      style={{
                        width: 28,
                        height: 28,
                        border: 'none',
                        background: 'var(--jv-brown-50)',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      −
                    </button>
                    <span style={{ width: 32, textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      style={{
                        width: 28,
                        height: 28,
                        border: 'none',
                        background: 'var(--jv-brown-50)',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      +
                    </button>
                  </div>

                  <p style={{ margin: 0, fontSize: 12, color: 'var(--jv-ink-muted)' }}>
                    Bs. {(Number(item.price) * item.qty).toFixed(2)}
                  </p>

                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--jv-error)',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                      padding: 0,
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen y checkout */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 16, margin: '0 0 16px' }}>Resumen</h3>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: 12,
              borderBottom: '1px solid var(--jv-border)',
              marginBottom: 12,
              fontSize: 14,
            }}>
              <span style={{ color: 'var(--jv-ink-soft)' }}>Subtotal</span>
              <span>Bs. {subtotal.toFixed(2)}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: 12,
              borderBottom: '1px solid var(--jv-border)',
              marginBottom: 12,
              fontSize: 14,
            }}>
              <span style={{ color: 'var(--jv-ink-soft)' }}>Envío</span>
              <span>Gratis</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--jv-brown-700)',
              marginBottom: 20,
            }}>
              <span>Total</span>
              <span>Bs. {total.toFixed(2)}</span>
            </div>

            <button
              className="btn btn-primary btn-block btn-lg"
              onClick={handleCheckout}
              style={{ marginBottom: 12 }}
            >
              Ir a pagar
            </button>

            <Link
              to="/catalog"
              className="btn btn-ghost btn-block"
              style={{ textDecoration: 'none' }}
            >
              Seguir comprando
            </Link>
          </div>

          {/* Cupón */}
          <div className="card">
            <h4 style={{ fontSize: 14, marginBottom: 12, margin: '0 0 12px' }}>Código de descuento</h4>

            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                className="input"
                placeholder="Ingresa tu código"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                style={{ flex: 1, fontSize: 13 }}
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={applyCoupon}
                disabled={loadingCoupon}
              >
                {loadingCoupon ? '…' : 'Aplicar'}
              </button>
            </div>

            {couponError && (
              <p style={{ fontSize: 12, color: 'var(--jv-error)', margin: 0 }}>
                {couponError}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Opciones adicionales */}
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <button
          onClick={() => {
            if (window.confirm('¿Descartar todo el carrito?')) {
              clearCart()
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--jv-error)',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'underline',
          }}
        >
          Vaciar carrito
        </button>
      </div>
    </div>
  )
}
