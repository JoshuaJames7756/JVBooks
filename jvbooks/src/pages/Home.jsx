// src/pages/Home.jsx
import { useQuery }      from '@tanstack/react-query'
import { Link }          from 'react-router-dom'
import { supabase }      from '../lib/supabase'
import { useCartStore }  from '../store/cartStore'

// ── Queries ────────────────────────────────────────────────
async function fetchFeatured() {
  const { data, error } = await supabase
    .from('books')
    .select('id, title, author, slug, price, stock, cover_url')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(8)
  if (error) throw error
  return data
}

async function fetchGenres() {
  const { data, error } = await supabase
    .from('genres')
    .select('id, name, slug')
    .order('name')
  if (error) throw error
  return data
}

async function fetchNewArrivals() {
  const { data, error } = await supabase
    .from('books')
    .select('id, title, author, slug, price, stock, cover_url')
    .order('created_at', { ascending: false })
    .limit(4)
  if (error) throw error
  return data
}

// ── Mini BookCard ──────────────────────────────────────────
function MiniCard({ book }) {
  const addItem = useCartStore(s => s.addItem)

  return (
    <Link to={`/book/${book.slug}`} className="book-card" style={{ textDecoration: 'none' }}>
      <div style={{ position: 'relative' }}>
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="book-card__cover" loading="lazy" />
        ) : (
          <div className="book-card__cover-placeholder">📖</div>
        )}
        {book.stock === 0 && (
          <span className="badge badge-red" style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 11 }}>
            Agotado
          </span>
        )}
        {book.stock > 0 && book.stock <= 3 && (
          <span className="badge badge-yellow" style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 11 }}>
            Últimos {book.stock}
          </span>
        )}
      </div>
      <div className="book-card__body">
        <p className="book-card__title">{book.title}</p>
        <p className="book-card__author">{book.author}</p>
        <div className="book-card__footer">
          <span className="book-card__price">Bs. {Number(book.price).toFixed(2)}</span>
          <button
            onClick={e => { e.preventDefault(); addItem(book) }}
            disabled={book.stock === 0}
            className="btn btn-primary btn-sm"
            style={{ padding: '5px 10px', fontSize: 11 }}
          >
            {book.stock === 0 ? 'Agotado' : '+ Carrito'}
          </button>
        </div>
      </div>
    </Link>
  )
}

// ── Sección con título + link ──────────────────────────────
function SectionHeader({ title, linkTo, linkLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
      <h2 style={{ margin: 0, fontSize: 26 }}>{title}</h2>
      {linkTo && (
        <Link to={linkTo} style={{ fontSize: 14, color: 'var(--jv-brown-600)', fontWeight: 500 }}>
          {linkLabel || 'Ver todos →'}
        </Link>
      )}
    </div>
  )
}

// ── Página ─────────────────────────────────────────────────
export default function Home() {
  const { data: featured    = [] } = useQuery({ queryKey: ['featured'],     queryFn: fetchFeatured    })
  const { data: genres      = [] } = useQuery({ queryKey: ['genres'],       queryFn: fetchGenres      })
  const { data: newArrivals = [] } = useQuery({ queryKey: ['new-arrivals'], queryFn: fetchNewArrivals })

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <p className="hero__eyebrow">JVSoftware · Tu librería online</p>
          <h1 style={{ maxWidth: 600 }}>
            Encuentra tu próxima gran lectura
          </h1>
          <p>
            Explora nuestro catálogo, guarda tus favoritos<br />
            y recibe tu pedido en la puerta de tu casa.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/catalog" className="btn btn-lg" style={{
              background: '#fff', color: 'var(--jv-brown-800)',
              fontWeight: 600,
            }}>
              Ver catálogo
            </Link>
            <Link to="/auth" className="btn btn-lg" style={{
              background: 'transparent',
              color: '#fff',
              border: '1.5px solid rgba(255,255,255,.5)',
            }}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* ── GÉNEROS (pills) ── */}
      {genres.length > 0 && (
        <section style={{
          background: 'var(--jv-ivory-dark)',
          borderBottom: '1px solid var(--jv-border)',
          padding: '20px 0',
        }}>
          <div className="container">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--jv-ink-muted)', marginRight: 4 }}>
                Géneros:
              </span>
              {genres.map(g => (
                <Link
                  key={g.id}
                  to={`/catalog?genre=${g.id}`}
                  style={{
                    display: 'inline-block',
                    padding: '5px 14px',
                    background: '#fff',
                    border: '1px solid var(--jv-border)',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 13,
                    color: 'var(--jv-brown-700)',
                    textDecoration: 'none',
                    transition: 'all var(--transition)',
                    fontWeight: 500,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--jv-brown-700)'
                    e.currentTarget.style.color = '#fff'
                    e.currentTarget.style.borderColor = 'var(--jv-brown-700)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#fff'
                    e.currentTarget.style.color = 'var(--jv-brown-700)'
                    e.currentTarget.style.borderColor = 'var(--jv-border)'
                  }}
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── DESTACADOS ── */}
      {featured.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionHeader title="⭐ Destacados" linkTo="/catalog" />
            <div className="books-grid">
              {featured.map(book => <MiniCard key={book.id} book={book} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── NUEVAS LLEGADAS ── */}
      {newArrivals.length > 0 && (
        <section className="section" style={{ background: 'var(--jv-brown-50)', paddingTop: 48, paddingBottom: 64 }}>
          <div className="container">
            <SectionHeader title="🆕 Nuevas llegadas" linkTo="/catalog" linkLabel="Ver catálogo →" />
            <div className="books-grid">
              {newArrivals.map(book => <MiniCard key={book.id} book={book} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── EMPTY STATE (sin libros aún) ── */}
      {featured.length === 0 && newArrivals.length === 0 && (
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <div className="empty-state__icon">📚</div>
              <p className="empty-state__title">El catálogo está vacío</p>
              <p>Pronto habrá libros disponibles. Vuelve en breve.</p>
              <Link to="/admin/books" className="btn btn-primary" style={{ marginTop: 20 }}>
                Agregar libros (Admin)
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── BANNER CTA ── */}
      <section style={{
        background: 'var(--jv-brown-800)',
        padding: '56px 0',
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#fff', marginBottom: 12 }}>
            ¿No encuentras lo que buscas?
          </h2>
          <p style={{ color: 'rgba(255,255,255,.7)', marginBottom: 28, maxWidth: 480, marginInline: 'auto' }}>
            Explora el catálogo completo con filtros por género, autor y precio.
          </p>
          <Link to="/catalog" className="btn btn-lg" style={{
            background: 'var(--jv-brown-400)',
            color: 'var(--jv-brown-900)',
            fontWeight: 600,
          }}>
            Explorar catálogo completo
          </Link>
        </div>
      </section>
    </>
  )
}