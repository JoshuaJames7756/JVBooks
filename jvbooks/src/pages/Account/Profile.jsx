// src/pages/Account/Profile.jsx
import { useState }          from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabaseAuth, supabaseData } from '../../lib/supabase'
import { useAuthStore }      from '../../store/authStore'

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, setProfile, signOut } = useAuthStore()

  const [fullName,  setFullName]  = useState(profile?.full_name || '')
  const [saving,    setSaving]    = useState(false)
  const [saveMsg,   setSaveMsg]   = useState('')
  const [pwForm,    setPwForm]    = useState({ current: '', next: '', confirm: '' })
  const [pwErrors,  setPwErrors]  = useState({})
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg,     setPwMsg]     = useState('')

  async function handleSaveName() {
    if (!fullName.trim()) return
    setSaving(true); setSaveMsg('')
    const { data, error } = await supabaseData.from('profiles').update({ full_name: fullName.trim() }).eq('id', user.id).select().single()
    if (!error) {
      setProfile(data)
      setSaveMsg('¡Nombre actualizado!')
      setTimeout(() => setSaveMsg(''), 3000)
    } else {
      setSaveMsg('Error al guardar. Intenta nuevamente.')
    }
    setSaving(false)
  }

  async function handleChangePassword() {
    const e = {}
    if (!pwForm.next)                   e.next    = 'Requerido'
    if (pwForm.next.length < 6)         e.next    = 'Mínimo 6 caracteres'
    if (pwForm.next !== pwForm.confirm) e.confirm = 'Las contraseñas no coinciden'
    if (Object.keys(e).length) { setPwErrors(e); return }
    setPwLoading(true); setPwErrors({}); setPwMsg('')
    const { error } = await supabaseAuth.auth.updateUser({ password: pwForm.next })
    if (error) {
      setPwMsg('Error: ' + error.message)
    } else {
      setPwMsg('¡Contraseña actualizada correctamente!')
      setPwForm({ current: '', next: '', confirm: '' })
      setTimeout(() => setPwMsg(''), 4000)
    }
    setPwLoading(false)
  }

  const initials = (profile?.full_name || user?.email || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="container section" style={{ maxWidth: 640, marginInline: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Mi perfil</h2>
        <Link to="/account/orders" className="btn btn-ghost btn-sm">Ver mis pedidos →</Link>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--jv-brown-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--jv-brown-700)', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 17 }}>{profile?.full_name || 'Usuario'}</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--jv-ink-muted)' }}>{user?.email}</p>
            {profile?.role === 'admin' && <span className="badge badge-brown" style={{ marginTop: 6, display: 'inline-block' }}>Administrador</span>}
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Nombre completo</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveName()} style={{ flex: 1 }} />
            <button className="btn btn-primary btn-sm" onClick={handleSaveName} disabled={saving || !fullName.trim()}>{saving ? '…' : 'Guardar'}</button>
          </div>
          {saveMsg && <span style={{ fontSize: 13, color: saveMsg.startsWith('Error') ? 'var(--jv-error)' : 'var(--jv-success)' }}>{saveMsg}</span>}
        </div>
        <div className="input-group" style={{ marginTop: 16 }}>
          <label className="input-label">Email</label>
          <input className="input" value={user?.email} disabled style={{ background: 'var(--jv-brown-50)', cursor: 'not-allowed', color: 'var(--jv-ink-muted)' }} />
          <span className="input-hint">El email no se puede cambiar.</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, marginBottom: 20 }}>Cambiar contraseña</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label className="input-label">Nueva contraseña</label>
            <input className="input" type="password" placeholder="Mínimo 6 caracteres" value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} />
            {pwErrors.next && <span className="input-error">{pwErrors.next}</span>}
          </div>
          <div className="input-group">
            <label className="input-label">Confirmar nueva contraseña</label>
            <input className="input" type="password" placeholder="Repite la nueva contraseña" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleChangePassword()} />
            {pwErrors.confirm && <span className="input-error">{pwErrors.confirm}</span>}
          </div>
          {pwMsg && <p style={{ fontSize: 13, margin: 0, color: pwMsg.startsWith('Error') ? 'var(--jv-error)' : 'var(--jv-success)' }}>{pwMsg}</p>}
          <div>
            <button className="btn btn-secondary" onClick={handleChangePassword} disabled={pwLoading}>{pwLoading ? 'Actualizando…' : 'Actualizar contraseña'}</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ borderColor: 'var(--jv-border-strong)' }}>
        <h3 style={{ fontSize: 16, marginBottom: 6 }}>Sesión</h3>
        <p style={{ fontSize: 13, color: 'var(--jv-ink-muted)', marginBottom: 16 }}>Sesión activa como <strong>{user?.email}</strong></p>
        <button className="btn btn-ghost btn-sm" onClick={async () => { await signOut(); navigate('/') }}>Cerrar sesión</button>
      </div>
    </div>
  )
}