// src/pages/Admin/Coupons.jsx
import { useState }  from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase }  from '../../lib/supabase'
import AdminLayout   from '../../components/AdminLayout'

async function fetchCoupons() {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

const EMPTY_COUPON = { code: '', discount_pct: '', expires_at: '' }

export default function AdminCoupons() {
  const queryClient = useQueryClient()
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(EMPTY_COUPON)
  const [formError, setFormError] = useState('')

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn:  fetchCoupons,
  })

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setFormError('')
  }

  const createCoupon = useMutation({
    mutationFn: async () => {
      if (!form.code.trim())   throw new Error('El código es requerido.')
      if (!form.discount_pct || isNaN(form.discount_pct) || Number(form.discount_pct) <= 0 || Number(form.discount_pct) > 100)
        throw new Error('El descuento debe ser entre 1 y 100.')

      const { error } = await supabase.from('coupons').insert({
        code:         form.code.trim().toUpperCase(),
        discount_pct: Number(form.discount_pct),
        expires_at:   form.expires_at || null,
        active:       true,
      })
      if (error) throw new Error(error.message.includes('unique') ? 'Ese código ya existe.' : error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      setForm(EMPTY_COUPON)
      setShowForm(false)
      setFormError('')
    },
    onError: (err) => setFormError(err.message),
  })

  const toggleCoupon = useMutation({
    mutationFn: async ({ id, active }) => {
      const { error } = await supabase.from('coupons').update({ active: !active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['admin-coupons']),
  })

  const deleteCoupon = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries(['admin-coupons']),
  })

  return (
    <AdminLayout title="Cupones de descuento">

      {/* Botón crear */}
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancelar' : '+ Nuevo cupón'}
        </button>
      </div>

      {/* Formulario inline */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24, maxWidth: 540 }}>
          <h3 style={{ fontSize: 16, marginBottom: 18 }}>Crear cupón</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="input-group">
              <label className="input-label">Código *</label>
              <input
                className="input"
                placeholder="VERANO25"
                value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase())}
                style={{ fontFamily: 'monospace', letterSpacing: 1 }}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Descuento % *</label>
              <input
                className="input" type="number" min="1" max="100"
                placeholder="25"
                value={form.discount_pct}
                onChange={e => set('discount_pct', e.target.value)}
              />
            </div>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Fecha de expiración</label>
              <input
                className="input" type="datetime-local"
                value={form.expires_at}
                onChange={e => set('expires_at', e.target.value)}
              />
              <span className="input-hint">Dejar vacío para sin expiración</span>
            </div>
          </div>

          {formError && (
            <p className="input-error" style={{ marginTop: 10 }}>{formError}</p>
          )}

          <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
            <button
              className="btn btn-primary"
              onClick={() => createCoupon.mutate()}
              disabled={createCoupon.isPending}
            >
              {createCoupon.isPending ? 'Creando…' : 'Crear cupón'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setForm(EMPTY_COUPON) }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      {isLoading ? (
        <div className="loading-page"><span className="spinner" /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descuento</th>
                  <th>Expira</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--jv-ink-muted)' }}>
                      No hay cupones creados.
                    </td>
                  </tr>
                )}
                {coupons.map(c => {
                  const expired = c.expires_at && new Date(c.expires_at) < new Date()
                  return (
                    <tr key={c.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
                        {c.code}
                      </td>
                      <td>
                        <span className="badge badge-brown" style={{ fontSize: 13 }}>
                          −{c.discount_pct}%
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {c.expires_at
                          ? <span style={{ color: expired ? 'var(--jv-error)' : 'var(--jv-ink-soft)' }}>
                              {expired ? '⚠ ' : ''}
                              {new Date(c.expires_at).toLocaleDateString('es-BO', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </span>
                          : <span style={{ color: 'var(--jv-ink-muted)' }}>Sin vencimiento</span>
                        }
                      </td>
                      <td>
                        <span className={`badge ${c.active && !expired ? 'badge-green' : 'badge-gray'}`}>
                          {c.active && !expired ? 'Activo' : expired ? 'Expirado' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => toggleCoupon.mutate({ id: c.id, active: c.active })}
                            disabled={toggleCoupon.isPending}
                          >
                            {c.active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--jv-error)' }}
                            onClick={() => {
                              if (confirm(`¿Eliminar el cupón ${c.code}?`)) deleteCoupon.mutate(c.id)
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}