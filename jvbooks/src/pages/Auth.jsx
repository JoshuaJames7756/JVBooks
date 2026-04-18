// src/pages/Auth.jsx
import { useState, useEffect } from 'react'
import { useNavigate, Link }   from 'react-router-dom'
import { supabase, supabaseAuth } from '../lib/supabase'
import { useAuthStore }        from '../store/authStore'

export default function Auth() {
  const navigate      = useNavigate()
  const { user }      = useAuthStore()
  const [tab, setTab] = useState('login')

  useEffect(() => {
    if (user) navigate('/account', { replace: true })
  }, [user, navigate])

  const [loginForm,    setLoginForm]    = useState({ email: '', password: '' })
  const [loginError,   setLoginError]   = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  async function handleLogin() {
    setLoginLoading(true)
    setLoginError('')
    
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email:    loginForm.email.trim(),
      password: loginForm.password,
    })
    
    if (error) {
      setLoginError(
        error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos.'
          : error.message
      )
      setLoginLoading(false)
    } else {
      if (data.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          if (!profileError && profile) {
            useAuthStore.getState().setUser(data.user)
            useAuthStore.getState().setProfile(profile)
          }
        } catch (err) {
          console.error('Error loading profile:', err)
        }
      }
      setLoginLoading(false)
    }
  }

  const [regForm,    setRegForm]    = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [regErrors,  setRegErrors]  = useState({})
  const [regLoading, setRegLoading] = useState(false)
  const [regSuccess, setRegSuccess] = useState(false)

  function validateReg() {
    const e = {}
    if (!regForm.full_name.trim()) e.full_name = 'Requerido'
    if (!regForm.email.trim())     e.email     = 'Requerido'
    if (!/\S+@\S+\.\S+/.test(regForm.email)) e.email = 'Email inválido'
    if (regForm.password.length < 6) e.password = 'Mínimo 6 caracteres'
    if (regForm.password !== regForm.confirm) e.confirm = 'Las contraseñas no coinciden'
    return e
  }

  async function handleRegister() {
    const e = validateReg()
    if (Object.keys(e).length) { setRegErrors(e); return }

    setRegLoading(true)
    setRegErrors({})

    const { error } = await supabaseAuth.auth.signUp({
      email:    regForm.email.trim(),
      password: regForm.password,
      options: {
        data: { full_name: regForm.full_name.trim() },
      },
    })

    if (error) {
      setRegErrors({ general: error.message })
    } else {
      setRegSuccess(true)
    }
    setRegLoading(false)
  }

  // ... resto del JSX igual, no cambia nada visual
  return (
    <div style={{
      minHeight: 'calc(100vh - var(--nav-height))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px',
      background: 'var(--jv-brown-50)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo / título */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <h2 style={{ marginBottom: 4 }}>JV<span style={{ color: 'var(--jv-brown-500)' }}>Books</span></h2>
          </Link>
          <p style={{ color: 'var(--jv-ink-muted)', margin: 0, fontSize: 14 }}>
            {tab === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
          </p>
        </div>

        {/* Card */}
        <div className="card">

          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--jv-brown-50)',
            borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 24,
          }}>
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setLoginError(''); setRegErrors({}) }}
                style={{
                  flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
                  borderRadius: 'calc(var(--radius-md) - 2px)',
                  fontSize: 14, fontWeight: 500, transition: 'all var(--transition)',
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? 'var(--jv-brown-800)' : 'var(--jv-ink-muted)',
                  boxShadow: tab === t ? 'var(--shadow-xs)' : 'none',
                }}
              >
                {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          {/* ── FORMULARIO LOGIN ── */}
          {tab === 'login' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="tu@email.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoComplete="email"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Contraseña</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  autoComplete="current-password"
                />
              </div>

              {loginError && (
                <div style={{
                  background: 'var(--jv-error-bg)', color: 'var(--jv-error)',
                  padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13,
                }}>
                  {loginError}
                </div>
              )}

              <button
                className="btn btn-primary btn-block btn-lg"
                onClick={handleLogin}
                disabled={loginLoading}
                style={{ marginTop: 4 }}
              >
                {loginLoading
                  ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Entrando…</>
                  : 'Iniciar sesión'
                }
              </button>
            </div>
          )}

          {/* ── FORMULARIO REGISTRO ── */}
          {tab === 'register' && !regSuccess && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Nombre completo</label>
                <input
                  className="input"
                  placeholder="Juan Pérez"
                  value={regForm.full_name}
                  onChange={e => setRegForm(f => ({ ...f, full_name: e.target.value }))}
                  autoComplete="name"
                />
                {regErrors.full_name && <span className="input-error">{regErrors.full_name}</span>}
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="tu@email.com"
                  value={regForm.email}
                  onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                />
                {regErrors.email && <span className="input-error">{regErrors.email}</span>}
              </div>
              <div className="input-group">
                <label className="input-label">Contraseña</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={regForm.password}
                  onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                  autoComplete="new-password"
                />
                {regErrors.password && <span className="input-error">{regErrors.password}</span>}
              </div>
              <div className="input-group">
                <label className="input-label">Confirmar contraseña</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={regForm.confirm}
                  onChange={e => setRegForm(f => ({ ...f, confirm: e.target.value }))}
                  autoComplete="new-password"
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                />
                {regErrors.confirm && <span className="input-error">{regErrors.confirm}</span>}
              </div>

              {regErrors.general && (
                <div style={{
                  background: 'var(--jv-error-bg)', color: 'var(--jv-error)',
                  padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13,
                }}>
                  {regErrors.general}
                </div>
              )}

              <button
                className="btn btn-primary btn-block btn-lg"
                onClick={handleRegister}
                disabled={regLoading}
                style={{ marginTop: 4 }}
              >
                {regLoading
                  ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creando cuenta…</>
                  : 'Crear cuenta'
                }
              </button>
            </div>
          )}

          {/* ── REGISTRO EXITOSO ── */}
          {tab === 'register' && regSuccess && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--jv-success-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, marginInline: 'auto', marginBottom: 16,
              }}>
                ✉️
              </div>
              <h3 style={{ marginBottom: 8, fontSize: 18 }}>¡Revisa tu email!</h3>
              <p style={{ color: 'var(--jv-ink-muted)', fontSize: 14 }}>
                Te enviamos un enlace de confirmación a <strong>{regForm.email}</strong>.
                Confirma tu cuenta para iniciar sesión.
              </p>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setTab('login'); setRegSuccess(false) }}
                style={{ marginTop: 16 }}
              >
                Ir a iniciar sesión
              </button>
            </div>
          )}

        </div>

        {/* Continuar como invitado */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--jv-ink-muted)' }}>
          ¿Solo quieres comprar?{' '}
          <Link to="/cart" style={{ color: 'var(--jv-brown-600)', fontWeight: 500 }}>
            Continuar como invitado
          </Link>
        </p>
      </div>
    </div>
  )
}