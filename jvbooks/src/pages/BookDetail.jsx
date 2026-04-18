// src/pages/BookDetail.jsx
import { useState }         from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase }         from '../lib/supabase'
import { useCartStore }     from '../store/cartStore'
import { useWishlistStore } from '../store/wishlistStore'
import { useAuthStore }     from '../store/authStore'

// ── Queries ────────────────────────────────────────────────
async function fetchBook(slug) {
  const { data, error } = await supabase
    .from('books')
    .select('*, genres(name)')
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data
}

async function fetchReviews(bookId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(full_name, avatar_url)')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

async function fetchRelated(genreId, excludeId) {
  const { data, error } = await supabase
    .from('books')
    .select('id, title, author, slug, price, cover_url')
    .eq('genre_id', genreId)
    .neq('id', excludeId)
    .limit(4)
  if (error) throw error
  return data
}

// ── Estrellas ──────────────────────────────────────────────
function Stars({ rating, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0)
  const display = interactive ? (hovered || rating) : rating

  return (
    <span className="stars" style={{ cursor: interactive ? 'pointer' : 'default' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          style={{ color: n <= display ? '#d4a017' : '#d1c4b0', fontSize: 18 }}
          onClick={() => interactive && onRate?.(n)}
          onMouseEnter={() => interactive && setHovered(n)}
          onMouseLeave={() => interactive && setHovered(0)}
        >
          ★
        </span>
      ))}
    </span>
  )
}

