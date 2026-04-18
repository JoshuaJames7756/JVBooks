// src/pages/Account/Orders.jsx
import { useState }  from 'react'
import { useQuery }  from '@tanstack/react-query'
import { Link }      from 'react-router-dom'
import { supabaseData } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const STATUS_LABELS = {
  pending:   { label: 'Pendiente',  cls: 'status-pending'   },
  confirmed: { label: 'Confirmado', cls: 'status-confirmed' },
  shipped:   { label: 'En camino',  cls: 'status-shipped'   },
  delivered: { label: 'Entregado',  cls: 'status-delivered' },
  cancelled: { label: 'Cancelado',  cls: 'status-cancelled' },
}

async function fetchOrders(userId) {
  const { data, error } = await supabaseData.from('orders').select(`
    id, status, total, created_at,
    order_items ( quantity, unit_price, books ( title, author, cover_url, slug ) )
  `).eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

function OrderRow({ order }) {
  const [open, setOpen] = useState(false)
  const status = STATUS_LABELS[order.status] || { label: order.status, cls: '' }
  const itemCount = order.order_items.reduce((a, i) => a + i.quantity, 0)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '18px 24px', textAlign: 'left', display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--jv-ink-muted)', marginBottom: 2 }}>Pedido</p>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, color: 'var(--jv-brown-700)', fontWeight: 600 }}>#{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div style={{ textAlign: 'right', minWidth: 100 }}>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--jv-ink-muted)', marginBottom: 2 }}>Fecha</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{new Date(order.created_at).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
        <span className={`badge ${status.cls}`} style={{ whiteSpace: 'nowrap' }}>{status.label}</span>
        <div style={{ textAlign: 'right', minWidth: 100 }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--jv-brown-700)' }}>Bs. {Number(order.total).toFixed(2)}</p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--jv-ink-muted)' }}>{itemCount} producto{itemCount !== 1 ? 's' : ''} {open ? '▲' : '▼'}</p>
        </div>
      </button>
      {open && (
        <div style={{ borderTop: '1px solid var(--jv-border)', padding: '16px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {order.order_items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 12, alignItems: 'center' }}>
                {item.books?.cover_url
                  ? <img src={item.books.cover_url} alt={item.books.title} style={{ width: 48, aspectRatio: '3/4', objectFit: 'cover', borderRadius: 4 }} />
                  : <div style={{ width: 48, aspectRatio: '3/4', background: 'var(--jv-brown-100)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📖</div>}
                <div>
                  <Link to={`/book/${item.books?.slug}`} style={{ fontWeight: 600, fontSize: 14, color: 'var(--jv-brown-800)', textDecoration: 'none', display: 'block', marginBottom: 2 }}>{item.books?.title}</Link>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--jv-ink-muted)' }}>{item.books?.author} - x{item.quantity}</p>
                </div>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--jv-brown-700)' }}>Bs. {(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px dashed var(--jv-border)', display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--jv-ink-muted)' }}>Total del pedido</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--jv-brown-700)' }}>Bs. {Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Orders() {
  const { user } = useAuthStore()
  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: () => fetchOrders(user.id),
    enabled: !!user,
  })

  return (
    <div className="container section">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Mis pedidos</h2>
          {!isLoading && <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>{orders.length} pedido{orders.length !== 1 ? 's' : ''} en total</p>}
        </div>
        <Link to="/account" className="btn btn-ghost btn-sm">← Mi perfil</Link>
      </div>
      {isLoading && <div className="loading-page"><span className="spinner" /></div>}
      {isError && <div className="empty-state"><div className="empty-state__icon">⚠️</div><p className="empty-state__title">Error al cargar pedidos</p><p>Intenta recargar la página.</p></div>}
      {!isLoading && !isError && orders.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">📦</div>
          <p className="empty-state__title">Aún no tienes pedidos</p>
          <p>Cuando realices una compra, aparecerá aquí.</p>
          <Link to="/catalog" className="btn btn-primary" style={{ marginTop: 20 }}>Explorar catálogo</Link>
        </div>
      )}
      {!isLoading && !isError && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(order => <OrderRow key={order.id} order={order} />)}
        </div>
      )}
    </div>
  )
}