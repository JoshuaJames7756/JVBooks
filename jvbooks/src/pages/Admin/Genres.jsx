// src/pages/Admin/Genres.jsx
import { useState }  from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase }  from '../../lib/supabase'
import AdminLayout   from '../../components/AdminLayout'

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
}

async function fetchGenresWithCount() {
  const { data, error } = await supabase
    .from('genres')
    .select('id, name, slug, books(id)')
    .order('name')
  if (error) throw error
  return data.map(g => ({ ...g, bookCount: g.books?.length || 0 }))
}

export default function AdminGenres() {
  const queryClient = useQueryClient()
  const [name,     setName]     = useState('')
  const [slug,     setSlug]     = useState('')
  const [error,    setError]    = useState('')
  const [editId,   setEditId]   = useState(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')

  const { data: genres = [], isLoading } = useQuery({
    queryKey: ['admin-genres'],
    queryFn:  fetchGenresWithCount,
  })

  // Crear
  const createGenre = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('El nombre es requerido.')
      const { error } = await supabase.from('genres').insert({
        name: name.trim(),
        slug: slug || slugify(name.trim()),
      })
      if (error) throw new Error(error.message.includes('unique') ? 'Ese nombre o slug ya existe.' : error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-genres'] })
      queryClient.invalidateQueries({ queryKey: ['genres'] })
      setName(''); setSlug(''); setError('')
    },
    onError: (err) => setError(err.message),
  })

  // Editar
  const updateGenre = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('genres')
        .update({ name: editName.trim(), slug: editSlug.trim() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-genres'] })
      queryClient.invalidateQueries({ queryKey: ['genres'] })
      setEditId(null)
    },
  })

  // Eliminar
  const deleteGenre = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('genres').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-genres'] })
      queryClient.invalidateQueries({ queryKey: ['genres'] })
    },
  })

  return (
    <AdminLayout title="Géneros / Categorías">

      {/* Formulario crear */}
      <div className="card" style={{ marginBottom: 24, maxWidth: 480 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Nuevo género</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div className="input-group">
            <label className="input-label">Nombre *</label>
            <input
              className="input"
              placeholder="Ciencia ficción"
              value={name}
              onChange={e => {
                setName(e.target.value)
                setSlug(slugify(e.target.value))
                setError('')
              }}
              onKeyDown={e => e.key === 'Enter' && createGenre.mutate()}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Slug (URL)</label>
            <input
              className="input"
              placeholder="ciencia-ficcion"
              value={slug}
              onChange={e => setSlug(slugify(e.target.value))}
            />
          </div>
        </div>
        {error && <p className="input-error" style={{ marginBottom: 10 }}>{error}</p>}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => createGenre.mutate()}
          disabled={createGenre.isPending || !name.trim()}
        >
          {createGenre.isPending ? 'Creando…' : '+ Agregar género'}
        </button>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="loading-page"><span className="spinner" /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', maxWidth: 640 }}>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Slug</th>
                  <th>Libros</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {genres.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--jv-ink-muted)' }}>
                      No hay géneros. ¡Crea el primero!
                    </td>
                  </tr>
                )}
                {genres.map(g => (
                  <tr key={g.id}>
                    <td>
                      {editId === g.id ? (
                        <input
                          className="input"
                          value={editName}
                          onChange={e => { setEditName(e.target.value); setEditSlug(slugify(e.target.value)) }}
                          style={{ padding: '5px 10px', fontSize: 13 }}
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontWeight: 500 }}>{g.name}</span>
                      )}
                    </td>
                    <td>
                      {editId === g.id ? (
                        <input
                          className="input"
                          value={editSlug}
                          onChange={e => setEditSlug(slugify(e.target.value))}
                          style={{ padding: '5px 10px', fontSize: 13, fontFamily: 'monospace' }}
                        />
                      ) : (
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--jv-ink-muted)' }}>
                          {g.slug}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-gray">{g.bookCount}</span>
                    </td>
                    <td>
                      {editId === g.id ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => updateGenre.mutate(g.id)}
                            disabled={updateGenre.isPending}
                          >
                            Guardar
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => { setEditId(g.id); setEditName(g.name); setEditSlug(g.slug) }}
                          >
                            Editar
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--jv-error)' }}
                            disabled={g.bookCount > 0}
                            title={g.bookCount > 0 ? 'No se puede eliminar: tiene libros asignados' : ''}
                            onClick={() => {
                              if (confirm(`¿Eliminar el género "${g.name}"?`)) deleteGenre.mutate(g.id)
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p style={{ marginTop: 12, fontSize: 12, color: 'var(--jv-ink-muted)' }}>
        * Los géneros con libros asignados no se pueden eliminar directamente.
      </p>
    </AdminLayout>
  )
}