// ── Componente de reseñas ──────────────────────────────────
function ReviewSection({ bookId }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [rating,  setRating]  = useState(0)
  const [comment, setComment] = useState('')
  const [error,   setError]   = useState('')

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', bookId],
    queryFn:  () => fetchReviews(bookId),
  })

  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const alreadyReviewed = reviews.some(r => r.profiles?.id === user?.id ||
    (user && r.user_id === user.id))

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('reviews').insert({
        book_id: bookId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews', bookId])
      setRating(0)
      setComment('')
      setError('')
    },
    onError: (err) => setError(err.message),
  })

  function handleSubmit() {
    if (!rating) { setError('Selecciona una calificación.'); return }
    setError('')
    mutation.mutate()
  }

  return (
    <section style={{ marginTop: 48 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
        <h3 style={{ margin: 0 }}>Reseñas</h3>
        {avgRating && (
          <span style={{ fontSize: 14, color: 'var(--jv-ink-muted)' }}>
            ★ {avgRating} · {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Formulario nueva reseña */}
      {user && !alreadyReviewed && (
        <div className="card" style={{ marginBottom: 28 }}>
          <h4 style={{ marginBottom: 16, fontSize: 16 }}>Tu reseña</h4>
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 500, color: 'var(--jv-ink-soft)' }}>
              Calificación
            </p>
            <Stars rating={rating} interactive onRate={setRating} />
          </div>
          <textarea
            className="textarea"
            rows={3}
            placeholder="Cuéntanos qué te pareció el libro… (opcional)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          {error && <p className="input-error" style={{ marginBottom: 8 }}>{error}</p>}
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Enviando…' : 'Publicar reseña'}
          </button>
        </div>
      )}

      {!user && (
        <div style={{
          background: 'var(--jv-brown-50)', border: '1px solid var(--jv-border)',
          borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 24,
          fontSize: 14, color: 'var(--jv-ink-soft)',
        }}>
          <Link to="/auth" style={{ color: 'var(--jv-brown-700)', fontWeight: 500 }}>
            Inicia sesión
          </Link>{' '}
          para dejar tu reseña.
        </div>
      )}

      {/* Lista de reseñas */}
      {isLoading && <div className="loading-page" style={{ minHeight: 80 }}><span className="spinner" /></div>}

      {!isLoading && reviews.length === 0 && (
        <p style={{ color: 'var(--jv-ink-muted)', fontSize: 14 }}>
          Aún no hay reseñas. ¡Sé el primero!
        </p>
      )}

      {reviews.map(review => (
        <div
          key={review.id}
          style={{
            paddingBlock: 16,
            borderBottom: '1px solid var(--jv-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--jv-brown-200)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, color: 'var(--jv-brown-700)',
              flexShrink: 0,
            }}>
              {(review.profiles?.full_name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--jv-ink)' }}>
                {review.profiles?.full_name || 'Usuario'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <Stars rating={review.rating} />
                <span style={{ fontSize: 12, color: 'var(--jv-ink-muted)' }}>
                  {new Date(review.created_at).toLocaleDateString('es-BO', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
          {review.comment && (
            <p style={{ margin: 0, fontSize: 14, color: 'var(--jv-ink-soft)', paddingLeft: 42 }}>
              {review.comment}
            </p>
          )}
        </div>
      ))}
    </section>
  )
}

// ── Página principal ───────────────────────────────────────
export default function BookDetail() {
  const { slug }   = useParams()
  const navigate   = useNavigate()
  const [qty, setQty] = useState(1)

  const addItem  = useCartStore(s => s.addItem)
  const { user } = useAuthStore()
  const { toggleLocal, toggleRemote, localIds, remoteIds } = useWishlistStore()

  const { data: book, isLoading, isError } = useQuery({
    queryKey: ['book', slug],
    queryFn:  () => fetchBook(slug),
  })

  const { data: related = [] } = useQuery({
    queryKey: ['related', book?.genre_id, book?.id],
    queryFn:  () => fetchRelated(book.genre_id, book.id),
    enabled:  !!book?.genre_id,
  })

  if (isLoading) return <div className="loading-page"><span className="spinner" /></div>

  if (isError || !book) return (
    <div className="container section">
      <div className="empty-state">
        <div className="empty-state__icon">😕</div>
        <p className="empty-state__title">Libro no encontrado</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/catalog')}>
          Volver al catálogo
        </button>
      </div>
    </div>
  )

  const wished = user ? remoteIds.includes(book.id) : localIds.includes(book.id)

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) addItem(book)
    navigate('/cart')
  }

  function handleWishlist() {
    user ? toggleRemote(user.id, book.id) : toggleLocal(book.id)
  }

  // Stock status
  const stockStatus = book.stock === 0 ? 'empty'
    : book.stock <= 3 ? 'low'
    : 'ok'

  return (
    <div className="container section">

      {/* Breadcrumb */}
      <nav style={{ fontSize: 13, color: 'var(--jv-ink-muted)', marginBottom: 28 }}>
        <Link to="/catalog" style={{ color: 'var(--jv-brown-600)' }}>Catálogo</Link>
        {' / '}
        {book.genres?.name && (
          <>
            <span>{book.genres.name}</span>
            {' / '}
          </>
        )}
        <span style={{ color: 'var(--jv-ink)' }}>{book.title}</span>
      </nav>

      {/* Layout principal */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(200px, 300px) 1fr',
        gap: 48, alignItems: 'start',
      }}>

        {/* Portada */}
        <div>
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              style={{
                width: '100%', borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
              }}
            />
          ) : (
            <div style={{
              aspectRatio: '3/4', background: 'var(--jv-brown-100)',
              borderRadius: 'var(--radius-lg)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 64, color: 'var(--jv-brown-400)',
            }}>
              📖
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {book.genres?.name && (
            <span className="badge badge-brown" style={{ marginBottom: 12, display: 'inline-block' }}>
              {book.genres.name}
            </span>
          )}

          <h1 style={{ marginBottom: 8 }}>{book.title}</h1>
          <p style={{ fontSize: 18, color: 'var(--jv-ink-muted)', margin: '0 0 24px' }}>
            {book.author}
          </p>

          {/* Precio */}
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--jv-brown-700)' }}>
              Bs. {Number(book.price).toFixed(2)}
            </span>
          </div>

          {/* Stock */}
          <p style={{ marginBottom: 24, fontSize: 14 }}>
            {stockStatus === 'ok' && (
              <span className="stock-ok">✓ En stock ({book.stock} disponibles)</span>
            )}
            {stockStatus === 'low' && (
              <span className="stock-low">⚠ Últimas {book.stock} unidades</span>
            )}
            {stockStatus === 'empty' && (
              <span className="stock-empty">✗ Agotado</span>
            )}
          </p>

          {/* Cantidad + Agregar */}
          {book.stock > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: '1.5px solid var(--jv-border)', borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{
                    width: 36, height: 40, border: 'none', background: 'var(--jv-brown-50)',
                    cursor: 'pointer', fontSize: 18, color: 'var(--jv-ink-soft)',
                  }}
                >−</button>
                <span style={{
                  width: 44, textAlign: 'center', fontSize: 15,
                  fontWeight: 500, color: 'var(--jv-ink)',
                }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty(q => Math.min(book.stock, q + 1))}
                  style={{
                    width: 36, height: 40, border: 'none', background: 'var(--jv-brown-50)',
                    cursor: 'pointer', fontSize: 18, color: 'var(--jv-ink-soft)',
                  }}
                >+</button>
              </div>

              <button className="btn btn-primary btn-lg" onClick={handleAddToCart} style={{ flex: 1 }}>
                🛒 Agregar al carrito
              </button>
            </div>
          )}

          {/* Wishlist */}
          <button
            className="btn btn-ghost"
            onClick={handleWishlist}
            style={{ marginBottom: 28 }}
          >
            {wished ? '❤️ En tu wishlist' : '🤍 Guardar en wishlist'}
          </button>

          {/* Descripción */}
          {book.description && (
            <div style={{ borderTop: '1px solid var(--jv-border)', paddingTop: 24 }}>
              <h3 style={{ fontSize: 17, marginBottom: 12 }}>Descripción</h3>
              <p style={{ lineHeight: 1.75, color: 'var(--jv-ink-soft)', whiteSpace: 'pre-line' }}>
                {book.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reseñas */}
      <ReviewSection bookId={book.id} />

      {/* Libros relacionados */}
      {related.length > 0 && (
        <section style={{ marginTop: 56 }}>
          <h3 style={{ marginBottom: 24 }}>También te puede gustar</h3>
          <div className="books-grid">
            {related.map(r => (
              <Link key={r.id} to={`/book/${r.slug}`} className="book-card" style={{ textDecoration: 'none' }}>
                {r.cover_url ? (
                  <img src={r.cover_url} alt={r.title} className="book-card__cover" loading="lazy" />
                ) : (
                  <div className="book-card__cover-placeholder">📖</div>
                )}
                <div className="book-card__body">
                  <p className="book-card__title">{r.title}</p>
                  <p className="book-card__author">{r.author}</p>
                  <div className="book-card__footer">
                    <span className="book-card__price">Bs. {Number(r.price).toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}