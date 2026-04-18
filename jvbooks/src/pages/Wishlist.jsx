// src/pages/Wishlist.jsx
import { useQuery }          from '@tanstack/react-query'
import { Link }              from 'react-router-dom'
import { supabase }          from '../lib/supabase'
import { useWishlistStore }  from '../store/wishlistStore'
import { useCartStore }      from '../store/cartStore'
import { useAuthStore }      from '../store/authStore'

// ── Query: wishlist remota (usuario autenticado) ────────────
async function fetchWishlistBooks(userId) {
  const { data, error } = await supabase
    .from('wishlist')
    .select('book_id, books(id, title, author, slug, price, stock, cover_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(row => row.books)
}

// ── Query: libros por IDs (usuario invitado) ────────────────
async function fetchBooksByIds(ids) {
  if (!ids.length) return []
  const { data, error } = await supabase
    .from('books')
    .select('id, title, author, slug, price, stock, cover_url')
    .in('id', ids)
  if (error) throw error
  return data
}

// ── Card de libro en wishlist ──────────────────────────────
function WishlistCard({ book, onRemove }) {
  const addItem = useCartStore(s => s.addItem)

  return (
    <div className="card card-hover" style={{
      display: 'grid',
      gridTemplateColumns: '72px 1fr auto',
      gap: 16, alignItems: 'center', padding: '16px 20px',
    }}>
      {/* Portada */}
      <Link to={`/book/${book.slug}`}>
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            style={{ width: 72, aspectRatio: '3/4', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
          />
        ) : (
          <div style={{
            width: 72, aspectRatio: '3/4', background: 'var(--jv-brown-100)',
            borderRadius: 'var(--radius-sm)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>
            📖
          </div>
        )}
      </Link>

      {/* Info */}
      <div>
        <Link
          to={`/book/${book.slug}`}
          style={{
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16,
            color: 'var(--jv-brown-800)', textDecoration: 'none',
            display: 'block', marginBottom: 2,
          }}
        >
          {book.title}
        </Link>
        <p style={{ fontSize: 13, color: 'var(--jv-ink-muted)', margin: '0 0 10px' }}>
          {book.author}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 18, color: 'var(--jv-brown-700)',
          }}>
            Bs. {Number(book.price).toFixed(2)}
          </span>
          {book.stock === 0
            ? <span className="badge badge-red">Agotado</span>
            : book.stock <= 3
              ? <span className="badge badge-yellow">Últimos {book.stock}</span>
              : <span className="badge badge-green">En stock</span>
          }
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
        <button
          className="btn btn-primary btn-sm"
          disabled={book.stock === 0}
          onClick={() => addItem(book)}
        >
          {book.stock === 0 ? 'Agotado' : '+ Carrito'}
        </button>
        <button
          onClick={() => onRemove(book.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--jv-ink-muted)',
            textDecoration: 'underline', padding: 0,
          }}
        >
          Quitar
        </button>
      </div>
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────
export default function Wishlist() {
  const { user }  = useAuthStore()
  const { localIds, toggleLocal, toggleRemote } = useWishlistStore()

  // Wishlist autenticado
  const { data: remoteBooks = [], isLoading: loadingRemote, refetch } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn:  () => fetchWishlistBooks(user.id),
    enabled:  !!user,
  })

  // Wishlist invitado
  const { data: localBooks = [], isLoading: loadingLocal } = useQuery({
    queryKey: ['wishlist-local', localIds],
    queryFn:  () => fetchBooksByIds(localIds),
    enabled:  !user && localIds.length > 0,
  })

  const books    = user ? remoteBooks : localBooks
  const isLoading = user ? loadingRemote : loadingLocal

  async function handleRemove(bookId) {
    try {
      if (user) {
        await toggleRemote(user.id, bookId)
        refetch()
      } else {
        toggleLocal(bookId)
      }
    } catch (error) {
      console.error('Error al remover de wishlist:', error.message)
      alert('Error: ' + error.message)
    }
  }

  return (
    <div className="container section">
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 4 }}>Mi Wishlist</h2>
        {!isLoading && (
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            {books.length} libro{books.length !== 1 ? 's' : ''} guardado{books.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Aviso para invitados */}
      {!user && (
        <div style={{
          background: 'var(--jv-brown-100)',
          border: '1px solid var(--jv-brown-200)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px', marginBottom: 24,
          fontSize: 14, color: 'var(--jv-ink-soft)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>💡</span>
          <span>
            <Link to="/auth" style={{ color: 'var(--jv-brown-700)', fontWeight: 500 }}>
              Inicia sesión
            </Link>{' '}
            para sincronizar tu wishlist entre dispositivos.
          </span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="loading-page"><span className="spinner" /></div>
      )}

      {/* Empty */}
      {!isLoading && books.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">🤍</div>
          <p className="empty-state__title">Tu wishlist está vacía</p>
          <p>Guarda los libros que te interesan para encontrarlos fácilmente.</p>
          <Link to="/catalog" className="btn btn-primary" style={{ marginTop: 20 }}>
            Explorar catálogo
          </Link>
        </div>
      )}

      {/* Lista */}
      {!isLoading && books.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {books.map(book => (
            <WishlistCard key={book.id} book={book} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  )
}