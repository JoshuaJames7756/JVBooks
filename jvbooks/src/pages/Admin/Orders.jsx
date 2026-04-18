// src/pages/Admin/Orders.jsx
import { useState }  from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseData } from '../../lib/supabase'
import AdminLayout   from '../../components/AdminLayout'

const STATUS_OPTIONS = [
  { value: 'pending',   label: 'Pendiente',  cls: 'status-pending'   },
  { value: 'confirmed', label: 'Confirmado', cls: 'status-confirmed' },
  { value: 'shipped',   label: 'En camino',  cls: 'status-shipped'   },
  { value: 'delivered', label: 'Entregado',  cls: 'status-delivered' },
  { value: 'cancelled', label: 'Cancelado',  cls: 'status-cancelled' },
]

async function fetchAllOrders(filter) {
  let query = supabaseData.from('orders').select(`
    id, status, total, created_at, user_id, shipping_address,
    order_items ( quantity, unit_price, books!order_items_book_id_fkey ( title, author, cover_url, slug ) )
  `).order('created_at', { ascending: false })
  if (filter && filter !== 'all') query = query.eq('status', filter)
  const { data, error } = await query
  if (error) throw error
  return data
}

function OrderRow({ order, onStatusChange }) {
  const [open, setOpen] = useState(false)
  const client = order.profiles?.full_name || order.profiles?.email || 'Invitado'
  const itemCount = order.order_items.reduce((a, i) => a + i.quantity, 0)

  return (
    <>
      <tr style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--jv-brown-700)', fontWeight: 600 }}>
          #{order.id.slice(0, 8).toUpperCase()}
        </td>
        <td>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{client}</p>
          {order.guest_email && <span className="badge badge-gray" style={{ fontSize: 10, marginTop: 2 }}>Invitado</span>}
        </td>
        <td style={{ fontSize: 12, color: 'var(--jv-ink-muted)' }}>
          {new Date(order.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
        </td>
        <td style={{ fontSize: 13 }}>{itemCount} producto{itemCount !== 1 ? 's' : ''}</td>
        <td style={{ fontWeight: 700, color: 'var(--jv-brown-700)' }}>Bs. {Number(order.total).toFixed(2)}</td>
        <td onClick={e => e.stopPropagation()}>
          <select className="select" value={order.status} onChange={e => onStatusChange(order.id, e.target.value)} style={{ fontSize: 12, padding: '4px 8px' }}>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </td>
        <td style={{ color: 'var(--jv-ink-muted)', fontSize: 12 }}>{open ? '▲' : '▼'}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} style={{ padding: 0 }}>
            <div style={{ background: 'var(--jv-brown-50)', padding: '16px 20px', borderTop: '1px solid var(--jv-border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {order.order_items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {item.books?.cover_url
                      ? <img src={item.books.cover_url} alt={item.books.title} style={{ width: 36, aspectRatio: '3/4', objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                      : <div style={{ width: 36, aspectRatio: '3/4', background: 'var(--jv-brown-200)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📖</div>}
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{item.books?.title}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--jv-ink-muted)' }}>{item.books?.author} - x{item.quantity} - Bs. {Number(item.unit_price).toFixed(2)} c/u</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--jv-brown-700)' }}>Bs. {(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {order.shipping_address && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--jv-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--jv-ink-soft)', marginBottom: 6 }}>📦 Datos de entrega</p>
                    <p style={{ margin: 0, color: 'var(--jv-ink-muted)' }}>👤 {order.shipping_address.full_name}</p>
                    <p style={{ margin: 0, color: 'var(--jv-ink-muted)' }}>✉️ {order.shipping_address.email}</p>
                    {order.shipping_address.phone && <p style={{ margin: 0, color: 'var(--jv-ink-muted)' }}>📞 {order.shipping_address.phone}</p>}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--jv-ink-soft)', marginBottom: 6 }}>📍 Dirección</p>
                    <p style={{ margin: 0, color: 'var(--jv-ink-muted)' }}>{order.shipping_address.address}</p>
                    <p style={{ margin: 0, color: 'var(--jv-ink-muted)' }}>{order.shipping_address.city}</p>
                    {order.shipping_address.notes && <p style={{ margin: 0, color: 'var(--jv-ink-muted)', fontStyle: 'italic' }}>💬 {order.shipping_address.notes}</p>}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--jv-border)', display: 'flex', justifyContent: 'flex-end', fontSize: 14 }}>
                <span style={{ color: 'var(--jv-ink-muted)', marginRight: 12 }}>Total</span>
                <span style={{ fontWeight: 700, color: 'var(--jv-brown-700)' }}>Bs. {Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function AdminOrders() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data: orders = [], isLoading } = useQuery({ queryKey: ['admin-orders', filter], queryFn: () => fetchAllOrders(filter) })

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const { error } = await supabaseData.from('orders').update({ status }).eq('id', orderId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['admin-recent-orders'] })
    },
  })

  const filtered = orders.filter(o => {
    const client = (o.profiles?.full_name || o.profiles?.email || o.guest_email || '').toLowerCase()
    return client.includes(search.toLowerCase()) || o.id.includes(search.toLowerCase())
  })

  function exportCSV() {
    const rows = [['ID', 'Cliente', 'Email', 'Estado', 'Total', 'Fecha'],
      ...orders.map(o => [o.id, o.profiles?.full_name || 'Invitado', o.profiles?.email || o.guest_email || '', o.status, Number(o.total).toFixed(2), new Date(o.created_at).toLocaleDateString('es-BO')])]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout title="Pedidos">
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input" placeholder="Buscar por cliente o ID…" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: '1 1 200px' }} />
        <select className="select" value={filter} onChange={e => setFilter(e.target.value)} style={{ flex: '0 1 180px' }}>
          <option value="all">Todos los estados</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={exportCSV}>⬇ Exportar CSV</button>
      </div>
      <p style={{ fontSize: 13, color: 'var(--jv-ink-muted)', marginBottom: 16 }}>
        {filtered.length} pedido{filtered.length !== 1 ? 's' : ''}{filter !== 'all' ? ` · filtro: ${STATUS_OPTIONS.find(s => s.value === filter)?.label}` : ''}
      </p>
      {isLoading ? <div className="loading-page"><span className="spinner" /></div> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 28, color: 'var(--jv-ink-muted)' }}>No hay pedidos.</td></tr>}
                {filtered.map(order => <OrderRow key={order.id} order={order} onStatusChange={(id, status) => updateStatus.mutate({ orderId: id, status })} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}