// src/pages/Admin/Books.jsx
import { useState, useRef }    from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase }            from '../../lib/supabase'
import AdminLayout             from '../../components/AdminLayout'

// ── Queries ────────────────────────────────────────────────
async function fetchAdminBooks() {
  const { data, error } = await supabase
    .from('books')
    .select('*, genres(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

async function fetchGenres() {
  const { data, error } = await supabase.from('genres').select('id, name').order('name')
  if (error) throw error
  return data
}

// ── Formulario vacío ───────────────────────────────────────
const EMPTY = {
  title: '', author: '', slug: '', description: '',
  price: '', stock: '', genre_id: '', cover_url: '', featured: false,
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
}

// ── Modal: Crear / Editar libro ────────────────────────────
function BookModal({ book, genres, onClose }) {
  const queryClient = useQueryClient()
  const fileRef     = useRef()
  const isEdit      = !!book?.id

  const [form,     setForm]     = useState(book || EMPTY)
  const [errors,   setErrors]   = useState({})
  const [uploading, setUploading] = useState(false)
  const [preview,  setPreview]  = useState(book?.cover_url || '')

  function set(field, value) {
    setForm(f => {
      const next = { ...f, [field]: value }
      if (field === 'title' && !isEdit) next.slug = slugify(value)
      return next
    })
    setErrors(e => ({ ...e, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.title.trim())  e.title  = 'Requerido'
    if (!form.author.trim()) e.author = 'Requerido'
    if (!form.slug.trim())   e.slug   = 'Requerido'
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) e.price = 'Precio inválido'
    if (!form.stock || isNaN(form.stock) || Number(form.stock) < 0) e.stock = 'Stock inválido'
    return e
  }

  // Upload imagen a Supabase Storage
  async function handleImageUpload(file) {
    if (!file) return
    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: upError } = await supabase.storage
        .from('book-covers')
        .upload(path, file, { contentType: file.type })

      if (upError) throw upError
      
      const { data } = supabase.storage.from('book-covers').getPublicUrl(path)
      setForm(f => ({ ...f, cover_url: data.publicUrl }))
      setPreview(data.publicUrl)
    } catch (error) {
      console.error('Error al subir imagen:', error.message)
      setErrors(e => ({ ...e, image: 'Error al subir imagen. Intenta de nuevo.' }))
    } finally {
      setUploading(false)
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title:       form.title.trim(),
        author:      form.author.trim(),
        slug:        form.slug.trim(),
        description: form.description.trim() || null,
        price:       Number(form.price),
        stock:       Number(form.stock),
        genre_id:    form.genre_id || null,
        cover_url:   form.cover_url || null,
        featured:    form.featured,
      }

      if (isEdit) {
        const { error } = await supabase.from('books').update(payload).eq('id', book.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('books').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] })
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['admin-low-stock'] })
      onClose()
    },
  })

  async function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    mutation.mutate()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal__header">
          <h2 className="modal__title">{isEdit ? 'Editar libro' : 'Nuevo libro'}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Portada */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div
              onClick={() => fileRef.current.click()}
              style={{
                width: 90, aspectRatio: '3/4', borderRadius: 'var(--radius-md)',
                border: '2px dashed var(--jv-border)', cursor: 'pointer',
                background: 'var(--jv-brown-50)', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, position: 'relative',
              }}
            >
              {preview ? (
                <img src={preview} alt="portada" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 28, color: 'var(--jv-brown-300)' }}>📷</span>
              )}
              {uploading && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(255,255,255,.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="spinner" />
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 6px' }}>Portada</p>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => fileRef.current.click()}
                disabled={uploading}
              >
                {uploading ? 'Subiendo…' : 'Seleccionar imagen'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleImageUpload(e.target.files[0])}
              />
              <p className="input-hint" style={{ marginTop: 6 }}>JPG, PNG o WebP · Max 2MB</p>
              {form.cover_url && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: 6, color: 'var(--jv-error)' }}
                  onClick={() => { setForm(f => ({ ...f, cover_url: '' })); setPreview('') }}
                >
                  Quitar imagen
                </button>
              )}
            </div>
          </div>

          {/* Título + autor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Título *</label>
              <input className="input" value={form.title} onChange={e => set('title', e.target.value)} />
              {errors.title && <span className="input-error">{errors.title}</span>}
            </div>
            <div className="input-group">
              <label className="input-label">Autor *</label>
              <input className="input" value={form.author} onChange={e => set('author', e.target.value)} />
              {errors.author && <span className="input-error">{errors.author}</span>}
            </div>
          </div>

          {/* Slug */}
          <div className="input-group">
            <label className="input-label">Slug (URL) *</label>
            <input
              className="input"
              value={form.slug}
              onChange={e => set('slug', slugify(e.target.value))}
              placeholder="mi-libro-titulo"
            />
            {errors.slug && <span className="input-error">{errors.slug}</span>}
            <span className="input-hint">/book/{form.slug || 'slug-del-libro'}</span>
          </div>

          {/* Precio + Stock + Género */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Precio (Bs.) *</label>
              <input
                className="input" type="number" min="0" step="0.01"
                value={form.price} onChange={e => set('price', e.target.value)}
              />
              {errors.price && <span className="input-error">{errors.price}</span>}
            </div>
            <div className="input-group">
              <label className="input-label">Stock *</label>
              <input
                className="input" type="number" min="0"
                value={form.stock} onChange={e => set('stock', e.target.value)}
              />
              {errors.stock && <span className="input-error">{errors.stock}</span>}
            </div>
            <div className="input-group">
              <label className="input-label">Género</label>
              <select className="select" value={form.genre_id} onChange={e => set('genre_id', e.target.value)}>
                <option value="">Sin género</option>
                {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div className="input-group">
            <label className="input-label">Descripción</label>
            <textarea
              className="textarea" rows={4}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Sinopsis del libro…"
            />
          </div>

          {/* Destacado */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
            <input
              type="checkbox" checked={form.featured}
              onChange={e => set('featured', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--jv-brown-700)' }}
            />
            <span style={{ fontWeight: 500 }}>Destacar en página principal</span>
          </label>

          {/* Error general */}
          {mutation.isError && (
            <div style={{
              background: 'var(--jv-error-bg)', color: 'var(--jv-error)',
              padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 13,
            }}>
              {mutation.error?.message || 'Error al guardar. Verifica que el slug sea único.'}
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={mutation.isPending || uploading}
            >
              {mutation.isPending
                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Guardando…</>
                : isEdit ? 'Guardar cambios' : 'Crear libro'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Confirm delete modal ───────────────────────────────────
function ConfirmDelete({ book, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false)
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal__header">
          <h2 className="modal__title" style={{ fontSize: 18 }}>Eliminar libro</h2>
          <button className="modal__close" onClick={onCancel}>✕</button>
        </div>
        <p style={{ color: 'var(--jv-ink-soft)', marginBottom: 24 }}>
          ¿Seguro que quieres eliminar <strong>"{book.title}"</strong>? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button
            className="btn btn-danger"
            disabled={loading}
            onClick={async () => { setLoading(true); await onConfirm(); setLoading(false) }}
          >
            {loading ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────
export default function AdminBooks() {
  const queryClient = useQueryClient()
  const [search,    setSearch]    = useState('')
  const [modal,     setModal]     = useState(null) // null | 'create' | book object
  const [delTarget, setDelTarget] = useState(null)

  const { data: books  = [], isLoading } = useQuery({ queryKey: ['admin-books'], queryFn: fetchAdminBooks })
  const { data: genres = [] }            = useQuery({ queryKey: ['genres'], queryFn: fetchGenres })

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(book) {
    const { error } = await supabase.from('books').delete().eq('id', book.id)
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['admin-books'] })
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
    }
    setDelTarget(null)
  }

  return (
    <AdminLayout title="Libros">

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Buscar por título o autor…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 240px' }}
        />
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          + Nuevo libro
        </button>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="loading-page"><span className="spinner" /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Portada</th>
                  <th>Título / Autor</th>
                  <th>Género</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Destacado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 28, color: 'var(--jv-ink-muted)' }}>
                      {search ? 'Sin resultados para esa búsqueda.' : 'No hay libros aún. ¡Crea el primero!'}
                    </td>
                  </tr>
                )}
                {filtered.map(book => (
                  <tr key={book.id}>
                    <td>
                      {book.cover_url ? (
                        <img
                          src={book.cover_url} alt={book.title}
                          style={{ width: 36, aspectRatio: '3/4', objectFit: 'cover', borderRadius: 4 }}
                        />
                      ) : (
                        <div style={{
                          width: 36, aspectRatio: '3/4', background: 'var(--jv-brown-100)',
                          borderRadius: 4, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 16,
                        }}>📖</div>
                      )}
                    </td>
                    <td>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{book.title}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--jv-ink-muted)' }}>{book.author}</p>
                    </td>
                    <td style={{ fontSize: 13 }}>{book.genres?.name || '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--jv-brown-700)' }}>
                      Bs. {Number(book.price).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${
                        book.stock === 0 ? 'badge-red'
                          : book.stock <= 5 ? 'badge-yellow'
                          : 'badge-green'
                      }`}>
                        {book.stock}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {book.featured ? '⭐' : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setModal(book)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--jv-error)' }}
                          onClick={() => setDelTarget(book)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      {modal && (
        <BookModal
          book={modal === 'create' ? null : modal}
          genres={genres}
          onClose={() => setModal(null)}
        />
      )}
      {delTarget && (
        <ConfirmDelete
          book={delTarget}
          onConfirm={() => handleDelete(delTarget)}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </AdminLayout>
  )
}