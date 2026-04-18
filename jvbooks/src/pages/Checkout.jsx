// src/pages/Checkout.jsx
import { useState }          from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase }          from '../lib/supabase'
import { useCartStore }      from '../store/cartStore'
import { useAuthStore }      from '../store/authStore'

// ── Helpers ────────────────────────────────────────────────
function Field({ label, hint, error, children }) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      {hint  && <span className="input-hint">{hint}</span>}
      {children}
      {error && <span className="input-error">{error}</span>}
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────
export default function Checkout() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { items, coupon, clearCart } = useCartStore()

  // Totales
  const subtotal = items.reduce((a, i) => a + Number(i.price) * i.qty, 0)
  const discount = coupon ? subtotal * (coupon.discount_pct / 100) : 0
  const total    = subtotal - discount

  // Formulario
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    email:     user?.email        || '',
    phone:     '',
    address:   '',
    city:      '',
    notes:     '',
  })
  const [errors,     setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  // Redirigir si el carrito está vacío
  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Requerido'
    if (!form.email.trim())     e.email     = 'Requerido'
    // RFC 5322 simplified (realistic email validation)
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
    if (form.phone && !/^[\d\s\-\+\(\)]{7,}$/.test(form.phone.trim())) e.phone = 'Teléfono inválido'
    if (!form.address.trim())   e.address   = 'Requerido'
    if (!form.city.trim())      e.city      = 'Requerido'
    return e
  }

  async function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSubmitting(true)
    setServerError('')

    try {
      // 1. Crear el pedido
      const orderPayload = {
        status:    'pending',
        total:     total,
        coupon_id: coupon?.id || null,
        shipping_address: {
          full_name: form.full_name,
          email:     form.email,
          phone:     form.phone,
          address:   form.address,
          city:      form.city,
          notes:     form.notes,
        },
        ...(user ? { user_id: user.id } : {}),
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single()

      if (orderError) throw orderError

      // En handleSubmit, reemplaza desde el paso 2 hasta el final del try:

      // 2. Insertar los items del pedido
      // 2. Insertar los items del pedido
      const orderItems = items.map(i => ({
        order_id:   order.id,
        book_id:    i.id,
        quantity:   i.qty,           // ← FIX: era 'qty', la columna es 'quantity'
        unit_price: Number(i.price),
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // 3. Descontar stock leyendo el valor actual desde DB (FIX: item.stock no existe en cartStore)
      for (const item of items) {
        const { data: book } = await supabase
          .from('books')
          .select('stock')
          .eq('id', item.id)
          .single()

        if (book) {
          await supabase
            .from('books')
            .update({ stock: Math.max(0, book.stock - item.qty) })
            .eq('id', item.id)
        }
      }

      // 4. Limpiar carrito en Supabase
      if (user) {
        await supabase.from('cart_items').delete().eq('user_id', user.id)
      }

      // 5. FIX: clearCart ANTES de navigate para evitar redirect a /cart
      clearCart()
      navigate('/order-ok', { state: { orderId: order.id, email: form.email, total } })

      
    } catch (err) {
      console.error(err)
      setServerError('Hubo un problema al procesar tu pedido. Intenta nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container section">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 4 }}>Finalizar pedido</h2>
        <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
          <Link to="/cart" style={{ color: 'var(--jv-brown-600)' }}>← Volver al carrito</Link>
        </p>
      </div>

      <div className="layout-two-col--checkout">

        {/* ── Formulario ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Datos personales */}
          <div className="card">
            <h3 style={{ fontSize: 17, marginBottom: 20 }}>Datos de contacto</h3>
            <div className="grid-form-2">
              <Field label="Nombre completo *" error={errors.full_name}>
                <input
                  className="input"
                  value={form.full_name}
                  onChange={e => set('full_name', e.target.value)}
                  placeholder="Juan Pérez"
                />
              </Field>
              <Field label="Email *" error={errors.email}>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="juan@email.com"
                />
              </Field>
              <Field label="Teléfono" hint="Opcional — para coordinar la entrega">
                <input
                  className="input"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+591 7XXXXXXX"
                />
              </Field>
            </div>
          </div>

          {/* Dirección */}
          <div className="card">
            <h3 style={{ fontSize: 17, marginBottom: 20 }}>Dirección de entrega</h3>
            <div className="grid-form-2">
              <Field label="Dirección *" error={errors.address}>
                <input
                  className="input"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  placeholder="Calle, número, zona"
                />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Ciudad *" error={errors.city}>
                  <input
                    className="input"
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    placeholder="Cochabamba"
                  />
                </Field>
              </div>
              <Field label="Notas para el repartidor" hint="Opcional">
                <textarea
                  className="textarea"
                  rows={2}
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Timbre roto, dejar con portero…"
                />
              </Field>
            </div>
          </div>

          {/* Pago */}
          <div className="card">
            <h3 style={{ fontSize: 17, marginBottom: 16 }}>Método de pago</h3>
            <div style={{
              background: 'var(--jv-brown-50)',
              border: '1.5px solid var(--jv-brown-400)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 22 }}>💵</span>
              <div>
                <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>Pago contra entrega</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--jv-ink-muted)' }}>
                  Paga en efectivo o QR al recibir tu pedido
                </p>
              </div>
            </div>
          </div>

          {/* Error servidor */}
          {serverError && (
            <div style={{
              background: 'var(--jv-error-bg)', border: '1px solid var(--jv-error)',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              color: 'var(--jv-error)', fontSize: 14,
            }}>
              {serverError}
            </div>
          )}
        </div>

        {/* ── Resumen ── */}
        <div className="cart-summary checkout-summary" style={{ position: 'sticky', top: 80 }}>
          <h3 style={{ marginBottom: 16, fontSize: 17 }}>Tu pedido</h3>

          {/* Items */}
          <div style={{ marginBottom: 16 }}>
            {items.map(item => (
              <div key={item.id} style={{
                display: 'flex', justifyContent: 'space-between',
                paddingBlock: 8, borderBottom: '1px solid var(--jv-border)',
                fontSize: 13, gap: 12,
              }}>
                <span style={{ color: 'var(--jv-ink-soft)', flex: 1 }}>
                  {item.title}
                  <span style={{ color: 'var(--jv-ink-muted)', marginLeft: 4 }}>×{item.qty}</span>
                </span>
                <span style={{ fontWeight: 500, flexShrink: 0 }}>
                  Bs. {(Number(item.price) * item.qty).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
            <span style={{ color: 'var(--jv-ink-soft)' }}>Subtotal</span>
            <span>Bs. {subtotal.toFixed(2)}</span>
          </div>
          {coupon && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: 'var(--jv-success)' }}>Cupón −{coupon.discount_pct}%</span>
              <span style={{ color: 'var(--jv-success)' }}>−Bs. {discount.toFixed(2)}</span>
            </div>
          )}

          <div className="divider" style={{ marginBlock: 12 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Total</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--jv-brown-700)' }}>
              Bs. {total.toFixed(2)}
            </span>
          </div>

          <button
            className="btn btn-primary btn-block btn-lg"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Procesando…</>
              : '✓ Confirmar pedido'
            }
          </button>

          <p style={{ fontSize: 11, color: 'var(--jv-ink-muted)', textAlign: 'center', marginTop: 10 }}>
            Al confirmar aceptas nuestros términos de servicio.
          </p>
        </div>

      </div>
    </div>
  )
}