// src/pages/Admin/Dashboard.jsx
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabaseData } from '../../lib/supabase'
import AdminLayout from '../../components/AdminLayout'

async function fetchMetrics() {
  const [ordersRes, booksRes, usersRes] = await Promise.all([
    supabaseData.from('orders').select('id, total, status, created_at'),
    supabaseData.from('books').select('id, stock'),
    supabaseData.from('profiles').select('id', { count: 'exact', head: true }),
  ])

  const orders = ordersRes.data || []
  const books  = booksRes.data  || []
  const today  = new Date().toISOString().slice(0, 10)

  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((a, o) => a + Number(o.total), 0)

  return {
    totalOrders: orders.length,
    todayOrders: orders.filter(o => o.created_at.slice(0, 10) === today).length,
    totalRevenue,
    totalBooks:  books.length,
    outStock:    books.filter(b => b.stock === 0).length,
    totalUsers:  usersRes.count || 0,
    lowStock:    books.filter(b => b.stock > 0 && b.stock <= 5).length,
  }
}

async function fetchRecentOrders() {
  const { data, error } = await supabaseData
    .from('orders')
    .select(`
      id,
      status,
      total,
      created_at,
      profiles ( full_name )
    `)
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) throw error
  return data
}

function MetricCard({ label, value, sub, accent }) {
  return (
    <div className="card" style={{ 
      width: '100%', 
      margin: 0, 
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      borderTop: accent ? `4px solid ${accent}` : '1px solid var(--jv-border)'
    }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--jv-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <p style={{ fontSize: '32px', fontWeight: 800, margin: '12px 0', color: 'var(--jv-brown-900)' }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: '14px', color: 'var(--jv-ink-muted)', margin: 0 }}>{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const queryClient = useQueryClient()

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: fetchMetrics
  })

  const { data: recentOrders = [] } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: fetchRecentOrders
  })

  useEffect(() => {
    const channel = supabaseData
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
        queryClient.invalidateQueries({ queryKey: ['admin-recent-orders'] })
      })
      .subscribe()
    return () => supabaseData.removeChannel(channel)
  }, [queryClient])

  return (
    <AdminLayout title="Dashboard">
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {loadingMetrics ? (
          <div className="loading-page"><span className="spinner" /></div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: '20px',
            width: '100%'
          }}>
            <MetricCard 
              label="Ingresos Totales" 
              value={`Bs. ${metrics.totalRevenue.toFixed(2)}`} 
              sub="Ventas confirmadas"
              accent="var(--jv-brown-500)"
            />
            <MetricCard 
              label="Libros en Catálogo" 
              value={metrics.totalBooks} 
              sub={`${metrics.outStock} agotados`} 
            />
            <MetricCard 
              label="Pedidos" 
              value={metrics.totalOrders} 
              sub={`${metrics.todayOrders} realizados hoy`} 
            />
            <MetricCard 
              label="Usuarios" 
              value={metrics.totalUsers} 
              sub="Clientes registrados" 
            />
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '24px',
          width: '100%'
        }}>
          
          <div style={{ width: '100%', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Pedidos recientes</h3>
              <Link to="/admin/orders" className="btn btn-ghost btn-sm">Ver todos</Link>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id}>
                        <td style={{ fontFamily: 'monospace' }}>#{order.id.slice(0,8)}</td>
                        <td>{order.profiles?.full_name || 'Invitado'}</td>
                        <td style={{ fontWeight: 700 }}>Bs. {Number(order.total).toFixed(2)}</td>
                      </tr>
                    ))}
                    {recentOrders.length === 0 && (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No hay pedidos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', minWidth: 0 }}>
            <h3 style={{ marginBottom: '16px' }}>Stock Crítico</h3>
            <div className="card" style={{ padding: '20px' }}>
              {metrics?.lowStock > 0 ? (
                <div style={{ color: '#b45309', fontWeight: 600 }}>
                  ⚠️ Tienes {metrics.lowStock} libros con poco stock.
                </div>
              ) : (
                <div style={{ color: 'var(--jv-ink-muted)' }}>✓ Todo el inventario está bien.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  )
}