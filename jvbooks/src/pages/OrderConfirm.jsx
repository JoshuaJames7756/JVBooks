// src/pages/OrderConfirm.jsx
import { useEffect }         from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuthStore }      from '../store/authStore'

export default function OrderConfirm() {
  const { state }  = useLocation()
  const { user }   = useAuthStore()
  const orderId    = state?.orderId
  const email      = state?.email
  const total      = state?.total

  // Scroll al top al llegar
  useEffect(() => { window.scrollTo(0, 0) }, [])

  // Si llegaron directo sin estado (refresh), mostrar pantalla genérica
  if (!orderId) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="empty-state__icon">📦</div>
          <p className="empty-state__title">Pedido confirmado</p>
          <p>Gracias por tu compra.</p>
          <Link to="/catalog" className="btn btn-primary" style={{ marginTop: 20 }}>
            Seguir comprando
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container section" style={{ maxWidth: 600, marginInline: 'auto' }}>

      {/* Ícono de éxito animado */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--jv-success-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, marginInline: 'auto', marginBottom: 20,
          animation: 'fadeIn .4s ease',
        }}>
          ✓
        </div>
        <h2 style={{ marginBottom: 8 }}>¡Pedido confirmado!</h2>
        <p style={{ color: 'var(--jv-ink-muted)', margin: 0 }}>
          Gracias por tu compra. Te contactaremos pronto para coordinar la entrega.
        </p>
      </div>

      {/* Tarjeta de detalles */}
      <div className="card" style={{ marginBottom: 24 }}>

        {/* Número de pedido */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingBottom: 16, borderBottom: '1px solid var(--jv-border)', marginBottom: 16,
        }}>
          <span style={{ fontSize: 14, color: 'var(--jv-ink-muted)' }}>Número de pedido</span>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)', fontSize: 12,
            background: 'var(--jv-brown-50)', padding: '4px 10px',
            borderRadius: 'var(--radius-sm)', color: 'var(--jv-brown-700)',
            border: '1px solid var(--jv-brown-200)',
            wordBreak: 'break-all', textAlign: 'right', maxWidth: '60%',
          }}>
            {orderId}
          </span>
        </div>

        {/* Email */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingBottom: 16, borderBottom: '1px solid var(--jv-border)', marginBottom: 16,
          fontSize: 14,
        }}>
          <span style={{ color: 'var(--jv-ink-muted)' }}>Confirmación enviada a</span>
          <span style={{ fontWeight: 500 }}>{email}</span>
        </div>

        {/* Total */}
        {total && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 14,
          }}>
            <span style={{ color: 'var(--jv-ink-muted)' }}>Total pagado</span>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 18,
              fontWeight: 700, color: 'var(--jv-brown-700)',
            }}>
              Bs. {Number(total).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Estado del pedido — pasos */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 20 }}>Estado del pedido</h3>

        {[
          { label: 'Pedido recibido',      done: true,  active: false },
          { label: 'Confirmado',           done: false, active: true  },
          { label: 'En camino',            done: false, active: false },
          { label: 'Entregado',            done: false, active: false },
        ].map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            paddingBlock: 10,
            borderBottom: i < 3 ? '1px dashed var(--jv-border)' : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600,
              background: step.done
                ? 'var(--jv-success-bg)'
                : step.active
                  ? 'var(--jv-brown-100)'
                  : 'var(--jv-brown-50)',
              color: step.done
                ? 'var(--jv-success)'
                : step.active
                  ? 'var(--jv-brown-700)'
                  : 'var(--jv-ink-muted)',
              border: step.active ? '1.5px solid var(--jv-brown-400)' : '1px solid var(--jv-border)',
            }}>
              {step.done ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: 14,
              fontWeight: step.active ? 600 : 400,
              color: step.done || step.active ? 'var(--jv-ink)' : 'var(--jv-ink-muted)',
            }}>
              {step.label}
            </span>
            {step.active && (
              <span className="badge badge-brown" style={{ marginLeft: 'auto', fontSize: 11 }}>
                Actual
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {user && (
          <Link to="/account/orders" className="btn btn-secondary btn-block">
            Ver mis pedidos
          </Link>
        )}
        <Link to="/catalog" className="btn btn-primary btn-block">
          Seguir comprando
        </Link>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}