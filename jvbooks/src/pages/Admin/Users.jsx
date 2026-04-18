// src/pages/Admin/Users.jsx
import { useState }  from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseData } from '../../lib/supabase'
import AdminLayout   from '../../components/AdminLayout'

async function fetchUsers() {
  const { data, error } = await supabaseData.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: users = [], isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: fetchUsers })

  const toggleRole = useMutation({
    mutationFn: async ({ id, currentRole }) => {
      const { error } = await supabaseData.from('profiles').update({ role: currentRole === 'admin' ? 'customer' : 'admin' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout title="Usuarios">
      <div style={{ marginBottom: 20 }}>
        <input className="input" placeholder="Buscar por nombre o email…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 340 }} />
      </div>
      <p style={{ fontSize: 13, color: 'var(--jv-ink-muted)', marginBottom: 16 }}>{filtered.length} usuario{filtered.length !== 1 ? 's' : ''}</p>
      {isLoading ? <div className="loading-page"><span className="spinner" /></div> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Registrado</th><th>Acción</th></tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--jv-ink-muted)' }}>No hay usuarios.</td></tr>}
                {filtered.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--jv-brown-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--jv-brown-700)', flexShrink: 0 }}>
                          {(user.full_name || user.email || 'U')[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{user.full_name || 'Sin nombre'}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--jv-ink-muted)' }}>{user.email}</td>
                    <td><span className={`badge ${user.role === 'admin' ? 'badge-brown' : 'badge-gray'}`}>{user.role === 'admin' ? 'Admin' : 'Cliente'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--jv-ink-muted)' }}>{new Date(user.created_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => toggleRole.mutate({ id: user.id, currentRole: user.role })} disabled={toggleRole.isPending}>{user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}