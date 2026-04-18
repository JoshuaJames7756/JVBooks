// src/pages/Catalog.jsx
import { useState }         from 'react'
import { useQuery }         from '@tanstack/react-query'
import { Link }             from 'react-router-dom'
import { supabase }         from '../lib/supabase'
import { useCartStore }     from '../store/cartStore'
import { useWishlistStore } from '../store/wishlistStore'
import { useAuthStore }     from '../store/authStore'

// ── Queries ────────────────────────────────────────────────
async function fetchGenres() {
  const { data, error } = await supabase
    .from('genres')
    .select('id, name')
    .order('name')
  if (error) throw error
  return data
}

async function fetchBooks({ search, genreId, sort }) {
  let query = supabase
    .from('books')
    .select('id, title, author, slug, price, stock, cover_url, genre_id')

  if (search)  query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`)
  if (genreId) query = query.eq('genre_id', genreId)

  if (sort === 'price_asc')  query = query.order('price', { ascending: true })
  if (sort === 'price_desc') query = query.order('price', { ascending: false })
  if (sort === 'newest')     query = query.order('created_at', { ascending: false })
  if (sort === 'title')      query = query.order('title', { ascending: true })

  const { data, error } = await query
  if (error) throw error
  return data
}

// ── BookCard ───────────────────────────────────────────────
function BookCard({ book }) {
  const addItem = useCartStore(s => s.addItem)
  const { user } = useAuthStore()
  const { toggleLocal, toggleRemote, localIds, remoteIds } = useWishlistStore()
  const wished = user ? remoteIds.includes(book.id) : localIds.includes(book.id)
  
  function handleWishlist(e) {
    e.preventDefault()
    user ? toggleRemote(user.id, book.id) : toggleLocal(book.id)
  }

  function handleAddToCart(e) {
    e.preventDefault()
    addItem(book)
  }

  return (
    <Link to={`/book/${book.slug}`} className="book-card" style={{ textDecoration: 'none' }}>
      <div style={{ position: 'relative' }}>
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="book-card__cover" loading="lazy" />
        ) : (
          <div className="book-card__cover-placeholder">📖</div>
        )}

        <button
          onClick={handleWishlist}
          style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(255,255,255,.88)', border: 'none',
            borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 15,
          }}
          aria-label={wished ? 'Quitar de wishlist' : 'Agregar a wishlist'}
        >
          {wished ? '❤️' : '🤍'}
        </button>

        {book.stock > 0 && book.stock <= 3 && (
          <span className="badge badge-yellow" style={{ position: 'absolute', bottom: 8, left: 8 }}>
            ¡Últimos {book.stock}!
          </span>
        )}
        {book.stock === 0 && (
          <span className="badge badge-red" style={{ position: 'absolute', bottom: 8, left: 8 }}>
            Agotado
          </span>
        )}
      </div>

      <div className="book-card__body">
        <p className="book-card__title">{book.title}</p>
        <p className="book-card__author">{book.author}</p>
        <div className="book-card__footer">
          <span className="book-card__price">Bs. {Number(book.price).toFixed(2)}</span>
          <button
            onClick={handleAddToCart}
            disabled={book.stock === 0}
            className="btn btn-primary btn-sm"
            style={{ padding: '5px 12px', fontSize: 12 }}
          >
            {book.stock === 0 ? 'Agotado' : '+ Carrito'}
          </button>
        </div>
      </div>
    </Link>
  )
}

// ── Página ─────────────────────────────────────────────────
export default function Catalog() {
  const [search,          setSearch]          = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [genreId,         setGenreId]         = useState('')
  const [sort,            setSort]            = useState('newest')

  function handleSearch(e) {
    const val = e.target.value
    setSearch(val)
    clearTimeout(window._searchTimer)
    window._searchTimer = setTimeout(() => setDebouncedSearch(val), 350)
  }

  function clearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setGenreId('')
    setSort('newest')
  }

  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn:  fetchGenres,
  })

  const { data: books = [], isLoading, isError } = useQuery({
    queryKey: ['books', debouncedSearch, genreId, sort],
    queryFn:  () => fetchBooks({ search: debouncedSearch, genreId, sort }),
  })

  const hasFilters = debouncedSearch || genreId || sort !== 'newest'

  return (
    <div className="container section">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ marginBottom: 4 }}>Catálogo</h2>
        <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
          {isLoading
            ? 'Cargando…'
            : `${books.length} libro${books.length !== 1 ? 's' : ''} encontrado${books.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32, alignItems: 'center' }}>
        <input
          className="input"
          type="search"
          placeholder="Buscar por título o autor…"
          value={search}
          onChange={handleSearch}
          style={{ flex: '1 1 240px', minWidth: 200 }}
        />
        <select
          className="select"
          value={genreId}
          onChange={e => setGenreId(e.target.value)}
          style={{ flex: '0 1 180px' }}
        >
          <option value="">Todos los géneros</option>
          {genres.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <select
          className="select"
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={{ flex: '0 1 200px' }}
        >
          <option value="newest">Más recientes</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
          <option value="title">Título A–Z</option>
        </select>
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            Limpiar ✕
          </button>
        )}
      </div>

      {/* Contenido */}
      {isLoading && (
        <div className="loading-page"><span className="spinner" /></div>
      )}

      {isError && (
        <div className="empty-state">
          <div className="empty-state__icon">⚠️</div>
          <p className="empty-state__title">Error al cargar los libros</p>
          <p>Intenta recargar la página.</p>
        </div>
      )}

      {!isLoading && !isError && books.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <p className="empty-state__title">Sin resultados</p>
          <p>Intenta con otros filtros o una búsqueda diferente.</p>
          <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={clearFilters}>
            Ver todos los libros
          </button>
        </div>
      )}

      {!isLoading && !isError && books.length > 0 && (
        <div className="books-grid">
          {books.map(book => <BookCard key={book.id} book={book} />)}
        </div>
      )}

    </div>
  )
}